#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const envFile = process.argv[2];

if (envFile) {
  const source = await readFile(envFile, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^(?:"|')|(?:"|')$/g, "");
    process.env[key] = value;
  }
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error("RESEND_API_KEY is required. Optionally pass a pulled Vercel env file as the first argument.");
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "User-Agent": "studio-tak-website/resend-marketing-segment-backfill"
};

const request = async (path, options = {}) => {
  const response = await fetch(`https://api.resend.com${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) {
    throw new Error(`Resend ${options.method || "GET"} ${path} failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }
  return response.json();
};

const getOrCreateSegment = async () => {
  if (process.env.RESEND_MARKETING_SEGMENT_ID) return process.env.RESEND_MARKETING_SEGMENT_ID;

  const segments = await request("/segments");
  const existing = segments.data?.find((segment) => segment.name === "Marketing updates");
  if (existing?.id) return existing.id;

  const created = await request("/segments", {
    method: "POST",
    body: JSON.stringify({ name: "Marketing updates" })
  });
  if (!created.id) throw new Error("Resend did not return the marketing segment ID.");
  return created.id;
};

const segmentId = await getOrCreateSegment();
let after;
let added = 0;
let alreadyMember = 0;
let checked = 0;

while (true) {
  const query = new URLSearchParams({ limit: "100" });
  if (after) query.set("after", after);
  const contacts = await request(`/contacts?${query}`);
  const data = Array.isArray(contacts.data) ? contacts.data : [];

  for (const contact of data) {
    checked += 1;
    if (contact?.properties?.marketing_consent !== "true" || !contact.email) continue;

    const response = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(contact.email)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "POST", headers }
    );
    if (response.ok) {
      added += 1;
    } else if (response.status === 409) {
      alreadyMember += 1;
    } else {
      throw new Error(`Could not add ${contact.email} to the marketing segment (${response.status}): ${(await response.text()).slice(0, 500)}`);
    }
  }

  if (!contacts.has_more || data.length === 0) break;
  after = data.at(-1)?.id;
  if (!after) throw new Error("Resend returned another contacts page without a cursor.");
}

console.log(`RESEND_MARKETING_SEGMENT_ID=${segmentId}`);
console.log(`Checked ${checked} contacts; added ${added}; already assigned ${alreadyMember}.`);
