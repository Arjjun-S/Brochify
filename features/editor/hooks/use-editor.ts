import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef } from "react";

import { 
  Editor, 
  FILL_COLOR,
  STROKE_WIDTH,
  STROKE_COLOR,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  BuildEditorProps, 
  RECTANGLE_OPTIONS,
  EditorHookProps,
  STROKE_DASH_ARRAY,
  TEXT_OPTIONS,
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SIZE,
  JSON_KEYS,
} from "@/features/editor/types";
import { useHistory } from "@/features/editor/hooks/use-history";
import { 
  createFilter, 
  downloadFile, 
  exportCropRectForFabricObject,
  isTextType,
  sanitizeCanvasState,
  finalizeFabricTextObjectsAfterLoad,
  refreshFabricTextEditingAnchor,
  syncCanvasClipToActivePage,
  transformText
} from "@/features/editor/utils";
import { useHotkeys } from "@/features/editor/hooks/use-hotkeys";
import { useClipboard } from "@/features/editor/hooks/use-clipboard";
import { useAutoResize } from "@/features/editor/hooks/use-auto-resize";
import { useCanvasEvents } from "@/features/editor/hooks/use-canvas-events";
import { useViewportInteractions } from "@/features/editor/hooks/use-viewport-interactions";
import { useWindowEvents } from "@/features/editor/hooks/use-window-events";
import { useLoadState } from "@/features/editor/hooks/use-load-state";
import { CERTIFICATE_PAGE_WIDTH, CERTIFICATE_PAGE_HEIGHT } from "@/lib/domains/certificate";

const IDENTITY_MATRIX: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toSafeMatrix(value: unknown): [number, number, number, number, number, number] {
  if (!Array.isArray(value)) {
    return [...IDENTITY_MATRIX];
  }

  return [
    toFiniteNumber(value[0], 1),
    toFiniteNumber(value[1], 0),
    toFiniteNumber(value[2], 0),
    toFiniteNumber(value[3], 1),
    toFiniteNumber(value[4], 0),
    toFiniteNumber(value[5], 0),
  ];
}

function ensureCanvasViewportTransform(canvas: fabric.Canvas) {
  canvas.setViewportTransform(toSafeMatrix(canvas.viewportTransform));
}

function patchFabricTextEditingPresentation() {
  const marker = fabric as typeof fabric & { __brochifyTextPresentation?: boolean };
  if (marker.__brochifyTextPresentation) {
    return;
  }
  marker.__brochifyTextPresentation = true;

  Object.assign(fabric.IText.prototype, {
    cursorWidth: 2,
    cursorColor: "",
    editingBorderColor: "rgba(37, 99, 235, 0.55)",
    selectionColor: "rgba(37, 99, 235, 0.32)",
  });
}

/**
 * Fabric draws the caret using full font-size height while glyphs sit higher (_fontSizeFraction),
 * so the bar looks too tall and sits wrong vs caps (especially Textbox / zoom). Match line metrics
 * and keep thickness at Fabric's nominal cursorWidth (screen px).
 */
function patchFabricTextEditingCursorMetrics() {
  const marker = fabric as typeof fabric & { __brochifyTextCursorMetrics?: boolean };
  if (marker.__brochifyTextCursorMetrics) {
    return;
  }
  marker.__brochifyTextCursorMetrics = true;

  fabric.IText.prototype.renderCursor = function (
    boundaries: { left: number; top: number; leftOffset: number; topOffset: number },
    ctx: CanvasRenderingContext2D,
  ) {
    const cursorLocation = this.get2DCursorLocation();
    const lineIndex = cursorLocation.lineIndex;
    const charIndex = cursorLocation.charIndex > 0 ? cursorLocation.charIndex - 1 : 0;

    const fontSize = Number(this.getValueOfPropertyAt(lineIndex, charIndex, "fontSize"));
    const lhRaw = this.lineHeight;
    const lh =
      typeof lhRaw === "number" && lhRaw > 0 ? lhRaw : 1.16;
    const lineHeightPx = this.getHeightOfLine(lineIndex);
    const innerLine = lineHeightPx / lh;

    const multiplier =
      Math.abs(typeof this.scaleX === "number" ? this.scaleX : 1)
      * (this.canvas ? this.canvas.getZoom() : 1);

    const nominal =
      typeof this.cursorWidth === "number" && this.cursorWidth > 0 ? this.cursorWidth : 2;
    const cursorStroke = nominal / multiplier;

    const frac =
      typeof this._fontSizeFraction === "number" ? this._fontSizeFraction : 0.222;

    let topOffset = boundaries.topOffset;
    const dy = Number(this.getValueOfPropertyAt(lineIndex, charIndex, "deltaY"));

    topOffset += ((1 - frac) * lineHeightPx) / lh - fontSize * (1 - frac);

    const cursorHeight = Math.min(fontSize * 0.74, innerLine * 0.9);
    topOffset += (fontSize - cursorHeight) / 2;

    if (this.inCompositionMode) {
      this.renderSelection(boundaries, ctx);
    }

    const fillAtCaret = this.getValueOfPropertyAt(lineIndex, charIndex, "fill");
    ctx.fillStyle =
      typeof this.cursorColor === "string" && this.cursorColor.length > 0
        ? this.cursorColor
        : typeof fillAtCaret === "string"
          ? fillAtCaret
          : "#111827";

    const editingState = this as fabric.IText & {
      __isMousedown?: boolean;
      _currentCursorOpacity?: number;
    };
    ctx.globalAlpha = editingState.__isMousedown ? 1 : (editingState._currentCursorOpacity ?? 1);

    ctx.fillRect(
      boundaries.left + boundaries.leftOffset - cursorStroke / 2,
      topOffset + boundaries.top + dy,
      cursorStroke,
      cursorHeight,
    );
  };
}

function patchFabricTransformGuards() {
  const util = (
    fabric as unknown as {
      util?: Record<string, unknown>;
    }
  ).util;

  if (!util) {
    return;
  }

  const marker = util as { __brochifySafeMatrixPatched?: boolean };
  if (marker.__brochifySafeMatrixPatched) {
    return;
  }
  marker.__brochifySafeMatrixPatched = true;

  const originalMultiply = util.multiplyTransformMatrices as
    | ((a: number[], b: number[], is2x2?: boolean) => number[])
    | undefined;
  if (originalMultiply) {
    util.multiplyTransformMatrices = ((a: unknown, b: unknown, is2x2?: boolean) => {
      return originalMultiply(toSafeMatrix(a), toSafeMatrix(b), is2x2);
    }) as unknown;
  }

  const originalInvert = util.invertTransform as
    | ((matrix: number[]) => number[])
    | undefined;
  if (originalInvert) {
    util.invertTransform = ((matrix: unknown) => {
      return originalInvert(toSafeMatrix(matrix));
    }) as unknown;
  }

  const originalQrDecompose = util.qrDecompose as
    | ((matrix: number[]) => unknown)
    | undefined;
  if (originalQrDecompose) {
    util.qrDecompose = ((matrix: unknown) => {
      return originalQrDecompose(toSafeMatrix(matrix));
    }) as unknown;
  }

  const originalTransformPoint = util.transformPoint as
    | ((point: fabric.Point, matrix: number[], ignoreOffset?: boolean) => fabric.Point)
    | undefined;
  if (originalTransformPoint) {
    util.transformPoint = ((point: fabric.Point, matrix: unknown, ignoreOffset?: boolean) => {
      return originalTransformPoint(point, toSafeMatrix(matrix), ignoreOffset);
    }) as unknown;
  }
}

const buildEditor = ({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  activePage,
  setActivePage,
  setStrokeDashArray,
}: BuildEditorProps): Editor => {
  const getWorkspace = () => {
    return canvas
      .getObjects()
      .find((object) => object.name === "clip");
  };

  const getPageFrames = () => {
    return canvas
      .getObjects()
      .filter((object) => object.name === "page-frame")
      .sort((left, right) => (left.left ?? 0) - (right.left ?? 0));
  };

  const getActivePageFrame = () => {
    const pageFrames = getPageFrames();
    if (pageFrames.length === 0) {
      return undefined;
    }

    const activePageIndex = Math.min(Math.max(1, activePage), pageFrames.length) - 1;
    return pageFrames[activePageIndex];
  };

  const getSelectedPlaceholderFrame = () => {
    const selectedObject = selectedObjects?.[0];

    if (!selectedObject) {
      return undefined;
    }

    if (selectedObject.name === "image-placeholder") {
      return selectedObject;
    }

    if (selectedObject.name === "placeholder-image") {
      const placeholderId = (selectedObject as fabric.Object & { placeholderId?: string }).placeholderId;
      if (!placeholderId) {
        return undefined;
      }

      return canvas
        .getObjects()
        .find((object) => object.name === "image-placeholder"
          && (object as fabric.Object & { placeholderId?: string }).placeholderId === placeholderId);
    }

    return undefined;
  };

  const withNoClip = <T>(work: () => T): T => {
    const previousClipPath = canvas.clipPath;
    canvas.clipPath = undefined;
    try {
      return work();
    } finally {
      canvas.clipPath = previousClipPath;
    }
  };

  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const savePng = () => {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const frames = getPageFrames();

    if (frames.length >= 2) {
      const urls = frames.map((frame) => {
        const crop = exportCropRectForFabricObject(frame);
        return withNoClip(() =>
          canvas.toDataURL({
            format: "png",
            quality: 1,
            ...crop,
          }),
        );
      });

      urls.forEach((dataUrl, index) => {
        window.setTimeout(() => {
          downloadFile(dataUrl, "png", `brochure-page-${index + 1}`);
        }, index * 350);
      });
    }
    else {
      const options = generateSaveOptions();
      const dataUrl = withNoClip(() => canvas.toDataURL(options));
      downloadFile(dataUrl, "png");
    }

    autoZoom();
  };

  const saveSvg = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = withNoClip(() => canvas.toDataURL(options));

    downloadFile(dataUrl, "svg");
    autoZoom();
  };

  const saveJpg = () => {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const frames = getPageFrames();

    if (frames.length >= 2) {
      const urls = frames.map((frame) => {
        const crop = exportCropRectForFabricObject(frame);
        return withNoClip(() =>
          canvas.toDataURL({
            format: "jpeg",
            quality: 1,
            ...crop,
          }),
        );
      });

      urls.forEach((dataUrl, index) => {
        window.setTimeout(() => {
          downloadFile(dataUrl, "jpg", `brochure-page-${index + 1}`);
        }, index * 350);
      });
    }
    else {
      const options = {
        ...generateSaveOptions(),
        format: "jpeg" as const,
        quality: 0.92,
      };
      const dataUrl = withNoClip(() => canvas.toDataURL(options));
      downloadFile(dataUrl, "jpg");
    }

    autoZoom();
  };

  const savePdf = async (options?: { watermarkText?: string | null; template?: string }) => {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const frames = getPageFrames();

    let html: string;
    let spreadPages = 1;

    if (frames.length >= 2) {
      spreadPages = frames.length;

      const sheets = frames.map((frame) => {
        const crop = exportCropRectForFabricObject(frame);
        const imageDataUrl = withNoClip(() =>
          canvas.toDataURL({
            format: "png",
            quality: 1,
            ...crop,
          }),
        );

        return `<div class="pdf-export-sheet"><img src="${imageDataUrl}" alt="" /></div>`;
      });

      html = sheets.join("");
    }
    else {
      const exportOptions = {
        ...generateSaveOptions(),
        format: "png" as const,
      };

      const imageDataUrl = withNoClip(() => canvas.toDataURL(exportOptions));

      html = `
          <div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:white;\">
            <img src=\"${imageDataUrl}\" alt=\"Design export\" style=\"width:100%;height:100%;object-fit:contain;display:block;\" />
          </div>
        `;
    }

    autoZoom();

    const response = await fetch("/api/v1/brochure/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        css: "",
        spreadPages,
        watermarkText: options?.watermarkText ?? null,
        template: options?.template ?? "",
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Failed to export PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `brochure-${Date.now()}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  };

  const saveJson = async () => {
    const dataUrl = canvas.toJSON(JSON_KEYS);

    await transformText(dataUrl.objects);
    const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataUrl, null, "\t"),
    )}`;
    downloadFile(fileString, "json");
  };

  const loadJson = (json: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return;
    }

    const data = sanitizeCanvasState(parsed);

    if (!data) {
      return;
    }

    canvas.loadFromJSON(data, () => {
      ensureCanvasViewportTransform(canvas);
      finalizeFabricTextObjectsAfterLoad(canvas);
      autoZoom();
    });
  };

  const focusTarget = (target: fabric.Object, pageIndex?: number) => {
    if (
      canvas.width === undefined
      || canvas.height === undefined
    ) {
      return;
    }

    const targetWidth = target.getScaledWidth();
    const targetHeight = target.getScaledHeight();

    if (!targetWidth || !targetHeight) {
      return;
    }

    const zoomRatio = 0.98;
    const zoom = zoomRatio * Math.min(canvas.width / targetWidth, canvas.height / targetHeight);
    const center = target.getCenterPoint();

    const nextViewportTransform: [number, number, number, number, number, number] = [
      zoom,
      0,
      0,
      zoom,
      canvas.width / 2 - center.x * zoom,
      canvas.height / 2 - center.y * zoom,
    ];

    canvas.setViewportTransform(nextViewportTransform);

    syncCanvasClipToActivePage(canvas, pageIndex ?? activePage);

    if (typeof pageIndex === "number") {
      setActivePage(pageIndex);
    }

    refreshFabricTextEditingAnchor(canvas);

    canvas.requestRenderAll();
  };

  const getPageCount = () => {
    const pageFrames = getPageFrames();
    if (pageFrames.length > 0) {
      return pageFrames.length;
    }

    return 1;
  };

  const getActivePage = () => activePage;

  const goToPage = (page: number) => {
    const pageFrames = getPageFrames();

    if (pageFrames.length === 0) {
      autoZoom();
      return;
    }

    const clampedIndex = Math.min(Math.max(1, page), pageFrames.length) - 1;
    const pageFrame = pageFrames[clampedIndex];
    if (!pageFrame) {
      return;
    }

    focusTarget(pageFrame, clampedIndex + 1);
  };

  const addPage = () => {
    const pageFrames = getPageFrames();
    if (pageFrames.length === 0) {
      return;
    }

    const firstPageFrame = pageFrames[0];
    const lastPageFrame = pageFrames[pageFrames.length - 1];

    if (!firstPageFrame || !lastPageFrame) {
      return;
    }

    const pageWidth = firstPageFrame.getScaledWidth();
    const pageHeight = firstPageFrame.getScaledHeight();

    if (!pageWidth || !pageHeight) {
      return;
    }

    const inferredGap = pageFrames.length > 1
      ? (pageFrames[1]?.left ?? 0) - (firstPageFrame.left ?? 0) - pageWidth
      : 120;
    const pageGap = Number.isFinite(inferredGap) && inferredGap > 40 ? inferredGap : 120;

    const nextPageLeft = (lastPageFrame.left ?? 0) + pageWidth + pageGap;
    const nextPageTop = lastPageFrame.top ?? 0;
    const nextPageNumber = pageFrames.length + 1;

    const newPageFrame = new fabric.Rect({
      left: nextPageLeft,
      top: nextPageTop,
      width: pageWidth,
      height: pageHeight,
      rx: 16,
      ry: 16,
      fill: "#ffffff",
      stroke: "#94a3b8",
      strokeWidth: 2,
      selectable: false,
      evented: false,
      hasControls: false,
      name: "page-frame",
    });
    (newPageFrame as unknown as { pageIndex: number }).pageIndex = nextPageNumber;

    const newPageLabel = new fabric.Textbox(`PAGE ${nextPageNumber}`, {
      left: nextPageLeft + 14,
      top: nextPageTop + 8,
      width: 220,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: "Arial",
      fill: "#334155",
      editable: false,
      selectable: false,
      evented: false,
      hasControls: false,
      name: "page-label",
    });
    (newPageLabel as unknown as { pageIndex: number }).pageIndex = nextPageNumber;

    const panelWidth = pageWidth / 3;
    const panelGuideOne = new fabric.Line(
      [nextPageLeft + panelWidth, nextPageTop, nextPageLeft + panelWidth, nextPageTop + pageHeight],
      {
        stroke: "#dbeafe",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hasControls: false,
      },
    );
    panelGuideOne.set("name", "page-guide");
    (panelGuideOne as unknown as { pageIndex: number }).pageIndex = nextPageNumber;

    const panelGuideTwo = new fabric.Line(
      [nextPageLeft + panelWidth * 2, nextPageTop, nextPageLeft + panelWidth * 2, nextPageTop + pageHeight],
      {
        stroke: "#dbeafe",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hasControls: false,
      },
    );
    panelGuideTwo.set("name", "page-guide");
    (panelGuideTwo as unknown as { pageIndex: number }).pageIndex = nextPageNumber;

    canvas.add(newPageFrame);
    canvas.add(newPageLabel);
    canvas.add(panelGuideOne);
    canvas.add(panelGuideTwo);

    const workspace = getWorkspace() as fabric.Rect | undefined;
    if (workspace) {
      const workspaceWidth = workspace.width ?? 0;
      const lastPageRight = (lastPageFrame.left ?? 0) + pageWidth;
      const rightPadding = workspaceWidth - lastPageRight;
      const nextPageRight = nextPageLeft + pageWidth;
      const nextWorkspaceWidth = nextPageRight + Math.max(rightPadding, 40);

      workspace.set({
        width: Math.max(workspaceWidth, nextWorkspaceWidth),
      });
      workspace.sendToBack();
    }

    save();
    goToPage(nextPageNumber);
  };

  const center = (object: fabric.Object) => {
    const activePageFrame = getActivePageFrame();
    const workspace = getWorkspace();
    const center = activePageFrame?.getCenterPoint() ?? workspace?.getCenterPoint();

    if (!center) return;

    // @ts-expect-error Fabric typing mismatch.
    canvas._centerObject(object, center);
  };

  const addToCanvas = (object: fabric.Object) => {
    center(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    savePng,
    saveJpg,
    saveSvg,
    savePdf,
    saveJson,
    loadJson,
    canUndo,
    canRedo,
    autoZoom,
    getWorkspace,
    getPageCount,
    getActivePage,
    goToPage,
    addPage,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;
      const center = canvas.getCenter();
      const clamped = Math.min(Math.max(zoomRatio, 0.05), 12);
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), clamped);
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;
      const center = canvas.getCenter();
      const clamped = Math.min(Math.max(zoomRatio, 0.05), 12);
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), clamped);
    },
    changeSize: (value: { width: number; height: number }) => {
      const workspace = getWorkspace();

      workspace?.set(value);
      autoZoom();
      save();
    },
    changeBackground: (value: string) => {
      const workspace = getWorkspace();
      workspace?.set({ fill: value });
      canvas.renderAll();
      save();
    },
    addBackgroundImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const workspace = getWorkspace() as fabric.Rect | undefined;
          if (!workspace) {
            return;
          }

          const workspaceWidth = workspace.width ?? CERTIFICATE_PAGE_WIDTH;
          const workspaceHeight = workspace.height ?? CERTIFICATE_PAGE_HEIGHT;
          const imageWidth = image.width || 1;
          const imageHeight = image.height || 1;

          const coverScale = Math.max(
            workspaceWidth / imageWidth,
            workspaceHeight / imageHeight,
          );

          image.set({
            originX: "center",
            originY: "center",
            left: (workspace.left ?? 0) + workspaceWidth / 2,
            top: (workspace.top ?? 0) + workspaceHeight / 2,
            scaleX: coverScale,
            scaleY: coverScale,
            selectable: false,
            evented: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            lockUniScaling: true,
          });

          image.sendToBack();
          canvas.renderAll();
        },
        { crossOrigin: "anonymous" },
      );
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (value: string) => {
      const objects = canvas.getActiveObjects();
      objects.forEach((object) => {
        if (object.type === "image") {
          const imageObject = object as fabric.Image;

          const effect = createFilter(value);

          imageObject.filters = effect ? [effect] : [];
          imageObject.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const selectedPlaceholderFrame = getSelectedPlaceholderFrame();

          if (selectedPlaceholderFrame) {
            const placeholder = selectedPlaceholderFrame as fabric.Object & {
              placeholderId?: string;
              pageIndex?: number;
              rx?: number;
              ry?: number;
            };
            const placeholderWidth = placeholder.getScaledWidth();
            const placeholderHeight = placeholder.getScaledHeight();

            if (placeholderWidth && placeholderHeight) {
              const placeholderCenter = placeholder.getCenterPoint();
              const imageWidth = image.width || 1;
              const imageHeight = image.height || 1;
              const coverScale = Math.max(
                placeholderWidth / imageWidth,
                placeholderHeight / imageHeight,
              );

              image.set({
                originX: "center",
                originY: "center",
                left: placeholderCenter.x,
                top: placeholderCenter.y,
                scaleX: coverScale,
                scaleY: coverScale,
                name: "placeholder-image",
              });

              (image as unknown as { placeholderId?: string }).placeholderId = placeholder.placeholderId;
              (image as unknown as { pageIndex?: number }).pageIndex = placeholder.pageIndex;

              const clipPath = placeholder.type === "circle"
                ? new fabric.Circle({
                  originX: "center",
                  originY: "center",
                  radius: Math.min(placeholderWidth, placeholderHeight) / 2,
                })
                : new fabric.Rect({
                  originX: "center",
                  originY: "center",
                  width: placeholderWidth,
                  height: placeholderHeight,
                  rx: Math.max(0, (placeholder.rx || 0) * (placeholder.scaleX || 1)),
                  ry: Math.max(0, (placeholder.ry || 0) * (placeholder.scaleY || 1)),
                });

              image.set({ clipPath });

              const existingPlaceholderImages = canvas
                .getObjects()
                .filter((object) => object.name === "placeholder-image"
                  && (object as fabric.Object & { placeholderId?: string }).placeholderId === placeholder.placeholderId);

              existingPlaceholderImages.forEach((object) => {
                canvas.remove(object);
              });

              const frameIndex = canvas.getObjects().indexOf(placeholder);
              if (frameIndex >= 0) {
                canvas.insertAt(image, frameIndex, false);
              } else {
                canvas.add(image);
              }

              const labelsToRemove = canvas
                .getObjects()
                .filter((object) => object.name === "placeholder-label"
                  && (object as fabric.Object & { placeholderId?: string }).placeholderId === placeholder.placeholderId);
              labelsToRemove.forEach((label) => {
                canvas.remove(label);
              });

              placeholder.set({ fill: "rgba(255,255,255,0.001)" });
              canvas.bringToFront(placeholder);
              canvas.setActiveObject(image);
              canvas.requestRenderAll();
              return;
            }
          }

          const activePageFrame = getActivePageFrame();
          const workspace = getWorkspace();
          const fitWidth = activePageFrame?.width || workspace?.width || 0;
          const fitHeight = activePageFrame?.height || workspace?.height || 0;

          image.scaleToWidth(fitWidth);
          image.scaleToHeight(fitHeight);

          addToCanvas(image);
        },
        {
          crossOrigin: "anonymous",
        },
      );
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    addText: (value, options) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });

      addToCanvas(object);
    },
    getActiveOpacity: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return 1;
      }

      const value = selectedObject.get("opacity") || 1;

      return value;
    },
    changeFontSize: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, fontSize exists.
          object.set({ fontSize: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontSize: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return FONT_SIZE;
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, fontSize exists.
      const value = selectedObject.get("fontSize") || FONT_SIZE;

      return value;
    },
    changeTextAlign: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, textAlign exists.
          object.set({ textAlign: value });
        }
      });
      canvas.renderAll();
    },
    getActiveTextAlign: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return "left";
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, textAlign exists.
      const value = selectedObject.get("textAlign") || "left";

      return value;
    },
    changeFontUnderline: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, underline exists.
          object.set({ underline: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontUnderline: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, underline exists.
      const value = selectedObject.get("underline") || false;

      return value;
    },
    changeFontLinethrough: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, linethrough exists.
          object.set({ linethrough: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontLinethrough: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, linethrough exists.
      const value = selectedObject.get("linethrough") || false;

      return value;
    },
    changeFontStyle: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, fontStyle exists.
          object.set({ fontStyle: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontStyle: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return "normal";
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, fontStyle exists.
      const value = selectedObject.get("fontStyle") || "normal";

      return value;
    },
    changeFontWeight: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, fontWeight exists.
          object.set({ fontWeight: value });
        }
      });
      canvas.renderAll();
    },
    changeOpacity: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity: value });
      });
      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });

      canvas.renderAll();
      
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });

      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    changeFontFamily: (value: string) => {
      setFontFamily(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-expect-error Fabric typing mismatch.
          // Faulty TS library, fontFamily exists.
          object.set({ fontFamily: value });
        }
      });
      canvas.renderAll();
    },
    changeFillColor: (value: string) => {
      setFillColor(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ fill: value });
      });
      canvas.renderAll();
    },
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((object) => {
        // Text types don't have stroke
        if (isTextType(object.type)) {
          object.set({ fill: value });
          return;
        }

        object.set({ stroke: value });
      });
      canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: value });
      });
      canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeDashArray: value });
      });
      canvas.renderAll();
    },
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addInverseTriangle: () => {
      const HEIGHT = TRIANGLE_OPTIONS.height;
      const WIDTH = TRIANGLE_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH / 2, y: HEIGHT },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addDiamond: () => {
      const HEIGHT = DIAMOND_OPTIONS.height;
      const WIDTH = DIAMOND_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: WIDTH / 2, y: 0 },
          { x: WIDTH, y: HEIGHT / 2 },
          { x: WIDTH / 2, y: HEIGHT },
          { x: 0, y: HEIGHT / 2 },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },
    canvas,
    getActiveFontWeight: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return FONT_WEIGHT;
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, fontWeight exists.
      const value = selectedObject.get("fontWeight") || FONT_WEIGHT;

      return value;
    },
    getActiveFontFamily: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return fontFamily;
      }

      // @ts-expect-error Fabric typing mismatch.
      // Faulty TS library, fontFamily exists.
      const value = selectedObject.get("fontFamily") || fontFamily;

      return value;
    },
    getActiveFillColor: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return fillColor;
      }

      const value = selectedObject.get("fill") || fillColor;

      // Currently, gradients & patterns are not supported
      return value as string;
    },
    getActiveStrokeColor: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return strokeColor;
      }

      const value = selectedObject.get("stroke") || strokeColor;

      return value;
    },
    getActiveStrokeWidth: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return strokeWidth;
      }

      const value = selectedObject.get("strokeWidth") || strokeWidth;

      return value;
    },
    getActiveStrokeDashArray: () => {
      const selectedObject = selectedObjects?.[0];

      if (!selectedObject) {
        return strokeDashArray;
      }

      const value = selectedObject.get("strokeDashArray") || strokeDashArray;

      return value;
    },
    selectedObjects,
  };
};

export const useEditor = ({
  defaultState,
  defaultHeight,
  defaultWidth,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) => {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);
  const [activePage, setActivePage] = useState(1);

  useWindowEvents();

  const autoZoomRef = useRef<() => void>(() => {});

  const {
    save, 
    canRedo, 
    canUndo, 
    undo, 
    redo,
    canvasHistory: canvasHistoryRef,
    setHistoryIndex,
  } = useHistory({
    canvas,
    saveCallback,
    afterRestore: () => {
      autoZoomRef.current();
    },
  });

  const { copy, paste } = useClipboard({ canvas });

  const { autoZoom } = useAutoResize({
    canvas,
    container,
    activePage,
  });

  autoZoomRef.current = autoZoom;

  useCanvasEvents({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useViewportInteractions({ canvas });

  useHotkeys({
    undo,
    redo,
    copy,
    paste,
    save,
    canvas,
  });

  useLoadState({
    canvas,
    autoZoom,
    initialState,
    canvasHistory: canvasHistoryRef,
    setHistoryIndex,
  });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        save,
        undo,
        redo,
        canUndo,
        canRedo,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        strokeWidth,
        strokeColor,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        strokeDashArray,
        activePage,
        selectedObjects,
        setActivePage,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
      });
    }

    return undefined;
  }, 
  [
    canRedo,
    canUndo,
    undo,
    redo,
    save,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeWidth,
    strokeColor,
    activePage,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      const workspaceWidth = Number(initialWidth.current) || 0;
      const workspaceHeight = Number(initialHeight.current) || 0;
      const rawInitialState = initialState.current?.trim();
      const isEmptyInitialState = !rawInitialState || rawInitialState === "{}";
      const shouldBootstrapTrifoldPages =
        isEmptyInitialState
        && workspaceWidth > 0
        && workspaceHeight > 0
        && workspaceWidth / workspaceHeight > 2.3;

      patchFabricTransformGuards();
      patchFabricTextEditingPresentation();
      patchFabricTextEditingCursorMetrics();

      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: workspaceWidth || 900,
        height: workspaceHeight || 600,
        name: "clip",
        fill: shouldBootstrapTrifoldPages ? "#e5e7eb" : "white",
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

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);
      ensureCanvasViewportTransform(initialCanvas);

      const originalGetPointer = initialCanvas.getPointer.bind(initialCanvas) as (
        event: unknown,
        ignoreZoom?: boolean,
      ) => fabric.Point;

      (
        initialCanvas as unknown as {
          getPointer: (event: unknown, ignoreZoom?: boolean) => fabric.Point;
        }
      ).getPointer = (event, ignoreZoom) => {
        ensureCanvasViewportTransform(initialCanvas);

        return originalGetPointer(event, ignoreZoom);
      };

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);

      if (shouldBootstrapTrifoldPages) {
        const pageGap = 120;
        const outerMargin = 40;
        const sideWidth = (workspaceWidth - pageGap - outerMargin * 2) / 2;

        if (Number.isFinite(sideWidth) && sideWidth > 200) {
          const workspaceLeft = initialWorkspace.left ?? 0;
          const workspaceTop = initialWorkspace.top ?? 0;
          const pageOneLeft = workspaceLeft + outerMargin;
          const pageTwoLeft = pageOneLeft + sideWidth + pageGap;
          const pageTop = workspaceTop;

          const pageOneFrame = new fabric.Rect({
            left: pageOneLeft,
            top: pageTop,
            width: sideWidth,
            height: workspaceHeight,
            rx: 16,
            ry: 16,
            fill: "#ffffff",
            stroke: "#94a3b8",
            strokeWidth: 2,
            selectable: false,
            evented: false,
            hasControls: false,
            name: "page-frame",
          });
          (pageOneFrame as unknown as { pageIndex: number }).pageIndex = 1;

          const pageTwoFrame = new fabric.Rect({
            left: pageTwoLeft,
            top: pageTop,
            width: sideWidth,
            height: workspaceHeight,
            rx: 16,
            ry: 16,
            fill: "#ffffff",
            stroke: "#94a3b8",
            strokeWidth: 2,
            selectable: false,
            evented: false,
            hasControls: false,
            name: "page-frame",
          });
          (pageTwoFrame as unknown as { pageIndex: number }).pageIndex = 2;

          const pageOneLabel = new fabric.Textbox("PAGE 1 - OUTER SIDE", {
            left: pageOneLeft + 14,
            top: pageTop + 8,
            width: 220,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "Arial",
            fill: "#334155",
            editable: false,
            selectable: false,
            evented: false,
            hasControls: false,
            name: "page-label",
          });
          (pageOneLabel as unknown as { pageIndex: number }).pageIndex = 1;

          const pageTwoLabel = new fabric.Textbox("PAGE 2 - INNER SIDE", {
            left: pageTwoLeft + 14,
            top: pageTop + 8,
            width: 220,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "Arial",
            fill: "#334155",
            editable: false,
            selectable: false,
            evented: false,
            hasControls: false,
            name: "page-label",
          });
          (pageTwoLabel as unknown as { pageIndex: number }).pageIndex = 2;

          const panelWidth = sideWidth / 3;
          const panelGuideOne = new fabric.Line(
            [pageOneLeft + panelWidth, pageTop, pageOneLeft + panelWidth, pageTop + workspaceHeight],
            {
              stroke: "#dbeafe",
              strokeWidth: 1,
              selectable: false,
              evented: false,
              hasControls: false,
              name: "page-guide",
            },
          );
          (panelGuideOne as unknown as { pageIndex: number }).pageIndex = 1;

          const panelGuideTwo = new fabric.Line(
            [pageOneLeft + panelWidth * 2, pageTop, pageOneLeft + panelWidth * 2, pageTop + workspaceHeight],
            {
              stroke: "#dbeafe",
              strokeWidth: 1,
              selectable: false,
              evented: false,
              hasControls: false,
              name: "page-guide",
            },
          );
          (panelGuideTwo as unknown as { pageIndex: number }).pageIndex = 1;

          const panelGuideThree = new fabric.Line(
            [pageTwoLeft + panelWidth, pageTop, pageTwoLeft + panelWidth, pageTop + workspaceHeight],
            {
              stroke: "#93c5fd",
              strokeWidth: 1,
              selectable: false,
              evented: false,
              hasControls: false,
              name: "page-guide",
            },
          );
          (panelGuideThree as unknown as { pageIndex: number }).pageIndex = 2;

          const panelGuideFour = new fabric.Line(
            [pageTwoLeft + panelWidth * 2, pageTop, pageTwoLeft + panelWidth * 2, pageTop + workspaceHeight],
            {
              stroke: "#93c5fd",
              strokeWidth: 1,
              selectable: false,
              evented: false,
              hasControls: false,
              name: "page-guide",
            },
          );
          (panelGuideFour as unknown as { pageIndex: number }).pageIndex = 2;

          initialCanvas.add(pageOneFrame);
          initialCanvas.add(pageTwoFrame);
          initialCanvas.add(pageOneLabel);
          initialCanvas.add(pageTwoLabel);
          initialCanvas.add(panelGuideOne);
          initialCanvas.add(panelGuideTwo);
          initialCanvas.add(panelGuideThree);
          initialCanvas.add(panelGuideFour);
        }
      }

      syncCanvasClipToActivePage(initialCanvas, 1);

      setCanvas(initialCanvas);
      setContainer(initialContainer);
      setActivePage(1);

      let currentState = initialState.current;
      if (!currentState || !currentState.trim() || currentState.trim() === "{}") {
        try {
          currentState = JSON.stringify(
            initialCanvas.toJSON(JSON_KEYS)
          );
        } catch {
          currentState = JSON.stringify({
            version: "5.3.0",
            objects: [],
          });
        }
      }

      canvasHistoryRef.current = [currentState];
      setHistoryIndex(0);
    },
    [
      canvasHistoryRef, // No need, this is from useRef
      setHistoryIndex, // No need, this is from useState
      setActivePage,
    ]
  );

  return { init, editor };
};
