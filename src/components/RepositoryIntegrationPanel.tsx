// src/components/RepositoryIntegrationPanel.tsx

import React, { useState } from 'react';
import { Database, Download, Upload, Search, Check, RefreshCw, Layers } from 'lucide-react';
import { useRepositoryStore, repoSelectors } from '../store/repositoryStore';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';
import { ArabicDialect } from '../services/moraEngine';

export const RepositoryIntegrationPanel: React.FC = () => {
  const repoBars = useRepositoryStore(repoSelectors.filteredBars);
  const addBatchToRepo = useRepositoryStore((state) => state.addBatch);
  const searchQuery = useRepositoryStore((state) => state.searchQuery);
  const setSearchQuery = useRepositoryStore((state) => state.setSearchQuery);

  const flowBars = useEliteFlowLabStore((state) => state.flowBars);
  const selectedBarId = useEliteFlowLabStore((state) => state.selectedBarId);
  const importSingleRepoBar = useEliteFlowLabStore((state) => state.importSingleRepoBar);
  const importRepositoryBars = useEliteFlowLabStore((state) => state.importRepositoryBars);

  const [exportDialect, setExportDialect] = useState<ArabicDialect>('egyp_rap');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeFlowBarsWithText = flowBars.filter(bar => bar.words && bar.words.trim().length > 0);

  // Handle exporting FlowLab written bars to central repository
  const handleExportToRepository = () => {
    if (activeFlowBarsWithText.length === 0) return;

    const batchToImport = activeFlowBarsWithText.map(bar => ({
      text: bar.words,
      dialect: exportDialect,
      tags: ['FlowLab_Elite', `Int_${bar.intensity}`],
    }));

    addBatchToRepo(batchToImport);

    setSuccessMsg(`🎉 تم تصدير ${activeFlowBarsWithText.length} بار بنجاح إلى مستودع البارات المركزي وجاري فحصها وتحليلها صوتياً!`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Handle importing selected repository bar into the active FlowLab slot
  const handleImportSingle = (text: string) => {
    if (!selectedBarId) {
      // If no slot is selected, put it in the first unfilled or just the first bar
      const firstBarId = flowBars[0]?.id;
      if (firstBarId) {
        importSingleRepoBar(firstBarId, text);
        setSuccessMsg(`📥 تم إدخال البار لخانة بار رقم 1`);
      }
    } else {
      const activeBar = flowBars.find(b => b.id === selectedBarId);
      importSingleRepoBar(selectedBarId, text);
      if (activeBar) {
        setSuccessMsg(`📥 تم استيراد النص المختار إلى بار رقم ${activeBar.index}`);
      }
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handle importing consecutive rows from the central repo into the timeline slots
  const handleImportConsecutive = () => {
    if (repoBars.length === 0) return;
    const maxToImport = Math.min(flowBars.length, repoBars.length);
    const textArray = repoBars.slice(0, maxToImport).map(b => b.text);
    importRepositoryBars(textArray);
    setSuccessMsg(`📥 تم رصف ${maxToImport} بار متتالٍ من المستودع على قماش التدفق الحالي!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d111b] p-5 text-right font-sans shadow-xl" dir="rtl">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-black text-white">
          <Database className="h-4 w-4 text-amber-300" />
          مستودع البارات المترابط
        </h3>
        <p className="mt-1 text-xs text-white/50">
          اربط كلماتك المحفوظة داخل التطبيق مباشرة مع قماش تدفق ومحرر النخبة.
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 transition-all">
          {successMsg}
        </div>
      )}

      {/* Grid: Left Column is Repository Explorer, Right Column is Local Sync Wizard */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Explorer */}
        <div className="rounded-2xl border border-white/5 bg-black/25 p-4 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-white/55">البارات المتواجدة بالمستودع ({repoBars.length})</span>
              <button 
                onClick={handleImportConsecutive}
                disabled={repoBars.length === 0}
                className="flex items-center gap-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 px-2.5 py-1.5 text-[10px] font-bold text-amber-300 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3 w-3" />
                صب أول {Math.min(flowBars.length, repoBars.length)} بار بالترتيب
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بكلمة أو تفعيلة محددة..."
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-3 pr-9 text-xs text-white outline-none placeholder:text-white/30 focus:border-amber-400/40 text-right"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {repoBars.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/35">
                  لا توجد بارات مطابقة للبحث أو مستودعك فارغ حالياً.
                </div>
              ) : (
                repoBars.map((bar) => (
                  <div 
                    key={bar.id}
                    className="group flex items-center justify-between gap-2.5 rounded-xl border border-white/5 bg-[#141923] p-2.5 transition hover:border-amber-400/40"
                  >
                    <div className="flex-1 text-right min-w-0">
                      <p className="text-xs font-bold text-white leading-5 truncate">{bar.text}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                        <span className="rounded bg-white/5 px-1 py-0.5 font-mono text-white/60">{bar.serialNumber}</span>
                        <span>•</span>
                        <span>قافية: <span className="text-amber-300/80 font-mono">{bar.corePhoneme || 'سكون'}</span></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportSingle(bar.text)}
                      title={selectedBarId ? `استيراد إلى خانة بار المحددة` : `استيراد إلى أول خانة متاحة`}
                      className="rounded-lg bg-white/5 group-hover:bg-amber-400 group-hover:text-black p-1.5 text-white/60 group-hover:scale-105 transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sync Wizard (Export) */}
        <div className="rounded-2xl border border-white/5 bg-black/25 p-4 flex flex-col justify-between">
          <div>
            <div className="mb-2 text-xs font-bold text-white/55">تصدير الفلو الحالي للمستودع</div>
            <p className="mb-4 text-[11px] leading-5 text-white/40">
              يمكنك تصدير الكلمات التي كتبتها في FlowLab وحفظها كمشروع بارات دائم ليتم تحليلها وفهرستها مع باقي أبياتك.
            </p>

            <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-right">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">عدد البارات المكتوبة لتصديرها:</span>
                <span className="font-bold text-amber-300">{activeFlowBarsWithText.length} بار</span>
              </div>
              
              <div className="mt-2.5">
                <label className="mb-1 block text-[10px] font-bold text-white/40">اللهجة المناسبة للتحليل العروضي والصوتي</label>
                <select
                  value={exportDialect}
                  onChange={(e) => setExportDialect(e.target.value as ArabicDialect)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2 px-3 text-xs text-white outline-none cursor-pointer text-right"
                >
                  <option value="egyp_rap">العامية المصرية ( راب مصري )</option>
                  <option value="fusha">الفصحى القياسية</option>
                  <option value="gulf_rap">العامية الخليجية</option>
                  <option value="levant">العامية الشامية</option>
                  <option value="iraqi">العامية العراقية</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportToRepository}
            disabled={activeFlowBarsWithText.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 disabled:bg-white/10 py-3 text-xs font-black text-black disabled:text-white/30 transition cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            تصدير {activeFlowBarsWithText.length} بار بنجاح للمستودع
          </button>
        </div>
      </div>
    </section>
  );
};
