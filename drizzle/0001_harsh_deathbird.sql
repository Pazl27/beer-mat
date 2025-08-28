PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`item_id` integer,
	`item_name` text NOT NULL,
	`item_type` text NOT NULL,
	`item_price` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_user_items`("id", "user_id", "item_id", "item_name", "item_type", "item_price") SELECT "id", "user_id", "item_id", "item_name", "item_type", "item_price" FROM `user_items`;--> statement-breakpoint
DROP TABLE `user_items`;--> statement-breakpoint
ALTER TABLE `__new_user_items` RENAME TO `user_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;