"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InteractiveGridPatternProps {
  width?: number;
  height?: number;
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
}

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
}: InteractiveGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePosition([x, y]);
    };

    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  const [cols, rows] = squares;
  const totalSquares = cols * rows;

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0", className)}
      style={{
        backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                         linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
        backgroundSize: `${width}px ${height}px`,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={width}
              height={height}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {Array.from({ length: totalSquares }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * width;
          const y = row * height;

          // Calculate distance from mouse to square center
          let opacity = 0.1; // 기본 투명도 증가
          if (mousePosition) {
            const [mouseX, mouseY] = mousePosition;
            const squareCenterX = x + width / 2;
            const squareCenterY = y + height / 2;
            const distance = Math.sqrt(
              Math.pow(mouseX - squareCenterX, 2) +
                Math.pow(mouseY - squareCenterY, 2)
            );
            const maxDistance = 200; // 반응 범위 증가
            const calculatedOpacity = Math.max(0, 1 - distance / maxDistance);
            opacity = Math.max(0.1, 0.1 + calculatedOpacity * 0.4); // 최소 0.1, 최대 0.5
          }

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="rgba(255, 255, 255, 0.2)" // 기본 fill 투명도 증가
              className={cn(
                "transition-opacity duration-300",
                squaresClassName
              )}
              style={{
                opacity: opacity,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
