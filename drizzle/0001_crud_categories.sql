CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Isi kategori bawaan, lalu kategori lain yang sudah dipakai item, supaya foreign key di bawah tidak gagal.
INSERT INTO "categories" ("name", "icon") VALUES
	('Lamaran', 'sparkles'),
	('Pernikahan', 'heart'),
	('Rumah', 'home'),
	('Perhiasan', 'gem'),
	('Busana', 'shirt')
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "categories" ("name", "icon")
SELECT DISTINCT "category", 'sparkles' FROM "plan_items"
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "deposit_id" integer;--> statement-breakpoint
ALTER TABLE "deposits" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_category_categories_name_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("name") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "activities_deposit_id_idx" ON "activities" USING btree ("deposit_id");