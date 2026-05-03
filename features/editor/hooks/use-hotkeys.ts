import { fabric } from "fabric";
import { useEvent } from "react-use";

interface UseHotkeysProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  copy: () => void;
  paste: () => void;
}

export const useHotkeys = ({ canvas, undo, redo, save, copy, paste }: UseHotkeysProps) => {
  useEvent("keydown", (event) => {
    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isBackspace = event.key === "Backspace";
    const target = event.target as HTMLElement;
    const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

    if (isInput || target.isContentEditable) {
      return;
    }

    const activeObject = canvas?.getActiveObject();
    const editingFabricText =
      Boolean(activeObject)
      && (activeObject!.type === "textbox" || activeObject!.type === "i-text")
      && Boolean((activeObject as fabric.IText).isEditing);

    // delete key
    if (event.keyCode === 46) {
      canvas?.getActiveObjects().forEach((object) => canvas?.remove(object));
      canvas?.discardActiveObject();
      canvas?.renderAll();
      save();
    }

    if (isBackspace) {
      canvas?.remove(...canvas.getActiveObjects());
      canvas?.discardActiveObject();
      canvas?.renderAll();
      save();
    }

    if (isCtrlKey && (event.key === "z" || event.key === "Z")) {
      if (editingFabricText) {
        return;
      }

      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    if (isCtrlKey && (event.key === "y" || event.key === "Y")) {
      if (editingFabricText) {
        return;
      }

      event.preventDefault();
      redo();
      return;
    }

    if (isCtrlKey && event.key === "c") {
      event.preventDefault();
      copy();
    }

    if (isCtrlKey && event.key === "v") {
      event.preventDefault();
      paste();
    }

    if (isCtrlKey && event.key === "s") {
      event.preventDefault();
      save(true);
    }

    if (isCtrlKey && event.key === "a") {
      event.preventDefault();
      canvas?.discardActiveObject();

      const allObjects = canvas?.getObjects().filter((object) => object.selectable) ?? [];

      if (allObjects.length === 0 || !canvas) {
        return;
      }

      canvas.setActiveObject(new fabric.ActiveSelection(allObjects, { canvas }));
      canvas.renderAll();
    }
  });
};
