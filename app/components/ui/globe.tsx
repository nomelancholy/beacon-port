import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import type { COBEOptions } from "cobe";
import { useMotionValue, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

const MOVEMENT_DAMPING = 1400;

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  const phiRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackLayerARef = useRef<HTMLDivElement>(null);
  const fallbackLayerBRef = useRef<HTMLDivElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState(0);
  const [initFailed, setInitFailed] = useState(false);

  const r = useMotionValue(0);
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  });

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      r.set(r.get() + delta / MOVEMENT_DAMPING);
    }
  };

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextSize = Math.floor(Math.min(rect.width, rect.height));
      setCanvasSize(nextSize > 0 ? nextSize : 0);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!initFailed || typeof window === "undefined") return;

    let frameId = 0;
    let angleA = 0;
    let angleB = 0;

    const tick = () => {
      angleA = (angleA + 0.3) % 360;
      angleB = (angleB - 0.45) % 360;

      if (fallbackLayerARef.current) {
        fallbackLayerARef.current.style.transform = `rotate(${angleA}deg)`;
      }
      if (fallbackLayerBRef.current) {
        fallbackLayerBRef.current.style.transform = `rotate(${angleB}deg)`;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [initFailed]);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current || canvasSize <= 0) {
      return;
    }

    let globe: ReturnType<typeof createGlobe> | null = null;
    const pixelWidth = Math.max(canvasSize * 2, 2);
    const pixelHeight = Math.max(canvasSize * 2, 2);

    try {
      globe = createGlobe(canvasRef.current, {
        ...config,
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        mapSamples: Math.min(config.mapSamples ?? 16000, 8000),
        width: pixelWidth,
        height: pixelHeight,
        onRender: (state) => {
          if (pointerInteracting.current === null) phiRef.current += 0.005;
          state.phi = phiRef.current + rs.get();
          state.width = pixelWidth;
          state.height = pixelHeight;
        },
      });
      setInitFailed(false);
      canvasRef.current.style.opacity = "1";
    } catch (error) {
      setInitFailed(true);
      canvasRef.current.style.opacity = "0";
      console.error("Failed to initialize globe:", error);
    }

    return () => {
      globe?.destroy();
    };
  }, [rs, config, canvasSize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 mx-auto aspect-square w-full max-w-[600px]",
        className
      )}
    >
      {initFailed && (
        <div className="absolute inset-0 z-0 flex items-center justify-center rounded-full bg-linear-to-br from-white/10 via-white/5 to-transparent">
          <div className="relative size-2/3 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),rgba(255,255,255,0.08)_42%,rgba(255,255,255,0)_72%)] shadow-[0_0_80px_rgba(255,255,255,0.08)]">
            <div
              ref={fallbackLayerARef}
              className="absolute inset-[8%] rounded-full opacity-70"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.55) 65deg, rgba(255,255,255,0) 130deg, rgba(255,255,255,0) 360deg)",
                maskImage:
                  "radial-gradient(circle, transparent 58%, black 60%, black 69%, transparent 71%)",
              }}
            />
            <div
              ref={fallbackLayerBRef}
              className="absolute inset-[16%] rounded-full opacity-60"
              style={{
                background:
                  "conic-gradient(from 180deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.35) 56deg, rgba(255,255,255,0) 120deg, rgba(255,255,255,0) 360deg)",
                maskImage:
                  "radial-gradient(circle, transparent 52%, black 54%, black 62%, transparent 64%)",
              }}
            />
            <div
              className="absolute left-1/2 top-[16%] size-2 -translate-x-1/2 rounded-full bg-white/80 blur-[1px]"
              style={{
                boxShadow:
                  "0 0 18px rgba(255,255,255,0.7), 0 0 32px rgba(255,255,255,0.45)",
              }}
            />
          </div>
        </div>
      )}
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 contain-[layout_paint_size]"
        )}
        width={Math.max(canvasSize * 2, 2)}
        height={Math.max(canvasSize * 2, 2)}
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
          updatePointerInteraction(e.clientX);
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
