import { fabric } from "fabric";

type FabricInternals = typeof fabric & {
  controlsUtils: {
    renderCircleControl: (
      this: fabric.Control,
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number,
      styleOverride: Record<string, unknown>,
      fabricObject: fabric.Object,
    ) => void;
  };
};

const controlsUtils = (): FabricInternals["controlsUtils"] =>
  (fabric as FabricInternals).controlsUtils;

/**
 * Distance above the selection top edge (pixels in Fabric control space).
 */
const OFFSET_ABOVE_PX = -56;

/**
 * Canva-style rotation handle: circle base + curved-arrow glyph.
 * Size comes from `cornerSize` / styleOverride (scaled by `fabric-selection-zoom-sync`).
 * Patches the shared `mtr` control (also used by Textbox via reference).
 */
export function patchFabricRotationControl(): void {
  const objectProto = fabric.Object.prototype as unknown as {
    __brochifyRotationControl?: boolean;
    controls: Record<string, fabric.Control>;
  };

  if (objectProto.__brochifyRotationControl) {
    return;
  }
  objectProto.__brochifyRotationControl = true;

  const mtr = objectProto.controls.mtr;
  if (!mtr) {
    return;
  }

  // Let zoom-sync pass `cornerSize` / touch sizes via drawControls; keeps rotate glyph sized with corners.
  const bare = mtr as unknown as Record<string, unknown>;
  delete bare.sizeX;
  delete bare.sizeY;
  delete bare.touchSizeX;
  delete bare.touchSizeY;
  mtr.offsetY = OFFSET_ABOVE_PX;

  mtr.render = function renderCanvaRotationHandle(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: Record<string, unknown>,
    fabricObject: fabric.Object,
  ) {
    controlsUtils().renderCircleControl.call(
      this,
      ctx,
      left,
      top,
      styleOverride,
      fabricObject,
    );

    const stroke =
      (styleOverride.cornerStrokeColor as string | undefined)
      || fabricObject.cornerStrokeColor
      || "#3b82f6";

    const diam =
      Number(styleOverride.cornerSize)
      || Number(this.sizeX)
      || fabricObject.cornerSize
      || 12;
    const r = diam * 0.175;

    ctx.save();
    ctx.translate(left, top);

    const zoom = fabricObject.canvas ? Math.min(Math.max(fabricObject.canvas.getZoom(), 0.08), 16) : 1;
    ctx.strokeStyle = stroke;
    ctx.fillStyle = stroke;
    ctx.lineWidth = clamp(1 * zoom, 0.9, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = Math.PI * 0.25;
    const end = Math.PI * 1.42;
    ctx.beginPath();
    ctx.arc(0, 0, r, start, end);
    ctx.stroke();

    const tipAngle = end;
    const tx = Math.cos(tipAngle) * r;
    const ty = Math.sin(tipAngle) * r;
    const tangX = -Math.sin(tipAngle);
    const tangY = Math.cos(tipAngle);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - tangX * 2 - Math.cos(tipAngle), ty - tangY * 2 - Math.sin(tipAngle));
    ctx.lineTo(tx + tangX * 0.85, ty + tangY * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
