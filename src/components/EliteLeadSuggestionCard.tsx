// src/components/EliteLeadSuggestionCard.tsx

import React from 'react';
import { CheckCircle, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';
import { LeadInstrumentId } from '../types/flowLabElite';

const scoreColor = (score: number) => {
  if (score >= 75) return 'text-emerald-300';
  if (score >= 55) return 'text-amber-300';
  return 'text-orange-300';
};

export const EliteLeadSuggestionCard: React.FC = () => {
  const suggested = useEliteFlowLabStore((state) => state.suggestedLeadInstrument);
  const candidates = useEliteFlowLabStore((state) => state.leadCandidates);
  const activeLead = useEliteFlowLabStore((state) => state.activeLeadInstrument);
  const acceptSuggestedLead = useEliteFlowLabStore((state) => state.acceptSuggestedLead);
  const setActiveLeadInstrument = useEliteFlowLabStore((state) => state.setActiveLeadInstrument);

  if (!suggested) return null;

  return (
    <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#17130a] via-[#111827] to-[#070a12] p-5 shadow-2xl shadow-black/30 text-right" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sparkles className="h-4 w-4" />
            اقتراح الآلة القائدة تلقائيًا
          </div>

          <h2 className="flex items-center gap-3 text-xl font-black text-white">
            <span className="text-3xl">{suggested.icon}</span>
            <span>{suggested.labelAr}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60 font-mono">
              {suggested.labelEn}
            </span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            {suggested.reason}
          </p>
        </div>

        <div className="min-w-[180px] rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
          <div className={`text-3xl font-black ${scoreColor(suggested.confidence)}`}>
            {suggested.confidence}%
          </div>
          <div className="mt-1 text-[11px] text-white/50">درجة الثقة</div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-5">
        <Metric label="الحضور" value={suggested.presenceScore} />
        <Metric label="الحركة" value={suggested.motionScore} />
        <Metric label="مع الضربات" value={suggested.beatSyncScore} />
        <Metric label="الاستمرار" value={suggested.continuityScore} />
        <Metric label="مساحة الكلمات" value={suggested.writingSpaceScore} />
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <button
          onClick={acceptSuggestedLead}
          className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-300 cursor-pointer"
        >
          <CheckCircle className="h-4 w-4" />
          تثبيت الآلة المقترحة
        </button>

        <div className="flex flex-1 flex-wrap gap-2">
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setActiveLeadInstrument(candidate.id as LeadInstrumentId)}
              className={[
                'rounded-2xl border px-3 py-2 text-xs transition cursor-pointer',
                activeLead === candidate.id
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white',
              ].join(' ')}
            >
              <span className="mr-1">{candidate.icon}</span>
              {candidate.labelAr}
              <span className="mr-2 text-white/40">{candidate.confidence}%</span>
            </button>
          ))}
        </div>

        <button className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 hover:text-white cursor-pointer">
          <SlidersHorizontal className="h-4 w-4" />
          اختيار يدوي
        </button>
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-right">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="text-white/50">{label}</span>
        <span className="font-bold text-white/80">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
