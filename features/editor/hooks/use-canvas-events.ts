import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useEffect } from "react";

import { refreshFabricTextEditingAnchor } from "@/features/editor/utils";

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

    const onTextEditingEntered = () => {
      refreshFabricTextEditingAnchor(canvas);
      requestAnimationFrame(() => refreshFabricTextEditingAnchor(canvas));
    };

    const onTextSelectionChanged = () => {
      refreshFabricTextEditingAnchor(canvas);
    };

    canvas.on("object:added", queuePersist);
    canvas.on("object:removed", queuePersist);
    canvas.on("object:modified", queuePersist);
    canvas.on("selection:created", onSelectionCreated);
    canvas.on("selection:updated", onSelectionUpdated);
    canvas.on("selection:cleared", onSelectionCleared);
    canvas.on("text:editing:entered", onTextEditingEntered);
    canvas.on("text:selection:changed", onTextSelectionChanged);

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
      canvas.off("text:selection:changed", onTextSelectionChanged);
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
