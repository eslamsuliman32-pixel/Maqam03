"use client";

import React, { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useMaqamFlowStore,
  SuggestionResult,
  EmotionMode,
} from "../../store/maqamFlowLabStore";

// ════════════════════════════════════════════════════
//              EMOTION CONFIG
// ════════════════════════════════════════════════════

const EMOTION_CONFIG: Record<
  EmotionMode,
  { label: string; icon: string; color: string }
> = {
  aggressive: { label: "عدواني", icon: "🔥", color: "red" },
  sad: { label: "حزين", icon: "🌙", color: "blue" },
  cinematic: { label: "سينمائي", icon: "🎬", color: "purple" },
  triumphant: { label: "انتصاري", icon: "👑", color: "amber" },
  neutral: { label: "محايد", icon: "⚡", color: "zinc" },
};

// ════════════════════════════════════════════════════
//              SUGGESTION PANEL COMPONENT
// ════════════════════════════════════════════════════

export const SuggestionPanel: React.FC = () => {
  const {
    suggestions,
    emotionMode,
    analysisResult,
    isAnalyzing,
    actions,
  } = useMaqamFlowStore();

  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      if (filter === "high") return s.relevanceScore >= 0.8;
      if (filter === "medium") return s.relevanceScore >= 0.6 && s.relevanceScore < 0.8;
      return true;
    });
  }, [suggestions, filter]);

  const handleSelect = (result: SuggestionResult) => {
    const vp = useMaqamFlowStore.getState().canvasViewport;
    actions.addCell({
      startTime: vp.startTime + 0.5,
      duration: 0.8,
      text: result.bar.words,
      type: "word",
      intensity: result.bar.intensity,
      emotion: result.bar.emotionTag,
      isAnchored: true,
    });
  };

  return (
    <div className="
      bg-[#0c0c18] border border-white/5 rounded-2xl
      flex flex-col overflow-hidden h-full text-right
    " dir="rtl">
      {/* ── الرأس ── */}
      <div className="
        flex items-center justify-between
        px-4 py-3 border-b border-white/5
        bg-white/[0.02] flex-shrink-0
      ">
        <div className="flex items-center gap-2">
          <span className="text-base text-gold-400">🧠</span>
          <div>
            <h3 className="text-xs font-black text-white/80">
              مساعد رصف الأبيات العصبي
            </h3>
            <p className="text-[10px] text-white/30">Neural Placement Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={actions.generateSuggestions}
            disabled={!analysisResult || isAnalyzing}
            className="
              px-2.5 py-1 rounded-lg text-[10px] font-bold
              bg-amber-500/10 border border-amber-500/20
              text-amber-400 hover:bg-amber-500/20
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all cursor-pointer
            "
          >
            توليد الاقتراحات
          </button>
        </div>
      </div>

      {/* ── اختيار المشاعر ── */}
      <EmotionSelector
        current={emotionMode}
        onChange={actions.setEmotionMode}
      />

      {/* ── فلتر الجودة ── */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/5">
        {(["all", "high", "medium"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              flex-1 py-1 rounded-lg text-[10px] font-bold
              transition-all duration-150 cursor-pointer
              ${
                filter === f
                  ? "bg-white/10 text-white/80"
                  : "text-white/25 hover:text-white/50"
              }
            `}
          >
            {f === "all" ? "الكل" : f === "high" ? "مطابقة +80%" : "مطابقة 60-80%"}
          </button>
        ))}
      </div>

      {/* ── قائمة الاقتراحات ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((result, idx) => (
              <motion.div
                key={result.bar.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
              >
                <SuggestionCard result={result} onSelect={handleSelect} />
              </motion.div>
            ))
          ) : (
            <EmptySuggestions hasAnalysis={!!analysisResult} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
//              EMOTION SELECTOR
// ════════════════════════════════════════════════════

const EmotionSelector: React.FC<{
  current: EmotionMode;
  onChange: (mode: EmotionMode) => void;
}> = ({ current, onChange }) => (
  <div className="flex gap-1.5 p-2 bg-black/20 border-b border-white/5 overflow-x-auto scrollbar-none">
    {(Object.keys(EMOTION_CONFIG) as EmotionMode[]).map((mode) => {
      const cfg = EMOTION_CONFIG[mode];
      const isSelected = current === mode;
      
      return (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`
            flex items-center gap-1.5 px-3 py-1 rounded-full
            text-[10px] font-bold whitespace-nowrap flex-shrink-0
            transition-all duration-150 cursor-pointer border
            ${
              isSelected
                ? `bg-amber-400/20 border-amber-400/55 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.15)]`
                : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }
          `}
        >
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </button>
      );
    })}
  </div>
);

// ════════════════════════════════════════════════════
//              SUGGESTION CARD
// ════════════════════════════════════════════════════

interface CardProps {
  result: SuggestionResult;
  onSelect: (result: SuggestionResult) => void;
}

const SuggestionCard = memo(function SuggestionCard({
  result,
  onSelect,
}: CardProps) {
  const { bar, relevanceScore, matchReason, emotionAlign, rhythmAlign } =
    result;

  // تحويل النسبة إلى تقييم من 10 (مثال: المطابقة: 8.5/10)
  const scoreOutOf10 = (relevanceScore * 10).toFixed(1);
  const pct = Math.round(relevanceScore * 100);

  const scoreColor =
    pct >= 85
      ? "text-emerald-400"
      : pct >= 70
      ? "text-amber-400"
      : "text-orange-400";

  const emotionCfg = EMOTION_CONFIG[bar.emotionTag] || EMOTION_CONFIG.neutral;

  return (
    <div className="
      group p-3 rounded-xl border border-white/[0.04]
      bg-white/[0.02] hover:bg-white/[0.04]
      hover:border-white/10
      transition-all duration-200 space-y-2.5
    ">
      {/* نص البار */}
      <p className="text-xs text-white/85 leading-relaxed font-bold">
        {bar.words || (
          <span className="text-white/20 italic">بار فارغ</span>
        )}
      </p>

      {/* معلومات التوافق */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* نسبة المطابقة الكلية */}
        <ScoreBadge
          label={`المطابقة: ${scoreOutOf10}/10`}
          sublabel={`${pct}%`}
          colorClass={scoreColor}
        />

        {/* التوافق العاطفي */}
        <MiniScoreBadge
          icon={emotionCfg.icon}
          label={`${Math.round(emotionAlign * 100)}%`}
          title="التوافق العاطفي"
        />

        {/* التوافق الإيقاعي */}
        <MiniScoreBadge
          icon="🎵"
          label={`${Math.round(rhythmAlign * 100)}%`}
          title="التوافق الإيقاعي"
        />

        {/* سبب المطابقة */}
        <span className="
          text-[9px] text-white/30 mr-right truncate max-w-[120px]
        ">
          {matchReason}
        </span>
      </div>

      {/* شريط المطابقة البصري */}
      <RelevanceBar score={relevanceScore} />

      {/* زر الإدراج */}
      <button
        onClick={() => onSelect(result)}
        className="
          w-full py-1.5 rounded-lg text-[10px] font-bold
          bg-emerald-600/10 border border-emerald-500/20
          text-emerald-400 hover:bg-emerald-600/20
          opacity-0 group-hover:opacity-100
          transition-all duration-150 cursor-pointer
        "
      >
        ⬇ إدراج في المنحنى اللحني والتفاعلي
      </button>
    </div>
  );
});

const ScoreBadge: React.FC<{
  label: string;
  sublabel: string;
  colorClass: string;
}> = ({ label, sublabel, colorClass }) => (
  <div className="
    flex items-center gap-1 px-2 py-0.5 rounded-lg
    bg-white/[0.04] border border-white/5
  ">
    <span className={`text-[10px] font-black ${colorClass}`}>
      {label}
    </span>
    <span className="text-[9px] text-white/20 font-mono">({sublabel})</span>
  </div>
);

const MiniScoreBadge: React.FC<{
  icon: string;
  label: string;
  title: string;
}> = ({ icon, label, title }) => (
  <div
    title={title}
    className="
      flex items-center gap-1 px-1.5 py-0.5 rounded-md
      bg-white/[0.03] border border-white/5
    "
  >
    <span className="text-[9px]">{icon}</span>
    <span className="text-[9px] font-bold text-white/40">{label}</span>
  </div>
);

const RelevanceBar: React.FC<{ score: number }> = ({ score }) => (
  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${score * 100}%` }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full rounded-full"
      style={{
        background:
          score >= 0.85
            ? "linear-gradient(90deg, #10b981, #34d399)"
            : score >= 0.7
            ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
            : "linear-gradient(90deg, #f97316, #fb923c)",
      }}
    />
  </div>
);

const EmptySuggestions: React.FC<{ hasAnalysis: boolean }> = ({
  hasAnalysis,
}) => (
  <div className="py-8 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/5">
    <div className="text-3xl mb-2 opacity-20">🔍</div>
    <p className="text-xs text-white/40">
      {hasAnalysis
        ? "أضف بضعة بارات لتوليد الاقتراحات والمطابقات العصبية تلقائياً"
        : "شغّل اختبار وتحليل المقامات لاستقبال البيانات"}
    </p>
  </div>
);
