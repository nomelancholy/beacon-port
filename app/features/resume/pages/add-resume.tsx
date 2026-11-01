import * as React from "react";
import type { Route } from "./+types/add-resume";
import { useBlocker, useNavigate, useFetcher } from "react-router";
import { createSupabaseServerClient } from "~/supabase/server";
import { data, redirect } from "react-router";
import { cn } from "~/lib/utils";
import { getResumeById } from "../queries";
import {
  aboutMeFields,
  detailCategories,
  parseResumeForm,
  toResumeFormData,
  validateResumeDraft,
  visibleResumeItems,
} from "../save-resume";
import { saveResume } from "../save-resume.server";
import {
  ChevronDown,
  Eye,
  Github,
  ImagePlus,
  ListChecks,
  Pencil,
  Trash2,
  User,
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

  const headers = new Headers();
  const supabase = createSupabaseServerClient(request, headers);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login", { headers });
  if (!resumeId) {
    return data({ resume: null, defaultEmail: user.email ?? "" }, { headers });
  }

  try {
    const result = await getResumeById(supabase, resumeId);

    // 소유자 확인
    if (result.resume.user_id !== user.id) {
      throw new Response("Forbidden", { status: 403 });
    }

    return data(result, { headers });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error loading resume");
    throw new Response("이력서를 불러올 수 없습니다", { status: 404 });
  }
};

// UTC ISO 문자열을 YYYY-MM 형식으로 변환하는 헬퍼 함수
const formatISOToMonth = (isoStr: string | null): string => {
  if (!isoStr) return "";
  
  // ISO 문자열에서 직접 YYYY-MM 추출 (가장 안전한 방법)
  // 형식: "2026-01-01T00:00:00.000Z" 또는 "2026-01-01T00:00:00Z" 또는 "2026-01-01"
  // 또는 타임스탬프 형식: "2026-01-01 00:00:00" 등
  const match = isoStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const month = match[2];
    // 월이 유효한지 확인 (01-12)
    const monthNum = parseInt(month, 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${year}-${month}`;
    }
  }
  
  // 매칭 실패 시 Date 객체 사용 (fallback)
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) {
      console.warn(`[formatISOToMonth] Invalid date string: ${isoStr}`);
      return "";
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  } catch (error) {
    console.warn(`[formatISOToMonth] Error parsing date: ${isoStr}`, error);
    return "";
  }
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method !== "POST") return { success: false };

  const formData = await request.formData();
  if (formData.get("intent") !== "save-resume") return { success: false };

  // Validate the complete form before authentication, uploads, or database writes.
  const parsed = parseResumeForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error };

  const headers = new Headers();
  const supabase = createSupabaseServerClient(request, headers);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Response("Unauthorized", { status: 401, headers });

  const result = await saveResume(
    supabase, user.id, new URL(request.url).searchParams.get("resumeId"), parsed.data
  );
  if (!result.success) {
    return data({ success: false, error: result.error }, { headers });
  }
  return redirect(`/resume/${result.resumeId}`, { headers });
};

// 카테고리와 하위 항목 정의
const resumeCategories = {
  "About Me": aboutMeFields,
  Experience: [],
  "Side Project": [],
  "Skill Stack": [],
  Education: [],
  자격증: [],
  어학성적: [],
  "그 외 활동": [],
};

const categoryLabels: Record<string, string> = {
  "About Me": "기본 정보",
  Experience: "경력",
  "Side Project": "사이드 프로젝트",
  "Skill Stack": "스킬 스택",
  Education: "교육",
  자격증: "자격증",
  어학성적: "어학 성적",
  "그 외 활동": "그 외 활동",
};

// 사이트 공통 다크 톤에 맞춘 입력 요소 스타일
const labelClass = "mb-2 block text-sm font-medium text-gray-300";
const inputClass =
  "border-gray-600 bg-gray-900 text-white [color-scheme:dark] placeholder:text-gray-500 focus-visible:ring-gray-400 focus-visible:ring-offset-gray-800";
const invalidClass = "border-red-500 focus-visible:ring-red-500";
const textareaClass =
  "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const checkboxClass =
  "cursor-pointer border-gray-500 focus-visible:ring-gray-400 focus-visible:ring-offset-gray-900 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900";
const panelClass = "rounded-lg border border-gray-700 bg-gray-800";
const outlineButtonClass =
  "cursor-pointer border-gray-600 bg-transparent text-white hover:border-gray-500 hover:bg-gray-800 hover:text-white";
const primaryButtonClass =
  "cursor-pointer bg-white text-gray-900 hover:bg-gray-200";

const aboutMeConfig: Record<
  string,
  { label: string; placeholder?: string; type?: string; half?: boolean }
> = {
  사진: { label: "사진" },
  이름: { label: "이름", placeholder: "홍길동", half: true },
  Role: { label: "직무", placeholder: "예: 백엔드 개발자", half: true },
  이메일: {
    label: "이메일",
    placeholder: "name@example.com",
    type: "email",
    half: true,
  },
  전화번호: {
    label: "전화번호",
    placeholder: "010-1234-5678",
    type: "tel",
    half: true,
  },
  주소: { label: "주소", placeholder: "예: 서울시 강남구" },
  "영어 구사 능력": { label: "영어 구사 능력", half: true },
  블로그: {
    label: "블로그",
    placeholder: "https://blog.example.com",
    half: true,
  },
  LinkedIn: {
    label: "LinkedIn",
    placeholder: "https://www.linkedin.com/in/username",
    half: true,
  },
  Instagram: {
    label: "Instagram",
    placeholder: "https://www.instagram.com/username",
    half: true,
  },
  Facebook: {
    label: "Facebook",
    placeholder: "https://www.facebook.com/username",
    half: true,
  },
  Github: {
    label: "GitHub",
    placeholder: "https://github.com/username",
    half: true,
  },
  Youtube: {
    label: "YouTube",
    placeholder: "https://www.youtube.com/@username",
    half: true,
  },
  X: { label: "X", placeholder: "https://x.com/username", half: true },
  Introduce: {
    label: "자기소개",
    placeholder: "나를 소개하는 글을 입력하세요",
  },
};

type ItemField = {
  key: string;
  label: string;
  required?: boolean;
  type?: "url" | "month" | "skills" | "textarea";
  placeholder?: string;
  hint?: string;
  half?: boolean;
};

const itemConfigs: Record<
  string,
  {
    label: string;
    titleKey: string;
    startKey?: string;
    endKey?: string;
    ongoing?: string;
    fields: ItemField[];
  }
> = {
  Experience: {
    label: "경력",
    titleKey: "회사명",
    startKey: "시작일",
    endKey: "종료일",
    ongoing: "재직중",
    fields: [
      {
        key: "회사명",
        label: "근무회사명",
        required: true,
        placeholder: "회사명을 입력하세요",
      },
      {
        key: "Role",
        label: "직무",
        placeholder: "예: Python Backend, Python Chapter Lead",
      },
      { key: "시작일", label: "시작일", type: "month", half: true },
      {
        key: "종료일",
        label: "종료일",
        type: "month",
        half: true,
        hint: "비워두면 재직중으로 표시됩니다",
      },
      { key: "스킬", label: "기술 스택", type: "skills" },
      {
        key: "작업내용",
        label: "주요 작업 내용",
        type: "textarea",
        placeholder: "주요 작업 내용을 입력하세요",
      },
    ],
  },
  "Side Project": {
    label: "프로젝트",
    titleKey: "프로젝트명",
    startKey: "시작일",
    endKey: "종료일",
    ongoing: "진행중",
    fields: [
      {
        key: "프로젝트명",
        label: "사이드 프로젝트 명",
        required: true,
        placeholder: "프로젝트명을 입력하세요",
      },
      {
        key: "시작일",
        label: "시작일",
        required: true,
        type: "month",
        half: true,
      },
      {
        key: "종료일",
        label: "종료일",
        type: "month",
        half: true,
        hint: "비워두면 진행중으로 표시됩니다",
      },
      { key: "기술스택", label: "기술 스택", type: "skills" },
      {
        key: "링크",
        label: "링크",
        type: "url",
        placeholder: "https://example.com",
      },
      {
        key: "주요작업",
        label: "주요 작업",
        type: "textarea",
        placeholder: "주요 작업 내용을 입력하세요",
      },
    ],
  },
  Education: {
    label: "교육",
    titleKey: "기관명",
    startKey: "시작일",
    endKey: "종료일",
    ongoing: "재학중",
    fields: [
      {
        key: "기관명",
        label: "교육 기관명",
        required: true,
        placeholder: "교육 기관명을 입력하세요",
      },
      {
        key: "전공",
        label: "전공 (선택사항)",
        placeholder: "전공을 입력하세요",
      },
      {
        key: "시작일",
        label: "시작일",
        required: true,
        type: "month",
        half: true,
      },
      {
        key: "종료일",
        label: "종료일",
        type: "month",
        half: true,
        hint: "비워두면 재학중으로 표시됩니다",
      },
      {
        key: "내용",
        label: "교육 내용",
        type: "textarea",
        placeholder: "교육 내용을 입력하세요",
      },
    ],
  },
  자격증: {
    label: "자격증",
    titleKey: "자격증명",
    startKey: "취득일",
    fields: [
      {
        key: "자격증명",
        label: "자격증명",
        required: true,
        placeholder: "자격증명을 입력하세요",
      },
      {
        key: "발급기관",
        label: "발급기관",
        placeholder: "발급기관을 입력하세요",
        half: true,
      },
      { key: "취득일", label: "취득일", type: "month", half: true },
    ],
  },
  어학성적: {
    label: "어학 성적",
    titleKey: "시험명",
    startKey: "응시일자",
    fields: [
      {
        key: "시험명",
        label: "시험명",
        required: true,
        placeholder: "예: TOEIC, TOEFL, IELTS",
      },
      { key: "점수", label: "점수", placeholder: "예: 950, 7.5", half: true },
      { key: "응시일자", label: "응시 일자", type: "month", half: true },
    ],
  },
  "그 외 활동": {
    label: "활동",
    titleKey: "활동명",
    fields: [
      {
        key: "활동명",
        label: "활동명",
        required: true,
        placeholder: "활동명을 입력하세요",
      },
      {
        key: "링크",
        label: "링크",
        type: "url",
        placeholder: "https://example.com",
      },
      {
        key: "내용",
        label: "활동 내용",
        type: "textarea",
        placeholder: "활동 내용을 입력하세요",
      },
    ],
  },
};

const parseSkillSelection = (value: string | undefined): string[] => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const splitSkills = (value: string | undefined) =>
  (value || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);

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
    // 짧은 막대의 텍스트도 잘리지 않도록 충분한 여백 확보
    // 최소값을 보장하여 짧은 경력도 텍스트가 잘리지 않도록 함
    const minDomainForShortBars = 0.5; // 짧은 막대를 위한 최소 domain 값
    const domainMax = Math.max(
      minDomainForShortBars,
      isMobile ? maxValue * 1.5 : maxValue * 1.3
    );
    // 텍스트가 잘리지 않도록 우측 여백을 충분히 확보
    const rightMargin = isMobile ? 80 : 70;

    // 스킬 개수에 따라 높이 동적 계산
    // 기술 이름이 잘리지 않도록 충분한 높이 확보
    const skillCount = chartData.length;
    const barSize = 36; // 막대 높이 (기술 이름이 잘리지 않도록 충분히)
    const barCategoryGap = 12; // 막대 사이 간격
    const minHeight = 80; // 최소 높이
    // 각 막대 높이 + 간격을 고려한 전체 높이 계산
    const calculatedHeight = Math.max(
      minHeight,
      skillCount * (barSize + barCategoryGap) + barCategoryGap
    );

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
            barCategoryGap={barCategoryGap}
            height={calculatedHeight}
            margin={{
              right: rightMargin,
              top: 8,
              bottom: 8,
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
              barSize={barSize}
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
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="예: Python, Flask, AWS (쉼표로 구분)"
          className={cn(inputClass, "w-full")}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        )}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                aria-label={`${skill} 삭제`}
                onClick={() => removeSkill(skill)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-100 transition-colors hover:bg-gray-600"
              >
                {skill}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

// 경력, 프로젝트 등 반복 항목 카드 (필드 구성은 itemConfigs에서 결정)
const ItemCard = React.memo(
  ({
    itemId,
    index,
    category,
    formData,
    collapsed,
    errorField,
    onInputChange,
    onToggleCollapse,
    onRemove,
  }: {
    itemId: string;
    index: number;
    category: string;
    formData: Record<string, string>;
    collapsed: boolean;
    errorField?: string;
    onInputChange: (field: string, value: string) => void;
    onToggleCollapse: (itemId: string) => void;
    onRemove: (category: string, itemId: string) => void;
  }) => {
    const config = itemConfigs[category];
    const [isConfirmingRemove, setIsConfirmingRemove] = React.useState(false);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `${category}_${itemId}`,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const heading = `${config.label} ${index + 1}`;
    const title = formData[`${itemId}_${config.titleKey}`]?.trim();
    const start = config.startKey && formData[`${itemId}_${config.startKey}`];
    const end = config.endKey && formData[`${itemId}_${config.endKey}`];
    const period = start
      ? config.endKey
        ? `${start} ~ ${end || config.ongoing}`
        : start
      : "";

    const renderField = (field: ItemField) => {
      const fieldId = `${itemId}_${field.key}`;
      const value = formData[fieldId] || "";
      const isInvalid = errorField === fieldId;
      const fieldClass = cn(inputClass, isInvalid && invalidClass);

      return (
        <div key={field.key} className={field.half ? "" : "sm:col-span-2"}>
          <label htmlFor={fieldId} className={labelClass}>
            {field.label}
            {field.required && <span className="ml-1 text-red-400">*</span>}
          </label>
          {field.type === "skills" ? (
            <SkillInput
              itemId={itemId}
              value={value}
              onInputChange={onInputChange}
              fieldName={fieldId}
            />
          ) : field.type === "textarea" ? (
            <textarea
              id={fieldId}
              rows={6}
              value={value}
              onChange={(e) => onInputChange(fieldId, e.target.value)}
              className={cn(textareaClass, fieldClass)}
              placeholder={field.placeholder}
            />
          ) : (
            <Input
              id={fieldId}
              type={field.type || "text"}
              value={value}
              aria-invalid={isInvalid}
              onChange={(e) => onInputChange(fieldId, e.target.value)}
              placeholder={field.placeholder}
              className={fieldClass}
            />
          )}
          {field.hint && (
            <p className="mt-1.5 text-xs text-gray-400">{field.hint}</p>
          )}
        </div>
      );
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        id={`item-${itemId}`}
        className={cn(panelClass, "scroll-mt-4")}
      >
        <div className="flex items-center gap-1 p-2 sm:gap-2 sm:p-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`${heading} 순서 변경`}
            className="cursor-move touch-none rounded-md p-1 text-gray-500 hover:text-gray-300"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleCollapse(itemId)}
            aria-expanded={!collapsed}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-left"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
                collapsed && "-rotate-90"
              )}
            />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-white">
                {title || heading}
              </span>
              {period && (
                <span className="block truncate text-xs text-gray-400">
                  {period}
                </span>
              )}
            </span>
          </button>
          {isConfirmingRemove ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                onClick={() => onRemove(category, itemId)}
                className="h-8 cursor-pointer bg-red-600 px-2 text-white hover:bg-red-700"
              >
                삭제
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsConfirmingRemove(false)}
                className="h-8 cursor-pointer px-2 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                취소
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${heading} 삭제`}
              className="h-8 w-8 shrink-0 cursor-pointer text-gray-400 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsConfirmingRemove(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!collapsed && (
          <div className="grid grid-cols-1 gap-4 border-t border-gray-700 p-4 sm:grid-cols-2 sm:p-6">
            {config.fields.map(renderField)}
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    // 폼 데이터 중 이 카드와 관련된 값만 바뀌었을 때만 리렌더링하도록 최적화
    return (
      prev.itemId === next.itemId &&
      prev.index === next.index &&
      prev.category === next.category &&
      prev.collapsed === next.collapsed &&
      prev.errorField === next.errorField &&
      itemConfigs[prev.category].fields.every(
        ({ key }) =>
          prev.formData[`${prev.itemId}_${key}`] ===
          next.formData[`${next.itemId}_${key}`]
      )
    );
  }
);
ItemCard.displayName = "ItemCard";

export default function AddResume({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { toast, showToast, hideToast } = useToast();
  const isEditMode = !!loaderData?.resume;

  // 기존 데이터로 초기화
  const initializeFromLoaderData = () => {
    if (!loaderData?.resume) {
      return {
        // 새 이력서는 대부분 쓰는 항목을 미리 열어둠 (이름은 필수)
        selectedFields: {
          이름: true,
          Role: true,
          이메일: true,
          전화번호: true,
          Introduce: true,
        } as Record<string, boolean>,
        formData: (loaderData?.defaultEmail
          ? { 이메일: loaderData.defaultEmail }
          : {}) as Record<string, string>,
        dynamicItems: {
          Experience: [],
          "Side Project": [],
          Education: [],
          자격증: [],
          어학성적: [],
          "그 외 활동": [],
        } as Record<string, string[]>,
        resumeTitle: "",
      };
    }

    const resume = loaderData.resume;
    const formData: Record<string, string> = {};
    const selectedFields: Record<string, boolean> = { 이름: true };
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
    const skillStackSelected = (resume as any).skill_stack_selected;
    if (skillStackSelected) {
      formData["skill_stack_selected"] = skillStackSelected;
      // 선택한 기술이 있으면 Skill Stack 체크박스 활성화
      try {
        const selectedSkills = JSON.parse(skillStackSelected);
        if (Array.isArray(selectedSkills) && selectedSkills.length > 0) {
          selectedFields["Skill Stack"] = true;
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
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
        formData[`${itemId}_시작일`] = formatISOToMonth(exp.start_date);
        formData[`${itemId}_종료일`] = formatISOToMonth(exp.end_date);
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
        formData[`${itemId}_시작일`] = formatISOToMonth(sp.start_date);
        formData[`${itemId}_종료일`] = formatISOToMonth(sp.end_date);
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
        formData[`${itemId}_시작일`] = formatISOToMonth(edu.start_date);
        formData[`${itemId}_종료일`] = formatISOToMonth(edu.end_date);
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
        formData[`${itemId}_취득일`] = formatISOToMonth(cert.acquisition_date);
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
        formData[`${itemId}_응시일자`] = formatISOToMonth(test.test_date);
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
  const [isSectionPanelOpen, setIsSectionPanelOpen] = React.useState(false);
  const [resumeTitle, setResumeTitle] = React.useState(initialData.resumeTitle);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [fieldError, setFieldError] = React.useState<{
    field: string;
    message: string;
  } | null>(null);
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >({
    "About Me": true,
  });

  // 동적 항목 관리 (Experience, Side Project 등)
  const [dynamicItems, setDynamicItems] = React.useState<
    Record<string, string[]>
  >(initialData.dynamicItems);
  // 저장된 항목은 접어서 시작해 긴 이력서도 한눈에 볼 수 있게 함
  const [collapsedItems, setCollapsedItems] = React.useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      Object.values(initialData.dynamicItems)
        .flat()
        .map((itemId) => [itemId, true])
    )
  );
  const pendingFocusRef = React.useRef<string | null>(null);

  const draft = {
    title: resumeTitle,
    formData,
    selectedFields,
    dynamicItems,
  };
  const getVisibleItems = (category: string) =>
    visibleResumeItems({ selectedFields, dynamicItems }, category);

  // 저장하지 않은 변경 사항 감지 (상태 객체가 초기값에서 바뀌었는지 비교)
  const isDirty =
    formData !== initialData.formData ||
    selectedFields !== initialData.selectedFields ||
    dynamicItems !== initialData.dynamicItems ||
    resumeTitle !== initialData.resumeTitle;
  const isSubmitting = isSaving || fetcher.state !== "idle";

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isSubmitting &&
      currentLocation.pathname !== nextLocation.pathname
  );

  React.useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  // 저장 상태 모니터링 및 에러 처리
  React.useEffect(() => {
    if (fetcher.data) {
      setIsSaving(false); // 저장 완료 또는 에러 발생 시 로딩 상태 해제
      if (fetcher.data.error) {
        showToast(fetcher.data.error, "error");
      }
    }
  }, [fetcher.data, showToast]);

  // fetcher.state가 idle로 변경되면 로딩 상태 해제
  React.useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      setIsSaving(false);
    }
  }, [fetcher.state, fetcher.data]);

  // 검증에 실패한 입력칸으로 바로 이동
  React.useEffect(() => {
    if (fieldError) document.getElementById(fieldError.field)?.focus();
  }, [fieldError]);

  // 새로 추가한 항목의 첫 입력칸으로 이동
  React.useEffect(() => {
    if (!pendingFocusRef.current) return;
    document.getElementById(pendingFocusRef.current)?.focus();
    pendingFocusRef.current = null;
  }, [dynamicItems]);

  // 동적 항목 추가
  const handleAddDynamicItem = (category: string) => {
    const newItemId = `${category}_${Date.now()}`;
    pendingFocusRef.current = `${newItemId}_${itemConfigs[category].titleKey}`;
    setIsPreviewMode(false);
    setIsSectionPanelOpen(false);
    setDynamicItems((prev) => ({
      ...prev,
      [category]: [...prev[category], newItemId],
    }));
    // 자동으로 체크박스도 선택
    setSelectedFields((prev) => ({
      ...prev,
      [category]: true,
      [newItemId]: true,
    }));
  };

  // 동적 항목 삭제
  const handleRemoveDynamicItem = React.useCallback(
    (category: string, itemId: string) => {
      setDynamicItems((prev) => ({
        ...prev,
        [category]: prev[category].filter((id) => id !== itemId),
      }));
      // 관련된 모든 폼 데이터 삭제
      setFormData((prev) => {
        const newData = { ...prev };
        Object.keys(newData).forEach((key) => {
          if (key.startsWith(`${itemId}_`)) {
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
    },
    []
  );

  const handleToggleCollapse = React.useCallback((itemId: string) => {
    setCollapsedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  const handleJumpToItem = (itemId: string) => {
    setIsPreviewMode(false);
    setIsSectionPanelOpen(false);
    setCollapsedItems((prev) => ({ ...prev, [itemId]: false }));
    requestAnimationFrame(() => {
      document
        .getElementById(`item-${itemId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 체크를 해제해도 입력값은 유지하고, 저장할 때만 제외함
  const handleCheckboxChange = (field: string) => {
    if (
      detailCategories.includes(field) &&
      !selectedFields[field] &&
      dynamicItems[field].length === 0
    ) {
      handleAddDynamicItem(field);
      return;
    }

    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = React.useCallback(
    (field: string, value: string) => {
      setFieldError((prev) => (prev?.field === field ? null : prev));
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSkillToggle = (skill: string) => {
    const current = parseSkillSelection(formData["skill_stack_selected"]);
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill].slice(0, 6);
    handleInputChange("skill_stack_selected", JSON.stringify(next));
  };

  const handleSaveResume = () => {
    if (isSubmitting) return;

    const error = validateResumeDraft(draft);
    if (error) {
      setIsPreviewMode(false);
      const itemId = Object.values(dynamicItems)
        .flat()
        .find((id) => error.field.startsWith(`${id}_`));
      if (itemId) {
        setCollapsedItems((prev) => ({ ...prev, [itemId]: false }));
      }
      setFieldError({ ...error });
      return;
    }

    // 검증 통과 시 즉시 로딩 상태 활성화
    setIsSaving(true);

    // 수정 모드인 경우 resumeId를 URL에 포함
    const url = isEditMode
      ? `/add-resume?resumeId=${loaderData?.resume?.id}`
      : "/add-resume";

    fetcher.submit(toResumeFormData(draft), {
      method: "POST",
      action: url,
    });
  };

  // Cmd/Ctrl + S 로 저장
  const saveRef = React.useRef(handleSaveResume);
  saveRef.current = handleSaveResume;
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

    // 파일 타입 검증 (저장 시 지원하는 형식만 허용)
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
      showToast("JPG, PNG, GIF, WEBP 이미지만 업로드 가능합니다.", "error");
      return;
    }

    // 파일 크기 검증 (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("파일 크기는 2MB 이하여야 합니다.", "error");
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
        showToast("이미지 읽기에 실패했습니다.", "error");
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      showToast("이미지 처리 중 오류가 발생했습니다.", "error");
      setIsUploadingPhoto(false);
    }
  };

  const renderFormField = (field: string) => {
    const config = aboutMeConfig[field];
    const isInvalid = fieldError?.field === field;
    const fieldClass = cn(inputClass, isInvalid && invalidClass);

    return (
      <div key={field} className={config.half ? "" : "sm:col-span-2"}>
        {field !== "사진" && (
          <label htmlFor={field} className={labelClass}>
            {config.label}
            {field === "이름" && <span className="ml-1 text-red-400">*</span>}
          </label>
        )}
        {field === "사진" ? (
          <div className="flex items-center gap-4">
            {formData[field] ? (
              <img
                src={formData[field]}
                alt="프로필 사진 미리보기"
                className="h-20 w-20 shrink-0 rounded-full border-2 border-gray-600 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-600 text-gray-500">
                <User className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={outlineButtonClass}
                >
                  <label htmlFor={field}>
                    {isUploadingPhoto ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ImagePlus />
                    )}
                    {formData[field] ? "사진 변경" : "사진 선택"}
                  </label>
                </Button>
                {formData[field] && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileChange(field, null)}
                    className="cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    삭제
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400">
                JPG, PNG, GIF, WEBP · 2MB 이하
              </p>
              <input
                id={field}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  handleFileChange(field, e.target.files?.[0] || null);
                  e.target.value = "";
                }}
                disabled={isUploadingPhoto}
                className="sr-only"
              />
            </div>
          </div>
        ) : field === "영어 구사 능력" ? (
          <select
            id={field}
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={cn(
              "flex h-10 w-full min-w-0 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              fieldClass
            )}
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
            rows={6}
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={cn(textareaClass, fieldClass)}
            placeholder={config.placeholder}
          />
        ) : (
          <Input
            id={field}
            type={config.type || "text"}
            value={formData[field] || ""}
            aria-invalid={isInvalid}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={config.placeholder}
            className={fieldClass}
          />
        )}
      </div>
    );
  };

  // 왼쪽 패널: 이력서에 표시할 항목 선택
  const renderSectionPanel = () => (
    <>
      {isSectionPanelOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setIsSectionPanelOpen(false)}
        />
      )}
      <aside
        aria-label="이력서 항목 선택"
        className={cn(
          "w-72 max-w-[85vw] shrink-0 flex-col gap-4 overflow-y-auto border-r border-gray-700 bg-gray-900 p-4",
          isSectionPanelOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden",
          "md:static md:z-auto md:flex"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white">표시할 항목</h2>
            <p className="mt-1 text-xs text-gray-400">
              체크한 항목만 이력서에 표시되고 저장됩니다
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="항목 패널 닫기"
            onClick={() => setIsSectionPanelOpen(false)}
            className="h-8 w-8 shrink-0 cursor-pointer text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
          >
            <X />
          </Button>
        </div>

        {Object.keys(resumeCategories).map((category) => {
          const headingClass =
            "flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm font-medium text-white";

          if (category === "About Me") {
            const checkedCount = aboutMeFields.filter(
              (field) => selectedFields[field]
            ).length;
            return (
              <Collapsible
                key={category}
                open={openCategories[category]}
                onOpenChange={(open) =>
                  setOpenCategories((prev) => ({ ...prev, [category]: open }))
                }
              >
                <CollapsibleTrigger
                  className={cn(
                    headingClass,
                    "w-full cursor-pointer hover:bg-gray-800"
                  )}
                >
                  <span>{categoryLabels[category]}</span>
                  <span className="flex items-center gap-2 text-xs font-normal text-gray-400">
                    {checkedCount}/{aboutMeFields.length}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        openCategories[category] && "rotate-180"
                      )}
                    />
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="mt-1 space-y-0.5">
                    {aboutMeFields.map((field) => (
                      <li
                        key={field}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-800"
                      >
                        <Checkbox
                          id={`section-${field}`}
                          checked={selectedFields[field] || false}
                          disabled={field === "이름"}
                          onCheckedChange={() => handleCheckboxChange(field)}
                          className={checkboxClass}
                        />
                        <label
                          htmlFor={`section-${field}`}
                          className="flex-1 cursor-pointer text-sm text-gray-200"
                        >
                          {aboutMeConfig[field].label}
                          {field === "이름" && (
                            <span className="ml-1 text-xs text-gray-400">
                              (필수)
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          const isDynamicCategory = detailCategories.includes(category);
          const config = itemConfigs[category];

          return (
            <div key={category}>
              <div className={cn(headingClass, "hover:bg-gray-800")}>
                <label
                  htmlFor={`section-${category}`}
                  className="flex-1 cursor-pointer"
                >
                  {categoryLabels[category]}
                </label>
                <Checkbox
                  id={`section-${category}`}
                  checked={selectedFields[category] || false}
                  onCheckedChange={() => handleCheckboxChange(category)}
                  className={checkboxClass}
                />
              </div>
              {isDynamicCategory && selectedFields[category] && (
                <ul className="mt-1 space-y-0.5">
                  {dynamicItems[category].map((itemId, index) => (
                    <li
                      key={itemId}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-800"
                    >
                      <Checkbox
                        checked={selectedFields[itemId] || false}
                        onCheckedChange={() => handleCheckboxChange(itemId)}
                        aria-label={`${config.label} ${index + 1} 표시`}
                        className={checkboxClass}
                      />
                      <button
                        type="button"
                        onClick={() => handleJumpToItem(itemId)}
                        className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm text-gray-200"
                      >
                        {formData[`${itemId}_${config.titleKey}`]?.trim() ||
                          `${config.label} ${index + 1}`}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => handleAddDynamicItem(category)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                      {config.label} 추가
                    </button>
                  </li>
                </ul>
              )}
            </div>
          );
        })}
      </aside>
    </>
  );

  const renderSkillStackSection = () => {
    const selectedSkills = parseSkillSelection(
      formData["skill_stack_selected"]
    );
    const availableSkills = new Set(selectedSkills);
    getVisibleItems("Experience").forEach((itemId) =>
      splitSkills(formData[`${itemId}_스킬`]).forEach((skill) =>
        availableSkills.add(skill)
      )
    );
    getVisibleItems("Side Project").forEach((itemId) =>
      splitSkills(formData[`${itemId}_기술스택`]).forEach((skill) =>
        availableSkills.add(skill)
      )
    );
    const allSkills = Array.from(availableSkills).sort();

    return (
      <section key="Skill Stack" className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">
            {categoryLabels["Skill Stack"]}
          </h2>
          <span className="text-sm text-gray-400">
            {selectedSkills.length}/6
          </span>
        </div>
        <div className={cn(panelClass, "p-4 sm:p-6")}>
          {allSkills.length === 0 ? (
            <p className="text-sm text-gray-400">
              경력이나 사이드 프로젝트에 기술을 추가하면 여기에서 선택할 수
              있습니다.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-400">
                사용 기간을 그래프로 보여줄 기술을 최대 6개 선택하세요.
              </p>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={!isSelected && selectedSkills.length >= 6}
                      onClick={() => handleSkillToggle(skill)}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        isSelected
                          ? "border-white bg-white text-gray-900"
                          : "border-gray-600 text-gray-200 hover:border-gray-400"
                      )}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    );
  };

  const renderItemSection = (category: string) => {
    const filteredItems = getVisibleItems(category);
    if (!selectedFields[category]) return null;

    return (
      <section key={category} className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          {categoryLabels[category]}
        </h2>
        <SortableContext
          items={filteredItems.map((itemId) => `${category}_${itemId}`)}
          strategy={verticalListSortingStrategy}
        >
          {filteredItems.map((itemId, index) => (
            <ItemCard
              key={itemId}
              itemId={itemId}
              index={index}
              category={category}
              formData={formData}
              collapsed={collapsedItems[itemId] || false}
              errorField={
                fieldError?.field.startsWith(`${itemId}_`)
                  ? fieldError.field
                  : undefined
              }
              onInputChange={handleInputChange}
              onToggleCollapse={handleToggleCollapse}
              onRemove={handleRemoveDynamicItem}
            />
          ))}
        </SortableContext>
        <button
          type="button"
          onClick={() => handleAddDynamicItem(category)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 py-3 text-sm text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          {itemConfigs[category].label} 추가
        </button>
      </section>
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

        {/* Skill Stack 섹션 */}
        {selectedFields["Skill Stack"] &&
          (() => {
            // 선택한 기술 목록 가져오기
            const selectedSkillsStr = formData["skill_stack_selected"];
            const selectedSkills: string[] = selectedSkillsStr
              ? JSON.parse(selectedSkillsStr)
              : [];

            if (selectedSkills.length === 0) return null;

            // 스킬 사용 기간 계산 함수 (선택한 기술만)
            const calculateSkillDurations = () => {
              const skillMap = new Map<string, number>(); // skillName -> total months

              // Experience 스킬 수집
              getVisibleItems("Experience").forEach((itemId) => {

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

                // 스킬별로 기간 누적 (선택한 기술만)
                skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0 && selectedSkills.includes(s))
                  .forEach((skillName) => {
                    const current = skillMap.get(skillName) || 0;
                    skillMap.set(skillName, current + months);
                  });
              });

              // Side Project 스킬 수집
              getVisibleItems("Side Project").forEach((itemId) => {

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

                // 스킬별로 기간 누적 (선택한 기술만)
                skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0 && selectedSkills.includes(s))
                  .forEach((skillName) => {
                    const current = skillMap.get(skillName) || 0;
                    skillMap.set(skillName, current + months);
                  });
              });

              // 선택한 기술들의 기간 정보 반환
              return selectedSkills
                .map((skillName) => {
                  const months = skillMap.get(skillName) || 0;
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
                    name: skillName,
                    months,
                    years: months / 12, // 차트용 (소수점)
                    displayText,
                  };
                })
                .sort((a, b) => b.months - a.months);
            };

            const topSkills = calculateSkillDurations();

            if (topSkills.length === 0) return null;

            return (
              <section className="mb-6 sm:mb-10">
                <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  Skill Stack
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
                  선택한 기술들의 사용 기간을 표시합니다
                </p>
                <div className="w-full">
                  <SkillStackChart data={topSkills} />
                </div>
              </section>
            );
          })()}

        {/* Experience 섹션 */}
        {(() => {
          const experienceFields = getVisibleItems("Experience");

          if (experienceFields.length === 0) return null;

          return (
            <section className="mb-6 sm:mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-3 sm:mb-4" />
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Experience
                </h2>
                {(() => {
                  // 총 경력 기간 계산
                  let totalMonths = 0;
                  experienceFields.forEach((field) => {
                    const startDate = formData[`${field}_시작일`];
                    if (!startDate) return;
                    const start = new Date(startDate + "-01");
                    const endDate = formData[`${field}_종료일`];
                    const end = endDate
                      ? new Date(endDate + "-01")
                      : new Date();
                    const months = Math.max(
                      0,
                      (end.getFullYear() - start.getFullYear()) * 12 +
                        (end.getMonth() - start.getMonth()) +
                        1
                    );
                    totalMonths += months;
                  });

                  if (totalMonths === 0) return null;

                  const years = Math.floor(totalMonths / 12);
                  const remainingMonths = totalMonths % 12;
                  let displayText = "";
                  if (years === 0) {
                    displayText = `${remainingMonths}개월`;
                  } else if (remainingMonths === 0) {
                    displayText = `${years}년`;
                  } else {
                    displayText = `${years}년 ${remainingMonths}개월`;
                  }

                  return (
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-normal">
                      ({displayText})
                    </span>
                  );
                })()}
              </div>
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
          const sideProjectFields = getVisibleItems("Side Project");

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
          const educationFields = getVisibleItems("Education");

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
          const certificationFields = getVisibleItems("자격증");

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
          const languageTestFields = getVisibleItems("어학성적");

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
          const etcFields = getVisibleItems("그 외 활동");

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
              category !== "Skill Stack"
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
      <div
        className={cn(
          "flex h-page w-full flex-col overflow-hidden bg-gray-900 [color-scheme:dark]",
          isSaving && "pointer-events-none"
        )}
      >
        {/* Header */}
        <header className="border-b border-gray-700 bg-gray-900">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(
                  isEditMode
                    ? `/resume/${loaderData?.resume?.id}`
                    : "/my-resume"
                )
              }
              className="group cursor-pointer text-white transition-all duration-200 ease-in-out hover:bg-gray-800/50 hover:text-white/90"
            >
              <ArrowLeft className="transition-transform duration-200 group-hover:-translate-x-1" />
              <span className="hidden sm:inline">
                {isEditMode ? "돌아가기" : "목록으로"}
              </span>
            </Button>
            <h1 className="sr-only">
              {isEditMode ? "이력서 수정" : "새 이력서 작성"}
            </h1>
            <Input
              id="title"
              value={resumeTitle}
              aria-label="이력서 제목"
              aria-invalid={fieldError?.field === "title"}
              onChange={(e) => {
                setResumeTitle(e.target.value);
                setFieldError((prev) =>
                  prev?.field === "title" ? null : prev
                );
              }}
              placeholder="이력서 제목 (예: 프론트엔드 개발자 이력서)"
              className={cn(
                inputClass,
                "order-last h-9 w-full font-medium focus-visible:ring-offset-gray-900 sm:order-none sm:w-auto sm:min-w-0 sm:flex-1",
                fieldError?.field === "title" && invalidClass
              )}
            />
            <div className="ml-auto flex items-center gap-2">
              {isDirty && (
                <span className="hidden text-xs text-gray-400 lg:inline">
                  저장되지 않은 변경 사항
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSectionPanelOpen(true)}
                className={cn(outlineButtonClass, "md:hidden")}
              >
                <ListChecks />
                항목
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={isPreviewMode}
                onClick={() => setIsPreviewMode((prev) => !prev)}
                className={outlineButtonClass}
              >
                {isPreviewMode ? <Pencil /> : <Eye />}
                {isPreviewMode ? "편집" : "미리보기"}
              </Button>
              <Button
                type="button"
                size="sm"
                title="저장 (Cmd/Ctrl + S)"
                onClick={handleSaveResume}
                disabled={isSubmitting}
                className={primaryButtonClass}
              >
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </div>
          {fieldError && (
            <p
              role="alert"
              className="border-t border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300"
            >
              {fieldError.message}
            </p>
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          {!isPreviewMode && renderSectionPanel()}

          <main className="min-w-0 flex-1 overflow-y-auto">
            {isPreviewMode ? (
              <div className="px-4 py-8">
                <div className="mx-auto max-w-3xl rounded-lg bg-white p-4 shadow-sm sm:p-8 md:p-12 dark:bg-gray-800">
                  {renderPreview()}
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:py-8"
              >
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-white">
                    {categoryLabels["About Me"]}
                  </h2>
                  <div
                    className={cn(
                      panelClass,
                      "grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6"
                    )}
                  >
                    {aboutMeFields
                      .filter((field) => selectedFields[field])
                      .map((field) => renderFormField(field))}
                  </div>
                </section>

                {Object.keys(resumeCategories).map((category) => {
                  if (category === "About Me") return null;
                  if (category === "Skill Stack") {
                    return selectedFields[category]
                      ? renderSkillStackSection()
                      : null;
                  }
                  return renderItemSection(category);
                })}
              </form>
            )}
          </main>
        </div>
      </div>

      {/* 저장하지 않고 나가기 확인 다이얼로그 */}
      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={() => blocker.reset?.()}
      >
        <DialogContent className="mx-4 border border-gray-700 bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              저장하지 않고 나갈까요?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              지금 나가면 작성 중인 변경 사항이 사라집니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => blocker.reset?.()}
              className={outlineButtonClass}
            >
              계속 작성
            </Button>
            <Button
              onClick={() => blocker.proceed?.()}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
            >
              나가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* 저장 중 전체 화면 로딩 오버레이 */}
      {isSaving && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <div className="text-center">
              <p className="text-lg font-semibold text-white">처리 중...</p>
              <p className="text-sm text-gray-400 mt-2">
                이력서를 저장하고 있습니다.
                <br />
                잠시만 기다려주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
