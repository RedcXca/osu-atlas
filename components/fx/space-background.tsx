"use client";

type SpaceBackgroundProps = {
  cameraRotation?: { x: number; y: number };
};

// starfield that rotates with the globe camera
export function SpaceBackground({ cameraRotation }: Readonly<SpaceBackgroundProps>) {
  const rotationX = cameraRotation?.x ?? 0;
  const rotationY = cameraRotation?.y ?? 0;
  const starfieldTransform = [
    `translate3d(${rotationY * 0.35}px, ${rotationX * 0.35}px, 0)`,
    `rotateX(${rotationX * 0.72}deg)`,
    `rotateY(${rotationY * 0.92}deg)`,
    "scale(1.12)"
  ].join(" ");

  function getLayerTransform(depth: { drift: number; roll: number; scale: number; shift: number }) {
    const translateX = rotationY * depth.shift;
    const translateY = rotationX * depth.shift;
    const roll = rotationY * depth.roll;

    return [
      `translate3d(${translateX}px, ${translateY}px, 0)`,
      `rotateZ(${roll}deg)`,
      `translateZ(${depth.drift}px)`,
      `scale(${depth.scale})`
    ].join(" ");
  }

  return (
    <div className="space-bg" aria-hidden="true">
      <div
        className="space-bg__nebula"
        style={{
          transform: [
            `translate3d(${rotationY * 1.2}px, ${rotationX * 1.2}px, 0)`,
            `rotateZ(${rotationY * 0.25}deg)`,
            "scale(1.04)"
          ].join(" ")
        }}
      />
      <div className="space-bg__stars" style={{ transform: starfieldTransform }}>
        <div
          className="space-bg__layer space-bg__layer--far"
          style={{ transform: getLayerTransform({ drift: -12, roll: 0.12, scale: 1.08, shift: 0.45 }) }}
        />
        <div
          className="space-bg__layer space-bg__layer--mid"
          style={{ transform: getLayerTransform({ drift: 0, roll: 0.18, scale: 1.11, shift: 0.8 }) }}
        />
        <div
          className="space-bg__layer space-bg__layer--near"
          style={{ transform: getLayerTransform({ drift: 14, roll: 0.26, scale: 1.16, shift: 1.2 }) }}
        />
      </div>
    </div>
  );
}
