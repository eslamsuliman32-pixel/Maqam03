"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  useMaqamFlowStore,
  SCAT_TEMPLATES,
  ScatTemplate,
  FlowEvaluation,
} from "../../store/maqamFlowLabStore";

// ════════════════════════════════════════════════════
//              SCAT TEMPLATE BUILDER
// ════════════════════════════════════════════════════

export const ScatTemplateBuilder: React.FC = () => {
  const { actions } = useMaqamFlowStore();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const tempoColors: Record<string, string> = {
    slow: "sky",
    medium: "gold",
    fast: "red",
  };

  const tempoLabels: Record<string, string> = {
    slow: "بطيء",
    medium: "متوسط",
    fast: "سريع",
  };

  const handleApply = (template: ScatTemplate) => {
    setActiveTemplate(template.id);
    actions.applyScatTemplate(template);
    setTimeout(() => setActiveTemplate(null), 1500);
  };

  return (
    <div className="
      bg-[#0c0c18] border border-white/5 rounded-2xl overflow-hidden text-right
    " dir="rtl">
      {/* ── الرأس ── */}
      <div className="
        flex items-center gap-2 px-4 py-3
        border-b border-white/5 bg-white/[0.02]
      ">
        <span className="text-base text-gold-400">🎤</span>
        <div>
          <h3 className="text-xs font-black text-white/80">
            قوالب الدندنة والـ Scat
          </h3>
          <p className="text-[10px] text-white/30">Phonetic Templates</p>
        </div>
      </div>

      {/* ── القوالب ── */}
      <div className="p-3 space-y-2">
        {SCAT_TEMPLATES.map((template, idx) => {
          const isApplying = activeTemplate === template.id;
          const color = tempoColors[template.tempo] || "gold";

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`
                p-3 rounded-xl border transition-all duration-200
                ${
                  isApplying
                    ? `border-amber-400/40 bg-amber-400/5`
                    : "border-white/[0.04] bg-white/[0.02] hover:border-white/10"
                }
              `}
            >
              {/* رأس القالب */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`
                    text-[9px] font-black px-1.5 py-0.5 rounded
                    bg-amber-400/10 text-amber-300
                    border border-amber-400/20
                  `}>
                    {tempoLabels[template.tempo]}
                  </span>
                  <span className="text-xs font-bold text-white/80">
                    {template.title}
                  </span>
                </div>
              </div>

              {/* المقاطع الصوتية */}
              <div className="flex items-center gap-1.5 mb-2">
                {template.syllables.map((s, i) => (
                  <SyllablePill
                    key={i}
                    syllable={s}
                    index={i}
                    color={color}
                    isAnimating={isApplying}
                  />
                ))}
              </div>

              {/* الوصف */}
              <p className="text-[10px] text-white/40 mb-2.5">
                {template.description}
              </p>

              {/* زر التطبيق */}
              <button
                onClick={() => handleApply(template)}
                disabled={isApplying}
                className={`
                  w-full py-1.5 rounded-lg text-[10px] font-bold
                  transition-all duration-200 cursor-pointer
                  ${
                    isApplying
                      ? `bg-amber-400/20 text-amber-300 cursor-wait`
                      : `
                        bg-white/[0.04] text-white/50
                        hover:bg-white/[0.08] hover:text-white/80
                        border border-white/5
                      `
                  }
                `}
              >
                {isApplying ? "✓ تم زرع المقاطع على القماش" : "⬇ تطبيق القالب النغامي"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const SyllablePill: React.FC<{
  syllable: string;
  index: number;
  color: string;
  isAnimating: boolean;
}> = ({ syllable, index, color, isAnimating }) => (
  <motion.div
    animate={
      isAnimating
        ? { scale: [1, 1.15, 1], y: [0, -3, 0] }
        : {}
    }
    transition={{ delay: index * 0.1, duration: 0.3 }}
    className="
      px-2.5 py-1 rounded-lg text-[11px] font-black
      bg-white/[0.04] border border-white/5
      text-amber-400 font-mono
    "
  >
    {syllable}
  </motion.div>
);

// ════════════════════════════════════════════════════
//           FLOW EVALUATION DASHBOARD
// ════════════════════════════════════════════════════

export const FlowEvaluationDashboard: React.FC = () => {
  const {
    evaluation,
    flowBars,
    syllableCacheReady,
    isProcessingCache,
    reverseEngineering,
    analysisResult,
    actions,
  } = useMaqamFlowStore();

  const engineStatus = {
    syllableCache: syllableCacheReady,
    reverseEngineering: reverseEngineering,
    motionPatterns: !!analysisResult?.reverseEngineeredPatterns?.length,
    readyForPlacement: analysisResult?.readyForPlacement ?? false,
  };

  return (
    <div className="
      bg-[#0c0c18] border border-white/5 rounded-2xl overflow-hidden text-right
    " dir="rtl">
      {/* ── الرأس ── */}
      <div className="
        flex items-center justify-between
        px-4 py-3 border-b border-white/5 bg-white/[0.02]
      ">
        <div className="flex items-center gap-2">
          <span className="text-base text-gold-400">📊</span>
          <div>
            <h3 className="text-xs font-black text-white/80">هندسة المقامات العكسية</h3>
            <p className="text-[10px] text-white/30">Mora Reverse Decimator</p>
          </div>
        </div>

        <button
          onClick={actions.evaluateFlow}
          disabled={flowBars.length === 0}
          className="
            px-2.5 py-1 rounded-lg text-[10px] font-bold
            bg-purple-500/10 border border-purple-500/20
            text-purple-400 hover:bg-purple-500/20
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all cursor-pointer
          "
        >
          رصد وتقييم
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* ── حالة المحرك ── */}
        <EngineStatusPanel
          status={engineStatus}
          isProcessingCache={isProcessingCache}
          reverseEngineering={reverseEngineering}
          patterns={analysisResult?.reverseEngineeredPatterns}
          onRunReverseEngineering={actions.runReverseEngineering}
        />

        {/* ── نتائج التقييم ── */}
        {evaluation ? (
          <EvaluationResults evaluation={evaluation} />
        ) : (
          <EmptyEvaluation hasBars={flowBars.length > 0} />
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
//           ENGINE STATUS PANEL
// ════════════════════════════════════════════════════

const EngineStatusPanel: React.FC<{
  status: {
    syllableCache: boolean;
    reverseEngineering: boolean;
    motionPatterns: boolean;
    readyForPlacement: boolean;
  };
  isProcessingCache: boolean;
  reverseEngineering: boolean;
  patterns?: string[];
  onRunReverseEngineering: () => void;
}> = ({
  status,
  isProcessingCache,
  reverseEngineering,
  patterns,
  onRunReverseEngineering,
}) => {
  const statusItems = [
    {
      key: "syllableCache" as const,
      label: "حالة الكاش المقطعي",
      icon: "💾",
      loading: isProcessingCache,
      active: status.syllableCache,
    },
    {
      key: "reverseEngineering" as const,
      label: "هندسة عكسية مفعلة",
      icon: "⚙️",
      loading: reverseEngineering,
      active: status.reverseEngineering,
    },
    {
      key: "motionPatterns" as const,
      label: "إعادة استخراج الحركة",
      icon: "📐",
      loading: false,
      active: status.motionPatterns,
    },
    {
      key: "readyForPlacement" as const,
      label: "جاهز للرصد والمطابقة",
      icon: "✅",
      loading: false,
      active: status.readyForPlacement,
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-wider">
          حالة المحرك والبلوريدم
        </h4>
        <button
          onClick={onRunReverseEngineering}
          disabled={reverseEngineering}
          className="
            text-[9px] font-bold text-purple-400 hover:text-purple-300
            transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
          "
        >
          {reverseEngineering ? "⟳ جاري الحساب..." : "تشغيل الهندسة العكسية"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {statusItems.map((item) => (
          <StatusIndicator
            key={item.key}
            icon={item.icon}
            label={item.label}
            isActive={item.active}
            isLoading={item.loading}
          />
        ))}
      </div>

      {/* أنماط الحركة المكتشفة */}
      {patterns && patterns.length > 0 && (
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
          <p className="text-[9px] text-white/40 font-bold">
            أنماط الحركة والهارموني المستخرجة:
          </p>
          {patterns.map((p, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[9px] text-purple-400 mt-0.5">◆</span>
              <p className="text-[9px] text-white/50">{p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusIndicator: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  isLoading: boolean;
}> = ({ icon, label, isActive, isLoading }) => (
  <div className={`
    flex items-center gap-1.5 px-2 py-1.5 rounded-lg
    border transition-all
    ${
      isActive
        ? "bg-emerald-500/5 border-emerald-500/20"
        : "bg-white/[0.02] border-white/5"
    }
  `}>
    <span className="text-[10px]">{icon}</span>
    <span className="text-[9px] text-white/50 flex-1 truncate">{label}</span>
    {isLoading ? (
      <span className="text-[9px] text-amber-400 animate-spin">⟳</span>
    ) : (
      <span className={`text-[9px] font-bold ${isActive ? "text-emerald-400" : "text-white/10"}`}>
        {isActive ? "ON" : "OFF"}
      </span>
    )}
  </div>
);

// ════════════════════════════════════════════════════
//           EVALUATION RESULTS
// ════════════════════════════════════════════════════

const EvaluationResults: React.FC<{ evaluation: FlowEvaluation }> = ({
  evaluation,
}) => {
  const metrics = [
    {
      key: "clarity",
      label: "وضوح الأداء",
      value: evaluation.clarity,
    },
    {
      key: "coherence",
      label: "التماسك اللحني",
      value: evaluation.coherence,
    },
    {
      key: "crowding",
      label: "ازدحام المقاطع",
      value: evaluation.crowding,
    },
    {
      key: "impact",
      label: "التأثير الطربي",
      value: evaluation.impact,
    },
  ];

  const scoreColor =
    evaluation.overallScore >= 8
      ? "text-emerald-400"
      : evaluation.overallScore >= 6
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="space-y-3">
      {/* النتيجة الكبرى */}
      <div className="
        flex items-center justify-center py-4
        bg-white/[0.02] rounded-xl border border-white/5
      ">
        <div className="text-center">
          <div className="text-[10px] text-white/30 mb-0.5">درجة التطابق والتقييم</div>
          <div className={`text-4xl font-black font-mono ${scoreColor}`}>
            {evaluation.overallScore}
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">/ 10</div>
          {evaluation.readyForRecording && (
            <div className="
              mt-2 flex items-center gap-1 justify-center
              text-[10px] text-emerald-400 font-bold
              bg-emerald-500/10 px-2 py-0.5 rounded-full
             font-bold
            ">
              <span>✓ جاهز للرصد والتسجيل</span>
            </div>
          )}
        </div>
      </div>

      {/* المقاييس التفصيلية */}
      <div className="space-y-2">
        {metrics.map((m) => {
          return (
            <MetricBar key={m.key} label={m.label} value={m.value} />
          );
        })}
      </div>

      {/* الملاحظات */}
      {evaluation.notes.length > 0 && (
        <div className="space-y-1 bg-black/20 p-2.5 rounded-lg border border-white/5">
          {evaluation.notes.map((note, i) => {
            const isOk = note.includes("جاهز") || note.includes("متوازن");
            const isBad = note.includes("ازدحام") || note.includes("شديد");
            return (
              <div
                key={i}
                className={`
                  flex items-start gap-1.5 text-[10px] leading-relaxed
                  ${
                    isOk
                      ? "text-emerald-400"
                      : isBad
                      ? "text-red-400"
                      : "text-amber-400"
                  }
                `}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {isOk ? "✓" : isBad ? "⚠" : "→"}
                </span>
                <span>{note}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MetricBar: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => {
  const color =
    value >= 75
      ? "#10b981"
      : value >= 55
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-white/40 w-16 text-right flex-shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span
        className="text-[10px] font-black font-mono w-8 text-left"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
};

const EmptyEvaluation: React.FC<{ hasBars: boolean }> = ({ hasBars }) => (
  <div className="py-6 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/5">
    <div className="text-3xl mb-2 opacity-20">📊</div>
    <p className="text-xs text-white/40">
      {hasBars
        ? "اضغط 'رصد وتقييم' للحصول على درجة الفلو الدقيقة"
        : "قم بإجراء التحليل أولاً لبدء قياس الفلو"}
    </p>
  </div>
);
