"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  useBeatWriterStore,
  Instrument,
  WaveformCache,
} from "../../store/beatWriterStore";

export const InstrumentPanel: React.FC = () => {
  const { instruments, selectedInstrumentId, waveformCache, currentTime, beatGrid, actions } =
    useBeatWriterStore();

  return (
    <div className="flex flex-col h-full bg-[#070a12]" dir="rtl">
      {/* رأس اللوحة */}
      <div className="px-4 py-4 border-b border-white/[0.05] flex-shrink-0">
        <h2 className="text-[14px] font-black text-white leading-none tracking-wide">🎚️ مسارات الآلات</h2>
        <p className="text-[10px] text-white/40 mt-1.5 leading-relaxed">
          ▶ لتجربة صوت الآلة • S منفرد • M كتم
        </p>
      </div>

      {/* قائمة الآلات */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {instruments.map((inst, idx) => (
          <InstrumentRow
            key={inst.id}
            instrument={inst}
            index={idx}
            isSelected={selectedInstrumentId === inst.id}
            waveCache={waveformCache.get(inst.id)}
            currentTime={currentTime}
            totalDuration={beatGrid?.totalDuration ?? 0}
            onSelect={() => actions.selectInstrument(inst.id)}
            onPlay={() => actions.playInstrument(inst.id)}
            onMute={() => actions.toggleMute(inst.id)}
            onSolo={() => actions.toggleSolo(inst.id)}
            onVolume={(v) => actions.setVolume(inst.id, v)}
          />
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════
//  صف الآلة
// ════════════════════════════════════════

interface InstrumentRowProps {
  instrument: Instrument;
  index: number;
  isSelected: boolean;
  waveCache?: WaveformCache;
  currentTime: number;
  totalDuration: number;
  onSelect: () => void;
  onPlay: () => void;
  onMute: () => void;
  onSolo: () => void;
  onVolume: (v: number) => void;
}

const InstrumentRow: React.FC<InstrumentRowProps> = ({
  instrument, index, isSelected, waveCache, currentTime, totalDuration,
  onSelect, onPlay, onMute, onSolo, onVolume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { color, isMuted, isSolo, isPlaying, volume } = instrument;

  // رسم الموجة المصغرة
  const drawMini = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveCache) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const peaks = waveCache.peaks;
    const totalPeaks = peaks.length;
    if (totalPeaks === 0) return;

    const midY = H / 2;
    const playedFrac = totalDuration > 0 ? currentTime / totalDuration : 0;
    const playedIdx = Math.floor(playedFrac * totalPeaks);

    // خلفية
    ctx.fillStyle = isMuted ? "rgba(0,0,0,0.5)" : `${color}0b`;
    ctx.fillRect(0, 0, W, H);

    // رسم الموجة
    for (let i = 0; i < totalPeaks; i++) {
      const x = (i / totalPeaks) * W;
      const amp = peaks[i] * (H / 2) * 0.85;
      const isPast = i < playedIdx;

      ctx.fillStyle = isMuted
        ? "rgba(255,255,255,0.06)"
        : isPast
        ? `${color}40`
        : `${color}DD`;
      ctx.fillRect(x, midY - amp, Math.max(1, W / totalPeaks - 0.5), amp * 2);
    }

    // خط التشغيل
    if (totalDuration > 0) {
      const px = playedFrac * W;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
  }, [waveCache, currentTime, totalDuration, color, isMuted]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      drawMini();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drawMini]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border overflow-hidden transition-all duration-150 cursor-pointer p-1.5
        ${isSelected ? "border-opacity-50" : "border-white/[0.04] hover:border-white/[0.08]"}
        ${isMuted ? "opacity-50" : ""}
      `}
      style={isSelected ? { borderColor: color + "70", backgroundColor: color + "0a" } : {}}
      onClick={onSelect}
    >
      {/* الصف العلوي */}
      <div className="flex items-center gap-3 px-2 py-2">
        {/* أيقونة + اسم */}
        <span className="text-xl flex-shrink-0">{instrument.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-black truncate leading-none
            ${isSelected ? "text-white" : "text-white/70"}`}
            style={isSelected ? { color } : {}}
          >
            {instrument.nameAr}
          </p>
          <p className="text-[10px] font-mono text-white/40 leading-none mt-1">
            {instrument.baseFrequency}Hz
          </p>
        </div>

        {/* S / M / ▶ */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <SmallBtn
            label="S"
            active={isSolo}
            activeStyle={{ backgroundColor: "#F59E0B40", color: "#F59E0B" }}
            onClick={onSolo}
            title="انفراد الآلة"
          />
          <SmallBtn
            label="M"
            active={isMuted}
            activeStyle={{ backgroundColor: "#EF444440", color: "#EF4444" }}
            onClick={onMute}
            title="كتم الآلة"
          />
          <motion.button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            whileTap={{ scale: 0.85 }}
            title={isPlaying ? "إيقاف" : "تشغيل"}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px]
              font-black cursor-pointer transition-all"
            style={{
              backgroundColor: isPlaying ? color : color + "15",
              color: isPlaying ? "#000" : color,
              boxShadow: isPlaying ? `0 0 10px ${color}70` : "none",
            }}
          >
            {isPlaying ? "⏹" : "▶"}
          </motion.button>
        </div>
      </div>

      {/* موجة مصغرة */}
      <div className="px-2 pb-1.5">
        <canvas
          ref={canvasRef}
          width={240}
          height={48}
          className="w-full rounded-lg"
          style={{ display: "block" }}
        />
      </div>

      {/* مستوى الصوت */}
      <div
        className="flex items-center gap-2 px-2 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] text-white/30 font-mono w-6 text-left">{volume}%</span>
        <div className="relative flex-1 h-1.5 bg-white/[0.06] rounded-full">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${isMuted ? 0 : volume}%`, backgroundColor: color, opacity: 0.8 }}
          />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
        {/* مؤشر نشاط حي */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
          style={{
            backgroundColor: isPlaying && !isMuted ? color : "rgba(255,255,255,0.08)",
            boxShadow: isPlaying && !isMuted ? `0 0 6px ${color}` : "none",
          }}
        />
      </div>
    </motion.div>
  );
};

// ── زر مصغر ──
const SmallBtn: React.FC<{
  label: string;
  active: boolean;
  activeStyle: React.CSSProperties;
  onClick: () => void;
  title: string;
}> = ({ label, active, activeStyle, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px]
      font-black cursor-pointer transition-all border border-white/[0.04]"
    style={
      active
        ? activeStyle
        : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
    }
  >
    {label}
  </button>
);
