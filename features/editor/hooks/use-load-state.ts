import { fabric } from "fabric";
import { useEffect, useRef } from "react";

import { JSON_KEYS } from "@/features/editor/types";

interface UseLoadStateProps {
  autoZoom: () => void;
  canvas: fabric.Canvas | null;
  initialState: React.MutableRefObject<string | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
};

export const useLoadState = ({
  canvas,
  autoZoom,
  initialState,
  canvasHistory,
  setHistoryIndex,
}: UseLoadStateProps) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && canvas) {
      const rawState = initialState?.current;

      if (!rawState || !rawState.trim()) {
        initialized.current = true;
        autoZoom();
        return;
      }

      let data: unknown;
      try {
        data = JSON.parse(rawState);
      } catch {
        initialized.current = true;
        autoZoom();
        return;
      }

      canvas.loadFromJSON(data as Record<string, unknown>, () => {
        let currentState: string;
        try {
          currentState = JSON.stringify(
            canvas.toJSON(JSON_KEYS),
          );
        } catch {
          autoZoom();
          return;
        }

        canvasHistory.current = [currentState];
        setHistoryIndex(0);
        autoZoom();
      });
      initialized.current = true;
    }
  }, 
  [
    canvas,
    autoZoom,
    initialState, // no need, this is a ref
    canvasHistory, // no need, this is a ref
    setHistoryIndex, // no need, this is a dispatch
  ]);
};
