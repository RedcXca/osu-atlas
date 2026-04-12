"use client";

import { memo } from "react";
import { ChromaticAberration } from "@/components/fx/chromatic-aberration";
import { CircuitOverlay } from "@/components/fx/circuit-overlay";
import { FloatingMarquee } from "@/components/fx/floating-marquee";
import { GithubToast } from "@/components/fx/github-toast";
import { ScanLines } from "@/components/fx/scan-lines";
import { UiSoundProvider } from "@/components/fx/ui-sound-provider";
import { Vignette } from "@/components/fx/vignette";

type DashboardFxProps = {
  countryCount: number;
  friendCount: number;
  username: string;
};

export const DashboardFx = memo(function DashboardFx({
  countryCount,
  friendCount,
  username
}: Readonly<DashboardFxProps>) {
  return (
    <>
      <FloatingMarquee
        friendCount={friendCount}
        countryCount={countryCount}
        username={username}
      />
      <GithubToast />
      <UiSoundProvider />
      <CircuitOverlay />
      <ChromaticAberration />
      <ScanLines />
      <Vignette />
    </>
  );
});
