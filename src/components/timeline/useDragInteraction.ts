import React, { useCallback, useRef, useState } from "react";
import type { ViewportControls } from "./useTimelineViewport";

export type DragMode = "move" | "resize-end";

export interface DragTarget {
  id: string;
  kind: "syllable" | "section";
  originStartPPQ: number;
  originEndPPQ: number;
}

interface DragCallbacks {
  onMove: (target: DragTarget, deltaPPQ: number) => void;
  onResizeEnd: (target: DragTarget, newEndPPQ: number) => void;
  onCommit: (target: DragTarget) => void;
}

export const useDragInteraction = (
  controls: ViewportControls,
  callbacks: DragCallbacks,
) => {
  const { xToPpq } = controls;
  const [isDragging, setIsDragging] = useState(false);
  const stateRef = useRef<{
    mode: DragMode;
    target: DragTarget;
    startClientX: number;
  } | null>(null);

  const beginDrag = useCallback(
    (e: React.PointerEvent, mode: DragMode, target: DragTarget) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      stateRef.current = { mode, target, startClientX: e.clientX };
      setIsDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const st = stateRef.current;
      if (!st) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const currentPPQ = xToPpq(e.clientX - rect.left);
      const startPPQ = xToPpq(st.startClientX - rect.left);
      const deltaPPQ = currentPPQ - startPPQ;

      if (st.mode === "move") {
        callbacks.onMove(st.target, deltaPPQ);
      } else {
        const newEnd = Math.max(
          st.target.originStartPPQ + 1,
          st.target.originEndPPQ + deltaPPQ,
        );
        callbacks.onResizeEnd(st.target, newEnd);
      }
    },
    [xToPpq, callbacks],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const st = stateRef.current;
      if (!st) return;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      callbacks.onCommit(st.target); // الالتصاق النهائي بالشبكة
      stateRef.current = null;
      setIsDragging(false);
    },
    [callbacks],
  );

  return { isDragging, beginDrag, onPointerMove, endDrag };
};
