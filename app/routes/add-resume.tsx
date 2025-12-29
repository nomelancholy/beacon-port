import * as React from "react";
import type { Route } from "./+types/add-resume";
import {
  ChevronDown,
  Github,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
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

        {/* 다른 섹션들도 여기에 추가 가능 */}
        {Object.entries(resumeCategories)
          .filter(([category]) => category !== "About Me")
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
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            {Object.entries(resumeCategories).map(([category, items]) => (
              <SidebarGroup key={category}>
                <Collapsible defaultOpen={category === "About Me"}>
                  <div className="px-2">
                    <CollapsibleTrigger
                      className="flex w-full items-center justify-between px-2 py-2 rounded-md text-xs font-medium transition-colors hover:bg-accent cursor-pointer"
                      style={{ color: "hsl(var(--sidebar-foreground) / 0.7)" }}
                    >
                      <span>{category}</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
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
                              <div className="flex items-center gap-2 px-2 py-1.5">
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
                        {items.length === 0 && (
                          <SidebarMenuItem>
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              하위 항목이 없습니다
                            </div>
                          </SidebarMenuItem>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex h-16 items-center justify-between gap-2 border-b px-4">
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

          <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
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
                      {Object.values(resumeCategories)
                        .flat()
                        .map((field) => renderFormField(field))}

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
