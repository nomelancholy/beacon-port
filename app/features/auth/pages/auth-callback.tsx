import * as React from "react";
import type { Route } from "./+types/auth-callback";
import { useLoaderData, useNavigate } from "react-router";
import { createSupabaseServerClient } from "~/supabase/server";
import { redirect } from "react-router";
import { Loader2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "인증 중 - Beacon Port" },
    {
      name: "description",
      content: "인증을 처리하는 중입니다",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const headers = new Headers();
  const supabase = createSupabaseServerClient(request, headers);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");

  // URL에 에러 파라미터가 있으면 에러 정보 반환
  if (errorParam) {
    return { error: errorParam };
  }

  if (code) {
    // OAuth 코드를 세션으로 교환 (이 과정에서 headers에 Set-Cookie가 자동으로 추가됨)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback error:", error);
      return redirect("/login?error=auth_failed");
    }

    if (data.user) {
      // 프로필 정보 조회 (닉네임 확인용)
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", data.user.id)
        .single();

      // 로그인 성공 - headers에 쿠키가 자동으로 설정됨
      // 닉네임이 없으면 온보딩 페이지로, 있으면 목록으로
      const nextPath = profile?.nickname ? "/my-resume" : "/profile";
      return redirect(nextPath, { headers });
    }
  }

  // 에러가 있거나 코드가 없으면 로그인 페이지로 리다이렉트
  return redirect("/login");
};

export default function AuthCallback() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (loaderData && "error" in loaderData && loaderData.error) {
      // 에러가 있으면 잠시 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [loaderData, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-center space-y-4">
        {loaderData && "error" in loaderData && loaderData.error ? (
          <>
            <p className="text-white text-xl mb-4">
              인증 중 오류가 발생했습니다
            </p>
            <p className="text-white/70 text-sm mb-4">
              로그인 페이지로 이동합니다...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
            <p className="text-white text-xl">인증 중...</p>
            <p className="text-white/70 text-sm">
              잠시만 기다려주세요
            </p>
          </>
        )}
      </div>
    </div>
  );
}
