ALTER TABLE "bookings" ADD COLUMN "name" varchar(120);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "email" varchar(254);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "project_title" varchar(160);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "project_type" varchar(80);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "project_description" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "timeline" varchar(80);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "budget" varchar(120);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;