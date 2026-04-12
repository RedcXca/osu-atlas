"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { playHover } from "@/lib/audio/ui-sounds";
import type { WorldMapCountry } from "@/lib/models";

const AtlasGlobe = dynamic(
  () => import("@/components/globe/atlas-globe").then((m) => m.AtlasGlobe),
  { ssr: false, loading: () => <MapPanelPlaceholder /> }
);
const WorldMap = dynamic(
  () => import("@/components/map/world-map").then((m) => m.WorldMap),
  { ssr: false, loading: () => <MapPanelPlaceholder /> }
);

type MapPanelProps = {
  bootEntered: boolean;
  globeReady: boolean;
  hasWebGL: boolean;
  mapCountries: WorldMapCountry[];
  onGlobeReady: () => void;
  onSelectCountry: (code: string | null) => void;
  selectedCode: string | null;
  unknownCount: number;
};

function MapPanelPlaceholder() {
  return (
    <section className="panel map-panel">
      <div className="globe-frame">
        <div className="globe-loading">
          <span className="globe-loading__text">[STAGING GEOGRAPHIC DATA...]</span>
        </div>
      </div>
    </section>
  );
}

export const MapPanel = memo(function MapPanel({
  bootEntered,
  globeReady,
  hasWebGL,
  mapCountries,
  onGlobeReady,
  onSelectCountry,
  selectedCode,
  unknownCount
}: Readonly<MapPanelProps>) {
  const [hasMounted, setHasMounted] = useState(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const hoveredCodeRef = useRef(hoveredCode);
  hoveredCodeRef.current = hoveredCode;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleHoverChange = useCallback((code: string | null) => {
    if (code && code !== hoveredCodeRef.current && globeReady) {
      playHover();
    }

    setHoveredCode((current) => (current === code ? current : code));
  }, [globeReady]);

  if (!hasMounted) {
    return <MapPanelPlaceholder />;
  }

  if (!hasWebGL) {
    return (
      <WorldMap
        hoveredCode={hoveredCode}
        mapCountries={mapCountries}
        unknownCount={unknownCount}
        onHoverChange={handleHoverChange}
        onSelectCountry={onSelectCountry}
        selectedCode={selectedCode}
      />
    );
  }

  return (
    <AtlasGlobe
      bootEntered={bootEntered}
      mapCountries={mapCountries}
      onGlobeReady={onGlobeReady}
      onSelectCountry={onSelectCountry}
      selectedCode={selectedCode}
    />
  );
});

MapPanel.displayName = "MapPanel";
