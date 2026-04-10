"use client";

import { useEffect, useRef } from "react";

// animated circuit board pattern overlay — thin traces that shimmer
export function CircuitOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = 0;
    let h = 0;

    type Trace = {
      x: number;
      y: number;
      segments: { dx: number; dy: number; len: number }[];
      totalLen: number;
      speed: number;
      offset: number;
      opacity: number;
    };

    let traces: Trace[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initTraces();
    }

    function initTraces() {
      traces = [];
      const count = Math.floor((w * h) / 25000);

      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const segments: Trace["segments"] = [];
        let totalLen = 0;

        // generate 3-7 right-angle segments
        const segCount = 3 + Math.floor(Math.random() * 5);
        let horizontal = Math.random() > 0.5;

        for (let s = 0; s < segCount; s++) {
          const len = 15 + Math.random() * 60;
          segments.push({
            dx: horizontal ? (Math.random() > 0.5 ? 1 : -1) : 0,
            dy: horizontal ? 0 : (Math.random() > 0.5 ? 1 : -1),
            len
          });
          totalLen += len;
          horizontal = !horizontal;
        }

        traces.push({
          x, y, segments, totalLen,
          speed: 0.3 + Math.random() * 0.8,
          offset: Math.random() * 1000,
          opacity: 0.03 + Math.random() * 0.05
        });
      }
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h);

      for (const trace of traces) {
        // shimmer position — a bright dot traveling along the trace
        const shimmerPos = ((time * trace.speed * 0.02 + trace.offset) % (trace.totalLen * 2));
        const shimmerNorm = shimmerPos > trace.totalLen
          ? 2 - shimmerPos / trace.totalLen
          : shimmerPos / trace.totalLen;

        let cx = trace.x;
        let cy = trace.y;
        let accLen = 0;

        ctx!.beginPath();
        ctx!.moveTo(cx, cy);

        for (const seg of trace.segments) {
          const endX = cx + seg.dx * seg.len;
          const endY = cy + seg.dy * seg.len;
          ctx!.lineTo(endX, endY);

          accLen += seg.len;
          cx = endX;
          cy = endY;
        }

        // draw the base trace
        ctx!.strokeStyle = `rgba(218, 212, 204, ${trace.opacity})`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();

        // draw shimmer dot
        let shimmerX = trace.x;
        let shimmerY = trace.y;
        let targetDist = shimmerNorm * trace.totalLen;

        for (const seg of trace.segments) {
          if (targetDist <= seg.len) {
            shimmerX += seg.dx * targetDist;
            shimmerY += seg.dy * targetDist;
            break;
          }
          shimmerX += seg.dx * seg.len;
          shimmerY += seg.dy * seg.len;
          targetDist -= seg.len;
        }

        const shimmerAlpha = 0.15 + 0.15 * Math.sin(time * 0.003 + trace.offset);
        ctx!.beginPath();
        ctx!.arc(shimmerX, shimmerY, 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(218, 212, 204, ${shimmerAlpha})`;
        ctx!.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);

    // throttle to ~30fps to halve GPU cost
    let frameId: number;
    let lastDraw = 0;
    function loop(time: number) {
      if (time - lastDraw >= 33) {
        draw(time);
        lastDraw = time;
      }
      frameId = requestAnimationFrame(loop);
    }
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fx-circuit"
      aria-hidden="true"
    />
  );
}
