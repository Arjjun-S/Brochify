import { fabric } from "fabric";
import { useCallback, useEffect } from "react";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas.setWidth(width);
    canvas.setHeight(height);

    const center = canvas.getCenter();

    const zoomRatio = 0.85;
    const localWorkspace = canvas
      .getObjects()
      .find((object) => object.name === "clip");

    // Workspace may be temporarily unavailable while loading JSON.
    // In that case, keep the canvas sized but skip zoom math.
    if (!localWorkspace) {
      canvas.requestRenderAll();
      return;
    }

    const workspaceWidth = localWorkspace.getScaledWidth();
    const workspaceHeight = localWorkspace.getScaledHeight();

    if (!workspaceWidth || !workspaceHeight) {
      canvas.requestRenderAll();
      return;
    }

    const scale = Math.min(width / workspaceWidth, height / workspaceHeight);

    const zoom = zoomRatio * scale;

    canvas.setViewportTransform(fabric.iMatrix.concat());
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

    const workspaceCenter = localWorkspace.getCenterPoint();
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

    localWorkspace.clone((cloned: fabric.Rect) => {
      canvas.clipPath = cloned;
      canvas.requestRenderAll();
    });
  }, [canvas, container]);

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
