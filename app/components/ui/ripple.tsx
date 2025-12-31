"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
}: RippleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const circles: HTMLDivElement[] = [];

    // Create ripple circles
    for (let i = 0; i < numCircles; i++) {
      const circle = document.createElement("div");
      const size = mainCircleSize + i * 70;
      const delay = i * 0.06;
      const duration = 3.5 + i * 0.1;

      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.borderRadius = "50%";
      circle.style.border = `1px solid rgba(255, 255, 255, ${mainCircleOpacity})`;
      circle.style.position = "absolute";
      circle.style.top = "50%";
      circle.style.left = "50%";
      circle.style.transform = "translate(-50%, -50%) scale(0)";
      circle.style.animation = `ripple ${duration}s ease-out ${delay}s infinite`;
      circle.style.opacity = "0";

      container.appendChild(circle);
      circles.push(circle);
    }

    // Add keyframes if not already present
    if (!document.getElementById("ripple-keyframes")) {
      const style = document.createElement("style");
      style.id = "ripple-keyframes";
      style.textContent = `
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            opacity: ${mainCircleOpacity};
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      circles.forEach((circle) => circle.remove());
    };
  }, [mainCircleSize, mainCircleOpacity, numCircles]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
    />
  );
}
