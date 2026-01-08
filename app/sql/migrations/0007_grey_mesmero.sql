ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "educations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "experience_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resumes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "side_project_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "side_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skill_aliases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "etcs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "language_tests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "certifications" CASCADE;--> statement-breakpoint
DROP TABLE "etcs" CASCADE;--> statement-breakpoint
DROP TABLE "language_tests" CASCADE;--> statement-breakpoint
ALTER TABLE "skill_aliases" ADD CONSTRAINT "aliases_lowercase" CHECK (alias = LOWER(alias));--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_name_lowercase" CHECK (name = LOWER(name));--> statement-breakpoint
CREATE POLICY "profiles_public_read" ON "profiles" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "profiles_owner_update" ON "profiles" AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = "id");--> statement-breakpoint
CREATE POLICY "view_undefined" ON "educations" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "manage_undefined" ON "educations" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND resumes.user_id = auth.uid()
  ));--> statement-breakpoint
CREATE POLICY "manage_exp_skills" ON "experience_skills" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
      SELECT 1 FROM experiences e 
      JOIN resumes r ON e.resume_id = r.id 
      WHERE e.id = experience_id AND r.user_id = auth.uid()
    ));--> statement-breakpoint
CREATE POLICY "view_undefined" ON "experiences" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "manage_undefined" ON "experiences" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND resumes.user_id = auth.uid()
  ));--> statement-breakpoint
CREATE POLICY "view_resumes" ON "resumes" AS PERMISSIVE FOR SELECT TO public USING (is_public = true OR auth.uid() = user_id);--> statement-breakpoint
CREATE POLICY "manage_resumes" ON "resumes" AS PERMISSIVE FOR ALL TO public USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "manage_proj_skills" ON "side_project_skills" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
      SELECT 1 FROM side_projects p 
      JOIN resumes r ON p.resume_id = r.id 
      WHERE p.id = side_project_id AND r.user_id = auth.uid()
    ));--> statement-breakpoint
CREATE POLICY "view_undefined" ON "side_projects" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND (resumes.is_public = true OR resumes.user_id = auth.uid())
  ));--> statement-breakpoint
CREATE POLICY "manage_undefined" ON "side_projects" AS PERMISSIVE FOR ALL TO public USING (EXISTS (
    SELECT 1 FROM resumes 
    WHERE resumes.id = "resume_id" 
    AND resumes.user_id = auth.uid()
  ));--> statement-breakpoint
CREATE POLICY "read_aliases" ON "skill_aliases" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "read_skills" ON "skills" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "insert_skills" ON "skills" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);