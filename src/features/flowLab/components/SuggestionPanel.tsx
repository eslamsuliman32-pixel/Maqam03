import React, { useState } from 'react';
import { Sparkles, MessageCircle, AlertCircle, RefreshCw, Send, Check } from 'lucide-react';
import { useFlowLabStore } from '../store/flowLabSlice';

export const SuggestionPanel: React.FC = () => {
  const suggestions = useFlowLabStore((state) => state.suggestions);
  const loading = useFlowLabStore((state) => state.suggestionsLoading);
  const requestSuggestions = useFlowLabStore((state) => state.requestSuggestions);
  const applySuggestion = useFlowLabStore((state) => state.applySuggestion);

  const [promptInput, setPromptInput] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    requestSuggestions(promptInput);
    setPromptInput('');
  };

  return (
    <div className="p-5 space-y-6 h-full flex flex-col justify-between text-right" dir="rtl">
      <div className="space-y-6 flex-grow overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Sparkles className="w-5 h-5 text-gold-400" />
          <h2 className="text-sm font-black text-text-primary">مساعد رصف الأبيات العصبي</h2>
        </div>

        {/* Generate triggers */}
        <form onSubmit={handleGenerate} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="اكتب فكرة أو قافية (مثال: نبرة حماسية روي ن)"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full bg-bg-base/60 border border-white/5 rounded-xl pr-3 pl-10 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-gold-400/50"
            />
            <button
              type="submit"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gold-400 hover:text-gold-300 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Dynamic suggestion lists */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 text-gold-400 animate-spin" />
              <span className="text-[10px] text-text-muted">جاري توليد اقتراحات عروضية مناسبة...</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-bg-base/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-gold-400/20 transition-all group relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded-full">
                    المطابقة: {sug.fitScore.toFixed(1)}/10
                  </span>
                  <span className="text-[9px] text-text-muted font-mono">{sug.rhymeScheme}</span>
                </div>

                <p className="text-xs font-bold text-text-primary leading-relaxed">{sug.verse}</p>

                <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[9px]">
                  <div className="flex items-center gap-1">
                    {sug.emotionalTone.map((t) => (
                      <span key={t} className="bg-white/5 text-text-secondary px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => applySuggestion(sug.id)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-gold-400 hover:text-gold-300 transition-all font-bold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تطبيق الأبيات</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-text-muted text-xs space-y-1">
              <AlertCircle className="w-5 h-5 mx-auto text-text-muted" />
              <p>ادخل فكرتك عاليًا لبث الفلو العصبي</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-bg-base/30 border border-white/5 p-3 rounded-xl flex items-center gap-2.5">
        <MessageCircle className="w-4 h-4 text-gold-400/70" />
        <span className="text-[9px] text-text-secondary leading-relaxed">
          يتكامل مساعد الرصف مع كاشف القوافي والمسامير لضمان مطابقة الـ flow والوزن الصوتي التفاعلي للبيت.
        </span>
      </div>
    </div>
  );
};
