import * as React from "react";
import type { Route } from "./+types/profile";
import { useNavigate, useFetcher } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Toast, useToast } from "../../../components/ui/toast";
import { createSupabaseServerClient } from "~/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../database.types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "내 정보 - Beacon Port" },
    {
      name: "description",
      content: "내 정보를 확인하고 수정하세요",
    },
  ];
}

async function getProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const supabase = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const profile = await getProfile(supabase, user.id);
  return { profile };
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

    const formData = await request.formData();
    const intent = formData.get("intent");
    const nickname = formData.get("nickname") as string;

    if (intent === "update-nickname" && nickname) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ nickname, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    }
  }
  return { success: false };
};

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [nickname, setNickname] = React.useState(profile.nickname);
  const { toast, showToast, hideToast } = useToast();

  React.useEffect(() => {
    if (fetcher.data?.success) {
      setNickname(fetcher.data.profile.nickname);
      showToast("닉네임이 수정되었습니다.", "success");
    } else if (fetcher.data?.error) {
      showToast(`닉네임 수정 실패: ${fetcher.data.error}`, "error");
    }
  }, [fetcher.data, showToast]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetcher.submit({ intent: "update-nickname", nickname }, { method: "POST" });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/my-resume")}
              className="group text-white hover:text-white/90 hover:bg-gray-800/50 transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
              돌아가기
            </Button>
            <h1 className="text-3xl font-bold text-white">내 정보</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                프로필 정보
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                내 정보를 확인하고 수정할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fetcher.Form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    이메일
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    이메일은 변경할 수 없습니다
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="nickname"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    닉네임
                  </label>
                  <Input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="닉네임을 입력하세요"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/my-resume")}
                    className="cursor-pointer"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={fetcher.state === "submitting"}
                    className="gap-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    {fetcher.state === "submitting" ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </fetcher.Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
