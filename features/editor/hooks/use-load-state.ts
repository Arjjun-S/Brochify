import { fabric } from "fabric";
import { useEffect, useRef } from "react";

import { JSON_KEYS } from "@/features/editor/types";
import { finalizeFabricTextObjectsAfterLoad, sanitizeCanvasState, generateWatermarkedDataUrl, rebuildInteractiveElements, sanitizeFabricObjectsBeforeLoad } from "@/features/editor/utils";
import { applyCertificatePlaceholders, CERTIFICATE_PAGE_WIDTH, CERTIFICATE_PAGE_HEIGHT } from "@/lib/domains/certificate";

interface UseLoadStateProps {
  autoZoom: () => void;
  canvas: fabric.Canvas | null;
  initialState: React.MutableRefObject<string | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  isApproved?: boolean;
  isCertificate?: boolean;
};

export const useLoadState = ({
  canvas,
  autoZoom,
  initialState,
  canvasHistory,
  setHistoryIndex,
  isApproved = false,
  isCertificate = false,
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

      if (parsedState.objects) {
        parsedState.objects = sanitizeFabricObjectsBeforeLoad(parsedState.objects);
      }

      if (parsedState.backgroundImage && typeof parsedState.backgroundImage.src === "string") {
        parsedState.backgroundImage.src = parsedState.backgroundImage.src.split("?")[0] + "?c_cache=1";
        parsedState.backgroundImage.crossOrigin = "anonymous";
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
        if (!canvas) return;
        requestAnimationFrame(() => {
          try {
            canvas.loadFromJSON(parsedState as Record<string, unknown>, () => {
              canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
              finalizeFabricTextObjectsAfterLoad(canvas);

              // Recreate workspace clip if missing (loadFromJSON overwrites canvas objects)
              let workspace = canvas.getObjects().find((object) => object.name === "clip");
              if (!workspace) {
                workspace = new fabric.Rect({
                  width: isCertificate ? CERTIFICATE_PAGE_WIDTH : 983,
                  height: isCertificate ? CERTIFICATE_PAGE_HEIGHT : 680,
                  name: "clip",
                  fill: isCertificate ? "transparent" : "white",
                  stroke: "#e2e8f0",
                  strokeWidth: 1,
                  selectable: false,
                  evented: false,
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

              // Fit and lock background image to workspace
              const bg = canvas.backgroundImage;
              if (bg) {
                const workspaceWidth = workspace.width ?? (isCertificate ? CERTIFICATE_PAGE_WIDTH : 983);
                const workspaceHeight = workspace.height ?? (isCertificate ? CERTIFICATE_PAGE_HEIGHT : 680);
                bg.set({
                  originX: "left",
                  originY: "top",
                  left: workspace.left ?? 0,
                  top: workspace.top ?? 0,
                  scaleX: workspaceWidth / (bg.width || 1),
                  scaleY: workspaceHeight / (bg.height || 1),
                  selectable: false,
                  evented: false,
                  hasControls: false,
                  hasBorders: false,
                  lockMovementX: true,
                  lockMovementY: true,
                  lockRotation: true,
                  lockScalingX: true,
                  lockScalingY: true,
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
              (canvas as any).isLoaded = true;
              canvas.fire("canvas:loaded");
            });
          } catch (e) {
            console.error("loadFromJSON error:", e);
          }
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
