"use client";

import { geoCentroid } from "d3-geo";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChromaticAberrationEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  Vector2
} from "three";
import { HudOverlay } from "@/components/fx/hud-overlay";
import { SpaceBackground } from "@/components/fx/space-background";
import { CountryFlag } from "@/components/ui/country-flag";
import { countryCodeToFlag, getCountryDisplayName } from "@/lib/domain/countries";
import { useLanguage } from "@/lib/i18n/context";
import type { WorldMapCountry } from "@/lib/models";
import {
  getCountryCodeFromFeature,
  worldCountryFeatureCollection,
  type WorldGeoFeature
} from "@/lib/domain/world-geo";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });
const MAX_ROUTE_DESTINATIONS = 24;
const MAX_GLOBE_DISTANCE = 400;
const MIN_CAMERA_NEAR = 0.01;
const MIN_GLOBE_SURFACE_OFFSET = 10;

type AtlasGlobeProps = {
  bootEntered?: boolean;
  hoveredCode: string | null;
  mapCountries: WorldMapCountry[];
  onGlobeReady?: () => void;
  onHoverChange: (code: string | null) => void;
  onSelectCountry: (code: string | null) => void;
  selectedCode: string | null;
};

type GlobeFriendLocation = {
  code: string;
  count: number;
  kind: "friend-location";
  lat: number;
  lng: number;
  name: string;
};

type GlobeRouteArc = {
  code: string;
  count: number;
  endLat: number;
  endLng: number;
  index: number;
  kind: "route";
  name: string;
  startLat: number;
  startLng: number;
};

const worldGlobeFeatures = worldCountryFeatureCollection.features;
const worldGlobeFeatureByCode = new Map<string, WorldGeoFeature>();

for (const countryFeature of worldGlobeFeatures) {
  const code = getCountryCodeFromFeature(countryFeature);

  if (code) {
    worldGlobeFeatureByCode.set(code, countryFeature);
  }
}

function getCountryColor(count: number, maxCount: number, isActive: boolean): string {
  if (isActive) return "rgba(238, 236, 233, 0.65)";
  if (count <= 0) return "rgba(255, 255, 255, 0.02)";
  const ratio = count / Math.max(maxCount, 1);
  if (ratio >= 0.7) return "rgba(238, 236, 233, 0.45)";
  if (ratio >= 0.35) return "rgba(210, 202, 194, 0.28)";
  return "rgba(200, 192, 184, 0.15)";
}

function getCountryStroke(count: number, isActive: boolean): string {
  if (isActive) return "rgba(255, 255, 255, 0.8)";
  if (count > 0) return "rgba(255, 255, 255, 0.18)";
  return "rgba(255, 255, 255, 0.05)";
}

export function AtlasGlobe({
  bootEntered,
  hoveredCode,
  mapCountries,
  onGlobeReady,
  onHoverChange,
  onSelectCountry,
  selectedCode
}: Readonly<AtlasGlobeProps>) {
  const { locale, t } = useLanguage();
  const [lowPerfMode] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.hardwareConcurrency != null && navigator.hardwareConcurrency <= 4;
  });
  const globeRef = useRef<any>(null);
  const [globeInstance, setGlobeInstance] = useState<any>(null);
  const frameRef = useRef<HTMLElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const spaceBgRef = useRef<HTMLDivElement>(null);
  const autoRotateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGlobeReadyRef = useRef(onGlobeReady);
  onGlobeReadyRef.current = onGlobeReady;
  const hasInitialized = useRef(false);
  const globeMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: 0x161616,
        transparent: true,
        opacity: 0.95
      }),
    []
  );

  const focusedCode = hoveredCode ?? selectedCode;
  const maxCount = useMemo(
    () => Math.max(1, ...mapCountries.map((country) => country.count)),
    [mapCountries]
  );

  const countByCode = useMemo(() => {
    const map = new Map<string, number>();

    for (const country of mapCountries) {
      if (country.code) {
        map.set(country.code, country.count);
      }
    }

    return map;
  }, [mapCountries]);

  const friendLocations = useMemo(() => {
    return mapCountries
      .flatMap((country) => {
        if (!country.code || country.count <= 0) {
          return [];
        }

        const countryFeature = worldGlobeFeatureByCode.get(country.code);

        if (!countryFeature) {
          return [];
        }

        const [lng, lat] = geoCentroid(countryFeature);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return [];
        }

        return [
          {
            code: country.code,
            count: country.count,
            kind: "friend-location" as const,
            lat,
            lng,
            name: country.name
          }
        ];
      })
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return left.code.localeCompare(right.code);
      });
  }, [mapCountries]);

  const routeSource = useMemo(() => {
    if (friendLocations.length === 0) {
      return null;
    }

    if (focusedCode) {
      return friendLocations.find((location) => location.code === focusedCode) ?? friendLocations[0];
    }

    return friendLocations[0];
  }, [focusedCode, friendLocations]);

  const routeArcs = useMemo<GlobeRouteArc[]>(() => {
    if (!routeSource) {
      return [];
    }

    return friendLocations
      .filter((location) => location.code !== routeSource.code)
      .slice(0, MAX_ROUTE_DESTINATIONS)
      .map((location, index) => ({
        code: location.code,
        count: location.count,
        endLat: location.lat,
        endLng: location.lng,
        index,
        kind: "route" as const,
        name: `${routeSource.name} → ${location.name}`,
        startLat: routeSource.lat,
        startLng: routeSource.lng
      }));
  }, [friendLocations, routeSource]);

  useEffect(() => {
    return () => globeMaterial.dispose();
  }, [globeMaterial]);

  useEffect(() => {
    return () => {
      if (autoRotateTimeout.current) {
        clearTimeout(autoRotateTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const element = frameRef.current;

    if (!element) {
      return;
    }

    const syncDimensions = () => {
      const nextDimensions = {
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height)
      };

      setDimensions((currentDimensions) => {
        if (
          currentDimensions.width === nextDimensions.width &&
          currentDimensions.height === nextDimensions.height
        ) {
          return currentDimensions;
        }

        return nextDimensions;
      });
    };

    const observer = new ResizeObserver(() => {
      syncDimensions();
    });

    observer.observe(element);
    syncDimensions();
    window.addEventListener("resize", syncDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncDimensions);
    };
  }, []);

  useEffect(() => {
    const globe = globeInstance ?? globeRef.current;

    if (!globe || dimensions.width <= 0 || dimensions.height <= 0) {
      return;
    }

    const controls = globe.controls();
    const camera = globe.camera();

    if (!controls || !camera) {
      return;
    }

    // cap pixel ratio on weak hardware to reduce GPU load
    const renderer = globe.renderer();
    if (renderer && lowPerfMode) {
      renderer.setPixelRatio(1);
    }

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;
    controls.enableZoom = true;
    controls.minDistance = globe.getGlobeRadius() + MIN_GLOBE_SURFACE_OFFSET;
    controls.maxDistance = MAX_GLOBE_DISTANCE;
    camera.near = Math.min(camera.near, MIN_CAMERA_NEAR);
    camera.far = Math.max(camera.far, MAX_GLOBE_DISTANCE * 3);
    camera.updateProjectionMatrix();
    // only park on the surface once — subsequent re-runs must not reset the camera
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      globe.pointOfView({ lat: 20, lng: 10, altitude: 0.01 });
    }

    // track camera for CSS starfield parallax — write directly to DOM, no React re-renders
    let frameId: number;
    let lastX = 0;
    let lastY = 0;
    const syncCamera = () => {
      const camera = globe.camera();
      if (camera && spaceBgRef.current) {
        const x = camera.position.y * 0.02;
        const y = camera.position.x * 0.02;
        // only touch the DOM when values actually change
        if (Math.abs(x - lastX) > 0.01 || Math.abs(y - lastY) > 0.01) {
          lastX = x;
          lastY = y;
          spaceBgRef.current.style.setProperty("--cam-x", `${x}`);
          spaceBgRef.current.style.setProperty("--cam-y", `${y}`);
        }
      }
      frameId = requestAnimationFrame(syncCamera);
    };
    syncCamera();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [dimensions.height, dimensions.width, globeInstance, globeMaterial]);

  // cinematic zoom-out triggered when user presses enter on boot screen
  useEffect(() => {
    if (!bootEntered) return;

    const globe = globeInstance ?? globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    const zoomDuration = 4500;

    // slow pull from surface to orbit
    globe.pointOfView({ lat: 20, lng: 10, altitude: 2.2 }, zoomDuration);

    const readyTimer = setTimeout(() => {
      onGlobeReadyRef.current?.();
    }, zoomDuration);

    return () => {
      clearTimeout(readyTimer);
    };
  }, [bootEntered, globeInstance]);

  // three.js starfield — lives in the globe scene so it rotates with the camera
  useEffect(() => {
    const globe = globeInstance ?? globeRef.current;
    if (!globe) return;

    const scene = globe.scene();
    if (!scene) return;

    const starCount = lowPerfMode ? 400 : 1600;
    const positions = new Float32Array(starCount * 3);
    const opacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 600 + Math.random() * 600;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      opacities[i] = 0.3 + Math.random() * 0.7;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0xffffff,
      size: 3.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95
    });

    const stars = new Points(geometry, material);
    scene.add(stars);

    // floating wireframe cubes scattered in space
    const cubeCount = lowPerfMode ? 6 : 20;
    const cubeGroup = new Group();
    const cubeGeo = new BoxGeometry(1, 1, 1);
    const cubeMat = new MeshBasicMaterial({
      color: 0xdad4cc,
      transparent: true,
      opacity: 0.25
    });

    const cubeData: { mesh: Mesh; rotSpeed: { x: number; y: number } }[] = [];

    for (let i = 0; i < cubeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 250 + Math.random() * 500;

      const cube = new Mesh(cubeGeo, cubeMat);
      const scale = 2 + Math.random() * 6;
      cube.scale.set(scale, scale, scale);
      cube.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      cubeGroup.add(cube);
      cubeData.push({
        mesh: cube,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.004,
          y: (Math.random() - 0.5) * 0.004
        }
      });
    }

    scene.add(cubeGroup);

    // sussy crewmate floating in space
    const crewmate = new Group();
    const susMat = new MeshBasicMaterial({ color: 0xdad4cc, transparent: true, opacity: 0.18, wireframe: true });

    const bodyGeo = new CapsuleGeometry(2.0, 2.8, 2, 4);
    crewmate.add(new Mesh(bodyGeo, susMat));

    const visorGeo = new CapsuleGeometry(0.9, 0.8, 2, 3);
    const visor = new Mesh(visorGeo, susMat);
    visor.position.set(1.4, 0.9, 0);
    visor.rotation.z = Math.PI * 0.5;
    crewmate.add(visor);

    const packGeo = new CapsuleGeometry(0.9, 1.8, 2, 3);
    const pack = new Mesh(packGeo, susMat);
    pack.position.set(-2.3, -0.3, 0);
    crewmate.add(pack);

    const legGeo = new CapsuleGeometry(0.75, 1.0, 1, 3);
    const leftLeg = new Mesh(legGeo, susMat);
    leftLeg.position.set(1.0, -3.2, 0);
    crewmate.add(leftLeg);
    const rightLeg = new Mesh(legGeo, susMat);
    rightLeg.position.set(-1.0, -3.2, 0);
    crewmate.add(rightLeg);

    crewmate.scale.set(5, 5, 5);
    crewmate.position.set(-400, 220, -350);
    crewmate.rotation.set(0.3, 0.5, 0.15);
    scene.add(crewmate);

    // foreground particles — soft glowing circles orbiting close to the globe
    // generate a radial glow texture
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const ctx = glowCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(218, 212, 204, 1)");
    gradient.addColorStop(0.3, "rgba(218, 212, 204, 0.6)");
    gradient.addColorStop(0.7, "rgba(218, 212, 204, 0.15)");
    gradient.addColorStop(1, "rgba(218, 212, 204, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const glowTexture = new CanvasTexture(glowCanvas);
    const fgCount = lowPerfMode ? 0 : 40;
    const fgPositions = new Float32Array(fgCount * 3);

    for (let i = 0; i < fgCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 120 + Math.random() * 80;

      fgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      fgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      fgPositions[i * 3 + 2] = r * Math.cos(phi);
    }

    const fgGeo = new BufferGeometry();
    fgGeo.setAttribute("position", new Float32BufferAttribute(fgPositions, 3));

    const fgMat = new PointsMaterial({
      color: 0xdad4cc,
      size: 3.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      map: glowTexture,
      depthWrite: false
    });

    const fgStars = new Points(fgGeo, fgMat);
    scene.add(fgStars);

    // cube spin + crewmate tumble + foreground particle drift + shimmer
    let frameId = 0;
    const baseOpacity = 0.55;
    const pulseRange = 0.25;
    const baseSize = 3.5;
    const sizeRange = 1.2;
    const animate = () => {
      for (const c of cubeData) {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
      }
      crewmate.rotation.x += 0.002;
      crewmate.rotation.y += 0.003;
      fgStars.rotation.y += 0.0003;
      fgStars.rotation.x += 0.0001;

      // breathe in opacity and size
      const t = performance.now() * 0.001;
      fgMat.opacity = baseOpacity + Math.sin(t * 0.8) * pulseRange;
      fgMat.size = baseSize + Math.sin(t * 0.6) * sizeRange;

      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.remove(stars);
      scene.remove(cubeGroup);
      scene.remove(crewmate);
      scene.remove(fgStars);
      geometry.dispose();
      material.dispose();
      cubeGeo.dispose();
      cubeMat.dispose();
      bodyGeo.dispose();
      susMat.dispose();
      visorGeo.dispose();
      packGeo.dispose();
      legGeo.dispose();
      glowTexture.dispose();
      fgGeo.dispose();
      fgMat.dispose();
    };
  }, [globeInstance]);

  // post-processing — chromatic aberration only (skipped on low-end hardware)
  useEffect(() => {
    if (lowPerfMode) return;
    const globe = globeInstance ?? globeRef.current;
    if (!globe) return;

    const renderer = globe.renderer();
    const scene = globe.scene();
    const camera = globe.camera();
    if (!renderer || !scene || !camera) return;

    const composer = new EffectComposer(renderer);
    const pixelRatio = renderer.getPixelRatio();
    composer.setSize(
      renderer.domElement.clientWidth * pixelRatio,
      renderer.domElement.clientHeight * pixelRatio
    );
    composer.addPass(new RenderPass(scene, camera));

    const chromaticAberration = new ChromaticAberrationEffect({
      offset: new Vector2(0.0015, 0.0015),
      radialModulation: true,
      modulationOffset: 0.2
    });

    composer.addPass(new EffectPass(camera, chromaticAberration));

    const originalRender = renderer.render.bind(renderer);
    let composing = false;
    renderer.render = (...args: any[]) => {
      if (composing) {
        originalRender(...args);
      } else {
        composing = true;
        composer.render();
        composing = false;
      }
    };

    return () => {
      renderer.render = originalRender;
      composer.dispose();
    };
  }, [globeInstance]);


  const resumeAutoRotate = useCallback(() => {
    if (autoRotateTimeout.current) {
      clearTimeout(autoRotateTimeout.current);
    }

    autoRotateTimeout.current = setTimeout(() => {
      const globe = globeRef.current;

      if (globe?.controls()) {
        globe.controls().autoRotate = true;
      }
    }, 3000);
  }, []);

  const handleGlobeRef = useCallback((instance: any) => {
    globeRef.current = instance;
    setGlobeInstance(instance);
  }, []);

  const handleInteraction = useCallback(() => {
    const globe = globeRef.current;

    if (globe?.controls()) {
      globe.controls().autoRotate = false;
    }

    resumeAutoRotate();
  }, [resumeAutoRotate]);

  useEffect(() => {
    if (!selectedCode) {
      return;
    }

    const globe = globeInstance ?? globeRef.current;
    if (!globe) return;

    // try friend locations first, fall back to country centroid
    const friendLoc = friendLocations.find((location) => location.code === selectedCode);
    if (friendLoc) {
      globe.pointOfView({ altitude: 1.45, lat: friendLoc.lat, lng: friendLoc.lng }, 900);
      handleInteraction();
      return;
    }

    // no friends there — compute centroid from geo data
    const feature = worldGlobeFeatureByCode.get(selectedCode);
    if (feature) {
      const [lng, lat] = geoCentroid(feature);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        globe.pointOfView({ altitude: 1.45, lat, lng }, 900);
        handleInteraction();
      }
    }
  }, [friendLocations, globeInstance, handleInteraction, selectedCode]);

  const focusedCountry = useMemo(
    () => mapCountries.find((country) => country.code === focusedCode) ?? null,
    [focusedCode, mapCountries]
  );

  // memoized polygon accessors — prevents react-globe.gl from
  // reprocessing all ~200 countries on unrelated re-renders
  const polygonAltitude = useCallback(
    (countryFeature: WorldGeoFeature) => {
      const code = getCountryCodeFromFeature(countryFeature);
      const count = code ? (countByCode.get(code) ?? 0) : 0;
      const isHovered = code !== null && code === hoveredCode;
      const isSelected = code !== null && code === selectedCode;
      if (isSelected) return 0.024;
      if (isHovered) return count > 0 ? 0.017 : 0.013;
      return count > 0 ? 0.014 : 0.01;
    },
    [countByCode, hoveredCode, selectedCode]
  );

  const polygonCapColor = useCallback(
    (countryFeature: WorldGeoFeature) => {
      const code = getCountryCodeFromFeature(countryFeature);
      const count = code ? (countByCode.get(code) ?? 0) : 0;
      const isSelected = code !== null && code === selectedCode;
      return getCountryColor(count, maxCount, isSelected);
    },
    [countByCode, maxCount, selectedCode]
  );

  const polygonSideColor = useCallback(
    (countryFeature: WorldGeoFeature) => {
      const code = getCountryCodeFromFeature(countryFeature);
      const count = code ? (countByCode.get(code) ?? 0) : 0;
      const isHovered = code !== null && code === hoveredCode;
      const isSelected = code !== null && code === selectedCode;
      if (isSelected) return "rgba(255, 255, 255, 0.1)";
      if (isHovered) return count > 0 ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.05)";
      return count > 0 ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.03)";
    },
    [countByCode, hoveredCode, selectedCode]
  );

  const polygonStrokeColor = useCallback(
    (countryFeature: WorldGeoFeature) => {
      const code = getCountryCodeFromFeature(countryFeature);
      const count = code ? (countByCode.get(code) ?? 0) : 0;
      const isSelected = code !== null && code === selectedCode;
      const isHovered = code !== null && code === hoveredCode;
      if (isHovered && !isSelected) return count > 0 ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.45)";
      return getCountryStroke(count, isSelected);
    },
    [countByCode, hoveredCode, selectedCode]
  );

  const polygonLabel = useCallback(
    (countryFeature: WorldGeoFeature) => {
      const code = getCountryCodeFromFeature(countryFeature);
      if (!code) return "";
      const name = getCountryDisplayName(code, locale);
      const count = countByCode.get(code) ?? 0;
      return `<div class="globe-tooltip">${countryCodeToFlag(code)} ${name}<br/><span>${t.friendCount(count)}</span></div>`;
    },
    [countByCode, locale, t]
  );

  const pointColor = useCallback(
    (location: GlobeFriendLocation) =>
      location.code === focusedCode ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.78)",
    [focusedCode]
  );

  const pointAltitude = useCallback(
    (location: GlobeFriendLocation) => {
      const intensity = location.count / maxCount;
      if (location.code === focusedCode) return 0.05;
      return 0.016 + intensity * 0.022;
    },
    [focusedCode, maxCount]
  );

  const pointLabel = useCallback(
    (location: GlobeFriendLocation) =>
      `<div class="globe-tooltip">${countryCodeToFlag(location.code)} ${location.name}<br/><span>${t.friendCount(location.count)}</span></div>`,
    [t]
  );

  const pointRadius = useCallback(
    (location: GlobeFriendLocation) => {
      const intensity = location.count / maxCount;
      if (location.code === focusedCode) return 0.34;
      return 0.19 + intensity * 0.1;
    },
    [focusedCode, maxCount]
  );

  const arcColor = useCallback(
    () => ["rgba(255, 255, 255, 0.68)", "rgba(255, 255, 255, 0.06)"] as [string, string],
    []
  );

  const arcDashInitialGap = useCallback(
    (arc: GlobeRouteArc) => arc.index * 0.12,
    []
  );

  const arcLabel = useCallback(
    (arc: GlobeRouteArc) =>
      `<div class="globe-tooltip">${arc.name}<br/><span>${t.friendCount(arc.count)}</span></div>`,
    [t]
  );

  const arcStroke = useCallback(
    (arc: GlobeRouteArc) => (arc.code === focusedCode ? 0.22 : 0.14),
    [focusedCode]
  );

  const pointerEventsFilter = useCallback(
    (_object: unknown, data: { kind?: string } | undefined) => data?.kind !== "route",
    []
  );

  const handlePolygonHover = useCallback(
    (countryFeature: WorldGeoFeature | null) => {
      onHoverChange(countryFeature ? getCountryCodeFromFeature(countryFeature) : null);
    },
    [onHoverChange]
  );

  const handlePolygonClick = useCallback(
    (countryFeature: WorldGeoFeature | null) => {
      const code = countryFeature ? getCountryCodeFromFeature(countryFeature) : null;
      if (code) onSelectCountry(code);
      handleInteraction();
    },
    [handleInteraction, onSelectCountry]
  );

  const handlePointHover = useCallback(
    (location: GlobeFriendLocation | null) => {
      onHoverChange(location?.code ?? null);
    },
    [onHoverChange]
  );

  const handlePointClick = useCallback(
    (location: GlobeFriendLocation) => {
      onSelectCountry(location.code);
      handleInteraction();
    },
    [handleInteraction, onSelectCountry]
  );

  const handleGlobeClick = useCallback(() => {
    onSelectCountry(null);
    handleInteraction();
  }, [handleInteraction, onSelectCountry]);

  return (
    <section className="panel map-panel" ref={frameRef}>
      <div
        className="globe-frame"
        onClick={(e) => {
          // only fire when clicking the background, not bubbled from globe internals
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "CANVAS") {
            onSelectCountry(null);
            handleInteraction();
          }
        }}
      >
        <SpaceBackground ref={spaceBgRef} />
        <HudOverlay />

        {focusedCountry && focusedCountry.count > 0 ? (
          <div className="map-focus-card">
            <strong><CountryFlag code={focusedCountry.code} /> {getCountryDisplayName(focusedCountry.code ?? "", locale)}</strong>
            <p>{t.friendCount(focusedCountry.count)}</p>
          </div>
        ) : null}

        {dimensions.width <= 0 ? (
          <div className="globe-loading">
            <span className="globe-loading__text">[LOADING GEOGRAPHIC DATA...]</span>
          </div>
        ) : (
          <Globe
            ref={handleGlobeRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeMaterial={globeMaterial}
            atmosphereColor="rgba(210, 205, 200, 0.24)"
            atmosphereAltitude={0.13}
            showGraticules={true}
            lineHoverPrecision={0.35}
            pointerEventsFilter={pointerEventsFilter}
            polygonsData={worldGlobeFeatures}
            polygonAltitude={polygonAltitude}
            polygonCapColor={polygonCapColor}
            polygonSideColor={polygonSideColor}
            polygonStrokeColor={polygonStrokeColor}
            polygonsTransitionDuration={lowPerfMode ? 0 : 180}
            polygonLabel={polygonLabel}
            pointsData={friendLocations}
            pointColor={pointColor}
            pointAltitude={pointAltitude}
            pointLabel={pointLabel}
            pointRadius={pointRadius}
            pointsTransitionDuration={lowPerfMode ? 0 : 250}
            arcsData={routeArcs}
            arcColor={arcColor}
            arcDashAnimateTime={1800}
            arcDashGap={0.7}
            arcDashInitialGap={arcDashInitialGap}
            arcDashLength={0.24}
            arcLabel={arcLabel}
            arcStroke={arcStroke}
            arcsTransitionDuration={lowPerfMode ? 0 : 600}
            onPolygonHover={handlePolygonHover}
            onPolygonClick={handlePolygonClick}
            onPointHover={handlePointHover}
            onPointClick={handlePointClick}
            onGlobeClick={handleGlobeClick}
            {...({ graticulesColor: "rgba(255, 255, 255, 0.06)" } as any)}
          />
        )}
      </div>
    </section>
  );
}
