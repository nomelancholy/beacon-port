import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useRouteError,
} from "react-router";
import { Loader2, AlertCircle, Home } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./components/ui/button";

import type { Route } from "./+types/root";
import "./app.css";
import { cn } from "~/lib/utils";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-white text-sm font-medium">로딩 중...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          isLoading && "pointer-events-none opacity-50",
          "transition-opacity duration-300"
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  // 에러 타입에 따른 메시지 설정
  const getErrorTitle = () => {
    if (isRouteError) {
      switch (error.status) {
        case 404:
          return "페이지를 찾을 수 없습니다";
        case 400:
          return "잘못된 요청입니다";
        case 401:
          return "인증이 필요합니다";
        case 403:
          return "접근 권한이 없습니다";
        case 500:
          return "서버 오류가 발생했습니다";
        default:
          return "오류가 발생했습니다";
      }
    }
    return "예상치 못한 오류가 발생했습니다";
  };

  const getErrorMessage = () => {
    if (isRouteError) {
      if (error.status === 404) {
        return "요청하신 페이지를 찾을 수 없습니다.";
      }
      return error.statusText || error.data?.message || "오류가 발생했습니다.";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "알 수 없는 오류가 발생했습니다.";
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {getErrorTitle()}
        </h1>

        <p className="text-gray-400 mb-6">{getErrorMessage()}</p>

        {isRouteError && error.status && (
          <p className="text-sm text-gray-500 mb-6">
            오류 코드: {error.status}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            asChild
            variant="outline"
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              홈으로
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            새로고침
          </Button>
        </div>
      </div>
    </div>
  );
}
