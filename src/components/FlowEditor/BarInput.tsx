// ═══════════════════════════════════════════════════════════════
// مكون البار الواحد — المحرك التفاعلي الرئيسي للكتابة والتشريح
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Bar } from '../../types/flow.types';
import { SyllableMeter } from '../ui/SyllableMeter';
import { useCompositionStore } from '../../store/compositionStore';

interface BarInputProps {
  bar: Bar;
  index: number;
  syllableTarget: [number, number];
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

const INTENSITY_LABELS: Record<number, string> = {
  0: 'هادئ',
  1: 'خفيف',
  2: 'معتدل',
  3: 'قوي',
  4: 'شرس',
  5: 'هجومي',
};

const INTENSITY_COLORS: Record<number, string> = {
  0: 'text-zinc-500',
  1: 'text-blue-400',
  2: 'text-cyan-400',
  3: 'text-yellow-400',
  4: 'text-orange-400',
  5: 'text-red-400',
};

const RHYME_QUALITY_CONFIG = {
  perfect: { label: 'قافية تامة', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  near: { label: 'قريبة جداً', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400' },
  assonance: { label: 'سجع جزئي', color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
  none: { label: 'لا تقافٍ', color: 'text-zinc-600', bg: 'bg-zinc-800', dot: 'bg-zinc-600' },
};

export const BarInput: React.FC<BarInputProps> = ({
  bar,
  index,
  syllableTarget,
  isSelected,
  onSelect,
}) => {
  const updateBarContent = useCompositionStore(s => s.updateBarContent);
  const toggleBarLock = useCompositionStore(s => s.toggleBarLock);
  const setBarAdLib = useCompositionStore(s => s.setBarAdLib);
  const aiCompleteBar = useCompositionStore(s => s.aiCompleteBar);

  const [showDetails, setShowDetails] = useState(false);
  const [adLibInput, setAdLibInput] = useState(bar.adLib ?? '');
  const [isCompleting, setIsCompleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rhymeConfig = RHYME_QUALITY_CONFIG[bar.rhymeQuality];

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (bar.isLocked) return;
      updateBarContent(bar.id, e.target.value);

      // تكيّف ارتفاع الـ textarea تلقائياً
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    },
    [bar.id, bar.isLocked, updateBarContent],
  );

  const handleAIComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      await aiCompleteBar(bar.id);
    } finally {
      setIsCompleting(false);
    }
  }, [bar.id, aiCompleteBar]);

  const handleAdLibSave = useCallback(() => {
    setBarAdLib(bar.id, adLibInput.trim() || null);
  }, [bar.id, adLibInput, setBarAdLib]);

  const [min, max] = syllableTarget;
  const syllableStatus =
    bar.syllableCount === 0 ? 'empty' :
    bar.syllableCount < min ? 'short' :
    bar.syllableCount > max ? 'long' : 'valid';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onSelect}
      className={`
        relative rounded-xl border transition-all duration-200 cursor-pointer group
        ${isSelected
          ? 'border-yellow-500/40 bg-yellow-500/3 shadow-yellow-500/5 shadow-lg'
          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
        }
        ${bar.isLocked ? 'opacity-60' : ''}
      `}
      dir="rtl"
    >
      {/* شريط الجانب الإيقاعي */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 rounded-r-xl transition-all duration-300"
        style={{
          backgroundColor: bar.syllableCount > 0
            ? syllableStatus === 'valid'
              ? '#10b981'
              : syllableStatus === 'short'
                ? '#f59e0b'
                : '#ef4444'
            : '#27272a',
          opacity: isSelected ? 1 : 0.6,
        }}
      />

      <div className="p-3 pl-4">
        {/* رأس البار */}
        <div className="flex items-center justify-between mb-2 gap-2">
          {/* الرقم والشدة */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-600 w-5">{index + 1}</span>

            <span
              className={`text-[10px] font-bold ${INTENSITY_COLORS[bar.intensity]}`}
              title={`شدة الإلقاء: ${INTENSITY_LABELS[bar.intensity]}`}
            >
              {INTENSITY_LABELS[bar.intensity]}
            </span>
          </div>

          {/* حالة القافية والأدوات */}
          <div className="flex items-center gap-2">
            {/* مؤشر جودة القافية */}
            <AnimatePresence mode="wait">
              {bar.content.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${rhymeConfig.bg} ${rhymeConfig.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${rhymeConfig.dot}`} />
                  {rhymeConfig.label}
                </motion.div>
              )}
            </AnimatePresence>

            {/* الأيقونات الوظيفية */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* زر إكمال الذكاء الاصطناعي */}
              {!bar.isLocked && (
                <button
                  onClick={e => { e.stopPropagation(); void handleAIComplete(); }}
                  disabled={isCompleting}
                  title="أكمل بالذكاء الاصطناعي"
                  className="w-6 h-6 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 flex items-center justify-center text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isCompleting ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      ◌
                    </motion.span>
                  ) : '✦'}
                </button>
              )}

              {/* زر القفل */}
              <button
                onClick={e => { e.stopPropagation(); toggleBarLock(bar.id); }}
                title={bar.isLocked ? 'فتح البار' : 'قفل البار'}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer ${
                  bar.isLocked
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500'
                }`}
              >
                {bar.isLocked ? '🔒' : '🔓'}
              </button>

              {/* زر تفاصيل أكثر */}
              <button
                onClick={e => { e.stopPropagation(); setShowDetails(d => !d); }}
                title="تفاصيل البار"
                className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                {showDetails ? '▲' : '▼'}
              </button>
            </div>
          </div>
        </div>

        {/* منطقة الكتابة */}
        <textarea
          ref={textareaRef}
          value={bar.content}
          onChange={handleContentChange}
          onFocus={onSelect}
          onClick={e => e.stopPropagation()}
          readOnly={bar.isLocked}
          placeholder={`البار ${index + 1}... اكتب هنا`}
          dir="rtl"
          rows={1}
          className={`
            w-full bg-transparent resize-none outline-none
            text-right font-arabic text-base leading-relaxed
            placeholder:text-zinc-700
            transition-colors duration-200
            ${bar.isLocked ? 'cursor-not-allowed text-zinc-500' : 'text-zinc-100'}
            ${isSelected ? 'caret-yellow-400' : 'caret-zinc-400'}
          `}
          style={{ minHeight: '2rem', maxHeight: '8rem' }}
        />

        {/* عداد المقاطع */}
        <div className="mt-2">
          <SyllableMeter
            current={bar.syllableCount}
            target={syllableTarget}
            syllableUnits={bar.syllableUnits}
            showUnits={isSelected && showDetails}
          />
        </div>

        {/* لوح التفاصيل القابل للطي */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="pt-3 mt-3 border-t border-zinc-800 space-y-3">
                {/* الـ Ad-Lib */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 block">
                    الـ Ad-Lib / الصوت الخلفي
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adLibInput}
                      onChange={e => setAdLibInput(e.target.value)}
                      placeholder="مثال: (YEAH) (اسمعوا)..."
                      dir="rtl"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-right font-arabic text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                    />
                    <button
                      onClick={handleAdLibSave}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      حفظ
                    </button>
                  </div>
                  {bar.adLib && (
                    <span className="inline-block text-[10px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full mt-1">
                      {bar.adLib}
                    </span>
                  )}
                </div>

                {/* معلومات الذيل الصوتي */}
                {bar.content.trim() && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <InfoChip label="الحركة" value={bar.phoneticTail.vowel} />
                    <InfoChip label="الشكل" value={bar.phoneticTail.syllableShape} />
                    <InfoChip label="الوزن" value={bar.phoneticTail.weight} />
                    <InfoChip label="التوقف" value={`${bar.restDuration}ms`} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const InfoChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded-full border border-zinc-800">
    <span className="text-[9px] text-zinc-600">{label}</span>
    <span className="text-[9px] font-mono text-zinc-400">{value}</span>
  </div>
);
export default BarInput;
