import { BASE_PATH } from "@/lib/config/constants";
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
            src={`${BASE_PATH}/brand-mark.svg`}
            width={54}
          />
        </a>

        <div className="site-header__meta">
          <h1 className="site-header__title">osu! Atlas</h1>
          <span className="site-header__credit">
            built by{" "}
            <a href="https://github.com/RedcXca" target="_blank" rel="noopener noreferrer">
              RedcXca
            </a>
          </span>
        </div>
      </div>

      {viewer ? (
        <div className="site-header__session">
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
        </div>
      ) : null}
    </header>
  );
}
