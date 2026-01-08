import * as React from "react";
import type { Route } from "./+types/my-resume";
import { Link, useNavigate, useFetcher } from "react-router";
import { Plus, LogOut, User } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { getResumes } from "../queries";
import { createSupabaseServerClient } from "~/supabase/server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "나의 이력서 - Beacon Port" },
    {
      name: "description",
      content: "나의 이력서를 관리하세요",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const supabase = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const resumes = await getResumes(supabase, user.id);
  console.log("resumes :>> ", resumes);
  return { resumes };
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method === "POST") {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "logout") {
      const headers = new Headers();
      const supabase = createSupabaseServerClient(request, headers);
      await supabase.auth.signOut();
      // 로그아웃 시 쿠키 삭제를 위해 headers를 포함한 리다이렉트
      return redirect("/login", { headers });
    }
  }
  return { success: false };
};

export default function MyResume({ loaderData }: Route.ComponentProps) {
  const { resumes } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher();

  React.useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/");
    }
  }, [fetcher.data, navigate]);

  const handleAddResume = () => {
    navigate("/add-resume");
  };

  const handleResumeClick = (id: string) => {
    navigate(`/resume/${id}`);
  };

  const handleLogout = () => {
    fetcher.submit({ intent: "logout" }, { method: "POST" });
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900">
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white whitespace-nowrap">
                나의 이력서
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Button
                onClick={handleAddResume}
                size="sm"
                className="gap-1 sm:gap-2 text-white cursor-pointer hover:opacity-90 transition-opacity text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">이력서 추가</span>
                <span className="sm:hidden">추가</span>
              </Button>
              <Button
                onClick={handleProfile}
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 cursor-pointer transition-all text-xs sm:text-sm"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">내 정보</span>
                <span className="sm:hidden">정보</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 text-white border-gray-600 hover:bg-gray-800 hover:text-white hover:border-gray-500 cursor-pointer transition-all text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">로그아웃</span>
                <span className="sm:hidden">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="mb-4 text-lg text-white/90">
              등록된 이력서가 없습니다
            </p>
            <Button
              onClick={handleAddResume}
              className="gap-2 text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />첫 이력서 추가하기
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <Card
                key={resume.id}
                className="cursor-pointer border-gray-700 bg-gray-800 hover:border-gray-600 hover:shadow-lg transition-all"
                onClick={() => resume.id && handleResumeClick(resume.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-white">
                        {resume.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-white/70">
                        최종 수정:{" "}
                        {resume.updated_at
                          ? new Date(resume.updated_at).toLocaleDateString(
                              "ko-KR"
                            )
                          : "날짜 없음"}
                      </CardDescription>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        resume.is_public
                          ? "bg-green-900/50 text-green-300"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {resume.is_public ? "공개" : "비공개"}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
