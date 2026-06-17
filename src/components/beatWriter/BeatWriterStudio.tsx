"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBeatWriterStore } from "../../store/beatWriterStore";
import { InstrumentPanel } from "./InstrumentPanel";
import { BeatTimeline } from "./BeatTimeline";
import { LyricEditor } from "./LyricEditor";

export const BeatWriterStudio: React.FC = () => {
  const {
    beatGrid, isAnalyzing, analysisProgress, actions,
  } = useBeatWriterStore();

  // التهيئة التلقائية
  useEffect(() => {
    actions.analyzeAndBuild(90, 32);
  }, []);

  return (
    <div
      className="w-full bg-[#04050a] text-white overflow-hidden relative"
      style={{
        fontFamily: "Tajawal, sans-serif",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      dir="rtl"
    >
      {/* رأس الاستوديو */}
      <StudioTopBar />

      {/* منطقة العمل الرئيسية */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* الشريط الجانبي: الآلات */}
        <aside
          className="flex-shrink-0 bg-[#070a12] border-l border-white/[0.06] overflow-y-auto"
          style={{ width: "290px" }}
        >
          <InstrumentPanel />
        </aside>

        {/* المنطقة المركزية */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* خط الوقت - الجزء الأكبر مقاساً */}
          <div
            className="flex-shrink-0 border-b border-white/[0.06]"
            style={{ height: "580px" }}
          >
            <BeatTimeline />
          </div>

          {/* محرر الكلمات */}
          <div className="flex-1 overflow-hidden min-h-0">
            <LyricEditor />
          </div>
        </div>
      </div>

      {/* شريط التشغيل السفلي */}
      <PlaybackBar />

      {/* شاشة التحليل */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#04050a]/95 flex flex-col
              items-center justify-center z-50 gap-6"
          >
            <div className="text-5xl animate-pulse">🎵</div>
            <div className="text-center">
              <p className="text-lg font-black text-white mb-2">
                جاري بناء استوديو الكتابة
              </p>
              <p className="text-xs text-white/40">
                تحليل الإيقاع وبناء موجات الآلات...
              </p>
            </div>
            <div className="w-80 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400 rounded-full"
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm font-mono text-amber-400">{analysisProgress}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ════════════════════════════════════════
//  الشريط العلوي
// ════════════════════════════════════════

const StudioTopBar: React.FC = () => {
  const { beatGrid, isAnalyzing, actions } = useBeatWriterStore();
  const [bpmInput, setBpmInput] = useState("90");
  const [barsInput, setBarsInput] = useState("32");

  const handleRebuild = () => {
    const bpm = Math.max(60, Math.min(200, parseInt(bpmInput) || 90));
    const bars = Math.max(4, Math.min(128, parseInt(barsInput) || 32));
    actions.analyzeAndBuild(bpm, bars);
  };

  return (
    <header
      className="flex-shrink-0 flex items-center gap-6 px-6 border-b border-white/[0.06]
        bg-[#060810]"
      style={{ height: "64px" }}
    >
      {/* شعار */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500
          flex items-center justify-center text-sm shadow-md shadow-orange-500/10">
          🎵
        </div>
        <div>
          <p className="text-[13px] font-black text-white leading-none tracking-wide">Beat Writer</p>
          <p className="text-[10px] text-white/40 leading-none mt-1">استوديو الكتابة والتلحين</p>
        </div>
      </div>

      <div className="w-px h-6 bg-white/10 flex-shrink-0" />

      {/* BPM */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="text-[11px] font-bold text-white/50">BPM:</label>
        <input
          type="number"
          value={bpmInput}
          onChange={(e) => setBpmInput(e.target.value)}
          className="w-18 h-8 bg-white/5 border border-white/15 rounded-lg px-2.5
            text-sm text-amber-400 font-mono text-center focus:outline-none
            focus:border-amber-500/40"
          min={60} max={200}
        />
      </div>

      {/* عدد الأشرطة */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="text-[11px] font-bold text-white/50">أشرطة:</label>
        <input
          type="number"
          value={barsInput}
          onChange={(e) => setBarsInput(e.target.value)}
          className="w-18 h-8 bg-white/5 border border-white/15 rounded-lg px-2.5
            text-sm text-amber-400 font-mono text-center focus:outline-none
            focus:border-amber-500/40"
          min={4} max={128}
        />
      </div>

      <button
        onClick={handleRebuild}
        disabled={isAnalyzing}
        className="px-4 h-9 rounded-xl text-xs font-black cursor-pointer
          bg-amber-400/15 text-amber-400 border border-amber-400/30
          hover:bg-amber-400/25 active:scale-95 disabled:opacity-40 transition-all flex-shrink-0"
      >
        {isAnalyzing ? "⟳ جاري البناء..." : "🔄 إعادة بناء اللحن"}
      </button>

      {/* معلومات البيت */}
      {beatGrid && (
        <>
          <div className="w-px h-6 bg-white/10 flex-shrink-0" />
          <div className="flex items-center gap-4 text-[11px] text-white/40 flex-shrink-0">
            <span>
              مدة البيت الكلية:{" "}
              <span className="text-amber-400 font-bold font-mono">
                {beatGrid.totalDuration.toFixed(1)}s
              </span>
            </span>
            <span>
              عدد الأشرطة:{" "}
              <span className="text-amber-400 font-bold font-mono">
                {beatGrid.totalBars}
              </span>
            </span>
            <span>
              توقيع الإيقاع:{" "}
              <span className="text-amber-400 font-bold">
                {beatGrid.timeSignatureNum}/{beatGrid.timeSignatureDen}
              </span>
            </span>
          </div>
        </>
      )}
    </header>
  );
};

// ════════════════════════════════════════
//  شريط التشغيل
// ════════════════════════════════════════

const PlaybackBar: React.FC = () => {
  const {
    isPlaying, currentTime, currentBar, currentBeat,
    beatGrid, masterVolume, audioContextReady, actions,
  } = useBeatWriterStore();

  const duration = beatGrid?.totalDuration ?? 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
  };

  // تحديد القسم الحالي
  const currentSection = beatGrid?.sections.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  return (
    <div
      className="flex-shrink-0 flex items-center gap-5 px-6 bg-[#030408]
        border-t border-white/[0.06]"
      style={{ height: "64px" }}
    >
      {/* زر التشغيل */}
      <motion.button
        onClick={isPlaying ? actions.stopAll : actions.playAll}
        whileTap={{ scale: 0.9 }}
        disabled={!beatGrid}
        className="w-12 h-12 rounded-full flex items-center justify-center
          text-black font-black text-base cursor-pointer disabled:opacity-40
          flex-shrink-0 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #F59E0B, #EF4444)",
        }}
      >
        {isPlaying ? "⏸" : "▶"}
      </motion.button>

      {/* الوقت الحالي */}
      <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
        <span className="text-white font-bold">{fmt(currentTime)}</span>
        <span className="text-white/20">/</span>
        <span className="text-white/40">{fmt(duration)}</span>
      </div>

      {/* الشريط والبيت */}
      <div className="flex items-center gap-2.5 text-[11px] flex-shrink-0">
        <span className="text-white/40">شريط:</span>
        <span className="text-amber-400 font-extrabold font-mono w-7 text-[12px] text-center">
          {currentBar + 1}
        </span>
        <span className="text-white/40">بيت:</span>
        <span className="text-white/80 font-extrabold font-mono w-5 text-[12px] text-center">
          {currentBeat + 1}
        </span>
      </div>

      {/* القسم الحالي */}
      {currentSection && (
        <div
          className="px-3 py-1 rounded-lg text-[10px] font-black flex-shrink-0"
          style={{
            backgroundColor: currentSection.color + "25",
            color: currentSection.color,
            border: `1px solid ${currentSection.color}40`,
          }}
        >
          {currentSection.label}
        </div>
      )}

      {/* شريط التقدم */}
      <div
        className="flex-1 h-3 bg-white/[0.06] rounded-full relative cursor-pointer
          group overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          // RTL: اليمين = البداية
          const ratio = 1 - (e.clientX - rect.left) / rect.width;
          actions.seekTo(ratio * duration);
        }}
      >
        {/* أقسام البيت في شريط التقدم */}
        {beatGrid?.sections.map((section) => (
          <div
            key={section.id}
            className="absolute inset-y-0 opacity-20"
            style={{
              right: `${(section.startTime / duration) * 100}%`,
              width: `${((section.endTime - section.startTime) / duration) * 100}%`,
              backgroundColor: section.color,
            }}
          />
        ))}
        {/* التقدم */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-amber-400 rounded-full"
          style={{ right: `${(1 - progress) * 100}%`, left: 0 }}
        />
        {/* رأس التشغيل */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white
            rounded-full shadow-lg border-2 border-amber-400 opacity-0
            group-hover:opacity-100 transition-opacity"
          style={{ right: `${(1 - progress) * 100}%`, transform: "translate(50%, -50%)" }}
        />
      </div>

      {/* مستوى الصوت الرئيسي */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm text-white/50">🔊</span>
        <div className="relative w-28 h-2 bg-white/10 rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-white/60 rounded-full"
            style={{ width: `${masterVolume}%` }}
          />
          <input
            type="range"
            min={0} max={100}
            value={masterVolume}
            onChange={(e) => {
              const vol = Number(e.target.value);
              useBeatWriterStore.setState({ masterVolume: vol });
              audioEngine.setMasterVolume(vol);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </div>
        <span className="text-xs font-mono font-bold text-white/40 w-8">{masterVolume}%</span>
      </div>

      {/* مؤشر حالة الصوت */}
      <div
        className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
          audioContextReady ? "bg-emerald-400 shadow-[0_0_8px_#10B981]" : "bg-white/20"
        }`}
        title={audioContextReady ? "محرك الصوت جاهز" : "اضغط تشغيل لتفعيل الصوت"}
      />
    </div>
  );
};

// استيراد audioEngine للاستخدام في PlaybackBar
import { audioEngine } from "../../store/beatWriterStore";
