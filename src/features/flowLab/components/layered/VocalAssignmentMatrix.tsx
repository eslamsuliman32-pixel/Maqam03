import React, { useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Check, Columns, Shuffle, Sparkles, CheckSquare, Layers } from 'lucide-react';

interface SyllablePreset {
  attackType: 'explosive' | 'fricative' | 'nasal' | 'none';
  attackChar: string;
  sustainType: 'short' | 'medium' | 'long';
  sustainChar: string;
}

const ATTACK_CHARS = {
  explosive: ['ب', 'ت', 'د', 'ط', 'ك', 'ق'],
  fricative: ['ف', 'س', 'ش', 'ص', 'ح', 'خ'],
  nasal: ['م', 'ن'],
  none: [''],
};

const SUSTAIN_CHARS = {
  short: ['َ', 'ِ', 'ُ'], // Short diacritics
  medium: ['ا', 'و', 'ي'],
  long: ['آ', 'وو', 'يي'],
};

export const VocalAssignmentMatrix: React.FC = () => {
  const textCells = useFlowLabStore((state) => state.textCells);
  const updateCellText = useFlowLabStore((state) => state.updateCellText);
  const setCellType = useFlowLabStore((state) => state.setCellType);

  // Buffer state to keep assignments before committing
  const [localPresets, setLocalPresets] = useState<Record<string, SyllablePreset>>({});

  // Display only first 5 cells for concise and clean scrolling
  const visibleCells = textCells.slice(0, 5);

  const initCellPreset = (cellId: string): SyllablePreset => {
    // Return existing preset if found
    if (localPresets[cellId]) return localPresets[cellId];

    // Read current text from store and separate base elements if possible
    const cellValue = textCells.find(c => c.id === cellId)?.text || '';
    const parts = cellValue.split('|');
    const attackVal = parts[0] || '';
    const sustainVal = parts[1] || parts[0] || '';

    return {
      attackType: attackVal ? 'explosive' : 'none',
      attackChar: attackVal || 'ب',
      sustainType: sustainVal.length > 1 ? 'long' : 'medium',
      sustainChar: sustainVal || 'ا',
    };
  };

  const handleFieldChange = (cellId: string, updates: Partial<SyllablePreset>) => {
    const current = initCellPreset(cellId);
    setLocalPresets({
      ...localPresets,
      [cellId]: { ...current, ...updates },
    });
  };

  // Auto suggest syllables based on the associated beat transient template
  const handleAutoSuggest = () => {
    const freshPresets: Record<string, SyllablePreset> = { ...localPresets };

    visibleCells.forEach((cell) => {
      let attackType: SyllablePreset['attackType'] = 'none';
      let attackChar = '';
      let sustainType: SyllablePreset['sustainType'] = 'medium';
      let sustainChar = 'ا';

      if (cell.linkedBeat === 'kick') {
        attackType = 'explosive';
        attackChar = 'ب';
        sustainType = 'long';
        sustainChar = 'وو';
      } else if (cell.linkedBeat === 'snare') {
        attackType = 'explosive';
        attackChar = 'ت';
        sustainType = 'short';
        sustainChar = 'َ';
      } else if (cell.linkedBeat === 'hihat') {
        attackType = 'fricative';
        attackChar = 'س';
        sustainType = 'short';
        sustainChar = 'ِ';
      }

      freshPresets[cell.id] = {
        attackType,
        attackChar,
        sustainType,
        sustainChar,
      };
    });

    setLocalPresets(freshPresets);
  };

  // Commit preset to store state
  const handleApplySingle = (cellId: string) => {
    const preset = initCellPreset(cellId);
    const combinedSyllable = preset.attackChar 
      ? `${preset.attackChar}|${preset.sustainChar}` 
      : preset.sustainChar;

    updateCellText(cellId, combinedSyllable);
    setCellType(cellId, preset.attackChar ? 'combo' : 'vowel');
  };

  const handleApplyAll = () => {
    visibleCells.forEach((cell) => {
      handleApplySingle(cell.id);
    });
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/5 pb-3">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Columns className="w-4 h-4 text-gold-400" />
          <span>مصفوفة توزيع السواكن والصوائت الجدارية (Vocal Allocation Grid)</span>
        </h3>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAutoSuggest}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gold-400/10 hover:bg-gold-400/20 text-gold-300 border border-gold-400/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
            title="توليد تلقائي مبني على نوع Transient المكتشف للبيت"
          >
            <Shuffle className="w-3 h-3" />
            <span>اقتراح تلقائي</span>
          </button>
          <button
            onClick={handleApplyAll}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gold-400 hover:bg-gold-500 text-bg-base rounded-xl text-[10px] font-black transition-all cursor-pointer"
          >
            <CheckSquare className="w-3 h-3" />
            <span>تطبيق على الموازير</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {visibleCells.map((cell, index) => {
          const preset = initCellPreset(cell.id);

          return (
            <div 
              key={cell.id} 
              className="bg-bg-base/40 p-3.5 rounded-xl border border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
            >
              {/* Cell Label & Metadata */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted font-sans font-bold">
                    الخلية #{index + 1}
                  </span>
                  {cell.linkedBeat && (
                    <span className="text-[8px] bg-white/5 border border-white/10 text-gold-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      {cell.linkedBeat.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-xs font-black text-text-primary tracking-wide">
                  الحالي: <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-gold-300">{cell.text || '—'}</span>
                </div>
              </div>

              {/* Input selects columns */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Consonant/Attack Selection */}
                <div className="space-y-1 text-right">
                  <span className="text-[8px] text-text-muted block font-sans">نوع ساكن الهجوم</span>
                  <div className="flex gap-1.5">
                    <select
                      value={preset.attackType}
                      onChange={(e) => {
                        const nextType = e.target.value as SyllablePreset['attackType'];
                        const list = ATTACK_CHARS[nextType];
                        handleFieldChange(cell.id, {
                          attackType: nextType,
                          attackChar: list[0] || '',
                        });
                      }}
                      className="bg-[#0a0d14] text-[10px] font-bold text-text-secondary border border-white/5 rounded px-2 py-1 outline-none"
                    >
                      <option value="explosive">انفجاري (K/T/Q)</option>
                      <option value="fricative">احتكاكي (F/S/Kh)</option>
                      <option value="nasal">أنفي (M/N)</option>
                      <option value="none">بدون ساكن</option>
                    </select>

                    {preset.attackType !== 'none' && (
                      <select
                        value={preset.attackChar}
                        onChange={(e) => handleFieldChange(cell.id, { attackChar: e.target.value })}
                        className="bg-[#0a0d14] text-xs font-black text-gold-400 border border-white/10 rounded px-2.5 py-1 outline-none"
                      >
                        {ATTACK_CHARS[preset.attackType].map((char) => (
                          <option key={char} value={char}>{char}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Vowel/Sustain Selection */}
                <div className="space-y-1 text-right">
                  <span className="text-[8px] text-text-muted block font-sans">نوع صائت المد</span>
                  <div className="flex gap-1.5">
                    <select
                      value={preset.sustainType}
                      onChange={(e) => {
                        const nextType = e.target.value as SyllablePreset['sustainType'];
                        const list = SUSTAIN_CHARS[nextType];
                        handleFieldChange(cell.id, {
                          sustainType: nextType,
                          sustainChar: list[0] || 'ا',
                        });
                      }}
                      className="bg-[#0a0d14] text-[10px] font-bold text-text-secondary border border-white/5 rounded px-2 py-1 outline-none"
                    >
                      <option value="short">قصير (حركات)</option>
                      <option value="medium">متوسط (ألف/واو)</option>
                      <option value="long">طويل (مدود طويلة)</option>
                    </select>

                    <select
                      value={preset.sustainChar}
                      onChange={(e) => handleFieldChange(cell.id, { sustainChar: e.target.value })}
                      className="bg-[#0a0d14] text-xs font-black text-gold-400 border border-white/10 rounded px-2.5 py-1 outline-none"
                    >
                      {SUSTAIN_CHARS[preset.sustainType].map((char) => (
                        <option key={char} value={char}>{char}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview & Apply Action */}
              <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0">
                <div className="text-right">
                  <span className="text-[8px] text-text-muted block font-sans">المعاينة</span>
                  <span className="text-sm font-black text-gold-300 font-sans tracking-tight">
                    {preset.attackChar}{preset.sustainChar}
                  </span>
                </div>
                <button
                  onClick={() => handleApplySingle(cell.id)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-gold-400/10 hover:text-gold-300 border border-white/5 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
