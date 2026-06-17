// ═══════════════════════════════════════════════════════════════
// MAQAM RAP | محرر التدفق الرئيسي — الواجهة الكاملة والنظام النخبوي
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useCompositionStore, compositionSelectors } from '../../store/compositionStore';
import { PATTERN_CONFIGS } from '../../services/templateOrchestrator';
import { BarInput } from './BarInput';
import { PatternSelector } from './PatternSelector';
import { AssonancePanel } from './AssonancePanel';
import { RhythmicGrid } from '../ui/RhythmicGrid';

// ────────────────────────────────────────────────────────────────
// شاشة البداية (حالة idle)
// ────────────────────────────────────────────────────────────────
const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 space-y-6 text-center"
    dir="rtl"
  >
    <motion.div
      animate={{ rotate: [0, 5, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="text-5xl"
    >
      🎤
    </motion.div>

    <div className="space-y-2">
      <h2 className="text-2xl font-black text-zinc-100 font-arabic">Staccato Flow System</h2>
      <p className="text-sm text-zinc-500 max-w-sm leading-relaxed font-arabic">
        نظام التأليف الإيقاعي وعروض الراب المتكامل لمدرسة MAQAM RAP
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-right">
      {(['AAAA', 'STACCATO', 'ABAB', 'TRIPLET'] as const).map(pattern => {
        const cfg = PATTERN_CONFIGS[pattern];
        return (
          <div
            key={pattern}
            className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1"
          >
            <span className="text-base">{cfg.icon}</span>
            <p className="text-[11px] font-bold text-zinc-300 font-arabic">{cfg.nameAr}</p>
            <p className="text-[9px] text-zinc-600 font-mono">{cfg.bpmRange[0]}–{cfg.bpmRange[1]} BPM</p>
          </div>
        );
      })}
    </div>

    <motion.button
      onClick={onStart}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-sm rounded-2xl transition-colors shadow-yellow-500/20 shadow-lg cursor-pointer font-arabic"
    >
      ابدأ التأليف الآن ⚡
    </motion.button>
  </motion.div>
);

// ────────────────────────────────────────────────────────────────
// شريط المعلومات العلوي
// ────────────────────────────────────────────────────────────────
const FlowHeader: React.FC = () => {
  const togglePatternSelector = useCompositionStore(s => s.togglePatternSelector);
  const setBPM = useCompositionStore(s => s.setBPM);
  const resetComposition = useCompositionStore(s => s.resetComposition);
  const toggleVisualization = useCompositionStore(s => s.toggleVisualization);
  const patternConfig = useCompositionStore(compositionSelectors.patternConfig);
  const bpm = useCompositionStore(compositionSelectors.bpm);
  const filledCount = useCompositionStore(compositionSelectors.filledBarsCount);
  const barCount = useCompositionStore(compositionSelectors.barCount);
  const isValid = useCompositionStore(compositionSelectors.isFlowValid);
  const showViz = useCompositionStore(compositionSelectors.showVisualization);

  if (!patternConfig) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800" dir="rtl">
      {/* معلومات النمط */}
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{patternConfig.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-zinc-100 font-arabic">{patternConfig.nameAr}</span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: patternConfig.color + '20',
                color: patternConfig.color,
              }}
            >
              {patternConfig.id}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-zinc-500 font-arabic">
              {filledCount}/{barCount} بارات
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full font-arabic ${
                isValid
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-amber-400 bg-amber-500/10'
              }`}
            >
              {isValid ? '✓ وزن متوازن' : '⚡ تحقق من الوزن'}
            </span>
          </div>
        </div>
      </div>

      {/* أدوات التحكم */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        {/* BPM Slider */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 font-mono">{bpm}</span>
          <input
            type="range"
            min={60}
            max={220}
            value={bpm}
            onChange={e => setBPM(Number(e.target.value))}
            className="w-16 accent-yellow-500 cursor-pointer"
            title="السرعة (BPM)"
          />
        </div>

        <div className="w-px h-5 bg-zinc-800" />

        <button
          onClick={toggleVisualization}
          title="تبديل التصور الإيقاعي"
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
            showViz ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          ▦
        </button>

        <button
          onClick={togglePatternSelector}
          className="px-2.5 py-1.5 text-[10px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer font-arabic font-bold"
        >
          تغيير النمط
        </button>

        <button
          onClick={resetComposition}
          title="إعادة البدء"
          className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer mb-0"
        >
          ↺
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// المكون الرئيسي
// ────────────────────────────────────────────────────────────────
export const FlowEditor: React.FC = () => {
  const initializeTemplate = useCompositionStore(s => s.initializeTemplate);
  const setSelectedBar = useCompositionStore(s => s.setSelectedBar);
  const togglePatternSelector = useCompositionStore(s => s.togglePatternSelector);

  const flowState = useCompositionStore(compositionSelectors.flowState);
  const bars = useCompositionStore(useShallow(compositionSelectors.bars));
  const patternConfig = useCompositionStore(compositionSelectors.patternConfig);
  const selectedBarId = useCompositionStore(compositionSelectors.selectedBarId);
  const isPatternOpen = useCompositionStore(s => s.isPatternSelectorOpen);
  const selectedPatternId = useCompositionStore(compositionSelectors.currentPattern);
  const bpm = useCompositionStore(compositionSelectors.bpm);
  const showViz = useCompositionStore(compositionSelectors.showVisualization);

  const syllableTarget = patternConfig?.syllableTarget ?? [8, 12];

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 p-6 self-start flex-1" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* عنوان النظام */}
        <div className="flex items-center gap-2 py-2">
          <span className="text-lg font-black text-yellow-400 font-arabic">MAQAM RAP</span>
          <span className="text-zinc-600">|</span>
          <span className="text-sm text-zinc-500 font-arabic">Staccato Flow System</span>
        </div>

        <AnimatePresence mode="wait">
          {/* شاشة الترحيب */}
          {flowState === 'idle' && (
            <motion.div key="welcome" exit={{ opacity: 0, scale: 0.96 }}>
              <WelcomeScreen onStart={togglePatternSelector} />
            </motion.div>
          )}

          {/* واجهة التأليف */}
          {(flowState === 'composing' || flowState === 'analyzing' || flowState === 'error') && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* شريط المعلومات */}
              <FlowHeader />

              {/* التخطيط الرئيسي */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* العمود الرئيسي - البارات */}
                <div className="lg:col-span-2 space-y-3">
                  {bars.map((bar, idx) => (
                    <BarInput
                      key={bar.id}
                      bar={bar}
                      index={idx}
                      syllableTarget={syllableTarget}
                      isSelected={selectedBarId === bar.id}
                      onSelect={() => setSelectedBar(bar.id)}
                      onDeselect={() => setSelectedBar(null)}
                    />
                  ))}
                </div>

                {/* العمود الجانبي - التحليل والتصور */}
                <div className="space-y-4">
                  {/* التصور الإيقاعي */}
                  <AnimatePresence>
                    {showViz && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
                      >
                        <h3 className="text-xs font-bold text-zinc-400 mb-3 font-arabic">الشبكة الإيقاعية الرمزية</h3>
                        <RhythmicGrid
                          bpm={bpm}
                          bars={bars.map(b => ({
                            id: b.id,
                            syllableCount: b.syllableCount,
                            intensity: b.intensity,
                            content: b.content,
                          }))}
                          activeBarId={selectedBarId}
                          onBarSelect={setSelectedBar}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* لوحة التحليل */}
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <AssonancePanel />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* محدد النمط */}
        <PatternSelector
          selected={selectedPatternId}
          onSelect={initializeTemplate}
          isOpen={isPatternOpen}
          onClose={togglePatternSelector}
        />
      </div>
    </div>
  );
};
export default FlowEditor;
