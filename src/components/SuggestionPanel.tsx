import React, { memo, useCallback } from 'react';
import { useSuggestions } from '../hooks/useSuggestions';
import { SearchCriteria, SuggestionResult } from '../types/repository.types';

interface Props {
  criteria:    SearchCriteria;
  onSelect:    (text: string) => void;
}

export const SuggestionPanel = memo(function SuggestionPanel({
  criteria, onSelect,
}: Props) {
  // Use a dummy generator since we don't use AI anymore.
  const { suggestions, isLoading, error, fetch, acceptBar } = useSuggestions({ aiGenerator: async () => [] });

  const handleFetch = useCallback(
    () => fetch(criteria, { forceAi: false }),
    [criteria, fetch]
  );

  const handleSelect = useCallback((result: SuggestionResult) => {
    // Only accept bar, since it's from repo it doesn't need re-adding
    acceptBar(result.bar.id, false, result.bar.text);
    onSelect(result.bar.text);
  }, [acceptBar, onSelect]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4 space-y-4" dir="rtl">

      {/* Controls */}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition disabled:opacity-50"
          onClick={handleFetch}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'جاري البحث…' : '🔍 اقتراحات ذكية من مستودعك'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/20 text-red-400 p-3 text-sm" role="alert">{error}</div>
      )}

      {/* Results */}
      {suggestions && (
        <div className="space-y-4">

          {/* From Repository */}
          {suggestions.repositorySuggestions.length > 0 && (
            <section aria-label="اقتراحات من أرشيفك" className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-300 flex items-center justify-between">
                <div>
                  📦 من أرشيفك
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                    {suggestions.repositorySuggestions.length}
                  </span>
                </div>
              </h3>
              <ul className="space-y-2">
                {suggestions.repositorySuggestions.map((result, idx) => (
                  <SuggestionCard
                    // Ensure unique key by combining id and index
                    key={`${result.bar.id}-${idx}`}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* No Results */}
          {suggestions.repositorySuggestions.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-900/50 rounded-xl">
              لم يُعثر على اقتراحات مناسبة في مستودع البارات. قم بإضافة بارات مشابهة لمستودعك.
            </p>
          )}
        </div>
      )}
    </div>
  );
});

// ─── SuggestionCard ───────────────────────────────────────────────────────────

interface CardProps {
  result:   SuggestionResult;
  onSelect: (result: SuggestionResult) => void;
}

const SuggestionCard = memo(function SuggestionCard({ result, onSelect }: CardProps) {
  const { bar, relevanceScore, matchReason } = result;
  const pct = Math.round(relevanceScore * 100);

  return (
    <li className="relative flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800 transition group">
      <p className="text-sm font-medium text-white">{bar.text}</p>

      <div className="flex flex-wrap gap-1">
        <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400" title="درجة الملاءمة">
          {pct}%
        </span>
        {bar.emotion && (
          <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {bar.emotion}
          </span>
        )}
        {bar.suggestedBarRole && (
          <span className="rounded-md bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] text-fuchsia-400" title="الدور المقترح">
            {bar.suggestedBarRole}
          </span>
        )}
      </div>

      {matchReason.length > 0 && (
        <ul className="text-[10px] text-zinc-500 leading-relaxed" aria-label="أسباب الاقتراح">
          {matchReason.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      )}

      <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition">
        <button
          className="rounded-lg bg-emerald-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
          onClick={() => onSelect(result)}
          aria-label={`اختيار: ${bar.text.slice(0, 30)}…`}
        >
          إدراج
        </button>
      </div>
    </li>
  );
});
