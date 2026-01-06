import * as React from "react";
import type { Route } from "./+types/resume-detail";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Github,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  Edit,
  Share2,
  Printer,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { getResumeById } from "../queries";
import { createSupabaseServerClient } from "~/supabase/server";
import { cn } from "~/lib/utils";

export function meta({ data }: Route.MetaArgs) {
  if (!data || !data.resume) {
    return [{ title: "이력서 상세 - Beacon Port" }];
  }
  const resumeName = data?.resume?.name || "이력서";
  return [
    { title: `${resumeName} 이력서 상세 - Beacon Port` },
    {
      name: "description",
      content: "이력서를 확인하세요",
    },
  ];
}

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const resumeId = params.id;
  if (!resumeId) {
    throw new Response("Resume ID is required", { status: 400 });
  }
  const supabase = createSupabaseServerClient(request);
  const data = await getResumeById(supabase, resumeId);
  console.log("resume-detail loader data :>> ", data);
  return data;
};

// 필드별 placeholder 텍스트 정의
const getPlaceholder = (field: string): string => {
  const placeholders: Record<string, string> = {
    사진: "사진",
    이름: "이름",
    Role: "Role을 입력하세요",
    이메일: "이메일을 입력하세요",
    전화번호: "전화번호를 입력하세요",
    "영어 구사 능력": "수준을 선택하세요",
    웹사이트: "웹사이트를 입력하세요",
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

// 값이 없으면 placeholder 반환, 있으면 값 반환
const getDisplayValue = (
  field: string,
  value: string | null | undefined
): string => {
  return value || getPlaceholder(field);
};

// 날짜 포맷팅 함수
const formatDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}년 ${month}월`;
  } catch {
    return null;
  }
};

// 기간 포맷팅 함수
const formatPeriod = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start && !end) return null;

  if (start && end) {
    return { start, end, display: `${start} – ${end}` };
  }

  if (start) {
    return {
      start,
      end: getPlaceholder("종료일"),
      display: `${start} – ${getPlaceholder("종료일")}`,
    };
  }

  if (end) {
    return {
      start: getPlaceholder("시작일"),
      end,
      display: `${getPlaceholder("시작일")} – ${end}`,
    };
  }

  return null;
};

export default function ResumeDetail({ loaderData }: Route.ComponentProps) {
  if (!loaderData) return null;
  const {
    resume,
    experiences,
    sideProjects,
    educations,
    certifications,
    languageTests,
    etcs,
  } = loaderData;
  const navigate = useNavigate();
  const params = useParams();
  const resumeId = params.id;
  const resumeContentRef = React.useRef<HTMLDivElement>(null);
  const [isPublic, setIsPublic] = React.useState(false);
  //   const [isUpdating, setIsUpdating] = React.useState(false);

  //   React.useEffect(() => {
  //     if (resume) {
  //       setIsPublic(!!resume.is_public);
  //     }
  //   }, [resume]);

  // URL 복사 함수
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("URL이 클립보드에 복사되었습니다!");
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        alert("URL이 클립보드에 복사되었습니다!");
      } catch (err) {
        console.error("Failed to copy URL", err);
        alert("URL 복사에 실패했습니다.");
      }
      document.body.removeChild(textArea);
    }
  };

  // 인쇄 및 PDF 저장 함수
  const handlePrint = () => {
    window.print();
  };

  // 수정 버튼 클릭 핸들러
  const handleEdit = () => {
    navigate(`/add-resume?resumeId=${resumeId}`);
  };

  // 공개/비공개 상태 변경 핸들러
  //   const handlePublicToggle = async (checked: boolean) => {
  //     if (!resumeId) return;

  //     setIsUpdating(true);
  //     try {
  //       await updateResumePublicStatus(resumeId, checked);
  //       setIsPublic(checked);
  //     } catch (error) {
  //       console.error("Failed to update public status:", error);
  //       alert("공개 상태 변경에 실패했습니다.");
  //       // 상태 롤백
  //       setIsPublic(!checked);
  //     } finally {
  //       setIsUpdating(false);
  //     }
  //   };

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">이력서를 찾을 수 없습니다</p>
          <Button onClick={() => navigate("/my-resume")}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 소셜 미디어 링크
  const socialLinks = [
    {
      key: "LinkedIn",
      icon: Linkedin,
      url: resume.linkedin,
    },
    {
      key: "Instagram",
      icon: Instagram,
      url: resume.instagram,
    },
    {
      key: "Facebook",
      icon: Facebook,
      url: resume.facebook,
    },
    {
      key: "Github",
      icon: Github,
      url: resume.github,
    },
    {
      key: "Youtube",
      icon: Youtube,
      url: resume.youtube,
    },
  ].filter((item) => item.url);

  // 연락처 정보
  const contactInfo = [
    {
      key: "이메일",
      label: "Email",
      value: resume.email,
      isLink: true,
      href: resume.email ? `mailto:${resume.email}` : "#",
    },
    {
      key: "웹사이트",
      label: "Web",
      value: resume.website,
      isLink: true,
      href: resume.website || "#",
    },
    {
      key: "전화번호",
      label: "Phone",
      value: resume.phone,
      isLink: false,
    },
  ].filter((item) => item.value);

  // 영어 구사 능력 텍스트 변환
  const getEnglishLevelText = (level: string | null | undefined): string => {
    if (!level) return getPlaceholder("영어 구사 능력");
    switch (level) {
      case "Native":
        return "Native - 모국어와 동일 수준";
      case "Advanced":
        return "Advanced - 유창한 의사소통 가능";
      case "Intermediate":
        return "Intermediate - 일상 대화 가능";
      case "Basic":
        return "Basic - 기본 의사 소통";
      default:
        return level;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900 no-print">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/my-resume")}
              className="group text-white hover:text-white/90 hover:bg-gray-800/50 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
              목록으로
            </Button>
            <h1 className="text-2xl font-bold text-white">{resume.title}</h1>
            <div className="flex items-center gap-3">
              {/* 공개/비공개 스위치 */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-600 bg-gray-800/50">
                <span className="text-sm text-white/80">비공개</span>
                <button
                  type="button"
                  role="switch"
                  //   aria-checked={isPublic}
                  //   disabled={isUpdating}
                  //   onClick={() => handlePublicToggle(!isPublic)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
                    isPublic ? "bg-green-600" : "bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      isPublic ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span className="text-sm text-white/80">공개</span>
              </div>

              <Button
                variant="outline"
                onClick={handleEdit}
                className="group text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                수정
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="group text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Share2 className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                공유
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="group text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                출력
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div
          ref={resumeContentRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 max-w-3xl mx-auto print:shadow-none print:p-8"
        >
          {/* 헤더: 이름/Role과 소셜 아이콘 */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <h1
                className={`text-5xl font-bold mb-3 ${!resume.name ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
              >
                {getDisplayValue("이름", resume.name)}
              </h1>
            </div>

            {/* 오른쪽: 소셜 미디어 아이콘들과 연락처 정보 */}
            <div className="flex flex-col items-end gap-4">
              {/* 소셜 미디어 아이콘들 */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  {socialLinks.map(({ key, icon: Icon, url }) => (
                    <a
                      key={key}
                      href={url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600"
                      aria-label={key}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              )}

              {/* 연락처 정보 */}
              {contactInfo.length > 0 && (
                <div className="space-y-1 text-sm text-right">
                  {contactInfo.map(({ key, label, value, isLink, href }) => {
                    const displayValue = getDisplayValue(key, value);
                    return (
                      <div
                        key={key}
                        className="text-gray-700 dark:text-gray-300"
                      >
                        <span className="font-medium">{label}:</span>{" "}
                        {isLink && value ? (
                          <a
                            href={href}
                            target={key === "이메일" ? undefined : "_blank"}
                            rel={
                              key === "이메일"
                                ? undefined
                                : "noopener noreferrer"
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
                  {resume.english_level && (
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">English:</span>{" "}
                      <span>{getEnglishLevelText(resume.english_level)}</span>
                    </div>
                  )}
                </div>
              )}
              {contactInfo.length === 0 && resume.english_level && (
                <div className="space-y-1 text-sm text-right">
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">English:</span>{" "}
                    <span>{getEnglishLevelText(resume.english_level)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Introduce */}
          {resume.introduce && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-6" />
              <div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
                {resume.introduce}
              </div>
            </section>
          )}

          {/* Experience 섹션 */}
          {experiences.length > 0 && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Experience
              </h2>
              {experiences.map((exp: any) => {
                const period = formatPeriod(exp.start_date, exp.end_date);

                return (
                  <div key={exp.id} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("회사명", exp.company)}
                    </h3>
                    <div className="mb-2">
                      {exp.role && (
                        <>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {getDisplayValue("Role", exp.role)}
                          </span>
                          {period && <span className="mx-2">•</span>}
                        </>
                      )}
                      {period ? (
                        <span className="text-gray-700 dark:text-gray-300">
                          {period.display}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          {getPlaceholder("시작일")} –{" "}
                          {getPlaceholder("종료일")}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <div className="text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
                        {exp.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Side Project 섹션 */}
          {sideProjects.length > 0 && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Side Project
              </h2>
              {sideProjects.map((project: any) => {
                const period = formatPeriod(
                  project.start_date,
                  project.end_date
                );

                return (
                  <div key={project.id} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("프로젝트명", project.name)}
                    </h3>
                    {period ? (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    ) : (
                      <div className="mb-2 text-gray-400 dark:text-gray-500 italic">
                        {getPlaceholder("시작일")} – {getPlaceholder("종료일")}
                      </div>
                    )}
                    {project.description && (
                      <div className="text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
                        {project.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Education 섹션 */}
          {educations.length > 0 && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Education
              </h2>
              {educations.map((edu: any) => {
                const period = formatPeriod(edu.start_date, edu.end_date);

                return (
                  <div key={edu.id} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("기관명", edu.institution)}
                    </h3>
                    {edu.major && (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {getDisplayValue("전공", edu.major)}
                      </div>
                    )}
                    {period ? (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    ) : (
                      <div className="mb-2 text-gray-400 dark:text-gray-500 italic">
                        {getPlaceholder("시작일")} – {getPlaceholder("종료일")}
                      </div>
                    )}
                    {edu.description && (
                      <div className="text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
                        {edu.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* 자격증 섹션 */}
          {certifications.length > 0 && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                자격증
              </h2>
              {certifications.map((cert: any) => {
                const acquisitionDate = formatDate(cert.acquisition_date);

                return (
                  <div key={cert.id} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("자격증명", cert.name)}
                    </h3>
                    <div className="mb-2 text-gray-700 dark:text-gray-300">
                      {getDisplayValue("발급기관", cert.issuer)}
                    </div>
                    {acquisitionDate && (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {acquisitionDate}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* 어학 성적 섹션 */}
          {languageTests.length > 0 && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                어학 성적
              </h2>
              {languageTests.map((test: any) => {
                const testDate = formatDate(test.test_date);

                return (
                  <div key={test.id} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("시험명", test.name)}
                    </h3>
                    <div className="mb-2">
                      <span className="text-lg text-gray-700 dark:text-gray-300">
                        {getDisplayValue("점수", test.score)}
                      </span>
                      {testDate && (
                        <span className="text-gray-700 dark:text-gray-300 ml-4">
                          ({testDate})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* etc 섹션 */}
          {etcs.length > 0 && (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                etc
              </h2>
              {etcs.map((etc: any) => (
                <div key={etc.id} className="mb-10">
                  <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    {etc.link && etc.name ? (
                      <a
                        href={etc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {getDisplayValue("활동명", etc.name)}
                      </a>
                    ) : (
                      getDisplayValue("활동명", etc.name)
                    )}
                  </h3>
                  {etc.description && (
                    <div className="text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
                      {etc.description}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
