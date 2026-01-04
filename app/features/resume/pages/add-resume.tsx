import * as React from "react";
import type { Route } from "./+types/add-resume";
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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "이력서 추가 - Beacon Port" },
    {
      name: "description",
      content: "새로운 이력서를 작성하세요",
    },
  ];
}

// 카테고리와 하위 항목 정의
const resumeCategories = {
  "About Me": [
    "사진",
    "이름",
    "Role",
    "이메일",
    "전화번호",
    "영어 구사 능력",
    "웹사이트",
    "LinkedIn",
    "Instagram",
    "Facebook",
    "Github",
    "Youtube",
    "Introduce",
  ],
  Experience: [],
  "Side Project": [],
  Education: [],
  자격증: [],
  어학성적: [],
  etc: [],
};

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
                근무회사명
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
            <div className="grid grid-cols-2 gap-4">
              <div>
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
                />
              </div>
              <div>
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
              <Input
                id={`${itemId}_스킬`}
                name={`${itemId}_스킬`}
                value={formData[`${itemId}_스킬`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_스킬`, e.target.value)
                }
                placeholder="예: Python, Flask, AWS, Swift (쉼표로 구분)"
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
                사이드 프로젝트 명
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
            <div className="grid grid-cols-2 gap-4">
              <div>
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
                />
              </div>
              <div>
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
              <Input
                id={`${itemId}_기술스택`}
                name={`${itemId}_기술스택`}
                value={formData[`${itemId}_기술스택`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_기술스택`, e.target.value)
                }
                placeholder="예: React, TypeScript, Node.js (쉼표로 구분)"
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
                교육 기관명
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                전공
              </label>
              <Input
                id={`${itemId}_전공`}
                name={`${itemId}_전공`}
                value={formData[`${itemId}_전공`] || ""}
                onChange={(e) =>
                  onInputChange(`${itemId}_전공`, e.target.value)
                }
                placeholder="전공을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
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
                />
              </div>
              <div>
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
                자격증명
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
                시험명
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
                활동명
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

export default function AddResume() {
  // About Me 하위 항목들을 기본값으로 모두 선택
  const getInitialSelectedFields = () => {
    const fields: Record<string, boolean> = {};
    resumeCategories["About Me"].forEach((field) => {
      fields[field] = true;
    });
    return fields;
  };

  const [selectedFields, setSelectedFields] = React.useState<
    Record<string, boolean>
  >(getInitialSelectedFields);
  const [formData, setFormData] = React.useState<Record<string, string>>({});
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [openCategories, setOpenCategories] = React.useState<
    Record<string, boolean>
  >({
    "About Me": true,
  });

  // 동적 항목 관리 (Experience, Side Project 등)
  const [dynamicItems, setDynamicItems] = React.useState<
    Record<string, string[]>
  >({
    Experience: [],
    "Side Project": [],
    Education: [],
    자격증: [],
    어학성적: [],
    etc: [],
  });

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

  // 파일 업로드 핸들러
  const handleFileChange = (field: string, file: File | null) => {
    if (!file) {
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[field];
        return newData;
      });
      return;
    }

    // 파일을 base64로 변환하여 저장
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        [field]: base64String,
      }));
    };
    reader.readAsDataURL(file);
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
    const isDynamicEtc = field.startsWith("etc_");

    // 상위 카테고리 체크 여부 확인 - 상위가 체크 해제되면 하위 항목도 숨김
    if (isDynamicExperience && !selectedFields["Experience"]) return null;
    if (isDynamicSideProject && !selectedFields["Side Project"]) return null;
    if (isDynamicEducation && !selectedFields["Education"]) return null;
    if (isDynamicCertification && !selectedFields["자격증"]) return null;
    if (isDynamicLanguageTest && !selectedFields["어학성적"]) return null;
    if (isDynamicEtc && !selectedFields["etc"]) return null;

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
            <input
              id={field}
              name={field}
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleFileChange(field, e.target.files?.[0] || null)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
      value: string | undefined
    ): string => {
      return value || getPlaceholder(field);
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
        key: "웹사이트",
        label: "Web",
        value: formData["웹사이트"],
        isLink: true,
        href: formData["웹사이트"] || "#",
        selected: selectedFields["웹사이트"],
      },
      {
        key: "전화번호",
        label: "Phone",
        value: formData["전화번호"],
        isLink: false,
        selected: selectedFields["전화번호"],
      },
    ].filter((item) => item.selected);

    return (
      <div className="max-w-3xl mx-auto text-gray-900 dark:text-gray-100">
        {/* 헤더: 사진, 이름/Role과 소셜 아이콘 */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {/* 사진 표시 */}
            {selectedFields["사진"] && (
              <div className="mb-6">
                {formData["사진"] ? (
                  <img
                    src={formData["사진"]}
                    alt="프로필 사진"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <span className="text-gray-400 dark:text-gray-500 text-sm italic">
                      사진
                    </span>
                  </div>
                )}
              </div>
            )}
            {selectedFields["이름"] && (
              <h1
                className={`text-5xl font-bold mb-3 ${!formData["이름"] ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
              >
                {getDisplayValue("이름", formData["이름"])}
              </h1>
            )}
            {selectedFields["Role"] && (
              <h2
                className={`text-2xl font-normal ${!formData["Role"] ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-600 dark:text-gray-400"}`}
              >
                {getDisplayValue("Role", formData["Role"])}
              </h2>
            )}
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
              <div className="space-y-1 text-sm text-right">
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
          <section className="mb-10">
            <hr className="border-gray-300 dark:border-gray-600 mb-6" />
            <div
              className={`text-base leading-relaxed whitespace-pre-line ${!formData["Introduce"] ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
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
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
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

                  // 하나만 있으면 해당 값과 placeholder 반환
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

                const period = formatPeriod();

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3
                      className={`text-2xl font-bold mb-2 ${!company ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("회사명", company)}
                    </h3>
                    <div className="mb-2">
                      {role ? (
                        <span
                          className={`font-bold ${!role ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                        >
                          {getDisplayValue("Role", role)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic font-bold">
                          {getPlaceholder("Role")}
                        </span>
                      )}
                      {(role || period) && <span className="mx-2">•</span>}
                      {period ? (
                        <span
                          className={`${!startDate || !endDate ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {period.display}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          {getPlaceholder("시작일")} –{" "}
                          {getPlaceholder("종료일")}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-sm mb-2 italic ${!skills ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      <span className="font-medium">주 사용 기술:</span>{" "}
                      {getDisplayValue("스킬", skills)}
                    </div>
                    <div
                      className={`text-base leading-relaxed whitespace-pre-line mb-4 ${!description ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
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
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Side Project
              </h2>
              {sideProjectFields.map((field) => {
                const projectName = formData[`${field}_프로젝트명`];
                const startDate = formData[`${field}_시작일`];
                const endDate = formData[`${field}_종료일`];
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

                  // 하나만 있으면 해당 값과 placeholder 반환
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

                const period = formatPeriod();

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3
                      className={`text-2xl font-bold mb-2 ${!projectName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("프로젝트명", projectName)}
                    </h3>
                    {period ? (
                      <div
                        className={`mb-2 ${!startDate || !endDate ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {period.display}
                      </div>
                    ) : (
                      <div className="mb-2 text-gray-400 dark:text-gray-500 italic">
                        {getPlaceholder("시작일")} – {getPlaceholder("종료일")}
                      </div>
                    )}
                    <div
                      className={`text-sm mb-2 italic ${!techStack ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      <span className="font-medium">기술 스택:</span>{" "}
                      {getDisplayValue("기술스택", techStack)}
                    </div>
                    <div
                      className={`text-base leading-relaxed whitespace-pre-line mb-4 ${!description ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
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
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
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

                  // 하나만 있으면 해당 값과 placeholder 반환
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

                const period = formatPeriod();

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3
                      className={`text-2xl font-bold mb-2 ${!institution ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("기관명", institution)}
                    </h3>
                    <div
                      className={`mb-2 ${!major ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("전공", major)}
                    </div>
                    {period ? (
                      <div
                        className={`mb-2 ${!startDate || !endDate ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {period.display}
                      </div>
                    ) : (
                      <div className="mb-2 text-gray-400 dark:text-gray-500 italic">
                        {getPlaceholder("시작일")} – {getPlaceholder("종료일")}
                      </div>
                    )}
                    <div
                      className={`text-base leading-relaxed whitespace-pre-line mb-4 ${!description ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("내용", description)}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}

        {/* etc 섹션 */}
        {(() => {
          const etcFields = dynamicItems["etc"].filter(
            (field) => selectedFields[field]
          );

          if (etcFields.length === 0) return null;

          return (
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                etc
              </h2>
              {etcFields.map((field) => {
                const activityName = formData[`${field}_활동명`];
                const link = formData[`${field}_링크`];
                const content = formData[`${field}_내용`];

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3
                      className={`text-2xl font-bold mb-2 ${!activityName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {link && activityName ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {getDisplayValue("활동명", activityName)}
                        </a>
                      ) : (
                        getDisplayValue("활동명", activityName)
                      )}
                    </h3>
                    <div
                      className={`text-base leading-relaxed whitespace-pre-line mb-4 ${!content ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("내용", content)}
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
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
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
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3
                      className={`text-2xl font-bold mb-2 ${!certificationName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("자격증명", certificationName)}
                    </h3>
                    <div
                      className={`mb-2 ${!issuer ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {getDisplayValue("발급기관", issuer)}
                    </div>
                    <div
                      className={`mb-2 ${!acquisitionDateFormatted ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {acquisitionDateFormatted || getPlaceholder("취득일")}
                    </div>
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
            <section className="mb-10">
              <hr className="border-gray-300 dark:border-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
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
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    <h3
                      className={`text-2xl font-bold mb-2 ${!testName ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {getDisplayValue("시험명", testName)}
                    </h3>
                    <div className="mb-2">
                      <span
                        className={`text-lg ${!score ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {getDisplayValue("점수", score)}
                      </span>
                      {testDateFormatted && (
                        <span className="text-gray-700 dark:text-gray-300 ml-4">
                          ({testDateFormatted})
                        </span>
                      )}
                      {!testDateFormatted && (
                        <span className="text-gray-400 dark:text-gray-500 italic ml-4">
                          ({getPlaceholder("응시일자")})
                        </span>
                      )}
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
              category !== "etc"
          )
          .map(([category]) => {
            const categoryFields = resumeCategories[
              category as keyof typeof resumeCategories
            ].filter((field) => selectedFields[field]);

            if (categoryFields.length === 0) return null;

            return (
              <section key={category} className="mb-10">
                <hr className="border-gray-300 dark:border-gray-600 mb-4" />
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  {category}
                </h2>
                <div className="space-y-2 text-base">
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
      <SidebarProvider defaultOpen={true}>
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
                  "etc",
                ].includes(category);
                const displayItems = isDynamicCategory
                  ? dynamicItems[category]
                  : items;

                return (
                  <SidebarGroup key={category}>
                    {isDynamicCategory ? (
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
                <h1 className="text-xl font-semibold">이력서 작성</h1>
              </div>
              {isPreviewMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewMode(false)}
                >
                  편집 모드로 돌아가기
                </Button>
              )}
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
                      <form className="space-y-6">
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

                            if (category === "etc") {
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
                            <Button type="submit" className="flex-1">
                              저장하기
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsPreviewMode(true);
                              }}
                            >
                              미리보기
                            </Button>
                          </div>
                        )}
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </DndContext>
  );
}
