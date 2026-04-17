"use client";

import { useSoundtrack } from "./soundtrack-provider";

export function SoundtrackDock() {
  const { track, isPlaying, isMuted, togglePlayback, toggleMuted } = useSoundtrack();

  return (
    <div className="soundtrack-dock">
      <div className="soundtrack-dock__panel">
        <div className="soundtrack-dock__row">
          {track.artworkUrl ? (
            <img
              alt={track.collectionName}
              className="soundtrack-dock__art"
              height={44}
              src={track.artworkUrl}
              width={44}
            />
          ) : (
            <div className="soundtrack-dock__art-placeholder" />
          )}
          <div className="soundtrack-dock__info">
            <span className="soundtrack-dock__label">
              {isPlaying ? (isMuted ? "muted" : "now playing") : "soundtrack"}
            </span>
            <strong>{track.trackName}</strong>
            <span className="soundtrack-dock__meta">{track.artistName}</span>
          </div>
          <button
            className="soundtrack-dock__button soundtrack-dock__play"
            onClick={togglePlayback}
            type="button"
            aria-label={isPlaying ? "pause" : "play"}
            disabled={!track.previewUrl}
          >
            {isPlaying ? (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                <path d="M4 2l10 6-10 6z" />
              </svg>
            )}
          </button>
          <button
            className="soundtrack-dock__button soundtrack-dock__mute"
            onClick={toggleMuted}
            type="button"
            aria-label={isMuted ? "unmute" : "mute"}
          >
            {isMuted ? (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 5.5h2.5L8 2.5v11L4.5 10.5H2z" fill="currentColor" />
                <line x1="11" y1="5" x2="15" y2="11" />
                <line x1="15" y1="5" x2="11" y2="11" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 5.5h2.5L8 2.5v11L4.5 10.5H2z" fill="currentColor" />
                <path d="M11 5.5c.8.8 1.2 1.8 1.2 2.5s-.4 1.7-1.2 2.5" />
              </svg>
            )}
          </button>
        </div>
        {track.trackUrl ? (
          <a
            className="soundtrack-dock__link"
            href={track.trackUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            apple music &#x2197;
          </a>
        ) : null}
      </div>
    </div>
  );
}
