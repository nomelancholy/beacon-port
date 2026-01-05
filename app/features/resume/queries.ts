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
  // Nested select를 사용하여 이력서와 관련 데이터를 한 번에 가져오기
  const { data, error } = await supabaseClient
    .from("resumes")
    .select(
      `
      *,
      experiences (
        *
      ),
      side_projects (
        *
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

  // Nested 데이터를 정렬하여 반환
  return {
    resume: data,
    experiences: (data.experiences || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
    sideProjects: (data.side_projects || []).sort(
      (a: any, b: any) => a.display_order - b.display_order
    ),
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
