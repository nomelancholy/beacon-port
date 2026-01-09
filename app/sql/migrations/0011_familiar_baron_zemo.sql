CREATE POLICY "view_exp_skills" ON "experience_skills" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
      SELECT 1 FROM experiences e 
      JOIN resumes r ON e.resume_id = r.id 
      WHERE e.id = experience_id 
      AND (r.is_public = true OR r.user_id = auth.uid())
    ));--> statement-breakpoint
CREATE POLICY "view_proj_skills" ON "side_project_skills" AS PERMISSIVE FOR SELECT TO public USING (EXISTS (
      SELECT 1 FROM side_projects p 
      JOIN resumes r ON p.resume_id = r.id 
      WHERE p.id = side_project_id 
      AND (r.is_public = true OR r.user_id = auth.uid())
    ));