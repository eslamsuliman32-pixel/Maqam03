import React from 'react';
import { Volume2, VolumeX, Disc, Radio, Check, Sliders } from 'lucide-react';
import { useFlowLabStore } from '../../store/flowLabSlice';

export const LeadIsolator: React.FC = () => {
  const activeLead = useFlowLabStore((state) => state.activeLeadInstrument);
  const setActiveLead = useFlowLabStore((state) => state.setActiveLeadInstrument);
  const result = useFlowLabStore((state) => state.analysisResult);

  const instruments = [
    { id: 'synth-lead', name: 'السينث القائد (Lead)', category: 'synth', db: -2.4, isMuted: false },
    { id: 'strings', name: 'الوتريات (Strings)', category: 'strings', db: -12.0, isMuted: false },
    { id: 'brass', name: 'النحاسيات (Brass)', category: 'brass', db: -6.0, isMuted: true },
    { id: 'vocal-lead', name: 'قناة الصوت الأساسية (Vocal)', category: 'vocal', db: 0.0, isMuted: false },
  ];

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gold-400" />
          <span>عزل الآلة وتصفية الحنجرة (Channel Isolator)</span>
        </h3>
        <span className="text-[9px] text-text-muted font-mono">CHANNELS_SOLO</span>
      </div>

      <div className="space-y-3">
        {instruments.map((inst) => {
          const isSelected = activeLead === inst.id;
          return (
            <div
              key={inst.id}
              onClick={() => setActiveLead(inst.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-gold-400/10 border-gold-400/30'
                  : 'bg-bg-base/30 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-gold-400/20 text-gold-400' : 'bg-white/5 text-text-muted'}`}>
                  {inst.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{inst.name}</h4>
                  <span className="text-[9px] text-text-muted font-mono">{inst.category.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-text-muted">{inst.db > 0 ? `+${inst.db}` : inst.db} dB</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-gold-400 bg-gold-400/20' : 'border-white/10'
                }`}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-gold-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
