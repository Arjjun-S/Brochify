import { fabric } from "fabric";
import { useCallback, useEffect } from "react";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
  activePage?: number;
}

export const useAutoResize = ({ canvas, container, activePage = 1 }: UseAutoResizeProps) => {
  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

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

    canvas.setViewportTransform(fabric.iMatrix.concat());
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

    const workspaceCenter = zoomTarget.getCenterPoint();
    const viewportTransform = canvas.viewportTransform;

    if (
      canvas.width === undefined ||
      canvas.height === undefined ||
      !viewportTransform
    ) {
      return;
    }

    const nextViewportTransform: [number, number, number, number, number, number] = [
      viewportTransform[0],
      viewportTransform[1],
      viewportTransform[2],
      viewportTransform[3],
      canvas.width / 2 - workspaceCenter.x * viewportTransform[0],
      canvas.height / 2 - workspaceCenter.y * viewportTransform[3],
    ];

    canvas.setViewportTransform(nextViewportTransform);

    zoomTarget.clone((cloned: fabric.Rect) => {
      canvas.clipPath = cloned;
      canvas.requestRenderAll();
    });
  }, [canvas, container, activePage]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (canvas && container) {
      resizeObserver = new ResizeObserver(() => {
        autoZoom();
      });

      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom };
};
