# Studio Tak email masters

## New article

`new-article.html` is the reusable manual master for article-announcement emails. The Ghost automation uses the matching runtime renderer at `lib/articleAnnouncementEmail.ts` to create a Resend Broadcast draft from a published post.

Before sending, replace these values:

| Variable | Use |
| --- | --- |
| `ARTICLE_TITLE` | The article title. |
| `ARTICLE_INTRO` | A concise 1–2 sentence invitation to read; write this for email rather than pasting the full Ghost excerpt. |
| `ARTICLE_IMAGE_URL` | The absolute feature-image URL from Ghost. |
| `ARTICLE_IMAGE_ALT` | A short description of the image, or the article title. |
| `ARTICLE_URL` | The article URL with campaign tracking, for example `https://studiotak.co/learn/example?utm_source=resend&utm_medium=email&utm_campaign=article_announcement`. |
| `PREHEADER` | Roughly 40–90 characters that make the subject line more compelling in the inbox. |

Leave `{{{RESEND_UNSUBSCRIBE_URL}}}` untouched. Resend replaces it with a per-recipient unsubscribe link when the message is sent as a Broadcast.

Suggested sender: `Studio Tak <hello@studiotak.co>`

Suggested subject format: `New: [article title]`

Send the broadcast only to contacts whose `marketing_consent` property is `true`; this is the property the website’s opted-in Campfire contacts already receive.
