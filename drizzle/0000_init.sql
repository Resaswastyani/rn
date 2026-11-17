CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"amount" bigint,
	"item_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposits_amount_positive" CHECK ("deposits"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "plan_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"target" bigint NOT NULL,
	"saved" bigint DEFAULT 0 NOT NULL,
	"due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_items_target_positive" CHECK ("plan_items"."target" > 0),
	CONSTRAINT "plan_items_saved_non_negative" CHECK ("plan_items"."saved" >= 0)
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name_one" text NOT NULL,
	"name_two" text NOT NULL,
	"target_date" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_singleton" CHECK ("profile"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_item_id_plan_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."plan_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_item_id_plan_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."plan_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_created_at_idx" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deposits_item_id_idx" ON "deposits" USING btree ("item_id");