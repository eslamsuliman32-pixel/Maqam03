import React, { useEffect, useRef, useState } from "react";
import type { SectionReference } from "../../store/repositoryStore";
import type { ViewportControls } from "./useTimelineViewport";
import { useDragInteraction, type DragTarget } from "./useDragInteraction";
import { useRepositoryStore } from "../../store/repositoryStore";
import { useHistoryStore } from "../../store/historyStore";
import { usePlaybackStore } from "../../store/playbackStore";

export interface SectionRenderItem {
  section: SectionReference;
  startPPQ: number; // من repoSelectors.sectionBounds
  endPPQ: number;
}

interface Props {
  items: SectionRenderItem[];
  activeSectionId: string | null;
  controls: ViewportControls;
  height: number;
}

const COLOR_BG = "#15151c";
const COLOR_TEXT = "#0a0a0f";
const COLOR_LABEL_FALLBACK = "#e5e7eb";

export const SectionLane = ({
  items,
  activeSectionId,
  controls,
  height,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { viewport, ppqToX, xToPpq, visibleRange } = controls;

  // الحفاظ على حالة المحاكاة البصرية المؤقتة أثناء السحب الفعلي
  const [dragState, setDragState] = useState<{ id: string; delta: number } | null>(null);

  // الحصول على موضع التشغيل الحالي
  const currentPPQ = usePlaybackStore((s) => s.currentPPQ);

  const { beginDrag, onPointerMove, endDrag, isDragging } = useDragInteraction(
    controls,
    {
      onMove: (t, delta) => {
        setDragState({ id: t.id, delta });
      },
      onResizeEnd: (t, newEnd) => {
        // الأقسام تنزلق بالكامل، لذا نعدل النهاية بصرياً كمؤشر إضافي في حالة تحريك الأطراف
        const delta = newEnd - t.originEndPPQ;
        setDragState({ id: t.id, delta });
      },
      onCommit: (t) => {
        if (dragState && dragState.id === t.id && dragState.delta !== 0) {
          const store = useRepositoryStore.getState();
          const targetItem = items.find((it) => it.section.id === t.id);
          if (targetItem) {
            useHistoryStore.getState().capture("Section Move");
            // انزلاق كافة البارات داخل المقطع بنفس الدلتا مع تطبيق الالتصاق المخزن بالـ moveBar
            for (const barId of targetItem.section.barIds) {
              const bar = store.playlistBars[barId];
              if (bar) {
                store.moveBar(barId, bar.startPPQ + dragState.delta);
              }
            }
          }
        }
        setDragState(null);
      },
    }
  );

  const pickSectionAt = (clientX: number, rect: DOMRect): DragTarget | null => {
    const ppq = xToPpq(clientX - rect.left);
    const hit = items.find((it) => ppq >= it.startPPQ && ppq <= it.endPPQ);
    return hit
      ? {
          id: hit.section.id,
          kind: "section" as const,
          originStartPPQ: hit.startPPQ,
          originEndPPQ: hit.endPPQ,
        }
      : null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.widthPx * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, viewport.widthPx, height);

    ctx.font = "bold 12px sans-serif";
    ctx.textBaseline = "middle";
    const pad = 4;

    for (const { section, startPPQ, endPPQ } of items) {
      let currentStart = startPPQ;
      let currentEnd = endPPQ;

      // تطبيق السحب اللحظي على الواجهة بصرياً للحصول على أداء 60fps خالص
      if (dragState && dragState.id === section.id) {
        currentStart += dragState.delta;
        currentEnd += dragState.delta;
      }

      // Viewport Culling
      if (currentEnd < visibleRange.startPPQ || currentStart > visibleRange.endPPQ)
        continue;

      const x = ppqToX(currentStart);
      const w = Math.max(12, ppqToX(currentEnd) - x);
      const isActive = section.id === activeSectionId;
      const isUnderPlayhead = currentPPQ >= currentStart && currentPPQ <= currentEnd;

      // جسم الـ Clip
      ctx.fillStyle = section.color;
      ctx.globalAlpha = isActive || isUnderPlayhead ? 1 : 0.78;
      ctx.beginPath();
      ctx.roundRect(x, pad, w, height - pad * 2, 5);
      ctx.fill();
      ctx.globalAlpha = 1;

      // حدّ مضيء للقسم النشط أو المقطع قيد التشغيل الحالي
      if (isActive || isUnderPlayhead) {
        ctx.strokeStyle = isUnderPlayhead ? "#f43f5e" : COLOR_LABEL_FALLBACK;
        ctx.lineWidth = isUnderPlayhead ? 2 : 1.5;
        ctx.stroke();
      }

      // اسم القسم (مع clip للنص داخل الكتلة)
      if (w > 24) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, pad, w, height - pad * 2);
        ctx.clip();
        ctx.fillStyle = COLOR_TEXT;
        ctx.fillText(section.name, x + 6, height / 2);
        ctx.restore();
      }
    }
  }, [items, activeSectionId, viewport, height, ppqToX, visibleRange, dragState, currentPPQ]);

  return (
    <div style={{ position: "relative", width: viewport.widthPx, height }}>
      <canvas
        ref={canvasRef}
        style={{ width: viewport.widthPx, height, display: "block" }}
      />
      {/* طبقة التقاط مسارات الأقسام تفاعلياً */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const t = pickSectionAt(e.clientX, rect);
          if (!t) return;
          const xEnd = controls.ppqToX(t.originEndPPQ);
          const isResize = e.clientX - rect.left > xEnd - 6;
          beginDrag(e, isResize ? "resize-end" : "move", t);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
      />
    </div>
  );
};
