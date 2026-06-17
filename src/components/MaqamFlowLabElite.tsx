// src/components/MaqamFlowLabElite.tsx

import React, { useEffect } from 'react';
import { Layers3, Sparkles, WandSparkles } from 'lucide-react';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';
import { EliteLeadSuggestionCard } from './EliteLeadSuggestionCard';
import { EliteFlowCanvas } from './EliteFlowCanvas';
import { BarWritingLayer } from './BarWritingLayer';
import { SmartWritingAssistant } from './SmartWritingAssistant';
import { FlowEvaluationPanel } from './FlowEvaluationPanel';
import { SimpleTerminologyPanel } from './SimpleTerminologyPanel';
import { RepositoryIntegrationPanel } from './RepositoryIntegrationPanel';

interface MaqamFlowLabEliteProps {
  analysisResult: any;
}

export const MaqamFlowLabElite: React.FC<MaqamFlowLabEliteProps> = ({
  analysisResult,
}) => {
  const buildEliteFlowFromAnalysis = useEliteFlowLabStore(
    (state) => state.buildEliteFlowFromAnalysis
  );

  const userMode = useEliteFlowLabStore((state) => state.userMode);
  const setUserMode = useEliteFlowLabStore((state) => state.setUserMode);

  const activeLeadInstrument = useEliteFlowLabStore(
    (state) => state.activeLeadInstrument
  );

  const suggestedLeadInstrument = useEliteFlowLabStore(
    (state) => state.suggestedLeadInstrument
  );

  useEffect(() => {
    if (analysisResult) {
      buildEliteFlowFromAnalysis(analysisResult);
    }
  }, [analysisResult, buildEliteFlowFromAnalysis]);

  if (!analysisResult) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0d111b] p-8 text-center text-white/60">
        ارفع أو حلل بيتًا موسيقيًا حتى يبدأ FlowLab في بناء قماش التدفق.
      </div>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-[#05070d] p-4 text-white md:p-6 xl:p-8" dir="rtl">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#16120a] via-[#0d111b] to-[#05070d] p-5 shadow-2xl shadow-black/30 md:p-6 text-right">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-300">
              <WandSparkles className="h-3.5 w-3.5" />
              Maqam FlowLab Elite
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              قماش كتابة الراب فوق تدفق الآلة القائدة
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
              هذه الواجهة تحول التحليل الصوتي إلى خريطة كتابة واضحة: النظام
              يقترح الآلة القائدة، يعرض كثافة كل بار، ثم يساعدك على رصف الكلمات
              حسب مناطق القوة والارتخاء.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold text-white/45">
              <Layers3 className="h-3.5 w-3.5" />
              مستوى التحكم
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUserMode('simple')}
                className={[
                  'rounded-2xl px-4 py-3 text-sm font-black transition cursor-pointer',
                  userMode === 'simple'
                    ? 'bg-amber-400 text-black'
                    : 'border border-white/10 bg-white/5 text-white/55 hover:text-white',
                ].join(' ')}
              >
                بسيط
              </button>

              <button
                onClick={() => setUserMode('pro')}
                className={[
                  'rounded-2xl px-4 py-3 text-sm font-black transition cursor-pointer',
                  userMode === 'pro'
                    ? 'bg-purple-400 text-black'
                    : 'border border-white/10 bg-white/5 text-white/55 hover:text-white',
                ].join(' ')}
              >
                محترف
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatusTile
            label="الآلة النشطة"
            value={getLeadLabel(activeLeadInstrument)}
            tone="gold"
          />

          <StatusTile
            label="اقتراح النظام"
            value={suggestedLeadInstrument?.labelAr || 'غير متاح'}
            tone="emerald"
          />

          <StatusTile
            label="وضع الواجهة"
            value={userMode === 'simple' ? 'بسيط وموجّه' : 'محترف وتفصيلي'}
            tone="sky"
          />
        </div>
      </header>

      {/* Central Integrated Repository */}
      <RepositoryIntegrationPanel />

      <EliteLeadSuggestionCard />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <div className="space-y-6">
          <EliteFlowCanvas />
          <BarWritingLayer />
        </div>

        <aside className="space-y-6">
          <SmartWritingAssistant />
          <FlowEvaluationPanel />
        </aside>
      </section>

      {userMode === 'pro' && (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SimpleTerminologyPanel />

          <ProControlPanel />
        </section>
      )}

      {userMode === 'simple' && <SimpleTerminologyPanel />}
    </main>
  );
};

const StatusTile: React.FC<{
  label: string;
  value: string;
  tone: 'gold' | 'emerald' | 'sky';
}> = ({ label, value, tone }) => {
  const toneClass = {
    gold: 'from-amber-400/20 to-amber-400/5 text-amber-200 border-amber-400/20',
    emerald:
      'from-emerald-400/20 to-emerald-400/5 text-emerald-200 border-emerald-400/20',
    sky: 'from-sky-400/20 to-sky-400/5 text-sky-200 border-sky-400/20',
  };

  return (
    <div
      className={[
        'rounded-2xl border bg-gradient-to-br p-4 text-right',
        toneClass[tone],
      ].join(' ')}
    >
      <div className="text-[11px] font-bold text-white/40">{label}</div>
      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
};

const ProControlPanel: React.FC = () => {
  const leadCandidates = useEliteFlowLabStore((state) => state.leadCandidates);
  const activeLeadInstrument = useEliteFlowLabStore(
    (state) => state.activeLeadInstrument
  );
  const setActiveLeadInstrument = useEliteFlowLabStore(
    (state) => state.setActiveLeadInstrument
  );
  const canvasViewport = useEliteFlowLabStore((state) => state.canvasViewport);
  const setViewportZoom = useEliteFlowLabStore((state) => state.setViewportZoom);
  const evaluation = useEliteFlowLabStore((state) => state.evaluation);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d111b] p-5 text-right font-sans">
      <div className="mb-4 text-right">
        <h3 className="text-sm font-black text-white">لوحة التحكم الاحترافية</h3>
        <p className="mt-1 text-xs leading-6 text-white/50">
          هذه اللوحة مخصصة للمستخدم المتقدم: مقارنة القنوات، ضبط التكبير، وقراءة
          مؤشرات الرصف بشكل أدق.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 text-[11px] font-bold text-[#f59e0b]">
            مقارنة الآلات المرشحة
          </div>

          <div className="space-y-2">
            {leadCandidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setActiveLeadInstrument(candidate.id)}
                className={[
                  'w-full rounded-2xl border p-3 text-right transition cursor-pointer',
                  activeLeadInstrument === candidate.id
                    ? 'border-amber-400/50 bg-amber-400/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{candidate.icon}</span>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">
                        {candidate.labelAr}
                      </div>
                      <div className="text-[10px] text-white/35">
                        {candidate.labelEn}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-black text-amber-300">
                    {candidate.confidence}%
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-amber-400 to-emerald-400"
                    style={{ width: `${candidate.confidence}%` }}
                  />
                </div>

                <p className="mt-2 text-[11px] leading-5 text-white/45 text-right">
                  {candidate.reason}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between" dir="ltr">
            <div className="text-right">
              <div className="text-[11px] font-bold text-white/45">
                تكبير قماش التدفق
              </div>
              <div className="mt-1 text-xs text-white/70">
                المستوى الحالي: {canvasViewport.zoom.toFixed(1)}x
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/45">
              {canvasViewport.startTime.toFixed(1)}s إلى{' '}
              {canvasViewport.endTime.toFixed(1)}s
            </div>
          </div>

          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={canvasViewport.zoom}
            onChange={(event) => setViewportZoom(Number(event.target.value))}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-[11px] font-bold text-white/45 text-right">
            قراءة سريعة للنتيجة
          </div>

          {evaluation ? (
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="وضوح" value={evaluation.clarity} />
              <MiniMetric label="تماسك" value={evaluation.coherence} />
              <MiniMetric label="ازدحام" value={evaluation.crowding} />
              <MiniMetric label="أثر" value={evaluation.impact} />
            </div>
          ) : (
            <p className="text-xs text-white/45 text-right">
              لا توجد نتيجة تقييم بعد. اكتب داخل البارات أولًا.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const MiniMetric: React.FC<{
  label: string;
  value: number;
}> = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-right">
      <div className="text-[10px] text-white/40">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}%</div>
    </div>
  );
};

const getLeadLabel = (id: string) => {
  const labels: Record<string, string> = {
    'synth-lead': 'السينث القائد',
    strings: 'الوتريات',
    brass: 'النحاسيات',
    vocal: 'الصوت الأساسي',
    bass: 'الباس',
    piano: 'البيانو',
    unknown: 'غير محدد',
  };

  return labels[id] || 'غير حدد';
};
