import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useEffect } from "react";

import { refreshFabricTextEditingAnchor } from "@/features/editor/utils";
import { applyCertificatePlaceholders } from "@/lib/domains/certificate";

interface UseCanvasEventsProps {
  save: () => void;
  canvas: fabric.Canvas | null;
  setSelectedObjects: (objects: fabric.Object[]) => void;
  clearSelectionCallback?: () => void;
  /** Registered with the current debounced persist cancel function (for undo/redo to flush noise). */
  onPersistCancelReady?: (cancel: () => void) => void;
}

export const useCanvasEvents = ({
  save,
  canvas,
  setSelectedObjects,
  clearSelectionCallback,
  onPersistCancelReady,
}: UseCanvasEventsProps) => {
  useEffect(() => {
    if (!canvas) {
      return;
    }

    const queuePersist = debounce(
      () => {
        save();
      },
      240,
      { maxWait: 900 },
    );

    onPersistCancelReady?.(() => {
      queuePersist.cancel();
    });

    const onSelectionCreated = (e: { selected?: fabric.Object[] }) => {
      setSelectedObjects(e.selected || []);
    };

    const onSelectionUpdated = (e: { selected?: fabric.Object[] }) => {
      setSelectedObjects(e.selected || []);
    };

    const onSelectionCleared = () => {
      setSelectedObjects([]);
      clearSelectionCallback?.();
    };

    const onTextEditingEntered = (e: any) => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).name === "brochitextbox" && (activeObject as any).originalText !== undefined) {
        activeObject.set({ text: (activeObject as any).originalText });
        canvas.renderAll();
      }
      refreshFabricTextEditingAnchor(canvas);
      requestAnimationFrame(() => refreshFabricTextEditingAnchor(canvas));
    };

    const onTextEditingExited = (e: any) => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).name === "brochitextbox") {
        const textLike = activeObject as fabric.Textbox;
        const currentText = textLike.text || "";
        (activeObject as any).originalText = currentText;

        const mockStudent = {
          serialNo: "001",
          salutation: "Mr",
          name: "Student",
          year: "2026",
          gender: "Mr" as const,
          prize: "First Place",
          event: "Web Dev Hackathon",
          date: "29 June 2026",
          organization: "SRM Institute of Science and Technology",
        };
        const previewText = applyCertificatePlaceholders(currentText, mockStudent);
        textLike.set({ text: previewText });
        canvas.renderAll();
      }
      queuePersist();
    };

    const onTextSelectionChanged = () => {
      refreshFabricTextEditingAnchor(canvas);
    };

    interface Guide {
      type: "vertical" | "horizontal";
      val: number;
    }

    let activeGuides: Guide[] = [];

    const onObjectMoving = (e: fabric.IEvent) => {
      const activeObject = e.target;
      if (!activeObject) return;

      activeGuides = [];
      const SNAP_TOLERANCE = 8;

      const objCenter = activeObject.getCenterPoint();
      const objWidth = activeObject.width * (activeObject.scaleX || 1);
      const objHeight = activeObject.height * (activeObject.scaleY || 1);
      
      const objLeft = activeObject.left;
      const objRight = activeObject.left + objWidth;
      const objTop = activeObject.top;
      const objBottom = activeObject.top + objHeight;

      // Get snapping targets (workspace center, workspace edges, other objects)
      const workspace = canvas.getObjects().find((o) => o.name === "clip");
      const targets: { x: number[]; y: number[] }[] = [];

      if (workspace) {
        const wsWidth = workspace.width || 0;
        const wsHeight = workspace.height || 0;
        const wsLeft = workspace.left || 0;
        const wsTop = workspace.top || 0;
        const wsCenterX = wsLeft + wsWidth / 2;
        const wsCenterY = wsTop + wsHeight / 2;

        targets.push({
          x: [wsLeft, wsCenterX, wsLeft + wsWidth],
          y: [wsTop, wsCenterY, wsTop + wsHeight],
        });
      }

      canvas.getObjects().forEach((target) => {
        if (target === activeObject || target.name === "clip" || target.name === "page-guide") {
          return;
        }
        const tWidth = target.width * (target.scaleX || 1);
        const tHeight = target.height * (target.scaleY || 1);
        const tCenterX = target.left + tWidth / 2;
        const tCenterY = target.top + tHeight / 2;

        targets.push({
          x: [target.left, tCenterX, target.left + tWidth],
          y: [target.top, tCenterY, target.top + tHeight],
        });
      });

      let snappedX: number | null = null;
      let snappedY: number | null = null;

      // Snapping logic for X
      for (const target of targets) {
        for (const tx of target.x) {
          if (Math.abs(objCenter.x - tx) < SNAP_TOLERANCE) {
            snappedX = tx - objWidth / 2;
            activeGuides.push({ type: "vertical", val: tx });
            break;
          }
          if (Math.abs(objLeft - tx) < SNAP_TOLERANCE) {
            snappedX = tx;
            activeGuides.push({ type: "vertical", val: tx });
            break;
          }
          if (Math.abs(objRight - tx) < SNAP_TOLERANCE) {
            snappedX = tx - objWidth;
            activeGuides.push({ type: "vertical", val: tx });
            break;
          }
        }
        if (snappedX !== null) break;
      }

      // Snapping logic for Y
      for (const target of targets) {
        for (const ty of target.y) {
          if (Math.abs(objCenter.y - ty) < SNAP_TOLERANCE) {
            snappedY = ty - objHeight / 2;
            activeGuides.push({ type: "horizontal", val: ty });
            break;
          }
          if (Math.abs(objTop - ty) < SNAP_TOLERANCE) {
            snappedY = ty;
            activeGuides.push({ type: "horizontal", val: ty });
            break;
          }
          if (Math.abs(objBottom - ty) < SNAP_TOLERANCE) {
            snappedY = ty - objHeight;
            activeGuides.push({ type: "horizontal", val: ty });
            break;
          }
        }
        if (snappedY !== null) break;
      }

      if (snappedX !== null) {
        activeObject.set({ left: snappedX });
      }
      if (snappedY !== null) {
        activeObject.set({ top: snappedY });
      }
    };

    const onAfterRender = () => {
      if (activeGuides.length === 0) return;
      const ctx = canvas.getContext();
      ctx.save();
      
      const v = canvas.viewportTransform;
      if (v) {
        ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
      }
      
      ctx.strokeStyle = "#3b82f6"; // Canva blue
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      activeGuides.forEach((guide) => {
        ctx.beginPath();
        if (guide.type === "vertical") {
          ctx.moveTo(guide.val, -10000);
          ctx.lineTo(guide.val, 10000);
        } else {
          ctx.moveTo(-10000, guide.val);
          ctx.lineTo(10000, guide.val);
        }
        ctx.stroke();
      });

      ctx.restore();
    };

    const clearGuides = () => {
      activeGuides = [];
      canvas.requestRenderAll();
    };

    canvas.on("object:added", queuePersist);
    canvas.on("object:removed", queuePersist);
    canvas.on("object:modified", queuePersist);
    canvas.on("selection:created", onSelectionCreated);
    canvas.on("selection:updated", onSelectionUpdated);
    canvas.on("selection:cleared", onSelectionCleared);
    canvas.on("text:editing:entered", onTextEditingEntered);
    canvas.on("text:editing:exited", onTextEditingExited);
    canvas.on("text:selection:changed", onTextSelectionChanged);
    canvas.on("object:moving", onObjectMoving);
    canvas.on("after:render", onAfterRender);
    canvas.on("mouse:up", clearGuides);
    canvas.on("object:modified", clearGuides);

    return () => {
      queuePersist.cancel();
      onPersistCancelReady?.(() => {});
      canvas.off("object:added", queuePersist);
      canvas.off("object:removed", queuePersist);
      canvas.off("object:modified", queuePersist);
      canvas.off("selection:created", onSelectionCreated);
      canvas.off("selection:updated", onSelectionUpdated);
      canvas.off("selection:cleared", onSelectionCleared);
      canvas.off("text:editing:entered", onTextEditingEntered);
      canvas.off("text:editing:exited", onTextEditingExited);
      canvas.off("text:selection:changed", onTextSelectionChanged);
      canvas.off("object:moving", onObjectMoving);
      canvas.off("after:render", onAfterRender);
      canvas.off("mouse:up", clearGuides);
      canvas.off("object:modified", clearGuides);
    };
  },
  [
    canvas,
    save,
    clearSelectionCallback,
    setSelectedObjects,
    onPersistCancelReady,
  ]);
};
