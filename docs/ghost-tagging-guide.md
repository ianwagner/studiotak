# Ghost Article Tagging Guide

How to tag articles in Ghost so the site routes CTAs and filters correctly.

## How Tags Work

Tags on a Ghost article control two things:

1. **CTA routing** — The call-to-action on each article page links to a product landing page determined by the article's tags.
2. **Article filtering** — The `/learn` listing page can filter articles by tag via the `?tag=` query parameter.
3. **Related posts** — Articles that share more tags with the current article rank higher in the "Related" section.
4. **Learn Series** — Internal Series tags can position a curated group of guides as ordered steps.

## Learn Series Tags

Use an **internal** tag on every guide that belongs to a Series. The title before the pipe must match exactly; the number after it determines the step order.

```
#series: Build a Creative Testing System | 1
#series: Build a Creative Testing System | 2
```

The site automatically creates a `/learn/series/...` page and adds the Series to the Learn landing page and sidebar once all tagged guides are published. A guide can appear in more than one Series by using more than one Series tag.

To set or revise the Series description, add this internal tag to any guide in the Series:

```
#series-description: Build a Creative Testing System | Learn what to test, how to read the results, and how to turn winners into your next round of creative.
```

## CTA Tags

CTA tags are namespaced by product. Right now only Campfire tags exist, but more products will be added over time. Each article can have one **page tag** and one **audience tag**.

### Campfire Page Tags

These set the base CTA destination. Use one per article.

| Ghost tag | CTA links to | CTA label |
|-----------|-------------|-----------|
| `campfire-growth` | `/campfire/growth` | "See how Campfire helps growth teams" |
| `campfire-growth-marketing` | `/campfire/growth` | "See how Campfire helps growth teams" |
| `campfire-brands` | `/campfire/brands` | "See how Campfire helps brands teams" |
| `campfire-brand` | `/campfire/brands` | "See how Campfire helps brands teams" |
| `campfire-agencies` | `/campfire/agencies` | "See how Campfire helps agencies teams" |
| `campfire-agency` | `/campfire/agencies` | "See how Campfire helps agencies teams" |
| _(none of the above)_ | `/campfire` | "See what Campfire can do" |

### Campfire Audience Tags

These append an `?audience=` query parameter to the CTA link. Use one per article (optional).

`campfire-fashion`, `campfire-ecommerce`, `campfire-saas`, `campfire-fintech`, `campfire-healthcare`, `campfire-beauty`, `campfire-food`, `campfire-travel`, `campfire-fitness`, `campfire-retail`, `campfire-tech`, `campfire-luxury`, `campfire-cpg`, `campfire-b2b`, `campfire-dtc`

The `campfire-` prefix is stripped in the URL. For example, an article tagged `campfire-growth` + `campfire-ecommerce` produces:

```
/campfire/growth?audience=ecommerce
```

### Examples

| Article topic | Tags to add | Resulting CTA link |
|--------------|------------|-------------------|
| Growth tactics for ecommerce brands | `campfire-growth`, `campfire-ecommerce` | `/campfire/growth?audience=ecommerce` |
| Agency case study | `campfire-agencies` | `/campfire/agencies` |
| General SaaS article | `campfire-saas` | `/campfire?audience=saas` |
| Unrelated thought piece | _(no campfire tags)_ | No CTA shown |

## Content Filter Tags

Any Ghost tag can be used for filtering on the `/learn` page via `?tag=`. These are separate from CTA tags and don't need a prefix. Use descriptive, lowercase, hyphenated slugs.

Examples: `design-systems`, `case-study`, `product-updates`, `engineering`

Filter tags and CTA tags can coexist on the same article — they serve different purposes.

## Tagging Checklist

1. Decide which product the article should link to (currently only Campfire).
2. Add one **page tag** if the article targets a specific audience segment (growth, brands, agencies).
3. Optionally add one **audience tag** for industry targeting.
4. Add any **content filter tags** for the `/learn` listing page.
5. Verify tag slugs in Ghost — they must match exactly (lowercase, hyphenated).

## Adding New Products

When a new product needs CTA routing:

1. Define a new set of namespaced tags (e.g., `newproduct-growth`, `newproduct-ecommerce`).
2. Add corresponding tag maps and link-building logic in `app/learn/[slug]/page.tsx`.
3. Update this guide with the new tag tables.
