"use client";

import { useEffect, useRef } from "react";

// low-framerate noise grain overlay — almost subliminal
export function StaticNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 128;
    canvas.width = size;
    canvas.height = size;

    let frameId: number;
    let lastTime = 0;
    const interval = 1000 / 10; // ~10fps for that gritty feel

    function render(time: number) {
      frameId = requestAnimationFrame(render);
      if (time - lastTime < interval) return;
      lastTime = time;

      const imageData = ctx!.createImageData(size, size);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx!.putImageData(imageData, 0, 0);
    }

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fx-static-noise"
      aria-hidden="true"
    />
  );
}
