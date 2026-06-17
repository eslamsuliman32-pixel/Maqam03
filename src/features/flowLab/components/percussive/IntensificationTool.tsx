import React, { useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { FastForward, Zap, Eye, HelpCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const IntensificationTool: React.FC = () => {
  const [selectedBarIdx, setSelectedBarIdx] = useState(0);
  const [intensifyMode, setIntensifyMode] = useState<'double' | 'triple' | 'custom'>('double');
  const [customMultiplier, setCustomMultiplier] = useState(4);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const textCells = useFlowLabStore((state) => state.textCells);
  const analysisResult = useFlowLabStore((state) => state.analysisResult);
  const addCell = useFlowLabStore((state) => state.addCell);

  const bars = analysisResult?.bars || [];

  const handleIntensify = () => {
    if (bars.length === 0) return;

    const targetBar = bars[selectedBarIdx] || bars[0];
    const barCells = textCells.filter(
      (c) => c.startTime >= targetBar.startTime && c.startTime < targetBar.endTime
    );

    const multiplier = intensifyMode === 'double' ? 2 : intensifyMode === 'triple' ? 3 : customMultiplier;

    let addedCount = 0;
    // Iterate through current syllable gaps to inject intermediate rapid syllables
    if (barCells.length > 1) {
      for (let i = 0; i < barCells.length - 1; i++) {
        const current = barCells[i];
        const next = barCells[i + 1];
        const gap = next.startTime - (current.startTime + current.duration);

        // If there's enough physical time space, split it based on multiplier
        if (gap > 0.15) {
          const insertCount = multiplier - 1;
          const block = gap / multiplier;

          for (let k = 0; k < insertCount; k++) {
            const start = current.startTime + current.duration + (k * block);
            addCell({
              startTime: start,
              duration: block * 0.85,
              text: '—', // Placeholder syllable
              type: 'consonant',
              barIndex: targetBar.index,
            });
            addedCount++;
          }
        }
      }
    } else {
      // In case there is only one or zero cells, split the sequencer slots uniformly
      const duration = targetBar.duration || 2.5;
      const step = duration / (16 * multiplier);
      for (let k = 1; k <= 8; k += 2) {
        addCell({
          startTime: targetBar.startTime + (k * step),
          duration: step * 0.9,
          text: '—',
          type: 'consonant',
          barIndex: targetBar.index,
        });
        addedCount++;
      }
    }

    setSuccessCount(addedCount);
    setTimeout(() => setSuccessCount(null), 3000);
  };

  // Yield estimation calculations
  const getEstimation = () => {
    if (bars.length === 0) return { original: 0, forecast: 0 };
    const targetBar = bars[selectedBarIdx] || bars[0];
    const originalCount = textCells.filter(
      (c) => c.startTime >= targetBar.startTime && c.startTime < targetBar.endTime
    ).length;

    const multiplier = intensifyMode === 'double' ? 2 : intensifyMode === 'triple' ? 3 : customMultiplier;
    // Estimate: add multiplier-1 slots for existing gaps
    const predictedNew = originalCount > 1 ? (originalCount - 1) * (multiplier - 1) : 4;

    return {
      original: originalCount,
      forecast: originalCount + predictedNew,
    };
  };

  const preview = getEstimation();

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right animate-fade-in" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <FastForward className="w-4 h-4 text-gold-400" />
          <span>مُضاعف وتقسيم سرعة السيلابات (Dynamic Flow Intensifier)</span>
        </h3>
        <span className="text-[9px] text-[#eab308] font-mono font-bold bg-[#eab308]/10 px-2 py-0.5 rounded">
          RAP_FAST_ID
        </span>
      </div>

      <p className="text-[10px] text-text-secondary leading-relaxed">
        أدرج تقطيعات شجرية إضافية سريعة بنظام Double-time أو Triple-time أوتوماتيكياً لملء المساحات ومضاعفة كثافة سيلابات الـ Flow الصامتة.
      </p>

      {/* Success alert banner */}
      {successCount !== null && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-xl flex items-center gap-1.5 leading-snug">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>تم بنجاح حقن عدد {successCount} سيلابات فارغة بانتظام! املأ الحروف الآن في الشاشات العلوية 🚀</span>
        </div>
      )}

      {/* Target Bar Selector */}
      <div className="space-y-1">
        <span className="text-[10px] text-text-muted font-sans font-medium block">تحديد المازورة المستهدفة:</span>
        <select
          value={selectedBarIdx}
          onChange={(e) => setSelectedBarIdx(parseInt(e.target.value))}
          className="w-full bg-[#0a0d14] text-xs font-bold text-text-primary border border-white/5 rounded-xl px-3 py-2 outline-none"
        >
          {bars.length > 0 ? (
            bars.map((bar, idx) => (
              <option key={idx} value={idx}>
                المازورة #{idx + 1} ({bar.startTime.toFixed(1)}s - {bar.endTime.toFixed(1)}s)
              </option>
            ))
          ) : (
            <option value={0}>المازورة الافتراضية #1</option>
          )}
        </select>
      </div>

      {/* Intensification multipliers area */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-text-muted font-sans font-medium block">معامل التكثيف والتقسيم:</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'double', label: 'Double (×2)' },
            { id: 'triple', label: 'Triple (×3)' },
            { id: 'custom', label: 'مخصص' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setIntensifyMode(mode.id as any)}
              className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                intensifyMode === mode.id
                  ? 'bg-gold-400 text-bg-base font-black shadow-lg shadow-gold-400/5'
                  : 'bg-white/5 text-text-muted hover:text-text-primary'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Custom multiplier slider */}
        {intensifyMode === 'custom' && (
          <div className="space-y-1 bg-[#0a0d14] p-3 rounded-xl border border-white/5 animate-fade-in mt-1">
            <div className="flex justify-between text-[9px] text-text-muted font-sans">
              <span>تكرار التقسيم المخصص:</span>
              <span className="text-gold-400 font-bold font-mono">×{customMultiplier}</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={customMultiplier}
              onChange={(e) => setCustomMultiplier(parseInt(e.target.value))}
              className="w-full accent-gold-400 h-1 rounded bg-white/10 cursor-pointer"
            />
            <div className="flex justify-between text-[7px] text-text-muted font-mono">
              <span>×2 (دبل)</span>
              <span>×8 (تنغيم فائق)</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Live Forecast / Estimation area */}
      <div className="p-3 bg-bg-base/50 rounded-xl border border-white/5 flex items-center justify-between font-sans">
        <div className="text-right">
          <span className="text-[8px] text-text-muted block">السيلابات الحالية</span>
          <span className="text-sm font-black text-text-primary font-sans">
            {preview.original}
          </span>
        </div>

        <div className="text-gold-400 shrink-0 transform rotate-180 scale-90">
          <Eye className="w-5 h-5 opacity-40 animate-pulse" />
        </div>

        <div className="text-right">
          <span className="text-[8px] text-text-muted block">التوقع بعد المكاملة</span>
          <span className="text-sm font-black text-gold-400 font-sans">
            {preview.forecast}
          </span>
        </div>
      </div>

      {/* Apply Trigger Action Button */}
      <button
        onClick={handleIntensify}
        className="w-full bg-[#1e293b] hover:bg-[#334155] border border-white/5 hover:border-gold-400/20 text-gold-400 hover:text-gold-300 font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        <span>تطبيق مكاملة التكثيف الصوتي</span>
      </button>

      <div className="p-2 bg-[#0a0d14] rounded-xl border border-white/5 text-[9px] text-text-muted leading-relaxed font-sans flex items-start gap-1.5">
        <HelpCircle className="w-3 h-3 text-gold-400 shrink-0 mt-0.5" />
        <span>سيقوم محرك التكثيف بحساب زمن السكوت وحقن مقاطع ساكنة فارغة (—) بانتظام عروضي دقيق ليسهل عليك تعبئتها بالكلمات.</span>
      </div>
    </div>
  );
};
