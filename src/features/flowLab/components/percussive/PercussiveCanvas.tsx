import React, { useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Activity, Plus, Trash2, Edit, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const GRID_SUBDIVISIONS = 16; 

export const PercussiveCanvas: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const analysisResult = useFlowLabStore((state) => state.analysisResult);
  const textCells = useFlowLabStore((state) => state.textCells);
  const updateCellText = useFlowLabStore((state) => state.updateCellText);
  const addCell = useFlowLabStore((state) => state.addCell);
  const removeCell = useFlowLabStore((state) => state.removeCell);

  if (!analysisResult || !analysisResult.bars || analysisResult.bars.length === 0) {
    return (
      <div className="p-8 text-center bg-bg-surface/50 border border-white/5 rounded-2xl text-text-muted" dir="rtl">
        <span>يرجى رفع ملف صوتي أولاً لبناء الشبكة الإيقاعية...</span>
      </div>
    );
  }

  // Focus on the first active bar to allow clean step-sequencer style syllables entry
  const currentBar = analysisResult.bars[0];
  const barDuration = currentBar.endTime - currentBar.startTime;
  const slotDuration = barDuration / GRID_SUBDIVISIONS;

  // Construct the slots array mapping subdivisions
  const slots = Array.from({ length: GRID_SUBDIVISIONS }).map((_, index) => {
    const slotTime = currentBar.startTime + (index * slotDuration);
    
    // Find if a transient/beat intersects with this slot window (padding 50ms)
    const beat = analysisResult.beatGrid.find(
      (b) => Math.abs(b.time - slotTime) < (slotDuration / 2) + 0.05
    );

    // Find any syllable cells placed at this slot time
    const cell = textCells.find(
      (c) => Math.abs(c.startTime - slotTime) < (slotDuration / 2) + 0.05
    );

    return {
      index,
      time: slotTime,
      hasBeat: !!beat,
      beatType: beat?.type,
      beatIntensity: beat?.intensity || 0,
      cell,
    };
  });

  const handleSlotClick = (index: number) => {
    const slot = slots[index];
    
    if (slot.cell) {
      // Modify existing syllable
      const currentVal = slot.cell.text || '';
      const newVal = window.prompt('تعديل المقطع الصوتي الإيقاعي للخلية:', currentVal);
      if (newVal !== null) {
        updateCellText(slot.cell.id, newVal);
      }
    } else {
      // Create new syllable cell at this timestamp
      const newVal = window.prompt('أدخل مقطعاً صوتياً إيقاعياً جديداً لربطه بهذه الخانة (مثال: طق، دوم، بوم):');
      if (newVal) {
        addCell({
          startTime: slot.time,
          duration: slotDuration,
          text: newVal,
          type: 'consonant',
          linkedBeat: slot.beatType || null,
          barIndex: currentBar.index,
        });
      }
    }
  };

  const handleSlotRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const slot = slots[index];
    if (slot.cell) {
      const confirmRemove = window.confirm('هل تريد حذف هذه الخلية الإيقاعية اللفظية؟');
      if (confirmRemove) {
        removeCell(slot.cell.id);
      }
    }
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right animate-fade-in" dir="rtl">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold-400" />
          <span>شبكة محاذاة اللسانيات الإيقاعية لـ 16 خانة (Percussive Syllables 16-Step Step Sequencer)</span>
        </h3>
        <span className="text-[10px] text-text-muted font-sans font-bold bg-[#0a0d14] px-2.5 py-1 rounded-md border border-white/5">
          المازورة #1 (Bar 1)
        </span>
      </div>

      <div className="space-y-4">
        {/* Step sequencer 16 segment grid, responsive columns */}
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
          {slots.map((slot) => {
            const hasCell = !!slot.cell;
            const hasBeat = slot.hasBeat;
            const isHovered = hoveredIdx === slot.index;

            const beatColors = {
              kick: 'border-red-500/50 bg-red-500/5 shadow-[0_0_8px_rgba(239,68,68,0.1)]',
              snare: 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_8px_rgba(59,130,246,0.1)]',
              hihat: 'border-gold-400/50 bg-gold-400/5 shadow-[0_0_8px_rgba(212,160,23,0.1)]',
              other: 'border-white/10 bg-white/[0.01]',
            };

            const transientLabelColors = {
              kick: 'text-red-400',
              snare: 'text-blue-400',
              hihat: 'text-gold-400',
              other: 'text-text-muted',
            };

            const slotBorder = hasCell
              ? 'border-gold-400 bg-gold-400/10'
              : hasBeat && slot.beatType
              ? beatColors[slot.beatType] || beatColors.other
              : 'border-white/5 bg-[#0a0d14] hover:bg-white/[0.02]';

            return (
              <motion.div
                key={slot.index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredIdx(slot.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => handleSlotClick(slot.index)}
                onContextMenu={(e) => handleSlotRightClick(e, slot.index)}
                className={`aspect-square rounded-xl border flex flex-col justify-between p-2 cursor-pointer transition-all ${slotBorder} select-none relative`}
                title={`الخانة ${slot.index + 1} - اضغط للتعديل، باليمين للحذف`}
              >
                {/* Step indicator */}
                <span className={`text-[8px] font-mono font-black ${hasCell ? 'text-gold-400' : 'text-text-muted'}`}>
                  {String(slot.index + 1).padStart(2, '0')}
                </span>

                {/* Syllable text */}
                {hasCell ? (
                  <div className="absolute inset-0 flex items-center justify-center p-1">
                    <span className="text-sm font-black text-white font-sans text-center tracking-tight truncate">
                      {slot.cell?.text}
                    </span>
                  </div>
                ) : (
                  hasBeat && (
                    <span className={`text-[8px] font-sans font-bold block text-center truncate ${transientLabelColors[slot.beatType || 'other']}`}>
                      {(slot.beatType || '').toUpperCase()}
                    </span>
                  )
                )}

                {/* Status dot or Rhyme lock indicators */}
                <div className="flex gap-1 justify-end h-1 items-center shrink-0">
                  {slot.cell?.rhymeLock && (
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${
                        slot.cell.rhymeLock === 'final' ? 'bg-purple-400 shadow-[0_0_4px_rgba(168,85,247,0.5)]' : 'bg-emerald-400'
                      }`} 
                      title={slot.cell.rhymeLock === 'final' ? 'قافية نهائية مقفلة' : 'قافية داخلية مقفلة'}
                    />
                  )}
                  {hasBeat && !slot.cell?.rhymeLock && (
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend color key */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500/10 border border-red-500/30 rounded" />
            <span>KICK (دقة قرار)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500/10 border border-blue-500/30 rounded" />
            <span>SNARE (دقة جواب حادة)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded" />
            <span>HI-HAT (صنجات هجاء)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-gold-400 rounded" />
            <span>خلية لفظية معبأة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-purple-400 rounded-full" />
            <span>موضع قافية نهائية</span>
          </div>
        </div>

        <div className="p-3 bg-[#0a0d14] rounded-xl border border-white/5 flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed font-sans">
            طريقة الاستخدام: انقر على أي خانة شاغرة لإدراج مقطع إيقاعي أو صامت. اضغط بالزر الأيمن للفارة على المقطع لحذفه فورياً.
          </p>
        </div>
      </div>
    </div>
  );
};
