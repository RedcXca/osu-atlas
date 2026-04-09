"use client";

import { useEffect, useState } from "react";

// NieR-style holographic HUD elements floating around the globe
// purely decorative — no interaction, no data
export function HudOverlay() {
  const [tick, setTick] = useState(0);

  // slow tick for cycling data readouts
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);

  const readouts = [
    ["SYS.STATUS", "NOMINAL"],
    ["UPLINK", "ACTIVE"],
    ["SIGNAL", `${(92 + (tick % 7)).toFixed(1)}%`],
    ["FREQ", `${(140 + (tick % 20) * 0.3).toFixed(1)}MHz`],
    ["LAT.SYNC", "OK"],
    ["NODES", `${12 + (tick % 5)}`],
  ];

  const r0 = readouts[(tick) % readouts.length];
  const r1 = readouts[(tick + 3) % readouts.length];

  return (
    <div className="hud-overlay" aria-hidden="true">
      {/* corner targeting brackets */}
      <svg className="hud-corner hud-corner--tl" viewBox="0 0 60 60" width="60" height="60">
        <path d="M2 20 L2 2 L20 2" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M6 14 L6 6 L14 6" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg className="hud-corner hud-corner--tr" viewBox="0 0 60 60" width="60" height="60">
        <path d="M40 2 L58 2 L58 20" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M46 6 L54 6 L54 14" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg className="hud-corner hud-corner--bl" viewBox="0 0 60 60" width="60" height="60">
        <path d="M2 40 L2 58 L20 58" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M6 46 L6 54 L14 54" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <svg className="hud-corner hud-corner--br" viewBox="0 0 60 60" width="60" height="60">
        <path d="M40 58 L58 58 L58 40" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M46 54 L54 54 L54 46" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* circular targeting reticle — top right area */}
      <svg className="hud-reticle" viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="40" cy="40" r="24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <line x1="40" y1="2" x2="40" y2="18" stroke="currentColor" strokeWidth="0.5" />
        <line x1="40" y1="62" x2="40" y2="78" stroke="currentColor" strokeWidth="0.5" />
        <line x1="2" y1="40" x2="18" y2="40" stroke="currentColor" strokeWidth="0.5" />
        <line x1="62" y1="40" x2="78" y2="40" stroke="currentColor" strokeWidth="0.5" />
        {/* rotating tick */}
        <g className="hud-reticle__spin">
          <line x1="40" y1="6" x2="40" y2="10" stroke="currentColor" strokeWidth="0.8" />
          <line x1="40" y1="70" x2="40" y2="74" stroke="currentColor" strokeWidth="0.8" />
        </g>
        <circle cx="40" cy="40" r="2" fill="currentColor" />
      </svg>

      {/* data readout block — bottom left */}
      <div className="hud-readout hud-readout--bl">
        <span className="hud-readout__label">{r0[0]}</span>
        <span className="hud-readout__value">{r0[1]}</span>
        <span className="hud-readout__bar" />
      </div>

      {/* data readout block — top left */}
      <div className="hud-readout hud-readout--tl">
        <span className="hud-readout__label">{r1[0]}</span>
        <span className="hud-readout__value">{r1[1]}</span>
        <span className="hud-readout__bar" />
      </div>

      {/* horizontal grid line with tick marks */}
      <svg className="hud-grid-h" viewBox="0 0 200 8" preserveAspectRatio="none">
        <line x1="0" y1="4" x2="200" y2="4" stroke="currentColor" strokeWidth="0.3" />
        {Array.from({ length: 20 }, (_, i) => (
          <line key={i} x1={i * 10} y1={2} x2={i * 10} y2={6} stroke="currentColor" strokeWidth="0.3" />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <line key={`m${i}`} x1={i * 50} y1={0} x2={i * 50} y2={8} stroke="currentColor" strokeWidth="0.5" />
        ))}
      </svg>

      {/* vertical data strip — right side */}
      <div className="hud-strip">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="hud-strip__block" style={{ opacity: 0.15 + (((tick + i) % 8) / 8) * 0.4 }} />
        ))}
      </div>

      {/* small diamond marker */}
      <svg className="hud-diamond" viewBox="0 0 12 12" width="12" height="12">
        <polygon points="6,1 11,6 6,11 1,6" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    </div>
  );
}
