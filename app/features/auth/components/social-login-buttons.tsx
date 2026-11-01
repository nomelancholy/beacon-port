import { Form, useActionData } from "react-router";
import { Github } from "lucide-react";
import { Button } from "../../../components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.33-2.59Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.33 2.59C7.19 7.71 9.4 5.95 12 5.95Z" />
    </svg>
  );
}

export function SocialLoginButtons({ mode, action }: { mode: "login" | "signup"; action?: string }) {
  const actionData = useActionData<{ error?: string }>();
  const label = mode === "signup" ? "시작하기" : "로그인";
  return (
    <Form method="post" action={action} reloadDocument className="space-y-3" aria-label="소셜 로그인">
      <Button type="submit" name="intent" value={`google-${mode}`} variant="outline"
        className="h-12 w-full cursor-pointer gap-3 border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-900">
        <GoogleIcon />
        Google로 {label}
      </Button>
      <Button type="submit" name="intent" value={`github-${mode}`} variant="outline"
        className="h-12 w-full cursor-pointer gap-3 border-gray-600 bg-gray-800 text-white shadow-sm hover:bg-gray-700 hover:text-white">
        <Github aria-hidden="true" />
        GitHub로 {label}
      </Button>
      {actionData?.error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{actionData.error}</p>}
    </Form>
  );
}
