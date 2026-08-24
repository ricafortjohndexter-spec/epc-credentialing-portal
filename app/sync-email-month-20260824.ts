import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, credentials, payers, providers, settings } from "@/db/schema";

const SYNC_KEY = "emailMonthSync20260724_20260824";
const SYNC_VERSION = "2026-08-24-v1";
const PROVIDER_RELATIONS_METHOD = "Insurance/Payer Provider Relations";
const MHMD_EVIDENCE = "MHMD Managed Care Contracts Flyer, revised June 12, 2026";

const managedPayerNames = [
  "Aetna",
  "Blue Cross Blue Shield",
  "Community Health Choice",
  "Cigna",
  "EHN PPO",
  "Healthcare Highways Logix/Sync",
  "Imagine Health",
  "Memorial Hermann",
  "UnitedHealthcare",
  "Aetna Medicare Advantage",
  "Memorial Hermann Medicare Advantage",
  "UnitedHealthcare Medicare Advantage",
  "Wellpoint Medicare Advantage",
];

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

export async function applyEmailMonthSync() {
  const db = await getDb();
  const [done] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, SYNC_KEY))
    .limit(1);
  if (done?.value === SYNC_VERSION) return;

  const now = new Date().toISOString();
  const providerRows = await db.select().from(providers);
  const payerRows = await db.select().from(payers);
  const payerByName = new Map(payerRows.map((payer) => [payer.name, payer]));
  const providerByNpi = new Map(providerRows.map((provider) => [provider.npi, provider]));
  const managedPayerIds = payerRows.filter((payer) => managedPayerNames.includes(payer.name)).map((payer) => payer.id);

  // MHMD group-level policy and evidence reconciliation from August 12-13 email responses.
  for (const name of managedPayerNames) {
    const payer = payerByName.get(name);
    if (!payer) continue;
    const policyNote =
      "MHMD credentials individual providers under the group TIN and each individual NPI; the group NPI itself is not separately credentialed by MHMD. Verify payer loading and provider-specific effective dates before treating a provider as active.";
    await db
      .update(payers)
      .set({
        contractStatus: "Delegated contract on file",
        contractEvidence: appendText(payer.contractEvidence || "", MHMD_EVIDENCE),
        contractEvidenceDate: "2026-06-12",
        verificationRule: policyNote,
        notes: appendText(payer.notes || "", policyNote),
        updatedAt: now,
      })
      .where(eq(payers.id, payer.id));
  }

  // MyBlue Health is specifically not available for a direct EPC contract while participating through MHMD.
  const bcbs = payerByName.get("Blue Cross Blue Shield");
  if (bcbs) {
    const evidence =
      "MHMD email 2026-08-12: MHMD is not credentialed with BCBS MyBlue Health and advised that providers participating through MHMD cannot obtain a direct MyBlue Health contract. BCBSTX provider IDs were still unassigned on 2026-08-21. BCBSTX received EPC provider onboarding request case 23455484 on 2026-08-24; prior EPC application reference 929236 remains part of the onboarding history.";
    await db
      .update(payers)
      .set({
        contractEvidence: appendText(bcbs.contractEvidence || "", evidence),
        contractEvidenceDate: "2026-08-24",
        notes: appendText(
          bcbs.notes || "",
          "MyBlue Health is not a direct-contract path for EPC under the current MHMD participation. Current BCBSTX onboarding is still in progress; case 23455484 was received August 24, 2026."
        ),
        updatedAt: now,
      })
      .where(eq(payers.id, bcbs.id));

    await db
      .update(credentials)
      .set({
        status: "In Progress",
        priority: "High",
        assignedTo: "John",
        nextAction:
          "Monitor BCBSTX onboarding case 23455484 and application 929236. When individual BCBS provider IDs/NPI loading are confirmed, verify the exact network and effective date directly with BCBSTX before billing under EPC.",
        referenceNumber: "Case 23455484 / Application 929236",
        evidenceReference: evidence,
        notes:
          "Email review confirms BCBS provider IDs were not assigned as of August 21. A BCBS claim review on August 11 also indicated incomplete credentialing/contracting and a provider Type 1 NPI not yet linked to the EPC TIN; patient details are intentionally omitted here.",
        updatedAt: now,
      })
      .where(eq(credentials.payerId, bcbs.id));
  }

  // Superior/Ambetter contracting: newest email supersedes the earlier 'draft only' status.
  const ambetter = payerByName.get("Ambetter");
  if (ambetter) {
    const evidence =
      "Superior HealthPlan confirmed receipt of EPC's network participation request on 2026-07-27 and asked for a completed W-9 so the participation agreement could be prepared. EPC sent the completed W-9 to Contract Negotiator Semetra Brazle on 2026-08-24 and requested preparation of the Ambetter from Superior HealthPlan agreement.";
    await db
      .update(payers)
      .set({
        contractStatus: "In Progress",
        contractEvidence: evidence,
        contractEvidenceDate: "2026-08-24",
        verificationRule:
          "Do not submit a duplicate participation request. Await Superior's participation agreement, review reimbursement/contract terms, then complete any provider credentialing or roster requirements and verify effective dates before treating EPC as in network.",
        phone: "210-753-8670",
        email: "Semetra.Brazle@SuperiorHealthPlan.com",
        notes:
          "Completed EPC W-9 sent August 24, 2026. Current stage: agreement preparation pending with Superior. Contracting and PaySpan EFT cleanup are separate workstreams.",
        updatedAt: now,
      })
      .where(eq(payers.id, ambetter.id));
    await db
      .update(credentials)
      .set({
        status: "In Progress",
        priority: "High",
        assignedTo: "John / Gloria",
        nextAction:
          "Await the Ambetter/Superior participation agreement after the W-9 submission; review terms, return the agreement as appropriate, then complete provider credentialing/roster loading and verify individual effective dates.",
        referenceNumber: "I-193368790",
        evidenceReference: evidence,
        notes: "W-9 was sent August 24, 2026. EPC is not yet confirmed in network; agreement and provider loading remain pending.",
        updatedAt: now,
      })
      .where(eq(credentials.payerId, ambetter.id));
  }

  // MHMD CI approvals: approval is not the same as payer loading. Preserve stronger direct payer confirmations if present.
  const mhmdProviderUpdates = [
    {
      npi: "1396273595",
      status: "In Progress",
      evidence:
        "MHMD Credentials Committee approved Radha Jayakumar Bernander, PA for MHMD membership and Clinical Integration participation on 2026-08-19; approval letter dated 2026-08-21. MHMD stated it would transmit her credentialing status to opted-in payers immediately, but payer loading can take up to 90 days.",
      note:
        "MHMD CI approved August 19. Confirm each payer's loading/effective date before billing; the letter specifically states Molina and BCBS are exceptions to retrospective effective-date handling.",
    },
    {
      npi: "1932714722",
      status: "In Progress",
      evidence:
        "MHMD Credentials Committee approved Kruti Patel-Konasagar, NP for MHMD membership and Clinical Integration participation on 2026-08-19; approval letter dated 2026-08-21. MHMD stated it would transmit her credentialing status to opted-in payers immediately, but payer loading can take up to 90 days.",
      note:
        "MHMD CI approved August 19. Confirm each payer's loading/effective date before billing; the letter specifically states Molina and BCBS are exceptions to retrospective effective-date handling.",
    },
    {
      npi: "1942573340",
      status: "In Progress",
      evidence:
        "MHMD Credentials Committee approved Nadia Younus, PA for MHMD membership and Clinical Integration participation on 2026-08-19; approval letter dated 2026-08-21. MHMD stated it would transmit her credentialing status to opted-in payers immediately, but payer loading can take up to 90 days.",
      note:
        "MHMD CI approved August 19. Confirm each payer's loading/effective date before billing; the letter specifically states Molina and BCBS are exceptions to retrospective effective-date handling.",
    },
    {
      npi: "1790929099",
      status: "Pending",
      evidence:
        "MHMD Credentialing Specialist Audel Acosta confirmed on 2026-08-21 that Shannon Gregorek's application had been submitted for clearance and was pending approval; he hoped it would clear by the end of the following week.",
      note: "MHMD clearance pending as of August 21, 2026. Follow up if no approval letter/status update is received.",
    },
  ];

  if (managedPayerIds.length) {
    for (const update of mhmdProviderUpdates) {
      const provider = providerByNpi.get(update.npi);
      if (!provider) continue;
      const rows = await db
        .select()
        .from(credentials)
        .where(eq(credentials.providerId, provider.id));
      for (const row of rows.filter((record) => managedPayerIds.includes(record.payerId))) {
        const hasDirectConfirmation =
          row.status === "Approved" &&
          row.verificationMethod === PROVIDER_RELATIONS_METHOD &&
          Boolean(row.effectiveDate && row.networkName && row.providerRelationsContact);
        if (hasDirectConfirmation) {
          await db
            .update(credentials)
            .set({
              evidenceReference: appendText(row.evidenceReference || "", update.evidence),
              notes: appendText(row.notes || "", update.note),
              updatedAt: now,
            })
            .where(eq(credentials.id, row.id));
        } else {
          await db
            .update(credentials)
            .set({
              status: update.status,
              priority: "High",
              assignedTo: "John",
              nextAction:
                update.status === "Pending"
                  ? "Follow up with MHMD Credentialing for clearance/approval, then verify payer-specific loading and effective dates."
                  : "MHMD CI approval is on file. Verify the provider's exact network loading and effective date directly with each payer before treating participation as active.",
              evidenceReference: appendText(row.evidenceReference || "", update.evidence),
              notes: appendText(row.notes || "", update.note),
              updatedAt: now,
            })
            .where(eq(credentials.id, row.id));
        }
      }
    }
  }

  // Medicare group enrollment correction request and individual PTAN/reassignment work.
  const medicare = payerByName.get("Medicare Part B (Original Medicare)");
  if (medicare) {
    const medicareEvidence =
      "Novitas correction request dated 2026-08-03 for PECOS application T052920260001333, NPI 1033286380. The email requested IRS legal-name/EIN evidence, ownership-role corrections, CMS-588 EFT documentation, individual Medicare benefit reassignments, CMS-460, and a new certification statement. The application name shown in the Novitas email was PEARLAND ENDOCRINOLOGY AND PSYCHIATRY CENTER, LLC. No later completion notice for this tracking ID was found in the reviewed email window.";
    await db
      .update(payers)
      .set({
        contractStatus: "Corrections / enrollment verification required",
        contractEvidence: appendText(medicare.contractEvidence || "", medicareEvidence),
        contractEvidenceDate: "2026-08-24",
        verificationRule:
          "Confirm the status of PECOS tracking ID T052920260001333 and separately verify each provider's current individual Medicare enrollment/PTAN and reassignment to EPC. Do not treat a historical PTAN as current without verification.",
        notes: appendText(
          medicare.notes || "",
          "Novitas requested corrections August 3. The organization name appearing in that Novitas notice should be reconciled with EPC's current enrollment/legal-business records rather than silently assumed to be identical."
        ),
        updatedAt: now,
      })
      .where(eq(payers.id, medicare.id));
    const medicareRows = await db.select().from(credentials).where(eq(credentials.payerId, medicare.id));
    for (const row of medicareRows) {
      await db
        .update(credentials)
        .set({
          priority: "High",
          assignedTo: "John / Gloria",
          nextAction:
            "Check Novitas/PECOS correction status for T052920260001333 and verify this provider's active Medicare enrollment/PTAN plus reassignment to the correct EPC group/TIN before supplying Medicare IDs to MHMD.",
          referenceNumber: "PECOS T052920260001333",
          evidenceReference: appendText(row.evidenceReference || "", medicareEvidence),
          updatedAt: now,
        })
        .where(eq(credentials.id, row.id));
    }
  }

  // EFT / ERA: merge newer email-supported facts into the existing payment tracker without deleting other payer records.
  const [eftSetting] = await db.select().from(settings).where(eq(settings.key, "eftEraRecords")).limit(1);
  let eftRecords: EftRecord[] = [];
  try {
    const parsed = JSON.parse(eftSetting?.value || "[]");
    if (Array.isArray(parsed)) eftRecords = parsed;
  } catch {
    eftRecords = [];
  }
  const eftByPayer = new Map(eftRecords.map((record) => [Number(record.payerId), record]));

  const patchEft = (payerName: string, patch: Partial<EftRecord>, note: string) => {
    const payer = payerByName.get(payerName);
    if (!payer) return;
    const existing = eftByPayer.get(payer.id) || {
      payerId: payer.id,
      eftStatus: "Not Started",
      eraStatus: "Not Started",
      enrollmentMethod: "Payer portal",
      portalUrl: payer.portalUrl || "",
      clearinghouse: "",
      submittedDate: "",
      effectiveDate: "",
      confirmationNumber: "",
      assignedTo: "Unassigned",
      followUpDate: "",
      notes: "",
      updatedAt: "",
    };
    eftByPayer.set(payer.id, {
      ...existing,
      ...patch,
      notes: appendText(existing.notes || "", note),
      updatedAt: now,
    });
  };

  patchEft(
    "Aetna",
    { eraStatus: "Active", effectiveDate: "2026-06-01", clearinghouse: "Claim.MD", assignedTo: "John" },
    "Email review: Aetna ERA was verified as already registered effective June 1, 2026; no resubmission was needed."
  );
  patchEft(
    "Blue Cross Blue Shield",
    { enrollmentMethod: "Availity Essentials", confirmationNumber: "EFT registration 32612723", assignedTo: "John" },
    "Email review: BCBSTX EFT registration 32612723 was submitted through Availity on August 3, 2026. Keep later tracker evidence for the current completion status; this email is the submission-stage evidence."
  );
  patchEft(
    "Cigna",
    { eftStatus: "Active", eraStatus: "Active", clearinghouse: "Claim.MD", assignedTo: "John" },
    "Email review: Cigna portal access was established in early August, an EFT-change notification was received, and Claim.MD received a Cigna ERA during the review window, supporting active payment/remittance routing."
  );
  patchEft(
    "Humana",
    {
      eftStatus: "Active",
      eraStatus: "Active",
      enrollmentMethod: "Availity Essentials",
      clearinghouse: "Claim.MD",
      confirmationNumber: "EFT 2088671 / ERA 2088669",
      assignedTo: "John",
    },
    "Humana processed the ERA delivery-method change and subsequently confirmed the EFT account-information change; EPC's internal email update recorded both ERA and EFT as enrolled by August 20, 2026."
  );
  patchEft(
    "TRICARE For Life",
    {
      eftStatus: "Active",
      eraStatus: "Active",
      enrollmentMethod: "Other",
      clearinghouse: "WPS / Claim.MD",
      submittedDate: "2026-08-11",
      confirmationNumber: "WPS EFT/ERA enrollment 507492380",
      assignedTo: "John",
    },
    "TRICARE For Life EFT was approved August 11. The ERA rejection for an invalid Trading Partner ID was corrected; WPS then reported EFT/ERA enrollment 507492380 received and processed. EDI 1500 integration was also submitted."
  );
  patchEft(
    "TRICARE West (TriWest)",
    {
      eftStatus: "Not Started",
      eraStatus: "Enrollment Submitted",
      enrollmentMethod: "Availity Essentials",
      clearinghouse: "PGBA / Claim.MD",
      submittedDate: "2026-08-06",
      confirmationNumber: "Payer 99726 / Availity customer 69911",
      assignedTo: "John",
    },
    "TriWest ERA application was submitted August 6 and was waiting for approval. EFT cannot be completed until EPC has a 10-digit PGBA check number issued within the prior 60 days; EPC had no prior PGBA remittance, so EFT must wait for the first paper check. EDI 1500 was submitted June 2."
  );
  patchEft(
    "UnitedHealthcare",
    {
      eftStatus: "Enrollment Submitted",
      enrollmentMethod: "Payer portal",
      clearinghouse: "Optum Pay",
      submittedDate: "2026-08-20",
      confirmationNumber: "INT-184494420 / rep Klein",
      assignedTo: "John",
      followUpDate: "2026-08-27",
    },
    "The August email history documents Optum/One Healthcare ID account cleanup, correction of EPC's TIN registration from third-party billing service to practice group, and subsequent Optum Pay enrollment submission. Await approval/security-PIN instructions; no passwords, OTPs, recovery codes or PINs are stored here."
  );
  patchEft(
    "Ambetter",
    { eftStatus: "Payer Review", enrollmentMethod: "Other", clearinghouse: "PaySpan", submittedDate: "2026-08-21", assignedTo: "John / Gloria" },
    "PaySpan denied the unregister request until it came directly from the person signing the company-letterhead request. Gloria then resent the signed request from her work email with the attachment on August 21. Account release/reset remains pending before Ambetter EFT can proceed."
  );
  patchEft(
    "CHAMPVA",
    { eftStatus: "Active", eraStatus: "Enrollment Submitted", enrollmentMethod: "Other", clearinghouse: "VA-FSC / Claim.MD", submittedDate: "2026-08-18", confirmationNumber: "VCOM-1315179", assignedTo: "Gloria / John" },
    "VA-FSC resolved vendor-file case VCOM-1315179 and confirmed the payment webform complete. Claim.MD received the CHAMPVA ERA enrollment during the same period; monitor for ERA activation and the first 835."
  );
  patchEft(
    "Community Health Choice",
    { eftStatus: "Payer Review", eraStatus: "Enrollment Submitted", enrollmentMethod: "Other", clearinghouse: "ECHO Health / Claim.MD", submittedDate: "2026-08-17", confirmationNumber: "ERA payer ID 60495", assignedTo: "John" },
    "EPC's August payment-network work identified ECHO for CHC payments. VCC opt-out/paper-check routing was used while waiting for the first payment needed to authenticate EFT; ERA enrollment was received and remained pending final activation."
  );
  patchEft(
    "HealthSpring / Cigna Medicare Advantage",
    { eftStatus: "Active", enrollmentMethod: "Other", clearinghouse: "Zelis", submittedDate: "2026-08-17", assignedTo: "John / Gloria" },
    "August payment-network follow-up recorded HealthSpring/Cigna Medicare Advantage EFT through Zelis as approved. Network participation remains a separate verification item."
  );
  patchEft(
    "Molina Healthcare",
    { eftStatus: "Payer Review", eraStatus: "Payer Review", enrollmentMethod: "Other", clearinghouse: "PaySpan or ECHO / Claim.MD", assignedTo: "John / Gloria" },
    "The August 14 payment-network call summary routed Molina Marketplace toward PaySpan, conflicting with prior ECHO guidance. Resolve the payer-designated EFT vendor before enrolling and preserve Claim.MD as the intended ERA/835 receiver."
  );
  patchEft(
    "Oscar Health",
    { eftStatus: "Payer Review", enrollmentMethod: "Payer portal", clearinghouse: "Direct Oscar ACH/ERA", assignedTo: "John" },
    "The August payment-network call found Oscar was not available through ePayment Center; direct Oscar payment enrollment still requires completion/verification."
  );
  patchEft(
    "Healthcare Highways Logix/Sync",
    { eftStatus: "Payer Review", enrollmentMethod: "Other", clearinghouse: "Zelis / VPay / underlying TPA", assignedTo: "John" },
    "The August payment-network review found Healthcare Highways was not available through ePayment Center. Verify the actual paying route/TPA and any prior Zelis/VPay submission before marking EFT active."
  );
  patchEft(
    "MultiPlan / PHCS",
    { eftStatus: "Payer Review", enrollmentMethod: "Other", clearinghouse: "Underlying payer / TPA", assignedTo: "John" },
    "MultiPlan/PHCS was not available through ePayment Center and may represent the network rather than the paying entity. Identify the actual payer/TPA from the member card or remittance before EFT enrollment."
  );
  patchEft(
    "First Health Network",
    { eftStatus: "Payer Review", enrollmentMethod: "Other", clearinghouse: "Underlying payer / TPA", assignedTo: "John" },
    "First Health was not available through ePayment Center and may represent the network rather than the paying entity. Identify the actual payer/TPA before EFT enrollment."
  );

  await db
    .insert(settings)
    .values({ key: "eftEraRecords", value: JSON.stringify([...eftByPayer.values()]), updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify([...eftByPayer.values()]), updatedAt: now } });

  // Activity timeline: meaningful email-supported changes only. Authentication codes, passwords, bank details, patient PHI and SSNs are excluded.
  const timeline = [
    ["2026-07-27", "Received", "payer", "Ambetter from Superior", "Superior confirmed EPC's network participation request and requested a W-9 so the participation agreement could be prepared."],
    ["2026-07-28", "Received", "system", "MHMD Network Operations", "MHMD Q1 FY27 Network Operations newsletter received, including a BCBSTX Commercial / Blue Advantage Marketplace renewal fee-schedule communication."],
    ["2026-07-29", "Updated", "provider-roster", "MHMD group roster", "Cindy Laverde and Elizabeth Leal were added/requested on the MHMD group roster and the updated EPC roster was sent to MHMD."],
    ["2026-07-30", "Received", "provider-roster", "MHMD group roster", "Jennifer Mauger confirmed the updated group roster was received and instructed EPC to send all pending provider ID numbers to MHMD Credentialing and Data Management once received."],
    ["2026-08-03", "Received", "credentialing", "Medicare PECOS", "Novitas issued a correction request for PECOS tracking ID T052920260001333 / NPI 1033286380. Required corrections include legal-name/EIN evidence, ownership roles, CMS-588/EFT documentation, reassignments, CMS-460, and a new certification statement."],
    ["2026-08-03", "Submitted", "eft-era", "BCBSTX EFT", "Availity EFT enrollment action recorded under registration ID 32612723."],
    ["2026-08-03", "Received", "provider", "Tess Chamakkala", "DEA renewal receipt and certificate were forwarded for credentialing-file maintenance; subsequent internal email indicated the document was uploaded to her profile."],
    ["2026-08-05", "Changed", "eft-era", "Optum payer enrollment", "Optum Payer Enrollment changes/cancellations were processed during cleanup of EPC payment-enrollment access and account configuration."],
    ["2026-08-06", "Enabled", "payer-portal", "Cigna for HCP", "Cigna for HCP access was established for EPC payment/enrollment work."],
    ["2026-08-07", "Requested", "credentialing", "MHMD pending items", "MHMD requested sponsoring physician statements for Nadia Younus, Radha Bernander and Kruti Patel-Konasagar; Radha's employment-gap explanation; Kruti's NPI taxonomy correction; and confirmation of additional EPC practice locations."],
    ["2026-08-11", "Submitted", "credentialing", "MHMD pending items", "Completed sponsoring physician statements were sent to MHMD and Radha Bernander's employment-gap explanation was supplied."],
    ["2026-08-11", "Verified", "payer", "BCBSTX transition", "BCBS claim follow-up indicated incomplete credentialing/contracting and a provider NPI not yet linked to EPC's TIN. Patient-specific claim information is intentionally excluded from the portal."],
    ["2026-08-11", "Updated", "eft-era", "TRICARE For Life", "EFT approved; ERA Trading Partner ID rejection corrected; EDI 1500 integration submitted."],
    ["2026-08-11", "Updated", "eft-era", "TRICARE West", "ERA had been submitted August 6 and remained pending; EFT could not be filed until EPC receives a qualifying recent PGBA paper check number."],
    ["2026-08-12", "Processed", "eft-era", "TRICARE For Life", "WPS reported EFT/ERA enrollment 507492380 received and processed after the ERA correction."],
    ["2026-08-12", "Clarified", "system", "MHMD credentialing policy", "MHMD confirmed it credentials individual providers under the group TIN and individual NPI, not under the group NPI. MHMD also stated MyBlue Health cannot be directly contracted by providers participating through MHMD."],
    ["2026-08-12", "Clarified", "system", "Mental Health contracting", "MHMD advised that Mental Health / Behavioral Health providers outside MHMD's payer contracts need a separate TIN to avoid contract-selection/routing conflicts and stated the separate TIN is required for the mixed contracting approach."],
    ["2026-08-13", "Clarified", "system", "Independent Endocrinology contracting", "MHMD confirmed EPC may obtain direct contracts for Endocrinology with insurance plans that MHMD is not contracted with."],
    ["2026-08-13", "Received", "system", "MHMD managed-care evidence", "Current MHMD managed-care contract flyer was received with revision date June 12, 2026."],
    ["2026-08-14", "Verified", "eft-era", "Payment-network routing", "EPC's payment-network call summary separated PaySpan, Zelis and other payer routes and identified several networks not available through ePayment Center; payer-specific verification remains required where routes conflicted."],
    ["2026-08-14", "Submitted", "system", "EPC Lab / Availity", "EPC Lab Availity organization registration work was initiated under organization/party ID 63892496."],
    ["2026-08-18", "Required", "credentialing", "EPC group NPI taxonomy", "MHMD required group NPI 1033286380 to use taxonomy 207RE0101X Internal Medicine - Endocrinology, Diabetes & Metabolism and remove the Multi-Specialty Group and Specialist taxonomies before it could finalize pending files."],
    ["2026-08-18", "Submitted", "credentialing", "EPC group NPI taxonomy", "NPPES change request was submitted with tracking number 11292006864397. The NPI Enumerator email stated processing could be quick if no verification was needed or take up to 30 days if verification was required."],
    ["2026-08-18", "Completed", "eft-era", "CHAMPVA EFT", "VA-FSC vendor-file payment setup was completed and case VCOM-1315179 was resolved/closed; ERA enrollment remained a separate Claim.MD activation item."],
    ["2026-08-20", "Completed", "eft-era", "Humana EFT / ERA", "Email history confirmed Humana processed the ERA delivery-method change and EFT account-information change; EPC recorded both payment and remittance enrollment as completed."],
    ["2026-08-21", "Approved", "credentialing", "Radha Bernander - MHMD CI", "MHMD approval letter confirmed Credentials Committee approval on August 19, 2026. Payer loading may take up to 90 days, so individual payer effective dates still require verification."],
    ["2026-08-21", "Approved", "credentialing", "Kruti Patel-Konasagar - MHMD CI", "MHMD approval letter confirmed Credentials Committee approval on August 19, 2026. Payer loading may take up to 90 days, so individual payer effective dates still require verification."],
    ["2026-08-21", "Approved", "credentialing", "Nadia Younus - MHMD CI", "MHMD approval letter confirmed Credentials Committee approval on August 19, 2026. Payer loading may take up to 90 days, so individual payer effective dates still require verification."],
    ["2026-08-21", "Pending", "credentialing", "Shannon Gregorek - MHMD", "MHMD stated Shannon's application had been submitted for clearance and was pending approval, with an expected update by around the end of the following week."],
    ["2026-08-21", "Pending", "payer", "BCBSTX provider IDs", "EPC confirmed no individual BCBS provider IDs had been assigned yet. MHMD requires pending IDs to be forwarded once received."],
    ["2026-08-21", "Resubmitted", "eft-era", "PaySpan account cleanup", "After PaySpan said the unregister request had to come directly from the company-letterhead signer, Gloria resent the signed request from her work email. Account release/reset remains pending."],
    ["2026-08-24", "Sent", "payer", "Ambetter from Superior", "Completed EPC W-9 was sent to Semetra Brazle with a request to proceed with preparation of the participation agreement."],
    ["2026-08-24", "Received", "payer", "BCBSTX onboarding", "BCBSTX confirmed receipt of EPC's provider onboarding request under case number 23455484."],
    ["2026-08-24", "Rejected", "system", "EPC Lab / Availity organization", "Availity reported it could not approve the organization-account application. The email directs EPC to Manage My Organization > Rejected > Notes for the specific reason; the email itself does not state the rejection reason."],
    ["2026-08-24", "Resolved", "system", "Availity Security Case 18827404", "Availity marked Security Case 18827404 resolved for organization/party ID 63892496. This is separate from the organization-account rejection and does not by itself mean the registration was approved."],
  ] as const;

  await db.insert(activity).values(
    timeline.map(([date, actionName, entityType, entityName, detail]) => ({
      action: actionName,
      entityType,
      entityName,
      detail: `${date}: ${detail}`,
      createdAt: `${date} 12:00:00`,
    }))
  );

  await db
    .insert(settings)
    .values({ key: "lastEmailReview", value: "2026-08-24", updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: "2026-08-24", updatedAt: now } });
  await db
    .insert(settings)
    .values({ key: "emailReviewWindow", value: "2026-07-24 through 2026-08-24", updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: "2026-07-24 through 2026-08-24", updatedAt: now } });
  await db
    .insert(settings)
    .values({ key: "emailReviewPrivacyRule", value: "Operational status only; exclude passwords, OTPs, SSNs, bank account numbers, patient PHI and signed-document contents.", updatedAt: now })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: "Operational status only; exclude passwords, OTPs, SSNs, bank account numbers, patient PHI and signed-document contents.",
        updatedAt: now,
      },
    });

  await db
    .insert(settings)
    .values({ key: SYNC_KEY, value: SYNC_VERSION, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: SYNC_VERSION, updatedAt: now } });
}
