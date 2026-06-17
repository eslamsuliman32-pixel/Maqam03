import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Copy, Plus, Loader2, Wand2 } from "lucide-react";
import { geminiService } from "../services/geminiService";

interface AISuggestionsPanelProps {
  currentText: string;
  onSelect: (text: string) => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  currentText,
  onSelect,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = async () => {
    if (!currentText.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const results = await (geminiService as any).generateCreativeFollowUp(
        currentText,
        3,
      );
      setSuggestions(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> AI Flow Director
        </h3>

        <button
          onClick={generateSuggestions}
          disabled={!currentText.trim() || isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 bg-gold-400/10 border border-gold-400/20 rounded-lg text-[9px] font-black uppercase text-gold-400 hover:bg-gold-400/20 transition-all disabled:opacity-30"
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wand2 className="w-3 h-3" />
          )}
          توليد اقتراحات
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.1 }}
              className="group p-4 bg-bg-base/40 border border-white/5 rounded-2xl hover:border-gold-400/30 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => onSelect(suggestion)}
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-gold-400 rounded-lg flex items-center justify-center">
                  <Plus className="w-3 h-3 text-bg-base" />
                </div>
              </div>

              <p className="text-sm font-bold text-text-primary leading-relaxed text-right dir-rtl mb-2">
                {suggestion}
              </p>

              <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[8px] font-mono uppercase tracking-widest">
                  Matched DNA
                </span>
              </div>
            </motion.div>
          ))}

          {!isGenerating && suggestions.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center opacity-20 gap-3 border-2 border-dashed border-white/5 rounded-3xl">
              <Sparkles className="w-8 h-8" />
              <p className="text-[9px] font-mono uppercase tracking-widest max-w-[150px]">
                Write your primary bar and click generate for AI flow expansions
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
