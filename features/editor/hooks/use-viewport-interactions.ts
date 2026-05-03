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

    const restoreInteractionChrome = () => {
      if (suppressedSelection) {
        canvas.selection = true;
        canvas.skipTargetFind = false;
        suppressedSelection = false;
      }

      canvas.defaultCursor = "default";
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
      if (!isPanning) {
        return;
      }

      isPanning = false;
      restoreInteractionChrome();

      if (spaceHeld) {
        canvas.defaultCursor = "grab";
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!wrapper.contains(e.target as Node)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      let zoom = canvas.getZoom();
      const pinch = e.ctrlKey || e.metaKey;
      const sensitivity = pinch ? 0.008 : 0.002;

      zoom *= Math.exp(-e.deltaY * sensitivity);
      zoom = Math.min(Math.max(zoom, 0.05), 12);

      const pointer = canvas.getPointer(e);
      canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), zoom);
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

      const p = canvas.getPointer(e, true);
      const pointer = new fabric.Point(p.x, p.y);
      const activeObject = canvas.getActiveObject();

      const activeExtras = activeObject as unknown as {
        containsPoint?: (point: fabric.Point) => boolean;
        _findTargetCorner?: (point: fabric.Point, forTouch: boolean) => string | false;
      };

      const util = fabric.util as typeof fabric.util & { isTouchEvent?: (ev: Event) => boolean };
      const isTouch = typeof util.isTouchEvent === "function" && util.isTouchEvent(e);

      const hitResizeHandle =
        Boolean(activeObject)
        && typeof activeExtras._findTargetCorner === "function"
        && Boolean(activeExtras._findTargetCorner(pointer, isTouch));

      const hitObjectBody =
        Boolean(activeObject)
        && typeof activeExtras.containsPoint === "function"
        && activeExtras.containsPoint(pointer);

      const isClickOnObject = Boolean(hitResizeHandle || hitObjectBody);

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
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);

    return () => {
      wrapper.removeEventListener("wheel", onWheel);
      canvas.off("mouse:down", onCanvasMouseDown);
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);

      endPan();
      spaceHeld = false;
      canvas.defaultCursor = "default";
    };
  }, [canvas]);
}
