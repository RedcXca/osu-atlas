"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { CountryFlag } from "@/components/ui/country-flag";
import { LOCALE_FLAGS, LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/translations";

const LOCALE_OPTIONS: { flag: string; label: string; value: Locale }[] = LOCALES.map((locale) => ({
  flag: LOCALE_FLAGS[locale],
  label: LOCALE_LABELS[locale],
  value: locale
}));

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="language-selector" data-open={isOpen} ref={containerRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Language: ${LOCALE_LABELS[locale]}`}
        className="language-selector__trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="language-selector__globe"
          viewBox="0 0 16 16"
        >
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="8" cy="8" rx="2.8" ry="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 8h12" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="language-selector__value"><CountryFlag code={LOCALE_FLAGS[locale]} size={16} /> {LOCALE_LABELS[locale]}</span>
        <svg
          aria-hidden="true"
          className="language-selector__chevron"
          viewBox="0 0 16 16"
        >
          <path
            d="M3.5 6.25 8 10.75l4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          aria-label="Language"
          className="language-selector__panel"
          id={listboxId}
          role="listbox"
        >
          {LOCALE_OPTIONS.map((option) => (
            <button
              aria-selected={option.value === locale}
              className="language-selector__option"
              data-active={option.value === locale}
              key={option.value}
              onClick={() => {
                setLocale(option.value);
                setIsOpen(false);
              }}
              role="option"
              type="button"
            >
              <CountryFlag code={option.flag} size={16} /> {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
