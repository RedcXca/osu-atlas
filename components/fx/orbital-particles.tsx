"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  radius: number;
  centerX: number;
  centerY: number;
  opacity: number;
  type: "dot" | "cube" | "ring";
  phase: number;
};

// floating particles around the globe — dots, tiny cubes, orbit rings
export function OrbitalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let resizeObserver: ResizeObserver | null = null;

    function resize() {
      const rect = canvas!.parentElement?.getBoundingClientRect();
      if (!rect) return;
      w = rect.width;
      h = rect.height;
      canvas!.width = w * window.devicePixelRatio;
      canvas!.height = h * window.devicePixelRatio;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      initParticles();
    }

    function initParticles() {
      particles = [];
      const cx = w / 2;
      const cy = h / 2;
      const count = 35 + Math.floor(Math.random() * 15);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const minRadius = Math.min(w, h) * 0.18;
        const maxRadius = Math.min(w, h) * 0.48;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const typeRoll = Math.random();
        const type: Particle["type"] = typeRoll < 0.5 ? "dot" : typeRoll < 0.82 ? "cube" : "ring";

        particles.push({
          x: 0,
          y: 0,
          size: type === "dot" ? 1 + Math.random() * 1.5 : type === "ring" ? 2.5 + Math.random() * 2 : 1.5 + Math.random() * 2,
          speed: (0.0002 + Math.random() * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
          angle,
          radius,
          centerX: cx,
          centerY: cy,
          opacity: 0.15 + Math.random() * 0.35,
          type,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.angle += p.speed;

        // slight vertical oscillation for depth feel
        const yOsc = Math.sin(time * 0.0003 + p.phase) * 8;

        p.x = p.centerX + Math.cos(p.angle) * p.radius;
        p.y = p.centerY + Math.sin(p.angle) * p.radius * 0.35 + yOsc;

        // fade out particles near the globe center
        const distFromCenter = Math.sqrt(
          (p.x - p.centerX) ** 2 + ((p.y - p.centerY - yOsc) / 0.35) ** 2
        );
        const minFadeDist = Math.min(w, h) * 0.15;
        const fadeFactor = Math.min(1, (distFromCenter - minFadeDist) / (minFadeDist * 0.5));
        const alpha = p.opacity * Math.max(0, fadeFactor);

        if (alpha <= 0.01) continue;

        // twinkle
        const twinkle = 0.7 + 0.3 * Math.sin(time * 0.002 + p.phase);
        const finalAlpha = alpha * twinkle;

        ctx!.globalAlpha = finalAlpha;

        if (p.type === "dot") {
          ctx!.fillStyle = "#dad4cc";
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
        } else if (p.type === "cube") {
          ctx!.strokeStyle = "#dad4cc";
          ctx!.lineWidth = 0.6;
          const s = p.size;
          const rotation = time * 0.0008 + p.phase;
          ctx!.save();
          ctx!.translate(p.x, p.y);
          ctx!.rotate(rotation);
          ctx!.strokeRect(-s, -s, s * 2, s * 2);
          ctx!.restore();
        } else {
          // ring
          ctx!.strokeStyle = "#dad4cc";
          ctx!.lineWidth = 0.5;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      ctx!.globalAlpha = 1;
    }

    resize();
    window.addEventListener("resize", resize);
    if (canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas.parentElement);
    }

    let frameId: number;
    function loop(time: number) {
      draw(time);
      frameId = requestAnimationFrame(loop);
    }
    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="orbital-particles"
      aria-hidden="true"
    />
  );
}
