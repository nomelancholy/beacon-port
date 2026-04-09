import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children?: string;
  words?: string[];
  className?: string;
  duration?: number;
  typeSpeed?: number;
  deleteSpeed?: number;
  delay?: number;
  pauseDelay?: number;
  loop?: boolean;
  as?: React.ElementType;
  startOnView?: boolean;
  showCursor?: boolean;
  blinkCursor?: boolean;
  cursorStyle?: "line" | "block" | "underscore";
  [key: string]: unknown;
}

export function TypingAnimation({
  children,
  words,
  className,
  duration = 100,
  typeSpeed,
  deleteSpeed,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as: Component = "span",
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = "line",
  ...props
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing");
  const elementRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(!startOnView);

  const wordsToAnimate = useMemo(
    () => words || (children ? [children] : []),
    [words, children]
  );
  const hasMultipleWords = wordsToAnimate.length > 1;

  const typingSpeed = typeSpeed || duration;
  const deletingSpeed = deleteSpeed || typingSpeed / 2;

  const shouldStart = startOnView ? isInView : true;

  useEffect(() => {
    if (!startOnView || typeof window === "undefined") return;
    const target = elementRef.current;
    if (!target || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!shouldStart || wordsToAnimate.length === 0) return;

    const timeoutDelay =
      delay > 0 && displayedText === ""
        ? delay
        : phase === "typing"
          ? typingSpeed
          : phase === "deleting"
            ? deletingSpeed
            : pauseDelay;

    const timeout = setTimeout(() => {
      const currentWord = wordsToAnimate[currentWordIndex] || "";
      const graphemes = Array.from(currentWord);

      switch (phase) {
        case "typing":
          if (currentCharIndex < graphemes.length) {
            setDisplayedText(graphemes.slice(0, currentCharIndex + 1).join(""));
            setCurrentCharIndex(currentCharIndex + 1);
          } else {
            if (hasMultipleWords || loop) {
              const isLastWord = currentWordIndex === wordsToAnimate.length - 1;
              if (!isLastWord || loop) {
                setPhase("pause");
              }
            }
          }
          break;

        case "pause":
          setPhase("deleting");
          break;

        case "deleting":
          if (currentCharIndex > 0) {
            setDisplayedText(graphemes.slice(0, currentCharIndex - 1).join(""));
            setCurrentCharIndex(currentCharIndex - 1);
          } else {
            const nextIndex = (currentWordIndex + 1) % wordsToAnimate.length;
            setCurrentWordIndex(nextIndex);
            setPhase("typing");
          }
          break;
      }
    }, timeoutDelay);

    return () => clearTimeout(timeout);
  }, [
    shouldStart,
    phase,
    currentCharIndex,
    currentWordIndex,
    displayedText,
    wordsToAnimate,
    hasMultipleWords,
    loop,
    typingSpeed,
    deletingSpeed,
    pauseDelay,
    delay,
  ]);

  const currentWordGraphemes = Array.from(
    wordsToAnimate[currentWordIndex] || ""
  );
  // 커서를 항상 표시하도록 수정 (완료 후에도)
  const shouldShowCursor = showCursor;

  const getCursorChar = () => {
    switch (cursorStyle) {
      case "block":
        return "▌";
      case "underscore":
        return "_";
      case "line":
      default:
        return "|";
    }
  };

  return (
    <Component
      ref={elementRef as React.Ref<HTMLElement>}
      className={cn("leading-[5rem] tracking-[-0.02em]", className)}
      {...props}
    >
      {displayedText}
      {shouldShowCursor && (
        <span
          className={cn("inline-block", blinkCursor && "animate-blink-cursor")}
        >
          {getCursorChar()}
        </span>
      )}
    </Component>
  );
}
