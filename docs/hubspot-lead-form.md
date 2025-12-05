# HubSpot Lead Capture Form

This guide covers how we surface an embedded HubSpot form (no scheduling widget) using Sanity (for content) and the frontend `Form` block.

## 1. Build the Form in HubSpot
- Go to **Marketing → Lead Capture → Forms** and create the form you need.
- Choose the **Embedded form** option, configure fields, thank-you behaviour, and notifications.
- Copy the **Form ID** (GUID) plus note your **Portal ID** and **Region** from the HubSpot embed snippet (e.g. `data-form-id="..."`, `data-portal-id="244262601"`, region `na2`).

## 2. Configure Site Defaults
- In Sanity Studio, open **Site Settings**.
- Set `HubSpot Portal ID` to the numeric portal (e.g. `244262601`).
- Select `HubSpot Region` to match HubSpot (`na1`, `na2`, `eu1`, `ap1`). This picks the correct script host (`https://js-<region>.hsforms.net`).

## 3. Create a Form Document
- Navigate to **Marketing → Forms** (new document type).
- Fill in:
  - `Title`: internal label for editors, e.g. “Contact Demo Form”.
  - `HubSpot Form ID`: GUID copied from HubSpot.
  - Optional overrides:
    - `Portal ID Override`: if the form belongs to a different HubSpot portal.
    - `Region Override`: switch clusters when needed (defaults to Site Settings).
    - `Success Message`: inline confirmation copy rendered after submission.
    - `Internal Notes`: keep track of where the form is used or follow-up expectations.

## 4. Drop the Form Block on a Page
- Edit any page (or shared block) and add the **Form** block.
- Select the form document, optionally add heading/body copy, and publish.
- On the frontend we load `https://js-<region>.hsforms.net/forms/embed/v2.js`, call `hbspt.forms.create`, and render the HubSpot content in-place using the stored Portal ID + Form ID.

## 5. Styling and Follow-Up
- The rendered markup sits inside `.hubspot-form-container` with HubSpot’s `.hs-form` classes—override those selectors in our CSS to match the site.
- Keep HubSpot follow-up (notification emails, workflows) tied to the HubSpot form itself—no code changes required.
- If you ever need a fully custom UI, render your own form in the app and submit via HubSpot’s Forms API; the Sanity `Form` document still gives editors a central place to store IDs, copy, and notes.
