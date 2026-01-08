import * as React from "react";
import type { Route } from "./+types/signup";
import { Link, useFetcher, redirect } from "react-router";
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
import { Loader2 } from "lucide-react";
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
  const supabase = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인되어 있으면 나의 이력서 페이지로 리다이렉트
  if (user) {
    return redirect("/my-resume");
  }

  return {};
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

    // 2. GitHub 회원가입
    if (intent === "github-signup") {
      try {
        const url = new URL(request.url);
        const origin = url.origin;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${origin}/auth/callback`,
          },
        });

        if (error) {
          return {
            success: false,
            error: "GitHub 회원가입 중 오류가 발생했습니다",
          };
        }

        const redirectUrl = data.url;
        if (redirectUrl && typeof redirectUrl === "string") {
          // GitHub OAuth URL로 리다이렉트
          // 중요: headers를 포함해야 PKCE code verifier가 브라우저 쿠키에 저장됩니다
          return redirect(redirectUrl, { headers });
        }

        return {
          success: false,
          error: "GitHub 회원가입 URL을 생성할 수 없습니다",
        };
      } catch (error) {
        console.error("GitHub signup error:", error);
        return {
          success: false,
          error: "GitHub 회원가입 중 오류가 발생했습니다",
        };
      }
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
  const [isGithubLoading, setIsGithubLoading] = React.useState(false);

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.errors) {
        setErrors(fetcher.data.errors);
        setSignupError("");
        setIsGithubLoading(false);
      } else if (fetcher.data.error) {
        setSignupError(fetcher.data.error);
        setErrors({});
        setIsGithubLoading(false);
      }
    }
  }, [fetcher.data]);

  // fetcher.state가 변경될 때도 로딩 상태 업데이트
  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.error) {
      setIsGithubLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  // 현재 제출 중인 intent 확인
  const formData = fetcher.formData as FormData | undefined;
  const currentIntent = formData ? formData.get("intent") : null;
  const isEmailSigningUp =
    fetcher.state === "submitting" && currentIntent === "email-signup";
  const isGithubSigningUp =
    fetcher.state === "submitting" && currentIntent === "github-signup";

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

  const handleGithubSignup = () => {
    setIsGithubLoading(true);
    fetcher.submit({ intent: "github-signup" }, { method: "POST" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
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

          {/* Social Signup Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              onClick={handleGithubSignup}
              disabled={isGithubLoading || isGithubSigningUp}
            >
              {isGithubLoading || isGithubSigningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  GitHub 가입 중...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.425 22 12.017 22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub로 가입하기
                </>
              )}
            </Button>
          </div>

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
