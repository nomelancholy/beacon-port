import * as React from "react";
import type { Route } from "./+types/resume-detail";
import { Link, useNavigate, useParams, useFetcher } from "react-router";
import {
  ArrowLeft,
  Github,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  X,
  Edit,
  Share2,
  Printer,
  Trash2,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../../components/ui/dialog";
import { getResumeById } from "../queries";
import { createSupabaseServerClient } from "~/supabase/server";
import { cn } from "~/lib/utils";
import { useToast, Toast } from "../../../components/ui/toast";
import { Loader2 } from "lucide-react";
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

  // 먼저 이력서의 공개 상태 확인
  const { data: resumeInfo, error: resumeInfoError } = await supabase
    .from("resumes")
    .select("is_public, user_id")
    .eq("id", resumeId)
    .single();

  if (resumeInfoError || !resumeInfo) {
    throw new Response("이력서를 찾을 수 없습니다", { status: 404 });
  }

  // 비공개 이력서인 경우
  if (!resumeInfo.is_public) {
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || resumeInfo.user_id !== user.id) {
      // 에러를 던지지 않고 특별한 플래그 반환
      return {
        isPrivateResume: true,
        message:
          "이력서가 비공개 상태입니다. 이력서 주인에게 공개 전환을 요청하세요.",
        resume: null,
        experiences: [],
        sideProjects: [],
        educations: [],
        certifications: [],
        languageTests: [],
        etcs: [],
      };
    }
  }

  // 공개 이력서이거나 소유자인 경우 데이터 조회
  const data = await getResumeById(supabase, resumeId);
  console.log("resume-detail loader data :>> ", data);

  // 현재 사용자 정보 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 이력서 소유자인지 확인
  const isOwner = user?.id === resumeInfo.user_id;

  return {
    ...data,
    isOwner,
  };
};

export const action = async ({ params, request }: Route.ActionArgs) => {
  if (request.method === "POST") {
    const headers = new Headers();
    const supabase = createSupabaseServerClient(request, headers);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const resumeId = params.id;
    if (!resumeId) {
      return {
        success: false,
        error: "이력서 ID가 필요합니다.",
      };
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "toggle-public") {
      const isPublic = formData.get("isPublic") === "true";

      // 이력서 소유자 확인
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("user_id")
        .eq("id", resumeId)
        .single();

      if (resumeError || !resume) {
        return {
          success: false,
          error: "이력서를 찾을 수 없습니다.",
        };
      }

      if (resume.user_id !== user.id) {
        return {
          success: false,
          error: "이력서를 수정할 권한이 없습니다.",
        };
      }

      // 공개 상태 업데이트
      const { error: updateError } = await supabase
        .from("resumes")
        .update({ is_public: isPublic })
        .eq("id", resumeId);

      if (updateError) {
        console.error("Update public status error:", updateError);
        return {
          success: false,
          error: "공개 상태 변경에 실패했습니다.",
        };
      }

      return {
        success: true,
        isPublic,
      };
    }

    if (intent === "delete") {
      // 이력서 소유자 확인
      const { data: resume, error: resumeError } = await supabase
        .from("resumes")
        .select("user_id")
        .eq("id", resumeId)
        .single();

      if (resumeError || !resume) {
        return {
          success: false,
          error: "이력서를 찾을 수 없습니다.",
        };
      }

      if (resume.user_id !== user.id) {
        return {
          success: false,
          error: "이력서를 삭제할 권한이 없습니다.",
        };
      }

      // 이력서 삭제 (CASCADE로 관련 데이터도 자동 삭제됨)
      const { error: deleteError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", resumeId);

      if (deleteError) {
        console.error("Delete resume error:", deleteError);
        return {
          success: false,
          error: "이력서 삭제에 실패했습니다.",
        };
      }

      return {
        success: true,
        deleted: true,
      };
    }
  }

  return { success: false };
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

// 값이 없으면 빈 문자열 반환, 있으면 값 반환 (상세 페이지에서는 placeholder 표시 안 함)
const getDisplayValue = (
  field: string,
  value: string | null | undefined
): string => {
  return value || "";
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
  endDate: string | null | undefined,
  statusText: string = "진행중"
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
      end: statusText,
      display: `${start} – ${statusText}`,
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
    const barHeight = 28; // 각 막대 높이
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

export default function ResumeDetail({ loaderData }: Route.ComponentProps) {
  if (!loaderData) return null;

  // 비공개 이력서인 경우 에러 메시지 표시
  if ("isPrivateResume" in loaderData && loaderData.isPrivateResume) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            접근 권한이 없습니다
          </h1>
          <p className="text-gray-400 mb-6">
            {("message" in loaderData ? loaderData.message : null) ||
              "이력서가 비공개 상태입니다. 이력서 주인에게 공개 전환을 요청하세요."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              asChild
              variant="outline"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                홈으로
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              새로고침
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    resume,
    experiences,
    sideProjects,
    educations,
    certifications,
    languageTests,
    etcs,
  } = loaderData;

  // isOwner는 loaderData에 있을 수도 있고 없을 수도 있음
  const isOwner = "isOwner" in loaderData ? loaderData.isOwner : false;
  const navigate = useNavigate();
  const params = useParams();
  const resumeId = params.id;
  const resumeContentRef = React.useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();
  const { toast, showToast, hideToast } = useToast();
  const [isPublic, setIsPublic] = React.useState(!!resume?.is_public);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // 초기 상태 설정
  React.useEffect(() => {
    if (resume) {
      setIsPublic(!!resume.is_public);
    }
  }, [resume]);

  // fetcher 결과 처리
  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        if (fetcher.data.deleted) {
          // 삭제 성공 시 목록 페이지로 리다이렉트
          showToast("이력서가 삭제되었습니다.", "success");
          navigate("/my-resume");
          return;
        }
        setIsPublic(fetcher.data.isPublic);
        showToast(
          fetcher.data.isPublic
            ? "이력서가 공개되었습니다."
            : "이력서가 비공개로 설정되었습니다.",
          "success"
        );
      } else if (fetcher.data.error) {
        showToast(fetcher.data.error, "error");
        // 에러 발생 시 상태 롤백
        setIsPublic(!!resume?.is_public);
      }
    }
  }, [fetcher.data, showToast, resume, navigate]);

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
  const handlePublicToggle = (checked: boolean) => {
    if (!resumeId) return;

    const formData = new FormData();
    formData.append("intent", "toggle-public");
    formData.append("isPublic", checked.toString());

    // 낙관적 업데이트
    setIsPublic(checked);

    fetcher.submit(formData, { method: "POST" });
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (!resumeId) return;

    const formData = new FormData();
    formData.append("intent", "delete");

    fetcher.submit(formData, { method: "POST" });
    setShowDeleteDialog(false);
  };

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

  // URL에 프로토콜이 없으면 자동으로 https:// 추가
  const normalizeUrl = (url: string | null | undefined): string => {
    if (!url || url === "#") return "#";
    // 이미 프로토콜이 있으면 그대로 반환
    if (/^https?:\/\//i.test(url)) return url;
    // 프로토콜이 없으면 https:// 추가
    return `https://${url}`;
  };

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
    {
      key: "X",
      icon: X,
      url: resume.x,
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
      key: "블로그",
      label: "Blog",
      value: resume.blog,
      isLink: true,
      href: normalizeUrl(resume.blog),
    },
    {
      key: "전화번호",
      label: "Phone",
      value: resume.phone,
      isLink: false,
    },
    {
      key: "주소",
      label: "Address",
      value: resume.address,
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
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-gray-800/50 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <img
                  src="/icon.png"
                  alt="Beacon Port"
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
              </Link>
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/my-resume")}
                    size="sm"
                    className="group text-white hover:text-white/90 hover:bg-gray-800/50 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer text-xs sm:text-sm"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                    <span className="hidden sm:inline">목록으로</span>
                    <span className="sm:hidden">목록</span>
                  </Button>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white whitespace-nowrap truncate">
                    {resume.title}
                  </h1>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* 공개/비공개 스위치 - 소유자만 표시 */}
              {isOwner && (
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-gray-600 bg-gray-800/50">
                  <span className="text-xs sm:text-sm text-white/80">
                    비공개
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic}
                    disabled={fetcher.state === "submitting"}
                    onClick={() => handlePublicToggle(!isPublic)}
                    className={cn(
                      "relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                      isPublic ? "bg-green-600" : "bg-gray-600"
                    )}
                  >
                    {fetcher.state === "submitting" ? (
                      <Loader2 className="absolute left-0.5 sm:left-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin text-white" />
                    ) : (
                      <span
                        className={cn(
                          "inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform",
                          isPublic
                            ? "translate-x-5 sm:translate-x-6"
                            : "translate-x-1"
                        )}
                      />
                    )}
                  </button>
                  <span className="text-xs sm:text-sm text-white/80">공개</span>
                </div>
              )}

              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    size="sm"
                    className="group text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-200 group-hover:rotate-12" />
                    <span className="hidden sm:inline">수정</span>
                    <span className="sm:hidden">수정</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    size="sm"
                    className="group text-white border-gray-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm"
                    disabled={fetcher.state === "submitting"}
                  >
                    {fetcher.state === "submitting" ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">삭제 중...</span>
                        <span className="sm:hidden">삭제 중</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-200 group-hover:rotate-12" />
                        <span className="hidden sm:inline">삭제</span>
                        <span className="sm:hidden">삭제</span>
                      </>
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleShare}
                size="sm"
                className="group text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-200 group-hover:rotate-12" />
                <span className="hidden sm:inline">공유</span>
                <span className="sm:hidden">공유</span>
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                size="sm"
                className="group text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-200 group-hover:rotate-12" />
                <span className="hidden sm:inline">출력</span>
                <span className="sm:hidden">출력</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div
          ref={resumeContentRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-8 md:p-12 max-w-3xl mx-auto print:shadow-none print:p-8"
        >
          {/* 헤더: 사진, 이름/Role과 소셜 아이콘 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6 sm:mb-8">
            <div className="flex-1 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* 사진 표시 */}
              {resume.photo && (
                <img
                  src={resume.photo}
                  alt="프로필 사진"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600 shadow-lg shrink-0"
                />
              )}
              <div className="flex-1">
                <h1
                  className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 ${!resume.name ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                >
                  {getDisplayValue("이름", resume.name)}
                </h1>
                {resume.role && (
                  <h2
                    className={`text-xl sm:text-2xl font-normal ${!resume.role ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {getDisplayValue("Role", resume.role)}
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
                <div className="space-y-1 text-xs sm:text-sm text-left sm:text-right w-full sm:w-auto">
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
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
              <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
                {resume.introduce}
              </div>
            </section>
          )}

          {/* Experience 섹션 */}
          {experiences.length > 0 && (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                Experience
              </h2>
              {experiences.map((exp: any) => {
                const period = formatPeriod(
                  exp.start_date,
                  exp.end_date,
                  "재직중"
                );

                return (
                  <div key={exp.id} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("회사명", exp.company)}
                    </h3>
                    {exp.role && (
                      <div className="mb-2 text-sm sm:text-base">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {getDisplayValue("Role", exp.role)}
                        </span>
                      </div>
                    )}
                    {period && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    )}
                    {exp.skills && exp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {exp.skills.map((skill: any, idx: number) => {
                          const variants = [
                            "default",
                            "secondary",
                            "outline",
                          ] as const;
                          const variant = variants[idx % variants.length];
                          return (
                            <Badge
                              key={skill.id || idx}
                              variant={variant}
                              className="text-xs"
                            >
                              {skill.name}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    {exp.description && (
                      <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
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
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                Side Project
              </h2>
              {sideProjects.map((project: any) => {
                const period = formatPeriod(
                  project.start_date,
                  project.end_date,
                  "진행중"
                );

                return (
                  <div key={project.id} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("프로젝트명", project.name)}
                    </h3>
                    {period && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    )}
                    {project.link && (
                      <div className="mb-2">
                        <a
                          href={normalizeUrl(project.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {project.link}
                        </a>
                      </div>
                    )}
                    {project.skills && project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {project.skills.map((skill: any, idx: number) => {
                          const variants = [
                            "default",
                            "secondary",
                            "outline",
                          ] as const;
                          const variant = variants[idx % variants.length];
                          return (
                            <Badge
                              key={skill.id || idx}
                              variant={variant}
                              className="text-xs"
                            >
                              {skill.name}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    {project.description && (
                      <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
                        {project.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* 스킬 스택 그래프 섹션 */}
          {(() => {
            // 스킬 사용 기간 계산 함수
            const calculateSkillDurations = () => {
              const skillMap = new Map<string, number>(); // skillName -> total months

              // Experience 스킬 수집
              experiences.forEach((exp: any) => {
                if (!exp.skills || !exp.skills.length || !exp.start_date)
                  return;

                // 기간 계산 (월 단위)
                const start = new Date(exp.start_date);
                const end = exp.end_date ? new Date(exp.end_date) : new Date();
                const months = Math.max(
                  0,
                  (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth()) +
                    1
                );

                // 스킬별로 기간 누적
                exp.skills.forEach((skill: any) => {
                  if (skill && skill.name) {
                    const skillName = skill.name;
                    const current = skillMap.get(skillName) || 0;
                    skillMap.set(skillName, current + months);
                  }
                });
              });

              // Side Project 스킬 수집
              sideProjects.forEach((project: any) => {
                if (
                  !project.skills ||
                  !project.skills.length ||
                  !project.start_date
                )
                  return;

                // 기간 계산 (월 단위)
                const start = new Date(project.start_date);
                const end = project.end_date
                  ? new Date(project.end_date)
                  : new Date();
                const months = Math.max(
                  0,
                  (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth()) +
                    1
                );

                // 스킬별로 기간 누적
                project.skills.forEach((skill: any) => {
                  if (skill && skill.name) {
                    const skillName = skill.name;
                    const current = skillMap.get(skillName) || 0;
                    skillMap.set(skillName, current + months);
                  }
                });
              });

              // 상위 6개 추출 및 년/개월 정보 포함
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

          {/* Education 섹션 */}
          {educations.length > 0 && (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                Education
              </h2>
              {educations.map((edu: any) => {
                const period = formatPeriod(
                  edu.start_date,
                  edu.end_date,
                  "재학중"
                );

                return (
                  <div key={edu.id} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("기관명", edu.institution)}
                    </h3>
                    {edu.major && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          전공
                        </span>
                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                          {edu.major}
                        </span>
                      </div>
                    )}
                    {period && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        {period.display}
                      </div>
                    )}
                    {edu.description && (
                      <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
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
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                자격증
              </h2>
              {certifications.map((cert: any) => {
                const acquisitionDate = formatDate(cert.acquisition_date);

                return (
                  <div key={cert.id} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("자격증명", cert.name)}
                    </h3>
                    <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                      {getDisplayValue("발급기관", cert.issuer)}
                    </div>
                    {acquisitionDate && (
                      <div className="mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
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
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                어학 성적
              </h2>
              {languageTests.map((test: any) => {
                const testDate = formatDate(test.test_date);

                return (
                  <div key={test.id} className="mb-6 sm:mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {getDisplayValue("시험명", test.name)}
                    </h3>
                    <div className="mb-2">
                      <span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">
                        {getDisplayValue("점수", test.score)}
                      </span>
                      {testDate && (
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 ml-2 sm:ml-4">
                          ({testDate})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* 그 외 활동 섹션 */}
          {etcs.length > 0 && (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
                그 외 활동
              </h2>
              {etcs.map((etc: any) => (
                <div key={etc.id} className="mb-6 sm:mb-10">
                  <hr className="border-gray-300 dark:border-gray-600 mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
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
                    <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4 text-gray-700 dark:text-gray-300">
                      {etc.description}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* 삭제 확인 다이얼로그 - 소유자만 표시 */}
      {isOwner && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogClose onClose={() => setShowDeleteDialog(false)} />
            <DialogHeader>
              <DialogTitle>이력서 삭제</DialogTitle>
              <DialogDescription>
                정말로 이 이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수
                없습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={fetcher.state === "submitting"}
                className="cursor-pointer"
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={fetcher.state === "submitting"}
                className="cursor-pointer"
              >
                {fetcher.state === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
