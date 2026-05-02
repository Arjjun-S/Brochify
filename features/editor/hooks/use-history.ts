import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";

import { JSON_KEYS } from "@/features/editor/types";
import { finalizeFabricTextObjectsAfterLoad, sanitizeCanvasState } from "@/features/editor/utils";

interface UseHistoryProps {
  canvas: fabric.Canvas | null;
  saveCallback?: (values: {
    json: string;
    height: number;
    width: number;
  }) => void;
  /** Re-apply viewport + page clip/interaction after canvas JSON restore (undo/redo). */
  afterRestore?: () => void;
};

export const useHistory = ({ canvas, saveCallback, afterRestore }: UseHistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasHistory = useRef<string[]>([]);
  const skipSave = useRef(false);
  const afterRestoreRef = useRef(afterRestore);

  useEffect(() => {
    afterRestoreRef.current = afterRestore;
  }, [afterRestore]);

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < canvasHistory.current.length - 1;
  }, [historyIndex]);

  const save = useCallback((skip = false) => {
    if (!canvas) return;

    let json: string;
    try {
      const currentState = canvas.toJSON(JSON_KEYS);
      const sanitizedState = sanitizeCanvasState(currentState) || {
        version: "5.3.0",
        viewportTransform: [1, 0, 0, 1, 0, 0],
        objects: [],
      };
      json = JSON.stringify(sanitizedState);
    } catch {
      return;
    }

    if (!skip && !skipSave.current) {
      canvasHistory.current.push(json);
      setHistoryIndex(canvasHistory.current.length - 1);
    }

    const workspace = canvas
      .getObjects()
      .find((object) => object.name === "clip");
    const height = workspace?.height || 0;
    const width = workspace?.width || 0;

    saveCallback?.({ json, height, width });
  }, 
  [
    canvas,
    saveCallback,
  ]);

  const undo = useCallback(() => {
    if (canUndo()) {
      skipSave.current = true;
      canvas?.clear().renderAll();

      const previousIndex = historyIndex - 1;
      const previousSerializedState = canvasHistory.current[previousIndex];
      if (!previousSerializedState) {
        skipSave.current = false;
        return;
      }

      let previousState: unknown;
      try {
        previousState = JSON.parse(previousSerializedState);
      } catch {
        skipSave.current = false;
        return;
      }

      const sanitizedPreviousState = sanitizeCanvasState(previousState);
      if (!sanitizedPreviousState) {
        skipSave.current = false;
        return;
      }

      canvas?.loadFromJSON(sanitizedPreviousState, () => {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        finalizeFabricTextObjectsAfterLoad(canvas);
        afterRestoreRef.current?.();
        canvas.renderAll();
        setHistoryIndex(previousIndex);
        skipSave.current = false;
      });
    }
  }, [canUndo, canvas, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo()) {
      skipSave.current = true;
      canvas?.clear().renderAll();

      const nextIndex = historyIndex + 1;
      const nextSerializedState = canvasHistory.current[nextIndex];
      if (!nextSerializedState) {
        skipSave.current = false;
        return;
      }

      let nextState: unknown;
      try {
        nextState = JSON.parse(nextSerializedState);
      } catch {
        skipSave.current = false;
        return;
      }

      const sanitizedNextState = sanitizeCanvasState(nextState);
      if (!sanitizedNextState) {
        skipSave.current = false;
        return;
      }

      canvas?.loadFromJSON(sanitizedNextState, () => {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        finalizeFabricTextObjectsAfterLoad(canvas);
        afterRestoreRef.current?.();
        canvas.renderAll();
        setHistoryIndex(nextIndex);
        skipSave.current = false;
      });
    }
  }, [canvas, historyIndex, canRedo]);

  return { 
    save,
    canUndo,
    canRedo,
    undo,
    redo,
    setHistoryIndex,
    canvasHistory,
  };
};
