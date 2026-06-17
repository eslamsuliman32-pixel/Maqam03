import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Trash2,
  Search,
  Zap,
  Activity,
  CheckCircle2,
  Copy,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Bar } from "../store/repositoryStore";
import { useEditorStore } from "../store/editorStore";
import { DigitalLabel } from "./DigitalLabel";
import { accentScanner } from "../services/accentScanner";
import { moraEngine } from "../services/moraEngine";
import { MatchScoreBadge, SmartSuggestButton } from "./SmartSuggestionsIntegrations";
import { buildHighlightMap } from "../lib/arabic-prosody/normalizer";

// ===== ثوابت الألوان لتمييز البصمة =====

const HIGHLIGHTCOLORS: Record<"vowel" | "rhythm" | "groove", string> = {
  vowel:  "rgba(99,  102, 241, 0.35)", // بنفسجي — تناغم صوتي
  rhythm: "rgba(34,  197, 94,  0.30)", // أخضر   — تطابق وزني
  groove: "rgba(251, 146, 60,  0.35)", // برتقالي — تطابق إقرعي
};

const SignatureHighlight = ({ text, bar }: { text: string; bar: Bar }) => {
  const highlights = React.useMemo(() => {
    if (!bar.signatureMatch || !bar.digitalSignature) return [];

    return buildHighlightMap(
      text,
      bar.digitalSignature.vowelMatrix,
      bar.signatureMatch.bestVowelWindow
    );
  }, [text, bar]);

  if (highlights.length === 0) {
    return <span>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  const sorted = [...highlights].sort((a, b) => a.start - b.start);

  for (const hl of sorted) {
    if (hl.start > cursor) {
      parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor, hl.start)}</span>);
    }
    parts.push(
      <span
        key={`hl-${hl.start}`}
        className="rounded transition-all duration-300 px-[1px]"
        style={{ backgroundColor: HIGHLIGHTCOLORS[hl.type] }}
        title={`${hl.type} match`}
      >
        {text.slice(hl.start, hl.end)}
      </span>
    );
    cursor = hl.end;
  }

  if (cursor < text.length) {
    parts.push(<span key="plain-end">{text.slice(cursor)}</span>);
  }

  return <>{parts}</>;
};

const EliteMatchScoreBadge = ({ breakdown }: { breakdown: any }) => {
  const { rhythmScore, vowelScore, grooveScore, totalScore, dominantMatch } = breakdown;
  
  const dominantColor: Record<string, string> = {
    rhythm: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    vowel:  "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
    groove: "border-orange-500/30 text-orange-400 bg-orange-500/10",
    none:   "border-white/20 text-white/60 bg-white/5",
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-lg border text-[9px] font-mono font-bold transition-all ${dominantColor[dominantMatch] || dominantColor.none}`}
      title={`Rhythm: ${rhythmScore}% | Vowel: ${vowelScore}% | Groove: ${grooveScore}%`}
    >
      <span className="text-[10px]">{totalScore}%</span>
      <span className="opacity-50">R{rhythmScore} V{vowelScore} G{grooveScore}</span>
    </div>
  );
};

interface BarCardProps {
  bar: Bar;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onFindSimilar?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export const BarCard = React.memo(
  ({
    bar,
    onDelete,
    onToggleFavorite,
    onFindSimilar,
    isSelected,
    onToggleSelection,
  }: BarCardProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const trait = moraEngine.getPhoneticTrait(bar.text);
    const injectBar = useEditorStore((state) => state.injectBar);

    const getAccentColor = () => {
      if (bar.isFavorite) return "text-gold-400";
      if (trait.includes("شديدة")) return "text-quality-high";
      if (trait.includes("متوسطة")) return "text-quality-medium";
      return "text-purple-400";
    };

    const getCardBaseColor = () => {
      if (bar.isFavorite) return "rgba(212, 160, 23, 0.4)";
      if (trait.includes("شديدة")) return "rgba(16, 185, 129, 0.4)";
      if (trait.includes("متوسطة")) return "rgba(245, 158, 11, 0.4)";
      return "rgba(139, 92, 246, 0.4)";
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={`group rounded-3xl transition-all duration-500 overflow-hidden bg-bg-surface/30 border backdrop-blur-xl flex flex-col ${isSelected ? "border-gold-400 ring-4 ring-gold-400/20 bg-gold-400/5" : "border-white/5 hover:border-white/10"}`}
      >
        <div className="p-5 flex-1 cursor-pointer" onClick={onToggleSelection}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 ${isSelected ? "bg-gold-400 border-gold-400" : "border-border-default group-hover:border-gold-400/50"}`}
              >
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-bg-base" />
                )}
              </div>
              <div
                className={`px-2 py-0.5 bg-bg-elevated/50 border border-border-default rounded font-mono text-[9px] font-bold tracking-wider ${getAccentColor()}`}
              >
                {bar.serialNumber}
              </div>
            </div>

            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleFavorite?.(bar.id)}
                className={`p-1.5 rounded-lg transition-all ${bar.isFavorite ? "text-gold-400 bg-gold-400/10 border border-gold-400/20" : "text-text-muted hover:text-gold-400 border border-transparent"}`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${bar.isFavorite ? "fill-current" : ""}`}
                />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete?.(bar.id)}
                className="p-1.5 text-text-muted hover:text-quality-low rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          <div className="mb-6">
            <p
              className={`text-xl sm:text-2xl font-black mb-2 leading-tight transition-colors duration-500 text-right ${isSelected ? "text-gold-400" : "text-text-primary"}`}
              dir="rtl"
            >
              <SignatureHighlight text={bar.text} bar={bar} />
            </p>
            {bar.signatureMatch && <EliteMatchScoreBadge breakdown={bar.signatureMatch} />}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted uppercase mb-4">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-gold-400" />
              <span>
                Power:{" "}
                <span className="text-text-primary font-bold">
                  {bar.sonicWeight || 0}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-quality-perfect" />
              <span>
                Sync:{" "}
                <span className="text-text-primary font-bold">
                  {bar.rhythmicWeight || 0}
                </span>
              </span>
            </div>
            {bar.suggestedBarRole && (
              <div className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-bold text-text-secondary">
                {bar.suggestedBarRole.replace("_", " ")}
              </div>
            )}
          </div>

          {/* Phonetic Signature Visualizer (Small) */}
          <div className="flex gap-0.5 h-4 mb-4">
            {accentScanner.scan(bar.text).map((bit, i) => (
              <div
                key={i}
                className={`flex-1 rounded-[1px] ${bit === "[!]" ? "bg-gold-400/60" : "bg-white/5"}`}
              />
            ))}
          </div>
        </div>

        {/* Control Strip */}
        <div className="px-5 py-3 bg-white/5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => injectBar(bar.text)}
              className="px-3 py-1.5 bg-gold-400 text-bg-base rounded-xl text-[9px] font-black uppercase flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Insert to Studio
            </motion.button>
            <SmartSuggestButton bar={bar} />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <MatchScoreBadge barId={bar.id} />
            <button
              onClick={() => onFindSimilar?.(bar.id)}
              className="text-[9px] font-mono text-text-muted uppercase hover:text-gold-400 transition-colors flex items-center gap-1"
            >
              <Search className="w-3 h-3" /> Similar DNA
            </button>
          </div>
        </div>

        {/* Expanded Analysis */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-bg-base/50"
            >
              <div className="p-5 space-y-6">
                <DigitalLabel bar={bar} />
                {bar.isAcousticEnriched && bar.acousticResonance && (
                  <div className="pt-4 border-t border-white/5">
                    <h4 className="text-[10px] font-mono font-bold uppercase text-text-muted mb-4 tracking-widest">
                      Acoustic Resonance Analysis (DEPRECATED)
                    </h4>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.bar === nextProps.bar &&
      prevProps.isSelected === nextProps.isSelected
    );
  },
);

BarCard.displayName = "BarCard";
