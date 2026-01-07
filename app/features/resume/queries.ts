import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";

export const getResumes = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const getResumeById = async (
  supabase: SupabaseClient<Database>,
  resumeId: string
) => {
  // Nested select를 사용하여 이력서와 관련 데이터를 한 번에 가져오기
  const { data, error } = await supabase
    .from("resumes")
    .select(
      `
      *,
      experiences (
        *,
        experience_skills (
          skill_id,
          skills (
            id,
            name
          )
        )
      ),
      side_projects (
        *,
        side_project_skills (
          skill_id,
          skills (
            id,
            name
          )
        )
      ),
      educations (
        *
      ),
      certifications (
        *
      ),
      language_tests (
        *
      ),
      etcs (
        *
      )
    `
    )
    .eq("id", resumeId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Resume not found");
  }

  // Nested 데이터를 정렬하고 기술 스택을 평탄화하여 반환
  const experiences = (data.experiences || [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((exp: any) => ({
      ...exp,
      skills: (exp.experience_skills || [])
        .map((es: any) => es.skills)
        .filter((s: any) => s !== null),
    }));

  const sideProjects = (data.side_projects || [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((sp: any) => ({
      ...sp,
      skills: (sp.side_project_skills || [])
        .map((sps: any) => sps.skills)
        .filter((s: any) => s !== null),
    }));

  return {
    resume: data,
    experiences,
    sideProjects,
    educations: (data.educations || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
    certifications: (data.certifications || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
    languageTests: (data.language_tests || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
    etcs: (data.etcs || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
  };
};

export const updateResumePublicStatus = async (
  supabase: SupabaseClient<Database>,
  resumeId: string,
  isPublic: boolean
) => {
  const { data, error } = await supabase
    .from("resumes")
    .update({ is_public: isPublic })
    .eq("id", resumeId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Skills 검색 (자동완성용)
export const searchSkills = async (
  supabase: SupabaseClient<Database>,
  query: string
) => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("skills")
    .select("id, name")
    .ilike("name", `%${query.trim()}%`)
    .limit(10);

  if (error) {
    console.error("Skills search error:", error);
    return [];
  }

  return data || [];
};

// Skill 추가 또는 가져오기
export const getOrCreateSkill = async (
  supabase: SupabaseClient<Database>,
  skillName: string
) => {
  const trimmedName = skillName.trim();
  if (!trimmedName) {
    return null;
  }

  // 먼저 기존 skill 찾기
  const { data: existingSkill, error: searchError } = await supabase
    .from("skills")
    .select("id, name")
    .ilike("name", trimmedName)
    .limit(1)
    .single();

  if (existingSkill && !searchError) {
    return existingSkill;
  }

  // 없으면 새로 생성
  const { data: newSkill, error: insertError } = await supabase
    .from("skills")
    .insert({ name: trimmedName, is_verified: false })
    .select("id, name")
    .single();

  if (insertError) {
    // 중복 에러인 경우 다시 검색
    if (insertError.code === "23505") {
      const { data: retrySkill } = await supabase
        .from("skills")
        .select("id, name")
        .ilike("name", trimmedName)
        .limit(1)
        .single();
      return retrySkill;
    }
    console.error("Skill creation error:", insertError);
    return null;
  }

  return newSkill;
};
