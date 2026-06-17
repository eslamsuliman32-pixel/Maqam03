import React from 'react';
import { Sparkles, Music, Bookmark, PlusSquare } from 'lucide-react';
import { useFlowLabStore } from '../../store/flowLabSlice';

export const ScatTemplateBuilder: React.FC = () => {
  const addCell = useFlowLabStore((state) => state.addCell);

  const templates = [
    { title: 'دندنة عاطفية (Mmm-Ah)', syllables: ['مْ', 'مْ', 'آ', 'هْ'], desc: 'للفواصل الرائعة' },
    { title: 'نبرة سريعة (Da-Ba-Di)', syllables: ['دا', 'با', 'دي', 'أو'], desc: 'على إيقاعات التراب السريعة' },
    { title: 'همهمة قوية (Woh-Yeah)', syllables: ['وو', 'يا', 'أو', 'يا'], desc: 'للهوك والارتفاعات' }
  ];

  const handleApply = (syllables: string[]) => {
    syllables.forEach((s, idx) => {
      addCell({
        startTime: Date.now() / 1000 + idx * 0.4, // sequential fake starting offset
        duration: 0.35,
        text: s,
        type: 'combo',
        linkedPitch: 220 + idx * 20,
        barIndex: 0
      });
    });
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-gold-400" />
          <span>قوالب الدندنة والـ Scat (Phonetic Templates)</span>
        </h3>
        <span className="text-[9px] text-text-muted font-mono">SCAT_TEMPLATES</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {templates.map((temp) => (
          <div
            key={temp.title}
            className="p-3 bg-bg-base/30 border border-white/5 rounded-xl flex items-center justify-between hover:border-gold-400/20 transition-all select-none group"
          >
            <div>
              <h4 className="text-xs font-bold text-text-primary">{temp.title}</h4>
              <p className="text-[10px] text-text-muted mt-0.5">{temp.desc}</p>
              <div className="flex gap-1 mt-1.5" dir="ltr">
                {temp.syllables.map((s, idx) => (
                  <span key={idx} className="text-[10px] bg-white/5 text-gold-300 font-bold px-1.5 py-0.5 rounded border border-white/5">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleApply(temp.syllables)}
              className="p-1.5 bg-white/5 text-text-muted hover:text-gold-400 hover:bg-gold-400/10 rounded-lg transition-all cursor-pointer"
            >
              <PlusSquare className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
