# Tagging Guide

This guide outlines how to categorize Studio Tak content inside Sanity.

## Taxonomies

- **Industries** — Create and manage a controlled list of markets (e.g., Beauty, Finance). Use clear, singular labels and add a short description that clarifies scope.
- **Personas** — Define target roles or audiences (e.g., Marketing Manager). Add context so authors know when to use each persona.
- **Content Types** — Capture the format of a piece (e.g., Case Study, Product Update). Keep the list concise and mutually exclusive.

Each taxonomy entry requires a label and slug. Slugs are auto-generated from the label; adjust only when needed. Optionally provide an emoji or icon keyword for visual cues in the Studio.

## Content Pieces

Content documents (Articles, Features, Examples) share common fields:

- **Status** — `Draft`, `Approved`, or `Archived`. Pick the state that matches the publishing lifecycle. Only Approved items should ship to production.
- **Industries** — Multi-select reference back to the Industry taxonomy. Choose every relevant industry for the content. Leave empty only when the piece is truly industry-agnostic.
- **Personas** — Multi-select reference back to the Persona taxonomy. Tag every persona that benefits from the content.
- **Content Type** — Optional reference that states the format. Use it to power filters or site navigation.

## Tagging Checklist

1. Confirm the content has the right Status.
2. Add at least one Industry and Persona when applicable. If an option is missing, create it in the corresponding Taxonomy list before saving the content.
3. Review slugs for typos; they will power URL paths and filters.
4. Save the document and keep the Status accurate as work progresses.

Keeping tags tidy ensures accurate automation and trustworthy site filters.
