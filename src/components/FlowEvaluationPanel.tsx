// src/components/FlowEvaluationPanel.tsx

import React from 'react';
import { Gauge } from 'lucide-react';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';

const getTone = (value: number, reverse = false) => {
  const score = reverse ? 100 - value : value;

  if (score >= 75) return 'from-emerald-400 to-emerald-300';
  if (score >= 50) return 'from-amber-400 to-yellow-300';
  return 'from-orange-500 to-red-400';
};

export const FlowEvaluationPanel: React.FC = () => {
  const evaluation = useEliteFlowLabStore((state) => state.evaluation);

  if (!evaluation) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d111b] p-5 text-right font-sans" dir="rtl">
      <h3 className="flex items-center gap-2 text-sm font-black text-white">
        <Gauge className="h-4 w-4 text-amber-300" />
        تقييم الرصف البصري
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <ScoreCard label="وضوح الرصف" value={evaluation.clarity} />
        <ScoreCard label="تماسك التدفق" value={evaluation.coherence} />
        <ScoreCard label="الازدحام" value={evaluation.crowding} reverse />
        <ScoreCard label="الأثر" value={evaluation.impact} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 text-[11px] font-bold text-white/40">
          ملاحظات ذكية
        </div>

        <ul className="space-y-2">
          {evaluation.notes.map((note, index) => (
            <li key={index} className="text-sm leading-6 text-white/70">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const ScoreCard: React.FC<{
  label: string;
  value: number;
  reverse?: boolean;
}> = ({ label, value, reverse = false }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-right">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-lg font-black text-white">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getTone(value, reverse)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
