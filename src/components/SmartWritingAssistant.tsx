// src/components/SmartWritingAssistant.tsx

import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';
import { WritingGoal } from '../types/flowLabElite';

const goalLabels: Record<WritingGoal, string> = {
  aggressive: 'هجومي',
  sad: 'حزين',
  celebratory: 'احتفالي',
  sarcastic: 'ساخر',
  motivational: 'تحفيزي',
  cinematic: 'سينمائي',
};

const buildSuggestion = (intensity: string, goal: WritingGoal) => {
  const mood = goalLabels[goal];

  if (intensity === 'high') {
    return `اكتب سطرًا ${mood} بكلمات قصيرة وحادة. الأفضل أن تضرب القافية قرب نهاية البار وتترك نصف نبضة قبل الضربة التالية.`;
  }

  if (intensity === 'medium') {
    return `اكتب جملة ${mood} متوازنة من 5 إلى 9 مقاطع. هذه المساحة مناسبة لقافية داخلية أو تكرار لفظي بسيط.`;
  }

  return `استخدم مساحة الهدوء لصناعة أثر ${mood}. يمكنك مد آخر كلمة أو ترك فراغ قصير قبل الدخول التالي.`;
};

export const SmartWritingAssistant: React.FC = () => {
  const bars = useEliteFlowLabStore((state) => state.flowBars);
  const selectedBarId = useEliteFlowLabStore((state) => state.selectedBarId);
  const writingGoal = useEliteFlowLabStore((state) => state.writingGoal);
  const setWritingGoal = useEliteFlowLabStore((state) => state.setWritingGoal);
  const [customIntent, setCustomIntent] = useState('');

  const selectedBar = useMemo(() => {
    return bars.find((bar) => bar.id === selectedBarId) || bars[0];
  }, [bars, selectedBarId]);

  if (!selectedBar) return null;

  const suggestion = buildSuggestion(selectedBar.intensity, writingGoal);

  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-[#101827] to-[#070a12] p-5 text-right font-sans" dir="rtl">
      <h3 className="flex items-center gap-2 text-sm font-black text-emerald-300">
        <Sparkles className="h-4 w-4" />
        مساعد الرصف الذكي
      </h3>

      <p className="mt-2 text-xs leading-6 text-white/55">
        المساعد هنا لا يولد كلمات عشوائية، بل يوجه الكتابة حسب كثافة الآلة داخل البار.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-bold text-white/50">
            هدف الكتابة
          </label>

          <select
            value={writingGoal}
            onChange={(event) => setWritingGoal(event.target.value as WritingGoal)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none cursor-pointer text-right"
            dir="rtl"
          >
            {Object.entries(goalLabels).map(([value, label]) => (
              <option key={value} value={value} className="bg-[#101827] text-white">
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold text-white/50">
            نية إضافية
          </label>

          <input
            value={customIntent}
            onChange={(event) => setCustomIntent(event.target.value)}
            placeholder="مثال: دخول هجومي قبل السنير"
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 text-right"
            dir="rtl"
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-right">
        <div className="mb-2 text-[11px] font-bold text-white/40">
          اقتراح للبار {selectedBar.index}
        </div>

        <p className="text-sm leading-7 text-white/80">
          {suggestion}
          {customIntent.trim() ? ` النية الإضافية: ${customIntent}` : ''}
        </p>
      </div>
    </section>
  );
};
