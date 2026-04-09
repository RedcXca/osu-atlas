"use client";

import { useEffect, useRef, type ReactNode } from "react";

type GlitchFlickerProps = {
  children: ReactNode;
  interval?: number; // ms between glitches
};

// wraps content and occasionally slices it horizontally with displacement
export function GlitchFlicker({ children, interval = 6000 }: Readonly<GlitchFlickerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function triggerGlitch() {
      if (!el) return;

      // random number of slices (1-3)
      const sliceCount = 1 + Math.floor(Math.random() * 3);
      const clipParts: string[] = [];
      const offsets: number[] = [];

      for (let i = 0; i < sliceCount; i++) {
        const y1 = Math.random() * 100;
        const y2 = y1 + 2 + Math.random() * 8;
        clipParts.push(`0% ${y1}%, 100% ${y1}%, 100% ${y2}%, 0% ${y2}%`);
        offsets.push((Math.random() - 0.5) * 12);
      }

      // create glitch overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 100;
        overflow: hidden;
      `;

      for (let i = 0; i < sliceCount; i++) {
        const slice = document.createElement("div");
        const y1 = Math.random() * 90;
        const height = 2 + Math.random() * 6;
        slice.style.cssText = `
          position: absolute;
          top: ${y1}%;
          left: 0;
          right: 0;
          height: ${height}%;
          background: inherit;
          transform: translateX(${offsets[i]}px);
          opacity: 0.6;
          mix-blend-mode: difference;
          background-color: rgba(200, 192, 184, 0.08);
        `;
        overlay.appendChild(slice);
      }

      el.style.position = "relative";
      el.appendChild(overlay);

      // hold for 50-150ms then remove
      const duration = 50 + Math.random() * 100;
      setTimeout(() => {
        overlay.remove();
      }, duration);
    }

    // randomize the initial delay
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay = interval + (Math.random() - 0.5) * interval * 0.6;
      timeoutId = setTimeout(() => {
        triggerGlitch();
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [interval]);

  return (
    <div ref={containerRef} className="fx-glitch-flicker">
      {children}
    </div>
  );
}
