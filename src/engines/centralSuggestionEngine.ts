import { useRepositoryStore } from '../store/repositoryStore';
import {
  SearchCriteria, SuggestionResponse, SuggestionResult,
  RepositoryBar, BarMetadata,
} from '../types/repository.types';
import { buildSemanticVector, cosineSimilarity, extractKeywords, calculateHookScore } from './semanticEngine';
import type { Bar } from '../types';

const ENGINECONFIG = {
  aiThreshold:        3,
  minRelevanceScore:  0.15,
  maxRepositoryBars:  6,
  maxAiBars:          3,
} as const;

const SCOREWEIGHTS = {
  semantic:   0.40,
  keyword:    0.25,
  emotion:    0.20,
  bpm:        0.10,
  hookQuality:0.05,
} as const;

function scoreBar(
  bar: Bar,
  criteria: SearchCriteria,
  queryVector: number[] | null
): SuggestionResult {
  let score = 0;
  const reasons: string[] = [];
  
  const semanticVector = buildSemanticVector(bar.text);
  const keywords = extractKeywords(bar.text);
  const hookScore = calculateHookScore(bar.text);

  if (queryVector) {
    const sim = cosineSimilarity(queryVector, semanticVector);
    score += sim * SCOREWEIGHTS.semantic;
    if (sim > 0.3) reasons.push(`تشابه دلالي ${Math.round(sim * 100)}%`);
  }

  if (criteria.keyword) {
    const kw = criteria.keyword.toLowerCase();
    const inText = bar.text.includes(kw) ? 0.8 : 0;
    const inKeys = keywords.some(k => k.includes(kw)) ? 0.6 : 0;
    const kwScore = Math.max(inText, inKeys);
    score += kwScore * SCOREWEIGHTS.keyword;
    if (kwScore > 0) reasons.push('يحتوي الكلمة المفتاحية');
  }

  if (criteria.emotion && (bar.emotion === criteria.emotion || bar.dominantMood === criteria.emotion)) {
    score += SCOREWEIGHTS.emotion;
    reasons.push(`مشاعر متطابقة: ${criteria.emotion}`);
  }

  score += (hookScore / 100) * SCOREWEIGHTS.hookQuality;
  
  // Example BPM checking, if the repository ever tracks it directly we can use it
  if (criteria.bpmRange) {
     // A placeholder for matching since real bars might not store exact BPM yet.
  }

  return {
    bar,
    relevanceScore: Math.min(score, 1),
    source: 'repository',
    matchReason: reasons,
  };
}

export async function getSuggestions(
  criteria: SearchCriteria,
  options: { forceAi?: boolean } = {}
): Promise<SuggestionResponse> {
  const store = useRepositoryStore.getState();
  const bars = store.bars || [];

  const queryVector = criteria.semanticQuery
    ? buildSemanticVector(criteria.semanticQuery)
    : criteria.keyword
    ? buildSemanticVector(criteria.keyword)
    : null;

  const allResults = bars
    .map(bar => scoreBar(bar, criteria, queryVector))
    .filter(r => r.relevanceScore > 0.05)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, ENGINECONFIG.maxRepositoryBars * 2);

  const repositorySuggestions = allResults
    .filter(r => r.relevanceScore >= ENGINECONFIG.minRelevanceScore)
    .slice(0, ENGINECONFIG.maxRepositoryBars);

  const qualifiedCount   = repositorySuggestions.length;
  // According to the user request, do not use AI generation unless explicitly requested. We just want repository suggestions.
  const thresholdNotMet  = qualifiedCount < ENGINECONFIG.aiThreshold;
  const shouldInvokeAi   = options.forceAi;

  let aiSuggestions: SuggestionResult[] = [];
  let triggerReason: SuggestionResponse['triggerReason'] | undefined;

  return {
    repositorySuggestions,
    aiSuggestions,
    aiTriggered: false,
    triggerReason,
  };
}

