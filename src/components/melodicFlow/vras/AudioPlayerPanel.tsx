"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useVRASStore } from "../../../store/vrasStore";

export const AudioPlayerPanel: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const { audioUrl, player, beatAnalysis, actions } = useVRASStore();

  // ── مزامنة حالة التشغيل ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    audio.src = audioUrl;
    audio.volume = player.volume / 100;
    audio.playbackRate = player.playbackRate;
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (player.isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [player.isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = player.volume / 100;
  }, [player.volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = player.playbackRate;
  }, [player.playbackRate]);

  // ── حلقة تحديث سلسة (60fps) لرأس التشغيل + التكرار ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tick = () => {
      // معالجة التكرار
      if (
        player.isLooping &&
        player.loopEnd !== null &&
        audio.currentTime >= player.loopEnd
      ) {
        audio.currentTime = player.loopStart ?? 0;
      }
      actions.seekTo(audio.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (player.isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [player.isPlaying, player.isLooping, player.loopStart, player.loopEnd, actions]);

  // ── الانتقال لوقت محدد ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - player.currentTime) > 0.5) {
      audio.currentTime = player.currentTime;
    }
  }, [player.currentTime]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = beatAnalysis
    ? (player.currentTime / beatAnalysis.duration) * 100
    : 0;

  return (
    <div className="flex-shrink-0 bg-[#070912] border-b border-white/5 px-6 py-3">
      <audio ref={audioRef} />

      <div className="flex items-center gap-4">
        {/* ── أزرار التحكم ── */}
        <div className="flex items-center gap-2">
          <PlayerBtn
            onClick={() => actions.seekTo(Math.max(0, player.currentTime - 5))}
            icon="⏪"
            title="رجوع 5 ثواني"
          />
          <motion.button
            onClick={player.isPlaying ? actions.pause : actions.play}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-black text-lg shadow-lg cursor-pointer"
          >
            {player.isPlaying ? "⏸" : "▶"}
          </motion.button>
          <PlayerBtn
            onClick={() =>
              actions.seekTo(Math.min(player.duration, player.currentTime + 5))
            }
            icon="⏩"
            title="تقديم 5 ثواني"
          />
        </div>

        {/* ── شريط التقدم ── */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[10px] text-white/40 font-mono w-10 text-left">
            {formatTime(player.currentTime)}
          </span>
          <div className="relative flex-1 h-2 bg-white/5 rounded-full group">
            {/* منطقة التكرار */}
            {player.isLooping &&
              player.loopStart !== null &&
              player.loopEnd !== null &&
              beatAnalysis && (
                <div
                  className="absolute h-full bg-emerald-400/30 rounded-full"
                  style={{
                    left: `${(player.loopStart / beatAnalysis.duration) * 100}%`,
                    width: `${
                      ((player.loopEnd - player.loopStart) / beatAnalysis.duration) * 100
                    }%`,
                  }}
                />
              )}
            {/* التقدم */}
            <div
              className="absolute h-full bg-amber-400/80 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={player.duration || 100}
              step={0.1}
              value={player.currentTime}
              onChange={(e) => actions.seekTo(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-white/40 font-mono w-10">
            {formatTime(player.duration)}
          </span>
        </div>

        {/* ── أدوات التكرار والسرعة ── */}
        <div className="flex items-center gap-2">
          {/* زر التكرار */}
          <button
            onClick={player.isLooping ? actions.clearLoop : undefined}
            title={player.isLooping ? "إلغاء التكرار" : "حدد منطقة بـ Shift+سحب"}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer font-arabic ${
              player.isLooping
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                : "bg-white/[0.02] border-white/5 text-white/25"
            }`}
          >
            🔁 {player.isLooping ? "تكرار فعال" : "تكرار"}
          </button>

          {/* سرعة التشغيل */}
          <div className="flex items-center gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => actions.setPlaybackRate(rate)}
                className={`px-2 py-1 rounded text-[8px] font-mono font-bold cursor-pointer transition-all ${
                  player.playbackRate === rate
                    ? "bg-amber-400/20 text-amber-400"
                    : "text-white/25 hover:text-white/50"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* الصوت */}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[10px]">🔊</span>
            <input
              type="range"
              min={0}
              max={100}
              value={player.volume}
              onChange={(e) => actions.setVolume(Number(e.target.value))}
              className="w-16 h-1 accent-amber-500 cursor-pointer"
            />
            <span className="text-[9px] text-white/30 font-mono w-6">{player.volume}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerBtn: React.FC<{
  onClick: () => void;
  icon: string;
  title: string;
}> = ({ onClick, icon, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 border border-white/5 transition-all cursor-pointer text-sm"
  >
    {icon}
  </button>
);
