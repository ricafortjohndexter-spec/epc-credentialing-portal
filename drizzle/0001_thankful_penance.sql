ALTER TABLE `credentials` ADD `network_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `credentials` ADD `verification_method` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `credentials` ADD `verification_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `credentials` ADD `effective_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `credentials` ADD `termination_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `credentials` ADD `evidence_reference` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `payers` ADD `category` text DEFAULT 'Commercial' NOT NULL;--> statement-breakpoint
ALTER TABLE `payers` ADD `tracking_mode` text DEFAULT 'Active' NOT NULL;--> statement-breakpoint
ALTER TABLE `payers` ADD `networks` text DEFAULT '' NOT NULL;