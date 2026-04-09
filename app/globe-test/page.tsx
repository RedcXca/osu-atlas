"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { getCountryCodeFromFeature, worldCountryFeatureCollection } from "@/lib/domain/world-geo";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function GlobeTestPage() {
  const globeRef = useRef<any>(null);
  const [clicked, setClicked] = useState<string>("none");
  const [hovered, setHovered] = useState<string>("none");

  return (
    <div style={{ background: "#000", height: "100vh", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 99, color: "#0f0", fontFamily: "monospace", fontSize: 14 }}>
        <div>CLICKED: {clicked}</div>
        <div>HOVERED: {hovered}</div>
      </div>
      <Globe
        ref={globeRef}
        width={800}
        height={600}
        backgroundColor="rgba(0,0,0,0)"
        showGraticules={true}
        polygonsData={worldCountryFeatureCollection.features}
        polygonAltitude={0.01}
        polygonCapColor={() => "rgba(100,200,255,0.3)"}
        polygonStrokeColor={() => "rgba(255,255,255,0.2)"}
        polygonSideColor={() => "rgba(255,255,255,0.05)"}
        onPolygonClick={(d: any) => {
          const code = d ? getCountryCodeFromFeature(d) : null;
          setClicked(code ? `code=${code} id=${d.id}` : `id=${d?.id} type=${d?.geometry?.type}`);
        }}
        onPolygonHover={(d: any) => {
          const code = d ? getCountryCodeFromFeature(d) : null;
          setHovered(code ? `code=${code}` : d ? `id=${d.id}` : "none");
        }}
        onGlobeClick={() => {
          setClicked("globe (no country)");
        }}
      />
    </div>
  );
}
