import { Form, useActionData } from "react-router";
import { Button } from "../../../components/ui/button";

export function SocialLoginButtons({ mode }: { mode: "login" | "signup" }) {
  const actionData = useActionData<{ error?: string }>();
  return (
    <Form method="post" reloadDocument className="space-y-3">
      <Button type="submit" name="intent" value={`google-${mode}`} variant="outline" className="w-full cursor-pointer">
        Google로 계속하기
      </Button>
      <Button type="submit" name="intent" value={`github-${mode}`} variant="outline" className="w-full cursor-pointer">
        GitHub로 계속하기
      </Button>
      {actionData?.error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{actionData.error}</p>}
    </Form>
  );
}
