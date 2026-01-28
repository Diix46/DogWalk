PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_routes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration_minutes` integer NOT NULL,
	`distance_meters` integer NOT NULL,
	`difficulty` text NOT NULL,
	`type` text NOT NULL,
	`is_premium` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`geojson_path` text,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_routes`("id", "name", "description", "duration_minutes", "distance_meters", "difficulty", "type", "is_premium", "is_active", "geojson_path", "center_lat", "center_lng", "created_at", "updated_at") SELECT "id", "name", "description", "duration_minutes", "distance_meters", "difficulty", "type", "is_premium", "is_active", "geojson_path", "center_lat", "center_lng", "created_at", "updated_at" FROM `routes`;--> statement-breakpoint
DROP TABLE `routes`;--> statement-breakpoint
ALTER TABLE `__new_routes` RENAME TO `routes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;