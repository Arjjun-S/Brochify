import { fabric } from "fabric";
import { useCallback, useEffect, useRef } from "react";

import { refreshFabricTextEditingAnchor, syncCanvasClipToActivePage } from "@/features/editor/utils";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
  activePage?: number;
}

function shouldDeferViewport(canvas: fabric.Canvas | null): boolean {
  if (!canvas) {
    return false;
  }

  if (canvas.isDrawingMode) {
    return true;
  }

  const active = canvas.getActiveObject();
  if (!active || (active.type !== "textbox" && active.type !== "i-text")) {
    return false;
  }

  return !!(active as fabric.IText).isEditing;
}

export const useAutoResize = ({ canvas, container, activePage = 1 }: UseAutoResizeProps) => {
  const deferredViewportRef = useRef(false);

  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

    if (shouldDeferViewport(canvas)) {
      deferredViewportRef.current = true;
      return;
    }

    deferredViewportRef.current = false;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas.setWidth(width);
    canvas.setHeight(height);

    const center = canvas.getCenter();

    const localWorkspace = canvas
      .getObjects()
      .find((object) => object.name === "clip");
    const pageFrames = canvas
      .getObjects()
      .filter((object) => object.name === "page-frame")
      .sort((left, right) => (left.left ?? 0) - (right.left ?? 0));
    const pageIndex = Math.max(1, Math.floor(activePage));
    const zoomTarget = pageFrames[pageIndex - 1] ?? pageFrames[0] ?? localWorkspace;
    const zoomRatio = pageFrames.length > 0 ? 0.98 : 0.85;

    // Workspace may be temporarily unavailable while loading JSON.
    // In that case, keep the canvas sized but skip zoom math.
    if (!localWorkspace || !zoomTarget) {
      canvas.requestRenderAll();
      return;
    }

    const workspaceWidth = zoomTarget.getScaledWidth();
    const workspaceHeight = zoomTarget.getScaledHeight();

    if (!workspaceWidth || !workspaceHeight) {
      canvas.requestRenderAll();
      return;
    }

    const scale = Math.min(width / workspaceWidth, height / workspaceHeight);

    const zoom = zoomRatio * scale;

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

    const workspaceCenter = zoomTarget.getCenterPoint();
    const viewportTransform = canvas.viewportTransform;

    if (
      canvas.width === undefined ||
      canvas.height === undefined
    ) {
      return;
    }

    const safeViewport = Array.isArray(viewportTransform) && viewportTransform.length >= 6
      ? viewportTransform
      : [zoom, 0, 0, zoom, 0, 0];

    const scaleX = typeof safeViewport[0] === "number" ? safeViewport[0] : zoom;
    const skewX = typeof safeViewport[1] === "number" ? safeViewport[1] : 0;
    const skewY = typeof safeViewport[2] === "number" ? safeViewport[2] : 0;
    const scaleY = typeof safeViewport[3] === "number" ? safeViewport[3] : zoom;

    const nextViewportTransform: [number, number, number, number, number, number] = [
      scaleX,
      skewX,
      skewY,
      scaleY,
      canvas.width / 2 - workspaceCenter.x * scaleX,
      canvas.height / 2 - workspaceCenter.y * scaleY,
    ];

    canvas.setViewportTransform(nextViewportTransform);

    syncCanvasClipToActivePage(canvas, pageIndex);
    refreshFabricTextEditingAnchor(canvas);
    canvas.requestRenderAll();
  }, [canvas, container, activePage]);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    const flushDeferredViewport = () => {
      if (!deferredViewportRef.current || shouldDeferViewport(canvas)) {
        return;
      }

      deferredViewportRef.current = false;
      autoZoom();
    };

    canvas.on("mouse:down", flushDeferredViewport);
    canvas.on("selection:cleared", flushDeferredViewport);
    canvas.on("selection:updated", flushDeferredViewport);

    return () => {
      canvas.off("mouse:down", flushDeferredViewport);
      canvas.off("selection:cleared", flushDeferredViewport);
      canvas.off("selection:updated", flushDeferredViewport);
    };
  }, [canvas, autoZoom]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let frame = 0;

    if (canvas && container) {
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          autoZoom();
        });
      });

      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom };
};
