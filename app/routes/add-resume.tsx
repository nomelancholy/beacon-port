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
} from "lucide-react";
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
} from "../components/ui/sidebar";
import { Checkbox } from "../components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

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
    "이름",
    "Role",
    "이메일",
    "전화번호",
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
  Skill: [],
  etc: [],
};

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
    Skill: [],
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderFormField = (field: string) => {
    if (!selectedFields[field]) return null;

    // 동적 항목인지 확인 (Experience_xxx, Side Project_xxx 형식)
    const isDynamicExperience = field.startsWith("Experience_");
    const isDynamicSideProject = field.startsWith("Side Project_");
    const isDynamicEducation = field.startsWith("Education_");
    const isDynamicSkill = field.startsWith("Skill_");
    const isDynamicEtc = field.startsWith("etc_");

    // 상위 카테고리 체크 여부 확인 - 상위가 체크 해제되면 하위 항목도 숨김
    if (isDynamicExperience && !selectedFields["Experience"]) return null;
    if (isDynamicSideProject && !selectedFields["Side Project"]) return null;
    if (isDynamicEducation && !selectedFields["Education"]) return null;
    if (isDynamicSkill && !selectedFields["Skill"]) return null;
    if (isDynamicEtc && !selectedFields["etc"]) return null;

    // Experience 경력 필드인지 확인 (구버전 호환)
    const isExperienceField = field.startsWith("경력");
    // Side Project 필드인지 확인 (구버전 호환)
    const isSideProjectField = field.startsWith("사이드프로젝트");

    if (isDynamicExperience || isExperienceField) {
      const experienceNumber = isDynamicExperience
        ? field.replace("Experience_", "")
        : field.replace("경력", "");
      const displayName = isDynamicExperience
        ? `경력 ${dynamicItems["Experience"].indexOf(field) + 1}`
        : field;
      return (
        <div key={field} className="mb-8 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{displayName}</h3>
            {isDynamicExperience && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveDynamicItem("Experience", field)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${field}_회사명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                근무회사명
              </label>
              <Input
                id={`${field}_회사명`}
                name={`${field}_회사명`}
                value={formData[`${field}_회사명`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_회사명`, e.target.value)
                }
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${field}_Role`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Role
              </label>
              <Input
                id={`${field}_Role`}
                name={`${field}_Role`}
                value={formData[`${field}_Role`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_Role`, e.target.value)
                }
                placeholder="예: Python Backend, Python Chapter Lead"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${field}_시작일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  시작일
                </label>
                <Input
                  id={`${field}_시작일`}
                  name={`${field}_시작일`}
                  type="month"
                  value={formData[`${field}_시작일`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field}_시작일`, e.target.value)
                  }
                  placeholder="예: 2019-01"
                />
              </div>
              <div>
                <label
                  htmlFor={`${field}_종료일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  종료일
                </label>
                <Input
                  id={`${field}_종료일`}
                  name={`${field}_종료일`}
                  type="month"
                  value={formData[`${field}_종료일`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field}_종료일`, e.target.value)
                  }
                  placeholder="예: 2024-01 또는 현재"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`${field}_스킬`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                기술 스택
              </label>
              <Input
                id={`${field}_스킬`}
                name={`${field}_스킬`}
                value={formData[`${field}_스킬`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_스킬`, e.target.value)
                }
                placeholder="예: Python, Flask, AWS, Swift (쉼표로 구분)"
              />
            </div>
            <div>
              <label
                htmlFor={`${field}_작업내용`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                주요 작업 내용
              </label>
              <textarea
                id={`${field}_작업내용`}
                name={`${field}_작업내용`}
                rows={6}
                value={formData[`${field}_작업내용`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_작업내용`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="주요 작업 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      );
    }

    if (isDynamicSideProject || isSideProjectField) {
      const displayName = isDynamicSideProject
        ? `프로젝트 ${dynamicItems["Side Project"].indexOf(field) + 1}`
        : field;
      return (
        <div key={field} className="mb-8 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{displayName}</h3>
            {isDynamicSideProject && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveDynamicItem("Side Project", field)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${field}_프로젝트명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                사이드 프로젝트 명
              </label>
              <Input
                id={`${field}_프로젝트명`}
                name={`${field}_프로젝트명`}
                value={formData[`${field}_프로젝트명`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_프로젝트명`, e.target.value)
                }
                placeholder="프로젝트명을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${field}_시작일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  시작일
                </label>
                <Input
                  id={`${field}_시작일`}
                  name={`${field}_시작일`}
                  type="month"
                  value={formData[`${field}_시작일`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field}_시작일`, e.target.value)
                  }
                  placeholder="예: 2023-01"
                />
              </div>
              <div>
                <label
                  htmlFor={`${field}_종료일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  종료일
                </label>
                <Input
                  id={`${field}_종료일`}
                  name={`${field}_종료일`}
                  type="month"
                  value={formData[`${field}_종료일`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field}_종료일`, e.target.value)
                  }
                  placeholder="예: 2023-06 또는 현재"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`${field}_기술스택`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                기술 스택
              </label>
              <Input
                id={`${field}_기술스택`}
                name={`${field}_기술스택`}
                value={formData[`${field}_기술스택`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_기술스택`, e.target.value)
                }
                placeholder="예: React, TypeScript, Node.js (쉼표로 구분)"
              />
            </div>
            <div>
              <label
                htmlFor={`${field}_주요작업`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                주요 작업
              </label>
              <textarea
                id={`${field}_주요작업`}
                name={`${field}_주요작업`}
                rows={6}
                value={formData[`${field}_주요작업`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_주요작업`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="주요 작업 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      );
    }

    if (isDynamicEducation) {
      const displayName = `교육 ${dynamicItems["Education"].indexOf(field) + 1}`;
      return (
        <div key={field} className="mb-8 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{displayName}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleRemoveDynamicItem("Education", field)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${field}_기관명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                교육 기관명
              </label>
              <Input
                id={`${field}_기관명`}
                name={`${field}_기관명`}
                value={formData[`${field}_기관명`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_기관명`, e.target.value)
                }
                placeholder="교육 기관명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${field}_전공`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                전공
              </label>
              <Input
                id={`${field}_전공`}
                name={`${field}_전공`}
                value={formData[`${field}_전공`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_전공`, e.target.value)
                }
                placeholder="전공을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${field}_시작일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  시작일
                </label>
                <Input
                  id={`${field}_시작일`}
                  name={`${field}_시작일`}
                  type="month"
                  value={formData[`${field}_시작일`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field}_시작일`, e.target.value)
                  }
                  placeholder="예: 2018-04"
                />
              </div>
              <div>
                <label
                  htmlFor={`${field}_종료일`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  종료일
                </label>
                <Input
                  id={`${field}_종료일`}
                  name={`${field}_종료일`}
                  type="month"
                  value={formData[`${field}_종료일`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field}_종료일`, e.target.value)
                  }
                  placeholder="예: 2018-05"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor={`${field}_내용`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                교육 내용
              </label>
              <textarea
                id={`${field}_내용`}
                name={`${field}_내용`}
                rows={6}
                value={formData[`${field}_내용`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_내용`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="교육 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      );
    }

    if (isDynamicEtc) {
      const displayName = `활동 ${dynamicItems["etc"].indexOf(field) + 1}`;
      return (
        <div key={field} className="mb-8 p-6 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{displayName}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleRemoveDynamicItem("etc", field)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${field}_활동명`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                활동명
              </label>
              <Input
                id={`${field}_활동명`}
                name={`${field}_활동명`}
                value={formData[`${field}_활동명`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_활동명`, e.target.value)
                }
                placeholder="활동명을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor={`${field}_링크`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                링크
              </label>
              <Input
                id={`${field}_링크`}
                name={`${field}_링크`}
                type="url"
                value={formData[`${field}_링크`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_링크`, e.target.value)
                }
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label
                htmlFor={`${field}_내용`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                활동 내용
              </label>
              <textarea
                id={`${field}_내용`}
                name={`${field}_내용`}
                rows={6}
                value={formData[`${field}_내용`] || ""}
                onChange={(e) =>
                  handleInputChange(`${field}_내용`, e.target.value)
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="활동 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={field} className="mb-6">
        <label
          htmlFor={field}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {field}
        </label>
        {field === "Introduce" ? (
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
    // 아이콘으로 표시할 소셜 미디어 목록
    const socialLinks = [
      { key: "LinkedIn", icon: Linkedin, url: formData["LinkedIn"] },
      { key: "Instagram", icon: Instagram, url: formData["Instagram"] },
      { key: "Facebook", icon: Facebook, url: formData["Facebook"] },
      { key: "Github", icon: Github, url: formData["Github"] },
      { key: "Youtube", icon: Youtube, url: formData["Youtube"] },
    ].filter((item) => item.url);

    // 연락처 정보 (Email, Web, Phone)
    const contactInfo = [
      {
        key: "이메일",
        label: "Email",
        value: formData["이메일"],
        isLink: true,
        href: `mailto:${formData["이메일"]}`,
      },
      {
        key: "웹사이트",
        label: "Web",
        value: formData["웹사이트"],
        isLink: true,
        href: formData["웹사이트"],
      },
      {
        key: "전화번호",
        label: "Phone",
        value: formData["전화번호"],
        isLink: false,
      },
    ].filter((item) => item.value);

    return (
      <div className="max-w-3xl mx-auto text-gray-900 dark:text-gray-100">
        {/* 헤더: 이름/Role과 소셜 아이콘 */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {formData["이름"] && (
              <h1 className="text-5xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                {formData["이름"]}
              </h1>
            )}
            {formData["Role"] && (
              <h2 className="text-2xl font-normal text-gray-600 dark:text-gray-400">
                {formData["Role"]}
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
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    aria-label={key}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}

            {/* 연락처 정보 (Email, Web, Phone) */}
            {contactInfo.length > 0 && (
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300 text-right">
                {contactInfo.map(({ key, label, value, isLink, href }) => (
                  <div key={key}>
                    <span className="font-medium">{label}:</span>{" "}
                    {isLink ? (
                      <a
                        href={href}
                        target={key === "이메일" ? undefined : "_blank"}
                        rel={
                          key === "이메일" ? undefined : "noopener noreferrer"
                        }
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <span>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* About Me */}
        {formData["Introduce"] && (
          <section className="mb-10">
            <hr className="border-gray-300 dark:border-gray-600 mb-6" />
            <div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
              {formData["Introduce"]}
            </div>
          </section>
        )}

        {/* Experience 섹션 */}
        {(() => {
          const experienceFields = dynamicItems["Experience"].filter(
            (field) => selectedFields[field]
          );
          const hasExperienceData = experienceFields.some((field) => {
            const company = formData[`${field}_회사명`];
            const role = formData[`${field}_Role`];
            const startDate = formData[`${field}_시작일`];
            const endDate = formData[`${field}_종료일`];
            const skills = formData[`${field}_스킬`];
            const description = formData[`${field}_작업내용`];
            return (
              company || role || startDate || endDate || skills || description
            );
          });

          if (!hasExperienceData) return null;

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
                  if (!startDate && !endDate) return null;
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return "";
                    const [year, month] = dateStr.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  };
                  const start = formatDate(startDate);
                  const end = endDate ? formatDate(endDate) : "현재";
                  return start && end ? `${start} – ${end}` : start || end;
                };

                const period = formatPeriod();

                if (!company && !role && !period && !skills && !description) {
                  return null;
                }

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    {company && (
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        {company}
                      </h3>
                    )}
                    {(role || period) && (
                      <div className="mb-2">
                        {role && (
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {role}
                          </span>
                        )}
                        {role && period && <span className="mx-2">•</span>}
                        {period && (
                          <span className="text-gray-700 dark:text-gray-300">
                            {period}
                          </span>
                        )}
                      </div>
                    )}
                    {skills && (
                      <div className="text-sm text-gray-600 mb-2 dark:text-gray-400 italic">
                        <span className="font-medium">주 사용 기술:</span>{" "}
                        {skills}
                      </div>
                    )}
                    {description && (
                      <div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300 mb-4">
                        {description}
                      </div>
                    )}
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
          const hasSideProjectData = sideProjectFields.some((field) => {
            const projectName = formData[`${field}_프로젝트명`];
            const startDate = formData[`${field}_시작일`];
            const endDate = formData[`${field}_종료일`];
            const techStack = formData[`${field}_기술스택`];
            const description = formData[`${field}_주요작업`];
            return (
              projectName || startDate || endDate || techStack || description
            );
          });

          if (!hasSideProjectData) return null;

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
                  if (!startDate && !endDate) return null;
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return "";
                    const [year, month] = dateStr.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  };
                  const start = formatDate(startDate);
                  const end = endDate ? formatDate(endDate) : "현재";
                  return start && end ? `${start} – ${end}` : start || end;
                };

                const period = formatPeriod();

                if (!projectName && !period && !techStack && !description) {
                  return null;
                }

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    {projectName && (
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        {projectName}
                      </h3>
                    )}
                    {period && (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {period}
                      </div>
                    )}
                    {techStack && (
                      <div className="text-sm text-gray-600 mb-2 dark:text-gray-400 italic">
                        <span className="font-medium">기술 스택:</span>{" "}
                        {techStack}
                      </div>
                    )}
                    {description && (
                      <div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300 mb-4">
                        {description}
                      </div>
                    )}
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
          const hasEducationData = educationFields.some((field) => {
            const institution = formData[`${field}_기관명`];
            const major = formData[`${field}_전공`];
            const startDate = formData[`${field}_시작일`];
            const endDate = formData[`${field}_종료일`];
            const description = formData[`${field}_내용`];
            return institution || major || startDate || endDate || description;
          });

          if (!hasEducationData) return null;

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
                  if (!startDate && !endDate) return null;
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return "";
                    const [year, month] = dateStr.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  };
                  const start = formatDate(startDate);
                  const end = endDate ? formatDate(endDate) : "현재";
                  return start && end ? `${start} – ${end}` : start || end;
                };

                const period = formatPeriod();

                if (!institution && !major && !period && !description) {
                  return null;
                }

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    {institution && (
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        {institution}
                      </h3>
                    )}
                    {major && (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {major}
                      </div>
                    )}
                    {period && (
                      <div className="mb-2 text-gray-700 dark:text-gray-300">
                        {period}
                      </div>
                    )}
                    {description && (
                      <div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300 mb-4">
                        {description}
                      </div>
                    )}
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
          const hasEtcData = etcFields.some((field) => {
            const activityName = formData[`${field}_활동명`];
            const link = formData[`${field}_링크`];
            const content = formData[`${field}_내용`];
            return activityName || link || content;
          });

          if (!hasEtcData) return null;

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

                if (!activityName && !link && !content) {
                  return null;
                }

                return (
                  <div key={field} className="mb-10">
                    <hr className="border-gray-300 dark:border-gray-600 mb-6" />
                    {activityName && (
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {activityName}
                          </a>
                        ) : (
                          activityName
                        )}
                      </h3>
                    )}
                    {content && (
                      <div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300 mb-4">
                        {content}
                      </div>
                    )}
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
              category !== "etc"
          )
          .map(([category]) => {
            const categoryFields = resumeCategories[
              category as keyof typeof resumeCategories
            ].filter((field) => selectedFields[field] && formData[field]);

            if (categoryFields.length === 0) return null;

            return (
              <section key={category} className="mb-10">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  {category}
                </h2>
                <div className="space-y-2 text-base text-gray-700 dark:text-gray-300">
                  {categoryFields.map((field) => (
                    <div key={field} className="leading-relaxed">
                      {formData[field]}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    );
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="border-r border-sidebar-border bg-white">
          <SidebarContent>
            {Object.entries(resumeCategories).map(([category, items]) => {
              const isDynamicCategory = [
                "Experience",
                "Side Project",
                "Education",
                "Skill",
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
                          onCheckedChange={() => handleCheckboxChange(category)}
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
                                      checked={selectedFields[itemId] || false}
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
                                            : category === "Skill"
                                              ? `스킬 ${index + 1}`
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
                                  onClick={() => handleAddDynamicItem(category)}
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
                      왼쪽 사이드바에서 표시할 항목을 선택하고 정보를 입력하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6">
                      {/* About Me 필드들 */}
                      {resumeCategories["About Me"]
                        .filter((field) => selectedFields[field])
                        .map((field) => renderFormField(field))}

                      {/* 동적 카테고리 필드들 */}
                      {Object.entries(dynamicItems).map(([category, items]) =>
                        items
                          .filter((itemId) => selectedFields[itemId])
                          .map((itemId) => renderFormField(itemId))
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
  );
}
