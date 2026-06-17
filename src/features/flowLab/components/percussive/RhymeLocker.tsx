import React, { useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Lock, Unlock, HelpCircle, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const RhymeLocker: React.FC = () => {
  const [selectedBeat, setSelectedBeat] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const textCells = useFlowLabStore((state) => state.textCells);
  const lockBeatRhymes = useFlowLabStore((state) => state.lockBeatRhymes);
  const removeRhymeLock = useFlowLabStore((state) => state.removeRhymeLock);

  const handleApplyLock = (beatIndex: number, type: 'internal' | 'final') => {
    lockBeatRhymes(beatIndex, type);
    
    const label = type === 'final' ? 'قافية روي نهائية' : 'قافية حشو داخلية';
    setSuccessMsg(`تم رصف وقفل ${label} على الدب العروضي للنبضة ${beatIndex + 1}!`);
    
    setSelectedBeat(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleClearAllLocks = () => {
    textCells.forEach(cell => {
      if (cell.rhymeLock) {
        removeRhymeLock(cell.id);
      }
    });
    setSuccessMsg('تم فك وتحرير جميع أقفال القافية للمشروع الحاضر.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Beats in a standard 4/4 bar
  const beats = [
    { index: 0, label: 'النبضة الأولى (Downbeat 1)', desc: 'موضع انطلاق الحكاية والعتبة الدلالية' },
    { index: 1, label: 'النبضة الثانية (Beat 2)', desc: 'موضع القافية الداخلية (الحشو العروضي)' },
    { index: 2, label: 'النبضة الثالثة (Beat 3)', desc: 'موضع التدريج وبناء الترقب للهيكل المعماري' },
    { index: 3, label: 'النبضة الرابعة (Accent Beat 4)', desc: 'موقف القافية النهائية (الروي والضرب)' },
  ];

  // Count active rhyme locks on each beat
  const getLockCount = (beatIndex: number) => {
    let internal = 0;
    let final = 0;

    textCells.forEach((cell) => {
      // Simplistic estimate mapping: if it falls inside matching beat quarter interval
      // In 4/4 time signature, each beat is ~ 60 / BPM.
      // We can check if rhymeLock is present and if it fits roughly in that index
      if (cell.rhymeLock) {
        const approxBeat = Math.floor(cell.startTime * 4) % 4;
        if (approxBeat === beatIndex) {
          if (cell.rhymeLock === 'internal') internal++;
          if (cell.rhymeLock === 'final') final++;
        }
      }
    });

    return { internal, final };
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right animate-fade-in" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Lock className="w-4 h-4 text-gold-400" />
          <span>مغلاق ومعاير القوافي النخرية (Prosody Rhyme Grid Locker)</span>
        </h3>
        <button
          onClick={handleClearAllLocks}
          className="text-[9px] text-red-400 hover:text-red-300 font-bold bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded transition-all cursor-pointer"
        >
          تحرير الكل
        </button>
      </div>

      <p className="text-[10px] text-text-secondary leading-relaxed">
        تحكم بسقوط قوافي القصيدة (سواء قوافي الروي النهائية أو قوافي الحشو الداخلية) برصفها تلقائياً على النبض الإيقاعي الدقيق للوصول لـ Flow محكم وسلس.
      </p>

      {/* Success notifier banner */}
      {successMsg && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-xl flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Beats listing */}
      <div className="space-y-2.5">
        {beats.map((beat) => {
          const { internal, final } = getLockCount(beat.index);
          const hasLock = internal > 0 || final > 0;
          const isSelected = selectedBeat === beat.index;

          return (
            <div
              key={beat.index}
              className={`p-3 bg-bg-base/40 border rounded-xl space-y-2 transition-all ${
                isSelected 
                  ? 'border-purple-500/50 bg-purple-500/5' 
                  : hasLock 
                  ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div 
                onClick={() => setSelectedBeat(isSelected ? null : beat.index)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-text-primary">
                    {beat.label}
                  </div>
                  <span className="text-[9px] text-text-muted block">
                    {beat.desc}
                  </span>
                </div>

                <div className="shrink-0 scale-90">
                  {hasLock ? (
                    <div className="flex gap-1.5">
                      {internal > 0 && (
                        <span className="text-[8px] bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-400/20 font-bold">
                          حشو: {internal}
                        </span>
                      )}
                      {final > 0 && (
                        <span className="text-[8px] bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold">
                          روي: {final}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-white/20" />
                  )}
                </div>
              </div>

              {/* Lock Configuration Popdown */}
              {isSelected && (
                <div className="pt-2.5 border-t border-white/5 grid grid-cols-2 gap-2 animate-fade-in">
                  <button
                    onClick={() => handleApplyLock(beat.index, 'internal')}
                    className="py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-bg-base font-black text-[9px] rounded-lg transition-all cursor-pointer"
                  >
                    قفل كـ قافية حشو داخلية
                  </button>
                  <button
                    onClick={() => handleApplyLock(beat.index, 'final')}
                    className="py-1.5 px-2 bg-purple-500 hover:bg-purple-600 text-white font-black text-[9px] rounded-lg transition-all cursor-pointer"
                  >
                    قفل كـ قافية روي نهائية
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 text-[9px] text-text-muted leading-relaxed font-sans">
        💡 <span className="font-bold text-text-secondary">مفهوم عروضي:</span> 
        <br />
        - <span className="text-emerald-400 font-bold">القافية الداخلية</span> تعطي تلوين رنان للـ Flow وسط البيت.
        <br />
        - <span className="text-purple-400 font-bold">القافية النهائية</span> هي مستقر إغلاق النبر وتكون قوية في الإلقاء.
      </div>
    </div>
  );
};
