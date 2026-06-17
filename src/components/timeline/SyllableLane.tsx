import React, { useEffect, useRef } from "react";
import type { Syllable, SyllableAlignment } from "../../types/alignment";
import type { ViewportControls } from "./useTimelineViewport";
import { useDragInteraction, type DragTarget } from "./useDragInteraction";
import { commitSyllableMove } from "../../services/syllableEditing";
import { useLyricsStore } from "../../store/lyricsStore";
import { usePlaybackStore } from "../../store/playbackStore";

interface Props {
  syllables: Syllable[];
  alignments: Record<string, SyllableAlignment>;
  controls: ViewportControls;
  height: number;
}

const COLOR_ON_BEAT = "#4ade80"; // على الضربة
const COLOR_OFF_BEAT = "#fb923c"; // منحرف (laid-back / pushing)
const COLOR_MANUAL = "#60a5fa"; // معدّل يدوياً
const COLOR_TEXT = "#0a0a0f";

const pickColor = (a: SyllableAlignment | undefined): string => {
  if (!a) return COLOR_OFF_BEAT;
  if (a.alignmentSource === "manual") return COLOR_MANUAL;
  return a.isOnBeat ? COLOR_ON_BEAT : COLOR_OFF_BEAT;
};

export const SyllableLane = ({
  syllables,
  alignments,
  controls,
  height,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { viewport, ppqToX, xToPpq, visibleRange } = controls;

  // ربط السحب والتحرير بالتحديث والمعاينة البصرية
  const { beginDrag, onPointerMove, endDrag, isDragging } = useDragInteraction(
    controls,
    {
      onMove: (t, delta) => {
        useLyricsStore.getState().previewSyllableMove(
          t.id,
          t.originStartPPQ + delta // معاينة مباشرة بدون التصاق (سلسة 60fps)
        );
      },
      onResizeEnd: (t, newEnd) => {
        useLyricsStore.getState().previewSyllableResize(t.id, newEnd);
      },
      onCommit: (t) => {
        const syl = useLyricsStore.getState().syllables[t.id];
        if (syl) {
          commitSyllableMove(t.id, syl.onsetPPQ); // الالتصاق والربط وقوانين المحاذاة النهائية
        }
      },
    }
  );

  const pickSyllableAt = (clientX: number, rect: DOMRect): DragTarget | null => {
    const ppq = xToPpq(clientX - rect.left);
    const hit = syllables.find((s) => ppq >= s.onsetPPQ && ppq <= s.offsetPPQ);
    return hit
      ? {
          id: hit.id,
          kind: "syllable" as const,
          originStartPPQ: hit.onsetPPQ,
          originEndPPQ: hit.offsetPPQ,
        }
      : null;
  };

  const currentPPQ = usePlaybackStore((s) => s.currentPPQ);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.widthPx * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewport.widthPx, height);

    const pad = 3;
    ctx.font = "12px sans-serif";
    ctx.textBaseline = "middle";

    for (const syl of syllables) {
      if (
        syl.offsetPPQ < visibleRange.startPPQ ||
        syl.onsetPPQ > visibleRange.endPPQ
      )
        continue;

      const x = ppqToX(syl.onsetPPQ);
      const w = Math.max(8, ppqToX(syl.offsetPPQ) - x);
      const a = alignments[syl.id];
      const isActive = currentPPQ >= syl.onsetPPQ && currentPPQ <= syl.offsetPPQ;

      // الكتلة
      ctx.fillStyle = pickColor(a);
      ctx.beginPath();
      ctx.roundRect(x, pad, w, height - pad * 2, 4);
      ctx.fill();

      // إطار مضيء إذا كان القارئ يمر على هذا المقطع حالياً دلالة على النشاط التفاعلي
      if (isActive) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // النص (إن اتسعت الكتلة)
      if (w > 18) {
        ctx.fillStyle = COLOR_TEXT;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, pad, w, height - pad * 2);
        ctx.clip();
        ctx.fillText(syl.text, x + 4, height / 2);
        ctx.restore();
      }
    }
  }, [syllables, alignments, viewport, height, ppqToX, visibleRange, currentPPQ]);

  return (
    <div style={{ position: "relative", width: viewport.widthPx, height }}>
      <canvas
        ref={canvasRef}
        style={{ width: viewport.widthPx, height, display: "block" }}
      />
      {/* طبقة التقاط الفأرة غير المرئية تفاعلياً */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const t = pickSyllableAt(e.clientX, rect);
          if (!t) return;
          const xEnd = controls.ppqToX(t.originEndPPQ);
          // إذا كان النقر ضمن آخر 6 بكسل من العنصر، يعتبر تطويل (Resize) والتحكم بطول المقطع
          const isResize = e.clientX - rect.left > xEnd - 6;
          beginDrag(e, isResize ? "resize-end" : "move", t);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
      />
    </div>
  );
};
