import { NextRequest, NextResponse } from "next/server";
import { isAuthorized, getDb, unauthorized, firebaseConfigured } from "@/lib/adminApi";
import { normalizeSlugPath } from "@/lib/pageContent";
import { seedPages } from "@/lib/admin/pages";
import type { BlockRecord, PageRecord } from "@/lib/admin/pages";

/**
 * GET /api/admin/inspect?slug=/some-page
 *
 * Returns a compact summary of a page's block structure and data source.
 * Designed for Claude Code to quickly understand what's on a page
 * without reading seed files or taking screenshots.
 */

function summarizeBlock(block: BlockRecord): Record<string, unknown> {
  const summary: Record<string, unknown> = {
    id: block.id,
    type: block.type,
  };

  if (block.adminLabel) summary.adminLabel = block.adminLabel;

  switch (block.type) {
    case "hero":
    case "thirds":
      summary.title = block.title;
      summary.alignment = block.alignment;
      summary.mode = block.mode;
      if (block.primaryCtaLabel) summary.cta = block.primaryCtaLabel;
      break;
    case "story":
      summary.heading = block.heading;
      summary.variant = block.variant;
      if (block.sections?.length) summary.sectionCount = block.sections.length;
      break;
    case "split":
      summary.heading = block.heading;
      summary.mediaSide = block.mediaSide;
      if (block.ctaLabel) summary.cta = block.ctaLabel;
      break;
    case "animated_headline":
      summary.headline = block.headline;
      summary.animationStyle = block.animationStyle;
      break;
    case "features":
    case "scroll_gallery":
    case "feature_spotlight":
      summary.heading = block.heading;
      summary.itemCount = block.items?.length ?? 0;
      if (block.type === "features" && "variant" in block) summary.variant = (block as any).variant;
      break;
    case "stats":
      summary.heading = block.heading;
      summary.itemCount = block.items?.length ?? 0;
      summary.variant = block.variant;
      break;
    case "comparison":
      summary.heading = block.heading;
      break;
    case "showcase":
      summary.typeFilter = block.typeFilter;
      summary.industryFilter = block.industryFilter;
      break;
    case "logos":
      summary.heading = block.heading;
      break;
    case "contact":
      summary.heading = block.heading;
      break;
    case "article_featured":
    case "article_grid":
      summary.tagFilter = block.tagFilter;
      break;
    case "divider":
      summary.width = block.width;
      break;
  }

  if (block.enableDarkModeOnScroll) summary.darkMode = true;

  return summary;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const slug = request.nextUrl.searchParams.get("slug");
  const id = request.nextUrl.searchParams.get("id");

  if (!slug && !id) {
    return NextResponse.json(
      { error: "Provide ?slug=/path or ?id=pageId" },
      { status: 400 }
    );
  }

  let source: "firestore" | "seed" | "not_found" = "not_found";
  let page: PageRecord | null = null;

  // Try Firestore first
  if (firebaseConfigured()) {
    try {
      const db = getDb();
      if (id) {
        const doc = await db.collection("pages").doc(id).get();
        if (doc.exists) {
          page = { id: doc.id, ...doc.data() } as PageRecord;
          source = "firestore";
        }
      } else if (slug) {
        const normalized = normalizeSlugPath(slug);
        const snapshot = await db
          .collection("pages")
          .where("slug", "==", normalized)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          page = { id: doc.id, ...doc.data() } as PageRecord;
          source = "firestore";
        } else {
          // Try without leading slash
          const withoutLeading = normalized.startsWith("/") ? normalized.slice(1) : normalized;
          const altSnapshot = await db
            .collection("pages")
            .where("slug", "==", withoutLeading)
            .limit(1)
            .get();
          if (!altSnapshot.empty) {
            const doc = altSnapshot.docs[0];
            page = { id: doc.id, ...doc.data() } as PageRecord;
            source = "firestore";
          }
        }
      }
    } catch (error) {
      console.error("Inspect: Firestore query failed, falling back to seed", error);
    }
  }

  // Fallback to seed data
  if (!page) {
    const normalized = slug ? normalizeSlugPath(slug) : null;
    const seedPage = id
      ? seedPages.find((p) => p.id === id)
      : seedPages.find((p) => normalizeSlugPath(p.slug) === normalized);

    if (seedPage) {
      page = seedPage;
      source = "seed";
    }
  }

  if (!page) {
    return NextResponse.json({
      source: "not_found",
      slug: slug ?? id,
      error: "Page not found in Firestore or seed data"
    }, { status: 404 });
  }

  const blocks = page.blocks ?? [];
  const blockSummary = blocks.map(summarizeBlock);
  const blockTypes = blocks.map((b) => b.type);

  const warnings: string[] = [];
  const effectiveStatus = page.status ?? "draft";
  if (effectiveStatus !== "published") {
    warnings.push(`Page status is "${effectiveStatus}" — it will NOT render on the public site. Set status to "published" to make it visible.`);
  }
  if (source === "seed" && !page.status) {
    warnings.push(`Seed data is missing a "status" field — defaults to "draft". Add status: "published" to the seed entry.`);
  }

  return NextResponse.json({
    source,
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: effectiveStatus,
      updatedAt: page.updatedAt,
    },
    ...(warnings.length ? { warnings } : {}),
    blockCount: blocks.length,
    blockSequence: blockTypes.join(" → "),
    blocks: blockSummary,
  });
}
