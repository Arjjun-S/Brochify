import { fabric } from "fabric";
import { useEvent } from "react-use";

interface UseHotkeysProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  copy: () => void;
  paste: () => void;
  duplicate: () => void;
}

export const useHotkeys = ({ canvas, undo, redo, save, copy, paste, duplicate }: UseHotkeysProps) => {
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
      Boolean(activeObject) &&
      (activeObject!.type === "textbox" || activeObject!.type === "i-text") &&
      Boolean((activeObject as fabric.IText).isEditing);

    const activeObjects = canvas?.getActiveObjects() || [];
    const deletableObjects = activeObjects.filter((object) => object.name !== "clip" && object.selectable !== false);

    // delete key
    if (event.keyCode === 46) {
      if (deletableObjects.length > 0) {
        deletableObjects.forEach((object) => canvas?.remove(object));
        canvas?.discardActiveObject();
        canvas?.renderAll();
        save();
      }
    }

    if (isBackspace) {
      if (deletableObjects.length > 0) {
        canvas?.remove(...deletableObjects);
        canvas?.discardActiveObject();
        canvas?.renderAll();
        save();
      }
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

    if (isCtrlKey && (event.key === "d" || event.key === "D")) {
      event.preventDefault();
      duplicate();
    }

    if (isCtrlKey && event.key === "s") {
      event.preventDefault();
      save(true);
    }

    const isArrowUp = event.key === "ArrowUp";
    const isArrowDown = event.key === "ArrowDown";
    const isArrowLeft = event.key === "ArrowLeft";
    const isArrowRight = event.key === "ArrowRight";

    if ((isArrowUp || isArrowDown || isArrowLeft || isArrowRight) && activeObject && !editingFabricText) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const movableObjects = activeObjects.filter((object) => object.name !== "clip" && object.selectable !== false);
      movableObjects.forEach((object) => {
        if (isArrowUp) object.set({ top: (object.top ?? 0) - step });
        if (isArrowDown) object.set({ top: (object.top ?? 0) + step });
        if (isArrowLeft) object.set({ left: (object.left ?? 0) - step });
        if (isArrowRight) object.set({ left: (object.left ?? 0) + step });
        object.setCoords();
        object.fire("moving", { target: object });
      });
      canvas?.renderAll();
      save();
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
