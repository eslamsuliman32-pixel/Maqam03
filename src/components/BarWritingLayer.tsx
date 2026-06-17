// src/components/BarWritingLayer.tsx

import React from 'react';
import { PenLine } from 'lucide-react';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';

const intensityLabel = {
  low: 'ارتخاء',
  medium: 'متوسط',
  high: 'كثيف',
};

const intensityClass = {
  low: 'border-sky-400/25 bg-sky-400/10',
  medium: 'border-purple-400/25 bg-purple-400/10',
  high: 'border-amber-400/25 bg-amber-400/10',
};

export const BarWritingLayer: React.FC = () => {
  const bars = useEliteFlowLabStore((state) => state.flowBars);
  const updateBarWords = useEliteFlowLabStore((state) => state.updateBarWords);
  const selectedBarId = useEliteFlowLabStore((state) => state.selectedBarId);
  const setSelectedBarId = useEliteFlowLabStore((state) => state.setSelectedBarId);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d111b] p-5 text-right font-sans" dir="rtl">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-black text-white">
          <PenLine className="h-4 w-4 text-emerald-300" />
          اكتب على التدفق
        </h3>
        <p className="mt-1 text-xs text-white/50">
          كل بار له درجة كثافة ونصيحة كتابة. اكتب الجملة في المكان المناسب.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {bars.map((bar) => (
          <article
            key={bar.id}
            onClick={() => setSelectedBarId(bar.id)}
            className={[
              'rounded-2xl border p-4 transition cursor-pointer',
              intensityClass[bar.intensity],
              selectedBarId === bar.id ? 'ring-2 ring-amber-300/60 font-medium' : '',
            ].join(' ')}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black text-white">بار {bar.index}</div>
              <div className="rounded-full bg-black/25 px-2 py-1 text-[10px] text-white/60">
                {intensityLabel[bar.intensity]}
              </div>
            </div>

            <textarea
              value={bar.words}
              onChange={(event) => updateBarWords(bar.id, event.target.value)}
              placeholder="اكتب كلمات هذا البار..."
              className="min-h-[86px] w-full resize-none rounded-xl border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-amber-300/60 text-right"
              dir="rtl"
            />

            <p className="mt-3 text-[11px] leading-5 text-white/55">
              {bar.suggestedWritingHint}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
