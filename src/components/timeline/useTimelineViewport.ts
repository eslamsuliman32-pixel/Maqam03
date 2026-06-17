import { useState, useCallback, useMemo } from "react";

export interface TimelineViewport {
  pixelsPerPPQ: number; // مستوى التكبير
  scrollPPQ: number; // موقع التمرير الأفقي (بداية الإطار المرئي)
  widthPx: number; // عرض منطقة الرسم
}

export interface ViewportControls {
  viewport: TimelineViewport;
  ppqToX: (ppq: number) => number;
  xToPpq: (x: number) => number;
  visibleRange: { startPPQ: number; endPPQ: number };
  setZoom: (pixelsPerPPQ: number) => void;
  scrollBy: (deltaPPQ: number) => void;
  setWidth: (widthPx: number) => void;
}

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 2.0;

export const useTimelineViewport = (
  initialZoom = 0.08
): ViewportControls => {
  const [pixelsPerPPQ, setPixelsPerPPQ] = useState(initialZoom);
  const [scrollPPQ, setScrollPPQ] = useState(0);
  const [widthPx, setWidthPx] = useState(0);

  const ppqToX = useCallback(
    (ppq: number) => (ppq - scrollPPQ) * pixelsPerPPQ,
    [scrollPPQ, pixelsPerPPQ]
  );

  const xToPpq = useCallback(
    (x: number) => x / pixelsPerPPQ + scrollPPQ,
    [scrollPPQ, pixelsPerPPQ]
  );

  const visibleRange = useMemo(
    () => ({
      startPPQ: scrollPPQ,
      endPPQ: scrollPPQ + widthPx / pixelsPerPPQ,
    }),
    [scrollPPQ, widthPx, pixelsPerPPQ]
  );

  const setZoom = useCallback((z: number) => {
    setPixelsPerPPQ(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)));
  }, []);

  const scrollBy = useCallback((deltaPPQ: number) => {
    setScrollPPQ((prev) => Math.max(0, prev + deltaPPQ));
  }, []);

  const viewport = useMemo(
    () => ({ pixelsPerPPQ, scrollPPQ, widthPx }),
    [pixelsPerPPQ, scrollPPQ, widthPx]
  );

  return {
    viewport, ppqToX, xToPpq, visibleRange,
    setZoom, scrollBy, setWidth: setWidthPx,
  };
};
