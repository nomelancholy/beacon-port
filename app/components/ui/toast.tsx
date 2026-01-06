import * as React from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "~/lib/utils";

export type ToastType = "success" | "error";

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation
    setIsVisible(true);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade-out animation before calling onClose
      setTimeout(() => {
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = type === "success" ? CheckCircle2 : XCircle;
  const bgColor =
    type === "success"
      ? "bg-green-500 dark:bg-green-600"
      : "bg-red-500 dark:bg-red-600";

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "min-w-[300px] max-w-md",
        "transition-all duration-300 ease-in-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
      )}
      role="alert"
    >
      <div className={cn("flex-shrink-0 rounded-full p-1", bgColor)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p
        className={cn(
          "flex-1 text-sm font-medium",
          type === "success"
            ? "text-gray-900 dark:text-white"
            : "text-gray-900 dark:text-white"
        )}
      >
        {message}
      </p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose();
          }, 300);
        }}
        className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });
    },
    []
  );

  const hideToast = React.useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
