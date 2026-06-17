"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVRASStore, AIAdvice, EmotionTag } from "../../../store/vrasStore";

const PRIORITY_STYLES = {
  low: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", label: "منخفضة" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: "متوسطة" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", label: "عالية" },
  critical: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "حرجة" },
};

const EMOTION_ICONS: Record<EmotionTag, string> = {
  aggressive: "🔥", sad: "🌙", triumphant: "👑",
  cinematic: "🎬", neutral: "⚡", romantic: "💖",
};

export const AIAdvisorPanel: React.FC = () => {
  const { aiAdvices, sessionStats, actions } = useVRASStore();

  return (
    <div className="flex flex-col h-full font-arabic" dir="rtl">
      {/* ── رأس اللوحة ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <div>
              <h3 className="text-xs font-black text-white/80">المساعد الذكي الإبداعي</h3>
              <p className="text-[9px] text-white/30 font-mono">AI Creative Advisor</p>
            </div>
          </div>
          <button
            onClick={actions.generateAIAdvices}
            className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] hover:bg-purple-500/20 cursor-pointer font-arabic"
          >
            تحليل جديد
          </button>
        </div>
      </div>

      {/* ── الإحصائيات المصغّرة ── */}
      {sessionStats && (
        <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-3 border-b border-white/5">
          <MiniStat label="الفلو" value={`${sessionStats.flowScore}/10`} good={sessionStats.flowScore >= 7} />
          <MiniStat label="التقافي" value={`%${Math.round(sessionStats.rhymeConsistency)}`} good={sessionStats.rhymeConsistency >= 75} />
          <MiniStat label="التوازن الطاقي" value={`%${Math.round(sessionStats.energyBalance)}`} good={sessionStats.energyBalance >= 70} />
          <MiniStat label="المطابقة" value={`%${sessionStats.avgMatchScore}`} good={sessionStats.avgMatchScore >= 65} />
        </div>
      )}

      {/* ── قائمة النصائح ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {aiAdvices.length > 0 ? (
            aiAdvices.map((advice, idx) => (
              <motion.div
                key={advice.id}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, height: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <AdviceCard advice={advice} />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-[10px] text-white/30 font-arabic">لا توجد توصيات حالية</p>
              <p className="text-[9px] text-white/20 font-arabic">الفلو في حالة جيدة</p>
            </div>
          )}
        </AnimatePresence>

        {/* ── نصائح إبداعية ثابتة ── */}
        <div className="mt-4 space-y-2">
          <p className="text-[8px] text-white/20 text-center font-arabic">💡 نصائح إبداعية</p>
          {CREATIVE_TIPS.map((tip, i) => (
            <div key={i} className="p-2.5 rounded-xl border border-white/[0.03] bg-white/[0.01]">
              <p className="text-[9px] text-white/50 leading-relaxed font-arabic">
                <span className="font-bold text-amber-400/70">{tip.icon}</span> {tip.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AdviceCardProps {
  advice: AIAdvice;
}

const AdviceCard: React.FC<AdviceCardProps> = ({ advice }) => {
  const { actions } = useVRASStore();
  const style = PRIORITY_STYLES[advice.priority];

  return (
    <div className={`p-3 rounded-xl border ${style.bg} ${style.border} font-arabic`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{advice.icon}</span>
          <h4 className={`text-[10px] font-black ${style.text}`}>{advice.title}</h4>
        </div>
        <button
          onClick={() => actions.dismissAdvice(advice.id)}
          className="text-white/20 hover:text-white/50 text-xs cursor-pointer flex-shrink-0"
        >
          ✕
        </button>
      </div>
      <p className="text-[9px] text-white/60 leading-relaxed mb-2">{advice.body}</p>
      {advice.actionLabel && (
        <button
          onClick={() => actions.applyAdvice(advice.id)}
          className={`w-full py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${style.bg} ${style.text} hover:opacity-80`}
        >
          {advice.actionLabel}
        </button>
      )}
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string; good: boolean }> = ({
  label, value, good,
}) => (
  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-center font-arabic">
    <p className="text-[8px] text-white/30">{label}</p>
    <p className={`text-sm font-black font-mono ${good ? "text-emerald-400" : "text-amber-400"}`}>
      {value}
    </p>
  </div>
);

const CREATIVE_TIPS = [
  { icon: "🎯", text: "في الكورس، استخدم بارات بـ 7 مقاطع لزيادة التأثير في الذاكرة." },
  { icon: "💥", text: "زد الحروف الانفجارية (ب، ك، د، ق) في لحظات الذروة الطاقية." },
  { icon: "🔄", text: "كسر الإيقاع المتوقع في أول بار من كل قسم يخلق مفاجأة موسيقية مدروسة." },
  { icon: "🎭", text: "تناوب بين القوافي المفتوحة والمغلقة لإنشاء تدفق إيقاعي متوازن." },
];
