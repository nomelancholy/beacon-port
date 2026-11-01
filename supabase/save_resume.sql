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
