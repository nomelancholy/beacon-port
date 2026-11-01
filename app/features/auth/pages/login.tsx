import * as React from "react";
import type { Route } from "./+types/login";
import { data as routeData, Link, useFetcher, redirect } from "react-router";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { createSupabaseServerClient } from "~/supabase/server";
import { SocialLoginButtons } from "../components/social-login-buttons";
import { startOAuth } from "../oauth.server";

// 로그인 입력 검증 스키마
const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

export function meta({}: Route.MetaArgs) {
  return [
    { title: "로그인 / 회원가입 - Beacon Port" },
    {
      name: "description",
      content: "Beacon Port에 로그인하거나 회원가입하세요",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const headers = new Headers();
  const supabase = createSupabaseServerClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const errorCode = new URL(request.url).searchParams.get("error");
  const messages: Record<string, string> = {
    oauth_cancelled: "소셜 로그인이 취소되었거나 거절되었습니다. 다시 시도해주세요.",
    auth_failed: "로그인을 완료하지 못했습니다. 다시 시도해주세요.",
    profile_unavailable: "회원 정보를 불러오지 못했습니다. 잠시 후 다시 로그인해주세요.",
  };
  const oauthError = errorCode && Object.hasOwn(messages, errorCode) ? messages[errorCode] : undefined;
  if (user && !oauthError) {
    return redirect("/my-resume", { headers });
  }

  return routeData({ oauthError }, { headers });
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method === "POST") {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const headers = new Headers();
    const supabase = createSupabaseServerClient(request, headers);

    // 1. 이메일 로그인
    if (intent === "email-login") {
      // zod로 입력 검증
      const result = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
      });

      if (!result.success) {
        return {
          success: false,
          errors: result.error.flatten().fieldErrors,
        };
      }

      const { email, password } = result.data;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Supabase 에러 메시지를 사용자 친화적인 메시지로 변환
          let errorMessage = "로그인에 실패했습니다";

          if (
            error.message.includes("Invalid login credentials") ||
            error.message.includes("invalid") ||
            error.code === "invalid_credentials"
          ) {
            errorMessage = "로그인에 실패했습니다";
          } else {
            errorMessage = "로그인 중 오류가 발생했습니다";
          }

          return {
            success: false,
            error: errorMessage,
          };
        }

        if (data.user) {
          // 로그인 성공 - headers에 쿠키가 자동으로 설정됨
          return redirect("/my-resume", { headers });
        }

        return {
          success: false,
          error: "로그인에 실패했습니다",
        };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error: "로그인 중 오류가 발생했습니다",
        };
      }
    }

    if (intent === "google-login" || intent === "github-login") {
      const provider = intent === "google-login" ? "google" : "github";
      return startOAuth(supabase, request, headers, provider);
    }
  }

  return { success: false };
};

export default function Login({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const [errors, setErrors] = React.useState<{
    email?: string[];
    password?: string[];
  }>({});
  const [loginError, setLoginError] = React.useState<string>("");

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.errors) {
        setErrors(fetcher.data.errors);
        setLoginError("");
      } else if (fetcher.data.error) {
        setLoginError(fetcher.data.error);
        setErrors({});
      }
    }
  }, [fetcher.data]);

  // 현재 제출 중인 intent 확인
  const formData = fetcher.formData as FormData | undefined;
  const currentIntent = formData ? formData.get("intent") : null;
  const isEmailLoggingIn =
    fetcher.state === "submitting" && currentIntent === "email-login";

  const handleEmailLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoginError("");
    const formData = new FormData(e.currentTarget);
    fetcher.submit(
      {
        intent: "email-login",
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      },
      { method: "POST" }
    );
  };

  return (
    <div className="flex min-h-page items-center justify-center bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            로그인 / 회원가입
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Beacon Port에 오신 것을 환영합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loaderData.oauthError && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {loaderData.oauthError}
            </p>
          )}
          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.email[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.password[0]}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isEmailLoggingIn}
            >
              {isEmailLoggingIn ? "로그인 중..." : "이메일로 로그인"}
            </Button>
            {loginError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {loginError}
                </p>
              </div>
            )}
          </form>

          {/* Sign up link */}
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              계정이 없으신가요?{" "}
            </span>
            <Link
              to="/signup"
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              가입하러 가기
            </Link>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                또는
              </span>
            </div>
          </div>

          <SocialLoginButtons mode="login" />

          {/* Back to Home */}
          <div className="text-center text-sm">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-400 hover:text-primary underline cursor-pointer"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
