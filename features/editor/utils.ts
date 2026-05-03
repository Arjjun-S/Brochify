import { uuid } from "uuidv4";
import { fabric } from "fabric";
import type { RGBColor } from "react-color";

type JsonObjectNode = {
  type?: string;
  objects?: JsonObjectNode[];
};

type JsonRecord = Record<string, unknown>;

const IDENTITY_VIEWPORT: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isTransformMatrix(value: unknown): value is [number, number, number, number, number, number] {
  return Array.isArray(value)
    && value.length >= 6
    && isFiniteNumber(value[0])
    && isFiniteNumber(value[1])
    && isFiniteNumber(value[2])
    && isFiniteNumber(value[3])
    && isFiniteNumber(value[4])
    && isFiniteNumber(value[5]);
}

/**
 * Fabric Textbox / IText assigns `styles[lineIndex][charIndex]` while editing.
 * If `styles[lineIndex]` is missing (common with hand-authored JSON), Fabric throws
 * e.g. "Cannot read properties of undefined (reading '11')" when typing past column 11.
 */
function normalizeFabricTextStyles(record: JsonRecord): void {
  const kind = record.type;
  if (kind !== "textbox" && kind !== "i-text" && kind !== "text") {
    return;
  }

  const rawText = typeof record.text === "string" ? record.text : "";
  const lineCount = Math.max(1, rawText.split(/\r?\n/).length);

  let styles = record.styles;
  if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
    styles = {};
    record.styles = styles;
  }

  const styleByLine = styles as Record<number, unknown>;
  for (let i = 0; i < lineCount; i++) {
    const row = styleByLine[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      styleByLine[i] = {};
    }
  }
}

function sanitizeObjectNode(node: unknown): void {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return;
  }

  const record = node as JsonRecord;

  if ("transformMatrix" in record && !isTransformMatrix(record.transformMatrix)) {
    delete record.transformMatrix;
  }

  if (!isFiniteNumber(record.scaleX)) {
    record.scaleX = 1;
  }

  if (!isFiniteNumber(record.scaleY)) {
    record.scaleY = 1;
  }

  if (!isFiniteNumber(record.left)) {
    record.left = 0;
  }

  if (!isFiniteNumber(record.top)) {
    record.top = 0;
  }

  normalizeFabricTextStyles(record);

  // Hand-authored templates often set a tiny placeholder `height`; Fabric keeps a mismatched
  // text cache and glyphs overlap at wrap boundaries (especially last words on a line).
  if (record.type === "textbox") {
    delete record.height;
  }

  const nestedObjects = record.objects;
  if (Array.isArray(nestedObjects)) {
    nestedObjects.forEach((child) => sanitizeObjectNode(child));
  }

  if (record.clipPath) {
    sanitizeObjectNode(record.clipPath);
  }
}

type FabricFilterCtor = new (
  options?: Record<string, unknown>,
) => fabric.IBaseFilter;

const filtersRegistry = fabric.Image.filters as unknown as Record<string, FabricFilterCtor | undefined>;

export function transformText(objects: JsonObjectNode[] | undefined) {
  if (!objects) return;

  objects.forEach((item) => {
    if (item.objects) {
      transformText(item.objects);
      return;
    }

    if (item.type === "text") {
      item.type = "textbox";
    }
  });
};

export function exportCropRectForFabricObject(o: fabric.Object): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  o.setCoords();
  const r = o.getBoundingRect(false);
  return {
    left: r.left,
    top: r.top,
    width: Math.max(1, Math.round(r.width)),
    height: Math.max(1, Math.round(r.height)),
  };
}

export function downloadFile(file: string, type: string, downloadBaseName?: string) {
  const anchorElement = document.createElement("a");

  anchorElement.href = file;
  const trimmed = typeof downloadBaseName === "string" ? downloadBaseName.trim() : "";
  const safe =
    trimmed.length > 0
      ? trimmed.replace(/[^\w\-]+/g, "_").slice(0, 120)
      : uuid();
  anchorElement.download = `${safe}.${type}`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  anchorElement.remove();
};

export function isTextType(type: string | undefined) {
  return type === "text" || type === "i-text" || type === "textbox";
};

export function rgbaObjectToString(rgba: RGBColor | "transparent") {
  if (rgba === "transparent") {
    return `rgba(0,0,0,0)`;
  }

  const alpha = rgba.a === undefined ? 1 : rgba.a;

  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
};

export const createFilter = (value: string) => {
  let effect: fabric.IBaseFilter | null;

  switch (value) {
    case "greyscale":
      effect = new fabric.Image.filters.Grayscale();
      break;
    case "polaroid":
      effect = filtersRegistry.Polaroid ? new filtersRegistry.Polaroid() : null;
      break;
    case "sepia":
      effect = new fabric.Image.filters.Sepia();
      break;
    case "kodachrome":
      effect = filtersRegistry.Kodachrome ? new filtersRegistry.Kodachrome() : null;
      break;
    case "contrast":
      effect = new fabric.Image.filters.Contrast({ contrast: 0.3 });
      break;
    case "brightness":
      effect = new fabric.Image.filters.Brightness({ brightness: 0.8 });
      break;
    case "brownie":
      effect = filtersRegistry.Brownie ? new filtersRegistry.Brownie() : null;
      break;
    case "vintage":
      effect = filtersRegistry.Vintage ? new filtersRegistry.Vintage() : null;
      break;
    case "technicolor":
      effect = filtersRegistry.Technicolor ? new filtersRegistry.Technicolor() : null;
      break;
    case "pixelate":
      effect = new fabric.Image.filters.Pixelate();
      break;
    case "invert":
      effect = new fabric.Image.filters.Invert();
      break;
    case "blur":
      effect = new fabric.Image.filters.Blur();
      break;
    case "sharpen":
      effect = new fabric.Image.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      });
      break;
    case "emboss":
      effect = new fabric.Image.filters.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      });
      break;
    case "removecolor":
      effect = filtersRegistry.RemoveColor
        ? new filtersRegistry.RemoveColor({
        threshold: 0.2,
        distance: 0.5
          })
        : null;
      break;
    case "blacknwhite":
      effect = filtersRegistry.BlackWhite ? new filtersRegistry.BlackWhite() : null;
      break;
    case "vibrance":
      effect = filtersRegistry.Vibrance
        ? new filtersRegistry.Vibrance({
        vibrance: 1,
          })
        : null;
      break;
    case "blendcolor":
      effect = new fabric.Image.filters.BlendColor({
        color: "#00ff00",
        mode: "multiply",
      });
      break;
    case "huerotate":
      effect = new fabric.Image.filters.HueRotation({
        rotation: 0.5,
      });
      break;
    case "resize":
      effect = new fabric.Image.filters.Resize();
      break;
    case "gamma":
      effect = filtersRegistry.Gamma
        ? new filtersRegistry.Gamma({
        gamma: [1, 0.5, 2.1]
          })
        : null;
      break;
    case "saturation":
      effect = new fabric.Image.filters.Saturation({
        saturation: 0.7,
      });
      break;
    default:
      effect = null;
      break;
  };

  return effect;
};

export function sanitizeCanvasState(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const state = data as JsonRecord;

  const rawObjects = state.objects;
  if (!Array.isArray(rawObjects)) {
    state.objects = [];
  }

  const viewportTransform = state.viewportTransform;
  state.viewportTransform = isTransformMatrix(viewportTransform)
    ? viewportTransform.slice(0, 6)
    : IDENTITY_VIEWPORT.slice();

  const objects = state.objects;
  if (Array.isArray(objects)) {
    objects.forEach((object) => sanitizeObjectNode(object));
  }

  if (state.backgroundImage) {
    sanitizeObjectNode(state.backgroundImage);
  }

  if (state.overlayImage) {
    sanitizeObjectNode(state.overlayImage);
  }

  return state;
}

/** Walk nested groups so JSON-loaded templates fix all text bodies. */
function walkFabricObjects(object: fabric.Object, visitor: (o: fabric.Object) => void) {
  visitor(object);
  if (object.type === "group") {
    (object as fabric.Group).forEachObject((child) => walkFabricObjects(child, visitor));
  }
}

function forEachFabricDescendant(canvas: fabric.Canvas, visitor: (o: fabric.Object) => void) {
  canvas.getObjects().forEach((object) => walkFabricObjects(object, visitor));
}

type PageInteractionBaseline = {
  selectable: boolean;
  evented: boolean;
};

/** Restores selectable/evented when leaving multi-page layout or after undo/load churn. */
const pageInteractionBaseline = new WeakMap<fabric.Object, PageInteractionBaseline>();

const PAGE_HIT_IGNORE_NAMES = new Set(["clip"]);

function resolveObjectPageIndex(
  object: fabric.Object,
  pageFrames: fabric.Object[],
): number | null {
  if (object.name && PAGE_HIT_IGNORE_NAMES.has(object.name)) {
    return null;
  }

  if (pageFrames.length < 2) {
    return null;
  }

  const tagged = (object as fabric.Object & { pageIndex?: number }).pageIndex;
  if (
    typeof tagged === "number"
    && tagged >= 1
    && tagged <= pageFrames.length
    && Number.isInteger(tagged)
  ) {
    return tagged;
  }

  object.setCoords();
  const c = object.getCenterPoint();

  for (let i = 0; i < pageFrames.length; i++) {
    const frame = pageFrames[i];
    frame.setCoords();
    const b = frame.getBoundingRect(true);
    const inX = c.x >= b.left && c.x <= b.left + b.width;
    const inY = c.y >= b.top && c.y <= b.top + b.height;
    if (inX && inY) {
      return i + 1;
    }
  }

  return null;
}

function syncCanvasPageInteractionToActivePage(
  canvas: fabric.Canvas,
  activePage: number,
  pageFrames: fabric.Object[],
): void {
  if (canvas.isDrawingMode) {
    return;
  }

  const page = Math.max(1, Math.floor(activePage));

  if (pageFrames.length < 2) {
    forEachFabricDescendant(canvas, (obj) => {
      if (obj.name && PAGE_HIT_IGNORE_NAMES.has(obj.name)) {
        return;
      }

      const baseline = pageInteractionBaseline.get(obj);
      if (baseline) {
        obj.set({
          selectable: baseline.selectable,
          evented: baseline.evented,
        });
        pageInteractionBaseline.delete(obj);
      }
    });
    return;
  }

  forEachFabricDescendant(canvas, (obj) => {
    if (obj.name && PAGE_HIT_IGNORE_NAMES.has(obj.name)) {
      return;
    }

    const p = resolveObjectPageIndex(obj, pageFrames);
    if (p === null) {
      return;
    }

    if (p === page) {
      pageInteractionBaseline.set(obj, {
        selectable: !!obj.selectable,
        evented: !!obj.evented,
      });
    }
  });

  forEachFabricDescendant(canvas, (obj) => {
    if (obj.name && PAGE_HIT_IGNORE_NAMES.has(obj.name)) {
      return;
    }

    const p = resolveObjectPageIndex(obj, pageFrames);
    if (p === null) {
      return;
    }

    if (p === page) {
      const baseline = pageInteractionBaseline.get(obj);
      if (baseline) {
        obj.set({
          selectable: baseline.selectable,
          evented: baseline.evented,
        });
      }
    }
    else {
      obj.set({ selectable: false, evented: false });
    }
  });

  const mustDiscard = canvas.getActiveObjects().some((obj) => {
    const p = resolveObjectPageIndex(obj, pageFrames);
    return p !== null && p !== page;
  });

  if (mustDiscard) {
    canvas.discardActiveObject();
  }
}

/** Deep-copy clip geometry so regrouping / JSON churn does not share disposed instances. */
export function duplicateLogoGroupClipPath(src: fabric.Object): fabric.Object {
  if (src.type === "rect") {
    const r = src as fabric.Rect;
    return new fabric.Rect({
      left: r.left,
      top: r.top,
      originX: r.originX,
      originY: r.originY,
      width: r.width,
      height: r.height,
      scaleX: r.scaleX,
      scaleY: r.scaleY,
      angle: r.angle,
      skewX: r.skewX,
      skewY: r.skewY,
      flipX: r.flipX,
      flipY: r.flipY,
      rx: r.rx,
      ry: r.ry,
    });
  }

  if (src.type === "circle") {
    const c = src as fabric.Circle;
    return new fabric.Circle({
      left: c.left,
      top: c.top,
      originX: c.originX,
      originY: c.originY,
      radius: c.radius,
      scaleX: c.scaleX,
      scaleY: c.scaleY,
      angle: c.angle,
      skewX: c.skewX,
      skewY: c.skewY,
      flipX: c.flipX,
      flipY: c.flipY,
    });
  }

  return src;
}

/**
 * Clip logo content to the dashed frame in **group** space. Image-level `clipPath` inside a Fabric
 * group often misaligns (asymmetric crop with visible padding). Masking the group to the frame
 * matches Canva-style frames and shows the full bitmap inside the rounded box.
 *
 * The frame object must stay in the group (invisible, no stroke) so the group's bounds stay the
 * frame size—not the image-only box. Removing the frame collapses bounds and desyncs `clipPath`
 * when the user scales the placeholder (logo appears clipped).
 */
export function applyLogoPlaceholderGroupClipPath(grp: fabric.Group) {
  const hasImage = grp.getObjects().some((o) => o.name === "placeholder-image");
  if (!hasImage) {
    grp.set({ clipPath: undefined });
    return;
  }

  const frame = grp.getObjects().find((o) => o.name === "image-placeholder-frame");

  grp.getObjects().forEach((o) => {
    if (o.name === "placeholder-image" && o.type === "image") {
      (o as fabric.Image).set({ clipPath: undefined, dirty: true });
    }
  });

  if (!frame) {
    grp.set("dirty", true);
    return;
  }

  if (frame.type === "circle") {
    const c = frame as fabric.Circle;
    grp.clipPath = new fabric.Circle({
      left: c.left,
      top: c.top,
      originX: c.originX,
      originY: c.originY,
      radius: c.radius,
      scaleX: c.scaleX,
      scaleY: c.scaleY,
      angle: c.angle,
      skewX: c.skewX,
      skewY: c.skewY,
      flipX: c.flipX,
      flipY: c.flipY,
    });
    c.set({
      stroke: null,
      strokeWidth: 0,
      strokeDashArray: null,
      fill: "rgba(255,255,255,0)",
      evented: false,
      selectable: false,
      dirty: true,
    });
  }
  else if (frame.type === "rect") {
    const r = frame as fabric.Rect;
    grp.clipPath = new fabric.Rect({
      left: r.left,
      top: r.top,
      originX: r.originX,
      originY: r.originY,
      width: r.width,
      height: r.height,
      scaleX: r.scaleX,
      scaleY: r.scaleY,
      angle: r.angle,
      skewX: r.skewX,
      skewY: r.skewY,
      flipX: r.flipX,
      flipY: r.flipY,
      rx: r.rx,
      ry: r.ry,
    });
    r.set({
      stroke: null,
      strokeWidth: 0,
      strokeDashArray: null,
      fill: "rgba(255,255,255,0)",
      evented: false,
      selectable: false,
      dirty: true,
    });
  }

  grp.set("dirty", true);
  grp.setCoords();
}

/**
 * Hand-built template JSON used `Group.fromObject` (isAlreadyGrouped: true) with child `left`/`top`
 * in "layout" space. Fabric expects center-relative coordinates in that path and skips `_calcBounds`,
 * so the selection box and dashed frame desync. Rebuild those groups the same way as interactive code
 * (`new fabric.Group(items)` without isAlreadyGrouped) so bounds and handles align.
 */
export function normalizeImagePlaceholderGroupsAfterLoad(canvas: fabric.Canvas) {
  type GroupInternals = fabric.Group & {
    _restoreObjectsState: () => fabric.Group;
  };

  const placeholders = canvas
    .getObjects()
    .map((obj, index) => ({ obj, index }))
    .filter(
      (entry): entry is { obj: fabric.Group; index: number } =>
        entry.obj.type === "group" && entry.obj.name === "image-placeholder",
    )
    .sort((a, b) => b.index - a.index);

  for (const { obj: grp, index } of placeholders) {
    const items = grp.getObjects().slice();
    if (items.length === 0) {
      continue;
    }

    const placeholderId = (grp as unknown as { placeholderId?: string }).placeholderId;
    const pageIndex = (grp as unknown as { pageIndex?: number }).pageIndex;
    const preservedClip = grp.clipPath ? duplicateLogoGroupClipPath(grp.clipPath) : undefined;

    (grp as unknown as GroupInternals)._restoreObjectsState();
    canvas.remove(grp);

    const newGroup = new fabric.Group(items, {
      name: "image-placeholder",
      subTargetCheck: false,
    });

    (newGroup as unknown as { placeholderId?: string }).placeholderId = placeholderId;
    (newGroup as unknown as { pageIndex?: number }).pageIndex = pageIndex;

    if (preservedClip && !items.some((o) => o.name === "image-placeholder-frame")) {
      newGroup.clipPath = preservedClip;
    }

    canvas.insertAt(newGroup, index, false);
    applyLogoPlaceholderGroupClipPath(newGroup);
  }
}

/**
 * Reset Fabric text layout/cache after loadFromJSON. Prevents overlapping glyphs when JSON
 * carried a wrong `height` or when object caching retains stale measurements.
 */
export function finalizeFabricTextObjectsAfterLoad(canvas: fabric.Canvas) {
  canvas.getObjects().forEach((object) => walkFabricObjects(object, (o) => {
    const kind = o.type;
    if (kind !== "textbox" && kind !== "i-text" && kind !== "text") {
      return;
    }

    const textLike = o as fabric.Textbox;
    textLike.set({ objectCaching: false });
    if (typeof textLike.initDimensions === "function") {
      textLike.initDimensions();
    }
    textLike.setCoords();
  }));

  normalizeImagePlaceholderGroupsAfterLoad(canvas);

  canvas.requestRenderAll();
}

/**
 * Fabric keeps a hidden textarea + relies on canvas `_offset` for IME/caret anchoring.
 * After scroll, resize, zoom, or pan, `_offset` can be stale — refresh before redraw.
 */
export function refreshFabricTextEditingAnchor(canvas: fabric.Canvas | null): void {
  if (!canvas) {
    return;
  }

  canvas.calcOffset();

  const active = canvas.getActiveObject();
  if (!active || (active.type !== "textbox" && active.type !== "i-text")) {
    return;
  }

  const textLike = active as fabric.IText;
  if (!textLike.isEditing) {
    return;
  }

  textLike.setCoords();

  const update = (
    textLike as unknown as { updateTextareaPosition?: () => void }
  ).updateTextareaPosition;

  if (typeof update === "function") {
    update.call(textLike);
  }
}

/**
 * Restrict canvas rendering to the active page frame (multi-page brochures) or workspace.
 * Uses scene-space bounds (`getBoundingRect(true)`) synchronously so clipping cannot lag behind async clones.
 */
export function syncCanvasClipToActivePage(canvas: fabric.Canvas, activePage: number): void {
  const workspace = canvas.getObjects().find((object) => object.name === "clip");
  const pageFrames = canvas
    .getObjects()
    .filter((object) => object.name === "page-frame")
    .sort((left, right) => (left.left ?? 0) - (right.left ?? 0));

  let clipTarget: fabric.Object | undefined;

  if (pageFrames.length >= 2) {
    const idx = Math.min(
      Math.max(0, Math.floor(activePage) - 1),
      pageFrames.length - 1,
    );
    clipTarget = pageFrames[idx];
  }
  else if (pageFrames.length === 1) {
    clipTarget = pageFrames[0];
  }
  else {
    clipTarget = workspace;
  }

  if (!clipTarget) {
    canvas.clipPath = undefined;
  }
  else {
    clipTarget.setCoords();
    const bounds = clipTarget.getBoundingRect(true);
    const rectLike = clipTarget as fabric.Rect;

    canvas.clipPath = new fabric.Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      rx: rectLike.rx ?? 0,
      ry: rectLike.ry ?? rectLike.rx ?? 0,
      originX: "left",
      originY: "top",
      fill: "#ffffff",
      strokeWidth: 0,
      selectable: false,
      evented: false,
    });
  }

  syncCanvasPageInteractionToActivePage(canvas, activePage, pageFrames);
}
