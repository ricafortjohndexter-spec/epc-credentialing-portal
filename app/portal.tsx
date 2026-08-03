"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";

type Provider = { id: number; name: string; credentials: string; npi: string; specialty: string; location: string; imageUrl: string; profileUrl: string; active: boolean };
type Payer = { id: number; name: string; category: string; trackingMode: string; networks: string; contractStatus: string; contractEvidence: string; contractEvidenceDate: string; verificationRule: string; relevance: string; scope: string; portalUrl: string; joinUrl: string; phone: string; email: string; notes: string; sourceUrl: string };
type Credential = { id: number; providerId: number; payerId: number; status: string; followUpDate: string; priority: string; assignedTo: string; nextAction: string; referenceNumber: string; networkName: string; providerRelationsContact: string; verificationMethod: string; verificationDate: string; effectiveDate: string; terminationDate: string; evidenceReference: string; notes: string; updatedAt: string };
type Activity = { id: number; action: string; entityType: string; entityName: string; detail: string; createdAt: string };
type PortalData = { providers: Provider[]; payers: Payer[]; credentials: Credential[]; activity: Activity[]; settings: Record<string, string> };
type EftEraRecord = { payerId: number; eftStatus: string; eraStatus: string; enrollmentMethod: string; portalUrl: string; clearinghouse: string; submittedDate: string; effectiveDate: string; confirmationNumber: string; assignedTo: string; followUpDate: string; notes: string; updatedAt: string };
type View = "start" | "dashboard" | "queue" | "schedule" | "analytics" | "providers" | "payers" | "eftEra" | "activity";
type Modal = { type: "provider" | "providerDetail" | "payer" | "credential" | "eftEra" | "share"; record?: Provider | Payer | Credential | EftEraRecord } | null;
type EnrichedCredential = Credential & { provider?: Provider; payer?: Payer };
type PlanCategory = "Commercial" | "Marketplace" | "Medicare" | "Medicaid";

const statuses = ["Not Started", "Application Submitted", "In Progress", "Pending", "Approved", "Denied", "Needs Correction", "Not Applicable", "Not Accepted"];
const priorities = ["Low", "Normal", "High"];
const eftEraStatuses = ["Not Started", "Enrollment Submitted", "Payer Review", "Active", "Rejected", "Not Required"];
const enrollmentMethods = ["Payer portal", "Availity Essentials", "Clearinghouse", "Paper form", "Other"];
const providerRelationsMethod = "Insurance/Payer Provider Relations";
const verificationMethods = [providerRelationsMethod];
const referencePayerNames = ["Centene", "EmblemHealth", "Guardian Life", "Health Net", "Highmark", "Independence Blue Cross", "Kaiser Permanente", "MetLife", "Mutual of Omaha", "WellCare"];
const mhmdEvidence = "MHMD Managed Care Contracts, revised January 2, 2026";
const bcbsClaimEvidence = "BCBSTX practice test-claim return, June 26, 2026 - additional NPI information required";
const mhmdContractPayerNames = ["Aetna", "Blue Cross Blue Shield", "Community Health Choice", "Cigna", "EHN PPO", "Healthways Logix/Sync", "Imagine Health", "Memorial Hermann", "UnitedHealthcare", "Aetna Medicare Advantage", "Memorial Hermann Medicare Advantage", "UnitedHealthcare Medicare Advantage", "Wellpoint Medicare Advantage"];
const payerNetworkNames: Record<string, string> = {
  "Aetna": "ACO CI Aetna Commercial / Whole Health; Choice POS II; Open Access Managed Choice; Aetna PPO", "Ambetter": "Ambetter from Superior HealthPlan", "Blue Cross Blue Shield": "ACO CI BCBS Essentials / Health Select / Premier HMO; ACO CI BCBS PPO / Blue Choice; CI BCBS BAV", "Cigna": "CI Cigna Commercial; CI Cigna Local Plus; Open Access Plus (OAP); Cigna PPO; Choice Fund PPO", "Community Health Choice": "Community Health Choice Marketplace", "EHN PPO": "CI EHN PPO", "Healthways Logix/Sync": "CI Logix / Sync (AHP); CI Logix / Sync (MNA CC / Neuro / Rad / Onc); CI Logix / Sync (including MNA Neurology)", "Humana": "Humana Choice PPO", "Imagine Health": "CI Imagine Health", "Memorial Hermann": "CI MH Select HMO / PPO; CI MH SafetyNet / Worklink; Memorial Hermann Health Plan", "Molina Healthcare": "Molina Marketplace HMO", "Oscar Health": "Oscar Marketplace EPO", "UnitedHealthcare": "ACO CI UHC Commercial; Choice / Choice Plus; Options PPO; Select / Select Plus", "Medicare Part B (Original Medicare)": "Original Medicare Part B — Texas Jurisdiction H", "Aetna Medicare Advantage": "CI MA Aetna Premier HMO / Prime HMO / Value PPO; D-SNP excluded", "Blue Cross Medicare Advantage": "Blue Cross Medicare Advantage PPO / HMO", "Humana Medicare Advantage": "Humana Choice PPO; Humana Gold Plus HMO", "Memorial Hermann Medicare Advantage": "CI MA Memorial Hermann HMO; D-SNP excluded", "UnitedHealthcare Medicare Advantage": "CI MA UnitedHealthcare; AARP Medicare Advantage", "Wellpoint Medicare Advantage": "CI MA Wellpoint HMO", "WellCare Medicare Advantage": "Wellcare by Allwell / Superior — confirm exact network", "Molina Medicare Advantage": "Molina Choice Care / Complete Care — confirm exact network", "Texas Medicaid": "Texas Medicaid",
};
const payerDomains: Record<string, string> = {
  "Aetna": "aetna.com", "Ambetter": "ambetterhealth.com", "Blue Cross Blue Shield": "bcbstx.com", "Centene": "centene.com", "Cigna": "cigna.com", "Community Health Choice": "communityhealthchoice.org", "EmblemHealth": "emblemhealth.com", "Guardian Life": "guardianlife.com", "Health Net": "healthnet.com", "Highmark": "highmark.com", "Humana": "humana.com", "Independence Blue Cross": "ibx.com", "Kaiser Permanente": "kp.org", "Memorial Hermann": "memorialhermann.org", "MetLife": "metlife.com", "Molina Healthcare": "molinahealthcare.com", "Mutual of Omaha": "mutualofomaha.com", "Oscar Health": "hioscar.com", "UnitedHealthcare": "uhc.com", "WellCare": "wellcare.com",
  "Medicare Part B (Original Medicare)": "medicare.gov", "Aetna Medicare Advantage": "aetna.com", "Blue Cross Medicare Advantage": "bcbstx.com", "Humana Medicare Advantage": "humana.com", "Memorial Hermann Medicare Advantage": "memorialhermann.org", "UnitedHealthcare Medicare Advantage": "uhc.com", "Wellpoint Medicare Advantage": "wellpoint.com", "WellCare Medicare Advantage": "wellcare.com", "Molina Medicare Advantage": "molinahealthcare.com", "Texas Medicaid": "tmhp.com",
};

const planCategoryOrder: PlanCategory[] = ["Commercial", "Marketplace", "Medicare", "Medicaid"];
const categoryDescriptions: Record<PlanCategory, string> = {
  Commercial: "Employer, group, and traditional medical plans",
  Marketplace: "Individual ACA Marketplace plans",
  Medicare: "Original Medicare Part B and Medicare Advantage / replacement plans",
  Medicaid: "Reference only — EPC does not accept Medicaid",
};

function eftEraRecordsFrom(settings: Record<string, string>, payers: Payer[]): EftEraRecord[] {
  let saved: EftEraRecord[] = [];
  try {
    const parsed = JSON.parse(settings.eftEraRecords || "[]");
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    saved = [];
  }
  const byPayer = new Map(saved.map((record) => [Number(record.payerId), record]));
  return payers.filter((payer) => payer.trackingMode === "Active").map((payer) => byPayer.get(payer.id) ?? { payerId: payer.id, eftStatus: "Not Started", eraStatus: "Not Started", enrollmentMethod: "Payer portal", portalUrl: payer.portalUrl, clearinghouse: "", submittedDate: "", effectiveDate: "", confirmationNumber: "", assignedTo: "Unassigned", followUpDate: "", notes: "", updatedAt: "" });
}

function categoryForName(payerName: string, scope = "", relevance = ""): PlanCategory {
  const name = payerName.toLowerCase();
  const product = scope.toLowerCase();
  const regionalUse = relevance.toLowerCase();
  if (name === "texas medicaid" || regionalUse.includes("not accepted")) return "Medicaid";
  if (name.includes("medicare") || ["mutual of omaha", "wellcare"].includes(name) || (!['humana', 'unitedhealthcare'].includes(name) && product.includes("medicare"))) return "Medicare";
  if (["ambetter", "community health choice", "molina healthcare", "oscar health"].includes(name) || product.includes("marketplace")) return "Marketplace";
  return "Commercial";
}

function payerCategory(payer: Payer): PlanCategory {
  return planCategoryOrder.includes(payer.category as PlanCategory) ? payer.category as PlanCategory : categoryForName(payer.name, payer.scope, payer.relevance);
}

function isExcluded(record: Credential) {
  return record.status === "Not Accepted" || record.status === "Not Applicable";
}

function isConfirmed(record: Credential) {
  return record.status === "Approved" && record.verificationMethod === providerRelationsMethod && Boolean(record.networkName && record.providerRelationsContact && record.verificationDate && record.effectiveDate);
}

function isReadyToAccept(record: Credential) {
  if (!isConfirmed(record)) return false;
  const today = localDateKey();
  return record.effectiveDate <= today && (!record.terminationDate || record.terminationDate >= today);
}

function isAppliedOrSubmitted(record: Credential) {
  return ["Application Submitted", "In Progress", "Pending"].includes(record.status);
}

function needsEvidence(record: Credential) {
  return record.status === "Approved" && !isConfirmed(record);
}

function statusTone(status: string) {
  if (status === "Approved") return "success";
  if (status === "Denied" || status === "Needs Correction") return "danger";
  if (status === "Not Accepted" || status === "Not Applicable" || status === "Not Started") return "muted";
  return "info";
}

// The hosted portal replaces this immediately with D1 data. Keeping a read-only
// snapshot here also makes restricted local previews useful when D1 is unavailable.
const snapshotProviders = [
  ["Radha Jayakumar Bernander", "PA-C, CDCES", "1396273595", "Physician Assistant", "Katy, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Radha_Bernander.png?itok=3vBA2YUz", "https://www.myprivia.com/endocrineandpsychiatry/providers/radha-bernander-pa-c"],
  ["Tess Chamakkala", "DO", "1326530668", "Endocrinologist", "Houston, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Tess_Chamakkala.png?itok=Kv6Ffa9L", "https://www.myprivia.com/endocrineandpsychiatry/providers/tess-chamakkala-do"],
  ["Shannon McAllister Gregorek", "APN", "1790929099", "Nurse Practitioner", "Houston, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Shannon%20Gregorek.png?itok=MwHVKgrk", "https://www.myprivia.com/endocrineandpsychiatry/providers/shannon-gregorek-apn"],
  ["Cindy Vanessa Laverde", "MS, RDN, LD, MB(ASCP)", "1629961537", "Registered Dietitian", "Houston & Katy, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2025-07/epc_vanessa_lavarde.jpg?itok=zxqmEl0A", "https://www.myprivia.com/endocrineandpsychiatry/providers/cindy-vanessa-laverde"],
  ["Elizabeth Leal", "RDN, CDCES", "1093311136", "Registered Dietitian", "Houston, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-10/epc_elizabeth_leal.jpg?itok=Wd2W7nOa", "https://www.myprivia.com/endocrineandpsychiatry/providers/elizabeth-c-leal-vasquez"],
  ["Kruti Patel-Konasagar", "MS, FNP-BC", "1932714722", "Nurse Practitioner", "Katy, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Kruti_Patel-Konasagar.png?itok=WyBDZabI", "https://www.myprivia.com/endocrineandpsychiatry/providers/kruti-patel-konasager-np"],
  ["Rakesh Patel", "DO", "1386629699", "Endocrinologist", "Houston & Katy, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Rakesh_Patel.png?itok=kcaX-K0Y", "https://www.myprivia.com/endocrineandpsychiatry/providers/rakesh-patel-do"],
  ["Preeya Raghu", "MD", "1558520015", "Endocrinologist", "Katy, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Preeya_Raghu.png?itok=38mXnWri", "https://www.myprivia.com/endocrineandpsychiatry/providers/preeya-raghu-md"],
  ["Elina Shakya", "MD", "1265666846", "Endocrinologist", "Katy, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Elina_Shakya.png?itok=xyYwzGTp", "https://www.myprivia.com/endocrineandpsychiatry/providers/elina-shakya-md"],
  ["Veena Ramchandra Watwe", "MD", "1417120221", "Endocrinologist", "Houston, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Veena_Watwe.png?itok=NNo4FN8O", "https://www.myprivia.com/endocrineandpsychiatry/providers/veena-watwe-md"],
  ["Nadia Younus", "PA", "1942573340", "Physician Assistant", "Houston, Texas", "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Nadia_Younus.png?itok=jaMVrOF2", "https://www.myprivia.com/endocrineandpsychiatry/providers/nadia-younus-pa"],
].map(([name, providerCredentials, npi, specialty, location, imageUrl, profileUrl], index) => ({ id: index + 1, name, credentials: providerCredentials, npi, specialty, location, imageUrl, profileUrl, active: true })) as Provider[];

const snapshotPayerNames = ["Aetna", "Ambetter", "Blue Cross Blue Shield", "Centene", "Cigna", "Community Health Choice", "EHN PPO", "EmblemHealth", "Guardian Life", "Health Net", "Healthways Logix/Sync", "Highmark", "Humana", "Imagine Health", "Independence Blue Cross", "Kaiser Permanente", "Memorial Hermann", "MetLife", "Molina Healthcare", "Mutual of Omaha", "Oscar Health", "UnitedHealthcare", "WellCare", "Medicare Part B (Original Medicare)", "Aetna Medicare Advantage", "Blue Cross Medicare Advantage", "Humana Medicare Advantage", "Memorial Hermann Medicare Advantage", "UnitedHealthcare Medicare Advantage", "Wellpoint Medicare Advantage", "WellCare Medicare Advantage", "Molina Medicare Advantage", "Texas Medicaid"];
const snapshotPayers = snapshotPayerNames.map((name, index): Payer => {
  const details: Record<string, Partial<Payer>> = {
    "Blue Cross Blue Shield": { relevance: "Texas active", scope: "Commercial (Texas)", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.bcbstx.com/provider/network/network/request-contract", phone: "1-800-972-8088", email: "", notes: "Commercial provider services. Houston regional office: 713-354-7000.", sourceUrl: "https://www.bcbstx.com/provider/contact-us" },
    "Community Health Choice": { relevance: "Houston active", scope: "Marketplace (Houston)", portalUrl: "https://provider.communityhealthchoice.org/", joinUrl: "https://provider.communityhealthchoice.org/contact-community/join-community/", phone: "713-295-2295", email: "ProviderWebInquiries@CommunityHealthChoice.org", notes: "Houston-based Marketplace payer.", sourceUrl: "https://provider.communityhealthchoice.org/contact-community/join-community/" },
    "Humana": { relevance: "Texas active", scope: "Commercial", portalUrl: "https://provider.humana.com/", joinUrl: "https://provider.humana.com/join-humana-network/credentialing-in-texas", phone: "1-800-457-4708", email: "HumanaHoustonPD@humana.com", notes: "Houston provider routing.", sourceUrl: "https://provider.humana.com/join-humana-network/credentialing-in-texas" },
    "EHN PPO": { relevance: "MHMD delegated pathway", scope: "Commercial delegated network", phone: "713-338-6464, option 2", notes: "Verify provider-specific effective date with MHMD." },
    "Healthways Logix/Sync": { relevance: "MHMD delegated pathway", scope: "Commercial delegated network / separate fee schedules", phone: "713-338-6464, option 2", notes: "Verify fee schedule applicability and provider-specific effective date with MHMD." },
    "Imagine Health": { relevance: "MHMD delegated pathway", scope: "Commercial delegated network", phone: "713-338-6464, option 2", notes: "Verify provider-specific effective date with MHMD." },
    "Memorial Hermann": { relevance: "Houston active", scope: "Memorial Hermann Health Plan", portalUrl: "https://healthplan.memorialhermann.org/for-providers", joinUrl: "https://healthplan.memorialhermann.org/for-providers/join-the-network", phone: "1-800-429-6396", email: "providerservices@apex4health.com", notes: "Houston local plan.", sourceUrl: "https://healthplan.memorialhermann.org/for-providers/join-the-network" },
    "Molina Healthcare": { relevance: "Texas active", scope: "Marketplace (Texas)", portalUrl: "https://provider.molinahealthcare.com/", joinUrl: "https://www.molinahealthcare.com/providers/tx", phone: "1-855-322-4080", email: "MHTXProviderServices@MolinaHealthcare.com", notes: "Texas Marketplace provider services.", sourceUrl: "https://www.molinahealthcare.com/providers/tx" },
    "UnitedHealthcare": { relevance: "Texas / national", scope: "Commercial", portalUrl: "https://www.uhcprovider.com/", joinUrl: "https://www.uhcprovider.com/en/demographics-profiles-attestation/join-our-network.html", phone: "1-877-842-3210", notes: "Use the UHC Provider Portal and Provider Services.", sourceUrl: "https://www.uhcprovider.com/en/contact-us.html" },
    "WellCare": { relevance: "Texas active", scope: "Medicare product routing", portalUrl: "https://provider.wellcare.com/", joinUrl: "https://www.wellcare.com/en/texas/providers", phone: "1-855-538-0454", email: "PR.SW@SuperiorHealthPlan.com", notes: "Texas statewide provider-representative inbox.", sourceUrl: "https://www.wellcare.com/en/texas/providers" },
    "Medicare Part B (Original Medicare)": { relevance: "Texas active", scope: "Medicare Part B / fee-for-service", portalUrl: "https://www.novitas-solutions.com/webcenter/portal/MedicareJH", joinUrl: "https://www.cms.gov/medicare/medicare-contracting/medicare-administrative-contractors/who-are-the-macs-a-b-mac-jurisdiction-h-jh", phone: "1-855-252-8782", notes: "Texas Part B is handled by Novitas Jurisdiction H.", sourceUrl: "https://www.cms.gov/medicare/medicare-contracting/medicare-administrative-contractors/who-are-the-macs-a-b-mac-jurisdiction-h-jh" },
    "Aetna Medicare Advantage": { relevance: "Texas / market dependent", scope: "Medicare Advantage / replacement plan", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.aetna.com/health-care-professionals/medicare.html", phone: "1-800-624-0756", sourceUrl: "https://www.aetna.com/health-care-professionals/medicare.html" },
    "Blue Cross Medicare Advantage": { relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.bcbstx.com/provider/network/network/bma-ppo", phone: "1-877-774-8592", sourceUrl: "https://www.bcbstx.com/provider/network/network/bma-ppo" },
    "Humana Medicare Advantage": { relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://provider.humana.com/", joinUrl: "https://provider.humana.com/working-with-us/medicare-advantage-materials", phone: "1-800-457-4708", email: "HumanaHoustonPD@humana.com", sourceUrl: "https://provider.humana.com/working-with-us/medicare-advantage-materials" },
    "Memorial Hermann Medicare Advantage": { relevance: "MHMD delegated pathway", scope: "Medicare Advantage / replacement plan", portalUrl: "https://healthplan.memorialhermann.org/for-providers", phone: "713-338-6464, option 2", notes: "MH HMO is in the MHMD contract list; D-SNP is excluded from EPC active scope." },
    "UnitedHealthcare Medicare Advantage": { relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://www.uhcprovider.com/", joinUrl: "https://www.uhcprovider.com/en/health-plans-by-state/texas-health-plans/tx-medicare-plans/tx-med-adv.html", phone: "1-877-842-3210", sourceUrl: "https://www.uhcprovider.com/en/health-plans-by-state/texas-health-plans/tx-medicare-plans/tx-med-adv.html" },
    "Wellpoint Medicare Advantage": { relevance: "MHMD delegated pathway", scope: "Medicare Advantage / replacement plan", phone: "713-338-6464, option 2", notes: "Wellpoint HMO is in the MHMD contract list. Verify provider-specific effective date." },
    "WellCare Medicare Advantage": { relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://provider.wellcare.com/", joinUrl: "https://www.wellcare.com/en/texas/providers/medicare", phone: "1-855-538-0454", email: "PR.SW@SuperiorHealthPlan.com", sourceUrl: "https://www.wellcare.com/en/texas/providers/medicare" },
    "Molina Medicare Advantage": { relevance: "Texas / market dependent", scope: "Medicare Advantage / replacement plan", portalUrl: "https://provider.molinahealthcare.com/", joinUrl: "https://www.molinahealthcare.com/providers/common/medicare/medicare", phone: "1-855-322-4080", email: "MHTXProviderServices@MolinaHealthcare.com", sourceUrl: "https://www.molinahealthcare.com/providers/common/medicare/medicare" },
    "Texas Medicaid": { relevance: "Not accepted", scope: "Medicaid", portalUrl: "https://www.tmhp.com/", joinUrl: "https://www.tmhp.com/topics/provider-enrollment", phone: "1-800-925-9126", notes: "EPC does not accept Medicaid. Reference only.", sourceUrl: "https://www.tmhp.com/topics/provider-enrollment" },
  };
  const detail = { relevance: "Needs review", scope: "", portalUrl: "", joinUrl: "", phone: "", email: "", notes: "", sourceUrl: "", ...details[name] };
  const hasMhmdContract = mhmdContractPayerNames.includes(name);
  const isBcbs = name === "Blue Cross Blue Shield";
  return { id: index + 1, name, category: categoryForName(name, detail.scope, detail.relevance), trackingMode: name === "Texas Medicaid" ? "Not accepted" : referencePayerNames.includes(name) ? "Reference only" : "Active", networks: payerNetworkNames[name] ?? detail.scope, contractStatus: hasMhmdContract ? "Delegated contract on file" : name === "Texas Medicaid" ? "Not accepted" : "Needs review", contractEvidence: hasMhmdContract ? `${mhmdEvidence}${isBcbs ? `; ${bcbsClaimEvidence}` : ""}` : "", contractEvidenceDate: hasMhmdContract ? "2026-01-02" : "", verificationRule: hasMhmdContract ? `Delegated group contract only. Confirm the individual provider's exact product, NPI loading, and effective date directly with insurance/payer Provider Relations before rendering care.${isBcbs ? " Confirm NPI loading before claim submission." : ""}` : "", ...detail };
});
const snapshotApprovals: Record<string, string[]> = {
  "1396273595": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1326530668": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "UnitedHealthcare", "Memorial Hermann"], "1790929099": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1629961537": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare"], "1093311136": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1932714722": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1386629699": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1558520015": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1265666846": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1417120221": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"], "1942573340": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
};
const snapshotCredentials: Credential[] = snapshotProviders.flatMap((provider) => snapshotPayers.map((payer, payerIndex) => ({ id: (provider.id - 1) * snapshotPayers.length + payerIndex + 1, providerId: provider.id, payerId: payer.id, status: snapshotApprovals[provider.npi]?.includes(payer.name) ? "Approved" : payer.trackingMode === "Not accepted" ? "Not Accepted" : payer.trackingMode === "Reference only" ? "Not Applicable" : "Not Started", followUpDate: "", priority: "Normal", assignedTo: "Unassigned", nextAction: payer.trackingMode === "Reference only" ? "Reference only — no credentialing action" : payer.name === "Blue Cross Blue Shield" ? "Contact BCBSTX Provider Relations to confirm NPI loading, exact network, and provider effective date." : payer.contractStatus === "Delegated contract on file" ? "Contact MHMD Provider Relations (713-338-6464, option 2) to confirm the exact network and provider effective date." : `Contact ${payer.name} Provider Relations${payer.phone ? ` (${payer.phone})` : ""} to confirm the exact network and provider effective date.`, referenceNumber: "", networkName: "", providerRelationsContact: "", verificationMethod: "", verificationDate: "", effectiveDate: "", terminationDate: "", evidenceReference: payer.contractEvidence, notes: payer.name === "Blue Cross Blue Shield" ? "Practice-level test claim returned for additional NPI information. Do not treat the test claim as proof of individual participation." : "", updatedAt: "2026-07-14 00:00:00" })));
const snapshotData: PortalData = { providers: snapshotProviders, payers: snapshotPayers, credentials: snapshotCredentials, activity: [{ id: 2, action: "Applied", entityType: "system", entityName: "MHMD network evidence", detail: "13 delegated contract pathways recorded; Medicaid and D-SNP products excluded from active scope", createdAt: "2026-07-14 00:00:00" }, { id: 1, action: "Imported", entityType: "system", entityName: "EPC workbook", detail: "11 providers, 33 payer products and 363 participation records", createdAt: "2026-07-14 00:00:00" }], settings: { shareMode: "private" } };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseStoredDate(value: string) {
  if (!value) return new Date();
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function recommendedTask(record: Credential) {
  if (needsEvidence(record)) {
    if (record.evidenceReference.includes("BCBSTX practice test-claim return")) return "Contact BCBSTX Provider Relations";
    if (record.evidenceReference.includes("MHMD Managed Care Contracts")) return "Contact MHMD Provider Relations";
    return "Contact payer Provider Relations";
  }
  if (record.nextAction) return record.nextAction;
  const actions: Record<string, string> = {
    "Not Started": "Start payer application",
    "Application Submitted": "Confirm receipt and reference number",
    "In Progress": "Check credentialing progress",
    "Pending": "Follow up on pending items",
    "Needs Correction": "Correct and resubmit application",
    "Denied": "Review denial and escalation path",
  };
  return actions[record.status] ?? "Review credentialing record";
}

function taskDate(record: Credential) {
  if (record.followUpDate) return { date: record.followUpDate, source: "Scheduled" };
  const base = parseStoredDate(record.updatedAt);
  const cadence: Record<string, number> = { "Not Started": 30, "Needs Correction": 0, "Denied": 7, "Application Submitted": 7, "In Progress": 14, "Pending": 14, "Approved": 7 };
  return { date: localDateKey(addDays(base, cadence[record.status] ?? 7)), source: "Suggested" };
}

function dateDistance(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date(`${localDateKey()}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function EPCLogo() {
  return <div className="epc-brand-lockup"><span className="epc-logo-crop"><img src="/epc-office-logo.png" alt="EPC office logo" /></span><span className="epc-brand-name"><strong>Endocrine &amp; Psychiatry Center</strong><small>Credentialing Portal</small></span></div>;
}

function ProviderAvatar({ provider, size = "medium" }: { provider: Provider; size?: "small" | "medium" | "large" }) {
  return (
    <div className={`provider-avatar ${size}`} aria-label={`${provider.name} profile photo`}>
      <span>{initials(provider.name)}</span>
      {provider.imageUrl ? <img src={provider.imageUrl} alt={provider.name} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
    </div>
  );
}

function PayerLogo({ payer, size = "medium" }: { payer: Payer; size?: "medium" | "large" }) {
  const domain = payerDomains[payer.name];
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain_url=https://${domain}&sz=128` : "";
  return <div className={`payer-logo ${size}`}><span aria-hidden="true">{initials(payer.name)}</span>{logoUrl ? <img src={logoUrl} alt={`${payer.name} logo`} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}</div>;
}

function Icon({ name }: { name: string }) {
  const marks: Record<string, string> = { start: "◎", dashboard: "⌂", queue: "☷", schedule: "◷", analytics: "▥", providers: "♙", payers: "▦", eftEra: "$", activity: "↗", search: "⌕", add: "+", share: "☍", edit: "✎", external: "↗", phone: "☎", email: "✉", check: "✓", alert: "!", reminder: "●" };
  return <span className="icon" aria-hidden="true">{marks[name] ?? "•"}</span>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export default function Portal() {
  const [data, setData] = useState<PortalData>(snapshotData);
  const loading = false;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("start");
  const [query, setQuery] = useState("");
  const [queueFilter, setQueueFilter] = useState("Evidence Needed");
  const [modal, setModal] = useState<Modal>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      try {
        const response = await fetch("/api/data", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load portal data");
        if (!cancelled) setData(payload);
      } catch {
        // Restricted previews may not expose D1. The hosted portal still uses D1.
      }
    }
    void initialLoad();
    return () => { cancelled = true; };
  }, []);

  async function save(method: "POST" | "PUT" | "DELETE", body?: unknown, queryString = "") {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/data${queryString}`, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save changes");
      setData(payload);
      setModal(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save changes");
    } finally {
      setSaving(false);
    }
  }

  const providerMap = useMemo(() => new Map(data.providers.map((provider) => [provider.id, provider])), [data.providers]);
  const payerMap = useMemo(() => new Map(data.payers.map((payer) => [payer.id, payer])), [data.payers]);
  const eftEraRecords = useMemo(() => eftEraRecordsFrom(data.settings, data.payers), [data.settings, data.payers]);
  const credentialingRecords = data.credentials.filter((record) => !isExcluded(record));
  const approvalsOnFile = credentialingRecords.filter((record) => record.status === "Approved").length;
  const confirmed = credentialingRecords.filter(isConfirmed).length;
  const evidenceNeeded = credentialingRecords.filter(needsEvidence).length;
  const notStarted = credentialingRecords.filter((record) => record.status === "Not Started").length;
  const completion = credentialingRecords.length ? Math.round((confirmed / credentialingRecords.length) * 100) : 0;
  const search = query.trim().toLowerCase();

  const filteredProviders = data.providers.filter((provider) => !search || `${provider.name} ${provider.npi} ${provider.specialty} ${provider.location}`.toLowerCase().includes(search));
  const filteredPayers = data.payers;
  const enrichedCredentials = data.credentials.map((record) => ({ ...record, provider: providerMap.get(record.providerId), payer: payerMap.get(record.payerId) })).filter((record) => record.provider && record.payer);
  const workableCredentials = enrichedCredentials.filter((record) => !isExcluded(record));
  const filteredCredentials = workableCredentials.filter((record) => {
    const matchesSearch = !search || `${record.provider?.name} ${record.provider?.npi} ${record.payer?.name} ${record.payer?.networks} ${record.networkName} ${record.providerRelationsContact} ${record.referenceNumber} ${record.nextAction}`.toLowerCase().includes(search);
    const days = dateDistance(taskDate(record).date);
    const matchesFilter = queueFilter === "All Active" || (queueFilter === "MHMD Contract" && record.evidenceReference.includes("MHMD Managed Care Contracts")) || (queueFilter === "Evidence Needed" && needsEvidence(record)) || (queueFilter === "Open" && record.status !== "Approved") || (queueFilter === "Due Soon" && record.status !== "Approved" && days >= 0 && days <= 7) || record.status === queueFilter || record.priority === queueFilter;
    return matchesSearch && matchesFilter;
  });
  const openRecords = workableCredentials.filter((record) => record.status !== "Approved");
  const actionableOpen = openRecords.filter((record) => record.status !== "Not Started" || Boolean(record.followUpDate) || record.priority === "High");
  const sortedWork = [...actionableOpen].sort((a, b) => dateDistance(taskDate(a).date) - dateDistance(taskDate(b).date) || (a.priority === "High" ? -1 : b.priority === "High" ? 1 : 0));
  const evidenceRecords = workableCredentials.filter(needsEvidence).sort((a, b) => a.providerId - b.providerId || a.payerId - b.payerId);
  const todaysWork = [...evidenceRecords, ...sortedWork].slice(0, 6);
  const reminders = sortedWork.filter((record) => dateDistance(taskDate(record).date) <= 7);
  const suggestions = data.providers.filter((provider) => !search || `${provider.name} ${provider.npi}`.toLowerCase().includes(search)).slice(0, 6);
  const localPayers = data.payers.filter((payer) => payer.relevance.toLowerCase().includes("houston")).slice(0, 2);

  const navItems: { id: View; label: string }[] = [
    { id: "start", label: "Start Here" }, { id: "dashboard", label: "Dashboard" }, { id: "queue", label: "Work Queue" }, { id: "schedule", label: "To-Do Schedule" }, { id: "analytics", label: "Analytics" }, { id: "providers", label: "Providers" }, { id: "payers", label: "Payers" }, { id: "eftEra", label: "EFT / ERA" }, { id: "activity", label: "Activity" },
  ];

  const pageCopy: Record<View, { title: string; body: string }> = {
    start: { title: "Credentialing Launch Center", body: "A safe first-day workflow that turns imported information into confirmed network participation." },
    dashboard: { title: "Credentialing Dashboard", body: "Live provider-payer progress and the work that needs attention." },
    queue: { title: "Work Queue", body: "Filter records, open a row, and save status, date, priority, and next action." },
    schedule: { title: "To-Do Schedule", body: "A dated task list generated from each credentialing application’s progress." },
    analytics: { title: "Credentialing Analytics", body: "Transparent totals calculated from every provider-payer record." },
    providers: { title: "Providers", body: "Provider profiles, photos, NPIs, and participation progress." },
    payers: { title: "Payers", body: "Official payer portals, brand marks, and verified Texas provider contacts." },
    eftEra: { title: "EFT / ERA Enrollment", body: "Track payer-level electronic payments and remittance enrollment for EPC’s group billing entity." },
    activity: { title: "Activity", body: "A record of changes made in the portal." },
  };

  function openAdd() {
    if (view === "providers") setModal({ type: "provider" });
    else if (view === "payers") setModal({ type: "payer" });
    else setView("queue");
  }

  function chooseProvider(provider: Provider) {
    setQuery(provider.npi);
    setView("providers");
    setSearchFocused(false);
  }

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <div className="brand"><EPCLogo /></div>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setSearchFocused(false); setRemindersOpen(false); }}>
              <Icon name={item.id} />{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="security-dot" />Private workspace<div>Houston, Texas</div></div>
      </aside>

      <div className="portal-main">
        <header className="topbar">
          <div className="search-wrap">
            <label className="searchbox"><Icon name="search" /><input value={query} onFocus={() => setSearchFocused(view !== "eftEra")} onBlur={() => setSearchFocused(false)} onChange={(event) => { setQuery(event.target.value); setSearchFocused(view !== "eftEra"); }} onKeyDown={(event) => { if (event.key === "Escape") setSearchFocused(false); if (view !== "eftEra" && event.key === "Enter" && suggestions[0]) chooseProvider(suggestions[0]); }} placeholder={view === "eftEra" ? "Search payer, status, owner, or reference…" : "Search doctor name or 10-digit NPI…"} aria-label={view === "eftEra" ? "Search EFT and ERA enrollment records" : "Search provider name or NPI"} autoComplete="off" />{query ? <button type="button" className="search-clear" aria-label="Clear search" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(""); setSearchFocused(view !== "eftEra"); }}>×</button> : null}</label>
            {searchFocused && view !== "eftEra" ? <div className="search-suggestions" role="listbox"><p>{query ? "Matching providers" : "Try a provider name or NPI"}</p>{suggestions.map((provider) => <button type="button" role="option" aria-selected="false" key={provider.id} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseProvider(provider)}><ProviderAvatar provider={provider} size="small" /><span><strong>{provider.name}</strong><small>{provider.credentials} · NPI {provider.npi}</small></span><b>→</b></button>)}{!suggestions.length ? <div className="no-suggestion">No provider matches “{query}”.</div> : null}<small className="prediction-tip">Prediction: select a name or press Enter for the first match.</small></div> : null}
          </div>
          <div className="reminder-wrap"><button className="reminder-button" aria-label={`${reminders.length} reminders`} onClick={() => setRemindersOpen((open) => !open)}><span aria-hidden="true">♢</span>{reminders.length ? <b>{reminders.length > 99 ? "99+" : reminders.length}</b> : null}</button>{remindersOpen ? <ReminderPopover records={reminders.slice(0, 6)} onOpen={(record) => { setModal({ type: "credential", record }); setRemindersOpen(false); }} onSchedule={() => { setView("schedule"); setRemindersOpen(false); }} /> : null}</div>
          <button className="button secondary share-button" onClick={() => setModal({ type: "share" })}><Icon name="share" />Share</button>
          <button className="avatar-button" aria-label="Open user menu">JR</button>
        </header>

        <main>
          {error ? <div className="error-banner" role="alert"><strong>Something needs attention.</strong><span>{error}</span><button onClick={() => setError("")}>×</button></div> : null}
          {loading ? <div className="loading-state"><span className="spinner" />Loading EPC portal…</div> : (
            <>
              <section className="page-heading">
                <div><p className="eyebrow">Houston, Texas</p><h1>{pageCopy[view].title}</h1><p>{pageCopy[view].body}</p></div>
                {(["start", "dashboard", "providers", "payers"] as View[]).includes(view) ? <button className="button primary" onClick={openAdd}><Icon name="add" />{view === "providers" ? "Add provider" : view === "payers" ? "Add payer" : "Manage work"}</button> : null}
              </section>

              {view === "start" && <StartView providers={data.providers} payers={data.payers} activeRecords={workableCredentials} excludedCount={data.credentials.length - workableCredentials.length} evidenceNeeded={evidenceNeeded} openRecords={openRecords} onOpenCredential={(record) => setModal({ type: "credential", record })} onNavigate={(nextView, filter) => { if (filter) setQueueFilter(filter); setView(nextView); }} />}
              {view === "dashboard" && <Dashboard providers={data.providers} payers={data.payers} confirmed={confirmed} approvalsOnFile={approvalsOnFile} evidenceNeeded={evidenceNeeded} notStarted={notStarted} openCount={openRecords.length} completion={completion} work={todaysWork} localPayers={localPayers} onOpenCredential={(record) => setModal({ type: "credential", record })} onNavigate={setView} />}
              {view === "providers" && <ProvidersView providers={filteredProviders} credentials={data.credentials} onAdd={() => setModal({ type: "provider" })} onView={(provider) => setModal({ type: "providerDetail", record: provider })} onEdit={(provider) => setModal({ type: "provider", record: provider })} onDelete={(provider) => { if (confirm(`Delete ${provider.name}? Their credentialing rows will also be deleted.`)) void save("DELETE", undefined, `?entity=provider&id=${provider.id}`); }} />}
              {view === "payers" && <PayersView payers={filteredPayers} onAdd={() => setModal({ type: "payer" })} onEdit={(payer) => setModal({ type: "payer", record: payer })} onDelete={(payer) => { if (confirm(`Delete ${payer.name}? Their credentialing rows will also be deleted.`)) void save("DELETE", undefined, `?entity=payer&id=${payer.id}`); }} />}
              {view === "eftEra" && <EftEraView records={eftEraRecords} payers={payerMap} query={search} onEdit={(record) => setModal({ type: "eftEra", record })} />}
              {view === "queue" && <QueueView records={filteredCredentials} filter={queueFilter} setFilter={setQueueFilter} onEdit={(record) => setModal({ type: "credential", record })} />}
              {view === "schedule" && <ScheduleView records={actionableOpen} onEdit={(record) => setModal({ type: "credential", record })} />}
              {view === "analytics" && <AnalyticsView providers={data.providers} payers={data.payers} records={workableCredentials} excludedCount={data.credentials.length - workableCredentials.length} />}
              {view === "activity" && <ActivityView rows={data.activity} />}
            </>
          )}
        </main>
      </div>
      {modal ? <ModalView modal={modal} providers={providerMap} payers={payerMap} credentials={data.credentials} eftEraRecords={eftEraRecords} shareMode={data.settings.shareMode ?? "private"} saving={saving} onClose={() => setModal(null)} onOpenCredential={(record) => setModal({ type: "credential", record })} onSave={save} /> : null}
    </div>
  );
}

function StartView({ providers, payers, activeRecords, excludedCount, evidenceNeeded, openRecords, onOpenCredential, onNavigate }: { providers: Provider[]; payers: Payer[]; activeRecords: EnrichedCredential[]; excludedCount: number; evidenceNeeded: number; openRecords: EnrichedCredential[]; onOpenCredential: (record: Credential) => void; onNavigate: (view: View, filter?: string) => void }) {
  const activePlans = payers.filter((payer) => payer.trackingMode === "Active").length;
  const delegatedPlans = payers.filter((payer) => payer.contractStatus === "Delegated contract on file").length;
  const untriaged = openRecords.filter((record) => record.status === "Not Started" && !record.followUpDate).length;
  const unassigned = openRecords.filter((record) => !record.assignedTo || record.assignedTo === "Unassigned").length;
  const missingFollowUp = openRecords.filter((record) => record.status !== "Not Started" && !record.followUpDate).length;
  const confirmationRows = activeRecords.filter(needsEvidence).slice(0, 6);
  const steps = [
    { title: "Confirm imported approvals", count: evidenceNeeded, detail: "Contact payer Provider Relations and record the exact network, representative, effective date, and reference.", action: "Contact Provider Relations", filter: "Evidence Needed" },
    { title: "Triage untouched records", count: untriaged, detail: "Decide whether to apply, hold, or mark the record not applicable.", action: "Open untriaged", filter: "Not Started" },
    { title: "Assign an owner", count: unassigned, detail: "Replace Unassigned with the person responsible for follow-up.", action: "Open work queue", filter: "Open" },
    { title: "Set real follow-up dates", count: missingFollowUp, detail: "Submitted and pending cases should always have a next contact date.", action: "Open schedule", view: "schedule" as View },
  ];
  return <><section className="launch-hero"><div><Badge tone="info">EPC launch plan</Badge><h2>Start with proof, scope, and ownership.</h2><p>Provider participation is confirmed directly with insurance/payer Provider Relations. MHMD contract pathways remain supporting evidence only, and Medicaid remains excluded from active work.</p><div className="launch-actions"><button className="button primary" onClick={() => onNavigate("queue", "Evidence Needed")}>Contact Provider Relations</button><button className="button secondary" onClick={() => onNavigate("providers")}>Review provider profiles</button></div></div><aside><span><strong>{providers.length}</strong> providers loaded</span><span><strong>{activePlans}</strong> active payer products</span><span><strong>{delegatedPlans}</strong> MHMD contract pathways</span><span><strong>{excludedCount}</strong> reference records excluded</span></aside></section><section className="launch-grid"><article className="panel launch-checklist"><div className="panel-title"><div><h2>Launch checklist</h2><p>Work these in order. Counts update as records are saved.</p></div></div><div className="launch-steps">{steps.map((step, index) => <div className={step.count === 0 ? "complete" : ""} key={step.title}><span>{step.count === 0 ? "✓" : index + 1}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div><Badge tone={step.count === 0 ? "success" : index === 0 ? "warning" : "muted"}>{step.count === 0 ? "Complete" : `${step.count} left`}</Badge><button className="table-action" onClick={() => onNavigate(step.view ?? "queue", step.filter)}>{step.action}</button></div>)}</div></article><article className="panel launch-safety"><div className="panel-title"><div><h2>Provider Relations confirmation rules</h2><p>Use these before marking any network confirmed.</p></div></div><ul><li><strong>Contact the payer’s Provider Relations team.</strong><span>Confirm the individual provider’s NPI is loaded for the exact product and network.</span></li><li><strong>Record who confirmed it.</strong><span>Save the representative or department, verification date, and case/reference number when provided.</span></li><li><strong>Capture the effective date.</strong><span>Approval without a loaded effective date may still result in out-of-network claims.</span></li><li><strong>No PHI or SSNs.</strong><span>Store tracking details and references only—not patient documents or sensitive identifiers.</span></li></ul></article></section>{confirmationRows.length ? <section className="panel launch-focus"><div className="panel-title"><div><h2>First Provider Relations calls</h2><p>These imported approvals still need direct payer confirmation of the exact network and provider effective date.</p></div><button className="text-button" onClick={() => onNavigate("queue", "Evidence Needed")}>View all <span>→</span></button></div><div className="launch-focus-list">{confirmationRows.map((record) => <button key={record.id} onClick={() => onOpenCredential(record)}>{record.provider ? <ProviderAvatar provider={record.provider} size="small" /> : null}<span><strong>{record.provider?.name}</strong><small>{record.payer?.name} · {record.payer?.networks || record.payer?.scope}</small></span><Badge tone="warning">Provider Relations needed</Badge><b>›</b></button>)}</div></section> : null}</>;
}

function Dashboard({ providers, payers, confirmed, approvalsOnFile, evidenceNeeded, notStarted, openCount, completion, work, localPayers, onOpenCredential, onNavigate }: { providers: Provider[]; payers: Payer[]; confirmed: number; approvalsOnFile: number; evidenceNeeded: number; notStarted: number; openCount: number; completion: number; work: EnrichedCredential[]; localPayers: Payer[]; onOpenCredential: (record: Credential) => void; onNavigate: (view: View) => void }) {
  const cards = [{ label: "Provider Relations Confirmed", value: confirmed, tone: "green" }, { label: "Approval on File", value: approvalsOnFile, tone: "blue" }, { label: "PR Confirmation Needed", value: evidenceNeeded, tone: "amber" }, { label: "Open Work", value: openCount, tone: "amber" }, { label: "Not Started", value: notStarted, tone: "blue" }, { label: "Confirmed Coverage", value: `${completion}%`, tone: "teal" }];
  return <>
    <section className="kpi-grid">{cards.map((card) => <article className="kpi-card" key={card.label}><span className={`kpi-icon ${card.tone}`}>{card.label === "Provider Relations Confirmed" ? "✓" : card.label === "PR Confirmation Needed" ? "!" : card.label === "Open Work" || card.label === "Not Started" ? "◷" : card.label === "Confirmed Coverage" ? "◔" : "▦"}</span><div><strong>{card.value}</strong><span>{card.label}</span></div></article>)}</section>
    <p className="dashboard-scope-note">Coverage calculations use {providers.length} active provider profiles and {payers.filter((payer) => payer.trackingMode === "Active").length} active payer products. Reference-only and not-accepted products do not lower completion.</p>
    <section className="dashboard-grid">
      <article className="panel work-panel"><div className="panel-title"><div><h2>Priority Credentialing Work</h2><p>Evidence gaps first, followed by active dated follow-ups.</p></div><button className="text-button" onClick={() => onNavigate("queue")}>Open queue <span>→</span></button></div>
        <div className="work-table table-scroll"><table><thead><tr><th>Provider</th><th>Payer</th><th>Task</th><th>Due</th><th>Status</th><th /></tr></thead><tbody>{work.map((record) => { const due = taskDate(record); return <tr key={record.id}><td><div className="provider-cell">{record.provider ? <ProviderAvatar provider={record.provider} size="small" /> : null}<strong>{record.provider?.name}</strong></div></td><td>{record.payer?.name}</td><td>{recommendedTask(record)}</td><td><span className={`due-label ${dateDistance(due.date) < 0 ? "overdue" : ""}`}>{new Date(`${due.date}T00:00:00`).toLocaleDateString()}<small>{due.source}</small></span></td><td><Badge tone={record.status === "Approved" ? "success" : record.status === "Needs Correction" ? "danger" : "muted"}>{record.status}</Badge></td><td><button className="table-action" onClick={() => onOpenCredential(record)}>Open</button></td></tr>; })}</tbody></table></div>
      </article>
      <article className="panel contact-panel"><div className="panel-title"><div><h2>Houston Payer Contacts</h2><p>Official provider-service routes.</p></div></div>{localPayers.map((payer) => <PayerContact key={payer.id} payer={payer} />)}<button className="text-button full" onClick={() => onNavigate("payers")}>View all payer contacts <span>→</span></button></article>
    </section>
  </>;
}

function ReminderPopover({ records, onOpen, onSchedule }: { records: EnrichedCredential[]; onOpen: (record: Credential) => void; onSchedule: () => void }) {
  return <aside className="reminder-popover"><header><div><strong>Credentialing reminders</strong><small>Visible to signed-in portal users</small></div><Badge tone={records.length ? "warning" : "success"}>{records.length ? `${records.length} shown` : "All clear"}</Badge></header><div className="reminder-list">{records.map((record) => { const due = taskDate(record); const days = dateDistance(due.date); return <button key={record.id} onClick={() => onOpen(record)}><span className={`reminder-date ${days < 0 ? "overdue" : days === 0 ? "today" : ""}`}>{days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}</span><span><strong>{record.provider?.name}</strong><small>{record.payer?.name} · {recommendedTask(record)}</small></span><b>›</b></button>; })}{!records.length ? <div className="reminder-empty">No tasks are due in the next seven days.</div> : null}</div><button className="text-button full" onClick={onSchedule}>View full to-do schedule <span>→</span></button></aside>;
}

function PayerContact({ payer }: { payer: Payer }) {
  return <div className="payer-contact"><PayerLogo payer={payer} /><div><h3>{payer.name}</h3><div className="contact-links">{payer.portalUrl ? <a href={payer.portalUrl} target="_blank" rel="noreferrer"><Icon name="external" />Open portal</a> : null}{payer.phone ? <a href={`tel:${payer.phone.replace(/[^+\d]/g, "")}`}><Icon name="phone" />{payer.phone}</a> : null}{payer.email ? <a href={`mailto:${payer.email}`}><Icon name="email" />{payer.email}</a> : null}</div></div></div>;
}

function ProvidersView({ providers, credentials, onAdd, onView, onEdit, onDelete }: { providers: Provider[]; credentials: Credential[]; onAdd: () => void; onView: (provider: Provider) => void; onEdit: (provider: Provider) => void; onDelete: (provider: Provider) => void }) {
  if (!providers.length) return <EmptyState title="No providers found" body="Try a different search or add a provider." action="Add provider" onAction={onAdd} />;
  return <section className="provider-grid">{providers.map((provider) => { const rows = credentials.filter((record) => record.providerId === provider.id && !isExcluded(record)); const confirmed = rows.filter(isConfirmed).length; const evidence = rows.filter(needsEvidence).length; const progress = rows.length ? Math.round((confirmed / rows.length) * 100) : 0; return <article className="provider-card" key={provider.id}><div className="provider-card-top"><ProviderAvatar provider={provider} size="large" /><div className="provider-actions"><button onClick={() => onEdit(provider)} aria-label={`Edit ${provider.name}`}><Icon name="edit" /></button><button className="danger-action" onClick={() => onDelete(provider)} aria-label={`Delete ${provider.name}`}>×</button></div></div><h2>{provider.name}<span>{provider.credentials}</span></h2><p>{provider.specialty}</p><dl><div><dt>NPI</dt><dd>{provider.npi}</dd></div><div><dt>Location</dt><dd>{provider.location}</dd></div></dl><div className="progress-line"><div><span>Provider Relations confirmed</span><strong>{progress}%</strong></div><progress max="100" value={progress} /></div><button className="provider-coverage-button" onClick={() => onView(provider)}>View insurance <span>{confirmed} PR confirmed · {evidence} need PR</span></button><div className="provider-card-foot"><Badge tone={provider.active ? "success" : "muted"}>{provider.active ? "Active" : "Inactive"}</Badge>{provider.profileUrl ? <a href={provider.profileUrl} target="_blank" rel="noreferrer">Photo source ↗</a> : null}</div></article>; })}</section>;
}

function PayersView({ payers, onAdd, onEdit, onDelete }: { payers: Payer[]; onAdd: () => void; onEdit: (payer: Payer) => void; onDelete: (payer: Payer) => void }) {
  if (!payers.length) return <EmptyState title="No payers found" body="Try a different search or add an insurance payer." action="Add payer" onAction={onAdd} />;
  return <section className="payer-groups">{planCategoryOrder.map((category) => { const rows = payers.filter((payer) => payerCategory(payer) === category); if (!rows.length) return null; return <section className={`payer-group ${category.toLowerCase()}`} key={category}><header><div><h2>{category}</h2><p>{categoryDescriptions[category]}</p></div><Badge tone={category === "Medicaid" ? "muted" : "info"}>{rows.length} {rows.length === 1 ? "plan" : "plans"}</Badge></header><div className="payer-list">{rows.map((payer) => <article className="payer-row" key={payer.id}><PayerLogo payer={payer} size="large" /><div className="payer-main"><div className="payer-name-line"><h2>{payer.name}</h2><Badge tone={payer.trackingMode === "Active" ? "success" : "muted"}>{payer.trackingMode}</Badge><Badge tone="info">{payer.relevance}</Badge>{payer.contractStatus === "Delegated contract on file" ? <Badge tone="warning">MHMD contract on file</Badge> : null}</div><p>{payer.scope}</p>{payer.networks ? <small className="payer-networks"><strong>Networks:</strong> {payer.networks}</small> : null}{payer.contractEvidence ? <div className="payer-contract-evidence"><strong>{payer.contractEvidence}</strong><span>{payer.verificationRule}</span></div> : null}<span>{payer.notes}</span></div><div className="payer-links">{payer.portalUrl ? <a className="button compact primary" href={payer.portalUrl} target="_blank" rel="noreferrer">Open portal ↗</a> : null}{payer.phone ? <a href={`tel:${payer.phone.replace(/[^+\d]/g, "")}`}><Icon name="phone" />{payer.phone}</a> : null}{payer.email ? <a href={`mailto:${payer.email}`}><Icon name="email" />{payer.email}</a> : null}</div><div className="row-actions"><button onClick={() => onEdit(payer)} aria-label={`Edit ${payer.name}`}><Icon name="edit" /></button><button className="danger-action" onClick={() => onDelete(payer)} aria-label={`Delete ${payer.name}`}>×</button></div></article>)}</div></section>; })}</section>;
}

function EftEraView({ records, payers, query, onEdit }: { records: EftEraRecord[]; payers: Map<number, Payer>; query: string; onEdit: (record: EftEraRecord) => void }) {
  const rows = records.filter((record) => { const payer = payers.get(record.payerId); return payer && (!query || `${payer.name} ${record.eftStatus} ${record.eraStatus} ${record.enrollmentMethod} ${record.confirmationNumber} ${record.assignedTo}`.toLowerCase().includes(query)); });
  const eftActive = records.filter((record) => record.eftStatus === "Active").length;
  const eraActive = records.filter((record) => record.eraStatus === "Active").length;
  const inProgress = records.filter((record) => [record.eftStatus, record.eraStatus].some((status) => ["Enrollment Submitted", "Payer Review"].includes(status))).length;
  const notStarted = records.filter((record) => record.eftStatus === "Not Started" || record.eraStatus === "Not Started").length;
  return <>
    <section className="eft-guidance"><Icon name="alert" /><div><strong>EFT/ERA is separate from network credentialing.</strong><span>Enrollment may be submitted while contracting is pending, but payments and remittances begin only after the payer accepts claims for EPC. Store confirmation references only—never bank account or routing numbers.</span></div></section>
    <section className="eft-summary"><article><span>EFT active</span><strong>{eftActive}</strong><small>Electronic payments enabled</small></article><article><span>ERA active</span><strong>{eraActive}</strong><small>Electronic remittance enabled</small></article><article><span>In progress</span><strong>{inProgress}</strong><small>Submitted or under payer review</small></article><article><span>Needs enrollment</span><strong>{notStarted}</strong><small>EFT or ERA not started</small></article></section>
    <section className="panel eft-panel"><div className="panel-title"><div><h2>Payer enrollment tracker</h2><p>One group-level record per active payer for Group NPI 1033286380 and TIN ending 4739.</p></div><Badge tone="info">{rows.length} payers</Badge></div><div className="table-scroll"><table className="eft-table"><thead><tr><th>Payer</th><th>EFT</th><th>ERA</th><th>Method</th><th>Submitted</th><th>Effective</th><th>Follow-up</th><th>Owner</th><th /></tr></thead><tbody>{rows.map((record) => { const payer = payers.get(record.payerId)!; return <tr key={record.payerId}><td><div className="eft-payer"><PayerLogo payer={payer} /><span><strong>{payer.name}</strong><small>{payer.scope}</small></span></div></td><td><Badge tone={record.eftStatus === "Active" ? "success" : record.eftStatus === "Rejected" ? "danger" : record.eftStatus === "Not Started" ? "muted" : "warning"}>{record.eftStatus}</Badge></td><td><Badge tone={record.eraStatus === "Active" ? "success" : record.eraStatus === "Rejected" ? "danger" : record.eraStatus === "Not Started" ? "muted" : "warning"}>{record.eraStatus}</Badge></td><td>{record.enrollmentMethod}</td><td>{record.submittedDate ? new Date(`${record.submittedDate}T00:00:00`).toLocaleDateString() : "—"}</td><td>{record.effectiveDate ? new Date(`${record.effectiveDate}T00:00:00`).toLocaleDateString() : "—"}</td><td>{record.followUpDate ? new Date(`${record.followUpDate}T00:00:00`).toLocaleDateString() : "—"}</td><td>{record.assignedTo}</td><td><button className="table-action" onClick={() => onEdit(record)}>Update</button></td></tr>; })}</tbody></table></div>{!rows.length ? <EmptyState title="No EFT/ERA records found" body="Clear the search or try a payer name." /> : null}</section>
  </>;
}

function QueueView({ records, filter, setFilter, onEdit }: { records: (Credential & { provider?: Provider; payer?: Payer })[]; filter: string; setFilter: (filter: string) => void; onEdit: (record: Credential) => void }) {
  const filters = ["Evidence Needed", "MHMD Contract", "Open", "Due Soon", "High", "Needs Correction", "Not Started", "Approved", "All Active"];
  return <section className="panel queue-panel"><div className="queue-toolbar"><div className="filter-chips">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><span>{records.length} records</span></div><div className="table-scroll"><table className="queue-table"><thead><tr><th>Provider</th><th>Payer / network</th><th>Status</th><th>Follow-up</th><th>Priority</th><th>Assigned to</th><th>Next action</th><th>Action</th></tr></thead><tbody>{records.slice(0, 250).map((record) => <tr key={record.id}><td><div className="provider-cell">{record.provider ? <ProviderAvatar provider={record.provider} size="small" /> : null}<strong>{record.provider?.name}</strong></div></td><td><span className="payer-queue-cell"><strong>{record.payer?.name}</strong><small>{record.networkName || record.payer?.networks || record.payer?.scope}</small></span></td><td><Badge tone={needsEvidence(record) ? "warning" : statusTone(record.status)}>{needsEvidence(record) ? "Provider Relations needed" : isConfirmed(record) ? "PR confirmed" : record.status}</Badge></td><td>{needsEvidence(record) ? <span className="suggested-date">PR confirmation not recorded</span> : record.followUpDate ? new Date(`${record.followUpDate}T00:00:00`).toLocaleDateString() : <span className="suggested-date">Suggested {new Date(`${taskDate(record).date}T00:00:00`).toLocaleDateString()}</span>}</td><td><Badge tone={record.priority === "High" ? "danger" : record.priority === "Low" ? "info" : "warning"}>{record.priority}</Badge></td><td>{record.assignedTo}</td><td>{recommendedTask(record)}</td><td><button className="table-action" onClick={() => onEdit(record)}>{needsEvidence(record) ? "Contact PR" : "Edit"}</button></td></tr>)}</tbody></table></div>{!records.length ? <EmptyState title="Nothing in this view" body="Change the filter or search terms." /> : null}</section>;
}

function ScheduleView({ records, onEdit }: { records: EnrichedCredential[]; onEdit: (record: Credential) => void }) {
  const sorted = [...records].sort((a, b) => dateDistance(taskDate(a).date) - dateDistance(taskDate(b).date) || a.providerId - b.providerId);
  const groups = [
    { title: "Overdue", tone: "danger", rows: sorted.filter((record) => dateDistance(taskDate(record).date) < 0) },
    { title: "Today", tone: "warning", rows: sorted.filter((record) => dateDistance(taskDate(record).date) === 0) },
    { title: "Next 7 days", tone: "info", rows: sorted.filter((record) => { const days = dateDistance(taskDate(record).date); return days > 0 && days <= 7; }) },
    { title: "Later", tone: "muted", rows: sorted.filter((record) => dateDistance(taskDate(record).date) > 7) },
  ];
  const explicitlyScheduled = records.filter((record) => Boolean(record.followUpDate)).length;
  return <><section className="schedule-summary"><article><strong>{records.length}</strong><span>Open tasks</span></article><article><strong>{groups[0].rows.length}</strong><span>Overdue</span></article><article><strong>{groups[1].rows.length}</strong><span>Due today</span></article><article><strong>{explicitlyScheduled}</strong><span>Dates confirmed</span></article></section><section className="schedule-groups">{groups.map((group) => <article className="panel schedule-group" key={group.title}><header><div><h2>{group.title}</h2><p>{group.title === "Later" ? "Future credentialing follow-ups" : "Tasks generated from current progress"}</p></div><Badge tone={group.tone}>{group.rows.length}</Badge></header><div className="todo-list">{group.rows.slice(0, 100).map((record) => { const due = taskDate(record); return <div className="todo-row" key={record.id}><span className="todo-date"><strong>{new Date(`${due.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong><small>{due.source}</small></span><div className="todo-person">{record.provider ? <ProviderAvatar provider={record.provider} size="small" /> : null}<span><strong>{record.provider?.name}</strong><small>{record.payer?.name}</small></span></div><div className="todo-action"><strong>{recommendedTask(record)}</strong><span><Badge tone={record.status === "Needs Correction" || record.status === "Denied" ? "danger" : "info"}>{record.status}</Badge><Badge tone={record.priority === "High" ? "danger" : "neutral"}>{record.priority}</Badge></span></div><button className="table-action" onClick={() => onEdit(record)}>Update</button></div>; })}{!group.rows.length ? <div className="group-empty">No tasks in this group.</div> : null}</div></article>)}</section></>;
}

function AnalyticsView({ providers, payers, records, excludedCount }: { providers: Provider[]; payers: Payer[]; records: EnrichedCredential[]; excludedCount: number }) {
  const confirmed = records.filter(isConfirmed).length;
  const ready = records.filter(isReadyToAccept).length;
  const submitted = records.filter(isAppliedOrSubmitted).length;
  const evidence = records.filter(needsEvidence).length;
  const open = records.filter((record) => record.status !== "Approved").length;
  const statusRows = statuses.map((status) => ({ label: status, value: records.filter((record) => record.status === status).length })).filter((row) => row.value);
  const providerRows = providers.map((provider) => { const rows = records.filter((record) => record.providerId === provider.id); const count = rows.filter(isConfirmed).length; const onFile = rows.filter((record) => record.status === "Approved").length; return { name: provider.name, count, onFile, total: rows.length, percent: rows.length ? Math.round((count / rows.length) * 100) : 0 }; }).sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));
  const payerRows = payers.map((payer) => { const rows = records.filter((record) => record.payerId === payer.id); const count = rows.filter(isConfirmed).length; const onFile = rows.filter((record) => record.status === "Approved").length; return { name: payer.name, count, onFile, total: rows.length, percent: rows.length ? Math.round((count / rows.length) * 100) : 0 }; }).sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));
  const readinessRows = providers.map((provider) => {
    const rows = records.filter((record) => record.providerId === provider.id);
    const readyPlans = rows.filter(isReadyToAccept).sort((a, b) => (a.payer?.name ?? "").localeCompare(b.payer?.name ?? ""));
    const submittedPlans = rows.filter(isAppliedOrSubmitted).sort((a, b) => (a.payer?.name ?? "").localeCompare(b.payer?.name ?? ""));
    const futurePlans = rows.filter((record) => isConfirmed(record) && record.effectiveDate > localDateKey()).sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    const awaitingConfirmation = rows.filter(needsEvidence).length;
    return { provider, readyPlans, submittedPlans, futurePlans, awaitingConfirmation };
  }).sort((a, b) => b.readyPlans.length - a.readyPlans.length || a.provider.name.localeCompare(b.provider.name));

  return <>
    <section className="analytics-summary">
      <article><span>Active records</span><strong>{records.length}</strong><small>Reference-only plans excluded</small></article>
      <article><span>Ready to accept now</span><strong>{ready}</strong><small>Provider-payer networks active today</small></article>
      <article><span>Applied / submitted</span><strong>{submitted}</strong><small>Submitted, in progress, or pending</small></article>
      <article><span>PR confirmation needed</span><strong>{evidence}</strong><small>{open} active records are not approved yet</small></article>
    </section>

    <section className="panel readiness-panel">
      <div className="panel-title"><div><h2>Insurance readiness and applications by provider</h2><p>See what can be accepted today and which payer applications are already submitted or moving through review.</p></div><Badge tone={ready ? "success" : "warning"}>{ready} ready</Badge></div>
      <div className="readiness-grid">{readinessRows.map(({ provider, readyPlans, submittedPlans, futurePlans, awaitingConfirmation }) => <article className="readiness-provider" key={provider.id}>
        <header><ProviderAvatar provider={provider} size="small" /><span><strong>{provider.name}</strong><small>NPI {provider.npi}</small></span><Badge tone={readyPlans.length ? "success" : "muted"}>{readyPlans.length ? `${readyPlans.length} ready` : "None yet"}</Badge></header>
        {readyPlans.length ? <div className="readiness-plans">{readyPlans.map((record) => record.payer ? <div className="readiness-plan" key={record.id}><PayerLogo payer={record.payer} /><span><strong>{record.payer.name}</strong><small>{record.networkName}</small><em>Accept starting {new Date(`${record.effectiveDate}T00:00:00`).toLocaleDateString()}</em></span></div> : null)}</div> : <div className="readiness-empty"><strong>Do not schedule as in-network yet.</strong><span>{awaitingConfirmation ? `${awaitingConfirmation} approval${awaitingConfirmation === 1 ? "" : "s"} still need Provider Relations confirmation.` : "No active payer has completed the confirmation requirements."}</span></div>}
        {submittedPlans.length ? <div className="readiness-submitted"><strong>Applied / submitted</strong>{submittedPlans.map((record) => <div key={record.id}><span><b>{record.payer?.name ?? "Payer"}</b><small>{record.networkName || record.payer?.networks || record.payer?.scope}</small></span><Badge tone="info">{record.status}</Badge></div>)}</div> : null}
        {futurePlans.length ? <div className="readiness-future"><strong>Confirmed—starts later</strong>{futurePlans.map((record) => <span key={record.id}>{record.payer?.name ?? "Payer"} · {new Date(`${record.effectiveDate}T00:00:00`).toLocaleDateString()}</span>)}</div> : null}
      </article>)}</div>
    </section>

    <section className="analytics-grid">
      <article className="panel analytics-panel"><div className="panel-title"><div><h2>Status distribution</h2><p>Status and Provider Relations confirmation are reported separately.</p></div></div><div className="quality-callout"><span><strong>{confirmed}</strong>Confirmed by Provider Relations</span><span><strong>{evidence}</strong>Approved but awaiting direct confirmation</span></div><div className="status-bars">{statusRows.map((row) => { const percent = records.length ? Math.round((row.value / records.length) * 100) : 0; return <div key={row.label}><span><strong>{row.label}</strong><small>{row.value} · {percent}%</small></span><div><i style={{ width: `${percent}%` }} /></div></div>; })}</div></article>
      <article className="panel analytics-panel"><div className="panel-title"><div><h2>Provider confirmation</h2><p>Provider Relations-confirmed participation per provider.</p></div></div><div className="rank-list">{providerRows.map((row) => <div key={row.name}><span><strong>{row.name}</strong><small>{row.count} PR confirmed · {row.onFile} approved on file · {row.total} active</small></span><progress max="100" value={row.percent} /><b>{row.percent}%</b></div>)}</div></article>
      <article className="panel analytics-panel wide-analytics"><div className="panel-title"><div><h2>Payer participation</h2><p>Providers confirmed directly with each payer’s Provider Relations team.</p></div></div><div className="payer-analytics">{payerRows.filter((row) => row.total > 0).map((row) => <div key={row.name}><span><strong>{row.name}</strong><small>{row.count} PR confirmed · {row.onFile} approved on file</small></span><progress max="100" value={row.percent} /><b>{row.percent}%</b></div>)}</div></article>
    </section>
    <p className="analytics-note">“Applied / submitted” includes Application Submitted, In Progress, and Pending. “Ready to accept now” requires Approved status, exact network, Provider Relations contact, verification date, and an effective date active today. A future effective date remains confirmed but not yet ready. {confirmed} provider-payer records are currently Provider Relations confirmed. {excludedCount} reference-only or not-accepted {excludedCount === 1 ? "record is" : "records are"} excluded from work and completion calculations.</p>
  </>;
}

function ActivityView({ rows }: { rows: Activity[] }) {
  return <section className="panel activity-panel"><div className="activity-list">{rows.map((row) => <article key={row.id}><span className={`activity-icon ${row.entityType}`}><Icon name={row.action === "Deleted" ? "alert" : "check"} /></span><div><h3>{row.action} · {row.entityName}</h3><p>{row.detail || row.entityType}</p></div><time>{new Date(row.createdAt.replace(" ", "T") + "Z").toLocaleString()}</time></article>)}</div>{!rows.length ? <EmptyState title="No activity yet" body="Changes to providers, payers, access, and credentialing records will appear here." /> : null}</section>;
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><div className="empty-icon">✓</div><h2>{title}</h2><p>{body}</p>{action && onAction ? <button className="button primary" onClick={onAction}>{action}</button> : null}</div>;
}

function ModalView({ modal, providers, payers, credentials, eftEraRecords, shareMode, saving, onClose, onOpenCredential, onSave }: { modal: NonNullable<Modal>; providers: Map<number, Provider>; payers: Map<number, Payer>; credentials: Credential[]; eftEraRecords: EftEraRecord[]; shareMode: string; saving: boolean; onClose: () => void; onOpenCredential: (record: Credential) => void; onSave: (method: "POST" | "PUT", body: unknown) => Promise<void> }) {
  const record = modal.record;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    if (modal.type === "eftEra") {
      const payerId = Number(data.payerId);
      const updatedRecord = { ...data, payerId, updatedAt: new Date().toISOString() } as EftEraRecord;
      const nextRecords = eftEraRecords.map((item) => item.payerId === payerId ? updatedRecord : item);
      await onSave("PUT", { entity: "setting", key: "eftEraRecords", value: JSON.stringify(nextRecords) });
      return;
    }
    if (modal.type === "provider") data.active = form.get("active") === "on" ? "true" : "false";
    const id = record && "id" in record ? record.id : undefined;
    await onSave(id ? "PUT" : "POST", { entity: modal.type, id, data: { ...data, active: data.active === "true" } });
  }
  const title = modal.type === "share" ? "Share & Access" : modal.type === "providerDetail" ? "Provider insurance profile" : modal.type === "eftEra" ? "Update EFT / ERA enrollment" : `${record ? "Edit" : "Add"} ${modal.type === "credential" ? "credentialing record" : modal.type}`;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className={`modal ${modal.type === "share" ? "share-modal" : ""} ${modal.type === "providerDetail" ? "provider-detail-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><div><p className="eyebrow">EPC Portal</p><h2 id="modal-title">{title}</h2></div><button onClick={onClose} aria-label="Close">×</button></header>
    {modal.type === "provider" ? <ProviderForm provider={record as Provider | undefined} saving={saving} onSubmit={submit} onClose={onClose} /> : null}
    {modal.type === "providerDetail" ? <ProviderInsuranceDetail provider={record as Provider} credentials={credentials} payers={payers} onOpenCredential={onOpenCredential} /> : null}
    {modal.type === "payer" ? <PayerForm payer={record as Payer | undefined} saving={saving} onSubmit={submit} onClose={onClose} /> : null}
    {modal.type === "credential" ? <CredentialForm record={record as Credential} provider={providers.get((record as Credential).providerId)} payer={payers.get((record as Credential).payerId)} saving={saving} onSubmit={submit} onClose={onClose} /> : null}
    {modal.type === "eftEra" ? <EftEraForm record={record as EftEraRecord} payer={payers.get((record as EftEraRecord).payerId)} saving={saving} onSubmit={submit} onClose={onClose} /> : null}
    {modal.type === "share" ? <ShareForm mode={shareMode} saving={saving} onClose={onClose} onSave={onSave} /> : null}
  </section></div>;
}

function EftEraForm({ record, payer, saving, onSubmit, onClose }: { record: EftEraRecord; payer?: Payer; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <form onSubmit={onSubmit} className="form-grid"><input type="hidden" name="payerId" value={record.payerId} /><div className="record-summary wide">{payer ? <PayerLogo payer={payer} size="large" /> : null}<div><strong>{payer?.name}</strong><span>Group NPI 1033286380 · TIN ending 4739</span><small>{payer?.scope}</small></div></div><div className="security-note wide"><Icon name="check" /><span>Save statuses and confirmation references only. Do not enter banking credentials, account numbers, routing numbers, SSNs, or PHI.</span></div><label>EFT status<select name="eftStatus" defaultValue={record.eftStatus}>{eftEraStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>ERA status<select name="eraStatus" defaultValue={record.eraStatus}>{eftEraStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Enrollment method<select name="enrollmentMethod" defaultValue={record.enrollmentMethod}>{enrollmentMethods.map((method) => <option key={method}>{method}</option>)}</select></label><label>Clearinghouse / vendor<input name="clearinghouse" defaultValue={record.clearinghouse} placeholder="Claim.MD, payer vendor…" /></label><label className="wide">Enrollment portal or document link<input name="portalUrl" type="url" defaultValue={record.portalUrl} placeholder="https://…" /></label><label>Submitted date<input name="submittedDate" type="date" defaultValue={record.submittedDate} /></label><label>Effective date<input name="effectiveDate" type="date" defaultValue={record.effectiveDate} /></label><label>Confirmation / case number<input name="confirmationNumber" defaultValue={record.confirmationNumber} placeholder="Non-sensitive reference only" /></label><label>Assigned to<input name="assignedTo" defaultValue={record.assignedTo} placeholder="Unassigned" /></label><label>Follow-up date<input name="followUpDate" type="date" defaultValue={record.followUpDate} /></label><label className="wide">Notes<textarea name="notes" defaultValue={record.notes} placeholder="Enrollment status, payer response, rejection reason, or next action. No banking details or PHI." /></label><FormActions saving={saving} onClose={onClose} /></form>;
}

function ProviderInsuranceDetail({ provider, credentials, payers, onOpenCredential }: { provider: Provider; credentials: Credential[]; payers: Map<number, Payer>; onOpenCredential: (record: Credential) => void }) {
  const records = credentials.filter((record) => record.providerId === provider.id).map((record) => ({ record, payer: payers.get(record.payerId) })).filter((item): item is { record: Credential; payer: Payer } => Boolean(item.payer));
  const activeRecords = records.filter(({ record }) => !isExcluded(record));
  const readyCount = activeRecords.filter(({ record }) => isReadyToAccept(record)).length;
  const submittedCount = activeRecords.filter(({ record }) => isAppliedOrSubmitted(record)).length;
  const evidenceCount = activeRecords.filter(({ record }) => needsEvidence(record)).length;
  return <div className="insurance-profile"><section className="insurance-provider"><ProviderAvatar provider={provider} size="large" /><div><h3>{provider.name}<span>{provider.credentials}</span></h3><p>{provider.specialty} · {provider.location}</p><small>NPI {provider.npi}</small></div><div className="insurance-totals"><span><strong>{readyCount}</strong>Ready now</span><span><strong>{submittedCount}</strong>Applied / submitted</span><span><strong>{evidenceCount}</strong>Need PR call</span></div></section><p className="insurance-guidance">“Ready now” means the exact network is Provider Relations-confirmed and the effective date is active. Application Submitted, In Progress, and Pending plans are shown separately and must not be scheduled as in-network yet.</p><section className="insurance-groups">{planCategoryOrder.map((category) => {
    const categoryRows = records.filter(({ payer }) => payerCategory(payer) === category);
    if (!categoryRows.length) return null;
    const readyRows = categoryRows.filter(({ record }) => isReadyToAccept(record));
    const submittedRows = categoryRows.filter(({ record }) => isAppliedOrSubmitted(record));
    const evidenceRows = categoryRows.filter(({ record }) => needsEvidence(record));
    const excluded = categoryRows.filter(({ record }) => isExcluded(record));
    const otherRows = categoryRows.filter(({ record }) => !isExcluded(record) && !isReadyToAccept(record) && !isAppliedOrSubmitted(record) && !needsEvidence(record));
    return <article className={`insurance-group ${category.toLowerCase()}`} key={category}><header><div><h4>{category}</h4><p>{categoryDescriptions[category]}</p></div><Badge tone={category === "Medicaid" ? "muted" : "info"}>{categoryRows.length} {categoryRows.length === 1 ? "plan" : "plans"}</Badge></header>{category === "Medicaid" ? <div className="insurance-column not-accepted-column"><div className="insurance-column-title"><strong>Not accepted</strong><span>No tasks or reminders</span></div><div className="insurance-list">{excluded.map(({ record, payer }) => <InsurancePlanRow key={record.id} record={record} payer={payer} />)}</div></div> : <><div className="insurance-split three"><div className="insurance-column verified-column"><div className="insurance-column-title"><strong>Ready to accept now</strong><span>{readyRows.length} active networks</span></div><div className="insurance-list">{readyRows.map(({ record, payer }) => <InsurancePlanRow key={record.id} record={record} payer={payer} onOpen={() => onOpenCredential(record)} />)}{!readyRows.length ? <p className="insurance-empty">No insurance is ready to accept yet.</p> : null}</div></div><div className="insurance-column submitted-column"><div className="insurance-column-title"><strong>Applied / submitted</strong><span>{submittedRows.length} under payer review</span></div><div className="insurance-list">{submittedRows.map(({ record, payer }) => <InsurancePlanRow key={record.id} record={record} payer={payer} onOpen={() => onOpenCredential(record)} />)}{!submittedRows.length ? <p className="insurance-empty">No submitted applications in this group.</p> : null}</div></div><div className="insurance-column evidence-column"><div className="insurance-column-title"><strong>Approval on file</strong><span>{evidenceRows.length} need Provider Relations</span></div><div className="insurance-list">{evidenceRows.map(({ record, payer }) => <InsurancePlanRow key={record.id} record={record} payer={payer} onOpen={() => onOpenCredential(record)} />)}{!evidenceRows.length ? <p className="insurance-empty">No direct-confirmation gaps in this group.</p> : null}</div></div></div>{otherRows.length ? <div className="insurance-reference"><strong>Other active statuses</strong><span>{otherRows.map(({ record, payer }) => isConfirmed(record) && record.effectiveDate > localDateKey() ? `${payer.name} · confirmed, starts ${new Date(`${record.effectiveDate}T00:00:00`).toLocaleDateString()}` : isConfirmed(record) ? `${payer.name} · confirmation not currently active` : `${payer.name} · ${record.status}`).join(" · ")}</span></div> : null}{excluded.length ? <div className="insurance-reference"><strong>Reference only</strong><span>{excluded.map(({ payer }) => payer.name).join(" · ")}</span></div> : null}</>}</article>;
  })}</section></div>;
}

function InsurancePlanRow({ record, payer, onOpen }: { record: Credential; payer: Payer; onOpen?: () => void }) {
  const label = isReadyToAccept(record) ? "Ready now" : isConfirmed(record) ? "PR confirmed" : needsEvidence(record) ? "Provider Relations needed" : record.status;
  return <div className="insurance-plan-row"><PayerLogo payer={payer} /><div><strong>{payer.name}</strong><small>{record.networkName || payer.networks || payer.scope || categoryDescriptions[payerCategory(payer)]}</small>{payer.contractStatus === "Delegated contract on file" && !isConfirmed(record) ? <em>MHMD group contract · direct Provider Relations confirmation pending</em> : null}</div><Badge tone={needsEvidence(record) ? "warning" : statusTone(record.status)}>{label}</Badge>{onOpen ? <button className="table-action" onClick={onOpen}>{needsEvidence(record) ? "Contact PR" : "Update"}</button> : null}</div>;
}

function ProviderForm({ provider, saving, onSubmit, onClose }: { provider?: Provider; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <form onSubmit={onSubmit} className="form-grid"><label className="wide">Provider name<input name="name" required defaultValue={provider?.name} placeholder="Full name" /></label><label>Credentials<input name="credentials" defaultValue={provider?.credentials} placeholder="MD, DO, NP, PA-C…" /></label><label>NPI<input name="npi" required inputMode="numeric" defaultValue={provider?.npi} placeholder="10-digit NPI" /></label><label>Specialty<input name="specialty" defaultValue={provider?.specialty} placeholder="Endocrinologist" /></label><label>Location<input name="location" defaultValue={provider?.location} placeholder="Houston, Texas" /></label><label className="wide">Photo URL<input name="imageUrl" type="url" defaultValue={provider?.imageUrl} placeholder="https://…" /><small>Use an official provider profile photo when possible.</small></label><label className="wide">Public profile source<input name="profileUrl" type="url" defaultValue={provider?.profileUrl} placeholder="https://…" /></label><label className="check-label wide"><input name="active" type="checkbox" defaultChecked={provider?.active ?? true} />Active provider</label><FormActions saving={saving} onClose={onClose} /></form>;
}

function PayerForm({ payer, saving, onSubmit, onClose }: { payer?: Payer; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <form onSubmit={onSubmit} className="form-grid"><label className="wide">Payer / product name<input name="name" required defaultValue={payer?.name} placeholder="Insurance payer or product" /></label><label>Plan category<select name="category" defaultValue={payer?.category || "Commercial"}>{planCategoryOrder.map((category) => <option key={category}>{category}</option>)}</select></label><label>Workflow scope<select name="trackingMode" defaultValue={payer?.trackingMode || "Active"}><option>Active</option><option>Reference only</option><option>Not accepted</option></select></label><label>Texas relevance<input name="relevance" defaultValue={payer?.relevance} placeholder="Houston active" /></label><label>Product / scope<input name="scope" defaultValue={payer?.scope} placeholder="Commercial medical, Medicare Advantage…" /></label><label className="wide">Networks to verify<textarea name="networks" defaultValue={payer?.networks} placeholder="BlueChoice PPO; Blue Essentials HMO; Blue Premier HMO" /><small>List exact product or network names. Participation may differ by network.</small></label><label>Contract evidence status<select name="contractStatus" defaultValue={payer?.contractStatus || "Needs review"}><option>Needs review</option><option>Delegated contract on file</option><option>Direct contract on file</option><option>Not accepted</option></select></label><label>Contract evidence date<input name="contractEvidenceDate" type="date" defaultValue={payer?.contractEvidenceDate} /></label><label className="wide">Contract evidence reference<textarea name="contractEvidence" defaultValue={payer?.contractEvidence} placeholder="Contract list, approval letter, portal result…" /></label><label className="wide">Provider Relations verification rule<textarea name="verificationRule" defaultValue={payer?.verificationRule} placeholder="What must Provider Relations confirm for each provider?" /></label><label className="wide">Provider portal URL<input name="portalUrl" type="url" defaultValue={payer?.portalUrl} placeholder="https://…" /></label><label className="wide">Join / credentialing URL<input name="joinUrl" type="url" defaultValue={payer?.joinUrl} placeholder="https://…" /></label><label>Provider Relations phone<input name="phone" defaultValue={payer?.phone} placeholder="713-…" /></label><label>Provider Relations email<input name="email" type="email" defaultValue={payer?.email} placeholder="providerrelations@payer.com" /></label><label className="wide">Routing notes<textarea name="notes" defaultValue={payer?.notes} placeholder="Houston/Texas routing guidance" /></label><label className="wide">Official source URL<input name="sourceUrl" type="url" defaultValue={payer?.sourceUrl} placeholder="https://…" /></label><FormActions saving={saving} onClose={onClose} /></form>;
}

function CredentialForm({ record, provider, payer, saving, onSubmit, onClose }: { record: Credential; provider?: Provider; payer?: Payer; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <form onSubmit={onSubmit} className="form-grid">
    <div className="record-summary wide">{provider ? <ProviderAvatar provider={provider} size="medium" /> : null}<div><strong>{provider?.name}</strong><span>{payer?.name} · {payer ? (payer.category || payerCategory(payer)) : ""}</span><small>{payer?.networks}</small></div></div>
    {needsEvidence(record) ? <div className="evidence-alert wide"><Icon name="alert" /><div><strong>Direct Provider Relations confirmation required</strong><span>Contact the insurance/payer, then record the exact network, representative or department, verification date, and effective date.</span></div></div> : null}
    {payer?.contractStatus === "Delegated contract on file" && !isConfirmed(record) ? <div className="contract-alert wide"><Icon name="check" /><div><strong>MHMD group contract evidence is supporting information only</strong><span>{payer.verificationRule || "Confirm the provider-specific product and effective date with Provider Relations before marking this record confirmed."}</span></div></div> : null}
    <input type="hidden" name="recordName" value={`${provider?.name ?? "Provider"} · ${payer?.name ?? "Payer"}`} />
    <label>Status<select name="status" defaultValue={record.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
    <label>Priority<select name="priority" defaultValue={record.priority}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
    <label>Assigned to<input name="assignedTo" defaultValue={record.assignedTo} placeholder="Unassigned" /></label>
    <label>Follow-up date<input name="followUpDate" type="date" defaultValue={record.followUpDate} /></label>
    <label className="wide">Exact network confirmed by Provider Relations<input name="networkName" required={record.status === "Approved"} defaultValue={record.networkName} placeholder="Enter the exact plan or network name" /><small>Confirm the provider’s NPI is loaded for this exact product. Do not assume every network under the carrier is included.</small></label>
    <label>Verification method<select name="verificationMethod" required={record.status === "Approved"} defaultValue={record.verificationMethod}><option value="">Not yet verified</option>{verificationMethods.map((method) => <option key={method}>{method}</option>)}</select></label>
    <label>Provider Relations contact / representative<input name="providerRelationsContact" required={record.status === "Approved"} defaultValue={record.providerRelationsContact} placeholder="Rep name or Provider Relations department" /></label>
    <label>Verification date<input name="verificationDate" required={record.status === "Approved"} type="date" defaultValue={record.verificationDate} /></label>
    <label>Provider effective date<input name="effectiveDate" required={record.status === "Approved"} type="date" defaultValue={record.effectiveDate} /></label>
    <label>Termination date<input name="terminationDate" type="date" defaultValue={record.terminationDate} /></label>
    <label>Provider Relations case / reference #<input name="referenceNumber" defaultValue={record.referenceNumber} placeholder="If supplied" /></label>
    <label className="wide">Supporting evidence<input name="evidenceReference" defaultValue={record.evidenceReference} placeholder="Contract list, secure message subject, approval letter…" /><small>Do not store patient information, SSNs, or document contents.</small></label>
    <label className="wide">Next action<input name="nextAction" defaultValue={record.nextAction} placeholder="Contact payer Provider Relations to confirm NPI, network, and effective date…" /></label>
    <label className="wide">Notes<textarea name="notes" defaultValue={record.notes} placeholder="Tracking notes only. Do not enter patient information, SSNs, or document contents." /></label>
    <FormActions saving={saving} onClose={onClose} />
  </form>;
}

function ShareForm({ mode, saving, onClose, onSave }: { mode: string; saving: boolean; onClose: () => void; onSave: (method: "PUT", body: unknown) => Promise<void> }) {
  const [selected, setSelected] = useState(mode);
  const options = [{ id: "private", title: "Private", body: "Only you can open the portal." }, { id: "workspace", title: "Your workspace", body: "Everyone in your organization’s workspace can open it." }, { id: "public", title: "Anyone with the link", body: "Anyone who receives the URL can open the portal." }];
  async function copyLink() { await navigator.clipboard.writeText(window.location.href); }
  return <div className="share-content"><p className="share-intro">Choose who should be able to open the portal. It stays private until access is changed in the site sharing controls.</p><div className="access-options">{options.map((option) => <label key={option.id} className={selected === option.id ? "selected" : ""}><input type="radio" name="shareMode" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} /><span><strong>{option.title}</strong><small>{option.body}</small></span>{selected === option.id ? <span className="selected-check">✓</span> : null}</label>)}</div>{selected === "public" ? <div className="warning-box"><Icon name="alert" /><div><strong>Public access warning</strong><span>Provider photos, NPIs, payer contacts, and workflow data would be visible to anyone with the link.</span></div></div> : null}<div className="copy-row"><input readOnly value={typeof window !== "undefined" ? window.location.href : "Portal link available after publishing"} /><button className="button secondary" type="button" onClick={() => void copyLink()}>Copy link</button></div><p className="platform-note">Saving records your access preference. The final site-level permission is applied through the portal&apos;s protected sharing control.</p><div className="modal-actions"><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving} onClick={() => void onSave("PUT", { entity: "setting", key: "shareMode", value: selected })}>{saving ? "Saving…" : "Save preference"}</button></div></div>;
}

function FormActions({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return <div className="modal-actions wide"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button type="submit" className="button primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>;
}
