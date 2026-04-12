"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PLAYBACK_VOLUME = 0.15;

type TrackInfo = {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl: string;
  previewUrl: string | null;
  trackUrl: string;
};

export function SoundtrackDock() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingAutoplay = useRef(false);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/itunes")
      .then((res) => res.json())
      .then((data) => {
        const result = data.results?.[0];
        if (!result) {
          setFetchError(true);
          return;
        }
        setTrack({
          trackName: result.trackName ?? "Fortress of Lies",
          artistName: result.artistName ?? "Keiichi Okabe",
          collectionName: result.collectionName ?? "NieR:Automata OST",
          artworkUrl: (result.artworkUrl100 ?? "").replace("100x100", "300x300"),
          previewUrl: result.previewUrl ?? null,
          trackUrl: result.trackViewUrl ?? result.collectionViewUrl ?? ""
        });
      })
      .catch(() => setFetchError(true));
  }, []);

  // on user enter: unlock audio immediately (user gesture), then play after map loads
  useEffect(() => {
    function startPlayback(audio: HTMLAudioElement) {
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        setTimeout(() => {
          audio.currentTime = 0;
          audio.volume = PLAYBACK_VOLUME;
          audio.play().catch(() => {});
        }, 1400);
      }).catch(() => {});
    }

    function onBootEnter() {
      const audio = audioRef.current;
      if (!audio) {
        // track hasn't loaded yet — defer until the audio element mounts
        pendingAutoplay.current = true;
        return;
      }
      startPlayback(audio);
    }

    window.addEventListener("nier-boot-enter", onBootEnter);
    return () => window.removeEventListener("nier-boot-enter", onBootEnter);
  }, []);

  // clear browser media session so OS/browser doesn't show native media controls
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    }
  }, [isPlaying]);

  // when track loads, fulfill any pending autoplay from boot-enter
  useEffect(() => {
    if (!track?.previewUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = PLAYBACK_VOLUME;

    if (pendingAutoplay.current) {
      pendingAutoplay.current = false;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [track]);

  // sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const playAudio = useCallback(async (audio: HTMLAudioElement) => {
    audio.volume = PLAYBACK_VOLUME;

    try {
      await audio.play();
    } catch {
      // blocked
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !track?.previewUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      await playAudio(audio);
    }
  }, [isPlaying, playAudio, track?.previewUrl]);

  // ref so the keydown listener is stable — avoids re-adding on every play/pause
  const togglePlaybackRef = useRef(togglePlayback);
  togglePlaybackRef.current = togglePlayback;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isInteractiveTarget =
        target?.isContentEditable ||
        tagName === "BUTTON" ||
        tagName === "INPUT" ||
        tagName === "SELECT" ||
        tagName === "TEXTAREA" ||
        !!target?.closest("a, button, input, select, textarea, [role='button']");

      if (isInteractiveTarget) {
        return;
      }

      event.preventDefault();
      void togglePlaybackRef.current();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayTrack = track ?? {
    trackName: "Fortress of Lies",
    artistName: "Keiichi Okabe",
    collectionName: "NieR:Automata Original Soundtrack",
    artworkUrl: "",
    previewUrl: null,
    trackUrl: ""
  };

  return (
    <div className="soundtrack-dock">
      {track?.previewUrl ? (
        <audio
          ref={audioRef}
          loop
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onEnded={() => setIsPlaying(false)}
          preload="none"
          src={track.previewUrl}
        />
      ) : null}

      <div className="soundtrack-dock__panel">
          <div className="soundtrack-dock__row">
            {displayTrack.artworkUrl ? (
              <img
                alt={displayTrack.collectionName}
                className="soundtrack-dock__art"
                height={44}
                src={displayTrack.artworkUrl}
                width={44}
              />
            ) : (
              <div className="soundtrack-dock__art-placeholder" />
            )}
            <div className="soundtrack-dock__info">
              <span className="soundtrack-dock__label">
                {isPlaying ? (isMuted ? "muted" : "now playing") : fetchError ? "loading failed" : "soundtrack"}
              </span>
              <strong>{displayTrack.trackName}</strong>
              <span className="soundtrack-dock__meta">{displayTrack.artistName}</span>
            </div>
            <button
              className="soundtrack-dock__button soundtrack-dock__play"
              onClick={() => void togglePlayback()}
              type="button"
              aria-label={isPlaying ? "pause" : "play"}
              disabled={!track?.previewUrl}
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
              onClick={() => setIsMuted((m) => !m)}
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
          {displayTrack.trackUrl ? (
            <a
              className="soundtrack-dock__link"
              href={displayTrack.trackUrl}
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
