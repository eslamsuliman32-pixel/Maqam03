import React from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Zap, Trash2, Volume2, Info, ChevronLeft } from 'lucide-react';

export const SpikeMarkerPanel: React.FC = () => {
  const textCells = useFlowLabStore((state) => state.textCells);
  const addSpike = useFlowLabStore((state) => state.addSpike);
  const removeSpike = useFlowLabStore((state) => state.removeSpike);
  const updateSpikeIntensity = useFlowLabStore((state) => state.updateSpikeIntensity);
  const selectCell = useFlowLabStore((state) => state.selectCell);
  const selectedCellIds = useFlowLabStore((state) => state.selectedCellIds);

  // Filter out cells that have active accent spikes
  const spikedCells = textCells.filter(cell => cell.spike?.active);

  const handleIntensityChange = (cellId: string, value: number) => {
    updateSpikeIntensity(cellId, value);
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold-400" />
          <span>تحديد وضبط مسامير النبر والضغط (Syllabic Accents Tuning)</span>
        </h3>
        <span className="text-[9px] text-[#cc3333] font-mono font-bold bg-[#cc3333]/10 px-2 py-0.5 rounded-lg">
          ACCENTS: {spikedCells.length}
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {spikedCells.map((cell) => {
          const intensityValue = cell.spike?.intensity || 0.8;
          const isSelected = selectedCellIds.includes(cell.id);

          return (
            <div
              key={cell.id}
              onClick={() => selectCell(cell.id)}
              className={`p-3.5 bg-bg-base/40 border rounded-xl space-y-2.5 transition-all cursor-pointer ${
                isSelected 
                  ? 'border-gold-400/50 bg-gold-400/5' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-text-primary tracking-wide">
                      {cell.text.replace('|', ' • ')}
                    </span>
                    <span className="text-[8px] text-text-muted font-mono bg-white/5 px-2 py-0.5 rounded">
                      {(cell.startTime).toFixed(2)}s
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted block font-sans">
                    النوع: {cell.type === 'combo' ? 'نبض مزدوج' : 'حرف صائت'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSpike(cell.id);
                  }}
                  className="p-1 px-2 rounded-lg bg-red-400/10 hover:bg-red-400/20 text-red-400 transition-all cursor-pointer"
                  title="إزالة المسمار النبريي"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slider tuning stress level */}
              <div className="space-y-1 bg-bg-base/50 p-2 rounded-lg border border-white/5">
                <div className="flex justify-between text-[10px] text-text-muted font-sans font-medium">
                  <span>قوة النبض (Accent Gain):</span>
                  <span className="text-gold-400 font-mono font-bold">
                    {Math.round(intensityValue * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={intensityValue}
                    onChange={(e) => handleIntensityChange(cell.id, parseFloat(e.target.value))}
                    className="flex-grow accent-gold-400 h-1 rounded bg-white/10 cursor-pointer"
                  />
                </div>
              </div>

              {/* Dynamic decibel style segments strip */}
              <div className="flex gap-1 h-1.5">
                {Array.from({ length: 12 }).map((_, i) => {
                  const threshold = i / 12;
                  const isActive = intensityValue >= threshold;
                  return (
                    <div
                      key={i}
                      className={`h-full flex-grow rounded-sm transition-all ${
                        isActive 
                          ? i > 9 
                            ? 'bg-red-500' // Peak level clip danger
                            : i > 6 
                            ? 'bg-gold-400' // High focus stress
                            : 'bg-emerald-500' // Soft stress
                          : 'bg-white/5'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {spikedCells.length === 0 && (
          <div className="text-center py-8 bg-bg-base/25 rounded-xl border border-white/5 border-dashed space-y-2">
            <Info className="w-10 h-10 text-text-muted mx-auto opacity-30" />
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              لا توجد مسامير نبر نشطة للبار الحالي.
            </p>
            <p className="text-[10px] text-gold-400/75 max-w-[200px] mx-auto font-medium">
              اضغط مزدوجاً على أجزاء الصوامت والمدود في اللوحة لمغنطة قمم الإلقاء مع الألحان!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
