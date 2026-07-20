ALTER TABLE `payers` ADD `contract_status` text DEFAULT 'Needs review' NOT NULL;--> statement-breakpoint
ALTER TABLE `payers` ADD `contract_evidence` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payers` ADD `contract_evidence_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payers` ADD `verification_rule` text DEFAULT '' NOT NULL;