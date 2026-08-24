import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, credentials, payers, settings } from "@/db/schema";

const KEY = "submissionSync20260824";
const VERSION = "2026-08-24-1508-v1";

export async function applySubmissionSync20260824() {
  const db = await getDb();
  const [done] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, KEY)).limit(1);
  if (done?.value === VERSION) return;

  const now = new Date().toISOString();

  const [triwest] = await db.select().from(payers).where(eq(payers.name, "TRICARE West (TriWest)")).limit(1);
  if (triwest) {
    const evidence = "Completed EPC TriWest provider roster CSV emailed to credentialing@triwest.com on 2026-08-24 at 3:08 PM. Case 01042248; prior call reference 10288721.";
    await db.update(payers).set({
      contractStatus: "Roster Submitted — Credentialing Pending",
      contractEvidence: evidence,
      contractEvidenceDate: "2026-08-24",
      verificationRule: "Await TriWest confirmation, provider credentialing results, and any TRICARE certification/supporting-document requests before treating newly added providers as network-loaded.",
      notes: "Direct/non-delegated EPC credentialing submission sent for 11 providers at both EPC locations.",
      updatedAt: now,
    }).where(eq(payers.id, triwest.id));

    await db.update(credentials).set({
      status: "Pending",
      priority: "High",
      assignedTo: "John",
      nextAction: "Monitor for TriWest acknowledgment, case update, credentialing requests, and provider certification requirements following the 2026-08-24 roster submission.",
      referenceNumber: "Case 01042248 / 10288721",
      evidenceReference: evidence,
      notes: "Roster submitted; provider credentialing/loading not yet confirmed.",
      updatedAt: now,
    }).where(eq(credentials.payerId, triwest.id));
  }

  const [oscar] = await db.select().from(payers).where(eq(payers.name, "Oscar Health")).limit(1);
  if (oscar) {
    const evidence = "Oscar network/application request submitted by EPC on 2026-08-24. No email confirmation/reference was visible in Gmail at the time of this sync. Prior Oscar service reference: service-198963244.";
    await db.update(payers).set({
      contractStatus: "Application Request Submitted — Pending Review",
      contractEvidence: evidence,
      contractEvidenceDate: "2026-08-24",
      verificationRule: "Await Oscar confirmation/reference number and next contracting or provider-roster instructions. Do not treat EPC as in network until Oscar confirms participation/effective dates.",
      notes: "EPC was previously confirmed out of network on 2026-07-17. A new application/network request was submitted on 2026-08-24.",
      updatedAt: now,
    }).where(eq(payers.id, oscar.id));

    await db.update(credentials).set({
      status: "Pending",
      priority: "High",
      assignedTo: "John",
      nextAction: "Monitor for Oscar acknowledgment/reference and follow the requested contracting/roster steps once received.",
      referenceNumber: "service-198963244",
      evidenceReference: evidence,
      notes: "Application request submitted 2026-08-24; confirmation pending.",
      updatedAt: now,
    }).where(eq(credentials.payerId, oscar.id));
  }

  await db.insert(activity).values([
    {
      action: "Submitted",
      entityType: "payer",
      entityName: "TRICARE West / TriWest",
      detail: "Completed EPC provider roster CSV submitted to TriWest Credentialing on August 24, 2026 at 3:08 PM for direct/non-delegated credentialing. Case 01042248; prior call reference 10288721.",
    },
    {
      action: "Submitted",
      entityType: "payer",
      entityName: "Oscar Health",
      detail: "EPC network/application request submitted August 24, 2026. Confirmation/reference pending; prior service reference service-198963244 retained.",
    },
  ]);

  await db.insert(settings).values({ key: KEY, value: VERSION, updatedAt: now }).onConflictDoUpdate({
    target: settings.key,
    set: { value: VERSION, updatedAt: now },
  });
}
