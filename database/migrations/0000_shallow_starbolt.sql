CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fun_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"icon" text NOT NULL,
	"text" text NOT NULL,
	"position" integer NOT NULL
);
