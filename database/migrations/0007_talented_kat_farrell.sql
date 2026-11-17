ALTER TABLE "feedback" ADD COLUMN "type" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "name" varchar(120);--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "email" varchar(254);--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "category" varchar(20);--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "comments" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "status" varchar(20) DEFAULT 'submitted' NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "idempotency_key" varchar(128);--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_visitor_id_idempotency_key_uidx" ON "feedback" USING btree ("visitor_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feedback_visitor_id_idx" ON "feedback" USING btree ("visitor_id");--> statement-breakpoint
ALTER TABLE "feedback" DROP COLUMN "complaint";--> statement-breakpoint
ALTER TABLE "feedback" DROP COLUMN "suggestion";--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_type_check" CHECK ("feedback"."type" IN (
        'nps',
        'rating',
        'issue',
        'suggestion',
        'complaint'
      ));--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_category_check" CHECK ("feedback"."category" IS NULL OR "feedback"."category" IN (
        'business',
        'platforms',
        'partners'
      ));--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_rating_check" CHECK ("feedback"."rating" IS NULL OR (
        "feedback"."rating" >= 1 AND "feedback"."rating" <= 5
      ));--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_nps_score_check" CHECK ("feedback"."nps_score" IS NULL OR (
        "feedback"."nps_score" >= 0 AND "feedback"."nps_score" <= 10
      ));--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_status_check" CHECK ("feedback"."status" IN (
        'submitted',
        'reviewed',
        'resolved'
      ));