"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";
import { useMaqamFlowStore, AnalysisResult } from "../../store/maqamFlowLabStore";
import { MelodicCanvas } from "./MelodicCanvas";
import { LeadIsolator } from "./LeadIsolator";
import { SuggestionPanel } from "./SuggestionPanel";
import {
  ScatTemplateBuilder,
  FlowEvaluationDashboard,
} from "./ScatTemplateBuilder";

// ════════════════════════════════════════════════════
//              MAIN LAYOUT COMPONENT
// ════════════════════════════════════════════════════

export const MaqamFlowLabElite: React.FC = () => {
  const {
    analysisResult,
    isAnalyzing,
    flowBars,
    evaluation,
    actions,
  } = useMaqamFlowStore();

  // تحديث التقييم والاقتراحات تلقائياً عند تحميل الصفحة أو تبديل البارات
  useEffect(() => {
    actions.generateSuggestions();
    actions.evaluateFlow();
  }, [flowBars.length, actions]);

  return (
    <div
      className="
        w-full bg-[#05070d]
        font-['Cairo','Tajawal',sans-serif]
        text-white selection:bg-amber-500/20
        flex flex-col h-[calc(100vh-80px)] overflow-hidden
      "
      dir="rtl"
    >
      {/* ── الهيدر الرئيسي ── */}
      <EliteHeader
        isAnalyzing={isAnalyzing}
        hasAnalysis={!!analysisResult}
        flowScore={evaluation?.overallScore}
        onAnalyze={actions.runAnalysis}
        onReset={actions.resetSession}
      />

      {/* ── شريط الحالة الشاملة ── */}
      {analysisResult && (
        <AnalysisStatusBar analysisResult={analysisResult} />
      )}

      {/* ── التخطيط الرئيسي ── */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#05070d]">

        {/* ── الشريط الجانبي الأيمن: أدوات عزل الصوت وقوالب الدندنة ── */}
        <aside className="
          w-72 flex-shrink-0 border-l border-white/5
          overflow-y-auto bg-black/10
          flex flex-col gap-4 p-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent
        ">
          <LeadIsolator />
          <ScatTemplateBuilder />
        </aside>

        {/* ── منطقة القماش الرئيسية: ويف فورم والمنحنى التفاعلي ── */}
        <main className="flex-1 flex flex-col p-4 min-w-0 overflow-hidden bg-[#030408]">
          <div className="flex-1 min-h-0 relative">
            <MelodicCanvas />
          </div>
        </main>

        {/* ── الشريط الجانبي الأيسر: المساعد العصبي وهندسة المقامات العكسية ── */}
        <aside className="
          w-80 flex-shrink-0 border-r border-white/5
          overflow-y-auto bg-black/10
          flex flex-col gap-4 p-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent
        ">
          <SuggestionPanel />
          <FlowEvaluationDashboard />
        </aside>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
//              ELITE HEADER
// ════════════════════════════════════════════════════

const EliteHeader: React.FC<{
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  flowScore?: number;
  onAnalyze: () => void;
  onReset: () => void;
}> = ({ isAnalyzing, hasAnalysis, flowScore, onAnalyze, onReset }) => (
  <header className="
    h-16 flex-shrink-0
    flex items-center justify-between px-6
    bg-[#070912]/95 backdrop-blur-xl
    border-b border-white/[0.06]
  ">
    {/* الشعار */}
    <div className="flex items-center gap-3">
      <div className="
        w-9 h-9 rounded-xl
        bg-gradient-to-br from-amber-400 to-orange-500
        flex items-center justify-center text-sm
        shadow-lg shadow-amber-500/10
      ">
        🏛️
      </div>
      <div>
        <h1 className="text-sm font-black text-white tracking-wider flex items-center gap-2">
          مسار العمل اللحني (Melodic Action Board)
          <span className="
            text-[9px] px-1.5 py-0.5 rounded
            bg-amber-400/10 text-amber-300 font-bold
            border border-amber-400/20
          ">
            ELITE V2
          </span>
        </h1>
        <p className="text-[9px] text-white/30 font-medium">الهندسة اللحنية التفاعلية وتصفية الحنجرة ورصف الأبيات</p>
      </div>
    </div>

    {/* نتيجة الفلو الكبرى */}
    {flowScore !== undefined && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="
          flex items-center gap-2 px-4 py-1.5 rounded-xl
          bg-white/[0.03] border border-white/5
        "
      >
        <span className="text-[10px] text-white/40">المطابقة الكلية:</span>
        <span className={`
          text-xl font-black font-mono
          ${
            flowScore >= 8
              ? "text-emerald-400"
              : flowScore >= 6
              ? "text-amber-400"
              : "text-red-400"
          }
        `}>
          {flowScore}
        </span>
        <span className="text-xs text-white/20">/10</span>
      </motion.div>
    )}

    {/* أزرار التحكم */}
    <div className="flex items-center gap-2">
      {hasAnalysis && (
        <button
          onClick={onReset}
          className="
            px-3 py-1.5 rounded-lg text-xs font-bold
            text-white/40 hover:text-white/70 hover:bg-white/[0.04]
            transition-colors cursor-pointer
          "
        >
          إعادة ضبط
        </button>
      )}

      <motion.button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="
          flex items-center gap-2 px-4 py-2 rounded-xl
          bg-gradient-to-r from-amber-400 to-orange-500
          text-black text-xs font-black cursor-pointer
          shadow-lg shadow-amber-500/25
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
        "
      >
        {isAnalyzing ? (
          <>
            <span className="animate-spin text-sm">⟳</span>
            <span>جاري فحص المقامات...</span>
          </>
        ) : (
          <>
            <span>🔬</span>
            <span>{hasAnalysis ? "إعادة التحليل اللحني" : "تحليل المقام والمطابقة"}</span>
          </>
        )}
      </motion.button>
    </div>
  </header>
);

// ════════════════════════════════════════════════════
//              ANALYSIS STATUS BAR
// ════════════════════════════════════════════════════

const AnalysisStatusBar: React.FC<{
  analysisResult: AnalysisResult;
}> = ({ analysisResult }) => (
  <div className="
    h-10 flex-shrink-0
    flex items-center gap-4 px-6
    bg-amber-500/[0.03] border-b border-amber-500/10
    overflow-x-auto text-[10px] select-none
  ">
    <StatusChip label="المقام المرصود" value={analysisResult.maqamType} icon="🎼" />
    <StatusChip label="مؤشر الإيقاع BPM" value={`${analysisResult.bpm}`} icon="⏱️" />
    <StatusChip label="المفتاح (Key)" value={analysisResult.keySignature} icon="🎵" />
    <StatusChip
      label="الجاهزية للرصد"
      value={analysisResult.readyForPlacement ? "مكتملة وجاهزة" : "جاري المعاينة"}
      icon={analysisResult.readyForPlacement ? "✅" : "⚠️"}
      highlight={analysisResult.readyForPlacement}
    />
    <StatusChip
      label="الازدحام المقطعي الكلي"
      value={`${analysisResult.crowdingZones.length} منطقة`}
      icon="🔴"
    />
  </div>
);

const StatusChip: React.FC<{
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}> = ({ label, value, icon, highlight = false }) => (
  <div className="flex items-center gap-1.5 flex-shrink-0 bg-white/[0.02] border border-white/5 py-1 px-2.5 rounded-lg">
    <span>{icon}</span>
    <span className="text-white/30">{label}:</span>
    <span
      className={`font-black ${highlight ? "text-emerald-400" : "text-amber-300"}`}
    >
      {value}
    </span>
  </div>
);
