import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { renderArticleAnnouncementEmail, renderArticleAnnouncementText } from "@/lib/articleAnnouncementEmail";
import { getGhostPostById } from "@/lib/ghost";
import { backfillMarketingSegment, getMarketingSegmentId } from "@/lib/resendMarketing";

export const runtime = "nodejs";

type GhostWebhookTag = {
  name?: unknown;
  slug?: unknown;
  visibility?: unknown;
};

type GhostWebhookPost = {
  id?: unknown;
  tags?: unknown;
};

const webhookPostCandidates = (payload: Record<string, unknown>): GhostWebhookPost[] => {
  const post = payload.post as Record<string, unknown> | undefined;
  const data = payload.data as Record<string, unknown> | undefined;
  const nestedPost = data?.post as Record<string, unknown> | undefined;
  return [post?.current, post, nestedPost?.current, nestedPost].filter(
    (candidate): candidate is GhostWebhookPost => !!candidate && typeof candidate === "object"
  );
};

const getWebhookPost = (payload: Record<string, unknown>): GhostWebhookPost | null =>
  webhookPostCandidates(payload).find((post) => typeof post.id === "string") ?? null;

const isEmailTagged = (post: GhostWebhookPost): boolean => {
  if (!Array.isArray(post.tags)) return false;
  return post.tags.some((tag) => {
    if (!tag || typeof tag !== "object") return false;
    const { name, slug, visibility } = tag as GhostWebhookTag;
    return (name === "#email" || slug === "hash-email") && visibility === "internal";
  });
};

const isValidSignature = (rawBody: string, signatureHeader: string | null, secret: string): boolean => {
  if (!signatureHeader) return false;

  const values = Object.fromEntries(
    signatureHeader.split(",").map((entry) => {
      const [key, ...rest] = entry.trim().split("=");
      return [key, rest.join("=")];
    })
  );
  const signature = values.sha256;
  const timestamp = values.t;
  if (!signature || !timestamp || !/^\d+$/.test(timestamp)) return false;

  const age = Math.abs(Date.now() - Number(timestamp));
  if (age > 1000 * 60 * 5) return false;

  const input = `${rawBody}${timestamp}`;
  const expected = createHmac("sha256", secret).update(input).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};

const getArticleUrl = (slug: string) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://studiotak.co";
  const url = new URL(`/learn/${encodeURIComponent(slug)}`, siteUrl);
  url.searchParams.set("utm_source", "resend");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", "article_announcement");
  return url.toString();
};

const getBroadcastName = (title: string) => `Ghost article · ${title}`.slice(0, 70);

export async function POST(request: Request) {
  const webhookSecret = process.env.GHOST_ARTICLE_EMAIL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Ghost article email webhook is not configured: GHOST_ARTICLE_EMAIL_WEBHOOK_SECRET is missing.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!isValidSignature(rawBody, request.headers.get("x-ghost-signature"), webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const webhookPost = getWebhookPost(payload);
  if (!webhookPost || typeof webhookPost.id !== "string") {
    return NextResponse.json({ error: "A post ID is required." }, { status: 400 });
  }

  if (!isEmailTagged(webhookPost)) {
    return NextResponse.json({ ok: true, skipped: "post is not tagged #email" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_MARKETING_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.error("Ghost article email webhook is not configured for Resend.", {
      apiKey: !!apiKey,
      fromEmail: !!fromEmail
    });
    return NextResponse.json({ error: "Marketing email is not configured." }, { status: 503 });
  }

  const segmentId = await getMarketingSegmentId(apiKey);
  if (!segmentId) {
    return NextResponse.json({ error: "Marketing segment is not configured." }, { status: 503 });
  }
  if (!(await backfillMarketingSegment(apiKey, segmentId))) {
    return NextResponse.json({ error: "Marketing segment could not be backfilled." }, { status: 503 });
  }

  const post = await getGhostPostById(webhookPost.id);
  if (!post) {
    console.error("Ghost article email webhook could not load the published post.", { postId: webhookPost.id });
    return NextResponse.json({ error: "Published post could not be loaded." }, { status: 502 });
  }

  const articleUrl = getArticleUrl(post.slug);
  const intro = post.excerpt?.trim() || "A fresh article from Studio Tak, worth a few minutes of your attention.";
  const html = renderArticleAnnouncementEmail({
    title: post.title,
    intro,
    articleUrl,
    imageUrl: post.feature_image,
    imageAlt: post.feature_image_alt
  });
  const text = renderArticleAnnouncementText({ title: post.title, intro, articleUrl });

  const response = await fetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "studio-tak-website/ghost-article-email"
    },
    body: JSON.stringify({
      name: getBroadcastName(post.title),
      segment_id: segmentId,
      from: fromEmail,
      subject: `New: ${post.title}`,
      html,
      text,
      send: false
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    console.error("Resend rejected the Ghost article broadcast draft.", {
      postId: post.id,
      status: response.status,
      response: (await response.text()).slice(0, 1000)
    });
    return NextResponse.json({ error: "Broadcast draft could not be created." }, { status: 502 });
  }

  const broadcast = (await response.json()) as { id?: string };
  return NextResponse.json({ ok: true, broadcastId: broadcast.id ?? null, postId: post.id });
}
