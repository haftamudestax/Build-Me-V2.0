ALTER TABLE "bookings" ADD COLUMN "idempotency_key" varchar(128);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "request_details" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "meeting_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "meeting_duration_minutes" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_visitor_id_idempotency_key_uidx" ON "bookings" USING btree ("visitor_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "bookings_booking_type_idx" ON "bookings" USING btree ("booking_type");--> statement-breakpoint
CREATE INDEX "bookings_meeting_start_at_idx" ON "bookings" USING btree ("meeting_start_at");