CREATE TABLE `chat_sessions` (
	`notebook_id` text NOT NULL,
	`session_id` text NOT NULL,
	`name` text DEFAULT 'New Chat' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`notebook_id`, `session_id`),
	FOREIGN KEY (`notebook_id`) REFERENCES `notebook`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_sessions_notebook_updated_idx` ON `chat_sessions` (`notebook_id`,`updated_at`);
--> statement-breakpoint
INSERT INTO `chat_sessions` (`notebook_id`, `session_id`, `name`, `created_at`, `updated_at`)
SELECT
	`notebook_id`,
	`session_id`,
	'New Chat',
	MIN(`created_at`),
	MAX(`updated_at`)
FROM `assistant_messages`
GROUP BY `notebook_id`, `session_id`;
