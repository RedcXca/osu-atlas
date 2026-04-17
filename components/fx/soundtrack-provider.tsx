"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const PLAYBACK_VOLUME = 0.15;

type TrackInfo = {
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl: string;
  previewUrl: string | null;
  trackUrl: string;
};

const FALLBACK_TRACK: TrackInfo = {
  trackName: "Fortress of Lies",
  artistName: "Keiichi Okabe",
  collectionName: "NieR:Automata Original Soundtrack",
  artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/8c/5a/08/8c5a08f3-c1c3-c498-9553-3e7fbc8c7c6b/source/300x300bb.jpg",
  previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0f/c8/65/0fc86547-a429-4a1e-3284-1be88afba361/mzaf_5765506857912006034.plus.aac.p.m4a",
  trackUrl: "https://music.apple.com/album/fortress-of-lies/1521281798?i=1521281805"
};

type SoundtrackContextValue = {
  track: TrackInfo;
  isPlaying: boolean;
  isMuted: boolean;
  togglePlayback: () => void;
  toggleMuted: () => void;
};

const SoundtrackContext = createContext<SoundtrackContextValue | null>(null);

export function useSoundtrack() {
  const ctx = useContext(SoundtrackContext);
  if (!ctx) throw new Error("useSoundtrack must be used inside SoundtrackProvider");
  return ctx;
}

export function SoundtrackProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<TrackInfo>(FALLBACK_TRACK);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    fetch("/api/itunes")
      .then((res) => res.json())
      .then((data) => {
        const result = data.results?.[0];
        if (!result) {
          return;
        }
        const nextTrack: TrackInfo = {
          trackName: result.trackName ?? "Fortress of Lies",
          artistName: result.artistName ?? "Keiichi Okabe",
          collectionName: result.collectionName ?? "NieR:Automata OST",
          artworkUrl: (result.artworkUrl100 ?? "").replace("100x100", "300x300"),
          previewUrl: result.previewUrl ?? null,
          trackUrl: result.trackViewUrl ?? result.collectionViewUrl ?? ""
        };

        setTrack((currentTrack) => {
          if (!nextTrack.previewUrl && currentTrack.previewUrl) {
            return { ...nextTrack, previewUrl: currentTrack.previewUrl };
          }

          if (audioRef.current && !audioRef.current.paused && currentTrack.previewUrl) {
            return { ...nextTrack, previewUrl: currentTrack.previewUrl };
          }

          return nextTrack;
        });
      })
      .catch(() => {});
  }, []);

  // boot-enter listener — provider is mounted from the start, so this runs
  // inside the user gesture.
  useEffect(() => {
    function onBootEnter() {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = PLAYBACK_VOLUME;
      audio.play().catch(() => {});
    }

    window.addEventListener("nier-boot-enter", onBootEnter);
    return () => window.removeEventListener("nier-boot-enter", onBootEnter);
  }, []);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track.previewUrl) return;
    if (audio.paused) {
      audio.volume = PLAYBACK_VOLUME;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [track.previewUrl]);

  const toggleMuted = useCallback(() => setIsMuted((m) => !m), []);

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
      if (isInteractiveTarget) return;
      event.preventDefault();
      togglePlaybackRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SoundtrackContext.Provider value={{ track, isPlaying, isMuted, togglePlayback, toggleMuted }}>
      {track.previewUrl ? (
        <audio
          ref={audioRef}
          loop
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
          playsInline
          src={track.previewUrl}
        />
      ) : null}
      {children}
    </SoundtrackContext.Provider>
  );
}
