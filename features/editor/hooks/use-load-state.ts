import { fabric } from "fabric";
import { useEffect, useRef } from "react";

import { JSON_KEYS } from "@/features/editor/types";
import { finalizeFabricTextObjectsAfterLoad, sanitizeCanvasState, generateWatermarkedDataUrl, rebuildInteractiveElements } from "@/features/editor/utils";
import { applyCertificatePlaceholders } from "@/lib/domains/certificate";

interface UseLoadStateProps {
  autoZoom: () => void;
  canvas: fabric.Canvas | null;
  initialState: React.MutableRefObject<string | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  isApproved?: boolean;
};

export const useLoadState = ({
  canvas,
  autoZoom,
  initialState,
  canvasHistory,
  setHistoryIndex,
  isApproved = false,
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

      const parsedState = sanitizeCanvasState(data);
      if (!parsedState) {
        initialized.current = true;
        autoZoom();
        return;
      }

      // Asynchronously preprocess signatures and brochitextboxes
      const preprocess = async () => {
        const parsed = parsedState as Record<string, unknown>;
        if (Array.isArray(parsed.objects)) {
          for (const obj of parsed.objects) {
            if (obj.name === "signature" && obj.originalSrc) {
              obj.src = await generateWatermarkedDataUrl(obj.originalSrc, isApproved);
            }
            if (obj.name === "brochitextbox" && typeof obj.originalText === "string") {
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
              obj.text = applyCertificatePlaceholders(obj.originalText, mockStudent);
            }
          }
        }
      };

      preprocess().then(() => {
        canvas.loadFromJSON(parsedState as Record<string, unknown>, () => {
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          finalizeFabricTextObjectsAfterLoad(canvas);

          // Recreate workspace clip if missing (loadFromJSON overwrites canvas objects)
          let workspace = canvas.getObjects().find((object) => object.name === "clip");
          if (!workspace) {
            workspace = new fabric.Rect({
              width: 983,
              height: 680,
              name: "clip",
              fill: "white",
              stroke: "#e2e8f0",
              strokeWidth: 1,
              selectable: false,
              hasControls: false,
              shadow: new fabric.Shadow({
                color: "rgba(0,0,0,0.15)",
                blur: 8,
                offsetX: 0,
                offsetY: 2,
              }),
            });
            canvas.add(workspace);
            canvas.centerObject(workspace);
            canvas.sendToBack(workspace);
          }

          // Fit background image to workspace
          const bg = canvas.backgroundImage;
          if (bg) {
            const workspaceWidth = workspace.width ?? 983;
            const workspaceHeight = workspace.height ?? 680;
            bg.set({
              originX: "left",
              originY: "top",
              left: workspace.left ?? 0,
              top: workspace.top ?? 0,
              scaleX: workspaceWidth / (bg.width || 1),
              scaleY: workspaceHeight / (bg.height || 1),
            });
          }

          rebuildInteractiveElements(canvas);

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
      });
      initialized.current = true;
    }
  }, 
  [
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
    isApproved,
  ]);
};
