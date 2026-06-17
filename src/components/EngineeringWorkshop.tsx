import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Sparkles,
  Wand2,
  Activity,
  Play,
  Star,
  GitMerge,
  FileText,
  ActivitySquare
} from "lucide-react";
import { useRapEngineStore } from "../store/useRapEngineStore";
import { BeatBlueprintEngine } from "./BeatBlueprintEngine";
import { RhythmicMatrix } from "./RhythmicMatrix";

export const EngineeringWorkshop: React.FC = () => {
  const [localSourceBar, setLocalSourceBar] = useState("");
  const { loading, error, results, sourceBar, initWorker, compose, generateMatrix, blueprint, matrixData } =
    useRapEngineStore();

  useEffect(() => {
    initWorker();
  }, [initWorker]);

  const handleCompose = () => {
    if (!localSourceBar.trim()) return;
    compose(localSourceBar);
  };

  const handleMatrixTest = () => {
    if (!localSourceBar.trim()) return;
    generateMatrix(localSourceBar);
  };

  const handleInteractiveOption = (opt: string) => {
    if (!localSourceBar.trim()) return;
    compose(localSourceBar, { focusTone: opt });
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar p-1">
      <div className="p-8 bg-gradient-to-br from-bg-surface/80 to-bg-primary/40 rounded-3xl border border-white/5 backdrop-blur-xl relative overflow-hidden group shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gold-400/10 rounded-2xl flex items-center justify-center border border-gold-400/30 glow-accent group-hover:scale-105 transition-transform duration-500">
              <Cpu className="w-8 h-8 text-gold-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-l from-gold-400 to-gold-200 bg-clip-text text-transparent">
                نظام صناعة الراب الاحترافي
              </h2>
              <p className="text-text-muted font-mono text-xs mt-1">
                المحرك الصوتي والدلالي للإكمالات التكيفية
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        {/* Input area */}
        <div className="w-80 shrink-0 bg-bg-surface/30 border border-white/5 rounded-3xl p-6 flex flex-col gap-6 relative">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-widest">
                إدخال البار الأساسي
              </label>
              <textarea
                value={localSourceBar}
                onChange={(e) => setLocalSourceBar(e.target.value)}
                placeholder="أدخل بار البداية هنا... (مثال: قلبي ودعني وفات كلام بدون كلام)"
                className="w-full h-32 bg-bg-base/50 border border-border-default rounded-2xl p-4 text-sm text-text-primary resize-none outline-none focus:border-gold-400/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCompose}
              disabled={loading || !localSourceBar.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${loading || !localSourceBar.trim() ? "bg-bg-elevated text-text-muted cursor-not-allowed" : "bg-gold-500 text-bg-base hover:bg-gold-400 glow-accent shadow-xl shadow-gold-500/20"}`}
            >
              {loading ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {loading ? "جاري التوليد العميق..." : "بدء التوليد الإبداعي"}
            </button>
            <button
              onClick={handleMatrixTest}
              disabled={loading || !localSourceBar.trim()}
              className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${loading || !localSourceBar.trim() ? "border-white/5 bg-transparent text-text-muted/50 cursor-not-allowed" : "border-gold-500/50 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20"}`}
            >
              <ActivitySquare className="w-4 h-4" />
              تحليل المصفوفة الإيقاعية 2D
            </button>
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 bg-bg-surface/20 border border-white/5 rounded-3xl p-6 overflow-y-auto custom-scrollbar relative">
          {!results.length && !loading && !error && !matrixData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted/50 space-y-4 pointer-events-none">
              <Sparkles className="w-16 h-16 opacity-20" />
              <p>قم بإدخال بار وانتظر سحر المعالجة الديناميكية</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 rounded-full border border-gold-400/20 border-t-gold-400 animate-spin" />
              <div className="text-center space-y-2">
                <p className="font-bold text-gold-400">
                  نظام MAQAM قيد التحليل...
                </p>
                <p className="text-xs text-text-muted">
                  التحليل الصوتي → الإيقاع → التوليد
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
              {error}
            </div>
          )}

          {matrixData && (
            <div className="space-y-6 mb-8">
              <RhythmicMatrix 
                barText={localSourceBar} 
                matrixData={matrixData} 
              />
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              {blueprint && <BeatBlueprintEngine blueprint={blueprint} />}
              <div className="p-4 bg-bg-surface/40 rounded-2xl border border-border-default/50">
                <div className="text-xs text-text-muted mb-2">البار الأصلي</div>
                <div className="text-lg font-bold text-text-primary">
                  「 {sourceBar} 」
                </div>
              </div>

              <div className="space-y-4">
                {results.map((res: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-bg-base/40 border border-white/5 rounded-2xl p-5 hover:border-gold-400/20 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gold-400/10 flex items-center justify-center text-gold-400 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <h3 className="text-xl font-bold font-mono">
                          「 {res.completion} 」
                        </h3>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                        ثقة {res.confidence}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-bg-surface/30 rounded-xl border border-white/5 text-center">
                        <div className="text-xs text-text-muted mb-1">
                          صوتية
                        </div>
                        <div className="font-mono text-sm text-blue-400">
                          {res.scores.phonetic}
                        </div>
                      </div>
                      <div className="p-3 bg-bg-surface/30 rounded-xl border border-white/5 text-center">
                        <div className="text-xs text-text-muted mb-1">
                          دلالية
                        </div>
                        <div className="font-mono text-sm text-purple-400">
                          {res.scores.semantic}
                        </div>
                      </div>
                      <div className="p-3 bg-bg-surface/30 rounded-xl border border-white/5 text-center">
                        <div className="text-xs text-text-muted mb-1">
                          إبداعية (تدفق)
                        </div>
                        <div className="font-mono text-sm text-gold-400">
                          {res.scores.creativity}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-bg-surface/30 rounded-xl border border-white/5 text-sm text-text-primary/80 whitespace-pre-wrap font-mono">
                      <div className="text-xs text-text-muted mb-2 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> مبررات الاختيار:
                      </div>
                      {res.justification}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <h4 className="text-sm font-bold text-text-muted mb-4">
                  خيارات بحث متقدم للمزيد من التحسين
                </h4>
                <div className="flex flex-wrap gap-3">
                  {["توجيه حزين", "توجيه فخور", "توجيه عنيف"].map(
                    (opt: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleInteractiveOption(opt)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-bg-surface/30 border border-white/5 text-sm hover:border-gold-400/30 hover:bg-gold-400/5 transition-all text-text-primary disabled:opacity-50"
                      >
                        {opt}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
