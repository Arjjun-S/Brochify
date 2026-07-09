import { fabric } from "fabric";
import { useCallback, useRef } from "react";

interface UseClipboardProps {
  canvas: fabric.Canvas | null;
  save: () => void;
};

export const useClipboard = ({
  canvas,
  save
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
      save();
    });
  }, [canvas, save]);

  const duplicate = useCallback(() => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || !canvas) return;

    activeObject.clone((clonedObj: fabric.Object) => {
      canvas.discardActiveObject();
      
      const customProps = ["id", "name", "originalSrc", "originalText", "assignedLogo", "selectable", "evented", "hasControls"];
      customProps.forEach(prop => {
        if ((activeObject as any)[prop] !== undefined) {
          (clonedObj as any)[prop] = (activeObject as any)[prop];
        }
      });
      
      if (clonedObj.name !== "qr-box") {
        const prefix = clonedObj.type === "text" || clonedObj.type === "textbox" ? "certificate-text" : "duplicate";
        (clonedObj as any).id = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
      }

      clonedObj.set({
        left: (clonedObj.left || 0) + 20,
        top: (clonedObj.top || 0) + 20,
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

      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      save();
    });
  }, [canvas, save]);

  return { copy, paste, duplicate };
};
