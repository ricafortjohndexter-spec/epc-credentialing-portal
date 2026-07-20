import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const providers = sqliteTable(
  "providers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    credentials: text("credentials").notNull().default(""),
    npi: text("npi").notNull(),
    specialty: text("specialty").notNull().default(""),
    location: text("location").notNull().default("Houston, Texas"),
    imageUrl: text("image_url").notNull().default(""),
    profileUrl: text("profile_url").notNull().default(""),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("providers_npi_idx").on(table.npi)],
);

export const payers = sqliteTable(
  "payers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    category: text("category").notNull().default("Commercial"),
    trackingMode: text("tracking_mode").notNull().default("Active"),
    networks: text("networks").notNull().default(""),
    contractStatus: text("contract_status").notNull().default("Needs review"),
    contractEvidence: text("contract_evidence").notNull().default(""),
    contractEvidenceDate: text("contract_evidence_date").notNull().default(""),
    verificationRule: text("verification_rule").notNull().default(""),
    relevance: text("relevance").notNull().default("Needs review"),
    scope: text("scope").notNull().default(""),
    portalUrl: text("portal_url").notNull().default(""),
    joinUrl: text("join_url").notNull().default(""),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    notes: text("notes").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("payers_name_idx").on(table.name)],
);

export const credentials = sqliteTable(
  "credentials",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    providerId: integer("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    payerId: integer("payer_id")
      .notNull()
      .references(() => payers.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("Not Started"),
    followUpDate: text("follow_up_date").notNull().default(""),
    priority: text("priority").notNull().default("Normal"),
    assignedTo: text("assigned_to").notNull().default("Unassigned"),
    nextAction: text("next_action").notNull().default(""),
    referenceNumber: text("reference_number").notNull().default(""),
    networkName: text("network_name").notNull().default(""),
    providerRelationsContact: text("provider_relations_contact").notNull().default(""),
    verificationMethod: text("verification_method").notNull().default(""),
    verificationDate: text("verification_date").notNull().default(""),
    effectiveDate: text("effective_date").notNull().default(""),
    terminationDate: text("termination_date").notNull().default(""),
    evidenceReference: text("evidence_reference").notNull().default(""),
    notes: text("notes").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("credentials_provider_payer_idx").on(
      table.providerId,
      table.payerId,
    ),
  ],
);

export const activity = sqliteTable("activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityName: text("entity_name").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
