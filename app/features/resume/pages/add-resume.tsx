import * as React from "react";
import type { Route } from "./+types/add-resume";
import { useNavigate, useFetcher } from "react-router";
import { createSupabaseServerClient } from "~/supabase/server";
import { redirect } from "react-router";
import { getResumeById } from "../queries";
import { z } from "zod";
import {
  ChevronDown,
  Github,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  Plus,
  X,
  GripVertical,
  ArrowLeft,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "../../../components/ui/sidebar";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../../../database.types";
import imageCompression from "browser-image-compression";
import { Loader2 } from "lucide-react";
import { useToast, Toast } from "../../../components/ui/toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../../components/ui/chart";

export function meta({ data }: Route.MetaArgs) {
  const isEditMode = !!data?.resume;
  return [
    {
      title: isEditMode
        ? `이력서 수정 - ${data.resume.title} - Beacon Port`
        : "이력서 추가 - Beacon Port",
    },
    {
      name: "description",
      content: isEditMode
        ? "이력서를 수정하세요"
        : "새로운 이력서를 작성하세요",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const resumeId = url.searchParams.get("resumeId");

  if (!resumeId) {
    return { resume: null };
  }

  const supabase = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  try {
    const data = await getResumeById(supabase, resumeId);

    // 소유자 확인
    if (data.resume.user_id !== user.id) {
      throw new Response("Forbidden", { status: 403 });
    }

    return data;
  } catch (error) {
    console.error("Error loading resume:", error);
    throw new Response("이력서를 불러올 수 없습니다", { status: 404 });
  }
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method === "POST") {
    const headers = new Headers();
    const supabase = createSupabaseServerClient(request, headers);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const resumeIdParam = url.searchParams.get("resumeId");
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "save-resume") {
      // About Me 필드 매핑
      const title = formData.get("title") as string;
      if (!title || title.trim() === "") {
        return {
          success: false,
          error: "이력서 제목을 입력해주세요.",
        };
      }

      // 사진 업로드 처리 (base64가 있으면 Storage에 업로드, 기존 URL이면 그대로 사용)
      let photoUrl: string | null = null;
      const photoBase64 = formData.get("사진") as string;
      // 기존 URL인 경우 (http:// 또는 https://로 시작)
      if (photoBase64 && photoBase64.startsWith("http")) {
        photoUrl = photoBase64;
      } else if (photoBase64 && photoBase64.startsWith("data:image/")) {
        try {
          // base64에서 데이터 추출
          const base64Data = photoBase64.split(",")[1];
          const mimeMatch = photoBase64.match(/data:image\/([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : "jpeg";
          const fileExt =
            mimeType === "png" ? "png" : mimeType === "gif" ? "gif" : "jpg";

          // Buffer로 변환
          const buffer = Buffer.from(base64Data, "base64");

          // 고유한 파일명 생성
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          // Supabase Storage에 업로드
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("photos").upload(filePath, buffer, {
              contentType: `image/${mimeType}`,
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error("Photo upload error:", uploadError);
            return {
              success: false,
              error: "사진 업로드에 실패했습니다.",
            };
          }

          // 공개 URL 가져오기
          const {
            data: { publicUrl },
          } = supabase.storage.from("photos").getPublicUrl(filePath);
          photoUrl = publicUrl;
        } catch (error) {
          console.error("Photo processing error:", error);
          return {
            success: false,
            error: "사진 처리 중 오류가 발생했습니다.",
          };
        }
      }

      const resumeData = {
        user_id: user.id,
        title: title.trim(),
        name: (formData.get("이름") as string) || "",
        photo: photoUrl,
        role: (formData.get("Role") as string) || null,
        phone: (formData.get("전화번호") as string) || null,
        email: (formData.get("이메일") as string) || null,
        address: (formData.get("주소") as string) || null,
        blog: (formData.get("블로그") as string) || null,
        linkedin: (formData.get("LinkedIn") as string) || null,
        instagram: (formData.get("Instagram") as string) || null,
        facebook: (formData.get("Facebook") as string) || null,
        github: (formData.get("Github") as string) || null,
        youtube: (formData.get("Youtube") as string) || null,
        x: (formData.get("X") as string) || null,
        introduce: (formData.get("Introduce") as string) || null,
        english_level:
          (formData.get("영어 구사 능력") as
            | "Native"
            | "Advanced"
            | "Intermediate"
            | "Basic") || null,
        is_public: false,
      };

      // name은 필수 필드
      if (!resumeData.name) {
        return {
          success: false,
          error: "이름은 필수 입력 항목입니다.",
        };
      }

      let resumeId: string;

      // 수정 모드인 경우
      if (resumeIdParam) {
        // 소유자 확인
        const { data: existingResume, error: checkError } = await supabase
          .from("resumes")
          .select("user_id")
          .eq("id", resumeIdParam)
          .single();

        if (checkError || !existingResume) {
          return {
            success: false,
            error: "이력서를 찾을 수 없습니다.",
          };
        }

        if (existingResume.user_id !== user.id) {
          return {
            success: false,
            error: "이력서를 수정할 권한이 없습니다.",
          };
        }

        // 기존 데이터 업데이트
        const { data: updatedResume, error: updateError } = await supabase
          .from("resumes")
          .update({
            ...resumeData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resumeIdParam)
          .select()
          .single();

        if (updateError) {
          console.error("Resume update error:", updateError);
          return {
            success: false,
            error: updateError.message,
          };
        }

        resumeId = updatedResume.id;

        // 기존 관련 데이터 삭제 (새로 추가할 데이터로 대체)
        await supabase.from("experiences").delete().eq("resume_id", resumeId);
        await supabase.from("side_projects").delete().eq("resume_id", resumeId);
        await supabase.from("educations").delete().eq("resume_id", resumeId);
        await supabase
          .from("certifications")
          .delete()
          .eq("resume_id", resumeId);
        await supabase
          .from("language_tests")
          .delete()
          .eq("resume_id", resumeId);
        await supabase.from("etcs").delete().eq("resume_id", resumeId);
      } else {
        // 새로 생성
        const { data: resume, error: resumeError } = await supabase
          .from("resumes")
          .insert(resumeData)
          .select()
          .single();

        if (resumeError) {
          console.error("Resume creation error:", resumeError);
          return {
            success: false,
            error: resumeError.message,
          };
        }

        resumeId = resume.id;
      }

      // 필수 필드 검증 (zod 스키마)
      const validationErrors: string[] = [];

      // 1. Experiences 검증 및 순서 처리
      const experienceOrderStr = formData.get("_order_Experience");
      let experienceItemIds: string[] = [];
      
      if (experienceOrderStr) {
        const experienceOrder = JSON.parse(experienceOrderStr as string) as string[];
        experienceItemIds = experienceOrder.filter((itemId) => {
          const company = formData.get(`${itemId}_회사명`);
          return company !== null;
        });
      } else {
        const experienceKeys = Array.from(formData.keys()).filter((key) =>
          key.startsWith("Experience_")
        );
        experienceItemIds = [
          ...new Set(
            experienceKeys.map((key) => {
              const parts = key.split("_");
              return parts[0] + "_" + parts[1]; // "Experience_xxx"
            })
          ),
        ];
      }
      if (experienceItemIds.length > 0) {
        experienceItemIds.forEach((itemId, index) => {
          const company = formData.get(`${itemId}_회사명`) as string;
          if (!company || company.trim() === "") {
            validationErrors.push(
              `경력 ${index + 1}: 회사명은 필수 입력 항목입니다.`
            );
          }
        });
      }

      // 2. Side Projects 검증 및 순서 처리
      const sideProjectOrderStr = formData.get("_order_Side Project");
      let sideProjectItemIds: string[] = [];
      
      if (sideProjectOrderStr) {
        const sideProjectOrder = JSON.parse(sideProjectOrderStr as string) as string[];
        sideProjectItemIds = sideProjectOrder.filter((itemId) => {
          const name = formData.get(`${itemId}_프로젝트명`);
          return name !== null;
        });
      } else {
        const sideProjectKeys = Array.from(formData.keys()).filter((key) =>
          key.startsWith("Side Project_")
        );
        sideProjectItemIds = [
          ...new Set(
            sideProjectKeys.map((key) => {
              const match = key.match(/^(Side Project_[^_]+)/);
              return match ? match[1] : null;
            })
          ),
        ].filter((id) => id !== null) as string[];
      }
      if (sideProjectItemIds.length > 0) {
        sideProjectItemIds.forEach((itemId, index) => {
          const name = formData.get(`${itemId}_프로젝트명`) as string;
          if (!name || name.trim() === "") {
            validationErrors.push(
              `사이드 프로젝트 ${index + 1}: 프로젝트명은 필수 입력 항목입니다.`
            );
          }
        });
      }

      // 3. Educations 검증 및 순서 처리
      // dynamicItems의 순서를 사용하여 드래그 순서 보존
      const educationOrderStr = formData.get("_order_Education");
      let educationItemIds: string[] = [];
      
      if (educationOrderStr) {
        // 순서 정보가 있으면 그 순서 사용
        const educationOrder = JSON.parse(educationOrderStr as string) as string[];
        educationItemIds = educationOrder.filter((itemId) => {
          // 해당 항목이 실제로 formData에 있는지 확인
          const institution = formData.get(`${itemId}_기관명`);
          return institution !== null;
        });
      } else {
        // 순서 정보가 없으면 기존 방식 사용 (하위 호환성)
        const educationKeys = Array.from(formData.keys()).filter((key) =>
          key.startsWith("Education_")
        );
        educationItemIds = [
          ...new Set(
            educationKeys.map((key) => {
              const parts = key.split("_");
              return parts[0] + "_" + parts[1]; // "Education_xxx"
            })
          ),
        ];
      }
      
      if (educationItemIds.length > 0) {
        educationItemIds.forEach((itemId, index) => {
          const institution = formData.get(`${itemId}_기관명`) as string;
          if (!institution || institution.trim() === "") {
            validationErrors.push(
              `교육 ${index + 1}: 기관명은 필수 입력 항목입니다.`
            );
          }
        });
      }

      // 4. Certifications 검증 및 순서 처리
      const certificationOrderStr = formData.get("_order_자격증");
      let certificationItemIds: string[] = [];
      
      if (certificationOrderStr) {
        const certificationOrder = JSON.parse(certificationOrderStr as string) as string[];
        certificationItemIds = certificationOrder.filter((itemId) => {
          const name = formData.get(`${itemId}_자격증명`);
          return name !== null;
        });
      } else {
        const certificationKeys = Array.from(formData.keys()).filter((key) =>
          key.startsWith("자격증_")
        );
        certificationItemIds = [
          ...new Set(
            certificationKeys
              .map((key) => {
                const match = key.match(/^(자격증_[^_]+)/);
                return match ? match[1] : null;
              })
              .filter((id) => id !== null)
          ),
        ] as string[];
      }
      if (certificationItemIds.length > 0) {
        certificationItemIds.forEach((itemId, index) => {
          const name = formData.get(`${itemId}_자격증명`) as string;
          if (!name || name.trim() === "") {
            validationErrors.push(
              `자격증 ${index + 1}: 자격증명은 필수 입력 항목입니다.`
            );
          }
        });
      }

      // 5. Language Tests 검증
      const languageTestKeys = Array.from(formData.keys()).filter((key) =>
        key.startsWith("어학성적_")
      );
      const languageTestItemIds = [
        ...new Set(
          languageTestKeys.map(
            (key) => key.split("_")[0] + "_" + key.split("_")[1]
          )
        ),
      ];
      if (languageTestItemIds.length > 0) {
        languageTestItemIds.forEach((itemId, index) => {
          const name = formData.get(`${itemId}_시험명`) as string;
          if (!name || name.trim() === "") {
            validationErrors.push(
              `어학성적 ${index + 1}: 시험명은 필수 입력 항목입니다.`
            );
          }
        });
      }

      // 6. Etcs 검증
      const etcKeys = Array.from(formData.keys()).filter((key) =>
        key.startsWith("그 외 활동_")
      );
      const etcItemIds = [
        ...new Set(
          etcKeys.map((key) => {
            const match = key.match(/^(그 외 활동_[^_]+)/);
            return match ? match[1] : null;
          })
        ),
      ].filter((id) => id !== null) as string[];
      if (etcItemIds.length > 0) {
        etcItemIds.forEach((itemId, index) => {
          const name = formData.get(`${itemId}_활동명`) as string;
          if (!name || name.trim() === "") {
            validationErrors.push(
              `그 외 활동 ${index + 1}: 활동명은 필수 입력 항목입니다.`
            );
          }
        });
      }

      // 검증 실패 시 에러 반환
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join("\n"),
        };
      }

      // 동적 항목들 저장
      // 1. Experiences
      if (experienceItemIds.length > 0) {
        const experiencesData = experienceItemIds
          .map((itemId, index) => {
            const company = formData.get(`${itemId}_회사명`) as string;
            const role = formData.get(`${itemId}_Role`) as string;
            const startDate = formData.get(`${itemId}_시작일`) as string;
            const endDate = formData.get(`${itemId}_종료일`) as string;
            const description = formData.get(`${itemId}_작업내용`) as string;
            const skills = formData.get(`${itemId}_스킬`) as string;

            // 회사명만 필수 (schema.ts 기준)
            if (!company || company.trim() === "") return null;

            return {
              resume_id: resumeId,
              company,
              role: role || null,
              start_date: startDate
                ? new Date(startDate + "-01").toISOString()
                : null,
              end_date: endDate
                ? new Date(endDate + "-01").toISOString()
                : null,
              description: description || null,
              display_order: index,
              skills: skills || "", // 기술 스택은 별도로 저장
            };
          })
          .filter((item) => item !== null);

        if (experiencesData.length > 0) {
          const { data: insertedExperiences, error: expError } = await supabase
            .from("experiences")
            .insert(experiencesData.map(({ skills, ...rest }) => rest))
            .select("id");

          if (expError) {
            console.error("Experiences insert error:", expError);
          } else if (insertedExperiences) {
            // 기술 스택 저장
            for (let i = 0; i < experiencesData.length; i++) {
              const experience = experiencesData[i];
              const insertedExp = insertedExperiences[i];
              if (!insertedExp || !experience.skills) continue;

              const skillNames = experience.skills
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .map((s) => s.replace(/[A-Z]/g, (char) => char.toLowerCase())); // 영어만 소문자로 변환

              for (const skillName of skillNames) {
                console.log(
                  `[Experience] Processing skill: "${skillName}" for experience ${insertedExp.id}`
                );

                // 1. skills_alias 테이블에서만 alias로 검색
                const { data: skillAlias, error: aliasError } = await supabase
                  .from("skill_aliases")
                  .select("skill_id")
                  .ilike("alias", skillName)
                  .limit(1)
                  .maybeSingle();

                if (aliasError && aliasError.code !== "PGRST116") {
                  console.error(
                    `[Experience] Error searching skill_aliases for "${skillName}":`,
                    aliasError
                  );
                }

                let skillId: string | undefined =
                  skillAlias?.skill_id || undefined;

                if (skillId) {
                  console.log(
                    `[Experience] Found skill_id ${skillId} from skill_aliases for "${skillName}"`
                  );
                } else {
                  console.log(
                    `[Experience] No alias found for "${skillName}", creating new skill`
                  );
                  // 2. alias가 없으면 skills 테이블에 새로 생성
                  const { data: newSkill, error: skillError } = await supabase
                    .from("skills")
                    .insert({ name: skillName, is_verified: false })
                    .select("id")
                    .single();

                  if (skillError) {
                    if (skillError.code === "23505") {
                      // 중복 에러인 경우 다시 검색
                      console.log(
                        `[Experience] Duplicate skill detected for "${skillName}", retrying search`
                      );
                      const { data: retrySkill } = await supabase
                        .from("skills")
                        .select("id")
                        .ilike("name", skillName)
                        .limit(1)
                        .maybeSingle();
                      skillId = retrySkill?.id;
                      if (skillId) {
                        console.log(
                          `[Experience] Found existing skill_id ${skillId} for "${skillName}"`
                        );
                      }
                    } else {
                      console.error(
                        `[Experience] Skill creation error for "${skillName}":`,
                        skillError
                      );
                      continue;
                    }
                  } else {
                    skillId = newSkill?.id;
                    console.log(
                      `[Experience] Created new skill_id ${skillId} for "${skillName}"`
                    );
                  }
                }

                if (skillId) {
                  // experience_skills에 저장
                  console.log(
                    `[Experience] Inserting into experience_skills: experience_id=${insertedExp.id}, skill_id=${skillId}`
                  );
                  try {
                    const { error: skillInsertError } = await supabase
                      .from("experience_skills")
                      .insert({
                        experience_id: insertedExp.id,
                        skill_id: skillId,
                      });
                    // 중복 에러는 무시
                    if (skillInsertError) {
                      if (skillInsertError.code === "23505") {
                        console.log(
                          `[Experience] Duplicate entry ignored for experience_id=${insertedExp.id}, skill_id=${skillId}`
                        );
                      } else {
                        console.error(
                          `[Experience] Error inserting into experience_skills:`,
                          skillInsertError
                        );
                      }
                    } else {
                      console.log(
                        `[Experience] Successfully inserted skill ${skillId} for experience ${insertedExp.id}`
                      );
                    }
                  } catch (err: any) {
                    // 중복 에러는 무시
                    if (err?.code !== "23505") {
                      console.error(
                        `[Experience] Exception inserting into experience_skills:`,
                        err
                      );
                    } else {
                      console.log(
                        `[Experience] Duplicate entry exception ignored`
                      );
                    }
                  }
                } else {
                  console.error(
                    `[Experience] Failed to get skillId for "${skillName}"`
                  );
                }
              }
            }
          }
        }
      }

      // 2. Side Projects
      if (sideProjectItemIds.length > 0) {
        const sideProjectsData = sideProjectItemIds
          .map((itemId, index) => {
            const name = formData.get(`${itemId}_프로젝트명`) as string;
            const startDate = formData.get(`${itemId}_시작일`) as string;
            const endDate = formData.get(`${itemId}_종료일`) as string;
            const description = formData.get(`${itemId}_주요작업`) as string;
            const link = formData.get(`${itemId}_링크`) as string;
            const techStack = formData.get(`${itemId}_기술스택`) as string;

            // 프로젝트명만 필수 (schema.ts 기준)
            if (!name || name.trim() === "") return null;

            return {
              resume_id: resumeId,
              name,
              start_date: startDate
                ? new Date(startDate + "-01").toISOString()
                : null,
              end_date: endDate
                ? new Date(endDate + "-01").toISOString()
                : null,
              description: description || null,
              link: link || null,
              display_order: index,
              techStack: techStack || "", // 기술 스택은 별도로 저장
            };
          })
          .filter((item) => item !== null);

        if (sideProjectsData.length > 0) {
          const { data: insertedSideProjects, error: spError } = await supabase
            .from("side_projects")
            .insert(
              sideProjectsData.map(({ techStack, ...rest }) => rest)
            )
            .select("id");

          if (spError) {
            console.error("Side projects insert error:", spError);
          } else if (insertedSideProjects) {
            // 기술 스택 저장
            for (let i = 0; i < sideProjectsData.length; i++) {
              const sideProject = sideProjectsData[i];
              const insertedSP = insertedSideProjects[i];
              if (!insertedSP || !sideProject.techStack) continue;

              const skillNames = sideProject.techStack
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .map((s) => s.replace(/[A-Z]/g, (char) => char.toLowerCase())); // 영어만 소문자로 변환

              for (const skillName of skillNames) {
                console.log(
                  `[Side Project] Processing skill: "${skillName}" for side project ${insertedSP.id}`
                );

                // 1. skills_alias 테이블에서만 alias로 검색
                const { data: skillAlias, error: aliasError } = await supabase
                  .from("skill_aliases")
                  .select("skill_id")
                  .ilike("alias", skillName)
                  .limit(1)
                  .maybeSingle();

                if (aliasError && aliasError.code !== "PGRST116") {
                  console.error(
                    `[Side Project] Error searching skill_aliases for "${skillName}":`,
                    aliasError
                  );
                }

                let skillId: string | undefined =
                  skillAlias?.skill_id || undefined;

                if (skillId) {
                  console.log(
                    `[Side Project] Found skill_id ${skillId} from skill_aliases for "${skillName}"`
                  );
                } else {
                  console.log(
                    `[Side Project] No alias found for "${skillName}", creating new skill`
                  );
                  // 2. alias가 없으면 skills 테이블에 새로 생성
                  const { data: newSkill, error: skillError } = await supabase
                    .from("skills")
                    .insert({ name: skillName, is_verified: false })
                    .select("id")
                    .single();

                  if (skillError) {
                    if (skillError.code === "23505") {
                      // 중복 에러인 경우 다시 검색
                      console.log(
                        `[Side Project] Duplicate skill detected for "${skillName}", retrying search`
                      );
                      const { data: retrySkill } = await supabase
                        .from("skills")
                        .select("id")
                        .ilike("name", skillName)
                        .limit(1)
                        .maybeSingle();
                      skillId = retrySkill?.id;
                      if (skillId) {
                        console.log(
                          `[Side Project] Found existing skill_id ${skillId} for "${skillName}"`
                        );
                      }
                    } else {
                      console.error(
                        `[Side Project] Skill creation error for "${skillName}":`,
                        skillError
                      );
                      continue;
                    }
                  } else {
                    skillId = newSkill?.id;
                    console.log(
                      `[Side Project] Created new skill_id ${skillId} for "${skillName}"`
                    );
                  }
                }

                if (skillId) {
                  // side_project_skills에 저장
                  console.log(
                    `[Side Project] Inserting into side_project_skills: side_project_id=${insertedSP.id}, skill_id=${skillId}`
                  );
                  try {
                    const { error: skillInsertError } = await supabase
                      .from("side_project_skills")
                      .insert({
                        side_project_id: insertedSP.id,
                        skill_id: skillId,
                      });
                    // 중복 에러는 무시
                    if (skillInsertError) {
                      if (skillInsertError.code === "23505") {
                        console.log(
                          `[Side Project] Duplicate entry ignored for side_project_id=${insertedSP.id}, skill_id=${skillId}`
                        );
                      } else {
                        console.error(
                          `[Side Project] Error inserting into side_project_skills:`,
                          skillInsertError
                        );
                      }
                    } else {
                      console.log(
                        `[Side Project] Successfully inserted skill ${skillId} for side project ${insertedSP.id}`
                      );
                    }
                  } catch (err: any) {
                    // 중복 에러는 무시
                    if (err?.code !== "23505") {
                      console.error(
                        `[Side Project] Exception inserting into side_project_skills:`,
                        err
                      );
                    } else {
                      console.log(
                        `[Side Project] Duplicate entry exception ignored`
                      );
                    }
                  }
                } else {
                  console.error(
                    `[Side Project] Failed to get skillId for "${skillName}"`
                  );
                }
              }
            }
          }
        }
      }

      // 3. Educations
      if (educationItemIds.length > 0) {
        const educationsData = educationItemIds
          .map((itemId, index) => {
            const institution = formData.get(`${itemId}_기관명`) as string;
            const major = formData.get(`${itemId}_전공`) as string;
            const startDate = formData.get(`${itemId}_시작일`) as string;
            const endDate = formData.get(`${itemId}_종료일`) as string;
            const description = formData.get(`${itemId}_내용`) as string;

            // 기관명만 필수 (schema.ts 기준)
            if (!institution || institution.trim() === "") return null;

            return {
              resume_id: resumeId,
              institution,
              major: major || null,
              start_date: startDate
                ? new Date(startDate + "-01").toISOString()
                : null,
              end_date: endDate
                ? new Date(endDate + "-01").toISOString()
                : null,
              description: description || null,
              display_order: index,
            };
          })
          .filter((item) => item !== null);

        if (educationsData.length > 0) {
          const { error: eduError } = await supabase
            .from("educations")
            .insert(educationsData);
          if (eduError) {
            console.error("Educations insert error:", eduError);
          }
        }
      }

      // 4. Certifications (자격증)
      if (certificationItemIds.length > 0) {
        const certificationsData = certificationItemIds
          .map((itemId, index) => {
            const name = formData.get(`${itemId}_자격증명`) as string;
            const issuer = formData.get(`${itemId}_발급기관`) as string;
            const acquisitionDate = formData.get(`${itemId}_취득일`) as string;

            // 자격증명만 필수
            if (!name || name.trim() === "") return null;

            return {
              resume_id: resumeId,
              name: name.trim(),
              issuer: issuer && issuer.trim() ? issuer.trim() : null,
              acquisition_date: acquisitionDate
                ? new Date(acquisitionDate + "-01").toISOString()
                : null,
              display_order: index,
            };
          })
          .filter((item) => item !== null);

        if (certificationsData.length > 0) {
          const { error: certError } = await supabase
            .from("certifications")
            .insert(certificationsData);
          if (certError) {
            console.error("Certifications insert error:", certError);
          }
        }
      }

      // 5. Language Tests (어학성적)
      if (languageTestItemIds.length > 0) {
        const languageTestsData = languageTestItemIds
          .map((itemId, index) => {
            const name = formData.get(`${itemId}_시험명`) as string;
            const score = formData.get(`${itemId}_점수`) as string;
            const testDate = formData.get(`${itemId}_응시일자`) as string;

            if (!name || !score || !testDate) return null;

            return {
              resume_id: resumeId,
              name,
              score,
              test_date: new Date(testDate + "-01").toISOString(),
              display_order: index,
            };
          })
          .filter((item) => item !== null);

        if (languageTestsData.length > 0) {
          const { error: langError } = await supabase
            .from("language_tests")
            .insert(languageTestsData);
          if (langError) {
            console.error("Language tests insert error:", langError);
          }
        }
      }

      // 6. Etcs (그 외 활동)
      if (etcItemIds.length > 0) {
        const etcsData = etcItemIds
          .map((itemId, index) => {
            const name = formData.get(`${itemId}_활동명`) as string;
            const link = formData.get(`${itemId}_링크`) as string;
            const description = formData.get(`${itemId}_내용`) as string;

            if (!name) return null;

            return {
              resume_id: resumeId,
              name,
              link: link || null,
              description: description || null,
              display_order: index,
            };
          })
          .filter((item) => item !== null);

        if (etcsData.length > 0) {
          const { error: etcError } = await supabase
            .from("etcs")
            .insert(etcsData);
          if (etcError) {
            console.error("Etcs insert error:", etcError);
          }
        }
      }

      // 저장 성공 시 이력서 상세 페이지로 리다이렉트
      return redirect(`/resume/${resumeId}`, { headers });
    }
  }

  return { success: false };
};

// 카테고리와 하위 항목 정의
const resumeCategories = {
  "About Me": [
    "사진",
    "이름",
    "Role",
    "이메일",
    "전화번호",
    "주소",
    "영어 구사 능력",
    "블로그",
    "LinkedIn",
    "Instagram",
    "Facebook",
    "Github",
    "Youtube",
    "X",
    "Introduce",
  ],
  Experience: [],
  "Side Project": [],
  "스킬 스택 그래프": [],
  Education: [],
  자격증: [],
  어학성적: [],
  "그 외 활동": [],
};

// 스킬 스택 차트 컴포넌트
const SkillStackChart = React.memo(
  ({
    data,
  }: {
    data: Array<{ name: string; years: number; displayText: string }>;
  }) => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 640);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const chartData = data.map((item) => ({
      skill: item.name,
      years: item.years,
      displayText: item.displayText,
    }));

    const chartConfig = {
      years: {
        label: "사용 기간 (년)",
        color: "hsl(217, 91%, 60%)", // 파란색
      },
      label: {
        color: "hsl(var(--background))",
      },
    } satisfies ChartConfig;

    // 가장 긴 막대의 값을 찾아서 domain을 조정하여 우측 여백 생성
    const maxValue = Math.max(...chartData.map((d) => d.years));
    // 모바일에서는 더 큰 여백을 위해 domain을 더 크게 설정
    const domainMax = isMobile ? maxValue * 1.35 : maxValue * 1.18;
    // 모바일에서는 margin도 더 크게 설정
    const rightMargin = isMobile ? 24 : 16;

    // 스킬 개수에 따라 높이 동적 계산 (각 막대 20px, 최소 60px)
    const skillCount = chartData.length;
    const barHeight = 20; // 각 막대 높이
    const minHeight = 60; // 최소 높이
    const calculatedHeight = Math.max(minHeight, skillCount * barHeight);

    return (
      <div className="w-full" style={{ height: calculatedHeight }}>
        <ChartContainer
          config={chartConfig}
          className="aspect-none h-full w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            barCategoryGap={2}
            height={calculatedHeight}
            margin={{
              right: rightMargin,
              top: 2,
              bottom: 2,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="skill"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="years" type="number" hide domain={[0, domainMax]} />
            <Bar
              dataKey="years"
              fill="var(--color-years)"
              radius={4}
              barSize={20}
            >
              <LabelList
                dataKey="skill"
                position="insideLeft"
                offset={8}
                className="fill-[hsl(var(--background))] dark:fill-[hsl(var(--foreground))]"
                fontSize={12}
                fontWeight={500}
              />
              <LabelList
                dataKey="displayText"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                fontWeight={500}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    );
  }
);
SkillStackChart.displayName = "SkillStackChart";

// 기술 스택 입력 컴포넌트 (자동완성 기능 포함)
const SkillInput = React.memo(
  ({
    itemId,
    value,
    onInputChange,
    fieldName,
  }: {
    itemId: string;
    value: string;
    onInputChange: (field: string, value: string) => void;
    fieldName: string;
  }) => {
    const [inputValue, setInputValue] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<
      { id: string; name: string }[]
    >([]);
    const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const suggestionsRef = React.useRef<HTMLDivElement>(null);

    // 영어만 소문자로 변환하는 함수
    const toLowerCaseEnglish = (str: string): string => {
      return str.replace(/[A-Z]/g, (char) => char.toLowerCase());
    };

    // 초기값 설정
    React.useEffect(() => {
      if (value) {
        const skills = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        setSelectedSkills(skills);
      }
    }, [value]);

    // 외부 클릭 감지
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Supabase 클라이언트 생성 (클라이언트 사이드에서만)
    const getSupabaseClient = React.useCallback(() => {
      if (typeof window === "undefined") return null;

      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        console.warn("Missing Supabase environment variables");
        return null;
      }

      return createBrowserClient<Database>(url, anonKey);
    }, []);

    // 기술 검색 (debounce)
    React.useEffect(() => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setSuggestions([]);
        return;
      }

      const timeoutId = setTimeout(async () => {
        try {
          const { data, error } = await client
            .from("skills")
            .select("id, name")
            .ilike("name", `%${inputValue.trim()}%`)
            .limit(10);

          if (error) {
            console.error("Skills search error:", error);
            setSuggestions([]);
          } else {
            setSuggestions(data || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Skills search error:", error);
          setSuggestions([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [inputValue, getSupabaseClient]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = toLowerCaseEnglish(e.target.value);
      setInputValue(newValue);

      // 쉼표 입력 시 현재 입력값을 기술로 추가
      if (newValue.endsWith(",")) {
        const skillToAdd = newValue.slice(0, -1).trim();
        if (skillToAdd && !selectedSkills.includes(skillToAdd)) {
          addSkill(skillToAdd);
        }
        setInputValue("");
      }
    };

    const addSkill = async (skillName: string) => {
      if (!skillName.trim() || selectedSkills.includes(skillName.trim())) {
        return;
      }

      const trimmedSkill = toLowerCaseEnglish(skillName.trim());
      const client = getSupabaseClient();

      // 선택된 기술 목록에 추가 (클라이언트가 없어도 UI는 업데이트)
      const newSkills = [...selectedSkills, trimmedSkill];
      setSelectedSkills(newSkills);
      onInputChange(fieldName, newSkills.join(", "));
      setInputValue("");
      setShowSuggestions(false);

      // skills 테이블에서 찾거나 생성 (클라이언트가 있을 때만)
      if (!client) {
        console.warn(
          "Supabase client not available, skill not saved to database"
        );
        return;
      }

      try {
        // 먼저 기존 skill 찾기
        const { data: existingSkill } = await client
          .from("skills")
          .select("id, name")
          .ilike("name", trimmedSkill)
          .limit(1)
          .single();

        // 없으면 새로 생성
        if (!existingSkill) {
          const { error } = await client
            .from("skills")
            .insert({ name: trimmedSkill, is_verified: false })
            .select("id, name")
            .single();

          if (error) {
            // 중복 에러는 무시 (이미 존재하는 경우)
            if (error.code !== "23505") {
              console.error("Skill creation error:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error adding skill to database:", error);
        // 에러가 나도 UI는 이미 업데이트됨
      }
    };

    const removeSkill = (skillToRemove: string) => {
      const newSkills = selectedSkills.filter((s) => s !== skillToRemove);
      setSelectedSkills(newSkills);
      onInputChange(fieldName, newSkills.join(", "));
    };

    const handleSuggestionClick = (suggestion: {
      id: string;
      name: string;
    }) => {
      addSkill(toLowerCaseEnglish(suggestion.name));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        addSkill(toLowerCaseEnglish(inputValue.trim()));
      } else if (e.key === "Backspace") {
        const target = e.currentTarget;
        // 입력 필드가 완전히 비어있고, 커서가 맨 앞에 있을 때만 마지막 뱃지 삭제
        // 입력 중에 백스페이스를 눌러서 텍스트를 지우는 경우와 구분
        if (
          inputValue === "" &&
          target.selectionStart === 0 &&
          target.selectionEnd === 0 &&
          selectedSkills.length > 0
        ) {
          e.preventDefault();
          removeSkill(selectedSkills[selectedSkills.length - 1]);
        }
      }
    };

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          id={fieldName}
          name={fieldName}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="예: Python, Flask, AWS (쉼표로 구분)"
          className="w-full"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        )}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedSkills.map((skill, idx) => {
              const variants = ["default", "secondary", "outline"] as const;
              const variant = variants[idx % variants.length];
              return (
                <Badge
                  key={idx}
                  variant={variant}
                  className="cursor-pointer"
                  onClick={() => removeSkill(skill)}
                >
                  {skill}
                  <X className="h-3 w-3 ml-1 inline" />
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

// Experience 카드 컴포넌트 (통합 컴포넌트 - 외부 선언)
const ExperienceCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    onInputChange,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    onInputChange: (field: string, value: string) => void;
    onRemove: () => void;
  }) => {
    const id = `${category}_${itemId}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* 내부 콘텐츠 직접 렌더링 */}
          <div className="flex items-center justify-between mb-4 pl-6">
            <h3 className="text-lg font-semibold">경력 {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${itemId}_회사명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                근무회사명 <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${itemId}_회사명`}
                name={`${itemId}_회사명`}
                value={formData[`${itemId}_회사명`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_회사명`, e.target.value)
                }
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_Role`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Role
              </label>
              <Input
                id={`${itemId}_Role`}
                name={`${itemId}_Role`}
                value={formData[`${itemId}_Role`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_Role`, e.target.value)
                }
                placeholder="예: Python Backend, Python Chapter Lead"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label
                  htmlFor={`${itemId}_시작일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  시작일
                </label>
                <Input
                  id={`${itemId}_시작일`}
                  name={`${itemId}_시작일`}
                  type="month"
                  value={formData[`${itemId}_시작일`] || ""}
                  onChange={(e) =>
                    onInputChange(`${itemId}_시작일`, e.target.value)
                  }
                  placeholder="예: 2019-01"
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor={`${itemId}_종료일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  종료일
                </label>
                <Input
                  id={`${itemId}_종료일`}
                  name={`${itemId}_종료일`}
                  type="month"
                  value={formData[`${itemId}_종료일`] || ""}
                  onChange={(e) =>
                    onInputChange(`${itemId}_종료일`, e.target.value)
                  }
                  placeholder="예: 2024-01 또는 현재"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`${itemId}_스킬`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                기술 스택
              </label>
              <SkillInput
                itemId={itemId}
                value={formData[`${itemId}_스킬`] || ""}
                onInputChange={onInputChange}
                fieldName={`${itemId}_스킬`}
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_작업내용`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                주요 작업 내용
              </label>
              <textarea
                id={`${itemId}_작업내용`}
                name={`${itemId}_작업내용`}
                rows={6}
                value={formData[`${itemId}_작업내용`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_작업내용`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="주요 작업 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // 폼 데이터 중 이 카드와 관련된 값만 바뀌었을 때만 리렌더링하도록 최적화
    const id = prev.itemId;
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.formData[`${id}_회사명`] === next.formData[`${id}_회사명`] &&
      prev.formData[`${id}_Role`] === next.formData[`${id}_Role`] &&
      prev.formData[`${id}_시작일`] === next.formData[`${id}_시작일`] &&
      prev.formData[`${id}_종료일`] === next.formData[`${id}_종료일`] &&
      prev.formData[`${id}_스킬`] === next.formData[`${id}_스킬`] &&
      prev.formData[`${id}_작업내용`] === next.formData[`${id}_작업내용`]
    );
  }
);

// Side Project 카드 컴포넌트
const SideProjectCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    onInputChange,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    onInputChange: (field: string, value: string) => void;
    onRemove: () => void;
  }) => {
    const id = `${category}_${itemId}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex items-center justify-between mb-4 pl-6">
            <h3 className="text-lg font-semibold">프로젝트 {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${itemId}_프로젝트명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                사이드 프로젝트 명 <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${itemId}_프로젝트명`}
                name={`${itemId}_프로젝트명`}
                value={formData[`${itemId}_프로젝트명`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_프로젝트명`, e.target.value)
                }
                placeholder="프로젝트명을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label
                  htmlFor={`${itemId}_시작일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  시작일
                </label>
                <Input
                  id={`${itemId}_시작일`}
                  name={`${itemId}_시작일`}
                  type="month"
                  value={formData[`${itemId}_시작일`] || ""}
                  onChange={(e) =>
                    onInputChange(`${itemId}_시작일`, e.target.value)
                  }
                  placeholder="예: 2023-01"
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor={`${itemId}_종료일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  종료일
                </label>
                <Input
                  id={`${itemId}_종료일`}
                  name={`${itemId}_종료일`}
                  type="month"
                  value={formData[`${itemId}_종료일`] || ""}
                  onChange={(e) =>
                    onInputChange(`${itemId}_종료일`, e.target.value)
                  }
                  placeholder="예: 2023-06 또는 현재"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`${itemId}_기술스택`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                기술 스택
              </label>
              <SkillInput
                itemId={itemId}
                value={formData[`${itemId}_기술스택`] || ""}
                onInputChange={onInputChange}
                fieldName={`${itemId}_기술스택`}
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_링크`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                링크
              </label>
              <Input
                id={`${itemId}_링크`}
                name={`${itemId}_링크`}
                type="url"
                value={formData[`${itemId}_링크`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_링크`, e.target.value)
                }
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_주요작업`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                주요 작업
              </label>
              <textarea
                id={`${itemId}_주요작업`}
                name={`${itemId}_주요작업`}
                rows={6}
                value={formData[`${itemId}_주요작업`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_주요작업`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="주요 작업 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    const id = prev.itemId;
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.formData[`${id}_프로젝트명`] === next.formData[`${id}_프로젝트명`] &&
      prev.formData[`${id}_시작일`] === next.formData[`${id}_시작일`] &&
      prev.formData[`${id}_종료일`] === next.formData[`${id}_종료일`] &&
      prev.formData[`${id}_기술스택`] === next.formData[`${id}_기술스택`] &&
      prev.formData[`${id}_링크`] === next.formData[`${id}_링크`] &&
      prev.formData[`${id}_주요작업`] === next.formData[`${id}_주요작업`]
    );
  }
);

// Education 카드 컴포넌트
const EducationCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    onInputChange,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    onInputChange: (field: string, value: string) => void;
    onRemove: () => void;
  }) => {
    const id = `${category}_${itemId}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex items-center justify-between mb-4 pl-6">
            <h3 className="text-lg font-semibold">교육 {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${itemId}_기관명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                교육 기관명 <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${itemId}_기관명`}
                name={`${itemId}_기관명`}
                value={formData[`${itemId}_기관명`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_기관명`, e.target.value)
                }
                placeholder="교육 기관명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_전공`}
                className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5"
              >
                전공 (선택사항)
              </label>
              <Input
                id={`${itemId}_전공`}
                name={`${itemId}_전공`}
                value={formData[`${itemId}_전공`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_전공`, e.target.value)
                }
                placeholder="전공을 입력하세요"
                className="text-gray-600 dark:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label
                  htmlFor={`${itemId}_시작일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  시작일
                </label>
                <Input
                  id={`${itemId}_시작일`}
                  name={`${itemId}_시작일`}
                  type="month"
                  value={formData[`${itemId}_시작일`] || ""}
                  onChange={(e) =>
                    onInputChange(`${itemId}_시작일`, e.target.value)
                  }
                  placeholder="예: 2018-04"
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor={`${itemId}_종료일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  종료일
                </label>
                <Input
                  id={`${itemId}_종료일`}
                  name={`${itemId}_종료일`}
                  type="month"
                  value={formData[`${itemId}_종료일`] || ""}
                  onChange={(e) =>
                    onInputChange(`${itemId}_종료일`, e.target.value)
                  }
                  placeholder="예: 2018-05"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`${itemId}_내용`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                교육 내용
              </label>
              <textarea
                id={`${itemId}_내용`}
                name={`${itemId}_내용`}
                rows={6}
                value={formData[`${itemId}_내용`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_내용`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="교육 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    const id = prev.itemId;
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.formData[`${id}_기관명`] === next.formData[`${id}_기관명`] &&
      prev.formData[`${id}_전공`] === next.formData[`${id}_전공`] &&
      prev.formData[`${id}_시작일`] === next.formData[`${id}_시작일`] &&
      prev.formData[`${id}_종료일`] === next.formData[`${id}_종료일`] &&
      prev.formData[`${id}_내용`] === next.formData[`${id}_내용`]
    );
  }
);

// 자격증 카드 컴포넌트
const CertificationCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    onInputChange,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    onInputChange: (field: string, value: string) => void;
    onRemove: () => void;
  }) => {
    const id = `${category}_${itemId}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex items-center justify-between mb-4 pl-6">
            <h3 className="text-lg font-semibold">자격증 {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${itemId}_자격증명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                자격증명 <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${itemId}_자격증명`}
                name={`${itemId}_자격증명`}
                value={formData[`${itemId}_자격증명`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_자격증명`, e.target.value)
                }
                placeholder="자격증명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_발급기관`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                발급기관
              </label>
              <Input
                id={`${itemId}_발급기관`}
                name={`${itemId}_발급기관`}
                value={formData[`${itemId}_발급기관`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_발급기관`, e.target.value)
                }
                placeholder="발급기관을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_취득일`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                취득일
              </label>
              <Input
                id={`${itemId}_취득일`}
                name={`${itemId}_취득일`}
                type="month"
                value={formData[`${itemId}_취득일`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_취득일`, e.target.value)
                }
                placeholder="예: 2024-01"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    const id = prev.itemId;
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.formData[`${id}_자격증명`] === next.formData[`${id}_자격증명`] &&
      prev.formData[`${id}_발급기관`] === next.formData[`${id}_발급기관`] &&
      prev.formData[`${id}_취득일`] === next.formData[`${id}_취득일`]
    );
  }
);

// 어학성적 카드 컴포넌트
const LanguageTestCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    onInputChange,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    onInputChange: (field: string, value: string) => void;
    onRemove: () => void;
  }) => {
    const id = `${category}_${itemId}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex items-center justify-between mb-4 pl-6">
            <h3 className="text-lg font-semibold">어학 성적 {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${itemId}_시험명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                시험명 <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${itemId}_시험명`}
                name={`${itemId}_시험명`}
                value={formData[`${itemId}_시험명`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_시험명`, e.target.value)
                }
                placeholder="예: TOEIC, TOEFL, IELTS"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_점수`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                점수
              </label>
              <Input
                id={`${itemId}_점수`}
                name={`${itemId}_점수`}
                value={formData[`${itemId}_점수`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_점수`, e.target.value)
                }
                placeholder="예: 950, 7.5"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_응시일자`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                응시 일자
              </label>
              <Input
                id={`${itemId}_응시일자`}
                name={`${itemId}_응시일자`}
                type="month"
                value={formData[`${itemId}_응시일자`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_응시일자`, e.target.value)
                }
                placeholder="예: 2024-01"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    const id = prev.itemId;
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.formData[`${id}_시험명`] === next.formData[`${id}_시험명`] &&
      prev.formData[`${id}_점수`] === next.formData[`${id}_점수`] &&
      prev.formData[`${id}_응시일자`] === next.formData[`${id}_응시일자`]
    );
  }
);

// etc 카드 컴포넌트
const EtcCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    onInputChange,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    onInputChange: (field: string, value: string) => void;
    onRemove: () => void;
  }) => {
    const id = `${category}_${itemId}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex items-center justify-between mb-4 pl-6">
            <h3 className="text-lg font-semibold">활동 {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${itemId}_활동명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                활동명 <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${itemId}_활동명`}
                name={`${itemId}_활동명`}
                value={formData[`${itemId}_활동명`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_활동명`, e.target.value)
                }
                placeholder="활동명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_링크`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                링크
              </label>
              <Input
                id={`${itemId}_링크`}
                name={`${itemId}_링크`}
                type="url"
                value={formData[`${itemId}_링크`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_링크`, e.target.value)
                }
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label
                htmlFor={`${itemId}_내용`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                활동 내용
              </label>
              <textarea
                id={`${itemId}_내용`}
                name={`${itemId}_내용`}
                rows={6}
                value={formData[`${itemId}_내용`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_내용`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="활동 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    const id = prev.itemId;
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.formData[`${id}_활동명`] === next.formData[`${id}_활동명`] &&
      prev.formData[`${id}_링크`] === next.formData[`${id}_링크`] &&
      prev.formData[`${id}_내용`] === next.formData[`${id}_내용`]
    );
  }
);

// 드래그 가능한 카드 컴포넌트 (다른 카테고리용)
const DraggableCard = React.memo(
  ({
    field,
    category,
    index,
    children,
  }: {
    field: string;
    category: string;
    index: number;
    children: React.ReactNode;
  }) => {
    const id = `${category}_${field}`;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="mb-8">
        <div className="p-6 border rounded-lg bg-card relative">
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 cursor-move text-gray-400 hover:text-gray-600 touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          {children}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.field === nextProps.field &&
      prevProps.category === nextProps.category &&
      prevProps.index === nextProps.index
    );
  }
);

export default function AddResume({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { toast, showToast, hideToast } = useToast();
  const isEditMode = !!loaderData?.resume;

  // 초기 선택 필드 (모두 비어있음)
  const getInitialSelectedFields = () => {
    return {} as Record<string, boolean>;
  };

  // 기존 데이터로 초기화
  const initializeFromLoaderData = () => {
    if (!loaderData?.resume) {
      return {
        selectedFields: getInitialSelectedFields(),
        formData: {} as Record<string, string>,
        dynamicItems: {
          Experience: [],
          "Side Project": [],
          Education: [],
          자격증: [],
          어학성적: [],
          "그 외 활동": [],
        },
        resumeTitle: "",
      };
    }

    const resume = loaderData.resume;
    const formData: Record<string, string> = {};
    const selectedFields: Record<string, boolean> = {};
    const dynamicItems: Record<string, string[]> = {
      Experience: [],
      "Side Project": [],
      Education: [],
      자격증: [],
      어학성적: [],
      "그 외 활동": [],
    };

    // About Me 필드 채우기
    if (resume.photo) {
      formData["사진"] = resume.photo;
      selectedFields["사진"] = true;
    }
    if (resume.name) {
      formData["이름"] = resume.name;
      selectedFields["이름"] = true;
    }
    if (resume.role) {
      formData["Role"] = resume.role;
      selectedFields["Role"] = true;
    }
    if (resume.email) {
      formData["이메일"] = resume.email;
      selectedFields["이메일"] = true;
    }
    if (resume.phone) {
      formData["전화번호"] = resume.phone;
      selectedFields["전화번호"] = true;
    }
    if (resume.address) {
      formData["주소"] = resume.address;
      selectedFields["주소"] = true;
    }
    if (resume.english_level) {
      formData["영어 구사 능력"] = resume.english_level;
      selectedFields["영어 구사 능력"] = true;
    }
    if (resume.blog) {
      formData["블로그"] = resume.blog;
      selectedFields["블로그"] = true;
    }
    if (resume.linkedin) {
      formData["LinkedIn"] = resume.linkedin;
      selectedFields["LinkedIn"] = true;
    }
    if (resume.instagram) {
      formData["Instagram"] = resume.instagram;
      selectedFields["Instagram"] = true;
    }
    if (resume.facebook) {
      formData["Facebook"] = resume.facebook;
      selectedFields["Facebook"] = true;
    }
    if (resume.github) {
      formData["Github"] = resume.github;
      selectedFields["Github"] = true;
    }
    if (resume.youtube) {
      formData["Youtube"] = resume.youtube;
      selectedFields["Youtube"] = true;
    }
    if (resume.x) {
      formData["X"] = resume.x;
      selectedFields["X"] = true;
    }
    if (resume.introduce) {
      formData["Introduce"] = resume.introduce;
      selectedFields["Introduce"] = true;
    }

    // Experiences
    if (loaderData.experiences && loaderData.experiences.length > 0) {
      selectedFields["Experience"] = true;
      loaderData.experiences.forEach((exp: any, index: number) => {
        const itemId = `Experience_${exp.id}`;
        dynamicItems.Experience.push(itemId);
        selectedFields[itemId] = true;
        formData[`${itemId}_회사명`] = exp.company || "";
        formData[`${itemId}_Role`] = exp.role || "";
        formData[`${itemId}_시작일`] = exp.start_date
          ? new Date(exp.start_date).toISOString().slice(0, 7)
          : "";
        formData[`${itemId}_종료일`] = exp.end_date
          ? new Date(exp.end_date).toISOString().slice(0, 7)
          : "";
        formData[`${itemId}_작업내용`] = exp.description || "";
        if (exp.skills && exp.skills.length > 0) {
          formData[`${itemId}_스킬`] = exp.skills
            .map((s: any) => s.name)
            .join(", ");
        }
      });
    }

    // Side Projects
    if (loaderData.sideProjects && loaderData.sideProjects.length > 0) {
      selectedFields["Side Project"] = true;
      loaderData.sideProjects.forEach((sp: any, index: number) => {
        const itemId = `Side Project_${sp.id}`;
        dynamicItems["Side Project"].push(itemId);
        selectedFields[itemId] = true;
        formData[`${itemId}_프로젝트명`] = sp.name || "";
        formData[`${itemId}_시작일`] = sp.start_date
          ? new Date(sp.start_date).toISOString().slice(0, 7)
          : "";
        formData[`${itemId}_종료일`] = sp.end_date
          ? new Date(sp.end_date).toISOString().slice(0, 7)
          : "";
        formData[`${itemId}_링크`] = sp.link || "";
        formData[`${itemId}_주요작업`] = sp.description || "";
        if (sp.skills && sp.skills.length > 0) {
          formData[`${itemId}_기술스택`] = sp.skills
            .map((s: any) => s.name)
            .join(", ");
        }
      });
    }

    // Educations
    if (loaderData.educations && loaderData.educations.length > 0) {
      selectedFields["Education"] = true;
      loaderData.educations.forEach((edu: any, index: number) => {
        const itemId = `Education_${edu.id}`;
        dynamicItems.Education.push(itemId);
        selectedFields[itemId] = true;
        formData[`${itemId}_기관명`] = edu.institution || "";
        formData[`${itemId}_전공`] = edu.major || "";
        formData[`${itemId}_시작일`] = edu.start_date
          ? new Date(edu.start_date).toISOString().slice(0, 7)
          : "";
        formData[`${itemId}_종료일`] = edu.end_date
          ? new Date(edu.end_date).toISOString().slice(0, 7)
          : "";
        formData[`${itemId}_내용`] = edu.description || "";
      });
    }

    // Certifications
    if (loaderData.certifications && loaderData.certifications.length > 0) {
      selectedFields["자격증"] = true;
      loaderData.certifications.forEach((cert: any, index: number) => {
        const itemId = `자격증_${cert.id}`;
        dynamicItems.자격증.push(itemId);
        selectedFields[itemId] = true;
        formData[`${itemId}_자격증명`] = cert.name || "";
        formData[`${itemId}_발급기관`] = cert.issuer || "";
        formData[`${itemId}_취득일`] = cert.acquisition_date
          ? new Date(cert.acquisition_date).toISOString().slice(0, 7)
          : "";
      });
    }

    // Language Tests
    if (loaderData.languageTests && loaderData.languageTests.length > 0) {
      selectedFields["어학성적"] = true;
      loaderData.languageTests.forEach((test: any, index: number) => {
        const itemId = `어학성적_${test.id}`;
        dynamicItems.어학성적.push(itemId);
        selectedFields[itemId] = true;
        formData[`${itemId}_시험명`] = test.name || "";
        formData[`${itemId}_점수`] = test.score || "";
        formData[`${itemId}_응시일자`] = test.test_date
          ? new Date(test.test_date).toISOString().slice(0, 7)
          : "";
      });
    }

    // Etcs
    if (loaderData.etcs && loaderData.etcs.length > 0) {
      selectedFields["그 외 활동"] = true;
      loaderData.etcs.forEach((etc: any, index: number) => {
        const itemId = `그 외 활동_${etc.id}`;
        dynamicItems["그 외 활동"].push(itemId);
        selectedFields[itemId] = true;
        formData[`${itemId}_활동명`] = etc.name || "";
        formData[`${itemId}_링크`] = etc.link || "";
        formData[`${itemId}_내용`] = etc.description || "";
      });
    }

    return {
      selectedFields,
      formData,
      dynamicItems,
      resumeTitle: resume.title || "",
    };
  };

  const initialData = React.useMemo(initializeFromLoaderData, [loaderData]);

  const [selectedFields, setSelectedFields] = React.useState<
    Record<string, boolean>
  >(initialData.selectedFields);
  const [formData, setFormData] = React.useState<Record<string, string>>(
    initialData.formData
  );
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [showTitleDialog, setShowTitleDialog] = React.useState(false);
  const [resumeTitle, setResumeTitle] = React.useState(initialData.resumeTitle);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >({
    "About Me": true,
  });

  // 저장 상태 모니터링 및 에러 처리
  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.error) {
        showToast(fetcher.data.error, "error");
      } else if (fetcher.data.success === false && fetcher.data.error) {
        showToast(fetcher.data.error, "error");
      }
    }
  }, [fetcher.data, showToast]);

  // 동적 항목 관리 (Experience, Side Project 등)
  const [dynamicItems, setDynamicItems] = React.useState<
    Record<string, string[]>
  >(initialData.dynamicItems);

  // 동적 항목 추가
  const handleAddDynamicItem = (category: string) => {
    const timestamp = Date.now();
    const newItemId = `${category}_${timestamp}`;
    setDynamicItems((prev) => ({
      ...prev,
      [category]: [...prev[category], newItemId],
    }));
    // 자동으로 체크박스도 선택
    setSelectedFields((prev) => ({
      ...prev,
      [newItemId]: true,
    }));
  };

  // 동적 항목 삭제
  const handleRemoveDynamicItem = (category: string, itemId: string) => {
    setDynamicItems((prev) => ({
      ...prev,
      [category]: prev[category].filter((id) => id !== itemId),
    }));
    // 관련된 모든 폼 데이터 삭제
    setFormData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (key.startsWith(itemId)) {
          delete newData[key];
        }
      });
      return newData;
    });
    // 체크박스도 해제
    setSelectedFields((prev) => {
      const newData = { ...prev };
      delete newData[itemId];
      return newData;
    });
  };

  // 드래그 앤 드롭으로 순서 변경 (dnd-kit sortable)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // id 형식: "category_field"
    const activeId = active.id as string;
    const overId = over.id as string;

    const [activeCategory, ...activeParts] = activeId.split("_");
    const [overCategory, ...overParts] = overId.split("_");

    if (activeCategory !== overCategory) return;

    const activeField = activeParts.join("_");
    const overField = overParts.join("_");

    setDynamicItems((prev) => {
      const allItems = [...prev[activeCategory]];
      const selectedItems = allItems.filter((id) => selectedFields[id]);
      const unselectedItems = allItems.filter((id) => !selectedFields[id]);

      const activeIndex = selectedItems.indexOf(activeField);
      const overIndex = selectedItems.indexOf(overField);

      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return prev;
      }

      // arrayMove를 사용하여 순서 변경
      const newSelectedItems = arrayMove(selectedItems, activeIndex, overIndex);

      return {
        ...prev,
        [activeCategory]: [...newSelectedItems, ...unselectedItems],
      };
    });
  };

  // 센서 설정 (드래그 활성화 조건)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동해야 드래그 시작
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleCheckboxChange = (field: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));

    // 미리보기 모드가 아닐 때만 체크 해제 시 폼 데이터 제거
    // 미리보기 모드에서는 데이터를 유지하여 비교 가능하도록 함
    if (!isPreviewMode && selectedFields[field]) {
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[field];
        return newData;
      });
    }
  };

  const handleInputChange = React.useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSaveResume = () => {
    if (!resumeTitle.trim()) return;

    // 시작 일자 검증
    // 1. Experience 검증
    const experienceKeys = Object.keys(formData).filter((key) =>
      key.startsWith("Experience_")
    );
    const experienceItemIds = [
      ...new Set(
        experienceKeys.map((key) => {
          const parts = key.split("_");
          return parts[0] + "_" + parts[1]; // "Experience_xxx"
        })
      ),
    ];
    // 경력 항목의 시작일은 필수가 아님 (schema.ts에서 nullable)
    // 회사명만 필수로 검증
    for (const itemId of experienceItemIds) {
      const company = formData[`${itemId}_회사명`];
      if (!company || company.trim() === "") {
        showToast("경력 항목의 회사명을 입력해주세요.", "error");
        return;
      }
    }

    // 2. Side Project 검증
    const sideProjectKeys = Object.keys(formData).filter((key) =>
      key.startsWith("Side Project_")
    );
    const sideProjectItemIds = [
      ...new Set(
        sideProjectKeys.map((key) => {
          const match = key.match(/^(Side Project_[^_]+)/);
          return match ? match[1] : null;
        })
      ),
    ].filter((id) => id !== null) as string[];
    for (const itemId of sideProjectItemIds) {
      const projectName = formData[`${itemId}_프로젝트명`];
      const startDate = formData[`${itemId}_시작일`];

      // 프로젝트명이 있으면 시작일은 필수
      if (projectName && !startDate) {
        showToast("사이드 프로젝트 항목의 시작일을 입력해주세요.", "error");
        return;
      }
    }

    // 3. Education 검증
    const educationKeys = Object.keys(formData).filter((key) =>
      key.startsWith("Education_")
    );
    const educationItemIds = [
      ...new Set(
        educationKeys.map((key) => {
          const parts = key.split("_");
          return parts[0] + "_" + parts[1]; // "Education_xxx"
        })
      ),
    ];
    for (const itemId of educationItemIds) {
      const institution = formData[`${itemId}_기관명`];
      const startDate = formData[`${itemId}_시작일`];

      // 기관명이 있으면 시작일은 필수
      if (institution && !startDate) {
        showToast("교육 항목의 시작일을 입력해주세요.", "error");
        return;
      }
    }

    // formData에 title 추가하고 제출
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("intent", "save-resume");
    formDataToSubmit.append("title", resumeTitle.trim());

    // dynamicItems의 순서 정보를 formData에 추가 (드래그 순서 보존)
    Object.entries(dynamicItems).forEach(([category, items]) => {
      formDataToSubmit.append(`_order_${category}`, JSON.stringify(items));
    });

    // 기존 formData의 모든 필드를 추가
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSubmit.append(key, value);
    });

    // 수정 모드인 경우 resumeId를 URL에 포함
    const url = isEditMode
      ? `/add-resume?resumeId=${loaderData?.resume?.id}`
      : "/add-resume";

    fetcher.submit(formDataToSubmit, {
      method: "POST",
      action: url,
    });
    setShowTitleDialog(false);
    setResumeTitle("");
  };

  // 파일 선택 핸들러 (미리보기만)
  const handleFileChange = async (field: string, file: File | null) => {
    if (!file) {
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[field];
        delete newData[`${field}_file`]; // 원본 파일 정보도 삭제
        return newData;
      });
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // 이미지 압축 옵션
      const options = {
        maxSizeMB: 2, // 최대 2MB
        maxWidthOrHeight: 1920, // 최대 너비/높이
        useWebWorker: true,
        fileType: file.type,
      };

      // 이미지 압축
      const compressedFile = await imageCompression(file, options);

      // 압축된 파일을 base64로 변환하여 미리보기용으로 저장
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          [field]: base64String, // 미리보기용 base64
          [`${field}_file`]: JSON.stringify({
            name: compressedFile.name,
            type: compressedFile.type,
            size: compressedFile.size,
          }), // 파일 메타데이터 저장
        }));
        setIsUploadingPhoto(false);
      };
      reader.onerror = () => {
        alert("이미지 읽기에 실패했습니다.");
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
      setIsUploadingPhoto(false);
    }
  };

  const renderFormField = (
    field: string,
    category?: string,
    index?: number
  ) => {
    if (!selectedFields[field]) return null;

    // 동적 항목인지 확인 (Experience_xxx, Side Project_xxx 형식)
    const isDynamicExperience = field.startsWith("Experience_");
    const isDynamicSideProject = field.startsWith("Side Project_");
    const isDynamicEducation = field.startsWith("Education_");
    const isDynamicCertification = field.startsWith("자격증_");
    const isDynamicLanguageTest = field.startsWith("어학성적_");
    const isDynamicEtc = field.startsWith("그 외 활동_");

    // 상위 카테고리 체크 여부 확인 - 상위가 체크 해제되면 하위 항목도 숨김
    if (isDynamicExperience && !selectedFields["Experience"]) return null;
    if (isDynamicSideProject && !selectedFields["Side Project"]) return null;
    if (isDynamicEducation && !selectedFields["Education"]) return null;
    if (isDynamicCertification && !selectedFields["자격증"]) return null;
    if (isDynamicLanguageTest && !selectedFields["어학성적"]) return null;
    if (isDynamicEtc && !selectedFields["그 외 활동"]) return null;

    // Experience 경력 필드인지 확인 (구버전 호환)
    const isExperienceField = field.startsWith("경력");
    // Side Project 필드인지 확인 (구버전 호환)
    const isSideProjectField = field.startsWith("사이드프로젝트");

    if (isDynamicExperience || isExperienceField) {
      // Experience는 renderFormField를 거치지 않고 직접 ExperienceCard를 사용
      // 이 부분은 실제로 호출되지 않아야 함 (직접 렌더링으로 대체됨)
      return null;
    }

    if (isDynamicSideProject || isSideProjectField) {
      // Side Project는 renderFormField를 거치지 않고 직접 SideProjectCard를 사용
      return null;
    }

    if (isDynamicEducation) {
      // Education는 renderFormField를 거치지 않고 직접 EducationCard를 사용
      return null;
    }

    if (isDynamicEtc) {
      // etc는 renderFormField를 거치지 않고 직접 EtcCard를 사용
      return null;
    }

    if (isDynamicLanguageTest) {
      // 어학성적는 renderFormField를 거치지 않고 직접 LanguageTestCard를 사용
      return null;
    }

    if (isDynamicCertification) {
      // 자격증는 renderFormField를 거치지 않고 직접 CertificationCard를 사용
      return null;
    }

    return (
      <div key={field} className="mb-6">
        <label
          htmlFor={field}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {field}
        </label>
        {field === "사진" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                id={field}
                name={field}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(field, e.target.files?.[0] || null)
                }
                disabled={isUploadingPhoto}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {isUploadingPhoto && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>처리 중...</span>
                </div>
              )}
            </div>
            {formData[field] && (
              <div className="mt-4">
                <img
                  src={formData[field]}
                  alt="프로필 사진 미리보기"
                  className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
          </div>
        ) : field === "영어 구사 능력" ? (
          <select
            id={field}
            name={field}
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minWidth: "200px" }}
          >
            <option value="">수준을 선택하세요</option>
            <option value="Native">Native - 모국어와 동일 수준</option>
            <option value="Advanced">Advanced - 유창한 의사소통 가능</option>
            <option value="Intermediate">Intermediate - 일상 대화 가능</option>
            <option value="Basic">Basic - 기본 의사 소통</option>
          </select>
        ) : field === "Introduce" ? (
          <textarea
            id={field}
            name={field}
            rows={6}
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={`${field}을(를) 입력하세요`}
          />
        ) : (
          <Input
            id={field}
            name={field}
            type={
              field === "이메일"
                ? "email"
                : field === "전화번호"
                  ? "tel"
                  : "text"
            }
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={`${field}을(를) 입력하세요`}
          />
        )}
      </div>
    );
  };

  const renderPreview = () => {
    // URL에 프로토콜이 없으면 자동으로 https:// 추가
    const normalizeUrl = (url: string | undefined): string => {
      if (!url || url === "#") return "#";
      // 이미 프로토콜이 있으면 그대로 반환
      if (/^https?:\/\//i.test(url)) return url;
      // 프로토콜이 없으면 https:// 추가
      return `https://${url}`;
    };

    // 필드별 placeholder 텍스트 정의
    const getPlaceholder = (field: string): string => {
      const placeholders: Record<string, string> = {
        사진: "사진",
        이름: "이름",
        Role: "Role을 입력하세요",
        이메일: "이메일을 입력하세요",
        전화번호: "전화번호를 입력하세요",
        주소: "주소를 입력하세요",
        "영어 구사 능력": "수준을 선택하세요",
        블로그: "블로그를 입력하세요",
        Introduce: "자기소개를 입력하세요",
        회사명: "회사명을 입력하세요",
        프로젝트명: "프로젝트명을 입력하세요",
        기관명: "기관명을 입력하세요",
        활동명: "활동명을 입력하세요",
        전공: "전공을 입력하세요",
        기술스택: "기술 스택을 입력하세요",
        스킬: "기술 스택을 입력하세요",
        작업내용: "주요 작업 내용을 입력하세요",
        주요작업: "주요 작업 내용을 입력하세요",
        내용: "내용을 입력하세요",
        링크: "링크를 입력하세요",
        시작일: "시작일을 입력하세요",
        종료일: "종료일을 입력하세요",
        자격증명: "자격증명을 입력하세요",
        발급기관: "발급기관을 입력하세요",
        취득일: "취득일을 입력하세요",
        시험명: "시험명을 입력하세요",
        점수: "점수를 입력하세요",
        응시일자: "응시 일자를 입력하세요",
      };
      return placeholders[field] || `${field}을(를) 입력하세요`;
    };

    // 값이 없으면 빈 문자열 반환, 있으면 값 반환 (미리보기에서는 placeholder 표시 안 함)
    const getDisplayValue = (
      field: string,
      value: string | undefined
    ): string => {
      return value || "";
    };

    // 아이콘으로 표시할 소셜 미디어 목록 (선택된 것만)
    const socialLinks = [
      {
        key: "LinkedIn",
        icon: Linkedin,
        url: formData["LinkedIn"],
        selected: selectedFields["LinkedIn"],
      },
      {
        key: "Instagram",
        icon: Instagram,
        url: formData["Instagram"],
        selected: selectedFields["Instagram"],
      },
      {
        key: "Facebook",
        icon: Facebook,
        url: formData["Facebook"],
        selected: selectedFields["Facebook"],
      },
      {
        key: "Github",
        icon: Github,
        url: formData["Github"],
        selected: selectedFields["Github"],
      },
      {
        key: "Youtube",
        icon: Youtube,
        url: formData["Youtube"],
        selected: selectedFields["Youtube"],
      },
      {
        key: "X",
        icon: X,
        url: formData["X"],
        selected: selectedFields["X"],
      },
    ].filter((item) => item.selected);

    // 연락처 정보 (Email, Web, Phone) - 선택된 것만
    const contactInfo = [
      {
        key: "이메일",
        label: "Email",
        value: formData["이메일"],
        isLink: true,
        href: formData["이메일"] ? `mailto:${formData["이메일"]}` : "#",
        selected: selectedFields["이메일"],
      },
      {
        key: "블로그",
        label: "Blog",
        value: formData["블로그"],
        isLink: true,
        href: normalizeUrl(formData["블로그"]),
        selected: selectedFields["블로그"],
      },
      {
        key: "전화번호",
        label: "Phone",
        value: formData["전화번호"],
        isLink: false,
        selected: selectedFields["전화번호"],
      },
      {
        key: "주소",
        label: "Address",
        value: formData["주소"],
        isLink: false,
        selected: selectedFields["주소"],
      },
    ].filter((item) => item.selected);

    return (
      <div className="max-w-3xl mx-auto text-gray-900 dark:text-gray-100 px-4 sm:px-6">
        {/* 헤더: 사진, 이름/Role과 소셜 아이콘 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6 sm:mb-8">
          <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* 사진 표시 */}
            {selectedFields["사진"] && (
              <div className="mb-0 sm:mb-6">
                {formData["사진"] ? (
                  <img
                    src={formData["사진"]}
                    alt="프로필 사진"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600 shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-800 shrink-0">
                    <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm italic">
                      사진
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              {selectedFields["이름"] && (
                <h1
                  className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 ${!formData["이름"] ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                >
                  {getDisplayValue("이름", formData["이름"])}
                </h1>
              )}
              {selectedFields["Role"] && (
                <h2
                  className={`text-xl sm:text-2xl font-normal ${!formData["Role"] ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {getDisplayValue("Role", formData["Role"])}
                </h2>
              )}
            </div>
          </div>

          {/* 오른쪽: 소셜 미디어 아이콘들과 연락처 정보 */}
          <div className="flex flex-col items-start sm:items-end gap-4 w-full sm:w-auto">
            {/* 소셜 미디어 아이콘들 */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map(({ key, icon: Icon, url }) => (
                  <a
                    key={key}
                    href={normalizeUrl(url)}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noopener noreferrer" : undefined}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                      url
                        ? "bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600"
                        : "bg-gray-400 dark:bg-gray-500 cursor-not-allowed opacity-50"
                    }`}
                    aria-label={key}
                    onClick={(e) => !url && e.preventDefault()}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}

            {/* 연락처 정보 (Email, Web, Phone) */}
            {contactInfo.length > 0 && (
              <div className="space-y-1 text-xs sm:text-sm text-left sm:text-right w-full sm:w-auto">
                {contactInfo.map(({ key, label, value, isLink, href }) => {
                  const displayValue = getDisplayValue(key, value);
                  const isEmpty = !value;
                  return (
                    <div
                      key={key}
                      className={
                        isEmpty
                          ? "text-gray-400 dark:text-gray-500 italic"
                          : "text-gray-700 dark:text-gray-300"
                      }
                    >
                      <span className="font-medium">{label}:</span>{" "}
                      {isLink && value ? (
                        <a
                          href={href}
                          target={key === "이메일" ? undefined : "_blank"}
                          rel={
                            key === "이메일" ? undefined : "noopener noreferrer"
                          }
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {displayValue}
                        </a>
                      ) : (
                        <span>{displayValue}</span>
                      )}
                    </div>
                  );
                })}
                {/* 영어 구사 능력 */}
                {selectedFields["영어 구사 능력"] && (
                  <div
                    className={
                      !formData["영어 구사 능력"]
                        ? "text-gray-400 dark:text-gray-500 italic"
                        : "text-gray-700 dark:text-gray-300"
                    }
                  >
                    <span className="font-medium">English:</span>{" "}
                    <span>
                      {formData["영어 구사 능력"]
                        ? formData["영어 구사 능력"] === "Native"
                          ? "Native - 모국어와 동일 수준"
                          : formData["영어 구사 능력"] === "Advanced"
                            ? "Advanced - 유창한 의사소통 가능"
                            : formData["영어 구사 능력"] === "Intermediate"
                              ? "Intermediate - 일상 대화 가능"
                              : formData["영어 구사 능력"] === "Basic"
                                ? "Basic - 기본 의사 소통"
                                : formData["영어 구사 능력"]
                        : getPlaceholder("영어 구사 능력")}
                    </span>
                  </div>
                )}
              </div>
            )}
            {contactInfo.length === 0 && selectedFields["영어 구사 능력"] && (
              <div className="space-y-1 text-sm text-right">
                <div
                  className={
                    !formData["영어 구사 능력"]
                      ? "text-gray-400 dark:text-gray-500 italic"
                      : "text-gray-700 dark:text-gray-300"
                  }
                >
                  <span className="font-medium">English:</span>{" "}
                  <span>
                    {formData["영어 구사 능력"]
                      ? formData["영어 구사 능력"] === "Native"
                        ? "Native - 모국어와 동일 수준"
                        : formData["영어 구사 능력"] === "Advanced"
                          ? "Advanced - 유창한 의사소통 가능"
                          : formData["영어 구사 능력"] === "Intermediate"
                            ? "Intermediate - 일상 대화 가능"
                            : formData["영어 구사 능력"] === "Basic"
                              ? "Basic - 기본 의사 소통"
                              : formData["영어 구사 능력"]
                      : getPlaceholder("영어 구사 능력")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Me */}
        {selectedFields["Introduce"] && (
          <section className="mb-6 sm:mb-10">
            <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
            <div
              className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${!formData["Introduce"] ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
            >
              {getDisplayValue("Introduce", formData["Introduce"])}
            </div>
          </section>
        )}

        {/* Experience 섹션 */}
        {(() => {
          const experienceFields = dynamicItems["Experience"].filter(
            (field) => selectedFields[field]
          );

          if (experienceFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                Experience
              </h2>
              {experienceFields.map((field) => {
                const company = formData[`${field}_회사명`];
                const role = formData[`${field}_Role`];
                const startDate = formData[`${field}_시작일`];
                const endDate = formData[`${field}_종료일`];
                const skills = formData[`${field}_스킬`];
                const description = formData[`${field}_작업내용`];

                // 기간 포맷팅 함수
                const formatPeriod = () => {
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return null;
                    const [year, month] = dateStr.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  };
                  const start = formatDate(startDate);
                  const end = endDate ? formatDate(endDate) : null;

                  // 둘 다 없으면 null 반환
                  if (!start && !end) return null;

                  // 둘 다 있으면 포맷팅된 기간 반환
                  if (start && end) {
                    return { start, end, display: `${start} – ${end}` };
                  }

                  // 시작일만 있으면 재직중으로 표시
                  if (start) {
                    return {
                      start,
                      end: "재직중",
                      display: `${start} – 재직중`,
                    };
                  }

                  if (end) {
                    return {
                      start: "",
                      end,
                      display: `${end}`,
                    };
                  }

                  return null;
                };

                const period = formatPeriod();

                return (
                  <div key={field} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-2 ${!company ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("회사명", company)}
                    </h3>
                    {role ? (
                      <div className="mb-2 text-sm sm:text-base">
                        <span
                          className={`font-bold ${!role ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                        >
                          {getDisplayValue("Role", role)}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-2 text-sm sm:text-base">
                        <span className="text-gray-400 dark:text-gray-500 italic font-bold">
                          {getPlaceholder("Role")}
                        </span>
                      </div>
                    )}
                    {period && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    )}
                    {skills && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skills
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter((skill) => skill.length > 0)
                          .map((skill, idx) => {
                            const variants = [
                              "default",
                              "secondary",
                              "outline",
                            ] as const;
                            const variant = variants[idx % variants.length];
                            return (
                              <Badge
                                key={idx}
                                variant={variant}
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            );
                          })}
                      </div>
                    )}
                    <div
                      className={`text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 ${!description ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("작업내용", description)}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* Side Project 섹션 */}
        {(() => {
          const sideProjectFields = dynamicItems["Side Project"].filter(
            (field) => selectedFields[field]
          );

          if (sideProjectFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                Side Project
              </h2>
              {sideProjectFields.map((field) => {
                const projectName = formData[`${field}_프로젝트명`];
                const startDate = formData[`${field}_시작일`];
                const endDate = formData[`${field}_종료일`];
                const link = formData[`${field}_링크`];
                const techStack = formData[`${field}_기술스택`];
                const description = formData[`${field}_주요작업`];

                // 기간 포맷팅 함수
                const formatPeriod = () => {
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return null;
                    const [year, month] = dateStr.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  };
                  const start = formatDate(startDate);
                  const end = endDate ? formatDate(endDate) : null;

                  // 둘 다 없으면 null 반환
                  if (!start && !end) return null;

                  // 둘 다 있으면 포맷팅된 기간 반환
                  if (start && end) {
                    return { start, end, display: `${start} – ${end}` };
                  }

                  // 시작일만 있으면 진행중으로 표시
                  if (start) {
                    return {
                      start,
                      end: "진행중",
                      display: `${start} – 진행중`,
                    };
                  }

                  if (end) {
                    return {
                      start: "",
                      end,
                      display: `${end}`,
                    };
                  }

                  return null;
                };

                const period = formatPeriod();

                return (
                  <div key={field} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-2 ${!projectName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("프로젝트명", projectName)}
                    </h3>
                    {period && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    )}
                    {link && (
                      <div className="mb-2">
                        <a
                          href={normalizeUrl(link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {link}
                        </a>
                      </div>
                    )}
                    {techStack && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {techStack
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter((skill) => skill.length > 0)
                          .map((skill, idx) => {
                            const variants = [
                              "default",
                              "secondary",
                              "outline",
                            ] as const;
                            const variant = variants[idx % variants.length];
                            return (
                              <Badge
                                key={idx}
                                variant={variant}
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            );
                          })}
                      </div>
                    )}
                    <div
                      className={`text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 ${!description ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("주요작업", description)}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* Education 섹션 */}
        {(() => {
          const educationFields = dynamicItems["Education"].filter(
            (field) => selectedFields[field]
          );

          if (educationFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                Education
              </h2>
              {educationFields.map((field) => {
                const institution = formData[`${field}_기관명`];
                const major = formData[`${field}_전공`];
                const startDate = formData[`${field}_시작일`];
                const endDate = formData[`${field}_종료일`];
                const description = formData[`${field}_내용`];

                // 기간 포맷팅 함수
                const formatPeriod = () => {
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return null;
                    const [year, month] = dateStr.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  };
                  const start = formatDate(startDate);
                  const end = endDate ? formatDate(endDate) : null;

                  // 둘 다 없으면 null 반환
                  if (!start && !end) return null;

                  // 둘 다 있으면 포맷팅된 기간 반환
                  if (start && end) {
                    return { start, end, display: `${start} – ${end}` };
                  }

                  // 시작일만 있으면 재학중으로 표시
                  if (start) {
                    return {
                      start,
                      end: "재학중",
                      display: `${start} – 재학중`,
                    };
                  }

                  if (end) {
                    return {
                      start: "",
                      end,
                      display: `${end}`,
                    };
                  }

                  return null;
                };

                const period = formatPeriod();

                return (
                  <div key={field} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-2 ${!institution ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("기관명", institution)}
                    </h3>
                    {major && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mr-2">
                          전공
                        </span>
                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                          {major}
                        </span>
                      </div>
                    )}
                    {period && (
                      <div
                        className={`mb-2 text-sm sm:text-base ${!startDate || !endDate ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {period.display}
                      </div>
                    )}
                    <div
                      className={`text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 ${!description ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("내용", description)}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* 자격증 섹션 */}
        {(() => {
          const certificationFields = dynamicItems["자격증"].filter(
            (field) => selectedFields[field]
          );

          if (certificationFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                자격증
              </h2>
              {certificationFields.map((field) => {
                const certificationName = formData[`${field}_자격증명`];
                const issuer = formData[`${field}_발급기관`];
                const acquisitionDate = formData[`${field}_취득일`];

                // 취득일 포맷팅
                const formatAcquisitionDate = () => {
                  if (!acquisitionDate) return null;
                  const [year, month] = acquisitionDate.split("-");
                  return `${year}년 ${parseInt(month)}월`;
                };

                const acquisitionDateFormatted = formatAcquisitionDate();

                return (
                  <div key={field} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-2 ${!certificationName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("자격증명", certificationName)}
                    </h3>
                    <div
                      className={`mb-2 text-sm sm:text-base ${!issuer ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("발급기관", issuer)}
                    </div>
                    {acquisitionDateFormatted && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {acquisitionDateFormatted}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* 어학 성적 섹션 */}
        {(() => {
          const languageTestFields = dynamicItems["어학성적"].filter(
            (field) => selectedFields[field]
          );

          if (languageTestFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                어학 성적
              </h2>
              {languageTestFields.map((field) => {
                const testName = formData[`${field}_시험명`];
                const score = formData[`${field}_점수`];
                const testDate = formData[`${field}_응시일자`];

                // 응시 일자 포맷팅
                const formatTestDate = () => {
                  if (!testDate) return null;
                  const [year, month] = testDate.split("-");
                  return `${year}년 ${parseInt(month)}월`;
                };

                const testDateFormatted = formatTestDate();

                return (
                  <div key={field} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-2 ${!testName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("시험명", testName)}
                    </h3>
                    <div className="mb-2">
                      <span
                        className={`text-base sm:text-lg ${!score ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {getDisplayValue("점수", score)}
                      </span>
                      {testDateFormatted && (
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 ml-2 sm:ml-4">
                          ({testDateFormatted})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* 그 외 활동 섹션 */}
        {(() => {
          const etcFields = dynamicItems["그 외 활동"].filter(
            (field) => selectedFields[field]
          );

          if (etcFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                그 외 활동
              </h2>
              {etcFields.map((field) => {
                const activityName = formData[`${field}_활동명`];
                const link = formData[`${field}_링크`];
                const content = formData[`${field}_내용`];

                return (
                  <div key={field} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3
                      className={`text-xl sm:text-2xl font-bold mb-2 ${!activityName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {link && activityName ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {getDisplayValue("활동명", activityName)}
                        </a>
                      ) : (
                        getDisplayValue("활동명", activityName)
                      )}
                    </h3>
                    <div
                      className={`text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 ${!content ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("내용", content)}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* 스킬 스택 그래프 섹션 */}
        {selectedFields["스킬 스택 그래프"] &&
          (() => {
            // 스킬 사용 기간 계산 함수
            const calculateSkillDurations = () => {
              const skillMap = new Map<string, number>(); // skillName -> total months

              // Experience 스킬 수집
              dynamicItems.Experience.forEach((itemId) => {
                if (!selectedFields[itemId]) return;

                const skills = formData[`${itemId}_스킬`];
                const startDate = formData[`${itemId}_시작일`];
                const endDate = formData[`${itemId}_종료일`];

                if (!skills || !startDate) return;

                // 기간 계산 (월 단위)
                const start = new Date(startDate + "-01");
                const end = endDate ? new Date(endDate + "-01") : new Date();
                const months = Math.max(
                  0,
                  (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth()) +
                    1
                );

                // 스킬별로 기간 누적
                skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .forEach((skillName) => {
                    const current = skillMap.get(skillName) || 0;
                    skillMap.set(skillName, current + months);
                  });
              });

              // Side Project 스킬 수집
              dynamicItems["Side Project"].forEach((itemId) => {
                if (!selectedFields[itemId]) return;

                const skills = formData[`${itemId}_기술스택`];
                const startDate = formData[`${itemId}_시작일`];
                const endDate = formData[`${itemId}_종료일`];

                if (!skills || !startDate) return;

                // 기간 계산 (월 단위)
                const start = new Date(startDate + "-01");
                const end = endDate ? new Date(endDate + "-01") : new Date();
                const months = Math.max(
                  0,
                  (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth()) +
                    1
                );

                // 스킬별로 기간 누적
                skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                  .forEach((skillName) => {
                    const current = skillMap.get(skillName) || 0;
                    skillMap.set(skillName, current + months);
                  });
              });

              // 상위 5개 추출 및 년/개월 정보 포함
              return Array.from(skillMap.entries())
                .map(([name, months]) => {
                  const years = Math.floor(months / 12);
                  const remainingMonths = months % 12;
                  let displayText = "";
                  if (years === 0) {
                    displayText = `${remainingMonths}개월`;
                  } else if (remainingMonths === 0) {
                    displayText = `${years}년`;
                  } else {
                    displayText = `${years}년 ${remainingMonths}개월`;
                  }
                  return {
                    name,
                    months,
                    years: months / 12, // 차트용 (소수점)
                    displayText,
                  };
                })
                .sort((a, b) => b.months - a.months)
                .slice(0, 6);
            };

            const topSkills = calculateSkillDurations();

            if (topSkills.length === 0) return null;

            return (
              <section className="mb-6 sm:mb-10">
                <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  스킬 스택 그래프
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                  사용 기간이 가장 긴 6개의 스킬만 표시됩니다
                </p>
                <div className="w-full">
                  <SkillStackChart data={topSkills} />
                </div>
              </section>
            );
          })()}

        {/* 다른 섹션들도 여기에 추가 가능 */}
        {Object.entries(resumeCategories)
          .filter(
            ([category]) =>
              category !== "About Me" &&
              category !== "Experience" &&
              category !== "Side Project" &&
              category !== "Education" &&
              category !== "자격증" &&
              category !== "어학성적" &&
              category !== "그 외 활동" &&
              category !== "스킬 스택 그래프"
          )
          .map(([category]) => {
            const categoryFields = resumeCategories[
              category as keyof typeof resumeCategories
            ].filter((field) => selectedFields[field]);

            if (categoryFields.length === 0) return null;

            return (
              <section key={category} className="mb-6 sm:mb-10">
                <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">
                  {category}
                </h2>
                <div className="space-y-2 text-sm sm:text-base">
                  {categoryFields.map((field) => {
                    const value = formData[field];
                    return (
                      <div
                        key={field}
                        className={`leading-relaxed ${!value ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {getDisplayValue(field, value)}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar className="border-r border-sidebar-border bg-white">
            <SidebarContent>
              {Object.entries(resumeCategories).map(([category, items]) => {
                const isDynamicCategory = [
                  "Experience",
                  "Side Project",
                  "Education",
                  "자격증",
                  "어학성적",
                  "그 외 활동",
                ].includes(category);
                const isSkillGraphCategory = category === "스킬 스택 그래프";
                const displayItems = isDynamicCategory
                  ? dynamicItems[category]
                  : items;

                return (
                  <SidebarGroup key={category}>
                    {isSkillGraphCategory ? (
                      // 스킬 스택 그래프 (체크박스만)
                      <div className="px-2">
                        <div className="flex items-center justify-between px-2 py-2">
                          <label
                            htmlFor={`category-${category}`}
                            className="flex-1 cursor-pointer text-xs font-medium"
                            style={{
                              color: "hsl(var(--sidebar-foreground) / 0.7)",
                            }}
                          >
                            {category}
                          </label>
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedFields[category] || false}
                            onCheckedChange={() =>
                              handleCheckboxChange(category)
                            }
                          />
                        </div>
                      </div>
                    ) : isDynamicCategory ? (
                      // 동적 카테고리 (체크박스만)
                      <div className="px-2">
                        <div className="flex items-center justify-between px-2 py-2">
                          <label
                            htmlFor={`category-${category}`}
                            className="flex-1 cursor-pointer text-xs font-medium"
                            style={{
                              color: "hsl(var(--sidebar-foreground) / 0.7)",
                            }}
                          >
                            {category}
                          </label>
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedFields[category] || false}
                            onCheckedChange={() =>
                              handleCheckboxChange(category)
                            }
                          />
                        </div>
                        {selectedFields[category] && (
                          <SidebarGroupContent>
                            <SidebarMenu>
                              {displayItems.map((itemId, index) => (
                                <SidebarMenuItem key={itemId}>
                                  <SidebarMenuButton
                                    className="w-full justify-start"
                                    asChild
                                  >
                                    <div className="flex items-center gap-2 pl-6 pr-2 py-1.5">
                                      <Checkbox
                                        id={`${category}-${itemId}`}
                                        checked={
                                          selectedFields[itemId] || false
                                        }
                                        onCheckedChange={() =>
                                          handleCheckboxChange(itemId)
                                        }
                                      />
                                      <label
                                        htmlFor={`${category}-${itemId}`}
                                        className="flex-1 cursor-pointer text-sm"
                                      >
                                        {category === "Experience"
                                          ? `경력 ${index + 1}`
                                          : category === "Side Project"
                                            ? `프로젝트 ${index + 1}`
                                            : category === "Education"
                                              ? `교육 ${index + 1}`
                                              : category === "자격증"
                                                ? `자격증 ${index + 1}`
                                                : category === "어학성적"
                                                  ? `어학 성적 ${index + 1}`
                                                  : category === "그 외 활동"
                                                    ? `활동 ${index + 1}`
                                                    : `항목 ${index + 1}`}
                                      </label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveDynamicItem(
                                            category,
                                            itemId
                                          );
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  className="w-full justify-start"
                                  asChild
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddDynamicItem(category)
                                    }
                                    className="flex items-center gap-2 pl-6 pr-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span>추가</span>
                                  </button>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </SidebarMenu>
                          </SidebarGroupContent>
                        )}
                      </div>
                    ) : (
                      // About Me 등 일반 카테고리 (Collapsible)
                      <Collapsible
                        open={openCategories[category]}
                        onOpenChange={(open) =>
                          setOpenCategories((prev) => ({
                            ...prev,
                            [category]: open,
                          }))
                        }
                      >
                        <div className="px-2">
                          <CollapsibleTrigger
                            className="group flex w-full items-center justify-between px-2 py-2 rounded-md text-xs font-medium transition-colors hover:bg-accent cursor-pointer"
                            style={{
                              color: "hsl(var(--sidebar-foreground) / 0.7)",
                            }}
                          >
                            <span>{category}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                openCategories[category] ? "rotate-180" : ""
                              }`}
                            />
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              {items.map((item) => (
                                <SidebarMenuItem key={item}>
                                  <SidebarMenuButton
                                    className="w-full justify-start"
                                    asChild
                                  >
                                    <div className="flex items-center gap-2 pl-6 pr-2 py-1.5">
                                      <Checkbox
                                        id={`${category}-${item}`}
                                        checked={selectedFields[item] || false}
                                        onCheckedChange={() =>
                                          handleCheckboxChange(item)
                                        }
                                      />
                                      <label
                                        htmlFor={`${category}-${item}`}
                                        className="flex-1 cursor-pointer text-sm"
                                      >
                                        {item}
                                      </label>
                                    </div>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              ))}
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </SidebarGroup>
                );
              })}
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="flex-1 border-l border-sidebar-border bg-white flex flex-col overflow-hidden">
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isPreviewMode) {
                      setIsPreviewMode(false);
                    } else {
                      navigate("/my-resume");
                    }
                  }}
                  className="group text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 ease-in-out cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                </Button>
                <h1 className="text-xl font-semibold">
                  {isPreviewMode ? "이력서 미리보기" : "이력서 작성"}
                </h1>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white">
              {isPreviewMode ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 min-h-full">
                  {renderPreview()}
                </div>
              ) : (
                <div className="mx-auto max-w-3xl">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>이력서 정보 입력</CardTitle>
                      <CardDescription>
                        왼쪽 사이드바에서 표시할 항목을 선택하고 정보를
                        입력하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <fetcher.Form className="space-y-6" method="POST">
                        <input
                          type="hidden"
                          name="intent"
                          value="save-resume"
                        />
                        {/* About Me 필드들 */}
                        {resumeCategories["About Me"]
                          .filter((field) => selectedFields[field])
                          .map((field) => renderFormField(field))}

                        {/* 동적 카테고리 필드들 */}
                        {Object.entries(dynamicItems).map(
                          ([category, items]) => {
                            const filteredItems = items.filter(
                              (itemId) => selectedFields[itemId]
                            );
                            if (filteredItems.length === 0) return null;

                            const itemIds = filteredItems.map(
                              (itemId) => `${category}_${itemId}`
                            );

                            // 각 카테고리별 독립 컴포넌트 사용
                            if (category === "Experience") {
                              return (
                                <SortableContext
                                  key={category}
                                  items={itemIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {filteredItems.map((itemId, index) => (
                                    <ExperienceCard
                                      key={itemId}
                                      itemId={itemId}
                                      index={index}
                                      category={category}
                                      formData={formData}
                                      onInputChange={handleInputChange}
                                      onRemove={() =>
                                        handleRemoveDynamicItem(
                                          category,
                                          itemId
                                        )
                                      }
                                    />
                                  ))}
                                </SortableContext>
                              );
                            }

                            if (category === "Side Project") {
                              return (
                                <SortableContext
                                  key={category}
                                  items={itemIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {filteredItems.map((itemId, index) => (
                                    <SideProjectCard
                                      key={itemId}
                                      itemId={itemId}
                                      index={index}
                                      category={category}
                                      formData={formData}
                                      onInputChange={handleInputChange}
                                      onRemove={() =>
                                        handleRemoveDynamicItem(
                                          category,
                                          itemId
                                        )
                                      }
                                    />
                                  ))}
                                </SortableContext>
                              );
                            }

                            if (category === "Education") {
                              return (
                                <SortableContext
                                  key={category}
                                  items={itemIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {filteredItems.map((itemId, index) => (
                                    <EducationCard
                                      key={itemId}
                                      itemId={itemId}
                                      index={index}
                                      category={category}
                                      formData={formData}
                                      onInputChange={handleInputChange}
                                      onRemove={() =>
                                        handleRemoveDynamicItem(
                                          category,
                                          itemId
                                        )
                                      }
                                    />
                                  ))}
                                </SortableContext>
                              );
                            }

                            if (category === "자격증") {
                              return (
                                <SortableContext
                                  key={category}
                                  items={itemIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {filteredItems.map((itemId, index) => (
                                    <CertificationCard
                                      key={itemId}
                                      itemId={itemId}
                                      index={index}
                                      category={category}
                                      formData={formData}
                                      onInputChange={handleInputChange}
                                      onRemove={() =>
                                        handleRemoveDynamicItem(
                                          category,
                                          itemId
                                        )
                                      }
                                    />
                                  ))}
                                </SortableContext>
                              );
                            }

                            if (category === "어학성적") {
                              return (
                                <SortableContext
                                  key={category}
                                  items={itemIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {filteredItems.map((itemId, index) => (
                                    <LanguageTestCard
                                      key={itemId}
                                      itemId={itemId}
                                      index={index}
                                      category={category}
                                      formData={formData}
                                      onInputChange={handleInputChange}
                                      onRemove={() =>
                                        handleRemoveDynamicItem(
                                          category,
                                          itemId
                                        )
                                      }
                                    />
                                  ))}
                                </SortableContext>
                              );
                            }

                            if (category === "그 외 활동") {
                              return (
                                <SortableContext
                                  key={category}
                                  items={itemIds}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {filteredItems.map((itemId, index) => (
                                    <EtcCard
                                      key={itemId}
                                      itemId={itemId}
                                      index={index}
                                      category={category}
                                      formData={formData}
                                      onInputChange={handleInputChange}
                                      onRemove={() =>
                                        handleRemoveDynamicItem(
                                          category,
                                          itemId
                                        )
                                      }
                                    />
                                  ))}
                                </SortableContext>
                              );
                            }

                            // 기존 방식 유지 (혹시 모를 다른 카테고리)
                            return (
                              <SortableContext
                                key={category}
                                items={itemIds}
                                strategy={verticalListSortingStrategy}
                              >
                                {filteredItems.map((itemId, index) =>
                                  renderFormField(itemId, category, index)
                                )}
                              </SortableContext>
                            );
                          }
                        )}

                        {Object.values(resumeCategories)
                          .flat()
                          .filter((field) => selectedFields[field]).length ===
                          0 && (
                          <div className="py-12 text-center text-muted-foreground">
                            <p className="text-lg mb-2">항목을 선택해주세요</p>
                            <p className="text-sm">
                              왼쪽 사이드바에서 표시할 항목을 체크박스로
                              선택하세요
                            </p>
                          </div>
                        )}

                        {Object.values(resumeCategories)
                          .flat()
                          .filter((field) => selectedFields[field]).length >
                          0 && (
                          <div className="flex gap-4 pt-4">
                            <Button
                              type="button"
                              className="flex-1 cursor-pointer border"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowTitleDialog(true);
                              }}
                              disabled={fetcher.state === "submitting"}
                            >
                              {fetcher.state === "submitting" ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  저장 중...
                                </>
                              ) : (
                                "저장하기"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsPreviewMode(true);
                              }}
                            >
                              미리보기
                            </Button>
                          </div>
                        )}
                      </fetcher.Form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* 제목 입력 다이얼로그 */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent>
          <DialogClose onClose={() => setShowTitleDialog(false)} />
          <DialogHeader>
            <DialogTitle>이력서 제목 입력</DialogTitle>
            <DialogDescription>
              이력서를 구분할 수 있는 제목을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="예: 프론트엔드 개발자 이력서"
              className="w-full cursor-pointer"
              onKeyDown={(e) => {
                if (e.key === "Enter" && resumeTitle.trim()) {
                  handleSaveResume();
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTitleDialog(false);
                  setResumeTitle(initialData.resumeTitle);
                }}
                className="cursor-pointer"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveResume}
                disabled={!resumeTitle.trim() || fetcher.state === "submitting"}
                className="cursor-pointer border"
              >
                {fetcher.state === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장하기"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </DndContext>
  );
}
