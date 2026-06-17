import { useState, useCallback, useRef } from 'react';
import { getSuggestions } from '../engines/centralSuggestionEngine';
import { SearchCriteria, SuggestionResponse } from '../types/repository.types';
import { useRepositoryStore } from '../store/repositoryStore';

interface UseSuggestionsOptions {
}

interface UseSuggestionsReturn {
  suggestions:   SuggestionResponse | null;
  isLoading:     boolean;
  error:         string | null;
  fetch:         (criteria: SearchCriteria, options?: { forceAi?: boolean }) => Promise<void>;
  acceptBar:     (barId: string, addToRepo?: boolean, text?: string) => void;
  reset:         () => void;
}

export function useSuggestions(_options?: UseSuggestionsOptions): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const abortRef                      = useRef<AbortController | null>(null);

  const { addBar, updateBar } = useRepositoryStore();

  const fetch = useCallback(async (
    criteria: SearchCriteria,
    options: { forceAi?: boolean } = {}
  ) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSuggestions(criteria, options);
      setSuggestions(result);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('فشل في جلب الاقتراحات، حاول مجدداً');
        console.error('[useSuggestions]', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptBar = useCallback((
    barId: string,
    addToRepo = false,
    text?: string
  ) => {
    // There is no explicit incrementUsage in real store. We can just add it if it's new.
    if (addToRepo && text) {
      addBar({ text, dialect: 'fusha' });
    }
  }, [addBar]);

  const reset = useCallback(() => {
    setSuggestions(null);
    setError(null);
  }, []);

  return { suggestions, isLoading, error, fetch, acceptBar, reset };
}
