import { fabric } from "fabric";
import { useEffect } from "react";

import { refreshFabricTextEditingAnchor } from "@/features/editor/utils";

interface UseViewportInteractionsProps {
  canvas: fabric.Canvas | null;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) {
    return false;
  }

  return !!el.closest("input, textarea, select, [contenteditable='true']");
}

/** Convert wheel deltas to pixels for consistent pan/zoom across mice and trackpads. */
function normalizeWheelDelta(e: WheelEvent): { dx: number; dy: number } {
  let dx = e.deltaX;
  let dy = e.deltaY;

  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    const linePx = 16;
    dx *= linePx;
    dy *= linePx;
  }

  return { dx, dy };
}

/**
 * Fabric `zoomToPoint` expects a point in **canvas buffer coordinates** (same as `getPointer(e, true)`:
 * pointer on the drawable canvas before applying `viewportTransform` inverse). Using `getPointer(e)`
 * with default `ignoreZoom` gives **scene** coordinates and makes zoom feel wrong / drift.
 *
 * Canva-like behavior: zoom mostly tracks the pointer, with a small pull toward the viewport center so
 * corners do not feel jumpy. Adjust `viewportCenterWeight` between 0 (pure cursor) and ~0.35 (more stable).
 */
function zoomFocalPoint(
  canvas: fabric.Canvas,
  e: WheelEvent,
  viewportCenterWeight: number,
): fabric.Point {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const cx = w / 2;
  const cy = h / 2;

  const pointer = canvas.getPointer(e, true);
  const wx = viewportCenterWeight;

  return new fabric.Point(
    pointer.x * (1 - wx) + cx * wx,
    pointer.y * (1 - wx) + cy * wx,
  );
}

export function useViewportInteractions({ canvas }: UseViewportInteractionsProps) {
  useEffect(() => {
    if (!canvas) {
      return;
    }

    const wrapper = (canvas as fabric.Canvas & { wrapperEl: HTMLDivElement }).wrapperEl;
    if (!wrapper) {
      return;
    }

    let isPanning = false;
    let lastClientX = 0;
    let lastClientY = 0;
    let spaceHeld = false;
    let suppressedSelection = false;
    let capturedPointerId: number | null = null;

    const restoreInteractionChrome = () => {
      if (suppressedSelection) {
        canvas.selection = true;
        canvas.skipTargetFind = false;
        suppressedSelection = false;
      }

      canvas.defaultCursor = "default";
    };

    const releasePointerCaptureSafe = () => {
      if (capturedPointerId === null) {
        return;
      }
      try {
        wrapper.releasePointerCapture(capturedPointerId);
      } catch {
        /* pointer may already be released */
      }
      capturedPointerId = null;
    };

    const beginPan = (clientX: number, clientY: number) => {
      isPanning = true;
      lastClientX = clientX;
      lastClientY = clientY;

      if (canvas.selection) {
        suppressedSelection = true;
        canvas.selection = false;
      }

      canvas.skipTargetFind = true;
      canvas.defaultCursor = "grabbing";
    };

    const endPan = () => {
      releasePointerCaptureSafe();

      if (!isPanning) {
        return;
      }

      isPanning = false;
      restoreInteractionChrome();

      if (spaceHeld) {
        canvas.defaultCursor = "grab";
      }
    };

    const recoverInteractionIfPointerLost = () => {
      releasePointerCaptureSafe();
      spaceHeld = false;
      const hadLock = isPanning || suppressedSelection;
      isPanning = false;
      if (hadLock) {
        restoreInteractionChrome();
      }
      canvas.defaultCursor = "default";
    };

    const onWheel = (e: WheelEvent) => {
      if (!wrapper.contains(e.target as Node)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const { dx, dy } = normalizeWheelDelta(e);

      // Canva-style: two-finger scroll pans; pinch (Ctrl/Cmd+wheel on trackpad) or Ctrl/Cmd+mouse wheel zooms.
      const zoomGesture = e.ctrlKey || e.metaKey;

      if (!zoomGesture) {
        const vpt = canvas.viewportTransform;
        if (!vpt) {
          return;
        }

        const next: [number, number, number, number, number, number] = [
          vpt[0],
          vpt[1],
          vpt[2],
          vpt[3],
          vpt[4] - dx,
          vpt[5] - dy,
        ];
        canvas.setViewportTransform(next);
        refreshFabricTextEditingAnchor(canvas);
        canvas.requestRenderAll();
        return;
      }

      // Pinch / Ctrl+wheel: zoom with focal = blend(cursor on canvas, viewport center).
      let zoom = canvas.getZoom();
      const sensitivity = 0.0024;
      zoom *= Math.exp(-dy * sensitivity);
      zoom = Math.min(Math.max(zoom, 0.05), 12);

      const viewportCenterWeight = 0.2;
      const focal = zoomFocalPoint(canvas, e, viewportCenterWeight);

      canvas.zoomToPoint(focal, zoom);
      refreshFabricTextEditingAnchor(canvas);
      canvas.requestRenderAll();
    };

    const onCanvasMouseDown = (opt: fabric.IEvent) => {
      if (canvas.isDrawingMode) {
        return;
      }

      const e = opt.e as MouseEvent;

      if (isTypingTarget(e.target)) {
        return;
      }

      // Fabric runs its mousedown handler before this `mouse:down` callback. If a resize/rotate
      // handle or move has started, `_currentTransform` is set — never steal the gesture for pan.
      const transformActive = (canvas as unknown as { _currentTransform?: unknown })._currentTransform;
      if (transformActive) {
        return;
      }

      // Use Fabric's own target resolution (groups, corners, subTargets). Manual containsPoint with
      // getPointer() drifted from Fabric when zoomed/grouped and wrongly treated object hits as “empty”,
      // which started pan + skipTargetFind and made the canvas feel stuck until refresh.
      const targetUnderPointer = canvas.findTarget(e, false);
      const isClickOnObject = Boolean(targetUnderPointer);

      // Pan gesture: middle mouse, Alt+left click, Space+left click, or left click on empty canvas (not on an object)
      const panGesture =
        e.button === 1
        || (e.button === 0 && e.altKey)
        || (e.button === 0 && spaceHeld)
        || (e.button === 0 && !isClickOnObject);

      if (!panGesture) {
        return;
      }

      if (e.button === 1) {
        e.preventDefault();
      }

      canvas.discardActiveObject();
      canvas.requestRenderAll();
      beginPan(e.clientX, e.clientY);

      const pe = e as MouseEvent & { pointerId?: number };
      if (typeof pe.pointerId === "number") {
        try {
          wrapper.setPointerCapture(pe.pointerId);
          capturedPointerId = pe.pointerId;
        } catch {
          capturedPointerId = null;
        }
      }

      e.preventDefault();
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isPanning) {
        return;
      }

      const vpt = canvas.viewportTransform;
      if (!vpt) {
        return;
      }

      vpt[4] += e.clientX - lastClientX;
      vpt[5] += e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      refreshFabricTextEditingAnchor(canvas);
      canvas.requestRenderAll();
    };

    const onWindowMouseUp = () => {
      endPan();
    };

    const onWindowBlur = () => {
      // If mouseup happens outside the window (or OS eats it), pan never ends and skipTargetFind
      // stays true — clicks no longer hit targets until refresh.
      recoverInteractionIfPointerLost();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") {
        return;
      }

      if (isTypingTarget(e.target)) {
        return;
      }

      const active = canvas.getActiveObject();
      if (
        active
        && (active.type === "textbox" || active.type === "i-text")
        && !!(active as fabric.IText).isEditing
      ) {
        return;
      }

      if (!spaceHeld) {
        spaceHeld = true;
        canvas.defaultCursor = "grab";
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") {
        return;
      }

      spaceHeld = false;

      if (!isPanning) {
        canvas.defaultCursor = "default";
      }
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    canvas.on("mouse:down", onCanvasMouseDown);
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    window.addEventListener("pointerup", onWindowMouseUp);
    window.addEventListener("pointercancel", onWindowMouseUp);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);

    return () => {
      wrapper.removeEventListener("wheel", onWheel);
      canvas.off("mouse:down", onCanvasMouseDown);
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
      window.removeEventListener("pointerup", onWindowMouseUp);
      window.removeEventListener("pointercancel", onWindowMouseUp);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);

      recoverInteractionIfPointerLost();
    };
  }, [canvas]);
}
