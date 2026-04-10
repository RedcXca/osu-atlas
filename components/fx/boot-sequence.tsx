"use client";

import { useEffect, useState } from "react";
import { playGlitch } from "@/lib/audio/ui-sounds";

const BOOT_LINES = [
  "[SYSTEM] Initializing terminal...",
  "[SYSTEM] Loading geographic data...",
  "[SYSTEM] Establishing connection to osu! network...",
  "[SYSTEM] Operator interface ready."
];

const LINE_DELAY = 320;
const GLITCH_DURATION = 600;
const FADE_DELAY = 1800;

type BootSequenceProps = {
  children: React.ReactNode;
  onEnter?: () => void;
  skip?: boolean;
};

export function BootSequence({ children, onEnter, skip }: BootSequenceProps) {
  const [phase, setPhase] = useState<"boot" | "waiting" | "glitch" | "fade" | "done">(skip ? "done" : "boot");
  const [visibleLines, setVisibleLines] = useState(skip ? 0 : 1);

  // remove SSR placeholder once we take over
  useEffect(() => {
    document.getElementById("ssr-boot")?.remove();
  }, []);

  // type out boot lines (first line renders immediately to avoid hydration stall)
  useEffect(() => {
    if (phase !== "boot") return;

    let lineIndex = 1;
    const timer = setInterval(() => {
      lineIndex++;
      setVisibleLines(lineIndex);

      if (lineIndex >= BOOT_LINES.length) {
        clearInterval(timer);
        setTimeout(() => setPhase("waiting"), 400);
      }
    }, LINE_DELAY);

    return () => clearInterval(timer);
  }, [phase]);

  // wait for user gesture
  useEffect(() => {
    if (phase !== "waiting") return;

    function enter() {
      playGlitch();
      try { window.dispatchEvent(new CustomEvent("nier-boot-enter")); } catch { /* ignore */ }
      onEnter?.();
      setPhase("glitch");
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enter();
      }
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("click", enter);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("click", enter);
    };
  }, [phase]);

  // glitch burst then fade
  useEffect(() => {
    if (phase !== "glitch") return;
    playGlitch();
    const timer = setTimeout(() => setPhase("fade"), GLITCH_DURATION);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fade") return;
    const timer = setTimeout(() => setPhase("done"), FADE_DELAY);
    return () => clearTimeout(timer);
  }, [phase]);

  const showOverlay = phase !== "done";

  return (
    <>
      {/* children always render — the overlay covers them until fade */}
      {children}

      {showOverlay ? (
        <div className={`fx-boot ${phase === "glitch" ? "fx-boot--glitch" : ""} ${phase === "fade" ? "fx-boot--fade" : ""}`}>
          {phase === "glitch" ? (
            <div className="fx-boot__glitch-layer">
              {/* horizontal tear slices */}
              <div className="fx-boot__tear fx-boot__tear--1" />
              <div className="fx-boot__tear fx-boot__tear--2" />
              <div className="fx-boot__tear fx-boot__tear--3" />
              <div className="fx-boot__tear fx-boot__tear--4" />
              <div className="fx-boot__tear fx-boot__tear--5" />
            </div>
          ) : null}

          <div className="fx-boot__terminal">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="fx-boot__line">
                {line}
              </div>
            ))}
            {phase === "waiting" ? (
              <div className="fx-boot__enter">
                <span className="fx-boot__enter-text">[PRESS ENTER]</span>
                <span className="fx-boot__cursor">_</span>
              </div>
            ) : phase === "boot" && visibleLines > 0 ? (
              <span className="fx-boot__cursor">_</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
