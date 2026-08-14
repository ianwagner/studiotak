# Ghost → Resend article email drafts

Publishing a Ghost post with the internal `#email` tag creates a **draft** Resend Broadcast. It never sends an email automatically.

## What the automation does

1. Ghost sends a signed `post.published` webhook to `https://studiotak.co/api/ghost/article-email`.
2. The endpoint ignores posts without the `#email` internal tag.
3. For tagged posts, it finds or creates the `Marketing updates` segment and backfills existing contacts whose `marketing_consent` property is `true`.
4. It fetches the published post through the Ghost Content API, adds UTM parameters to the Studio Tak `/learn/[slug]` URL, and creates a Resend draft broadcast.
5. The draft uses the Studio Tak article email design, targets the `Marketing updates` segment, and must be reviewed and sent in Resend.

The endpoint verifies Ghost’s `X-Ghost-Signature` HMAC. Each publish event creates a draft, so leave the `#email` tag off articles that should not generate another announcement when republished.

## Production environment

Set these in Vercel’s **Production** environment:

| Variable | Purpose |
| --- | --- |
| `GHOST_CONTENT_URL` | Existing Ghost Content API base URL. |
| `GHOST_CONTENT_API_KEY` | Existing Ghost Content API key. |
| `RESEND_API_KEY` | Resend API key with Broadcast and Contacts permissions. |
| `RESEND_FROM_EMAIL` | Existing verified Studio Tak sender. |
| `RESEND_MARKETING_SEGMENT_ID` | Optional explicit ID for the `Marketing updates` Resend segment. If omitted, the app creates or finds that segment. |
| `GHOST_ARTICLE_EMAIL_WEBHOOK_SECRET` | A random secret shared only with the Ghost webhook. |
| `RESEND_MARKETING_FROM_EMAIL` | Optional marketing-specific sender; otherwise `RESEND_FROM_EMAIL` is used. |

Generate the webhook secret with `openssl rand -hex 32`. Do not put it in a URL or commit it to the repository.

## Set up the Resend segment

Broadcasts send to a segment. The app finds or creates a `Marketing updates` segment through Resend, then puts future opted-in contacts in it automatically. Set `RESEND_MARKETING_SEGMENT_ID` only if you want to pin a particular segment.

The first qualifying Ghost publish backfills opted-in contacts automatically. To do that work before the first `#email` post, you can alternatively pull the production Vercel environment to a temporary file and run:

```bash
vercel env pull /private/tmp/studio-tak-production.env --environment production --yes
node scripts/backfill-resend-marketing-segment.mjs /private/tmp/studio-tak-production.env
```

The script creates `Marketing updates` if it does not exist, adds existing contacts whose `marketing_consent` property equals `true`, and prints the segment ID to store as `RESEND_MARKETING_SEGMENT_ID`.

## Set up the Ghost webhook

In Ghost Admin, open **Settings → Advanced → Integrations**, create a custom integration, then add a webhook with:

| Field | Value |
| --- | --- |
| Event | `post.published` |
| Target URL | `https://studiotak.co/api/ghost/article-email` |
| Secret | The exact value of `GHOST_ARTICLE_EMAIL_WEBHOOK_SECRET` |

For the first test, publish a disposable article with `#email`. Confirm that a draft appears in Resend, inspect it, and delete the test draft. There is intentionally no code path that sends a Broadcast.
