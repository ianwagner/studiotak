"use client";

import Link from "next/link";

type ComponentEntry = {
  id: string;
  title: string;
  summary: string;
  fields: string[];
  usage: string;
};

const componentEntries: ComponentEntry[] = [
  {
    id: "hero",
    title: "Hero",
    summary: "Above-the-fold hero with optional media and two CTAs.",
    fields: ["Eyebrow", "Title + subtitle", "Primary / secondary CTA", "Media or background image/video", "Alignment: centered, image left/right"],
    usage: "Best for the first block on a page. Backgrounds support gradient overlay; use media for inline image/video."
  },
  {
    id: "thirds",
    title: "Thirds",
    summary: "Hero-like layout with a shorter height and the same CTA/media options.",
    fields: ["Eyebrow", "Title + subtitle", "Primary / secondary CTA", "Media or background image/video", "Layout: Left or Centered"],
    usage: "Great for mid-page intros or CTA banners when you want the hero look without a full viewport height."
  },
  {
    id: "divider",
    title: "Divider",
    summary: "Ghost-style horizontal rule for subtle section breaks.",
    fields: ["Optional anchor", "Optional dark mode toggle"],
    usage: "Use between major sections to give the page a quiet visual pause."
  },
  {
    id: "story",
    title: "Story",
    summary: "Multi-column story block with optional media and sections.",
    fields: ["Heading + body copy", "Variant: single, two-column, or split with quote", "Optional media", "Sections list (title + body)"],
    usage: "Use for process, approach, or case study sections. Two-column pairs copy with media; split adds a quote-style intro."
  },
  {
    id: "features",
    title: "Features",
    summary: "Card grid for capabilities or highlights.",
    fields: ["Eyebrow + heading + kicker", "Columns (1-4)", "Feature items: title, description, badge, optional link"],
    usage: "Pair with hero/story for capability lists. Keep copy concise; badges can flag status like New or Beta."
  },
  {
    id: "logos",
    title: "Logos",
    summary: "Step-and-repeat logo wall sourced from the media library.",
    fields: ["Eyebrow + headline", "Max logos (1-20)", "Pulls media with type: Logo"],
    usage: "Use for social proof. Upload media items tagged as Logo to auto-populate a looping marquee."
  },
  {
    id: "scroll_gallery",
    title: "Scroll gallery",
    summary: "Full-bleed, full-height horizontal track of cards.",
    fields: ["Eyebrow + headline + kicker", "Cards sourced from components or written per page", "Optional badges, links, tags"],
    usage: "Use for cinematic, swipeable showcases. Best for work highlights or capability reels that should feel like a hero."
  },
  {
    id: "showcase",
    title: "Showcase",
    summary: "Overlapping stack of media pulled straight from the Media library.",
    fields: ["Type filter", "Optional industry filter", "Result limit", "Animation preset"],
    usage: "Great for mood boards or quick reels of work—no captions, just visuals in a messy horizontal stack."
  },
  {
    id: "contact",
    title: "Contact",
    summary: "Two-column layout pairing the Resend contact form with optional media.",
    fields: ["Eyebrow + heading + body copy", "Anchor ID for #contact links", "Sitewide Resend lead capture", "Optional media"],
    usage: "Use for lead capture or inquiries. Drop near the end of a page so CTAs can jump visitors into the form."
  }
];

export function ComponentsCatalog() {
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card" style={{ padding: 12 }}>
        <h1 style={{ margin: "0 0 6px" }}>Components</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Reference the reusable building blocks. Manage feature components in <Link href="/admin/components">Components</Link> and drop
          them into blocks inside <Link href="/admin/pages">Pages</Link>.
        </p>
      </div>

      <div className="grid" style={{ gap: 12 }}>
        {componentEntries.map((entry) => (
          <div key={entry.id} className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div>
              <span className="tag" style={{ marginBottom: 6 }}>
                {entry.id}
              </span>
              <h3 style={{ margin: "0 0 4px" }}>{entry.title}</h3>
              <p style={{ margin: 0, color: "var(--muted)" }}>{entry.summary}</p>
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <strong style={{ fontSize: 13, letterSpacing: "0.02em", color: "var(--muted)" }}>Key fields</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {entry.fields.map((field) => (
                  <span key={field} className="badge">
                    {field}
                  </span>
                ))}
              </div>
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>{entry.usage}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Extend the library</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          To add a new block type, update the shape in <code>lib/admin/pages.ts</code>, render it in{" "}
          <code>components/sections/BlocksRenderer.tsx</code>, and add form controls in <code>components/admin/PageForm.tsx</code>.
        </p>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Seed content for new blocks can live in <code>lib/admin/pages.ts</code>. Duplicate one of the entries above and adjust the
          fields to match your component.
        </p>
      </div>
    </div>
  );
}
