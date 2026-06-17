// ═══════════════════════════════════════════════════════════════
// لوحة تحليل السجع والذكاء الاصطناعي
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useCompositionStore, compositionSelectors } from '../../store/compositionStore';

const QualityConfig = {
  excellent: { label: 'ممتاز', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', emoji: '🔥' },
  good: { label: 'جيد', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', emoji: '✅' },
  average: { label: 'مقبول', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', emoji: '⚡' },
  weak: { label: 'ضعيف', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', emoji: '⚠️' },
};

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 80 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#27272a"
          strokeWidth="4"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${strokeDash} ${circumference}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
};

export const AssonancePanel: React.FC = () => {
  const analyzeWithAI = useCompositionStore(s => s.analyzeWithAI);
  const fetchRhymeSuggestions = useCompositionStore(s => s.fetchRhymeSuggestions);
  const aiState = useCompositionStore(useShallow(compositionSelectors.aiState));
  const assonanceScore = useCompositionStore(compositionSelectors.assonanceScore);
  const isAnalyzing = useCompositionStore(compositionSelectors.isAnalyzing);
  const analysis = aiState.lastAnalysis;

  const quality = analysis?.overallQuality ?? 'average';
  const qualityConf = QualityConfig[quality];

  return (
    <div className="space-y-4" dir="rtl">
      {/* رأس اللوحة */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-200">تحليل السجع</h3>
        <div className="flex gap-2">
          <button
            onClick={() => void fetchRhymeSuggestions()}
            disabled={isAnalyzing || aiState.isLoading}
            className="px-2.5 py-1 text-[10px] font-medium bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          >
            اقتراحات قافية
          </button>
          <button
            onClick={() => void analyzeWithAI()}
            disabled={isAnalyzing || aiState.isLoading}
            className="px-2.5 py-1 text-[10px] font-medium bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            {(isAnalyzing || aiState.isLoading) ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block text-xs"
                >
                  ◌
                </motion.span>
                جاري التحليل
              </>
            ) : (
              <>✦ تحليل Gemini</>
            )}
          </button>
        </div>
      </div>

      {/* النتيجة الكلية */}
      <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <ScoreRing score={assonanceScore} />
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">نقاط السجع الكلية</p>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${qualityConf.bg} ${qualityConf.color} ${qualityConf.border}`}>
            <span>{qualityConf.emoji}</span>
            <span>{qualityConf.label}</span>
          </div>
          {analysis && (
            <p className="text-[10px] text-zinc-600 font-mono">
              نمط مكتشف: {analysis.detectedPattern}
            </p>
          )}
        </div>
      </div>

      {/* خطأ الذكاء الاصطناعي */}
      <AnimatePresence>
        {aiState.error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400"
          >
            ⚠️ {aiState.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* نتائج التحليل */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* أزواج القافية */}
            {analysis.rhymingPairs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 font-medium font-arabic">أزواج القافية المكتشفة</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.rhymingPairs.map(([w1, w2, score], i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-[9px]"
                    >
                      <span className="text-zinc-300 font-arabic">{w1}</span>
                      <span className="text-zinc-600">⟷</span>
                      <span className="text-zinc-300 font-arabic">{w2}</span>
                      <span className="text-zinc-600 font-mono">
                        {Math.round(score * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* اقتراحات التحسين */}
            {analysis.suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 font-medium font-arabic">اقتراحات التحسين</p>
                <ul className="space-y-1">
                  {analysis.suggestions.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-2 text-[11px] text-zinc-400"
                    >
                      <span className="text-yellow-500 mt-0.5 shrink-0">→</span>
                      <span>{s}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* الانثناء الصوتي */}
            {analysis.phoneticBends.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-medium font-arabic">انثناءات صوتية مكتشفة</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.phoneticBends.map((bend, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full font-arabic"
                    >
                      {bend}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* كلمات القافية المقترحة */}
      <AnimatePresence>
        {aiState.suggestedWords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-[10px] text-zinc-500 font-medium font-arabic">كلمات قافية مقترحة (انقر للنسخ)</p>
            <div className="flex flex-wrap gap-1.5">
              {aiState.suggestedWords.map((word, i) => (
                <motion.button
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 400 }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 font-arabic transition-all hover:text-yellow-400 cursor-pointer"
                  title="انقر للنسخ"
                  onClick={() => navigator.clipboard?.writeText(word)}
                >
                  {word}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AssonancePanel;
