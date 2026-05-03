import { fabric } from "fabric";

/**
 * Fabric keeps selection corners and border stroke in ~fixed **screen** pixels while
 * `viewportTransform` zoom changes the object’s on-canvas size — so when you zoom in,
 * handles and the blue frame look **smaller relative** to the content (and feel like they
 * “shrink”). Scale corner/touch sizes and border line width by `getZoom()` so the UI
 * stays proportionate to the zoomed object, similar to Canva/Figma.
 */
export function patchFabricSelectionZoomSync(): void {
  const objectProto = fabric.Object.prototype as unknown as { __brochifySelZoom?: boolean };
  if (objectProto.__brochifySelZoom) {
    return;
  }
  objectProto.__brochifySelZoom = true;

  const origDrawControls = fabric.Object.prototype.drawControls;
  fabric.Object.prototype.drawControls = function (
    this: fabric.Object,
    ctx: CanvasRenderingContext2D,
    styleOverride?: Record<string, unknown>,
  ) {
    const c = this.canvas;
    const zoom = zoomFactor(c);
    const corner = Number(this.cornerSize) || 12;
    const touch =
      Number((this as unknown as { touchCornerSize?: number }).touchCornerSize) || 28;

    const merged: Record<string, unknown> = {
      ...(styleOverride ?? {}),
      cornerSize: clamp(corner * zoom, 8, 56),
      touchCornerSize: clamp(touch * zoom, 18, 80),
    };
    return origDrawControls.call(this, ctx, merged);
  };

  const origDrawBorders = fabric.Object.prototype.drawBorders;
  fabric.Object.prototype.drawBorders = function (
    this: fabric.Object,
    ctx: CanvasRenderingContext2D,
    styleOverride?: Record<string, unknown>,
  ) {
    const c = this.canvas;
    const zoom = zoomFactor(c);
    const prev = ctx.lineWidth;
    const bf = Number(this.borderScaleFactor);
    const factor = Number.isFinite(bf) && bf > 0 ? bf : 1;
    ctx.lineWidth = clamp(factor * zoom, 1, 4);
    try {
      return origDrawBorders.call(this, ctx, styleOverride);
    } finally {
      ctx.lineWidth = prev;
    }
  };

  const origDrawBordersInGroup = fabric.Object.prototype.drawBordersInGroup;
  fabric.Object.prototype.drawBordersInGroup = function (
    this: fabric.Object,
    ctx: CanvasRenderingContext2D,
    options: unknown,
    styleOverride?: Record<string, unknown>,
  ) {
    const c = this.canvas;
    const zoom = zoomFactor(c);
    const prev = ctx.lineWidth;
    const bf = Number(this.borderScaleFactor);
    const factor = Number.isFinite(bf) && bf > 0 ? bf : 1;
    ctx.lineWidth = clamp(factor * zoom, 1, 4);
    try {
      return origDrawBordersInGroup.call(this, ctx, options, styleOverride);
    } finally {
      ctx.lineWidth = prev;
    }
  };
}

function zoomFactor(canvas: fabric.Canvas | null | undefined): number {
  if (!canvas) {
    return 1;
  }
  const z = canvas.getZoom();
  if (!Number.isFinite(z) || z <= 0) {
    return 1;
  }
  return Math.min(Math.max(z, 0.08), 16);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
