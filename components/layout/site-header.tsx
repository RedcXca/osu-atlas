import { LanguageSelector } from "@/components/layout/language-selector";
import type { OsuViewer } from "@/lib/models";

type SiteHeaderProps = {
  viewer: OsuViewer | null;
};

export function SiteHeader({ viewer }: Readonly<SiteHeaderProps>) {
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
          <div className="site-header__user">
            <img
              alt={viewer.username}
              className="site-header__avatar"
              height={52}
              src={viewer.avatarUrl}
              width={52}
            />
            <div className="site-header__account">
              <strong>{viewer.username}</strong>
              <span className="site-header__session-label">osu!</span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
