import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/adminApi";

export type UniqueLeadSource = "contact" | "spec_ads";

/**
 * Atomically reserves one conversion per normalized email across all enquiry
 * forms. Only a hash is stored, so the conversion ledger contains no contact
 * details. A storage failure returns null and deliberately suppresses tracking
 * rather than risking duplicate conversions.
 */
export async function reserveUniqueLeadConversion(
  email: string,
  source: UniqueLeadSource,
  eventId: string
): Promise<boolean | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const leadKey = createHash("sha256").update(normalizedEmail).digest("hex");

  try {
    await getDb().collection("lead-conversions").doc(leadKey).create({
      source,
      eventId,
      createdAt: FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    if (code === 6 || code === "6" || code === "already-exists") return false;
    console.error("Unable to reserve unique lead conversion", { source, code: code ?? "unknown" });
    return null;
  }
}
