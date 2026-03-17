"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { OverlayItem } from "@/lib/brochure";

const PAGE_WIDTH = 983;
const PAGE_HEIGHT = 680;

type BrochureOverlayProps = {
  items: OverlayItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<OverlayItem>) => void;
  canvasScale?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type InteractionState = {
  id: string;
  mode: "move" | "resize";
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  baseWidth: number;
  baseHeight: number;
};

export default function BrochureOverlay({
  items,
  selectedId,
  onSelect,
  onUpdate,
  canvasScale = 1,
}: BrochureOverlayProps) {
  const [activeInteraction, setActiveInteraction] = useState<string | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);

  const beginMove = (event: React.PointerEvent<HTMLDivElement>, item: OverlayItem) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(item.id);
    interactionRef.current = {
      id: item.id,
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      baseX: item.x,
      baseY: item.y,
      baseWidth: item.width,
      baseHeight: item.height,
    };
    setActiveInteraction(item.id);
  };

  const beginResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    item: OverlayItem,
    handle: ResizeHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(item.id);
    interactionRef.current = {
      id: item.id,
      mode: "resize",
      handle,
      startX: event.clientX,
      startY: event.clientY,
      baseX: item.x,
      baseY: item.y,
      baseWidth: item.width,
      baseHeight: item.height,
    };
    setActiveInteraction(item.id);
  };

  const endInteraction = () => {
    interactionRef.current = null;
    setActiveInteraction(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    const item = items.find((entry) => entry.id === interaction.id);
    if (!item) return;

    const deltaX = (event.clientX - interaction.startX) / canvasScale;
    const deltaY = (event.clientY - interaction.startY) / canvasScale;

    if (interaction.mode === "move") {
      onUpdate(item.id, {
        x: clamp(interaction.baseX + deltaX, 0, PAGE_WIDTH - item.width),
        y: clamp(interaction.baseY + deltaY, 0, PAGE_HEIGHT - item.height),
      });
      return;
    }

    const minWidth = item.type === "text" ? 140 : 72;
    const minHeight = item.type === "text" ? 64 : 72;

    let nextX = interaction.baseX;
    let nextY = interaction.baseY;
    let nextWidth = interaction.baseWidth;
    let nextHeight = interaction.baseHeight;

    if (interaction.handle?.includes("e")) {
      nextWidth = clamp(interaction.baseWidth + deltaX, minWidth, PAGE_WIDTH - interaction.baseX);
    }
    if (interaction.handle?.includes("s")) {
      nextHeight = clamp(interaction.baseHeight + deltaY, minHeight, PAGE_HEIGHT - interaction.baseY);
    }
    if (interaction.handle?.includes("w")) {
      const rawWidth = interaction.baseWidth - deltaX;
      nextWidth = clamp(rawWidth, minWidth, interaction.baseX + interaction.baseWidth);
      nextX = clamp(
        interaction.baseX + (interaction.baseWidth - nextWidth),
        0,
        interaction.baseX + interaction.baseWidth - minWidth,
      );
    }
    if (interaction.handle?.includes("n")) {
      const rawHeight = interaction.baseHeight - deltaY;
      nextHeight = clamp(rawHeight, minHeight, interaction.baseY + interaction.baseHeight);
      nextY = clamp(
        interaction.baseY + (interaction.baseHeight - nextHeight),
        0,
        interaction.baseY + interaction.baseHeight - minHeight,
      );
    }

    onUpdate(item.id, {
      x: clamp(nextX, 0, PAGE_WIDTH - minWidth),
      y: clamp(nextY, 0, PAGE_HEIGHT - minHeight),
      width: clamp(nextWidth, minWidth, PAGE_WIDTH - nextX),
      height: clamp(nextHeight, minHeight, PAGE_HEIGHT - nextY),
    });
  };

  return (
    <div
      className="brochure-overlay-layer"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      {items.map((item) => {
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            className={`overlay-item ${isSelected ? "overlay-item-selected" : ""} ${
              activeInteraction === item.id ? "overlay-item-active" : ""
            }`}
            style={{
              width: item.width,
              height: item.height,
              left: item.x,
              top: item.y,
              rotate: `${item.rotation}deg`,
            }}
            onPointerDown={(event) => beginMove(event, item)}
            onPointerMove={handlePointerMove}
            onPointerUp={endInteraction}
            onPointerCancel={endInteraction}
            onLostPointerCapture={endInteraction}
          >
            <div className="overlay-item-toolbar">
              <span className="overlay-item-dot" />
              <span className="overlay-item-dot" />
              <span className="overlay-item-dot" />
            </div>

            {item.type === "shape" ? (
              <div
                className={`overlay-shape overlay-shape-${item.shape}`}
                style={{
                  background: item.fill,
                  borderColor: item.stroke,
                  borderWidth: item.strokeWidth,
                  opacity: item.opacity,
                }}
              />
            ) : item.type === "image" ? (
              <div className="overlay-image-shell" style={{ borderRadius: item.borderRadius }}>
                <Image
                  src={item.src}
                  alt={item.name}
                  className="overlay-image"
                  draggable={false}
                  fill
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="overlay-textbox"
                contentEditable
                suppressContentEditableWarning
                style={{
                  fontFamily: item.fontFamily,
                  fontSize: item.fontSize,
                  fontWeight: item.fontWeight,
                  color: item.color,
                  textAlign: item.align,
                  background: item.backgroundColor,
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onSelect(item.id);
                }}
                onBlur={(e) => onUpdate(item.id, { text: e.currentTarget.textContent ?? "" })}
              >
                {item.text}
              </div>
            )}

            {isSelected && (
              <>
                <button
                  type="button"
                  className="overlay-resize-handle overlay-resize-nw"
                  onPointerDown={(event) => beginResize(event, item, "nw")}
                  aria-label="Resize from top left"
                />
                <button
                  type="button"
                  className="overlay-resize-handle overlay-resize-ne"
                  onPointerDown={(event) => beginResize(event, item, "ne")}
                  aria-label="Resize from top right"
                />
                <button
                  type="button"
                  className="overlay-resize-handle overlay-resize-sw"
                  onPointerDown={(event) => beginResize(event, item, "sw")}
                  aria-label="Resize from bottom left"
                />
                <button
                  type="button"
                  className="overlay-resize-handle overlay-resize-se"
                  onPointerDown={(event) => beginResize(event, item, "se")}
                  aria-label="Resize from bottom right"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}