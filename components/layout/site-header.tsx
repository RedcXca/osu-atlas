import { useEffect, useRef, useState } from "react";
import { LanguageSelector } from "@/components/layout/language-selector";
import { APP_ROUTES } from "@/lib/config/routes";
import { useLanguage } from "@/lib/i18n/context";
import type { OsuViewer } from "@/lib/models";

type SiteHeaderProps = {
  viewer: OsuViewer | null;
};

export function SiteHeader({ viewer }: Readonly<SiteHeaderProps>) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <header className="site-header panel">
      <div className="site-header__identity">
        <a aria-label="osu! website" className="site-header__brand" href="https://osu.ppy.sh" target="_blank" rel="noopener noreferrer">
          <img
            alt="osu!"
            className="site-header__logo"
            height={54}
            src="/brand-mark.svg"
            width={54}
          />
        </a>

        <div className="site-header__meta">
          <h1 className="site-header__title">osu! Atlas</h1>
          <span className="site-header__credit">
            by{" "}
            <a href="https://github.com/RedcXca" target="_blank" rel="noopener noreferrer">
              RedcXca
            </a>
          </span>
        </div>
      </div>

      <div className="site-header__actions">
        <LanguageSelector />
        {viewer ? (
          <div className="profile-menu" ref={menuRef}>
            <button
              className="profile-menu__trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              type="button"
            >
              <img
                alt={viewer.username}
                className="site-header__avatar"
                height={42}
                src={viewer.avatarUrl}
                width={42}
              />
              <strong>{viewer.username}</strong>
              <svg className="profile-menu__chevron" data-open={menuOpen} fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen ? (
              <div className="profile-menu__panel">
                <a
                  className="profile-menu__item"
                  href={`https://osu.ppy.sh/users/${viewer.osuId}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t.profile}
                </a>
                <a className="profile-menu__item profile-menu__item--danger" href={APP_ROUTES.logout}>
                  Logout
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <a className="profile-menu__trigger" href={APP_ROUTES.osuLogin}>
            <img
              alt="demo"
              className="site-header__avatar"
              height={42}
              src="https://osu.ppy.sh/images/layout/avatar-guest@2x.png"
              width={42}
            />
            <strong>{t.loginWithOsu}</strong>
          </a>
        )}
      </div>
    </header>
  );
}
