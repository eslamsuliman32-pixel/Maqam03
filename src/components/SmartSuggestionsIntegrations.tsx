import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useMaqamAnalysisStore } from "../maqam/store/maqamAnalysis.store";
import { Bar } from "../types";

export function useBarMatchScore(barId: string) {
  const suggestedBars = useMaqamAnalysisStore((s) => s.suggestedBars);
  return suggestedBars.find((res) => res.bar.id === barId);
}

export function MatchScoreBadge({ barId }: { barId: string }) {
  const match = useBarMatchScore(barId);
  if (!match) return null;

  const score = match.matchScore;
  let color = "text-rose-400 border-rose-400/30 bg-rose-500/10";
  if (score >= 75)
    color = "text-emerald-400 border-emerald-400/30 bg-emerald-500/10";
  else if (score >= 50)
    color = "text-amber-400 border-amber-400/30 bg-amber-500/10";

  return (
    <div
      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${color} flex items-center gap-1 w-fit`}
      title={match.matchReason.summary}
    >
      <Sparkles className="w-3 h-3" />
      {score}% توافق
    </div>
  );
}

export function SmartSuggestButton({ bar }: { bar: Bar }) {
  const triggerBarSuggestion = useMaqamAnalysisStore(
    (s) => s.triggerBarSuggestion
  );
  const isSuggestingBars = useMaqamAnalysisStore((s) => s.isSuggestingBars);

  return (
    <button
      onClick={() => triggerBarSuggestion([bar as any], 0)}
      disabled={isSuggestingBars}
      className="p-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 text-[9px] font-bold flex items-center gap-1"
      title="مقارنة بالبيت الساري"
    >
      <Sparkles className="w-3 h-3" />
      <span>توافق</span>
    </button>
  );
}

export function TriggerAllSuggestionsButton({ bars }: { bars: Bar[] }) {
  const triggerBarSuggestion = useMaqamAnalysisStore(
    (s) => s.triggerBarSuggestion
  );
  const isSuggestingBars = useMaqamAnalysisStore((s) => s.isSuggestingBars);

  return (
    <button
      onClick={() => triggerBarSuggestion(bars as any[], 0)}
      disabled={isSuggestingBars || bars.length === 0}
      className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-[10px] font-bold"
    >
      {isSuggestingBars ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      اختبار كل البارات بالبيت ({bars.length})
    </button>
  );
}
