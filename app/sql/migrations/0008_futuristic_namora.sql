CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid,
	"name" text NOT NULL,
	"issuer" text NOT NULL,
	"acquisition_date" timestamp NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "etcs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid,
	"name" text NOT NULL,
	"link" text,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "etcs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "language_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid,
	"name" text NOT NULL,
	"score" text NOT NULL,
	"test_date" timestamp NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "language_tests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etcs" ADD CONSTRAINT "etcs_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "language_tests" ADD CONSTRAINT "language_tests_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "view_undefined" ON "certifications" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "manage_undefined" ON "certifications" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND resumes.user_id = auth.uid()
  ));--> statement-breakpoint
CREATE POLICY "view_undefined" ON "etcs" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "manage_undefined" ON "etcs" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND resumes.user_id = auth.uid()
  ));--> statement-breakpoint
CREATE POLICY "view_undefined" ON "language_tests" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "manage_undefined" ON "language_tests" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND resumes.user_id = auth.uid()
  ));