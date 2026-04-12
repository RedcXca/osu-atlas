"use client";

import { forwardRef, memo } from "react";

// starfield that rotates with the globe camera via CSS custom properties
// --cam-x and --cam-y are set directly on this element by the globe's RAF loop,
// bypassing React re-renders entirely
export const SpaceBackground = memo(forwardRef<HTMLDivElement>(function SpaceBackground(_props, ref) {
  return (
    <div
      className="space-bg"
      aria-hidden="true"
      ref={ref}
      style={{ ["--cam-x" as string]: 0, ["--cam-y" as string]: 0 }}
    >
      <div className="space-bg__nebula" />
      <div className="space-bg__stars">
        <div className="space-bg__layer space-bg__layer--far" />
        <div className="space-bg__layer space-bg__layer--mid" />
        <div className="space-bg__layer space-bg__layer--near" />
      </div>
    </div>
  );
}));
