"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type SortAccordionOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type SortAccordionProps<TValue extends string> = {
  label: string;
  onChange: (value: TValue) => void;
  options: SortAccordionOption<TValue>[];
  value: TValue;
};

export function SortAccordion<TValue extends string>({
  label,
  onChange,
  options,
  value
}: Readonly<SortAccordionProps<TValue>>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const activeOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

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
    <div className="sort-accordion" data-open={isOpen} ref={containerRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${label}: ${activeOption?.label ?? value}`}
        className="sort-accordion__trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="sort-accordion__value">{activeOption?.label ?? value}</span>
        <svg
          aria-hidden="true"
          className="sort-accordion__chevron"
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
        <div aria-label={label} className="sort-accordion__panel" id={listboxId} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className="sort-accordion__option"
              data-active={option.value === value}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
