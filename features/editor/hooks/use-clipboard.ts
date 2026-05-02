import { fabric } from "fabric";
import { useCallback, useRef } from "react";

interface UseClipboardProps {
  canvas: fabric.Canvas | null;
};

export const useClipboard = ({
  canvas
}: UseClipboardProps) => {
  const clipboard = useRef<fabric.Object | null>(null);

  const copy = useCallback(() => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned: fabric.Object) => {
      clipboard.current = cloned;
    });
  }, [canvas]);
  
  const paste = useCallback(() => {
    if (!clipboard.current || !canvas) return;

    clipboard.current.clone((clonedObj: fabric.Object) => {
      canvas.discardActiveObject();
      clonedObj.set({
        left: (clonedObj.left || 0) + 10,
        top: (clonedObj.top || 0) + 10,
        evented: true,
      });

      if (clonedObj.type === "activeSelection") {
        const activeSelection = clonedObj as fabric.ActiveSelection;
        activeSelection.canvas = canvas;
        activeSelection.forEachObject((obj: fabric.Object) => {
          canvas.add(obj);
        });
        activeSelection.setCoords();
      } else {
        canvas.add(clonedObj);
      }

      clipboard.current?.set({
        top: (clipboard.current.top || 0) + 10,
        left: (clipboard.current.left || 0) + 10,
      });
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  }, [canvas]);

  return { copy, paste };
};
