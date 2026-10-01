# Unique website enquiry conversions and ad exclusions

Every verified Contact or Campfire application is delivered before it is considered for conversion tracking. The server atomically reserves the normalized email in the private Firestore `lead-conversions` collection, using a SHA-256 hash as the document ID. Only the first successful enquiry for that email across either form sends a `Lead` to GA/Google Ads and Meta. Repeat enquiries are still delivered to the team, synced to Attio, and shown in Slack, but do not create another conversion.

Meta receives the unique `Lead` through both the browser Pixel and the Conversions API. Both copies use the same event ID, so Meta records one conversion while the server-side delivery protects against ad blockers and browser failures. Newsletter subscriptions use `sign_up` in GA and `CompleteRegistration` in Meta, keeping them out of enquiry reporting.

The server sends the event only when the visitor has opted in to the site's **Marketing** cookie category. That preserves the existing consent policy; a visitor who rejects marketing cookies cannot be attributed or added to a website audience through this integration.

## Form data destinations

Both enquiry forms require a brand website and current monthly Meta spend. The values are validated against the shared form schema and propagated to:

- the internal Resend notification email;
- the Resend contact properties `website` and `monthly_meta_spend` when marketing consent is granted;
- the Attio Person attributes `website` and `monthly_meta_spend`;
- the Slack submission notification, which also states whether the submission produced a unique conversion.

The public success state is rendered inline after the API confirms delivery. `/thank-you` is retained only as a legacy redirect to `/`, so refreshes, bookmarks, and direct visits cannot trigger the former URL-based conversion.

## Deployment configuration

The website uses the existing qualified-leads credentials when they are configured. To keep website and CRM credentials separate, set these server-only variables instead:

```bash
META_WEB_EVENTS_DATASET_ID=859420348425587
META_WEB_EVENTS_ACCESS_TOKEN=
META_WEB_EVENTS_API_VERSION=v26.0
# META_WEB_EVENTS_TEST_EVENT_CODE=
```

The dataset ID must be the same as `NEXT_PUBLIC_META_PIXEL_ID`. Set `META_WEB_EVENTS_TEST_EVENT_CODE` only while testing in Meta Events Manager, then remove it before sending production events.

The deployment must also provide `FIREBASE_SERVICE_ACCOUNT_JSON` (or equivalent Application Default Credentials) so the server can create deduplication records. If Firestore is unavailable, the enquiry is still delivered but conversion tracking fails closed rather than risking a duplicate.

When these credentials are configured, the Attio webhook deliberately skips an initial website `Lead` stage without Meta's native `lead_id`. This prevents a website form from being counted once by website CAPI and again when Attio receives the same lead. Qualified and converted CRM stages continue to send. Native Meta lead-form records with a `lead_id` continue to use the Attio raw-lead path.

## Exclude form submitters from ads

In Meta Ads Manager, create a **Website Custom Audience** for people who triggered the `Lead` event from this dataset (choose a retention window that matches the sales cycle, such as 180 days). Then add that audience under **Exclude** in every relevant ad set. A website event alone does not automatically exclude anyone; the ad set must reference the audience.

Allow a few hours for a new or updated custom audience to populate. For a person who already submitted before this change went live, add their email to the same customer-list exclusion audience manually, provided the applicable consent and privacy policy allow that use.

## Verify safely

1. Set `META_WEB_EVENTS_TEST_EVENT_CODE` to the code shown in Events Manager → Test events.
2. Visit the form in a clean browser, accept Marketing cookies, and submit a test record with a brand website and current monthly Meta spend.
3. Confirm that Events Manager shows one deduplicated `Lead` with both Browser and Server delivery.
4. Submit the same email through either enquiry form and confirm that no second `Lead` appears, while the Slack notification says `Unique conversion: No — existing lead`.
5. Remove the test-event variable and deploy again.
