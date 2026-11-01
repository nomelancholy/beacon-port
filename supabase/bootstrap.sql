-- Beacon Port: 새 Supabase 프로젝트 초기 설정
-- SQL Editor에서 전체를 복사해 한 번 실행하세요. 같은 파일을 다시 실행할 수 있습니다.
-- 대상: 새 프로젝트 wujwypdjjryisbcsxhsb. 기존 앱 테이블/데이터는 삭제하지 않습니다.
BEGIN;

DO $$ BEGIN
  CREATE TYPE public.english_level AS ENUM ('Native', 'Advanced', 'Intermediate', 'Basic');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nickname text NOT NULL,
  provider text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  photo text,
  role text,
  phone text,
  email text,
  address text,
  blog text,
  linkedin text,
  instagram text,
  facebook text,
  github text,
  youtube text,
  x text,
  introduce text,
  english_level public.english_level,
  skill_stack_selected text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text,
  start_date timestamp,
  end_date timestamp,
  description text,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.side_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  link text,
  start_date timestamp,
  end_date timestamp,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  institution text NOT NULL,
  major text,
  start_date timestamp,
  end_date timestamp,
  description text,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  acquisition_date timestamp,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.language_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  name text NOT NULL,
  score text,
  test_date timestamp,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.etcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  name text NOT NULL,
  link text,
  description text,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name = lower(name)),
  is_verified boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.skill_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  alias text NOT NULL UNIQUE CHECK (alias = lower(alias))
);
CREATE TABLE IF NOT EXISTS public.experience_skills (
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (experience_id, skill_id)
);
CREATE TABLE IF NOT EXISTS public.side_project_skills (
  side_project_id uuid NOT NULL REFERENCES public.side_projects(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (side_project_id, skill_id)
);

CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS experiences_resume_id_idx ON public.experiences(resume_id);
CREATE INDEX IF NOT EXISTS side_projects_resume_id_idx ON public.side_projects(resume_id);
CREATE INDEX IF NOT EXISTS educations_resume_id_idx ON public.educations(resume_id);
CREATE INDEX IF NOT EXISTS certifications_resume_id_idx ON public.certifications(resume_id);
CREATE INDEX IF NOT EXISTS language_tests_resume_id_idx ON public.language_tests(resume_id);
CREATE INDEX IF NOT EXISTS etcs_resume_id_idx ON public.etcs(resume_id);
CREATE INDEX IF NOT EXISTS experience_skills_skill_id_idx ON public.experience_skills(skill_id);
CREATE INDEX IF NOT EXISTS side_project_skills_skill_id_idx ON public.side_project_skills(skill_id);
CREATE INDEX IF NOT EXISTS skill_aliases_skill_id_idx ON public.skill_aliases(skill_id);

-- Explicit grants plus RLS: anonymous visitors only see public resumes.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.resumes FROM anon, authenticated;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.experiences FROM anon, authenticated;
ALTER TABLE public.side_projects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.side_projects FROM anon, authenticated;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.educations FROM anon, authenticated;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.certifications FROM anon, authenticated;
ALTER TABLE public.language_tests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.language_tests FROM anon, authenticated;
ALTER TABLE public.etcs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.etcs FROM anon, authenticated;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.skills FROM anon, authenticated;
ALTER TABLE public.skill_aliases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.skill_aliases FROM anon, authenticated;
ALTER TABLE public.experience_skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.experience_skills FROM anon, authenticated;
ALTER TABLE public.side_project_skills ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.side_project_skills FROM anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (nickname, updated_at) ON public.profiles TO authenticated;
GRANT SELECT ON public.resumes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT SELECT ON public.experiences TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.experiences TO authenticated;
GRANT SELECT ON public.side_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.side_projects TO authenticated;
GRANT SELECT ON public.educations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.educations TO authenticated;
GRANT SELECT ON public.certifications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT SELECT ON public.language_tests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.language_tests TO authenticated;
GRANT SELECT ON public.etcs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.etcs TO authenticated;
GRANT SELECT ON public.experience_skills TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.experience_skills TO authenticated;
GRANT SELECT ON public.side_project_skills TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.side_project_skills TO authenticated;
GRANT SELECT ON public.skills, public.skill_aliases TO anon, authenticated;
GRANT INSERT (name, is_verified) ON public.skills TO authenticated;

-- Profile email is only visible to its owner.
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_read ON public.profiles;
CREATE POLICY profiles_owner_read ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS view_resumes ON public.resumes;
CREATE POLICY view_resumes ON public.resumes FOR SELECT TO anon, authenticated
  USING (is_public OR user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS manage_resumes ON public.resumes;
CREATE POLICY manage_resumes ON public.resumes FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS view_experiences ON public.experiences;
CREATE POLICY view_experiences ON public.experiences FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experiences.resume_id
    AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_experiences ON public.experiences;
CREATE POLICY manage_experiences ON public.experiences FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experiences.resume_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = experiences.resume_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_side_projects ON public.side_projects;
CREATE POLICY view_side_projects ON public.side_projects FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = side_projects.resume_id
    AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_side_projects ON public.side_projects;
CREATE POLICY manage_side_projects ON public.side_projects FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = side_projects.resume_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = side_projects.resume_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_educations ON public.educations;
CREATE POLICY view_educations ON public.educations FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = educations.resume_id
    AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_educations ON public.educations;
CREATE POLICY manage_educations ON public.educations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = educations.resume_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = educations.resume_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_certifications ON public.certifications;
CREATE POLICY view_certifications ON public.certifications FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = certifications.resume_id
    AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_certifications ON public.certifications;
CREATE POLICY manage_certifications ON public.certifications FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = certifications.resume_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = certifications.resume_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_language_tests ON public.language_tests;
CREATE POLICY view_language_tests ON public.language_tests FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = language_tests.resume_id
    AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_language_tests ON public.language_tests;
CREATE POLICY manage_language_tests ON public.language_tests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = language_tests.resume_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = language_tests.resume_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_etcs ON public.etcs;
CREATE POLICY view_etcs ON public.etcs FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = etcs.resume_id
    AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_etcs ON public.etcs;
CREATE POLICY manage_etcs ON public.etcs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = etcs.resume_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = etcs.resume_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_experience_skills ON public.experience_skills;
CREATE POLICY view_experience_skills ON public.experience_skills FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.experiences c JOIN public.resumes r ON r.id = c.resume_id
    WHERE c.id = experience_skills.experience_id AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_experience_skills ON public.experience_skills;
CREATE POLICY manage_experience_skills ON public.experience_skills FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.experiences c JOIN public.resumes r ON r.id = c.resume_id
    WHERE c.id = experience_skills.experience_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.experiences c JOIN public.resumes r ON r.id = c.resume_id
    WHERE c.id = experience_skills.experience_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS view_side_project_skills ON public.side_project_skills;
CREATE POLICY view_side_project_skills ON public.side_project_skills FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.side_projects c JOIN public.resumes r ON r.id = c.resume_id
    WHERE c.id = side_project_skills.side_project_id AND (r.is_public OR r.user_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS manage_side_project_skills ON public.side_project_skills;
CREATE POLICY manage_side_project_skills ON public.side_project_skills FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.side_projects c JOIN public.resumes r ON r.id = c.resume_id
    WHERE c.id = side_project_skills.side_project_id AND r.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.side_projects c JOIN public.resumes r ON r.id = c.resume_id
    WHERE c.id = side_project_skills.side_project_id AND r.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS read_skills ON public.skills;
CREATE POLICY read_skills ON public.skills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS insert_skills ON public.skills;
CREATE POLICY insert_skills ON public.skills FOR INSERT TO authenticated WITH CHECK (is_verified = false);
DROP POLICY IF EXISTS read_aliases ON public.skill_aliases;
CREATE POLICY read_aliases ON public.skill_aliases FOR SELECT TO anon, authenticated USING (true);

-- Google, GitHub and email profile creation, including missing existing profiles.
-- Install after public.profiles exists. Supports email, Google and GitHub users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, provider)
  VALUES (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'nickname', ''),
             nullif(new.raw_user_meta_data->>'full_name', ''),
             nullif(new.raw_user_meta_data->>'name', ''),
             nullif(new.raw_user_meta_data->>'user_name', ''), 'Anonymous'),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recover profiles for users who signed up before the trigger was installed.
INSERT INTO public.profiles (id, email, nickname, provider)
SELECT id, coalesce(email, ''),
       coalesce(nullif(raw_user_meta_data->>'nickname', ''),
                nullif(raw_user_meta_data->>'full_name', ''),
                nullif(raw_user_meta_data->>'name', ''),
                nullif(raw_user_meta_data->>'user_name', ''), 'Anonymous'),
       coalesce(raw_app_meta_data->>'provider', 'email')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Photo URLs are public, matching the application's getPublicUrl behavior.
-- Uploads and cleanup are restricted to the authenticated user's UUID folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS beacon_photos_select ON storage.objects;
CREATE POLICY beacon_photos_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS beacon_photos_insert ON storage.objects;
CREATE POLICY beacon_photos_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
DROP POLICY IF EXISTS beacon_photos_delete ON storage.objects;
CREATE POLICY beacon_photos_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Atomic resume persistence.
-- Apply once the existing resume schema and RLS policies have been installed.
-- SECURITY INVOKER keeps the caller's RLS permissions; no service-role key is needed.
CREATE OR REPLACE FUNCTION public.save_resume(p_resume_id uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_resume public.resumes;
  v_item jsonb;
  v_child uuid;
  v_skill uuid;
  v_name text;
  v_order integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_payload->'resume') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid resume payload' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(ARRAY['experiences','side_projects','educations','certifications','language_tests','etcs']) AS k
             WHERE jsonb_typeof(p_payload->k) IS DISTINCT FROM 'array') THEN
    RAISE EXCEPTION 'All detail arrays are required' USING ERRCODE = '22023';
  END IF;
  v_resume := jsonb_populate_record(NULL::public.resumes, p_payload->'resume');
  IF nullif(btrim(v_resume.title), '') IS NULL OR nullif(btrim(v_resume.name), '') IS NULL THEN
    RAISE EXCEPTION 'Title and name required' USING ERRCODE = '22023';
  END IF;

  IF p_resume_id IS NULL THEN
    INSERT INTO public.resumes (user_id, title, name, photo, role, phone, email, address, blog, linkedin, instagram, facebook, github, youtube, x, introduce, english_level, skill_stack_selected)
    VALUES (v_user, v_resume.title, v_resume.name, v_resume.photo, v_resume.role, v_resume.phone, v_resume.email, v_resume.address, v_resume.blog, v_resume.linkedin, v_resume.instagram, v_resume.facebook, v_resume.github, v_resume.youtube, v_resume.x, v_resume.introduce, v_resume.english_level, v_resume.skill_stack_selected) RETURNING id INTO v_id;
  ELSE
    -- Serialize concurrent edits and preserve the current public/private setting.
    SELECT id INTO v_id FROM public.resumes
      WHERE id = p_resume_id AND user_id = v_user FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE = '42501'; END IF;
    UPDATE public.resumes SET title = v_resume.title, name = v_resume.name, photo = v_resume.photo, role = v_resume.role, phone = v_resume.phone, email = v_resume.email, address = v_resume.address, blog = v_resume.blog, linkedin = v_resume.linkedin, instagram = v_resume.instagram, facebook = v_resume.facebook, github = v_resume.github, youtube = v_resume.youtube, x = v_resume.x, introduce = v_resume.introduce, english_level = v_resume.english_level, skill_stack_selected = v_resume.skill_stack_selected, updated_at = now() WHERE id = v_id;
    DELETE FROM public.experiences WHERE resume_id = v_id;
    DELETE FROM public.side_projects WHERE resume_id = v_id;
    DELETE FROM public.educations WHERE resume_id = v_id;
    DELETE FROM public.certifications WHERE resume_id = v_id;
    DELETE FROM public.language_tests WHERE resume_id = v_id;
    DELETE FROM public.etcs WHERE resume_id = v_id;
  END IF;

  v_order := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'experiences') LOOP
    IF nullif(btrim(v_item->>'company'), '') IS NULL THEN
      RAISE EXCEPTION 'Missing required experiences field' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.experiences (resume_id, display_order, company, role, start_date, end_date, description)
    VALUES (v_id, v_order, v_item->>'company', v_item->>'role', ((v_item->>'start_date') || '-01')::timestamp, ((v_item->>'end_date') || '-01')::timestamp, v_item->>'description') RETURNING id INTO v_child;
    FOR v_name IN SELECT DISTINCT lower(btrim(value)) FROM jsonb_array_elements_text(v_item->'skills') LOOP
      IF v_name = '' THEN CONTINUE; END IF;
      SELECT skill_id INTO v_skill FROM public.skill_aliases WHERE alias = v_name;
      IF v_skill IS NULL THEN
        INSERT INTO public.skills (name, is_verified) VALUES (v_name, false) ON CONFLICT (name) DO NOTHING;
        SELECT id INTO STRICT v_skill FROM public.skills WHERE name = v_name;
      END IF;
      INSERT INTO public.experience_skills (experience_id, skill_id) VALUES (v_child, v_skill) ON CONFLICT DO NOTHING;
    END LOOP;
    v_order := v_order + 1;
  END LOOP;

  v_order := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'side_projects') LOOP
    IF nullif(btrim(v_item->>'name'), '') IS NULL THEN
      RAISE EXCEPTION 'Missing required side_projects field' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.side_projects (resume_id, display_order, name, start_date, end_date, description, link)
    VALUES (v_id, v_order, v_item->>'name', ((v_item->>'start_date') || '-01')::timestamp, ((v_item->>'end_date') || '-01')::timestamp, v_item->>'description', v_item->>'link') RETURNING id INTO v_child;
    FOR v_name IN SELECT DISTINCT lower(btrim(value)) FROM jsonb_array_elements_text(v_item->'skills') LOOP
      IF v_name = '' THEN CONTINUE; END IF;
      SELECT skill_id INTO v_skill FROM public.skill_aliases WHERE alias = v_name;
      IF v_skill IS NULL THEN
        INSERT INTO public.skills (name, is_verified) VALUES (v_name, false) ON CONFLICT (name) DO NOTHING;
        SELECT id INTO STRICT v_skill FROM public.skills WHERE name = v_name;
      END IF;
      INSERT INTO public.side_project_skills (side_project_id, skill_id) VALUES (v_child, v_skill) ON CONFLICT DO NOTHING;
    END LOOP;
    v_order := v_order + 1;
  END LOOP;

  v_order := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'educations') LOOP
    IF nullif(btrim(v_item->>'institution'), '') IS NULL THEN
      RAISE EXCEPTION 'Missing required educations field' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.educations (resume_id, display_order, institution, major, start_date, end_date, description)
    VALUES (v_id, v_order, v_item->>'institution', v_item->>'major', ((v_item->>'start_date') || '-01')::timestamp, ((v_item->>'end_date') || '-01')::timestamp, v_item->>'description') RETURNING id INTO v_child;
    v_order := v_order + 1;
  END LOOP;

  v_order := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'certifications') LOOP
    IF nullif(btrim(v_item->>'name'), '') IS NULL THEN
      RAISE EXCEPTION 'Missing required certifications field' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.certifications (resume_id, display_order, name, issuer, acquisition_date)
    VALUES (v_id, v_order, v_item->>'name', v_item->>'issuer', ((v_item->>'acquisition_date') || '-01')::timestamp) RETURNING id INTO v_child;
    v_order := v_order + 1;
  END LOOP;

  v_order := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'language_tests') LOOP
    IF nullif(btrim(v_item->>'name'), '') IS NULL THEN
      RAISE EXCEPTION 'Missing required language_tests field' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.language_tests (resume_id, display_order, name, score, test_date)
    VALUES (v_id, v_order, v_item->>'name', v_item->>'score', ((v_item->>'test_date') || '-01')::timestamp) RETURNING id INTO v_child;
    v_order := v_order + 1;
  END LOOP;

  v_order := 0;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'etcs') LOOP
    IF nullif(btrim(v_item->>'name'), '') IS NULL THEN
      RAISE EXCEPTION 'Missing required etcs field' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.etcs (resume_id, display_order, name, link, description)
    VALUES (v_id, v_order, v_item->>'name', v_item->>'link', v_item->>'description') RETURNING id INTO v_child;
    v_order := v_order + 1;
  END LOOP;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_resume(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_resume(uuid, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT 'Beacon Port 초기 설정 완료' AS result;
