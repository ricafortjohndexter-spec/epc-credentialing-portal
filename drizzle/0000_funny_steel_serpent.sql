CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_name` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credentials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_id` integer NOT NULL,
	`payer_id` integer NOT NULL,
	`status` text DEFAULT 'Not Started' NOT NULL,
	`follow_up_date` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`assigned_to` text DEFAULT 'Unassigned' NOT NULL,
	`next_action` text DEFAULT '' NOT NULL,
	`reference_number` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payer_id`) REFERENCES `payers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_provider_payer_idx` ON `credentials` (`provider_id`,`payer_id`);--> statement-breakpoint
CREATE TABLE `payers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`relevance` text DEFAULT 'Needs review' NOT NULL,
	`scope` text DEFAULT '' NOT NULL,
	`portal_url` text DEFAULT '' NOT NULL,
	`join_url` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payers_name_idx` ON `payers` (`name`);--> statement-breakpoint
CREATE TABLE `providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`credentials` text DEFAULT '' NOT NULL,
	`npi` text NOT NULL,
	`specialty` text DEFAULT '' NOT NULL,
	`location` text DEFAULT 'Houston, Texas' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`profile_url` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `providers_npi_idx` ON `providers` (`npi`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
