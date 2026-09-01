import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, credentials, payers, providers, settings } from "@/db/schema";

const KEY = "knownInformationSync20260901";
const VERSION = "2026-09-01-v1";

type EftRecord = {
  payerId: number;
  eftStatus: string;
  eraStatus: string;
  enrollmentMethod: string;
  portalUrl: string;
  clearinghouse: string;
  submittedDate: string;
  effectiveDate: string;
  confirmationNumber: string;
  assignedTo: string;
  followUpDate: string;
  notes: string;
  updatedAt: string;
};

function appendText(current: string, addition: string) {
  const clean = current.trim();
  if (!addition || clean.includes(addition)) return clean;
  return clean ? `${clean} ${addition}` : addition;
}

export async function applyKnownInformationSync20260901() {
  const db = await getDb();
  const [done] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, KEY)).limit(1);
  if (done?.value === VERSION) return;

  const now = new Date().toISOString();
  const payerRows = await db.select().from(payers);
  const providerRows = await db.select().from(providers);
  const payerByName = new Map(payerRows.map((payer) => [payer.name, payer]));

  async function appendPayerNote(name: string, note: string, evidence = "") {
    const payer = payerByName.get(name);
    if (!payer) return;
    await db.update(payers).set({
      notes: appendText(payer.notes || "", note),
      contractEvidence: evidence ? appendText(payer.contractEvidence || "", evidence) : payer.contractEvidence,
      updatedAt: now,
    }).where(eq(payers.id, payer.id));
  }

  const uhcBehavioralEvidence =
    "UHC representative Justine L confirmed that EPC may use the same TIN for medical and behavioral-health participation because behavioral contracting is handled through Optum; reference 187264798. A letter of intent and W-9 are required to start behavioral contracting.";
  await appendPayerNote("UnitedHealthcare", uhcBehavioralEvidence, uhcBehavioralEvidence);
  await appendPayerNote("UnitedHealthcare Medicare Advantage", uhcBehavioralEvidence);

  const aetnaBehavioralNote =
    "Aetna behavioral-health contracting inquiry was submitted through Aetna's online workflow. Case 58835956 remains the follow-up reference; participation and effective dates are not yet confirmed.";
  await appendPayerNote("Aetna", aetnaBehavioralNote, aetnaBehavioralNote);
  await appendPayerNote("Aetna Commercial/Whole Health", aetnaBehavioralNote, aetnaBehavioralNote);

  const evernorthNote =
    "Evernorth advised that behavioral-health contracting reopens September 1, 2026. Next action: submit the clinic/group application, then complete each provider application and link approved providers to EPC's TIN and agreement.";
  await appendPayerNote("Cigna", evernorthNote, evernorthNote);
  await appendPayerNote("Cigna Commercial", evernorthNote, evernorthNote);

  for (const name of ["Humana", "Humana Medicare Advantage", "Molina Healthcare", "Molina Medicare Advantage"]) {
    const payer = payerByName.get(name);
    if (!payer) continue;
    await db.update(payers).set({
      contractStatus: "Blocked — Medicare ID required",
      notes: appendText(payer.notes || "", "Contracting cannot be completed for affected providers until their current individual Medicare ID/PTAN is verified and supplied. Do not treat this blocker as network approval."),
      updatedAt: now,
    }).where(eq(payers.id, payer.id));
  }

  const firstHealth = payerByName.get("First Health Network");
  if (firstHealth) {
    const evidence = "EPC's First Health network application was sent in late August 2026; acknowledgment, provider loading, and effective dates remain pending.";
    await db.update(payers).set({
      contractStatus: "Application Submitted — Awaiting Response",
      contractEvidence: appendText(firstHealth.contractEvidence || "", evidence),
      notes: appendText(firstHealth.notes || "", evidence),
      updatedAt: now,
    }).where(eq(payers.id, firstHealth.id));
    await db.update(credentials).set({
      status: "Application Submitted",
      priority: "High",
      assignedTo: "John",
      nextAction: "Follow up with First Health for acknowledgment, provider-roster requirements, and provider-specific effective dates.",
      evidenceReference: evidence,
      notes: "Submission is recorded; network participation is not yet confirmed.",
      updatedAt: now,
    }).where(eq(credentials.payerId, firstHealth.id));
  }

  const curative = payerByName.get("Curative");
  if (curative) {
    const evidence = "EPC accepted Curative's offered rates and returned the requested contracting forms. A fully executed agreement and provider-specific effective dates remain pending.";
    await db.update(payers).set({
      contractStatus: "Contracting Forms Returned — Pending Execution",
      contractEvidence: appendText(curative.contractEvidence || "", evidence),
      notes: appendText(curative.notes || "", evidence),
      updatedAt: now,
    }).where(eq(payers.id, curative.id));
    await db.update(credentials).set({
      status: "In Progress",
      priority: "High",
      assignedTo: "John / Gloria",
      nextAction: "Follow up for the fully executed Curative agreement, provider loading, and provider-specific effective dates.",
      evidenceReference: evidence,
      notes: "Rates were accepted and forms returned; this is not yet proof of active participation.",
      updatedAt: now,
    }).where(eq(credentials.payerId, curative.id));
  }

  let sana = payerByName.get("Sana Benefits");
  if (!sana) {
    await db.insert(payers).values({
      name: "Sana Benefits",
      category: "Commercial",
      trackingMode: "Active",
      networks: "Sana Benefits employer health plans",
      contractStatus: "Application Submitted — Awaiting Confirmation",
      contractEvidence: "Completed EPC provider roster and signed W-9 submitted to Sana Benefits on August 25, 2026.",
      contractEvidenceDate: "2026-08-25",
      verificationRule: "Await Sana's receipt confirmation, additional requirements, provider loading, and effective dates before treating EPC as in network.",
      relevance: "Independent enrollment",
      scope: "Commercial / employer health plans",
      notes: "Website supplied on the roster: houstondiabetescenter.com.",
      updatedAt: now,
    }).onConflictDoNothing();
    [sana] = await db.select().from(payers).where(eq(payers.name, "Sana Benefits")).limit(1);
  }
  if (sana) {
    for (const provider of providerRows) {
      await db.insert(credentials).values({
        providerId: provider.id,
        payerId: sana.id,
        status: "Application Submitted",
        priority: "High",
        assignedTo: "John / Gloria",
        nextAction: "Confirm Sana received the roster and W-9; supply any additional requirements and obtain provider-specific effective dates.",
        evidenceReference: "Completed EPC provider roster and signed W-9 submitted to Sana Benefits on August 25, 2026.",
        notes: "Submission recorded; network participation is not yet confirmed.",
        updatedAt: now,
      }).onConflictDoNothing();
    }
  }

  const [eftSetting] = await db.select().from(settings).where(eq(settings.key, "eftEraRecords")).limit(1);
  let eftRecords: EftRecord[] = [];
  try {
    const parsed = JSON.parse(eftSetting?.value || "[]");
    if (Array.isArray(parsed)) eftRecords = parsed;
  } catch {
    eftRecords = [];
  }
  const eftByPayer = new Map(eftRecords.map((record) => [Number(record.payerId), record]));
  const patchEft = (name: string, patch: Partial<EftRecord>, note: string) => {
    const payer = payerByName.get(name);
    if (!payer) return;
    const existing = eftByPayer.get(payer.id);
    if (!existing) return;
    eftByPayer.set(payer.id, { ...existing, ...patch, notes: appendText(existing.notes || "", note), updatedAt: now });
  };

  patchEft("UnitedHealthcare", {
    eftStatus: "Active",
    eraStatus: "Active",
    clearinghouse: "Optum Pay / Claim.MD",
    confirmationNumber: "INT-184494420 / portal confirmation",
    followUpDate: "",
    assignedTo: "John",
  }, "John confirmed by logging into Optum Pay on August 31, 2026 that EPC is enrolled for EFT and ERA. Next control: confirm the first ACH payment and matching 835 delivery in Claim.MD.");
  patchEft("Cigna", {
    eftStatus: "Active",
    eraStatus: "Active",
    clearinghouse: "Cigna for HCP / Claim.MD",
    confirmationNumber: "Cigna portal / Claim.MD confirmation",
    followUpDate: "",
    assignedTo: "John",
  }, "EPC confirmed Cigna EFT and ERA enrollment. Continue verifying that the first ACH and matching 835 are received and reconciled through Claim.MD.");
  patchEft("Humana", {
    eftStatus: "Active",
    eraStatus: "Active",
    clearinghouse: "Availity / Claim.MD",
    confirmationNumber: "EFT 2088671 / ERA 2088669",
    followUpDate: "",
    assignedTo: "John",
  }, "Humana EFT and ERA remain approved. Confirm the first ACH and corresponding 835 in Claim.MD.");
  patchEft("Ambetter", {
    eftStatus: "Payer Review",
    assignedTo: "John / Gloria",
  }, "Latest action remains follow-up with Gloria for the PaySpan/Zelis account-release and enrollment status; no active date should be recorded until the payment network confirms completion.");

  await db.insert(settings).values({ key: "eftEraRecords", value: JSON.stringify([...eftByPayer.values()]), updatedAt: now }).onConflictDoUpdate({
    target: settings.key,
    set: { value: JSON.stringify([...eftByPayer.values()]), updatedAt: now },
  });

  await db.insert(activity).values([
    { action: "Confirmed", entityType: "eft-era", entityName: "UHC / Optum Pay", detail: "EPC EFT and ERA enrollment confirmed by portal login on August 31, 2026; first ACH and Claim.MD 835 reconciliation remain monitoring controls." },
    { action: "Confirmed", entityType: "eft-era", entityName: "Cigna EFT / ERA", detail: "EPC confirmed Cigna EFT and ERA enrollment; first ACH and Claim.MD 835 reconciliation remain monitoring controls." },
    { action: "Confirmed", entityType: "eft-era", entityName: "Humana EFT / ERA", detail: "Humana EFT 2088671 and ERA 2088669 recorded as approved." },
    { action: "Updated", entityType: "payer", entityName: "Behavioral-health contracting", detail: "UHC/Optum reference 187264798, Aetna case 58835956, and Evernorth September 1 reopening instructions recorded without marking participation active." },
    { action: "Updated", entityType: "payer", entityName: "Independent applications", detail: "Sana roster/W-9 submission, First Health submission, Curative returned forms, and Humana/Molina Medicare-ID blockers recorded." },
  ]);

  await db.insert(settings).values({ key: KEY, value: VERSION, updatedAt: now }).onConflictDoUpdate({
    target: settings.key,
    set: { value: VERSION, updatedAt: now },
  });
}
