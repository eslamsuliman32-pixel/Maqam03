import React, { useState } from "react";
import {
  Shuffle,
  Zap,
  CheckCircle2,
  Trash2,
  Sliders,
  Play,
  HelpCircle,
} from "lucide-react";
import { useFlowMethodologyStore } from "../../store/flowMethodologyStore";
import { createTransitionConfig, calculateTransitionSmoothness } from "../../services/transitionEngine";
import { TransitionStrategy } from "../../types/flowEngine.types";

export function TransitionArchitect() {
  const { transitionConfigs, activeQuatrains, actions } = useFlowMethodologyStore();
  const [strategy, setStrategy] = useState<TransitionStrategy>("breath");
  const [blendDuration, setBlendDuration] = useState(2);
  const [smoothness, setSmoothness] = useState(85);

  const handleAddTransition = () => {
    if (activeQuatrains.length < 1) return;
    const config = createTransitionConfig(
      activeQuatrains[0].id,
      activeQuatrains[0].id, // للرباعية الحالية
      strategy
    );
    actions.addTransition({
      ...config,
      blendDuration,
      smoothness,
    });
    actions.refreshMatrix();
  };

  const strategies: { value: TransitionStrategy; label: string; desc: string }[] = [
    { value: "breath", label: "التنفس الواضح (Breath Mark)", desc: "ترك ثغرة 1/8 دقة تمكّن الرئة من الشحن الفوري" },
    { value: "spillover", label: "الفيض والامتداد (Spillover)", desc: "تمديد المقطع الأخير قسرياً حتى مطلع البار الجديد" },
    { value: "tonal", label: "الجسر النغمي المائل (Tonal)", desc: "انزلاق تدريجي لطبقة النوتة للامساك بمفتاح الكورس" },
    { value: "rhythmic", label: "تداخل السرعة (Rhythmic)", desc: "دمج خلايا السكاتينج للتسريع المباغت" },
    { value: "compound", label: "التحول المركب العظيم", desc: "دمج طرائق انتقالية متعددة للنخبة والصلابة" },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── اللوحة العلوية: أدوات الهندسة وقوة الانتقال ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* قطاع الإعداد للمخطط والربط */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>إعداد الجسور والأربطة الذهبية</span>
            </h3>
            <span className="text-[10px] text-text-muted">Transition Config</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] text-text-muted">طريقة التحول الانتقالي:</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as TransitionStrategy)}
                className="w-full bg-bg-base border border-white/5 rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
              >
                {strategies.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] text-text-muted">
                <span>مدة المزج الإيقاعية (بالمقطع):</span>
                <span className="text-gold-400 font-mono font-bold">{blendDuration} دقات</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={blendDuration}
                onChange={(e) => setBlendDuration(parseInt(e.target.value))}
                className="w-full accent-gold-400"
              />
            </div>

            <button
              onClick={handleAddTransition}
              className="w-full py-2.5 bg-gold-400 hover:bg-gold-500 text-bg-base text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(212,160,23,0.15)] flex items-center justify-center gap-1.5"
            >
              <Shuffle className="w-4 h-4" />
              <span>زرع الجسر في المخطط الانتقالي</span>
            </button>
          </div>
        </div>

        {/* لوحة الشرح والتوجيه السمعي الفسيولوجي */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>الخواص النفسية والسمعية للطريقة</span>
              </h3>
              <span className="text-[10px] text-text-muted">Physiological Tips</span>
            </div>

            <div className="p-3 bg-bg-base/40 rounded-xl border border-white/5 text-[11px] text-text-secondary mt-3">
              <span className="text-gold-300 font-bold block mb-1">توجيه فسيولوجي كاسر:</span>
              {strategies.find((s) => s.value === strategy)?.desc}
            </div>
          </div>

          <div className="bg-bg-base/50 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[9px] text-text-muted">متوسط السلاسة التقديرية للانتقال:</div>
              <div className="text-lg font-black text-neural-emerald font-mono mt-0.5">
                {calculateTransitionSmoothness({
                  id: "",
                  strategy,
                  fromQuatrainId: "",
                  toQuatrainId: "",
                  blendDuration,
                  smoothness,
                  breathMarkPosition: strategy === "breath" ? 3.5 : null,
                  spilloverSyllables: [],
                  pitchBridge: [],
                })}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── عرض الجسور والأربطة النشطة ──────── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <h3 className="text-xs font-black text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-neural-emerald" />
          <span>جسور التحول والهندسة الانتقالية النشطة</span>
        </h3>

        <div className="space-y-2">
          {transitionConfigs.length === 0 ? (
            <div className="text-center text-text-muted text-xs py-8 font-sans">
              لا توجد جسور انتقالية قسرية مزروعة في هذه الشبكة بعد.
            </div>
          ) : (
            transitionConfigs.map((config) => (
              <div
                key={config.id}
                className="flex justify-between items-center p-3 bg-bg-base/40 border border-white/5 rounded-xl text-xs font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neural-emerald" />
                  <span className="text-text-primary font-bold font-sans">
                    {strategies.find((s) => s.value === config.strategy)?.label || config.strategy}
                  </span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-secondary">
                    سرعة المزج: {config.blendDuration} دقات
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="bg-neural-emerald/10 border border-neural-emerald/20 text-neural-emerald px-1.5 py-0.5 rounded text-[9px]">
                    سلاسة تحكم {config.smoothness}%
                  </span>
                  <button
                    onClick={() => {
                      actions.removeTransition(config.id);
                      actions.refreshMatrix();
                    }}
                    className="p-1 hover:bg-neural-crimson/10 text-text-muted hover:text-neural-crimson rounded transition-all"
                    title="حذف الجسر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
