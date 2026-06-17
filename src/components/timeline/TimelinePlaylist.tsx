import React, { useEffect, useRef, useState, useMemo } from "react";
import { useBeatAnalysisStore } from "../../store/beatAnalysisStore";
import { useLyricsStore } from "../../store/lyricsStore";
import { useAlignmentStore } from "../../store/alignmentStore";
import { useRepositoryStore, repoSelectors } from "../../store/repositoryStore";
import { useTimelineViewport } from "./useTimelineViewport";
import { useSectionRenderItems } from "./useSectionRenderItems";
import { BeatGridCanvas } from "./BeatGridCanvas";
import { EnergyOverlayCanvas } from "./EnergyOverlayCanvas";
import { SyllableLane } from "./SyllableLane";
import { SectionLane } from "./SectionLane";

// Playback and History Imports
import { usePlaybackStore } from "../../store/playbackStore";
import { PlaybackEngine } from "./PlaybackEngine";
import { PlayheadOverlay } from "./PlayheadOverlay";
import { useHistoryStore } from "../../store/historyStore";
import { useHistoryShortcuts } from "../../hooks/useHistoryShortcuts";
import {
  exportProjectFile,
  exportLyricsText,
  exportFlowReport,
  importProjectFile,
} from "../../services/projectExport";

import {
  Play,
  Pause,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Upload,
  FileText,
  TrendingUp,
  Infinity as LoopIcon,
  XCircle,
} from "lucide-react";

const SECTION_HEIGHT = 28;
const LANE_HEIGHT = 56;
const ENERGY_HEIGHT = 80;
const TOTAL_HEIGHT = SECTION_HEIGHT + ENERGY_HEIGHT + LANE_HEIGHT + 10;

export const TimelinePlaylist = () => {
  // تفعيل اختصارات التراجع/الإعادة الكيبوردية تلقائياً Ctrl+Z & Ctrl+Shift+Z
  useHistoryShortcuts();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controls = useTimelineViewport(0.08);
  const { setWidth, scrollBy, setZoom, viewport, xToPpq } = controls;

  const beatGrid = useBeatAnalysisStore((s) => s.beatGrid);
  const energyFrames = useBeatAnalysisStore((s) => s.energyFrames);
  const syllablesMap = useLyricsStore((s) => s.syllables);
  const syllables = useMemo(() => Object.values(syllablesMap), [syllablesMap]);
  const lyricsWords = useLyricsStore((s) => s.words);
  const alignments = useAlignmentStore((s) => s.alignments);
  const flowDensity = useAlignmentStore((s) => s.flowDensity);

  // حالة التراجع والإعادة واللقطات
  const { past, future, undo, redo } = useHistoryStore();

  // حالة التشغيل والعازف الافتراضي المحكم
  const { isPlaying, currentPPQ, currentSec, loopStartPPQ, loopEndPPQ, setLoop } = usePlaybackStore();
  const playbackEngineRef = useRef<PlaybackEngine | null>(null);

  // مسار الأقسام
  const sectionItems = useSectionRenderItems();
  const activeSectionId = useRepositoryStore((s) => {
    const bar = s.activeBarId ? s.playlistBars[s.activeBarId] : null;
    if (!bar) return null;
    return Object.values(s.sections).find((sec) => sec.barIds.includes(bar.id))?.id ?? null;
  });

  // البار الحاسم الذي يتم المرور فوقه حالياً بواسطة مؤشر النبضات
  const playlistBars = useRepositoryStore((s) => s.playlistBars);
  const activeBarUnderPlayhead = useMemo(() => {
    return Object.values(playlistBars).find(
      (b) => currentPPQ >= b.startPPQ && currentPPQ < b.endPPQ
    ) ?? null;
  }, [playlistBars, currentPPQ]);
  const activeBarText = activeBarUnderPlayhead
    ? activeBarUnderPlayhead.wordIds
        .map((wid) => lyricsWords[wid]?.text ?? "")
        .filter(Boolean)
        .join(" ") || `البار ${activeBarUnderPlayhead.barNumber}`
    : "";

  // تأسيس محرك التوقيت وربطه بـ RequestAnimationFrame
  useEffect(() => {
    playbackEngineRef.current = new PlaybackEngine();
    return () => {
      playbackEngineRef.current?.destroy();
    };
  }, []);

  // التحكم ببدء / إيقاف التشغيل
  const handleTogglePlay = () => {
    if (!playbackEngineRef.current) return;
    if (isPlaying) {
      playbackEngineRef.current.pause();
    } else {
      playbackEngineRef.current.play();
    }
  };

  // التحكم بإرجاع المؤشر وإعادة التشغيل من الصفر
  const handleStopReset = () => {
    if (!playbackEngineRef.current) return;
    playbackEngineRef.current.seekToPPQ(0);
    playbackEngineRef.current.pause();
  };

  // تعيين نقاط التكرار Loop بالاعتماد على الموضع الحالي
  const handleSetLoopStart = () => {
    setLoop(currentPPQ, loopEndPPQ);
  };

  const handleSetLoopEnd = () => {
    if (loopStartPPQ !== null && currentPPQ > loopStartPPQ) {
      setLoop(loopStartPPQ, currentPPQ);
    } else {
      setLoop(0, currentPPQ);
    }
  };

  const handleClearLoop = () => {
    setLoop(null, null);
  };

  // التحكم في تصفح واستيراد المشاريع
  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importProjectFile(file);
    } catch (err) {
      console.error("فشل استيراد ملف المشروع المعطى:", err);
    }
  };

  // النقر على قسم -> تفعيل أول بار فيه والذهاب لبدايته
  const handleSectionClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ppq = xToPpq(e.clientX - rect.left);
    const hit = sectionItems.find((it) => ppq >= it.startPPQ && ppq <= it.endPPQ);
    if (hit) {
      if (hit.section.barIds[0]) {
        useRepositoryStore.getState().setActiveBar(hit.section.barIds[0]);
      }
      playbackEngineRef.current?.seekToPPQ(hit.startPPQ);
    }
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setWidth]);

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      setZoom(viewport.pixelsPerPPQ * (e.deltaY < 0 ? 1.1 : 0.9));
    } else {
      scrollBy(e.deltaY * 4);
    }
  };

  // استماع لزر Space لتشغيله/إيقافه مباشرة
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  return (
    <div className="w-full flex flex-col gap-4 bg-[#0a0a0f] border border-white/5 rounded-2xl p-5 shadow-2xl relative select-none">
      
      {/* الـ Transport Bar العلوي المتكامل للـ DAW */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
        
        {/* أزرار مشغّل التراك والتحكم بالتشغيل والزمن */}
        <div className="flex items-center gap-3 bg-void/60 px-4 py-2 rounded-xl border border-white/5">
          <button
            onClick={handleTogglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-gold-400 hover:bg-gold-500 text-black font-bold"
            }`}
          >
            {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} className="translate-x-[1px]" fill="currentColor" />}
          </button>
          
          <button
            onClick={handleStopReset}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10"
            title="تصفير المشغّل والعودة للبداية"
          >
            <RotateCcw size={14} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* لوحة استعراض الوقت الحركي الحقيقي */}
          <div className="font-mono text-[11px] text-right">
            <span className="text-white/40 block text-[9px] uppercase tracking-wider">موضع القارئ</span>
            <span className="text-gold-400 font-bold tabular-nums">
              {currentSec.toFixed(2)}s <span className="text-white/30">|</span> {Math.round(currentPPQ)} PPQ
            </span>
          </div>
        </div>

        {/* أزرار التكرار الذكي (Loop Points) */}
        <div className="flex items-center gap-2 bg-void/40 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-white/40 font-bold uppercase mr-1">الحلقة التكرارية:</span>
          <button
            onClick={handleSetLoopStart}
            className="px-2.5 py-1 text-[10px] font-bold rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            title="تعيين النبضة الحالية كبداية للحلقة"
          >
            بداية الـ Loop
          </button>
          <button
            onClick={handleSetLoopEnd}
            className="px-2.5 py-1 text-[10px] font-bold rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            title="تعيين النبضة الحالية كنهاية للحلقة"
          >
            نهاية الـ Loop
          </button>
          
          {loopStartPPQ !== null && (
            <div className="flex items-center gap-2 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-[9px] font-mono">
              <LoopIcon size={10} />
              <span>{Math.round(loopStartPPQ)}-{loopEndPPQ !== null ? Math.round(loopEndPPQ) : "∞"}</span>
              <button onClick={handleClearLoop} className="hover:text-red-400">
                <XCircle size={11} />
              </button>
            </div>
          )}
        </div>

        {/* كبسولات التراجع والإعادة (Undo/Redo System) مع العداد */}
        <div className="flex items-center gap-2 bg-void/40 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-white/40 font-bold uppercase mr-1">سجل التغييرات:</span>
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="px-3 py-1 text-[10px] font-bold rounded flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40"
            title="Ctrl+Z للتراجع"
          >
            <Undo2 size={12} />
            <span>تراجع ({past.length})</span>
          </button>
          
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="px-3 py-1 text-[10px] font-bold rounded flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-40"
            title="Ctrl+Shift+Z للإعادة"
          >
            <Redo2 size={12} />
            <span>إعادة ({future.length})</span>
          </button>
        </div>

        {/* عمليات الحفظ والتصدير والاستيراد الفوري الصرفة */}
        <div className="flex items-center gap-2 bg-void/40 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-white/40 font-bold uppercase mr-1">المشروع:</span>
          
          {/* استيراد */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            style={{ display: "none" }}
          />
          <button
            onClick={handleTriggerImport}
            className="px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/10"
            title="استيراد مشروع .maqam.json سابق"
          >
            <Upload size={12} />
            <span>استيراد</span>
          </button>

          {/* تصدير مشروع */}
          <button
            onClick={() => exportProjectFile(activeBarText ? "maqam-track" : "project")}
            className="px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 border border-gold-400/10"
            title="تحميل كابل بيانات المشروع كملف JSON"
          >
            <Download size={12} />
            <span>مشروع (.json)</span>
          </button>

          {/* تصدير الكلمات */}
          <button
            onClick={() => exportLyricsText("vocals")}
            className="px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white border border-white/10"
            title="حفظ الملف النصي الكامل للكلمات"
          >
            <FileText size={12} />
            <span>كلمات (.txt)</span>
          </button>

          {/* تقرير التدفق المتقدّم */}
          <button
            onClick={() => exportFlowReport("analysis-session")}
            className="px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10"
            title="استخراج تقرير أداء الفلو المطور بالتفصيل"
          >
            <TrendingUp size={12} />
            <span>تقرير (.md)</span>
          </button>
        </div>

      </div>

      {/* لوحة مراقبة الـ HUD للبار المفعل حالياً أسفل المؤشر */}
      {activeBarUnderPlayhead && (
        <div className="bg-[#15151c]/70 border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs mb-1 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white/40">البار النشط عروضياً:</span>
            <span className="text-white font-bold">{activeBarText}</span>
          </div>
          <div className="font-mono text-[10px] text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded">
            رقم البار: {activeBarUnderPlayhead.barNumber} | من {activeBarUnderPlayhead.startPPQ} إلى {activeBarUnderPlayhead.endPPQ} PPQ
          </div>
        </div>
      )}

      {/* منطقة القنوات والشبكة الإيقاعية المتداخلة */}
      <div
        ref={wrapperRef}
        onWheel={onWheel}
        className="relative"
        style={{ width: "100%", overflow: "hidden", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}
      >
        
        {/* مسار الأقسام (Clips ملوّنة) - الأعلى */}
        <div
          onClick={handleSectionClick}
          style={{ position: "relative", height: SECTION_HEIGHT, cursor: "pointer", marginBottom: 2 }}
        >
          <SectionLane
            items={sectionItems}
            activeSectionId={activeSectionId}
            controls={controls}
            height={SECTION_HEIGHT}
          />
        </div>

        {/* مسار طاقة البيت + التدفق (متراكبان) */}
        <div style={{ position: "relative", height: ENERGY_HEIGHT }}>
          <BeatGridCanvas grid={beatGrid} controls={controls} height={ENERGY_HEIGHT} />
          <EnergyOverlayCanvas
            audioEnergy={energyFrames}
            flowDensity={flowDensity}
            controls={controls}
            height={ENERGY_HEIGHT}
          />
        </div>

        {/* مسار المقاطع اللفظية فوق نفس الشبكة */}
        <div style={{ position: "relative", height: LANE_HEIGHT, marginTop: 2 }}>
          <BeatGridCanvas grid={beatGrid} controls={controls} height={LANE_HEIGHT} />
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            <SyllableLane
              syllables={syllables}
              alignments={alignments}
              controls={controls}
              height={LANE_HEIGHT}
            />
          </div>
        </div>

        {/* مؤشر القراءة المتزامن المباشر والجميل (Playhead Line overlay) */}
        <PlayheadOverlay controls={controls} totalHeight={TOTAL_HEIGHT} />

      </div>

      <div className="flex items-center justify-between text-[10px] text-white/20 font-mono px-1">
        <span>تلميح تفاعلي: للتصفح الأفقي استخدم الماوس، للتكبير أو التصغير اضغط Ctrl + Wheel</span>
        <span>دقة المشروع العروضية: دقة PPQ 960 عالية الدقة</span>
      </div>

    </div>
  );
};
