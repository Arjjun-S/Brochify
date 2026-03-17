"use client";

import React, { useMemo, useRef, useState } from "react";

type SegmentPosition = {
  x: number;
  y: number;
};

type MovableSegmentProps = {
  id: string;
  position?: SegmentPosition;
  onMove?: (id: string, position: SegmentPosition) => void;
  children: React.ReactNode;
  className?: string;
  index?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function MovableSegment({
  id,
  position,
  onMove,
  children,
  className,
  index = 0,
}: MovableSegmentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(null);

  const currentPosition = useMemo(
    () => position ?? { x: 0, y: 0 },
    [position],
  );

  const onHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!hostRef.current || !onMove) return;

    e.preventDefault();
    e.stopPropagation();

    const host = hostRef.current;
    const parent = host.parentElement;
    if (!parent) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseX: currentPosition.x,
      baseY: currentPosition.y,
    };
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!onMove || !hostRef.current || !dragStartRef.current || !isDragging) return;

    const host = hostRef.current;
    const parent = host.parentElement;
    if (!parent) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const parentRect = parent.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();

    const rawX = dragStartRef.current.baseX + dx;
    const rawY = dragStartRef.current.baseY + dy;

    const minX = -Math.max(0, hostRect.left - parentRect.left) - 4;
    const maxX = Math.max(0, parentRect.right - hostRect.right) + 4;
    const minY = -Math.max(0, hostRect.top - parentRect.top) - 4;
    const maxY = Math.max(0, parentRect.bottom - hostRect.bottom) + 4;

    onMove(id, {
      x: clamp(rawX, minX, maxX),
      y: clamp(rawY, minY, maxY),
    });
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const onLostPointerCapture = () => {
    dragStartRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      ref={hostRef}
      className={`segment-shell ${isDragging ? "segment-shell-dragging" : ""} ${className ?? ""}`}
      style={{
        transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
      }}
    >
      {onMove && (
        <button
          type="button"
          className="segment-handle"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          onLostPointerCapture={onLostPointerCapture}
          title="Drag segment"
          aria-label="Drag segment"
        >
          <span />
          <span />
          <span />
        </button>
      )}
      <div
        className="segment-surface"
        style={{ animationDelay: `${index * 70}ms` }}
      >
        {children}
      </div>
    </div>
  );
}
