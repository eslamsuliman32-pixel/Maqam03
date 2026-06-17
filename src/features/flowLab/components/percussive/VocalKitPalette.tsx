import React, { useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Volume2, Music, Copy, Check, Layers, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VocalSound {
  id: string;
  text: string;
  type: 'kick' | 'snare' | 'hihat' | 'other';
  category: string;
  description: string;
}

const VOCAL_KIT: VocalSound[] = [
  // Kick sounds (قرار عميق)
  { id: 'k1', text: 'بُوم', type: 'kick', category: 'قرار رنان', description: 'كيك عميق رنان' },
  { id: 'k2', text: 'دُوم', type: 'kick', category: 'قرار دافئ', description: 'كيك كلاسيكي دافئ' },
  { id: 'k3', text: 'بُم', type: 'kick', category: 'قرار جاف', description: 'ضربة بوم حادة' },
  { id: 'k4', text: 'طُوب', type: 'kick', category: 'قرار مخفف', description: 'كيك مقطوع هادئ' },
  
  // Snare sounds (جواب حاد)
  { id: 's1', text: 'بَاك', type: 'snare', category: 'جواب متفجر', description: 'سنير كلاسيكي مسموع' },
  { id: 's2', text: 'تَش', type: 'snare', category: 'جواب احتكاكي', description: 'سنير رملي خفيف' },
  { id: 's3', text: 'بْتْ', type: 'snare', category: 'جواب جاف', description: 'سنير مقطوع مشدود' },
  { id: 's4', text: 'طَق', type: 'snare', category: 'جواب طرقي', description: 'كلاب عربي تقليدي' },
  
  // Hi-hat sounds (صنجات رقيقة)
  { id: 'h1', text: 'تْسْ', type: 'hihat', category: 'صنج مغلق', description: 'هاي هات مغلق رقيق' },
  { id: 'h2', text: 'سِي', type: 'hihat', category: 'صنج مفتوح', description: 'هاي هات مفتوح ممدود' },
  { id: 'h3', text: 'شْ', type: 'hihat', category: 'صنج همسي', description: 'هاي هات غباري ناعم' },
  { id: 'h4', text: 'تِك', type: 'hihat', category: 'صنج طرقي', description: 'هاي هات معدني حاد' },
];

export const VocalKitPalette: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'kick' | 'snare' | 'hihat'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedCellIds = useFlowLabStore((state) => state.selectedCellIds);
  const updateCellText = useFlowLabStore((state) => state.updateCellText);

  const handleSoundClick = (sound: VocalSound) => {
    // If there is an active selection in the sequencer, update its syllables immediately!
    if (selectedCellIds && selectedCellIds.length > 0) {
      selectedCellIds.forEach((id) => {
        updateCellText(id, sound.text);
      });
    }

    // Also fallback copy to clipboard for perfect user convenience
    navigator.clipboard.writeText(sound.text);
    setCopiedId(sound.id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  const filteredKit = activeFilter === 'all' 
    ? VOCAL_KIT 
    : VOCAL_KIT.filter(s => s.type === activeFilter);

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right animate-fade-in" dir="rtl">
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Music className="w-4 h-4 text-gold-400" />
          <span>حقيبة السواكن والأصوات الإيقاعية اللفظية (Vocal Beatbox Kit Palette)</span>
        </h3>
        {selectedCellIds.length > 0 ? (
          <span className="text-[9px] text-gold-400 font-sans font-bold bg-gold-400/10 px-2.5 py-0.5 rounded border border-gold-400/25">
            نشط للتلقيم لـ {selectedCellIds.length} خلايا
          </span>
        ) : (
          <span className="text-[9px] text-text-muted font-mono font-bold bg-[#0a0d14] px-2 py-0.5 rounded">
            KIT: 12_SOUNDS
          </span>
        )}
      </div>

      {/* Categories Filter list */}
      <div className="flex gap-1 bg-[#0a0d14] p-1 rounded-xl border border-white/5 overflow-x-auto">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'kick', label: 'القرار (Kicks)' },
          { id: 'snare', label: 'الجواب (Snares)' },
          { id: 'hihat', label: 'الصنج (Hats)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`flex-1 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-gold-400 text-bg-base font-black'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of sounds */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filteredKit.map((sound) => {
            const isCopied = copiedId === sound.id;
            const colors = {
              kick: 'hover:border-red-500/20 hover:bg-red-500/[0.02]',
              snare: 'hover:border-blue-500/20 hover:bg-blue-500/[0.02]',
              hihat: 'hover:border-gold-400/20 hover:bg-gold-400/[0.02]',
              other: 'hover:border-white/10 hover:bg-white/[0.01]',
            };

            return (
              <motion.div
                key={sound.id}
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSoundClick(sound)}
                className={`p-3 bg-bg-base/40 border border-white/5 rounded-xl flex flex-col justify-between cursor-pointer transition-all ${colors[sound.type]} relative group`}
              >
                {/* Header info */}
                <div className="flex justify-between items-center">
                  <span className="text-[7px] text-text-muted font-black font-sans uppercase">
                    {sound.category}
                  </span>
                  
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-3 h-3 text-text-muted" />
                  </span>
                </div>

                {/* Big Arabic Syllable text */}
                <div className="my-2.5 text-center">
                  <span className="text-xl font-black text-text-primary group-hover:text-gold-400 transition-colors tracking-tight font-sans">
                    {sound.text}
                  </span>
                </div>

                {/* Description */}
                <span className="text-[9px] text-text-muted block font-sans truncate">
                  {sound.description}
                </span>

                {isCopied && (
                  <div className="absolute inset-0 bg-[#0a0d14]/90 rounded-xl flex items-center justify-center text-gold-400 text-[10px] font-bold border border-gold-400/30">
                    {selectedCellIds.length > 0 ? 'تم تلقيم المقاطع 🚀' : 'تم الـ نسخ ✔'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="text-[10px] text-text-muted leading-relaxed font-sans bg-bg-base p-2.5 rounded-xl border border-white/5">
        💡 <span className="font-bold text-text-secondary">ملاحظة:</span> حدد أي خلية في sequencer الـ 16 step أعلاه أولاً، ثم اضغط على مقطع من المجموعات لتغذية الكلمة فورياً.
      </div>
    </div>
  );
};
