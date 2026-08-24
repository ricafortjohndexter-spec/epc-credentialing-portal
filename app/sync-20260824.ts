import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, credentials, payers, providers, settings } from "@/db/schema";

const SYNC_KEY = "operationalSync20260824";
const SYNC_VERSION = "2026-08-24-v1";
const MHMD_EVIDENCE = "MHMD Managed Care Contracts Flyer, revised June 12, 2026";
const PROVIDER_RELATIONS_METHOD = "Insurance/Payer Provider Relations";

type PayerSpec = {
  name: string;
  category: string;
  trackingMode: string;
  networks: string;
  contractStatus: string;
  contractEvidence: string;
  contractEvidenceDate: string;
  verificationRule: string;
  relevance: string;
  scope: string;
  portalUrl: string;
  joinUrl: string;
  phone: string;
  email: string;
  notes: string;
  sourceUrl: string;
};

type EftRecordSeed = {
  payerName: string;
  eftStatus: string;
  eraStatus: string;
  enrollmentMethod: string;
  portalUrl?: string;
  clearinghouse?: string;
  submittedDate?: string;
  effectiveDate?: string;
  confirmationNumber?: string;
  assignedTo?: string;
  followUpDate?: string;
  notes: string;
};

export async function applyLatestPortalSync() {
  const db = await getDb();
  const [alreadyApplied] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, SYNC_KEY))
    .limit(1);
  if (alreadyApplied?.value === SYNC_VERSION) return;

  const now = new Date().toISOString();

  const primaryLocations: Record<string, string> = {
    "1396273595": "Katy, Texas",
    "1326530668": "Houston, Texas",
    "1790929099": "Houston, Texas",
    "1629961537": "Houston, Texas",
    "1093311136": "Houston, Texas",
    "1932714722": "Katy, Texas",
    "1386629699": "Houston, Texas",
    "1558520015": "Katy, Texas",
    "1265666846": "Katy, Texas",
    "1417120221": "Houston, Texas",
    "1942573340": "Houston, Texas",
  };
  for (const [npi, location] of Object.entries(primaryLocations)) {
    await db.update(providers).set({ location, updatedAt: now }).where(eq(providers.npi, npi));
  }

  const [legacyHighways] = await db
    .select()
    .from(payers)
    .where(eq(payers.name, "Healthways Logix/Sync"))
    .limit(1);
  const [currentHighways] = await db
    .select()
    .from(payers)
    .where(eq(payers.name, "Healthcare Highways Logix/Sync"))
    .limit(1);
  if (legacyHighways && !currentHighways) {
    await db
      .update(payers)
      .set({ name: "Healthcare Highways Logix/Sync", updatedAt: now })
      .where(eq(payers.id, legacyHighways.id));
  }

  const providerRows = await db.select({ id: providers.id, npi: providers.npi }).from(providers);

  const ensurePayer = async (spec: PayerSpec) => {
    const [existing] = await db.select().from(payers).where(eq(payers.name, spec.name)).limit(1);
    if (existing) {
      await db.update(payers).set({ ...spec, updatedAt: now }).where(eq(payers.id, existing.id));
      return { ...existing, ...spec };
    }
    const [created] = await db.insert(payers).values(spec).returning();
    if (providerRows.length) {
      await db
        .insert(credentials)
        .values(
          providerRows.map((provider) => ({
            providerId: provider.id,
            payerId: created.id,
            status: spec.contractStatus === "In Progress" ? "In Progress" : "Not Started",
            priority: spec.contractStatus === "In Progress" ? "High" : "Normal",
            assignedTo: "Unassigned",
            nextAction: spec.verificationRule || "Review payer participation requirements and confirm the provider-specific network status.",
            evidenceReference: spec.contractEvidence,
            updatedAt: now,
          })),
        )
        .onConflictDoNothing();
    }
    return created;
  };

  const addedOrIndependentPayers: PayerSpec[] = [
    {
      name: "TRICARE For Life",
      category: "Medicare",
      trackingMode: "Active",
      networks: "TRICARE For Life / WPS",
      contractStatus: "Government payer — verify provider enrollment",
      contractEvidence: "EPC EFT/ERA Enrollment Tracker — WPS/Optum confirmations",
      contractEvidenceDate: "2026-08-11",
      verificationRule: "Verify provider enrollment and claims routing with WPS/TRICARE before treating participation as confirmed.",
      relevance: "Texas / national",
      scope: "TRICARE For Life",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "EFT and ERA have payer confirmation references. Network/provider enrollment remains separate from payment enrollment.",
      sourceUrl: "",
    },
    {
      name: "TRICARE West (TriWest)",
      category: "Commercial",
      trackingMode: "Active",
      networks: "TRICARE West / TriWest / PGBA",
      contractStatus: "In Progress",
      contractEvidence: "EPC TriWest provider roster and EFT/ERA tracker",
      contractEvidenceDate: "2026-08-24",
      verificationRule: "Continue TriWest roster/enrollment work and verify provider-specific participation. Do not store SSNs in this portal.",
      relevance: "Texas active",
      scope: "Military health / TRICARE West",
      portalUrl: "",
      joinUrl: "",
      phone: "1-800-259-0264",
      email: "",
      notes: "Provider roster updated for the 11 EPC providers on August 24, 2026. Sensitive SSNs remain outside the portal.",
      sourceUrl: "",
    },
    {
      name: "CHAMPVA",
      category: "Commercial",
      trackingMode: "Active",
      networks: "CHAMPVA / VA Financial Services Center",
      contractStatus: "Government payer — payment enrollment active",
      contractEvidence: "VA-FSC Vendor File Webform case VCOM-1315179",
      contractEvidenceDate: "2026-08-18",
      verificationRule: "Confirm provider eligibility/claims requirements separately from EFT/ERA setup.",
      relevance: "Texas / national",
      scope: "Veterans health benefits",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "VA-FSC confirmed the vendor file payment webform complete and closed case VCOM-1315179.",
      sourceUrl: "",
    },
    {
      name: "HealthSpring / Cigna Medicare Advantage",
      category: "Medicare",
      trackingMode: "Active",
      networks: "HealthSpring Medicare Advantage",
      contractStatus: "Needs verification",
      contractEvidence: "EPC EFT/ERA tracker — Zelis payment status approved",
      contractEvidenceDate: "2026-08-17",
      verificationRule: "Verify the exact HealthSpring network and provider participation independently from the EFT approval.",
      relevance: "Texas active",
      scope: "Medicare Advantage",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Payment enrollment is confirmed; network participation still requires payer verification.",
      sourceUrl: "",
    },
    {
      name: "Aetna CVS Health Marketplace",
      category: "Marketplace",
      trackingMode: "Active",
      networks: "Aetna CVS Health Marketplace / Exchange",
      contractStatus: "Needs review",
      contractEvidence: "",
      contractEvidenceDate: "",
      verificationRule: "Treat the Marketplace product separately unless the Aetna contract explicitly includes the Exchange rider.",
      relevance: "Texas active",
      scope: "Marketplace (ACA)",
      portalUrl: "https://apps.availity.com/availity/web/public.elegant.login",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Independent EPC target payer outside the MHMD-managed Aetna commercial product scope.",
      sourceUrl: "",
    },
    {
      name: "UHC TXONEX",
      category: "Marketplace",
      trackingMode: "Active",
      networks: "TXONEX Bronze / Silver / Gold EPO tiers",
      contractStatus: "Needs review",
      contractEvidence: "",
      contractEvidenceDate: "",
      verificationRule: "Verify TXONEX separately from MHMD-managed UHC commercial products.",
      relevance: "Texas active",
      scope: "Marketplace / EPO / Virtual First",
      portalUrl: "https://www.uhcprovider.com/",
      joinUrl: "",
      phone: "1-877-842-3210",
      email: "",
      notes: "Independent product scope; do not assume the MHMD UHC commercial contract covers TXONEX.",
      sourceUrl: "",
    },
    {
      name: "MultiPlan / PHCS",
      category: "Commercial",
      trackingMode: "Active",
      networks: "MultiPlan / PHCS leased network",
      contractStatus: "Needs verification",
      contractEvidence: "EPC EFT/ERA tracker — ePayment Center call 2026-08-14",
      contractEvidenceDate: "2026-08-14",
      verificationRule: "Identify the actual payer/TPA before contracting or payment enrollment; MultiPlan/PHCS may only be the leased network.",
      relevance: "Texas / national",
      scope: "Leased network / TPA dependent",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Not available through ePayment Center; identify the paying administrator from the member card or remittance.",
      sourceUrl: "",
    },
    {
      name: "First Health Network",
      category: "Commercial",
      trackingMode: "Active",
      networks: "First Health leased network",
      contractStatus: "Needs verification",
      contractEvidence: "EPC EFT/ERA tracker — ePayment Center call 2026-08-14",
      contractEvidenceDate: "2026-08-14",
      verificationRule: "Identify the actual payer/TPA before payment enrollment; First Health may only be the network.",
      relevance: "Texas / national",
      scope: "Leased network / TPA dependent",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Not available through ePayment Center.",
      sourceUrl: "",
    },
    {
      name: "HealthSmart",
      category: "Commercial",
      trackingMode: "Active",
      networks: "HealthSmart / TPA products",
      contractStatus: "Needs review",
      contractEvidence: "",
      contractEvidenceDate: "",
      verificationRule: "Confirm the exact HealthSmart network, payer/TPA, and provider participation before acting.",
      relevance: "Texas / national",
      scope: "TPA / network dependent",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Independent EPC target payer/network.",
      sourceUrl: "",
    },
    {
      name: "Imagine360",
      category: "Commercial",
      trackingMode: "Active",
      networks: "Imagine360 employer plans",
      contractStatus: "Needs review",
      contractEvidence: "",
      contractEvidenceDate: "",
      verificationRule: "Confirm the employer plan and provider contracting path directly with Imagine360.",
      relevance: "Texas / national",
      scope: "Employer / reference-based plan administration",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Independent EPC target payer/administrator.",
      sourceUrl: "",
    },
    {
      name: "Curative",
      category: "Commercial",
      trackingMode: "Active",
      networks: "Curative employer health plans",
      contractStatus: "Needs review",
      contractEvidence: "",
      contractEvidenceDate: "",
      verificationRule: "Use the Curative provider contracting process and verify provider-specific participation.",
      relevance: "Texas active",
      scope: "Commercial / employer",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Independent EPC target payer.",
      sourceUrl: "",
    },
    {
      name: "Apostrophe",
      category: "Commercial",
      trackingMode: "Active",
      networks: "Apostrophe employer / TPA plans",
      contractStatus: "Needs review",
      contractEvidence: "",
      contractEvidenceDate: "",
      verificationRule: "Confirm the actual network and employer/TPA arrangement before credentialing.",
      relevance: "Texas / national",
      scope: "Employer / TPA",
      portalUrl: "",
      joinUrl: "",
      phone: "",
      email: "",
      notes: "Independent EPC target payer/administrator.",
      sourceUrl: "",
    },
  ];

  for (const spec of addedOrIndependentPayers) await ensurePayer(spec);

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
  for (const name of managedPayerNames) {
    await db
      .update(payers)
      .set({
        contractStatus: "Delegated contract on file",
        contractEvidence: MHMD_EVIDENCE,
        contractEvidenceDate: "2026-06-12",
        verificationRule: "MHMD delegated contract evidence supports the group pathway only. Confirm the individual provider's exact product, NPI loading, and effective date directly with payer Provider Relations before rendering care.",
        updatedAt: now,
      })
      .where(eq(payers.name, name));
  }

  const [ambetter] = await db.select().from(payers).where(eq(payers.name, "Ambetter")).limit(1);
  if (ambetter) {
    const ambetterEvidence = "Superior HealthPlan confirmed EPC network participation request received 2026-07-27; Contract Negotiator Semetra Brazle requested a completed W-9 to prepare the agreement. Reply draft with EPC W-9 prepared 2026-08-24 and not yet sent.";
    await db
      .update(payers)
      .set({
        contractStatus: "In Progress",
        contractEvidence: ambetterEvidence,
        contractEvidenceDate: "2026-08-24",
        verificationRule: "Do not submit a duplicate network request. Send the W-9 in the existing Superior thread, await the participation agreement, then complete provider credentialing/roster requirements before treating EPC as in network.",
        phone: "210-753-8670",
        email: "Semetra.Brazle@SuperiorHealthPlan.com",
        notes: "Ambetter from Superior group contracting is active. Reference I-193368790. The W-9 reply is drafted but not sent as of August 24, 2026.",
        updatedAt: now,
      })
      .where(eq(payers.id, ambetter.id));
    await db
      .update(credentials)
      .set({
        status: "In Progress",
        priority: "High",
        assignedTo: "John / Gloria",
        nextAction: "Send the completed EPC W-9 to Semetra Brazle in the existing Superior thread; then review the participation agreement and complete provider credentialing requirements.",
        referenceNumber: "I-193368790",
        evidenceReference: ambetterEvidence,
        notes: "Group contracting is in progress; individual provider credentialing is not yet complete. Do not treat as in network yet.",
        updatedAt: now,
      })
      .where(eq(credentials.payerId, ambetter.id));
  }

  const [bcbs] = await db.select().from(payers).where(eq(payers.name, "Blue Cross Blue Shield")).limit(1);
  if (bcbs) {
    const bcbsEvidence = `${MHMD_EVIDENCE}; BCBSTX onboarding application 929236; Gloria confirmed 2026-08-21 that provider BCBS IDs had not yet been assigned; corrected onboarding roster prepared 2026-08-24.`;
    await db
      .update(payers)
      .set({
        contractEvidence: bcbsEvidence,
        contractEvidenceDate: "2026-08-24",
        notes: "MHMD-managed BCBS products remain the contract pathway. BCBSTX onboarding application 929236 is still awaiting individual provider IDs/NPI loading under EPC.",
        updatedAt: now,
      })
      .where(eq(payers.id, bcbs.id));
    await db
      .update(credentials)
      .set({
        status: "In Progress",
        priority: "High",
        assignedTo: "John",
        nextAction: "Monitor BCBSTX onboarding application 929236. When provider IDs are assigned, confirm each Type 1 NPI is loaded for the exact network and record the effective date.",
        referenceNumber: "Application 929236",
        evidenceReference: bcbsEvidence,
        notes: "BCBS provider IDs were not yet assigned as of 2026-08-21. Do not treat the onboarding roster or historical participation as proof of current EPC NPI loading.",
        updatedAt: now,
      })
      .where(eq(credentials.payerId, bcbs.id));
  }

  const [medicare] = await db
    .select()
    .from(payers)
    .where(eq(payers.name, "Medicare Part B (Original Medicare)"))
    .limit(1);
  if (medicare) {
    await db
      .update(payers)
      .set({
        contractStatus: "Enrollment verification required",
        contractEvidence: "EPC Medicare/PTAN review, August 2026",
        contractEvidenceDate: "2026-08-24",
        verificationRule: "Verify each provider's current active Medicare Part B enrollment/PTAN and reassignment to EPC through PECOS/Novitas. Do not reuse historical PTANs without confirmation.",
        notes: "MHMD requested individual Medicare numbers/PTANs. No current verified PTAN values are stored in this portal.",
        updatedAt: now,
      })
      .where(eq(payers.id, medicare.id));
    for (const provider of providerRows) {
      const dietitian = provider.npi === "1629961537" || provider.npi === "1093311136";
      await db
        .update(credentials)
        .set({
          priority: "High",
          assignedTo: "John",
          nextAction: dietitian
            ? "Confirm whether this dietitian has an active Medicare enrollment/PTAN and whether MHMD requires a Medicare number for this provider type."
            : "Verify the provider's current active individual Medicare Part B enrollment/PTAN in PECOS/Novitas and confirm reassignment to EPC TIN 134244739 / Group NPI 1033286380.",
          evidenceReference: "MHMD requested individual Medicare/PTAN information; current PTAN not verified in accessible EPC records.",
          notes: "Historical PTANs must not be reused unless current active enrollment and EPC reassignment are confirmed.",
          updatedAt: now,
        })
        .where(eq(credentials.providerId, provider.id));
    }
  }

  const payerRows = await db.select().from(payers);
  const payerByName = new Map(payerRows.map((payer) => [payer.name, payer]));
  const eftSeeds: EftRecordSeed[] = [
    {
      payerName: "Aetna",
      eftStatus: "Active",
      eraStatus: "Active",
      enrollmentMethod: "Other",
      clearinghouse: "Claim.MD",
      submittedDate: "2026-08-11",
      effectiveDate: "2026-06-01",
      confirmationNumber: "Existing enrollment confirmed by duplicate response",
      assignedTo: "John",
      notes: "Optum Payer Enrollment duplicate response indicated Aetna EFT/ERA was already enrolled effective June 1, 2026. Verify the existing bank record and confirm the first 835 delivery to Claim.MD.",
    },
    {
      payerName: "Blue Cross Blue Shield",
      eftStatus: "Active",
      eraStatus: "Enrollment Submitted",
      enrollmentMethod: "Availity Essentials",
      clearinghouse: "Claim.MD",
      submittedDate: "2026-08-17",
      confirmationNumber: "EFT 32612723 / payer 84980",
      assignedTo: "John",
      notes: "BCBSTX EFT enrollment is complete and case closed. ERA re-enrollment was submitted through Claim.MD on August 17, 2026; monitor for approval and first 835.",
    },
    {
      payerName: "Cigna",
      eftStatus: "Active",
      eraStatus: "Payer Review",
      enrollmentMethod: "Payer portal",
      clearinghouse: "Claim.MD",
      submittedDate: "2026-08-17",
      confirmationNumber: "Cigna portal",
      assignedTo: "John",
      notes: "Cigna EFT/payment status was confirmed approved on August 17, 2026. Claim.MD remains the intended ERA receiver; payer-by-payer 835 routing still needs verification.",
    },
    {
      payerName: "Humana",
      eftStatus: "Active",
      eraStatus: "Active",
      enrollmentMethod: "Availity Essentials",
      clearinghouse: "Claim.MD",
      submittedDate: "2026-08-20",
      confirmationNumber: "EFT 2088671 / ERA 2088669",
      assignedTo: "John",
      notes: "Humana EFT confirmation 2088671 recorded August 20, 2026. ERA delivery-method change confirmation 2088669 is on file; monitor the first EFT and 835.",
    },
    {
      payerName: "TRICARE For Life",
      eftStatus: "Active",
      eraStatus: "Active",
      enrollmentMethod: "Other",
      clearinghouse: "Claim.MD / WPS",
      submittedDate: "2026-08-11",
      confirmationNumber: "EFT 507492381 / ERA 507492380",
      assignedTo: "John",
      notes: "WPS/Optum confirmations are recorded for TRICARE For Life EFT and ERA. Monitor the first EFT deposit and confirm the 835 reaches Claim.MD.",
    },
    {
      payerName: "TRICARE West (TriWest)",
      eftStatus: "Not Started",
      eraStatus: "Enrollment Submitted",
      enrollmentMethod: "Availity Essentials",
      clearinghouse: "PGBA / Claim.MD",
      submittedDate: "2026-08-11",
      confirmationNumber: "Payer 99726 / Availity customer 69911",
      assignedTo: "John",
      notes: "ERA was reported submitted and remains pending. EFT is blocked because EPC does not yet have the required recent PGBA remittance/check number; complete EFT after the first qualifying paper payment and retain the Availity registration ID.",
    },
    {
      payerName: "UnitedHealthcare",
      eftStatus: "Enrollment Submitted",
      eraStatus: "Not Started",
      enrollmentMethod: "Payer portal",
      clearinghouse: "Optum Pay",
      submittedDate: "2026-08-20",
      confirmationNumber: "INT-184494420 / rep Klein",
      assignedTo: "John",
      followUpDate: "2026-08-27",
      notes: "Optum Pay online enrollment was successfully submitted August 20, 2026 after the TIN registration correction. Await approval/security PIN; follow up with Optum Pay if no approval within five business days.",
    },
    {
      payerName: "Ambetter",
      eftStatus: "Payer Review",
      eraStatus: "Not Started",
      enrollmentMethod: "Other",
      clearinghouse: "PaySpan",
      submittedDate: "2026-08-21",
      assignedTo: "John / Gloria",
      notes: "PaySpan cleanup is pending. A signed company-letterhead request was resent to remove the former billing-company/administrator registration under EPC's TIN. After PaySpan confirms release/reset, register current EPC management and complete Ambetter EFT enrollment.",
    },
    {
      payerName: "CHAMPVA",
      eftStatus: "Active",
      eraStatus: "Enrollment Submitted",
      enrollmentMethod: "Other",
      clearinghouse: "VA-FSC / Claim.MD",
      submittedDate: "2026-08-18",
      confirmationNumber: "VCOM-1315179",
      assignedTo: "Gloria / John",
      notes: "VA-FSC confirmed the CHAMPVA vendor file payment webform complete and closed case VCOM-1315179. Claim.MD received the ERA enrollment August 18, 2026; monitor for ERA activation and first 835.",
    },
    {
      payerName: "Healthcare Highways Logix/Sync",
      eftStatus: "Payer Review",
      eraStatus: "Not Started",
      enrollmentMethod: "Other",
      clearinghouse: "Zelis / VPay / underlying TPA",
      submittedDate: "2026-08-14",
      assignedTo: "John",
      notes: "ePayment Center confirmed Healthcare Highways is not available there. Verify prior Zelis/VPay submissions and identify the paying TPA for each line of business before marking EFT complete.",
    },
    {
      payerName: "Molina Healthcare",
      eftStatus: "Payer Review",
      eraStatus: "Payer Review",
      enrollmentMethod: "Other",
      clearinghouse: "PaySpan or ECHO / Claim.MD",
      submittedDate: "2026-08-14",
      confirmationNumber: "Payer ID 20554",
      assignedTo: "John / Gloria",
      notes: "The EFT vendor route is conflicting between PaySpan and prior ECHO guidance. Resolve the payer-designated EFT route before enrollment and preserve Claim.MD as the intended 835 receiver.",
    },
    {
      payerName: "Oscar Health",
      eftStatus: "Payer Review",
      eraStatus: "Not Started",
      enrollmentMethod: "Payer portal",
      clearinghouse: "Direct Oscar ACH/ERA",
      submittedDate: "2026-08-14",
      assignedTo: "John",
      notes: "Oscar is not available through ePayment Center. Direct EFT enrollment remains to be completed and confirmed with Oscar.",
    },
    {
      payerName: "Community Health Choice",
      eftStatus: "Payer Review",
      eraStatus: "Enrollment Submitted",
      enrollmentMethod: "Other",
      clearinghouse: "ECHO Health / Claim.MD",
      submittedDate: "2026-08-17",
      confirmationNumber: "ERA payer ID 60495",
      assignedTo: "John",
      notes: "CHC EFT is blocked until EPC receives the first ECHO/CHC payment needed for draft-number authentication. VCC opt-out was completed. ERA enrollment was received August 17, 2026 and awaits final activation.",
    },
    {
      payerName: "HealthSpring / Cigna Medicare Advantage",
      eftStatus: "Active",
      eraStatus: "Not Started",
      enrollmentMethod: "Other",
      clearinghouse: "Zelis",
      submittedDate: "2026-08-17",
      assignedTo: "John / Gloria",
      notes: "HealthSpring / Cigna Medicare Advantage EFT status was confirmed approved August 17, 2026. Monitor payments and reconcile to remittance.",
    },
    {
      payerName: "MultiPlan / PHCS",
      eftStatus: "Payer Review",
      eraStatus: "Not Started",
      enrollmentMethod: "Other",
      clearinghouse: "Underlying payer / TPA",
      submittedDate: "2026-08-14",
      assignedTo: "John",
      notes: "MultiPlan/PHCS is not available through ePayment Center and may only be the network. Identify the actual paying payer/TPA before EFT enrollment.",
    },
    {
      payerName: "First Health Network",
      eftStatus: "Payer Review",
      eraStatus: "Not Started",
      enrollmentMethod: "Other",
      clearinghouse: "Underlying payer / TPA",
      submittedDate: "2026-08-14",
      assignedTo: "John",
      notes: "First Health is not available through ePayment Center and may only be the network. Identify the actual paying payer/TPA before EFT enrollment.",
    },
  ];

  const eftEraRecords = eftSeeds.flatMap((seed) => {
    const payer = payerByName.get(seed.payerName);
    if (!payer) return [];
    return [
      {
        payerId: payer.id,
        eftStatus: seed.eftStatus,
        eraStatus: seed.eraStatus,
        enrollmentMethod: seed.enrollmentMethod,
        portalUrl: seed.portalUrl ?? payer.portalUrl ?? "",
        clearinghouse: seed.clearinghouse ?? "",
        submittedDate: seed.submittedDate ?? "",
        effectiveDate: seed.effectiveDate ?? "",
        confirmationNumber: seed.confirmationNumber ?? "",
        assignedTo: seed.assignedTo ?? "Unassigned",
        followUpDate: seed.followUpDate ?? "",
        notes: seed.notes,
        updatedAt: now,
      },
    ];
  });

  await db
    .insert(settings)
    .values({ key: "eftEraRecords", value: JSON.stringify(eftEraRecords), updatedAt: now })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: JSON.stringify(eftEraRecords), updatedAt: now },
    });

  await db
    .insert(settings)
    .values({ key: "lastOperationalSync", value: "2026-08-24", updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: "2026-08-24", updatedAt: now } });

  await db.insert(activity).values([
    {
      action: "Synced",
      entityType: "system",
      entityName: "EPC operational status",
      detail: "August 24, 2026 sync: current provider primary locations, independent payer scope, MHMD June 12 contract evidence, BCBS onboarding 929236, Ambetter/Superior contracting, Medicare/PTAN verification, and EFT/ERA tracking were refreshed.",
    },
    {
      action: "Updated",
      entityType: "payer",
      entityName: "Ambetter from Superior",
      detail: "Network participation request already received by Superior; W-9 reply is drafted in the existing Semetra Brazle thread and agreement is pending after submission.",
    },
    {
      action: "Updated",
      entityType: "payer",
      entityName: "Blue Cross Blue Shield",
      detail: "BCBSTX onboarding application 929236 remains in progress; provider IDs were not assigned as of August 21 and the corrected roster was prepared August 24.",
    },
    {
      action: "Synced",
      entityType: "eft-era",
      entityName: "EFT / ERA enrollment",
      detail: "Latest payment and remittance statuses synchronized from the EPC EFT/ERA tracker, including Aetna, BCBSTX, Cigna, Humana, TRICARE, UHC/Optum Pay, Ambetter/PaySpan, CHAMPVA, CHC, Molina, Oscar, HealthSpring, Healthcare Highways, MultiPlan and First Health.",
    },
    {
      action: "Prepared",
      entityType: "system",
      entityName: "CAQH Practice Manager",
      detail: "CAQH Practice Manager provider list prepared for the 11 EPC providers; individual CAQH profiles remain the credentialing source and sensitive SSNs are not stored in this portal.",
    },
  ]);

  await db
    .insert(settings)
    .values({ key: SYNC_KEY, value: SYNC_VERSION, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: SYNC_VERSION, updatedAt: now } });

  // Keep the provider-relations confirmation rule explicit after the operational sync.
  await db
    .insert(settings)
    .values({ key: "networkVerificationMethod", value: PROVIDER_RELATIONS_METHOD, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: PROVIDER_RELATIONS_METHOD, updatedAt: now } });
}
