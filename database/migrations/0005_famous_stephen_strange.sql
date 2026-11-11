CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" uuid NOT NULL,
	"referrer_name" varchar(120) NOT NULL,
	"referrer_email" varchar(254) NOT NULL,
	"referred_name" varchar(120) NOT NULL,
	"referred_email" varchar(254) NOT NULL,
	"relationship" varchar(20) NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"idempotency_key" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_visitor_id_idempotency_key_uidx" ON "referrals" USING btree ("visitor_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referrals_created_at_idx" ON "referrals" USING btree ("created_at");