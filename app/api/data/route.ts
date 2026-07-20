import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, credentials, payers, providers, settings } from "@/db/schema";

export const dynamic = "force-dynamic";

const providerSeed = [
  { name: "Radha Jayakumar Bernander", credentials: "PA-C, CDCES", npi: "1396273595", specialty: "Physician Assistant", location: "Katy, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Radha_Bernander.png?itok=3vBA2YUz", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/radha-bernander-pa-c" },
  { name: "Tess Chamakkala", credentials: "DO", npi: "1326530668", specialty: "Endocrinologist", location: "Houston, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Tess_Chamakkala.png?itok=Kv6Ffa9L", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/tess-chamakkala-do" },
  { name: "Shannon McAllister Gregorek", credentials: "APN", npi: "1790929099", specialty: "Nurse Practitioner", location: "Houston, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Shannon%20Gregorek.png?itok=MwHVKgrk", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/shannon-gregorek-apn" },
  { name: "Cindy Vanessa Laverde", credentials: "MS, RDN, LD, MB(ASCP)", npi: "1629961537", specialty: "Registered Dietitian", location: "Houston & Katy, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2025-07/epc_vanessa_lavarde.jpg?itok=zxqmEl0A", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/cindy-vanessa-laverde" },
  { name: "Elizabeth Leal", credentials: "RDN, CDCES", npi: "1093311136", specialty: "Registered Dietitian", location: "Houston, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-10/epc_elizabeth_leal.jpg?itok=Wd2W7nOa", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/elizabeth-c-leal-vasquez" },
  { name: "Kruti Patel-Konasagar", credentials: "MS, FNP-BC", npi: "1932714722", specialty: "Nurse Practitioner", location: "Katy, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Kruti_Patel-Konasagar.png?itok=WyBDZabI", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/kruti-patel-konasager-np" },
  { name: "Rakesh Patel", credentials: "DO", npi: "1386629699", specialty: "Endocrinologist", location: "Houston & Katy, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Rakesh_Patel.png?itok=kcaX-K0Y", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/rakesh-patel-do" },
  { name: "Preeya Raghu", credentials: "MD", npi: "1558520015", specialty: "Endocrinologist", location: "Katy, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Preeya_Raghu.png?itok=38mXnWri", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/preeya-raghu-md" },
  { name: "Elina Shakya", credentials: "MD", npi: "1265666846", specialty: "Endocrinologist", location: "Katy, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Elina_Shakya.png?itok=xyYwzGTp", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/elina-shakya-md" },
  { name: "Veena Ramchandra Watwe", credentials: "MD", npi: "1417120221", specialty: "Endocrinologist", location: "Houston, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Veena_Watwe.png?itok=NNo4FN8O", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/veena-watwe-md" },
  { name: "Nadia Younus", credentials: "PA", npi: "1942573340", specialty: "Physician Assistant", location: "Houston, Texas", imageUrl: "https://www.myprivia.com/sites/default/files/styles/provider_landing_200x200_/public/2024-09/epc_Nadia_Younus.png?itok=jaMVrOF2", profileUrl: "https://www.myprivia.com/endocrineandpsychiatry/providers/nadia-younus-pa" },
];

const payerSeed = [
  { name: "Aetna", relevance: "Texas / national", scope: "Medical and behavioral", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.aetna.com/faqs-health-insurance/health-care-professionals-join-network.html", phone: "1-888-632-3862", email: "", notes: "Use Availity. Medicare Advantage provider help: 1-800-624-0756.", sourceUrl: "https://www.aetna.com/faqs-health-insurance/health-care-professionals-join-network.html" },
  { name: "Ambetter", relevance: "Texas active", scope: "Marketplace / Superior HealthPlan", portalUrl: "https://provider.superiorhealthplan.com/", joinUrl: "https://www.ambetterhealth.com/en/tx/provider-resources/", phone: "1-877-687-1196", email: "", notes: "Texas Ambetter is administered by Superior HealthPlan.", sourceUrl: "https://www.ambetterhealth.com/en/tx/provider-resources/" },
  { name: "Blue Cross Blue Shield", relevance: "Texas active", scope: "Commercial (Texas)", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.bcbstx.com/provider/network/network/request-contract", phone: "1-800-972-8088", email: "", notes: "BCBSTX commercial provider services. Houston regional office: 713-354-7000.", sourceUrl: "https://www.bcbstx.com/provider/contact-us" },
  { name: "Centene", relevance: "Parent company", scope: "Parent of Superior/Ambetter/WellCare", portalUrl: "https://www.centene.com/who-we-are/subsidiaries.html", joinUrl: "https://www.centene.com/who-we-are/subsidiaries.html", phone: "", email: "", notes: "Choose the Texas subsidiary/product rather than credentialing with Centene directly.", sourceUrl: "https://www.centene.com/who-we-are/subsidiaries.html" },
  { name: "Cigna", relevance: "Texas / national", scope: "Medical and behavioral", portalUrl: "https://cignaforhcp.cigna.com/", joinUrl: "https://www.cigna.com/health-care-providers/credentialing", phone: "1-800-882-4462", email: "", notes: "Behavioral provider help: 1-800-926-2273.", sourceUrl: "https://www.cigna.com/health-care-providers/credentialing" },
  { name: "Community Health Choice", relevance: "Houston active", scope: "Marketplace (Houston)", portalUrl: "https://provider.communityhealthchoice.org/", joinUrl: "https://provider.communityhealthchoice.org/contact-community/join-community/", phone: "713-295-2295", email: "ProviderWebInquiries@CommunityHealthChoice.org", notes: "Houston-based Marketplace payer. Alternate provider service: 1-888-760-2600.", sourceUrl: "https://provider.communityhealthchoice.org/contact-community/join-community/" },
  { name: "EmblemHealth", relevance: "Out-of-state", scope: "New York plans", portalUrl: "https://www.emblemhealth.com/providers/resources/portal-sign-in", joinUrl: "https://www.emblemhealth.com/providers", phone: "1-866-447-9717", email: "", notes: "Use only for an EmblemHealth member or out-of-area arrangement.", sourceUrl: "https://www.emblemhealth.com/providers/resources/portal-sign-in" },
  { name: "Guardian Life", relevance: "Ancillary", scope: "Dental and ancillary", portalUrl: "https://mydental.guardianlife.com/", joinUrl: "https://www.guardianlife.com/providers", phone: "1-888-482-7342", email: "", notes: "Dental/ancillary payer, not a general Houston medical network.", sourceUrl: "https://www.guardianlife.com/providers" },
  { name: "Health Net", relevance: "Out-of-state", scope: "California plans", portalUrl: "https://www.healthnet.com/content/healthnet/en_us/providers.html", joinUrl: "https://www.healthnet.com/content/healthnet/en_us/providers.html", phone: "1-800-641-7761", email: "provider_services@healthnet.com", notes: "California-focused; verify the member product before acting.", sourceUrl: "https://www.healthnet.com/content/healthnet/en_us/providers/provider-phone-directory.html" },
  { name: "Highmark", relevance: "Out-of-state / BlueCard", scope: "Regional Blue plans", portalUrl: "https://providers.highmark.com/", joinUrl: "https://providers.highmark.com/contact-us.html", phone: "1-800-547-3627", email: "", notes: "For Texas BlueCard claims, start with BCBSTX or the member ID card.", sourceUrl: "https://providers.highmark.com/contact-us.html" },
  { name: "Humana", relevance: "Texas active", scope: "Commercial", portalUrl: "https://provider.humana.com/", joinUrl: "https://provider.humana.com/join-humana-network/credentialing-in-texas", phone: "1-800-457-4708", email: "HumanaHoustonPD@humana.com", notes: "Houston email is for provider demographic updates/regional routing. Credentialing status: 1-800-626-2741.", sourceUrl: "https://provider.humana.com/join-humana-network/credentialing-in-texas" },
  { name: "Independence Blue Cross", relevance: "Out-of-state / BlueCard", scope: "Philadelphia-area Blue plan", portalUrl: "https://www.ibx.com/resources/for-providers/index.html", joinUrl: "https://www.ibx.com/resources/for-providers/index.html", phone: "1-800-275-2583", email: "CredInquiries@ibx.com", notes: "Use BCBSTX/member card for Texas BlueCard routing.", sourceUrl: "https://www.ibx.com/resources/for-providers/index.html" },
  { name: "Kaiser Permanente", relevance: "Out-of-area", scope: "No Texas Kaiser region", portalUrl: "https://healthy.kaiserpermanente.org/community-providers", joinUrl: "https://healthy.kaiserpermanente.org/community-providers/permanente-advantage/contact-us", phone: "1-888-567-6847", email: "PermAdvantageTeam-KPPA@kp.org", notes: "Use only for Permanente Advantage/out-of-area products.", sourceUrl: "https://healthy.kaiserpermanente.org/community-providers/permanente-advantage/contact-us" },
  { name: "Memorial Hermann", relevance: "Houston active", scope: "Memorial Hermann Health Plan", portalUrl: "https://healthplan.memorialhermann.org/for-providers", joinUrl: "https://healthplan.memorialhermann.org/for-providers/join-the-network", phone: "1-800-429-6396", email: "providerservices@apex4health.com", notes: "Houston local plan. Use Apex provider services for join-network questions.", sourceUrl: "https://healthplan.memorialhermann.org/for-providers/join-the-network" },
  { name: "MetLife", relevance: "Ancillary", scope: "Dental, vision and ancillary", portalUrl: "https://metdental.metlife.com/", joinUrl: "https://www.metlife.com/insurance/dental-insurance/dental-providers/", phone: "1-877-638-3379", email: "", notes: "Confirm the product before starting credentialing.", sourceUrl: "https://metdental.metlife.com/" },
  { name: "Molina Healthcare", relevance: "Texas active", scope: "Marketplace (Texas)", portalUrl: "https://provider.molinahealthcare.com/", joinUrl: "https://www.molinahealthcare.com/providers/tx", phone: "1-855-322-4080", email: "MHTXProviderServices@MolinaHealthcare.com", notes: "Texas provider-services team for Houston/Harris County Marketplace routing.", sourceUrl: "https://www.molinahealthcare.com/providers/tx" },
  { name: "Mutual of Omaha", relevance: "No network credentialing", scope: "Medicare Supplement", portalUrl: "https://www.mutualofomaha.com/provideraccess/", joinUrl: "https://www.mutualofomaha.com/provideraccess/contact/index.php", phone: "", email: "", notes: "Medicare Supplement generally does not use a provider network.", sourceUrl: "https://www.mutualofomaha.com/provideraccess/contact/index.php" },
  { name: "Oscar Health", relevance: "Texas / market dependent", scope: "Individual and small group", portalUrl: "https://provider.hioscar.com/", joinUrl: "https://www.hioscar.com/providers", phone: "1-855-672-2755, option 4", email: "", notes: "Confirm the current Houston service area before contracting.", sourceUrl: "https://www.hioscar.com/providers" },
  { name: "UnitedHealthcare", relevance: "Texas / national", scope: "Commercial", portalUrl: "https://www.uhcprovider.com/", joinUrl: "https://www.uhcprovider.com/en/demographics-profiles-attestation/join-our-network.html", phone: "1-877-842-3210", email: "", notes: "Use the UHC Provider Portal and Provider Services.", sourceUrl: "https://www.uhcprovider.com/en/contact-us.html" },
  { name: "WellCare", relevance: "Texas active", scope: "Medicare product routing", portalUrl: "https://provider.wellcare.com/", joinUrl: "https://www.wellcare.com/en/texas/providers", phone: "1-855-538-0454", email: "PR.SW@SuperiorHealthPlan.com", notes: "Texas statewide provider-representative inbox. Behavioral Health: PR.BH@SuperiorHealthPlan.com.", sourceUrl: "https://www.wellcare.com/en/texas/providers/bulletins/new-inboxes-for-wellcare-provider-representatives" },
  { name: "Medicare Part B (Original Medicare)", relevance: "Texas active", scope: "Medicare Part B / fee-for-service", portalUrl: "https://www.novitas-solutions.com/webcenter/portal/MedicareJH", joinUrl: "https://www.cms.gov/medicare/medicare-contracting/medicare-administrative-contractors/who-are-the-macs-a-b-mac-jurisdiction-h-jh", phone: "1-855-252-8782", email: "", notes: "Texas Part B enrollment and claims are handled by Novitas Solutions under Medicare Jurisdiction H.", sourceUrl: "https://www.cms.gov/medicare/medicare-contracting/medicare-administrative-contractors/who-are-the-macs-a-b-mac-jurisdiction-h-jh" },
  { name: "Aetna Medicare Advantage", relevance: "Texas / market dependent", scope: "Medicare Advantage / replacement plan", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.aetna.com/health-care-professionals/medicare.html", phone: "1-800-624-0756", email: "", notes: "Track separately from Aetna commercial participation and verify the exact Medicare product/network.", sourceUrl: "https://www.aetna.com/health-care-professionals/medicare.html" },
  { name: "Blue Cross Medicare Advantage", relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://apps.availity.com/availity/web/public.elegant.login", joinUrl: "https://www.bcbstx.com/provider/network/network/bma-ppo", phone: "1-877-774-8592", email: "", notes: "BCBSTX Medicare Advantage is a separate product/network from commercial participation.", sourceUrl: "https://www.bcbstx.com/provider/network/network/bma-ppo" },
  { name: "Humana Medicare Advantage", relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://provider.humana.com/", joinUrl: "https://provider.humana.com/working-with-us/medicare-advantage-materials", phone: "1-800-457-4708", email: "HumanaHoustonPD@humana.com", notes: "Track separately from Humana commercial participation and confirm the contracted Medicare products.", sourceUrl: "https://provider.humana.com/working-with-us/medicare-advantage-materials" },
  { name: "UnitedHealthcare Medicare Advantage", relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://www.uhcprovider.com/", joinUrl: "https://www.uhcprovider.com/en/health-plans-by-state/texas-health-plans/tx-medicare-plans/tx-med-adv.html", phone: "1-877-842-3210", email: "", notes: "Track separately from UnitedHealthcare commercial participation and confirm the exact Medicare network.", sourceUrl: "https://www.uhcprovider.com/en/health-plans-by-state/texas-health-plans/tx-medicare-plans/tx-med-adv.html" },
  { name: "WellCare Medicare Advantage", relevance: "Texas active", scope: "Medicare Advantage / replacement plan", portalUrl: "https://provider.wellcare.com/", joinUrl: "https://www.wellcare.com/en/texas/providers/medicare", phone: "1-855-538-0454", email: "PR.SW@SuperiorHealthPlan.com", notes: "Texas Medicare Advantage product; verify the member plan and delegated network before confirming participation.", sourceUrl: "https://www.wellcare.com/en/texas/providers/medicare" },
  { name: "Molina Medicare Advantage", relevance: "Texas / market dependent", scope: "Medicare Advantage / replacement plan", portalUrl: "https://provider.molinahealthcare.com/", joinUrl: "https://www.molinahealthcare.com/providers/common/medicare/medicare", phone: "1-855-322-4080", email: "MHTXProviderServices@MolinaHealthcare.com", notes: "Track separately from Molina Marketplace participation and verify the exact Texas Medicare product.", sourceUrl: "https://www.molinahealthcare.com/providers/common/medicare/medicare" },
  { name: "Texas Medicaid", relevance: "Not accepted", scope: "Medicaid", portalUrl: "https://www.tmhp.com/", joinUrl: "https://www.tmhp.com/topics/provider-enrollment", phone: "1-800-925-9126", email: "", notes: "EPC does not accept Medicaid. Kept as a visible reference only; no credentialing tasks or reminders are created.", sourceUrl: "https://www.tmhp.com/topics/provider-enrollment" },
  { name: "EHN PPO", relevance: "MHMD delegated pathway", scope: "Commercial delegated network", portalUrl: "", joinUrl: "", phone: "713-338-6464, option 2", email: "", notes: "Listed in the MHMD managed care contracts. Verify provider-specific effective date before rendering care.", sourceUrl: "" },
  { name: "Healthways Logix/Sync", relevance: "MHMD delegated pathway", scope: "Commercial delegated network / separate fee schedules", portalUrl: "", joinUrl: "", phone: "713-338-6464, option 2", email: "", notes: "MHMD contract variants carry separate fee schedules. Verify provider applicability and effective date.", sourceUrl: "" },
  { name: "Imagine Health", relevance: "MHMD delegated pathway", scope: "Commercial delegated network", portalUrl: "", joinUrl: "", phone: "713-338-6464, option 2", email: "", notes: "Listed in the MHMD managed care contracts. Verify provider-specific effective date before rendering care.", sourceUrl: "" },
  { name: "Memorial Hermann Medicare Advantage", relevance: "MHMD delegated pathway", scope: "Medicare Advantage / replacement plan", portalUrl: "https://healthplan.memorialhermann.org/for-providers", joinUrl: "", phone: "713-338-6464, option 2", email: "", notes: "MH HMO is listed through MHMD. The D-SNP product is excluded from EPC active scope because EPC does not accept Medicaid-linked plans.", sourceUrl: "" },
  { name: "Wellpoint Medicare Advantage", relevance: "MHMD delegated pathway", scope: "Medicare Advantage / replacement plan", portalUrl: "", joinUrl: "", phone: "713-338-6464, option 2", email: "", notes: "Wellpoint HMO is listed through MHMD. Verify the provider-specific effective date before rendering care.", sourceUrl: "" },
];

const approvedByNpi: Record<string, string[]> = {
  "1396273595": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1326530668": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "UnitedHealthcare", "Memorial Hermann"],
  "1790929099": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1629961537": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare"],
  "1093311136": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1932714722": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1386629699": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1558520015": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1265666846": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1417120221": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
  "1942573340": ["Aetna", "Community Health Choice", "Blue Cross Blue Shield", "Cigna", "UnitedHealthcare", "Memorial Hermann"],
};

const textValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const appendUnique = (current: string, addition: string) => !addition || current.includes(addition) ? current : current ? `${current}; ${addition}` : addition;
const referencePayerNames = ["Centene", "EmblemHealth", "Guardian Life", "Health Net", "Highmark", "Independence Blue Cross", "Kaiser Permanente", "MetLife", "Mutual of Omaha", "WellCare"];
const mhmdEvidence = "MHMD Managed Care Contracts, revised January 2, 2026";
const bcbsClaimEvidence = "BCBSTX practice test-claim return, June 26, 2026 - additional NPI information required";
const providerRelationsMethod = "Insurance/Payer Provider Relations";
const providerEffectiveDateRule = "Delegated group contract only. Confirm the individual provider's exact product, NPI loading, and effective date directly with insurance/payer Provider Relations before rendering care.";
const mhmdContractPayerNames = ["Aetna", "Blue Cross Blue Shield", "Community Health Choice", "Cigna", "EHN PPO", "Healthways Logix/Sync", "Imagine Health", "Memorial Hermann", "UnitedHealthcare", "Aetna Medicare Advantage", "Memorial Hermann Medicare Advantage", "UnitedHealthcare Medicare Advantage", "Wellpoint Medicare Advantage"];
const payerNetworks: Record<string, string> = {
  "Aetna": "ACO CI Aetna Commercial / Whole Health; Choice POS II; Open Access Managed Choice; Aetna PPO",
  "Ambetter": "Ambetter from Superior HealthPlan",
  "Blue Cross Blue Shield": "ACO CI BCBS Essentials / Health Select / Premier HMO; ACO CI BCBS PPO / Blue Choice; CI BCBS BAV",
  "Cigna": "CI Cigna Commercial; CI Cigna Local Plus; Open Access Plus (OAP); Cigna PPO; Choice Fund PPO",
  "Community Health Choice": "Community Health Choice Marketplace",
  "EHN PPO": "CI EHN PPO",
  "Healthways Logix/Sync": "CI Logix / Sync (AHP); CI Logix / Sync (MNA CC / Neuro / Rad / Onc); CI Logix / Sync (including MNA Neurology)",
  "Humana": "Humana Choice PPO",
  "Imagine Health": "CI Imagine Health",
  "Memorial Hermann": "CI MH Select HMO / PPO; CI MH SafetyNet / Worklink; Memorial Hermann Health Plan",
  "Molina Healthcare": "Molina Marketplace HMO",
  "Oscar Health": "Oscar Marketplace EPO",
  "UnitedHealthcare": "ACO CI UHC Commercial; Choice / Choice Plus; Options PPO; Select / Select Plus",
  "Medicare Part B (Original Medicare)": "Original Medicare Part B — Texas Jurisdiction H",
  "Aetna Medicare Advantage": "CI MA Aetna Premier HMO / Prime HMO / Value PPO; D-SNP excluded",
  "Blue Cross Medicare Advantage": "Blue Cross Medicare Advantage PPO / HMO",
  "Humana Medicare Advantage": "Humana Choice PPO; Humana Gold Plus HMO",
  "Memorial Hermann Medicare Advantage": "CI MA Memorial Hermann HMO; D-SNP excluded",
  "UnitedHealthcare Medicare Advantage": "CI MA UnitedHealthcare; AARP Medicare Advantage",
  "Wellpoint Medicare Advantage": "CI MA Wellpoint HMO",
  "WellCare Medicare Advantage": "Wellcare by Allwell / Superior — confirm exact network",
  "Molina Medicare Advantage": "Molina Choice Care / Complete Care — confirm exact network",
  "Texas Medicaid": "Texas Medicaid",
};

function payerCategory(payerName: string, scope = "") {
  const name = payerName.toLowerCase();
  const product = scope.toLowerCase();
  if (name.includes("medicaid")) return "Medicaid";
  if (name.includes("medicare") || ["mutual of omaha", "wellcare"].includes(name) || product.includes("medicare")) return "Medicare";
  if (["ambetter", "community health choice", "molina healthcare", "oscar health"].includes(name) || product.includes("marketplace")) return "Marketplace";
  return "Commercial";
}

function payerTrackingMode(payerName: string) {
  if (payerName === "Texas Medicaid") return "Not accepted";
  if (referencePayerNames.includes(payerName)) return "Reference only";
  return "Active";
}

const defaultCredentialStatus = (payerName: string, trackingMode = payerTrackingMode(payerName)) => trackingMode === "Not accepted" ? "Not Accepted" : trackingMode === "Reference only" ? "Not Applicable" : "Not Started";
const providerRelationsNextAction = (payerName: string, phone = "", delegated = false) => {
  if (payerName === "Blue Cross Blue Shield") return "Contact BCBSTX Provider Relations to confirm NPI loading, exact network, and provider effective date.";
  if (delegated) return "Contact MHMD Provider Relations (713-338-6464, option 2) to confirm the exact network and provider effective date.";
  return `Contact ${payerName} Provider Relations${phone ? ` (${phone})` : ""} to confirm the exact network and provider effective date.`;
};

async function seedIfNeeded() {
  const db = await getDb();
  if ((await db.select({ id: providers.id }).from(providers).limit(1)).length === 0) {
    await db.insert(providers).values(providerSeed);
  }
  if ((await db.select({ id: payers.id }).from(payers).limit(1)).length === 0) {
    await db.insert(payers).values(payerSeed);
  }
  const existingPayerRows = await db.select({ name: payers.name }).from(payers);
  const existingPayerNames = new Set(existingPayerRows.map((payer) => payer.name));
  const missingPayers = payerSeed.filter((payer) => !existingPayerNames.has(payer.name));
  if (missingPayers.length) {
    const insertedPayers = await db.insert(payers).values(missingPayers.map((payer) => ({ ...payer, category: payerCategory(payer.name, payer.scope), trackingMode: payerTrackingMode(payer.name), networks: payerNetworks[payer.name] ?? payer.scope }))).onConflictDoNothing().returning({ id: payers.id, name: payers.name, trackingMode: payers.trackingMode, contractStatus: payers.contractStatus, phone: payers.phone });
    const providerRows = await db.select({ id: providers.id }).from(providers);
    const addedCredentials = providerRows.flatMap((provider) => insertedPayers.map((payer) => ({ providerId: provider.id, payerId: payer.id, status: defaultCredentialStatus(payer.name), priority: "Normal", assignedTo: "Unassigned", nextAction: payer.trackingMode === "Active" ? providerRelationsNextAction(payer.name, payer.phone, payer.contractStatus === "Delegated contract on file") : "" })));
    if (addedCredentials.length) await db.insert(credentials).values(addedCredentials).onConflictDoNothing();
    if (insertedPayers.length) await db.insert(activity).values({ action: "Added", entityType: "system", entityName: "Insurance plan groups", detail: `${insertedPayers.length} insurance products added` });
  }
  if ((await db.select({ id: credentials.id }).from(credentials).limit(1)).length === 0) {
    const providerRows = await db.select().from(providers);
    const payerRows = await db.select().from(payers);
    const rows = providerRows.flatMap((provider) =>
      payerRows.map((payer) => ({
        providerId: provider.id,
        payerId: payer.id,
        status: approvedByNpi[provider.npi]?.includes(payer.name) ? "Approved" : defaultCredentialStatus(payer.name),
        priority: "Normal",
        assignedTo: "Unassigned",
      })),
    );
    await db.insert(credentials).values(rows);
    await db.insert(activity).values({ action: "Imported", entityType: "system", entityName: "EPC workbook", detail: `${providerRows.length} providers, ${payerRows.length} payer products and ${rows.length} participation records` });
  }
  const [groupingMigration] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "planGroupingVersion"));
  if (!groupingMigration) {
    const normalizedPayers = payerSeed.filter((payer) => ["Blue Cross Blue Shield", "Community Health Choice", "Humana", "Molina Healthcare", "UnitedHealthcare", "WellCare"].includes(payer.name));
    await Promise.all(normalizedPayers.map((payer) => db.update(payers).set({ scope: payer.scope, joinUrl: payer.joinUrl, email: payer.email, notes: payer.notes, sourceUrl: payer.sourceUrl, updatedAt: new Date().toISOString() }).where(eq(payers.name, payer.name))));
    await db.insert(settings).values({ key: "planGroupingVersion", value: "1" }).onConflictDoNothing();
  }
  const [operationalMigration] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "operationalModelVersion"));
  if (!operationalMigration) {
    const payerRows = await db.select({ id: payers.id, name: payers.name, scope: payers.scope }).from(payers);
    await Promise.all(payerRows.map((payer) => db.update(payers).set({ category: payerCategory(payer.name, payer.scope), trackingMode: payerTrackingMode(payer.name), networks: payerNetworks[payer.name] ?? payer.scope, updatedAt: new Date().toISOString() }).where(eq(payers.id, payer.id))));
    const referenceRows = payerRows.filter((payer) => referencePayerNames.includes(payer.name));
    if (referenceRows.length) {
      await db.update(credentials).set({ status: "Not Applicable", followUpDate: "", nextAction: "Reference only — no credentialing action", updatedAt: new Date().toISOString() }).where(and(inArray(credentials.payerId, referenceRows.map((payer) => payer.id)), eq(credentials.status, "Not Started")));
    }
    await db.insert(settings).values({ key: "operationalModelVersion", value: "1" }).onConflictDoNothing();
    await db.insert(activity).values({ action: "Optimized", entityType: "system", entityName: "Credentialing scope", detail: "Separated active payer work from reference-only and not-accepted products" });
  }
  const [mhmdMigration] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "mhmdEvidenceVersion"));
  if (!mhmdMigration) {
    const contractPayers = await db.select().from(payers).where(inArray(payers.name, mhmdContractPayerNames));
    await Promise.all(contractPayers.map((payer) => {
      const isBcbs = payer.name === "Blue Cross Blue Shield";
      const sourceNote = "MHMD delegated contract list revised January 2, 2026. Provider-specific product and effective date must still be verified.";
      const claimNote = "BCBSTX practice test claim dated June 26, 2026 was returned because additional NPI information was required; this is not individual participation confirmation.";
      return db.update(payers).set({
        networks: payerNetworks[payer.name] ?? payer.networks,
        contractStatus: "Delegated contract on file",
        contractEvidence: isBcbs ? `${mhmdEvidence}; ${bcbsClaimEvidence}` : mhmdEvidence,
        contractEvidenceDate: "2026-01-02",
        verificationRule: isBcbs ? `${providerEffectiveDateRule} Confirm NPI loading before claim submission.` : providerEffectiveDateRule,
        notes: appendUnique(appendUnique(payer.notes, sourceNote), isBcbs ? claimNote : ""),
        updatedAt: new Date().toISOString(),
      }).where(eq(payers.id, payer.id));
    }));
    const bcbsPayer = contractPayers.find((payer) => payer.name === "Blue Cross Blue Shield");
    const otherPayerIds = contractPayers.filter((payer) => payer.name !== "Blue Cross Blue Shield").map((payer) => payer.id);
    if (otherPayerIds.length) {
      await db.update(credentials).set({
        evidenceReference: sql<string>`CASE WHEN ${credentials.evidenceReference} = '' THEN ${mhmdEvidence} WHEN instr(${credentials.evidenceReference}, ${mhmdEvidence}) = 0 THEN ${credentials.evidenceReference} || '; ' || ${mhmdEvidence} ELSE ${credentials.evidenceReference} END`,
        nextAction: sql<string>`CASE WHEN ${credentials.nextAction} = '' THEN 'Verify the provider-specific effective date with MHMD Provider Relations (713-338-6464, option 2).' ELSE ${credentials.nextAction} END`,
        updatedAt: new Date().toISOString(),
      }).where(inArray(credentials.payerId, otherPayerIds));
    }
    if (bcbsPayer) {
      const bcbsEvidence = `${mhmdEvidence}; ${bcbsClaimEvidence}`;
      const bcbsNote = "Practice-level test claim returned for additional NPI information. Do not treat the test claim as proof of individual participation.";
      await db.update(credentials).set({
        evidenceReference: sql<string>`CASE WHEN ${credentials.evidenceReference} = '' THEN ${bcbsEvidence} WHEN instr(${credentials.evidenceReference}, ${mhmdEvidence}) = 0 THEN ${credentials.evidenceReference} || '; ' || ${bcbsEvidence} WHEN instr(${credentials.evidenceReference}, ${bcbsClaimEvidence}) = 0 THEN ${credentials.evidenceReference} || '; ' || ${bcbsClaimEvidence} ELSE ${credentials.evidenceReference} END`,
        nextAction: sql<string>`CASE WHEN ${credentials.nextAction} = '' THEN 'Confirm NPI loading with BCBSTX and verify the provider-specific effective date.' ELSE ${credentials.nextAction} END`,
        notes: sql<string>`CASE WHEN instr(${credentials.notes}, ${bcbsNote}) > 0 THEN ${credentials.notes} WHEN ${credentials.notes} = '' THEN ${bcbsNote} ELSE ${credentials.notes} || ' ' || ${bcbsNote} END`,
        updatedAt: new Date().toISOString(),
      }).where(eq(credentials.payerId, bcbsPayer.id));
    }
    await db.insert(settings).values({ key: "mhmdEvidenceVersion", value: "1" }).onConflictDoNothing();
    await db.insert(activity).values({ action: "Applied", entityType: "system", entityName: "MHMD network evidence", detail: `${contractPayers.length} delegated contract pathways recorded; Medicaid and D-SNP products excluded from active scope` });
  }
  const [providerRelationsMigration] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "providerRelationsWorkflowVersion"));
  if (!providerRelationsMigration) {
    const activePayerRows = await db.select({ id: payers.id, name: payers.name, phone: payers.phone, contractStatus: payers.contractStatus }).from(payers).where(eq(payers.trackingMode, "Active"));
    const actionableStatuses = ["Not Started", "Application Submitted", "In Progress", "Pending", "Approved", "Needs Correction"];
    await Promise.all(activePayerRows.map((payer) => {
      const nextAction = providerRelationsNextAction(payer.name, payer.phone, payer.contractStatus === "Delegated contract on file");
      return db.update(credentials).set({
        nextAction: sql<string>`CASE WHEN ${credentials.nextAction} = '' OR instr(${credentials.nextAction}, 'Verify the provider-specific effective date') > 0 OR instr(${credentials.nextAction}, 'Confirm NPI loading') > 0 THEN ${nextAction} ELSE ${credentials.nextAction} END`,
        verificationMethod: sql<string>`CASE WHEN ${credentials.verificationMethod} = 'Payer representative' THEN ${providerRelationsMethod} ELSE ${credentials.verificationMethod} END`,
        updatedAt: new Date().toISOString(),
      }).where(and(eq(credentials.payerId, payer.id), inArray(credentials.status, actionableStatuses)));
    }));
    await db.insert(settings).values({ key: "providerRelationsWorkflowVersion", value: "1" }).onConflictDoNothing();
    await db.insert(activity).values({ action: "Changed", entityType: "system", entityName: "Network confirmation workflow", detail: "Provider participation now requires direct insurance/payer Provider Relations confirmation" });
  }
  await db.insert(settings).values({ key: "shareMode", value: "private" }).onConflictDoNothing();
}

async function getData() {
  const db = await getDb();
  await seedIfNeeded();
  const [providerRows, payerRows, credentialRows, activityRows, settingRows] = await Promise.all([
    db.select().from(providers),
    db.select().from(payers),
    db.select().from(credentials),
    db.select().from(activity).orderBy(desc(activity.id)).limit(100),
    db.select().from(settings),
  ]);
  return { providers: providerRows, payers: payerRows, credentials: credentialRows, activity: activityRows, settings: Object.fromEntries(settingRows.map((row) => [row.key, row.value])) };
}

export async function GET() {
  try {
    return Response.json(await getData());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load portal data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { entity?: string; data?: Record<string, unknown> };
    const data = payload.data ?? {};
    const db = await getDb();
    await seedIfNeeded();
    if (payload.entity === "provider") {
      const name = textValue(data.name);
      const npi = textValue(data.npi);
      if (!name || !npi) return Response.json({ error: "Provider name and NPI are required." }, { status: 400 });
      const [provider] = await db.insert(providers).values({ name, npi, credentials: textValue(data.credentials), specialty: textValue(data.specialty), location: textValue(data.location) || "Houston, Texas", imageUrl: textValue(data.imageUrl), profileUrl: textValue(data.profileUrl), active: data.active !== false }).returning();
      const payerRows = await db.select({ id: payers.id, name: payers.name, trackingMode: payers.trackingMode, contractStatus: payers.contractStatus, contractEvidence: payers.contractEvidence, phone: payers.phone }).from(payers);
      if (payerRows.length) await db.insert(credentials).values(payerRows.map((payer) => ({ providerId: provider.id, payerId: payer.id, status: defaultCredentialStatus(payer.name, payer.trackingMode), evidenceReference: payer.contractStatus === "Delegated contract on file" ? payer.contractEvidence : "", nextAction: payer.trackingMode === "Active" ? providerRelationsNextAction(payer.name, payer.phone, payer.contractStatus === "Delegated contract on file") : "" })));
      await db.insert(activity).values({ action: "Added", entityType: "provider", entityName: name, detail: `NPI ${npi}` });
    } else if (payload.entity === "payer") {
      const name = textValue(data.name);
      if (!name) return Response.json({ error: "Payer name is required." }, { status: 400 });
      const category = textValue(data.category) || payerCategory(name, textValue(data.scope));
      const trackingMode = textValue(data.trackingMode) || "Active";
      const contractStatus = textValue(data.contractStatus) || "Needs review";
      const contractEvidence = textValue(data.contractEvidence);
      const [payer] = await db.insert(payers).values({ name, category, trackingMode, networks: textValue(data.networks), contractStatus, contractEvidence, contractEvidenceDate: textValue(data.contractEvidenceDate), verificationRule: textValue(data.verificationRule), relevance: textValue(data.relevance) || "Needs review", scope: textValue(data.scope), portalUrl: textValue(data.portalUrl), joinUrl: textValue(data.joinUrl), phone: textValue(data.phone), email: textValue(data.email), notes: textValue(data.notes), sourceUrl: textValue(data.sourceUrl) }).returning();
      const providerRows = await db.select({ id: providers.id }).from(providers);
      if (providerRows.length) await db.insert(credentials).values(providerRows.map((provider) => ({ providerId: provider.id, payerId: payer.id, status: defaultCredentialStatus(name, trackingMode), evidenceReference: contractStatus === "Delegated contract on file" ? contractEvidence : "", nextAction: trackingMode === "Active" ? providerRelationsNextAction(name, textValue(data.phone), contractStatus === "Delegated contract on file") : "" })));
      await db.insert(activity).values({ action: "Added", entityType: "payer", entityName: name, detail: textValue(data.relevance) });
    } else {
      return Response.json({ error: "Unknown entity." }, { status: 400 });
    }
    return Response.json(await getData(), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save record" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { entity?: string; id?: number; key?: string; value?: string; data?: Record<string, unknown> };
    const data = payload.data ?? {};
    const db = await getDb();
    await seedIfNeeded();
    if (payload.entity === "provider" && payload.id) {
      const name = textValue(data.name);
      const npi = textValue(data.npi);
      if (!name || !npi) return Response.json({ error: "Provider name and NPI are required." }, { status: 400 });
      await db.update(providers).set({ name, npi, credentials: textValue(data.credentials), specialty: textValue(data.specialty), location: textValue(data.location), imageUrl: textValue(data.imageUrl), profileUrl: textValue(data.profileUrl), active: data.active !== false, updatedAt: new Date().toISOString() }).where(eq(providers.id, payload.id));
      await db.insert(activity).values({ action: "Updated", entityType: "provider", entityName: name, detail: `NPI ${npi}` });
    } else if (payload.entity === "payer" && payload.id) {
      const name = textValue(data.name);
      if (!name) return Response.json({ error: "Payer name is required." }, { status: 400 });
      await db.update(payers).set({ name, category: textValue(data.category) || "Commercial", trackingMode: textValue(data.trackingMode) || "Active", networks: textValue(data.networks), contractStatus: textValue(data.contractStatus) || "Needs review", contractEvidence: textValue(data.contractEvidence), contractEvidenceDate: textValue(data.contractEvidenceDate), verificationRule: textValue(data.verificationRule), relevance: textValue(data.relevance), scope: textValue(data.scope), portalUrl: textValue(data.portalUrl), joinUrl: textValue(data.joinUrl), phone: textValue(data.phone), email: textValue(data.email), notes: textValue(data.notes), sourceUrl: textValue(data.sourceUrl), updatedAt: new Date().toISOString() }).where(eq(payers.id, payload.id));
      await db.insert(activity).values({ action: "Updated", entityType: "payer", entityName: name, detail: textValue(data.relevance) });
    } else if (payload.entity === "credential" && payload.id) {
      const status = textValue(data.status) || "Not Started";
      const verificationDate = textValue(data.verificationDate);
      const verificationMethod = textValue(data.verificationMethod);
      const networkName = textValue(data.networkName);
      const providerRelationsContact = textValue(data.providerRelationsContact);
      const effectiveDate = textValue(data.effectiveDate);
      if (status === "Approved" && verificationMethod !== providerRelationsMethod) return Response.json({ error: "Approved records must be confirmed directly with insurance/payer Provider Relations." }, { status: 400 });
      if (status === "Approved" && (!networkName || !providerRelationsContact || !verificationDate || !effectiveDate)) return Response.json({ error: "Provider Relations confirmation requires the exact network, representative or department, verification date, and provider effective date." }, { status: 400 });
      await db.update(credentials).set({ status, followUpDate: textValue(data.followUpDate), priority: textValue(data.priority) || "Normal", assignedTo: textValue(data.assignedTo) || "Unassigned", nextAction: textValue(data.nextAction), referenceNumber: textValue(data.referenceNumber), networkName, providerRelationsContact, verificationMethod, verificationDate, effectiveDate, terminationDate: textValue(data.terminationDate), evidenceReference: textValue(data.evidenceReference), notes: textValue(data.notes), updatedAt: new Date().toISOString() }).where(eq(credentials.id, payload.id));
      await db.insert(activity).values({ action: "Updated", entityType: "credential", entityName: textValue(data.recordName) || `Record ${payload.id}`, detail: `${status}${verificationDate ? ` · Provider Relations confirmed ${verificationDate}` : ""} · ${textValue(data.nextAction)}` });
    } else if (payload.entity === "setting" && payload.key) {
      await db.insert(settings).values({ key: payload.key, value: textValue(payload.value), updatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: settings.key, set: { value: textValue(payload.value), updatedAt: new Date().toISOString() } });
      await db.insert(activity).values({ action: "Changed", entityType: "access", entityName: "Sharing preference", detail: textValue(payload.value) });
    } else {
      return Response.json({ error: "Unknown record." }, { status: 400 });
    }
    return Response.json(await getData());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update record" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const entity = url.searchParams.get("entity");
    const id = Number(url.searchParams.get("id"));
    if (!id || !entity) return Response.json({ error: "Record is required." }, { status: 400 });
    const db = await getDb();
    if (entity === "provider") {
      const [row] = await db.select().from(providers).where(eq(providers.id, id));
      await db.delete(providers).where(eq(providers.id, id));
      await db.insert(activity).values({ action: "Deleted", entityType: "provider", entityName: row?.name ?? `Provider ${id}`, detail: "Credentialing records removed" });
    } else if (entity === "payer") {
      const [row] = await db.select().from(payers).where(eq(payers.id, id));
      await db.delete(payers).where(eq(payers.id, id));
      await db.insert(activity).values({ action: "Deleted", entityType: "payer", entityName: row?.name ?? `Payer ${id}`, detail: "Credentialing records removed" });
    } else {
      return Response.json({ error: "Unknown record." }, { status: 400 });
    }
    return Response.json(await getData());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete record" }, { status: 500 });
  }
}
