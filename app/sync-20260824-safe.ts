import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { credentials, payers, settings } from "@/db/schema";
import { applyLatestPortalSync } from "./sync-20260824";

const BAD_MEDICARE_EVIDENCE =
  "MHMD requested individual Medicare/PTAN information; current PTAN not verified in accessible EPC records.";
const BAD_MEDICARE_NOTES =
  "Historical PTANs must not be reused unless current active enrollment and EPC reassignment are confirmed.";
const REPAIR_KEY = "operationalSync20260824Repair";
const REPAIR_VERSION = "2026-08-24-repair-v1";

function genericNextAction(name: string, phone: string, delegated: boolean) {
  if (delegated) {
    return "Contact payer Provider Relations and confirm the provider-specific network, Type 1 NPI loading, and effective date under the MHMD delegated group pathway.";
  }
  return `Contact ${name} Provider Relations${phone ? ` (${phone})` : ""} to confirm the exact network, provider-specific participation, and effective date.`;
}

export async function applySafeLatestPortalSync() {
  // Run the full Aug. 24 operational sync first. If it already ran, its version
  // guard makes this a no-op. If it runs now, the repair below immediately
  // corrects the original Medicare scoping defect before the page is returned.
  await applyLatestPortalSync();

  const db = await getDb();
  const now = new Date().toISOString();
  const payerRows = await db.select().from(payers);
  const payerById = new Map(payerRows.map((payer) => [payer.id, payer]));
  const medicare = payerRows.find((payer) => payer.name === "Medicare Part B (Original Medicare)");

  const contaminated = await db
    .select()
    .from(credentials)
    .where(eq(credentials.evidenceReference, BAD_MEDICARE_EVIDENCE));

  for (const record of contaminated) {
    // These values are correct for the Medicare row itself; only repair rows
    // that were accidentally touched because the original migration filtered
    // by provider ID without also filtering by the Medicare payer ID.
    if (medicare && record.payerId === medicare.id) continue;
    if (record.notes !== BAD_MEDICARE_NOTES) continue;

    const payer = payerById.get(record.payerId);
    if (!payer) continue;

    if (payer.name === "Ambetter") {
      const evidence =
        "Superior HealthPlan confirmed EPC network participation request received 2026-07-27; Contract Negotiator Semetra Brazle requested a completed W-9 to prepare the agreement. Reply draft with EPC W-9 prepared 2026-08-24 and not yet sent.";
      await db
        .update(credentials)
        .set({
          priority: "High",
          assignedTo: "John / Gloria",
          nextAction:
            "Send the completed EPC W-9 to Semetra Brazle in the existing Superior thread; then review the participation agreement and complete provider credentialing requirements.",
          evidenceReference: evidence,
          notes:
            "Group contracting is in progress; individual provider credentialing is not yet complete. Do not treat as in network yet.",
          updatedAt: now,
        })
        .where(eq(credentials.id, record.id));
      continue;
    }

    if (payer.name === "Blue Cross Blue Shield") {
      const evidence =
        "MHMD Managed Care Contracts Flyer, revised June 12, 2026; BCBSTX onboarding application 929236; Gloria confirmed 2026-08-21 that provider BCBS IDs had not yet been assigned; corrected onboarding roster prepared 2026-08-24.";
      await db
        .update(credentials)
        .set({
          priority: "High",
          assignedTo: "John",
          nextAction:
            "Monitor BCBSTX onboarding application 929236. When provider IDs are assigned, confirm each Type 1 NPI is loaded for the exact network and record the effective date.",
          evidenceReference: evidence,
          notes:
            "BCBS provider IDs were not yet assigned as of 2026-08-21. Do not treat the onboarding roster or historical participation as proof of current EPC NPI loading.",
          updatedAt: now,
        })
        .where(eq(credentials.id, record.id));
      continue;
    }

    const delegated = payer.contractStatus === "Delegated contract on file";
    await db
      .update(credentials)
      .set({
        priority: record.status === "In Progress" || record.status === "Pending" ? "High" : "Normal",
        assignedTo: "Unassigned",
        nextAction: genericNextAction(payer.name, payer.phone, delegated),
        evidenceReference: delegated ? payer.contractEvidence : "",
        notes: "",
        updatedAt: now,
      })
      .where(eq(credentials.id, record.id));
  }

  await db
    .insert(settings)
    .values({ key: REPAIR_KEY, value: REPAIR_VERSION, updatedAt: now })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: REPAIR_VERSION, updatedAt: now },
    });
}
