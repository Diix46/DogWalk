CREATE TABLE `routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration_minutes` integer NOT NULL,
	`distance_meters` integer NOT NULL,
	`difficulty` text DEFAULT 'medium' NOT NULL,
	`type` text DEFAULT 'mixed' NOT NULL,
	`is_premium` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`geojson_path` text,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`created_at` integer NOT NULL
);
