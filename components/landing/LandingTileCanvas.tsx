"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas tile wave background — updated for a premium dark mode aesthetic.
 */

const BASE_TILE_SIZE = 52;
const GAP = 1;
const CORNER_RADIUS = 2;
const WAVE1_SPEED = 0.5;
const WAVE1_FREQ = 3.5;
const WAVE2_SPEED = 0.3;
const WAVE2_FREQ = 2.2;
const MAX_HIGHLIGHT = 0.12;
const COLOR_STEPS = 48;

const BROCHIFY_DARK = {
  bg: "#05040A", // Deep space background
  tileBase: [10, 8, 14] as [number, number, number],
  tileHl: [50, 35, 90] as [number, number, number], // Very subtle violet
  borderRgb: [20, 16, 28] as [number, number, number],
  vignetteRgb: [5, 4, 10] as [number, number, number],
};

function buildColorLut(
  baseRgb: [number, number, number],
  hlRgb: [number, number, number],
): string[] {
  const lut: string[] = [];
  for (let i = 0; i < COLOR_STEPS; i++) {
    const t = i / (COLOR_STEPS - 1);
    const r = Math.round(baseRgb[0] + (hlRgb[0] - baseRgb[0]) * t);
    const g = Math.round(baseRgb[1] + (hlRgb[1] - baseRgb[1]) * t);
    const b = Math.round(baseRgb[2] + (hlRgb[2] - baseRgb[2]) * t);
    const a = (0.3 + t * 0.7).toFixed(3);
    lut.push(`rgba(${r},${g},${b},${a})`);
  }
  return lut;
}

function smoothwave(x: number): number {
  const clamped = Math.max(-1, Math.min(1, x));
  return (1 - Math.cos((clamped + 1) * Math.PI * 0.5)) * 0.5;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function LandingTileCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const palette = BROCHIFY_DARK;
    const colorLut = buildColorLut(palette.tileBase, palette.tileHl);
    const [br, bg, bb] = palette.borderRgb;
    const borderColor = `rgba(${br},${bg},${bb},0.6)`;
    const [vr, vg, vb] = palette.vignetteRgb;

    let rafId: number;

    const draw = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const bufferW = Math.round(w * dpr);
      const bufferH = Math.round(h * dpr);
      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      const tileSize =
        w < 640 ? BASE_TILE_SIZE * 0.72 : w < 1280 ? BASE_TILE_SIZE * 0.82 : BASE_TILE_SIZE;
      const step = tileSize + GAP;

      const cols = Math.ceil(w / step) + 1;
      const rows = Math.ceil(h / step) + 1;
      const invCols = 1 / cols;
      const invRows = 1 / rows;

      const phase1 = elapsed * WAVE1_SPEED;
      const phase2 = elapsed * WAVE2_SPEED;
      const twoPi = Math.PI * 2;

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;

      for (let row = 0; row < rows; row++) {
        const ny = row * invRows;
        const py = row * step;

        for (let col = 0; col < cols; col++) {
          const nx = col * invCols;
          const px = col * step;

          const d1 = nx + ny;
          const wave1 = Math.sin(phase1 + d1 * twoPi * WAVE1_FREQ);

          const d2 = nx * 0.6 - ny * 0.4;
          const wave2 = Math.sin(phase2 + d2 * WAVE2_FREQ);

          const combined = wave1 * 0.65 + wave2 * 0.35;
          const highlight = smoothwave(combined) * MAX_HIGHLIGHT;

          const lutIdx = Math.min(
            COLOR_STEPS - 1,
            Math.max(0, ((highlight / MAX_HIGHLIGHT) * (COLOR_STEPS - 1)) | 0),
          );

          ctx.fillStyle = colorLut[lutIdx];
          roundedRect(ctx, px, py, tileSize, tileSize, CORNER_RADIUS);
          ctx.fill();
          ctx.stroke();
        }
      }

      const vignetteW = w * 0.42;
      const vignette = ctx.createLinearGradient(0, 0, vignetteW, 0);
      vignette.addColorStop(0, `rgba(${vr},${vg},${vb},1)`);
      vignette.addColorStop(0.5, `rgba(${vr},${vg},${vb},0.7)`);
      vignette.addColorStop(0.8, `rgba(${vr},${vg},${vb},0.2)`);
      vignette.addColorStop(1, `rgba(${vr},${vg},${vb},0)`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, vignetteW, h);

      const bottomFade = ctx.createLinearGradient(0, h * 0.68, 0, h);
      bottomFade.addColorStop(0, `rgba(${vr},${vg},${vb},0)`);
      bottomFade.addColorStop(1, `rgba(${vr},${vg},${vb},1)`);
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
