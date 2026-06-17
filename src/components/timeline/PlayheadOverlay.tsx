import React from "react";
import { usePlaybackStore } from "../../store/playbackStore";
import type { ViewportControls } from "./useTimelineViewport";

interface Props {
  controls: ViewportControls;
  totalHeight: number;
}

export const PlayheadOverlay = ({ controls, totalHeight }: Props) => {
  const currentPPQ = usePlaybackStore((s) => s.currentPPQ);
  const x = controls.ppqToX(currentPPQ);

  if (x < 0 || x > controls.viewport.widthPx) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: x,
        width: 2,
        height: totalHeight,
        background: "#f43f5e",
        boxShadow: "0 0 6px rgba(244,63,94,0.7)",
        pointerEvents: "none",
        zIndex: 20,
      }}
    />
  );
};
