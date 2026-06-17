// ═══════════════════════════════════════════════════════════════
//  MAQAM — Beat Visual Grid (v3.7 Architectural Enhanced Edition)
//  Layered Bar Deck + FL‑Style Timeline + BPM‑Synced Audio Engine
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import type { BeatBlueprint, Bar, OnsetEvent } from "../types/audio.types";

// ───────────────────────────────────────────────────────────────
//  Color Maps
// ───────────────────────────────────────────────────────────────

const ONSETCOLORS: Record<OnsetEvent["type"], string> = {
  kick: "#EF4444",
  snare: "#F59E0B",
  hihat: "#06B6D4",
  perc: "#8B5CF6",
  unknown: "#6B7280",
};

const ENERGYBG: Record<string, string> = {
  peak: "rgba(239,68,68,0.15)",
  high: "rgba(245,158,11,0.10)",
  mid: "rgba(16,185,129,0.08)",
  low: "rgba(99,102,241,0.05)",
};

// ═══════════════════════════════════════════════════════════════
//  FL‑STYLE TIMELINE (moves during playback)
// ═══════════════════════════════════════════════════════════════

const Timeline: React.FC<{ bpm: number; isPlaying: boolean }> = ({ bpm, isPlaying }) => {
  const [position, setPosition] = useState(0); // 0–100%

  useEffect(() => {
    if (!isPlaying) return;

    const msPerBeat = 60000 / bpm;
    const msPerStep = msPerBeat / 4; // 1/16 note

    let start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const cycle = (elapsed % (msPerBeat * 16)) / (msPerBeat * 16);
      setPosition(cycle * 100);
      requestAnimationFrame(animate);
    };

    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, bpm]);

  return (
    <div className="relative w-full h-6 mb-3">
      <div className="absolute inset-0 flex justify-between text-[8px] text-[#94A3B8] font-mono">
        {Array.from({ length: 17 }).map((_, i) => (
          <div key={i} style={{ transform: "translateX(-1px)" }}>
            | {i}
          </div>
        ))}
      </div>

      <div
        className="absolute top-0 w-[2px] h-full bg-[#F59E0B]"
        style={{ left: `${position}%` }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  LAYERED BAR VIEW  (Drum Grid + Rhyme Layer + Flow Layer)
// ═══════════════════════════════════════════════════════════════

const LayeredBar: React.FC<{ bar: Bar }> = ({ bar }) => {
  const cells = Array.from({ length: 16 }, (_, i) => {
    const beat = Math.floor(i / 4) + 1;
    const sub = i % 4;
    const onset = bar.onsets.find(o => o.beatIndex === beat && o.subdivisionIndex === sub);
    return { beat, sub, onset };
  });

  return (
    <div
      className="rounded-xl p-3 space-y-3 border border-white/5 bg-[#15151E]/70 backdrop-blur"
      style={{ background: ENERGYBG[bar.energyLevel] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#94A3B8] font-mono">BAR {bar.index + 1}</span>

        <span
          className="px-2 py-0.5 rounded-full text-[8px] font-bold"
          style={{
            color:
              bar.energyLevel === "peak"
                ? "#EF4444"
                : bar.energyLevel === "high"
                ? "#F59E0B"
                : bar.energyLevel === "mid"
                ? "#10B981"
                : "#6366F1",
            backgroundColor: ENERGYBG[bar.energyLevel],
          }}
        >
          {bar.energyLevel.toUpperCase()}
        </span>
      </div>

      {/* Layered Architectural Stack */}
      <div className="space-y-2">

        {/* Layer 1 — DRUM (Grid Container) */}
        <div>
          <div className="text-[8px] text-[#475569] font-bold mb-1">LAYER 1: DRUM</div>
          <div className="grid grid-cols-16 gap-[1px]">
            {cells.map(({ onset }, idx) => (
              <div
                key={idx}
                className="w-full h-2 rounded-sm bg-white/10"
                style={{
                  backgroundColor: onset ? ONSETCOLORS[onset.type] : "rgba(255,255,255,0.07)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Layer 2 — RHYME (Structural Connectors) */}
        <div>
          <div className="text-[8px] text-[#475569] font-bold mb-1">LAYER 2: RHYME</div>
          <div className="grid grid-cols-16 gap-[2px]">
            {cells.map(({ onset }, idx) => (
              <div
                key={idx}
                className="h-3 rounded bg-[#1E1E29]"
                style={{
                  opacity: onset ? 0.8 : 0.1,
                  border: onset ? "1px solid #64748B60" : "1px dashed #33415550",
                }}
              />
            ))}
          </div>
        </div>

        {/* Layer 3 — FLOW (Kinetic Vectors) */}
        <div>
          <div className="text-[8px] text-[#475569] font-bold mb-1">LAYER 3: FLOW</div>
          <div className="grid grid-cols-16 gap-[2px]">
            {cells.map(({ onset }, idx) => (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  scale: onset ? [1, 1.25, 1] : 1,
                  opacity: onset ? 1 : 0.07,
                }}
                transition={{ duration: 0.25 }}
                className="h-4 rounded-sm bg-white/10"
                style={{
                  backgroundColor: onset
                    ? `${ONSETCOLORS[onset.type]}55`
                    : "rgba(255,255,255,0.05)",
                }}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Silence Indicator */}
      {bar.hasSilence && (
        <div className="w-2 h-2 rounded-full bg-blue-400/70 animate-pulse ml-auto" />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAIN GRID + AUDIO PLAYER + TIMELINE
// ═══════════════════════════════════════════════════════════════

export const BeatVisualGrid: React.FC<{ blueprint: BeatBlueprint }> = ({ blueprint }) => {
  const { bars } = blueprint.rhythm;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.warn("Playback interrupted:", error);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="space-y-5 bg-[#12121A]/40 p-6 rounded-3xl border border-white/5">

      {/* AUDIO ENGINE */}
      <audio ref={audioRef} src={blueprint.audioUrl} preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#F1F5F9] font-bold text-lg">الشبكة الإيقاعية — Layered Engine</h3>

        <button
          onClick={togglePlayback}
          className="px-4 py-1 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 text-sm font-bold"
        >
          {isPlaying ? "إيقاف" : "تشغيل"}
        </button>
      </div>

      {/* Timeline */}
      <Timeline bpm={blueprint.tempo.bpm} isPlaying={isPlaying} />

      {/* Metadata badges */}
      <div className="flex gap-3">
        <span className="px-3 py-1 rounded-full text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[11px] font-bold">
          {blueprint.tempo.bpm} BPM
        </span>
        <span className="px-3 py-1 rounded-full text-[#94A3B8] bg-white/5 border border-white/10 text-[11px] font-bold">
          {blueprint.rhymeArchitecture.recommendedFlow}
        </span>
        <span className="px-3 py-1 rounded-full text-[#94A3B8] bg-white/5 border border-white/10 text-[11px] font-bold">
          Swing {Math.round(blueprint.rhythm.swingFactor * 100)}%
        </span>
      </div>

      {/* LAYERED GRID */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {bars.map(bar => (
          <LayeredBar bar={bar} key={bar.index} />
        ))}
      </div>
    </div>
  );
};
