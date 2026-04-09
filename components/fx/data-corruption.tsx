"use client";

import { useEffect, useRef, useState } from "react";

type DataCorruptionProps = {
  text: string;
  interval?: number; // ms between corruptions
  className?: string;
};

const GLITCH_CHARS = "▓░▒█▌▐▄▀■□";

// text-level effect — occasionally replaces characters with block glyphs
export function DataCorruption({ text, interval = 8000, className }: Readonly<DataCorruptionProps>) {
  const [display, setDisplay] = useState(text);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setDisplay(text);
  }, [text]);

  useEffect(() => {
    function corrupt() {
      const chars = text.split("");
      const corruptCount = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < corruptCount; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }

      setDisplay(chars.join(""));

      // restore after 80-200ms
      setTimeout(() => {
        setDisplay(text);
      }, 80 + Math.random() * 120);
    }

    function scheduleNext() {
      const delay = interval + (Math.random() - 0.5) * interval * 0.4;
      timeoutRef.current = setTimeout(() => {
        corrupt();
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => clearTimeout(timeoutRef.current);
  }, [text, interval]);

  return <span className={className}>{display}</span>;
}
