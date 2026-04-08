"use client";

import React, { useMemo, useRef, useState } from "react";
import { SegmentPosition } from "@/lib/domains/brochure";

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type InteractionState = {
  mode: "move" | "resize";
  handle?: ResizeHandle;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  baseWidth: number;
  baseHeight: number;
  scale: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type PendingMoveState = {
  startX: number;
  startY: number;
};

type MovableSegmentProps = {
  id: string;
  position?: SegmentPosition;
  onMove?: (id: string, position: SegmentPosition) => void;
  children: React.ReactNode;
  className?: string;
  index?: number;
  isSelected?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  canvasScale?: number;
  style?: React.CSSProperties;
  minWidth?: number;
  minHeight?: number;
};

const SOFT_LIMIT = 2000;
const DRAG_START_THRESHOLD = 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function MovableSegment({
  id,
  position,
  onMove,
  children,
  className,
  index = 0,
  isSelected = false,
  selectedId = null,
  onSelect,
  canvasScale = 1,
  style,
  minWidth = 140,
  minHeight = 64,
}: MovableSegmentProps) {
  const [interactionMode, setInteractionMode] = useState<InteractionState["mode"] | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const pendingMoveRef = useRef<PendingMoveState | null>(null);

  const currentPosition = useMemo(
    () => position ?? { x: 0, y: 0 },
    [position],
  );
  const isSegmentSelected = isSelected || selectedId === id;

  const buildBounds = (host: HTMLElement) => {
    const parent = host.parentElement;
    if (!parent) {
      return {
        scale: canvasScale || 1,
        minX: -SOFT_LIMIT,
        maxX: SOFT_LIMIT,
        minY: -SOFT_LIMIT,
        maxY: SOFT_LIMIT,
      };
    }

    const stage = host.closest(".preview-stage") as HTMLElement | null;
    const matrix = stage ? window.getComputedStyle(stage).transform : "none";
    const scale = matrix && matrix !== "none" ? Number(matrix.split("(")[1]?.split(",")[0]) || canvasScale || 1 : canvasScale || 1;

    const parentRect = parent.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();

    const leftSpace = Math.max(0, hostRect.left - parentRect.left) / scale;
    const rightSpace = Math.max(0, parentRect.right - hostRect.right) / scale;
    const topSpace = Math.max(0, hostRect.top - parentRect.top) / scale;
    const bottomSpace = Math.max(0, parentRect.bottom - hostRect.bottom) / scale;

    return {
      scale,
      minX: -leftSpace - SOFT_LIMIT,
      maxX: rightSpace + SOFT_LIMIT,
      minY: -topSpace - SOFT_LIMIT,
      maxY: bottomSpace + SOFT_LIMIT,
    };
  };

  const beginInteraction = (
    e: React.PointerEvent<HTMLElement>,
    mode: InteractionState["mode"],
    handle?: ResizeHandle,
  ) => {
    if (!hostRef.current || !onMove) return;

    e.preventDefault();
    e.stopPropagation();
    onSelect?.(id);

    const host = hostRef.current;
    const hostRect = host.getBoundingClientRect();
    const bounds = buildBounds(host);
    const baseWidth = currentPosition.width ?? hostRect.width / bounds.scale;
    const baseHeight = currentPosition.height ?? hostRect.height / bounds.scale;

    pendingMoveRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    setInteractionMode(mode);

    interactionRef.current = {
      mode,
      handle,
      x: e.clientX,
      y: e.clientY,
      baseX: currentPosition.x,
      baseY: currentPosition.y,
      baseWidth,
      baseHeight,
      scale: bounds.scale,
      minX: bounds.minX,
      maxX: bounds.maxX,
      minY: bounds.minY,
      maxY: bounds.maxY,
    };
  };

  const onResizeHandlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    handle: ResizeHandle,
  ) => {
    beginInteraction(e, "resize", handle);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!onMove || !hostRef.current || !interactionRef.current || !interactionMode) return;

    const interaction = interactionRef.current;
    const dx = (e.clientX - interaction.x) / interaction.scale;
    const dy = (e.clientY - interaction.y) / interaction.scale;

    if (interaction.mode === "move") {
      const rawX = interaction.baseX + dx;
      const rawY = interaction.baseY + dy;

      onMove(id, {
        ...currentPosition,
        x: clamp(rawX, interaction.minX, interaction.maxX),
        y: clamp(rawY, interaction.minY, interaction.maxY),
      });

      return;
    }

    let nextX = interaction.baseX;
    let nextY = interaction.baseY;
    let nextWidth = interaction.baseWidth;
    let nextHeight = interaction.baseHeight;

    if (interaction.handle?.includes("e")) {
      nextWidth = Math.max(minWidth, interaction.baseWidth + dx);
    }
    if (interaction.handle?.includes("s")) {
      nextHeight = Math.max(minHeight, interaction.baseHeight + dy);
    }
    if (interaction.handle?.includes("w")) {
      nextWidth = Math.max(minWidth, interaction.baseWidth - dx);
      nextX = interaction.baseX + (interaction.baseWidth - nextWidth);
    }
    if (interaction.handle?.includes("n")) {
      nextHeight = Math.max(minHeight, interaction.baseHeight - dy);
      nextY = interaction.baseY + (interaction.baseHeight - nextHeight);
    }

    onMove(id, {
      ...currentPosition,
      x: clamp(nextX, interaction.minX, interaction.maxX),
      y: clamp(nextY, interaction.minY, interaction.maxY),
      width: clamp(nextWidth, minWidth, SOFT_LIMIT * 2),
      height: clamp(nextHeight, minHeight, SOFT_LIMIT * 2),
    });
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    pendingMoveRef.current = null;

    if (!interactionRef.current) {
      return;
    }

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    interactionRef.current = null;
    setInteractionMode(null);
  };

  const onLostPointerCapture = () => {
    pendingMoveRef.current = null;
    interactionRef.current = null;
    setInteractionMode(null);
  };

  const cssVars: React.CSSProperties = {};
  if (currentPosition.fontFamily) {
    (cssVars as Record<string, string>)["--segment-font-family"] = currentPosition.fontFamily;
  }
  if (currentPosition.fontSize) {
    (cssVars as Record<string, string>)["--segment-font-size"] = `${currentPosition.fontSize}px`;
  }
  if (currentPosition.fontWeight) {
    (cssVars as Record<string, string>)["--segment-font-weight"] = String(currentPosition.fontWeight);
  }
  if (currentPosition.color) {
    (cssVars as Record<string, string>)["--segment-font-color"] = currentPosition.color;
  }
  if (currentPosition.align) {
    (cssVars as Record<string, string>)["--segment-text-align"] = currentPosition.align;
  }

  const isDragging = interactionMode === "move";
  const isResizing = interactionMode === "resize";

  return (
    <div
      ref={hostRef}
      data-segment-id={id}
      className={`segment-shell ${isSegmentSelected ? "segment-shell-selected" : ""} ${isDragging ? "segment-shell-dragging" : ""} ${isResizing ? "segment-shell-resizing" : ""} ${className ?? ""}`}
      style={{
        transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
        width: currentPosition.width,
        height: currentPosition.height,
        ...cssVars,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.(id);

        if (!onMove) return;

        const target = e.target as HTMLElement;
        if (target.closest(".segment-resize-handle")) {
          return;
        }

        pendingMoveRef.current = {
          startX: e.clientX,
          startY: e.clientY,
        };

        if (!target.closest("[contenteditable='true']")) {
          beginInteraction(e, "move");
        }
      }}
      onPointerMove={(e) => {
        if (!interactionMode && pendingMoveRef.current && onMove) {
          const dx = e.clientX - pendingMoveRef.current.startX;
          const dy = e.clientY - pendingMoveRef.current.startY;
          if (Math.hypot(dx, dy) >= DRAG_START_THRESHOLD) {
            beginInteraction(e, "move");
            return;
          }
        }

        onHandlePointerMove(e);
      }}
      onPointerUp={onHandlePointerUp}
      onPointerCancel={onHandlePointerUp}
      onLostPointerCapture={onLostPointerCapture}
    >
      {onMove && isSegmentSelected && (
        <>
          <button
            type="button"
            className="segment-resize-handle segment-resize-nw"
            onPointerDown={(e) => onResizeHandlePointerDown(e, "nw")}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            onLostPointerCapture={onLostPointerCapture}
            aria-label="Resize from top left"
          />
          <button
            type="button"
            className="segment-resize-handle segment-resize-ne"
            onPointerDown={(e) => onResizeHandlePointerDown(e, "ne")}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            onLostPointerCapture={onLostPointerCapture}
            aria-label="Resize from top right"
          />
          <button
            type="button"
            className="segment-resize-handle segment-resize-sw"
            onPointerDown={(e) => onResizeHandlePointerDown(e, "sw")}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            onLostPointerCapture={onLostPointerCapture}
            aria-label="Resize from bottom left"
          />
          <button
            type="button"
            className="segment-resize-handle segment-resize-se"
            onPointerDown={(e) => onResizeHandlePointerDown(e, "se")}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            onLostPointerCapture={onLostPointerCapture}
            aria-label="Resize from bottom right"
          />
        </>
      )}

      <div
        className="segment-surface"
        style={{
          animationDelay: `${index * 70}ms`,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
