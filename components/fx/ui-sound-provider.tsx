"use client";

import { useEffect } from "react";
import { playClick, playHoverSoft } from "@/lib/audio/ui-sounds";

// global event delegation for UI sounds on interactive elements
// plays soft hover blips on buttons/links inside dropdowns, lists, cards
// plays click sounds on button clicks
// uses event delegation so no per-component wiring needed
export function UiSoundProvider() {
  useEffect(() => {
    let lastHoverTarget: EventTarget | null = null;

    function handleMouseEnter(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target || target === lastHoverTarget) return;

      // play soft hover on interactive elements inside panels
      const isInteractive = target.matches?.(
        ".language-selector__option, .sort-accordion__option, " +
        ".profile-menu__item, .country-breakdown-row, " +
        ".friend-card, .mode-rank-card, " +
        ".left-drawer__country-pill, .soundtrack-dock__button"
      );

      if (isInteractive) {
        lastHoverTarget = target;
        playHoverSoft();
      }
    }

    function handleMouseLeave(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target === lastHoverTarget) {
        lastHoverTarget = null;
      }
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const button = target.closest?.(
        ".language-selector__option, .sort-accordion__option, " +
        ".profile-menu__item, .soundtrack-dock__button, " +
        ".friend-card__link, .map-control, .button"
      );

      if (button) {
        playClick();
      }
    }

    document.addEventListener("mouseover", handleMouseEnter, { passive: true });
    document.addEventListener("mouseout", handleMouseLeave, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseEnter);
      document.removeEventListener("mouseout", handleMouseLeave);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
