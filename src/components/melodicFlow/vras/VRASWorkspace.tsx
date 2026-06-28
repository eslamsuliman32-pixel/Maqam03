"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVRASStore } from "../../../store/vrasStore";
import { useRepositoryStore } from "../../../store/repositoryStore";
import { repositoryBarsToTextBars } from "../../../services/vrasBarConverter";
import { AudioUploadZone } from "./AudioUploadZone";
import { BeatVisualizer } from "./BeatVisualizer";
import { SectionGrid } from "./SectionGrid";
import { AudioPlayerPanel } from "./AudioPlayerPanel";
import { AIAdvisorPanel } from "./AIAdvisorPanel";
import { BarDatabasePanel } from "./BarDatabasePanel";
import { SessionStatsBar } from "./SessionStatsBar";

export const VRASWorkspace: React.FC = () => {
  const { phase, isAnalyzing, analysisProgress, beatAnalysis, sessionStats, actions } =
    useVRASStore();

  // ── مزامنة المستودع الرئيسي مع قاعدة بيانات VRAS ──
  const repoBars = useRepositoryStore((s) => s.bars);
  const lastCountRef = useRef<number>(-1);

  useEffect(() => {
    if (repoBars.length === lastCountRef.current) return;
    lastCountRef.current = repoBars.length;
    const converted = repositoryBarsToTextBars(repoBars);
    if (converted.length > 0) {
      actions.loadBarDatabase(converted);
    }
  }, [repoBars, actions]);

  return (
    <div
      className="w-full h-[calc(100vh-140px)] bg-[#04060e] text-white flex flex-col overflow-hidden font-['Cairo','Tajawal',sans-serif]"
      dir="rtl"
    >
      {/* ── شريط العنوان العلوي ── */}
      <WorkspaceHeader stats={sessionStats} />

      <AnimatePresence mode="wait">
        {phase === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
          >
            <AudioUploadZone />
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <AnalyzingScreen progress={analysisProgress} />
          </motion.div>
        )}

        {(phase === "ready" || phase === "composing") && beatAnalysis && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* ── شريط الإحصائيات ── */}
            <SessionStatsBar />

            {/* ── المشغّل الصوتي ── */}
            <AudioPlayerPanel />

            {/* ── منطقة العمل الرئيسية ── */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* الشريط الأيمن: قاعدة البيانات */}
              <aside className="w-72 flex-shrink-0 border-l border-white/5 overflow-hidden flex flex-col bg-[#070912]">
                <BarDatabasePanel />
              </aside>

              {/* المنطقة المركزية: العارض البصري والشبكة */}
              <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#04060e]">
                <BeatVisualizer />
                <div className="flex-1 overflow-y-auto">
                  <SectionGrid />
                </div>
              </main>

              {/* الشريط الأيسر: المساعد الذكي */}
              <aside className="w-72 flex-shrink-0 border-r border-white/5 overflow-hidden flex flex-col bg-[#070912]">
                <AIAdvisorPanel />
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── رأس مساحة العمل ──
const WorkspaceHeader: React.FC<{ stats: any }> = ({ stats }) => {
  const { phase, actions } = useVRASStore();
  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-[#070912]/95 border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm">
          🎼
        </div>
        <div>
          <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-2 font-arabic">
            نظام التوافق البصري الإيقاعي
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold font-mono">
              VRAS v1.0
            </span>
          </h1>
          <p className="text-[9px] text-white/30 font-arabic">
            Visual-Rhythmic Alignment System · مطابقة البارات النصية بالبيت الموسيقي
          </p>
        </div>
      </div>

      {stats && (
        <div className="flex items-center gap-3">
          <ScoreBadge
            label="الفلو"
            value={`${stats.flowScore}/10`}
            good={stats.flowScore >= 7}
          />
          <ScoreBadge
            label="مكتمل"
            value={`${stats.filledSlots}/${stats.totalSlots}`}
            good={stats.filledSlots === stats.totalSlots}
          />
          {stats.readyForRecording && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold font-arabic"
            >
              ✓ جاهز للتسجيل
            </motion.span>
          )}
        </div>
      )}

      {phase !== "upload" && (
        <button
          onClick={actions.resetSession}
          className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer font-arabic"
        >
          جلسة جديدة
        </button>
      )}
    </header>
  );
};

const ScoreBadge: React.FC<{ label: string; value: string; good: boolean }> = ({
  label, value, good,
}) => (
  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 font-arabic">
    <span className="text-white/30">{label}:</span>
    <span className={`text-sm font-black font-mono ${good ? "text-emerald-400" : "text-amber-400"}`}>
      {value}
    </span>
  </div>
);

const AnalyzingScreen: React.FC<{ progress: number }> = ({ progress }) => {
  const [currentMessage, setCurrentMessage] = React.useState("فحص BPM والإيقاع...");

  useEffect(() => {
    if (progress >= 90) {
      setCurrentMessage("بناء الشبكة الإيقاعية...");
    } else if (progress >= 75) {
      setCurrentMessage("تحليل المقامات...");
    } else if (progress >= 55) {
      setCurrentMessage("تحديد أقسام البيت...");
    } else if (progress >= 35) {
      setCurrentMessage("رسم خريطة الطاقة...");
    } else if (progress >= 15) {
      setCurrentMessage("فحص BPM والإيقاع...");
    }
  }, [progress]);

  return (
    <div className="text-center space-y-6 max-w-md font-arabic">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-2xl"
        >
          ⟳
        </motion.span>
      </div>
      <div>
        <h2 className="text-xl font-black text-white mb-2 font-arabic">جاري التحليل الموسيقي...</h2>
        <p className="text-sm text-white/40 font-arabic">
          {currentMessage}
        </p>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-xs text-amber-400 font-mono font-bold">{progress}%</p>
      </div>
    </div>
  );
};
