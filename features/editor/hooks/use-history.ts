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
  /** Cancel any pending debounced `save()` from canvas events (must run before restore). */
  cancelDebouncedPersist?: () => void;
}

export const useHistory = ({
  canvas,
  saveCallback,
  afterRestore,
  cancelDebouncedPersist,
}: UseHistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasHistory = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const skipSave = useRef(false);
  const isRestoringRef = useRef(false);
  const afterRestoreRef = useRef(afterRestore);

  useEffect(() => {
    afterRestoreRef.current = afterRestore;
  }, [afterRestore]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  const canUndo = useCallback(() => {
    return historyIndexRef.current > 0;
  }, []);

  const canRedo = useCallback(() => {
    return historyIndexRef.current < canvasHistory.current.length - 1;
  }, []);

  const save = useCallback(
    (skip = false) => {
      if (!canvas) {
        return;
      }

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
        const idx = historyIndexRef.current;
        canvasHistory.current = canvasHistory.current.slice(0, idx + 1);

        const last = canvasHistory.current[canvasHistory.current.length - 1];
        if (last !== json) {
          canvasHistory.current.push(json);
          const nextIndex = canvasHistory.current.length - 1;
          historyIndexRef.current = nextIndex;
          setHistoryIndex(nextIndex);
        }
      }

      const workspace = canvas.getObjects().find((object) => object.name === "clip");
      const height = workspace?.height || 0;
      const width = workspace?.width || 0;

      saveCallback?.({ json, height, width });
    },
    [canvas, saveCallback],
  );

  const finishRestore = useCallback(() => {
    skipSave.current = false;
    isRestoringRef.current = false;
  }, []);

  const undo = useCallback(() => {
    if (!canvas || isRestoringRef.current) {
      return;
    }

    const idx = historyIndexRef.current;
    if (idx <= 0) {
      return;
    }

    cancelDebouncedPersist?.();

    const previousIndex = idx - 1;
    const previousSerializedState = canvasHistory.current[previousIndex];
    if (!previousSerializedState) {
      return;
    }

    let previousState: unknown;
    try {
      previousState = JSON.parse(previousSerializedState);
    } catch {
      return;
    }

    const sanitizedPreviousState = sanitizeCanvasState(previousState);
    if (!sanitizedPreviousState) {
      return;
    }

    isRestoringRef.current = true;
    skipSave.current = true;

    canvas.clear();
    canvas.renderAll();

    canvas.loadFromJSON(sanitizedPreviousState, () => {
      try {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        finalizeFabricTextObjectsAfterLoad(canvas);
        afterRestoreRef.current?.();
        canvas.discardActiveObject();
        canvas.renderAll();
        historyIndexRef.current = previousIndex;
        setHistoryIndex(previousIndex);
        save(true);
      } finally {
        finishRestore();
      }
    });
  }, [canvas, cancelDebouncedPersist, finishRestore, save]);

  const redo = useCallback(() => {
    if (!canvas || isRestoringRef.current) {
      return;
    }

    const idx = historyIndexRef.current;
    if (idx >= canvasHistory.current.length - 1) {
      return;
    }

    cancelDebouncedPersist?.();

    const nextIndex = idx + 1;
    const nextSerializedState = canvasHistory.current[nextIndex];
    if (!nextSerializedState) {
      return;
    }

    let nextState: unknown;
    try {
      nextState = JSON.parse(nextSerializedState);
    } catch {
      return;
    }

    const sanitizedNextState = sanitizeCanvasState(nextState);
    if (!sanitizedNextState) {
      return;
    }

    isRestoringRef.current = true;
    skipSave.current = true;

    canvas.clear();
    canvas.renderAll();

    canvas.loadFromJSON(sanitizedNextState, () => {
      try {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        finalizeFabricTextObjectsAfterLoad(canvas);
        afterRestoreRef.current?.();
        canvas.discardActiveObject();
        canvas.renderAll();
        historyIndexRef.current = nextIndex;
        setHistoryIndex(nextIndex);
        save(true);
      } finally {
        finishRestore();
      }
    });
  }, [canvas, cancelDebouncedPersist, finishRestore, save]);

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
