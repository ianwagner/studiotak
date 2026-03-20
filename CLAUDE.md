# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

No test suite is configured.

## Architecture

**Next.js 14 App Router** site for Studio Tak with a **Refine.dev admin panel**, **Firestore** as the data layer, and **Ghost CMS** for blog content.

### Data Flow

Pages are stored in Firestore as documents with a `blocks` array. Each block defines a section type (hero, thirds, split, features, etc.). Components (reusable feature items) are stored separately and merged into blocks at render time via `lib/pageContent.ts`. When Firebase is unavailable, seed data from `lib/admin/pages.ts` and `lib/admin/components.ts` is used as fallback.

Ghost CMS provides blog/article content at `/learn/`. Articles are fetched via the Ghost Content API (`lib/ghost.ts`) and rendered with `dangerouslySetInnerHTML`. Each article page includes a Campfire CTA and related posts section at the bottom — the CTA destination is determined by Ghost tags on the article (see "Learn Page SEO & Campfire Linking" below).

### Routing

- `/` — Home page (`app/page.tsx`)
- `/learn/` — Ghost CMS article listing with tag filtering
- `/learn/[slug]/` — Individual Ghost article
- `/[...slug]/` — Dynamic catch-all for Firestore-backed marketing pages (supports redirects)
- `/admin/` — Refine.dev admin panel behind `app/admin/(protected)/` route group

All public pages use ISR with `revalidate = 120` and `dynamic = "force-static"`.

### Block System

`BlocksRenderer` in `components/sections/` maps block types to section components. Block types include: `hero`, `thirds`, `story`, `split`, `animated_headline`, `features`, `scroll_gallery`, `article_featured`, `article_grid`, `divider`. Blocks reference components by ID which are fetched and injected separately.

### Admin Panel

Refine.dev CRUD at `/admin/` manages pages, components, navigation, media, and site settings. Custom Firestore data providers live in `lib/admin/`. Auth is handled via `AdminAuthGate` with a local dev bypass (`lib/localAuthBypass.ts`, disabled in production).

### Styling

Global CSS with custom properties in `app/globals.css` (no Tailwind). Rubik font via Google Fonts. The `@next/next/no-img-element` ESLint rule is disabled — bare `<img>` tags are used intentionally.

### Path Aliases

- `@/components/*` → `components/*`
- `@/lib/*` → `lib/*`

## Environment Variables

**Firebase**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`

**Ghost CMS**: `GHOST_CONTENT_URL`, `GHOST_CONTENT_API_KEY`

**Analytics**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SITE_URL` (default: `https://studiotak.co`)

**Admin**: `SEED_TOKEN` (for admin API endpoints — optional, if unset all requests are allowed)

## Content Management API

REST endpoints at `/api/admin/` for programmatic page and component management. Auth via `Authorization: Bearer $SEED_TOKEN` header (skipped if `SEED_TOKEN` is unset). Shared helpers in `lib/adminApi.ts`.

### Pages

```bash
# List all pages (optional ?status=published|draft)
curl http://localhost:3000/api/admin/pages

# Create a page
curl -X POST http://localhost:3000/api/admin/pages \
  -H "Content-Type: application/json" \
  -d '{"id":"services","slug":"/services","title":"Services","status":"draft","blocks":[{"id":"svc-hero","type":"hero","title":"Our Services","alignment":"centered"}]}'

# Get a single page
curl http://localhost:3000/api/admin/pages/services

# Full update
curl -X PUT http://localhost:3000/api/admin/pages/services \
  -H "Content-Type: application/json" \
  -d '{"slug":"/services","title":"Services","status":"published","blocks":[...]}'

# Partial update (e.g. publish)
curl -X PATCH http://localhost:3000/api/admin/pages/services \
  -H "Content-Type: application/json" \
  -d '{"status":"published"}'

# Delete
curl -X DELETE http://localhost:3000/api/admin/pages/services
```

### Components

```bash
# List all components
curl http://localhost:3000/api/admin/components

# Create a component
curl -X POST http://localhost:3000/api/admin/components \
  -H "Content-Type: application/json" \
  -d '{"id":"feature-analytics","kind":"feature","title":"Analytics","body":"Real-time dashboards."}'

# Get / PUT / PATCH / DELETE at /api/admin/components/:id
```

### Response Shape

All endpoints return `{ data: T }` for single items, `{ data: T[], total: number }` for lists, or `{ error: string }` on failure. Write operations auto-set `updatedAt` and call `revalidatePath()` for immediate ISR refresh.

### Page Data Model

Pages require `id` + `slug`. Key fields: `title`, `status` ("draft"|"published"), `blocks` array, SEO fields (`seoTitle`, `metaDescription`, `canonicalUrl`, `ogTitle`, `ogDescription`). See `PageRecord` in `lib/admin/pages.ts` for the full type.

### Block Types

Each block needs `id` + `type`. Full type definitions in `lib/admin/pages.ts`. Rendered by `BlocksRenderer` in `components/sections/`.

| Block | Visual | When to use | Key fields |
|-------|--------|-------------|------------|
| `hero` | Full-bleed intro with optional background image/video, overlay, and two CTAs. Can run in "dynamic" mode with animated media columns. | Page openings, landing pages | `title`, `subtitle`, `alignment` ("centered"\|"image_left"\|"image_right"), `primaryCtaLabel`/`Href`, `media`, `background`, `mode` ("static"\|"dynamic") |
| `thirds` | Compact variant of hero — same layout but less padding, no border, transparent background. | Secondary hero-style sections, mid-page callouts | Same as hero plus `layout` ("left"\|"centered") |
| `story` | Narrative section with heading, body, optional media, and expandable subsections grid. Three variants. | About sections, case studies, process steps | `heading`, `body`, `variant` ("single_column"\|"two_column"\|"split_with_quote"), `sections[]` ({title, body}) |
| `split` | Two-column: text on one side, square media on the other. Optional CTA. | Feature highlights, content + image pairs | `heading`, `body`, `media`, `mediaSide` ("left"\|"right"), `ctaLabel`/`Href` |
| `animated_headline` | Full-viewport animated text with motion effects. Freezeable on scroll. | Dramatic section breaks, storytelling beats | `headline`, `subtext`, `animationStyle` ("fade_by_word"\|"slide_by_letter"\|"typewriter"\|"scramble"), `animationMode` ("viewport"\|"scroll") |
| `features` | Horizontal gallery of feature cards with icons, titles, and descriptions. Full-bleed viewport width. | Capabilities, service offerings, feature lists | `heading`, `body`, `columns`, `items[]` ({title, body, badge, icon, componentId}) |
| `scroll_gallery` | Horizontal carousel with left/right nav buttons and edge fade masks. Stacks on mobile. | Portfolio items, step-by-step processes, card showcases | `heading`, `body`, `items[]` (same as features) |
| `showcase` | Overlapping card stack with staggered rotation angles. Loads media from Firebase by type/industry filter. | Project portfolios, impressive media galleries | `typeFilter`, `industryFilter`, `limit`, `featuredOnly`, `animationPreset` |
| `logos` | Two-row continuously scrolling logo wall (opposite directions). Loads from Firebase. | Client logos, partner showcases | `heading`, `limit` |
| `contact` | Two-column: embedded form (Brevo/Sendinblue) on left, square media on right. Includes email validation and success state. | Lead capture, contact forms, inquiries | `heading`, `body`, `formId`, `portalId`, `region`, `formScriptSrc`, `media` |
| `article_featured` | Large featured article card (image + title + excerpt + "Read more"). Pulls from Ghost CMS. | Blog highlight at top of learn/news pages | `tagFilter` (optional Ghost tag) |
| `article_grid` | Two-tier article listing: 3-column recent posts grid on top, auto-fit card grid below. Pulls from Ghost CMS. | Blog listing, knowledge base index | `tagFilter`, `offset`, `limit` |
| `stats` | Row of large numbers with labels. Two variants: plain or bordered cards. | Key metrics, social proof numbers, at-a-glance KPIs | `heading`, `body`, `items[]` ({value, label, prefix, suffix}), `variant` ("default"\|"card") |
| `comparison` | Two-column side-by-side with check/X icons per item. One column can be highlighted (accent border). | Us vs. them, before/after, competitive comparisons | `heading`, `body`, `columns` (tuple of {heading, items[], highlighted?}) |
| `divider` | Simple horizontal rule. | Visual separator between sections | `width` ("full"\|"page") |

**Common patterns:**
- All blocks support `enableDarkModeOnScroll` to toggle dark theme as the user scrolls into view
- Feature items in `features` and `scroll_gallery` blocks can reference components via `componentId` — the component's data (title, body, icon) overwrites the item at render time
- `showcase` and `logos` blocks pull media from the Firebase `media` collection, not from inline data

### Learn Page SEO & Campfire Linking

Article pages (`/learn/[slug]`) include JSON-LD Article structured data, OpenGraph article metadata, and `generateStaticParams` for build-time pre-rendering. The `/learn` listing includes JSON-LD Blog schema.

Each article renders a **Campfire CTA** and **related posts** section. Ghost tags on the article control the CTA destination:

| Ghost tag type | Examples | Effect |
|----------------|----------|--------|
| Page tags | `growth`, `brands`, `agencies` | Routes to `/campfire/growth`, `/campfire/brands`, `/campfire/agencies` |
| Audience tags | `fashion`, `ecommerce`, `saas`, `fintech`, etc. | Appended as `?audience=<tag>` |
| No match | — | Defaults to `/campfire` |

Tag maps are in `app/learn/[slug]/page.tsx` (`CAMPFIRE_PAGE_TAGS`, `CAMPFIRE_AUDIENCE_TAGS`). Related posts are ranked by tag overlap with the current article, limited to 3.

### Components Data Model

Components require `id` + `kind` ("feature"). Fields: `title`, `body`, `icon` (BlockMedia), `industry`, `type`, `mediaFit`. Components are referenced from feature items in blocks via `componentId`.

## Content Update Workflow

**IMPORTANT: Firestore is the source of truth.** When Firebase is configured, the dev server and production site read from Firestore. Seed data in `lib/admin/pages.ts` is only a build-time fallback.

### Quick Decision Tree

1. **Editing an existing page?** → Use `PATCH /api/admin/pages/:id` with only the changed fields. Done.
2. **Replacing all blocks on a page?** → Use `PUT /api/admin/pages/:id` with the full page object. Done.
3. **Creating a new page?** → Use `POST /api/admin/pages` with full page data. Done.
4. **Need seed data in sync for deploys?** → First `GET /api/admin/seed?collection=pages` to pull live state, then update the seed file.
5. **NEVER edit seed data as the primary update method** — edit Firestore via the API, then optionally sync seed data afterward.

### Inspecting Page Structure

Use the inspect endpoint to see what blocks are on any page and where the data comes from:

```bash
# Inspect by slug (most common)
curl http://localhost:3000/api/admin/inspect?slug=/

# Inspect by page ID
curl http://localhost:3000/api/admin/inspect?id=home
```

Returns a compact summary:
```json
{
  "source": "firestore",
  "page": { "id": "home", "slug": "/", "title": "Home", "status": "published" },
  "blockCount": 8,
  "blockSequence": "hero → animated_headline → features → split → logos → contact",
  "blocks": [ { "id": "...", "type": "hero", "title": "..." }, ... ]
}
```

The `source` field tells you whether data came from `"firestore"` or `"seed"` fallback.

### Dev-Mode Data Source Banner

In development, a small fixed banner appears in the bottom-right corner of every page showing:
- **Source**: FIRESTORE (green) or SEED (amber) or NOT_FOUND (red)
- **Block sequence**: compact list of block types on the page
- **Last updated**: timestamp

Click the banner to dismiss it. It only renders in development (`NODE_ENV !== "production"`).

### Verifying Changes

After making an API update:
1. Call the inspect endpoint to confirm the data was written correctly
2. Reload the page — ISR revalidation happens automatically on writes
3. Use `preview_snapshot` to verify the rendered output if needed

### Common Pitfalls
- **Seeing old data?** The dev server may have a cached ISR page. API writes call `revalidatePath()` automatically, but you may need to reload.
- **Seed data showing instead of Firestore?** Check that Firebase env vars are set. The inspect endpoint's `source` field confirms this.
- **Don't read seed files to understand page content** — use the inspect endpoint instead. Seed files may be stale.
