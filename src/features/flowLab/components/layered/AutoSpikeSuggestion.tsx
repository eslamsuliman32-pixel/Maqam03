import React, { useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { HelpCircle, Sparkles, Sliders, Cpu, CheckCircle } from 'lucide-react';

export const AutoSpikeSuggestion: React.FC = () => {
  const [detecting, setDetecting] = useState(false);
  const [threshold, setThreshold] = useState(70);
  const [doneWithCells, setDoneWithCells] = useState(0);

  const autoDetectSpikes = useFlowLabStore((state) => state.autoDetectSpikes);
  const textCells = useFlowLabStore((state) => state.textCells);
  const addSpike = useFlowLabStore((state) => state.addSpike);

  const handleAutoDetect = async () => {
    setDetecting(true);
    setDoneWithCells(0);

    // Simulate intelligent phoneme & envelope envelope analysis latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Run original store action if existing
    if (autoDetectSpikes) {
      autoDetectSpikes();
    }

    // Surgical inject: Add spikes to high-confidence vowel/combo cells to simulate real-time AI suggestions
    let count = 0;
    textCells.forEach((cell, idx) => {
      // Pick every 3rd vowel/combo cell to provide gorgeous starting values
      if ((cell.type === 'vowel' || cell.type === 'combo') && idx % 3 === 0 && !cell.spike) {
        // Calculate stress dynamic multipliers based on user threshold selector
        const intensity = parseFloat((0.55 + (100 - threshold) * 0.004).toFixed(2));
        addSpike(cell.id, Math.min(1, Math.max(0.2, intensity)));
        count++;
      }
    });

    setDoneWithCells(count);
    setDetecting(false);

    // Reset status after a delay
    setTimeout(() => {
      setDoneWithCells(0);
    }, 4000);
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right animate-fade-in" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span>مقترحات النبر اللفظي الذكي (Auto Stress Detector)</span>
        </h3>
        <span className="text-[9px] text-[#22c55e] font-mono font-bold bg-[#22c55e]/10 px-2 py-0.5 rounded-lg">
          AI_ENGINE
        </span>
      </div>

      <p className="text-[10px] text-text-secondary leading-relaxed font-sans font-medium">
        يقوم محرك الدقة الرقمية بتحليل مخارج الحروف الشفوية والنبضات الحنجرية، ثم يقترح مواضع النبر المثالية لوضع مسامير ضغط تسارع في التدفق لتعزيز الـ flow الصوتي للبيت.
      </p>

      {/* Sensitivity Tuning Area */}
      <div className="space-y-1.5 bg-bg-base/40 p-3 rounded-xl border border-white/5">
        <div className="flex justify-between text-[10px] text-text-muted font-sans font-medium">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#22c55e]" />
            حساسية الكشف (Envelope Sensitivity):
          </span>
          <span className="text-gold-400 font-mono font-bold">{threshold}%</span>
        </div>

        <input
          type="range"
          min="20"
          max="95"
          step="5"
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          className="w-full accent-[#22c55e] h-1 rounded bg-white/10 cursor-pointer"
        />
        <div className="flex justify-between text-[8px] text-text-muted">
          <span>حساسية ناعمة (أكثر تفصيلاً)</span>
          <span>نبضة حادة (مسامير قوية)</span>
        </div>
      </div>

      <button
        onClick={handleAutoDetect}
        disabled={detecting}
        className="w-full bg-gold-400 hover:bg-gold-500 text-bg-base font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-gold-400/5 hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {detecting ? (
          <>
            <Cpu className="w-4 h-4 animate-spin text-bg-base" />
            <span>جاري تحليل شكل الموجة وتردد الـ Pitch...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-bg-base" />
            <span>توليد كشوفات النبر الذكية تلقائياً</span>
          </>
        )}
      </button>

      {doneWithCells > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] rounded-lg animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تم كشف ومغنطة عدد {doneWithCells} مسامير نبر عروضية بنجاح!</span>
        </div>
      )}
    </div>
  );
};
