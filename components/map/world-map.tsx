"use client";

import { useRef, useState } from "react";
import { CountryFlag } from "@/components/ui/country-flag";
import { getCountryDisplayName } from "@/lib/domain/countries";
import { useLanguage } from "@/lib/i18n/context";
import type { WorldMapCountry } from "@/lib/models";

type WorldMapProps = {
  hoveredCode: string | null;
  mapCountries: WorldMapCountry[];
  unknownCount: number;
  onHoverChange: (code: string | null) => void;
  onSelectCountry: (code: string | null) => void;
  selectedCode: string | null;
};

type ViewBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type DragState = {
  moved: boolean;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startViewBox: ViewBox;
};

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 580;
const INITIAL_VIEWBOX: ViewBox = {
  height: MAP_HEIGHT,
  width: MAP_WIDTH,
  x: 0,
  y: 0
};
const MIN_VIEWBOX_WIDTH = 260;
const ZOOM_STEP = 1.2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampViewBox(viewBox: ViewBox): ViewBox {
  const width = clamp(viewBox.width, MIN_VIEWBOX_WIDTH, MAP_WIDTH);
  const height = (width * MAP_HEIGHT) / MAP_WIDTH;

  return {
    height,
    width,
    x: clamp(viewBox.x, 0, MAP_WIDTH - width),
    y: clamp(viewBox.y, 0, MAP_HEIGHT - height)
  };
}

function buildZoomedViewBox(
  currentViewBox: ViewBox,
  nextWidth: number,
  originX: number,
  originY: number
) {
  const width = clamp(nextWidth, MIN_VIEWBOX_WIDTH, MAP_WIDTH);
  const height = (width * MAP_HEIGHT) / MAP_WIDTH;
  const focusX = currentViewBox.x + currentViewBox.width * originX;
  const focusY = currentViewBox.y + currentViewBox.height * originY;

  return clampViewBox({
    height,
    width,
    x: focusX - width * originX,
    y: focusY - height * originY
  });
}

function getCountryTone(count: number, maxCount: number) {
  if (count <= 0) {
    return "empty";
  }

  const ratio = count / maxCount;

  if (ratio >= 0.7) {
    return "high";
  }

  if (ratio >= 0.35) {
    return "mid";
  }

  return "low";
}

export function WorldMap({
  hoveredCode,
  mapCountries,
  unknownCount,
  onHoverChange,
  onSelectCountry,
  selectedCode
}: Readonly<WorldMapProps>) {
  const { locale, t } = useLanguage();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewBox, setViewBox] = useState(INITIAL_VIEWBOX);
  const focusedCode = hoveredCode ?? selectedCode;
  const focusedCountry =
    mapCountries.find((country) => country.code === focusedCode) ??
    (focusedCode
      ? {
          code: focusedCode,
          count: 0,
          hasFriends: false,
          name: getCountryDisplayName(focusedCode, locale),
          path: ""
        }
      : null);
  const maxCount = Math.max(1, ...mapCountries.map((country) => country.count));
  const isZoomed = viewBox.width < MAP_WIDTH;

  const handleZoom = (direction: "in" | "out", originX = 0.5, originY = 0.5) => {
    setViewBox((currentViewBox) =>
      buildZoomedViewBox(
        currentViewBox,
        direction === "in" ? currentViewBox.width / ZOOM_STEP : currentViewBox.width * ZOOM_STEP,
        originX,
        originY
      )
    );
  };

  const shouldSuppressClick = () => {
    if (!suppressClickRef.current) {
      return false;
    }

    suppressClickRef.current = false;
    return true;
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isZoomed) {
      return;
    }

    dragStateRef.current = {
      moved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewBox: viewBox
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId || !svgRef.current) {
      return;
    }

    const pointerDeltaX = event.clientX - dragState.startClientX;
    const pointerDeltaY = event.clientY - dragState.startClientY;

    if (!dragState.moved) {
      const movedEnough = Math.abs(pointerDeltaX) > 4 || Math.abs(pointerDeltaY) > 4;

      if (!movedEnough) {
        return;
      }

      dragState.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    const rect = svgRef.current.getBoundingClientRect();
    const deltaX =
      (pointerDeltaX / rect.width) * dragState.startViewBox.width;
    const deltaY =
      (pointerDeltaY / rect.height) * dragState.startViewBox.height;

    setViewBox(
      clampViewBox({
        ...dragState.startViewBox,
        x: dragState.startViewBox.x - deltaX,
        y: dragState.startViewBox.y - deltaY
      })
    );
  };

  const finishDrag = (pointerId: number, currentTarget: SVGSVGElement) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== pointerId) {
      return;
    }

    if (currentTarget.hasPointerCapture(pointerId)) {
      currentTarget.releasePointerCapture(pointerId);
    }

    suppressClickRef.current = dragState.moved;
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    if (!svgRef.current) {
      return;
    }

    event.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const originX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const originY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    handleZoom(event.deltaY < 0 ? "in" : "out", originX, originY);
  };

  const stopMapControlPointer = (
    event: React.PointerEvent<HTMLDivElement | HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <section className="panel map-panel">
      <div className="map-shell">
        <div className="map-frame" data-dragging={isDragging} data-zoomed={isZoomed}>
          <div className="map-controls" onPointerDown={stopMapControlPointer}>
            <button
              aria-label={t.zoomIn}
              className="map-control"
              onClick={(event) => {
                event.stopPropagation();
                handleZoom("in");
              }}
              type="button"
            >
              +
            </button>
            <button
              aria-label={t.zoomOut}
              className="map-control"
              onClick={(event) => {
                event.stopPropagation();
                handleZoom("out");
              }}
              type="button"
            >
              -
            </button>
            <button
              aria-label={t.resetZoom}
              className="map-control map-control--reset"
              onClick={(event) => {
                event.stopPropagation();
                setViewBox(INITIAL_VIEWBOX);
              }}
              type="button"
            >
              {t.reset}
            </button>
          </div>

          {focusedCountry ? (
            <div className="map-focus-card">
              <strong><CountryFlag code={focusedCountry.code} /> {getCountryDisplayName(focusedCountry.code ?? "", locale)}</strong>
              <p>
                {t.friendCount(focusedCountry.count)}
              </p>
            </div>
          ) : null}

          <svg
            aria-label={t.worldMap}
            className="map-svg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => finishDrag(event.pointerId, event.currentTarget)}
            onPointerCancel={(event) => finishDrag(event.pointerId, event.currentTarget)}
            onWheel={handleWheel}
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          >
            <rect
              className="map-svg__backdrop"
              height={MAP_HEIGHT}
              onClick={() => {
                if (shouldSuppressClick()) {
                  return;
                }

                onSelectCountry(null);
              }}
              width={MAP_WIDTH}
              x="0"
              y="0"
            />

            {mapCountries.map((country) => {
              const isInteractive = Boolean(country.code);
              const isActive = country.code !== null && (country.code === hoveredCode || country.code === selectedCode);
              const tone = getCountryTone(country.count, maxCount);
              const label = `${country.name}: ${t.friendCount(country.count)}`;

              return (
                <path
                  aria-label={label}
                  aria-pressed={country.code === selectedCode}
                  className="map-country"
                  d={country.path}
                  data-active={isActive}
                  data-interactive={isInteractive}
                  data-tone={tone}
                  key={country.renderKey}
                  onBlur={() => onHoverChange(null)}
                  onClick={() => {
                    if (shouldSuppressClick()) {
                      return;
                    }

                    if (country.code) {
                      onSelectCountry(country.code);
                    }
                  }}
                  onFocus={() => {
                    if (country.code) {
                      onHoverChange(country.code);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!country.code) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectCountry(country.code);
                    }
                  }}
                  onMouseEnter={() => {
                    if (country.code && !isDragging) {
                      onHoverChange(country.code);
                    }
                  }}
                  onMouseLeave={() => onHoverChange(null)}
                  role={country.code ? "button" : undefined}
                  tabIndex={country.code ? 0 : -1}
                />
              );
            })}
          </svg>

          {unknownCount > 0 ? (
            <div className="map-footer">
              <div className="map-unknown">
                {t.unknownLocation}: {t.friendCount(unknownCount)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
