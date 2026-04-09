"use client";

// chromatic aberration — SVG filter definition
// the filter exists in the DOM for per-element use via filter: url(#chromatic-aberration)
// global color fringing is handled by CSS text-shadow / box-shadow in globals.css
export function ChromaticAberration() {
  return (
    <svg className="fx-chroma-svg" aria-hidden="true">
      <defs>
        <filter id="chromatic-aberration" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            in="SourceGraphic"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="red"
          />
          <feColorMatrix
            type="matrix"
            in="SourceGraphic"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="green"
          />
          <feColorMatrix
            type="matrix"
            in="SourceGraphic"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="blue"
          />
          <feOffset in="red" dx="0.8" dy="0" result="red-shifted" />
          <feOffset in="blue" dx="-0.8" dy="0" result="blue-shifted" />
          <feBlend in="red-shifted" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue-shifted" mode="screen" result="final" />
        </filter>
      </defs>
    </svg>
  );
}
