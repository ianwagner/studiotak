# Attio → Meta Qualified Leads

The website already creates or updates an Attio **Person** for every verified contact or Campfire application. The `/api/webhooks/attio/meta-qualified-leads` endpoint completes the CRM portion of Meta's Qualified Leads integration: an Attio lead-stage change is sent to Meta as a Conversions API event.

The endpoint verifies Attio's HMAC signature, reads the relevant Attio record, SHA-256 hashes customer data locally, and then calls Meta. It never logs email addresses, phone numbers, lead IDs, access tokens, or un-hashed contact data.

## Choose the source of truth for stages

Use one of these supported Attio layouts. Do not create both subscriptions for the same lead flow.

### A stage field on People

This is the simplest option for the current site. Add a **single-select** attribute to **People** (for example, `meta_lead_stage`). The website assigns the `Lead` value only when it creates a new Person, so the initial raw-lead event is also sent to Meta without resetting later stages. Attio's Status field type is not available on People objects.

Subscribe to `record.updated` and filter it to the stage attribute ID:

```json
{
  "$and": [
    {
      "field": "id.attribute_id",
      "operator": "equals",
      "value": "YOUR_STAGE_ATTRIBUTE_ID"
    }
  ]
}
```

If a record is created with its stage already set (rather than by an automation), add a second `record.created` subscription for the People object. The endpoint will only send it when the configured stage has a value.

### A People pipeline List

If your lead workflow is an Attio List with a Kanban status, subscribe to both:

1. `list-entry.created`, filtered to the lead list ID. This sends the initial/raw stage.
2. `list-entry.updated`, filtered to both the lead list ID and the Status attribute ID. This sends subsequent stage changes.

Example creation filter:

```json
{
  "$and": [
    {
      "field": "id.list_id",
      "operator": "equals",
      "value": "YOUR_LEAD_LIST_ID"
    }
  ]
}
```

Example update filter:

```json
{
  "$and": [
    {
      "field": "id.list_id",
      "operator": "equals",
      "value": "YOUR_LEAD_LIST_ID"
    },
    {
      "field": "id.attribute_id",
      "operator": "equals",
      "value": "YOUR_STAGE_ATTRIBUTE_ID"
    }
  ]
}
```

The endpoint expects the List's parent records to be People. It obtains email, phone, and name from that Person record, and the stage from the List entry.

## Environment variables

Set these in the deployed site's environment (and locally only if you are testing locally):

```bash
# Existing Attio integration token. It now also needs record_permission:read
# and object_configuration:read. List pipelines additionally need
# list_entry:read and list_configuration:read.
ATTIO_API_KEY=

# The Attio webhook's secret, from the Attio developer settings page.
ATTIO_QUALIFIED_LEADS_WEBHOOK_SECRET=

# Meta Dataset / Conversions API credentials. Keep the access token secret.
META_QUALIFIED_LEADS_DATASET_ID=859420348425587
META_QUALIFIED_LEADS_ACCESS_TOKEN=
META_QUALIFIED_LEADS_API_VERSION=v26.0

# Set this only while testing. Remove it for production events.
# META_QUALIFIED_LEADS_TEST_EVENT_CODE=
```

For the **People stage field** layout, configure:

```bash
ATTIO_QUALIFIED_LEADS_OBJECT=people
ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE=meta_lead_stage
ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE_ID=YOUR_STAGE_ATTRIBUTE_ID

# Optional but recommended when you store Meta's native lead-form ID in Attio.
# This must be a text attribute: Meta IDs can contain 17 digits, which must not
# be parsed as JavaScript numbers.
ATTIO_QUALIFIED_LEADS_META_LEAD_ID_ATTRIBUTE=meta_lead_id
```

For the **List pipeline** layout, configure:

```bash
ATTIO_QUALIFIED_LEADS_LIST_ID=YOUR_LEAD_LIST_ID
ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE=status
ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE_ID=YOUR_STATUS_ATTRIBUTE_ID
```

The following contact attributes default to Attio's standard People fields, so normally do not need configuration:

```bash
# Defaults shown here; set only if your workspace uses different attribute slugs.
# ATTIO_QUALIFIED_LEADS_EMAIL_ATTRIBUTE=email_addresses
# ATTIO_QUALIFIED_LEADS_PHONE_ATTRIBUTE=phone_numbers
# ATTIO_QUALIFIED_LEADS_NAME_ATTRIBUTE=name
```

By default, each Attio stage title becomes `event_name` in the Meta payload. To report only selected stages or use Meta-friendly names, provide a JSON mapping. An absent stage is acknowledged but not sent.

```bash
ATTIO_QUALIFIED_LEADS_EVENT_NAMES_JSON='{"Lead":"Lead","Qualified":"Qualified Lead","Won":"Converted Lead"}'
```

## Create the Attio webhook

Create a V2 webhook in the Attio developer settings or through the API. The target is:

```text
https://studiotak.co/api/webhooks/attio/meta-qualified-leads
```

Copy the webhook secret into `ATTIO_QUALIFIED_LEADS_WEBHOOK_SECRET`. Do not use a generic shared secret; Attio signs the exact request body with the per-webhook secret.

Attio webhooks are delivered at least once and include an `Idempotency-Key` header. The endpoint derives Meta's `event_id` from that stable delivery key, so an Attio retry does not become a duplicate conversion. It returns a non-2xx response only when processing fails, which lets Attio retry the delivery.

## Test safely

1. Deploy with `META_QUALIFIED_LEADS_TEST_EVENT_CODE` set to the test code from Meta Events Manager.
2. In Attio, use **Send test event to target URL** for the subscription, or move a real test record through a stage. The record needs an email, phone, or Meta lead ID to be matchable.
3. Confirm the event appears in Meta's **Test Events** tab.
4. Remove `META_QUALIFIED_LEADS_TEST_EVENT_CODE`, then move a test record to the next production stage.

The endpoint sends the stage value's `active_from` time as Meta's `event_time`, rather than the webhook delivery time. Email, phone, first name, and last name are normalized and SHA-256 hashed before sending; a Meta lead ID is sent intact to avoid losing its precision.
