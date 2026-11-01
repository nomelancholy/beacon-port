import * as React from "react";
import type { Route } from "./+types/signup";
import { data as routeData, Link, useFetcher, redirect } from "react-router";
import { createSupabaseServerClient } from "~/supabase/server";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { SocialLoginButtons } from "../components/social-login-buttons";
import { startOAuth } from "../oauth.server";
import { z } from "zod";

// 회원가입 입력 검증 스키마
const signupSchema = z.object({
  nickname: z.string().min(1, "닉네임을 입력해주세요"),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .refine(
      (password) => /[a-zA-Z]/.test(password),
      "비밀번호에 영문이 포함되어야 합니다"
    )
    .refine(
      (password) => /[0-9]/.test(password),
      "비밀번호에 숫자가 포함되어야 합니다"
    )
    .refine(
      (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      "비밀번호에 특수문자가 포함되어야 합니다"
    ),
});

export function meta({}: Route.MetaArgs) {
  return [
    { title: "회원가입 - Beacon Port" },
    {
      name: "description",
      content: "Beacon Port에 회원가입하세요",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const headers = new Headers();
  const supabase = createSupabaseServerClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있으면 나의 이력서 페이지로 리다이렉트
  if (user) {
    return redirect("/my-resume", { headers });
  }

  return routeData({}, { headers });
};

export const action = async ({ request }: Route.ActionArgs) => {
  if (request.method === "POST") {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const headers = new Headers();
    const supabase = createSupabaseServerClient(request, headers);

    // 1. 이메일 회원가입
    if (intent === "email-signup") {
      // zod로 입력 검증
      const result = signupSchema.safeParse({
        nickname: formData.get("nickname"),
        email: formData.get("email"),
        password: formData.get("password"),
      });

      if (!result.success) {
        return {
          success: false,
          errors: result.error.flatten().fieldErrors,
        };
      }

      const { email, password, nickname } = result.data;
      const confirmPassword = formData.get("confirmPassword") as string;

      // 비밀번호 확인 검증
      if (password !== confirmPassword) {
        return {
          success: false,
          errors: {
            password: ["비밀번호가 일치하지 않습니다"],
          },
        };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname,
            },
          },
        });

        if (error) {
          // Supabase 에러 메시지를 사용자 친화적인 메시지로 변환
          let errorMessage = "회원가입에 실패했습니다";

          if (
            error.message.includes("already registered") ||
            error.message.includes("already exists")
          ) {
            errorMessage = "이미 등록된 이메일입니다";
          } else if (error.message.includes("password")) {
            errorMessage = "비밀번호는 최소 6자 이상이어야 합니다";
          } else if (error.message.includes("email")) {
            errorMessage = "올바른 이메일 형식이 아닙니다";
          }

          return {
            success: false,
            error: errorMessage,
          };
        }

        if (data.user) {
          // 회원가입 성공 - headers에 쿠키가 자동으로 설정됨
          return redirect("/my-resume", { headers });
        }

        return {
          success: false,
          error: "회원가입에 실패했습니다",
        };
      } catch (error) {
        console.error("Signup error:", error);
        return {
          success: false,
          error: "회원가입 중 오류가 발생했습니다",
        };
      }
    }

    if (intent === "google-signup" || intent === "github-signup") {
      const provider = intent === "google-signup" ? "google" : "github";
      return startOAuth(supabase, request, headers, provider);
    }
  }

  return { success: false };
};

export default function Signup() {
  const fetcher = useFetcher();
  const [errors, setErrors] = React.useState<{
    nickname?: string[];
    email?: string[];
    password?: string[];
  }>({});
  const [signupError, setSignupError] = React.useState<string>("");
  const [passwordError, setPasswordError] = React.useState("");

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.errors) {
        setErrors(fetcher.data.errors);
        setSignupError("");
      } else if (fetcher.data.error) {
        setSignupError(fetcher.data.error);
        setErrors({});
      }
    }
  }, [fetcher.data]);

  // 현재 제출 중인 intent 확인
  const formData = fetcher.formData as FormData | undefined;
  const currentIntent = formData ? formData.get("intent") : null;
  const isEmailSigningUp =
    fetcher.state === "submitting" && currentIntent === "email-signup";

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSignupError("");
    setPasswordError("");
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    fetcher.submit(
      {
        intent: "email-signup",
        nickname: formData.get("nickname") as string,
        email: formData.get("email") as string,
        password: password,
        confirmPassword: confirmPassword,
      },
      { method: "POST" }
    );
  };

  return (
    <div className="flex min-h-page items-center justify-center bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            회원가입
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Beacon Port에 가입하고 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
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
                placeholder="닉네임을 입력하세요"
                required
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.nickname && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {errors.nickname[0]}
                </p>
              )}
            </div>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                비밀번호는 8자 이상이어야 하며 영문, 숫자, 특수문자가 포함되어야
                합니다
              </p>
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
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                required
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {passwordError && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {passwordError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isEmailSigningUp}
            >
              {isEmailSigningUp ? "회원가입 중..." : "회원가입"}
            </Button>
            {signupError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {signupError}
                </p>
              </div>
            )}
          </form>

          {/* Login link */}
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{" "}
            </span>
            <Link
              to="/login"
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              로그인하기
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

          <SocialLoginButtons mode="signup" />

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
