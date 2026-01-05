import db from "~/db";
import { eq } from "drizzle-orm";
import { resumes } from "./schema";

import supabaseClient from "~/supa-client";

export const getResumes = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from("resumes")
    .select("*")
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const getResumeById = async (resumeId: string) => {
  // 이력서 기본 정보
  const { data: resume, error: resumeError } = await supabaseClient
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .single();

  if (resumeError) {
    throw new Error(resumeError.message);
  }

  // 관련 데이터 가져오기
  const [
    experiences,
    sideProjects,
    educations,
    certifications,
    languageTests,
    etcs,
  ] = await Promise.all([
    supabaseClient
      .from("experiences")
      .select("*")
      .eq("resume_id", resumeId)
      .order("display_order", { ascending: true }),
    supabaseClient
      .from("side_projects")
      .select("*")
      .eq("resume_id", resumeId)
      .order("display_order", { ascending: true }),
    supabaseClient
      .from("educations")
      .select("*")
      .eq("resume_id", resumeId)
      .order("display_order", { ascending: true }),
    supabaseClient
      .from("certifications")
      .select("*")
      .eq("resume_id", resumeId)
      .order("display_order", { ascending: true }),
    supabaseClient
      .from("language_tests")
      .select("*")
      .eq("resume_id", resumeId)
      .order("display_order", { ascending: true }),
    supabaseClient
      .from("etcs")
      .select("*")
      .eq("resume_id", resumeId)
      .order("display_order", { ascending: true }),
  ]);

  // 각 쿼리의 에러 확인 (데이터가 없어도 에러가 아닐 수 있음)
  const errors = [
    experiences.error,
    sideProjects.error,
    educations.error,
    certifications.error,
    languageTests.error,
    etcs.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("Error fetching related data:", errors);
    // 에러가 있어도 빈 배열로 반환하여 계속 진행
  }

  return {
    resume,
    experiences: experiences.data || [],
    sideProjects: sideProjects.data || [],
    educations: educations.data || [],
    certifications: certifications.data || [],
    languageTests: languageTests.data || [],
    etcs: etcs.data || [],
  };
};
