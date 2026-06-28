import type { Bar } from '../types';
import type {
  TableFilters,
  VizSelection,
  GroupMode,
  SortBy,
  DerivedStats,
} from './observatoryTypes';
import { moraEngine } from '../services/moraEngine';
import { accentScanner } from '../services/accentScanner';

function syllablesOf(bar: Bar): number {
  return bar.syllableCount || Math.round((bar.totalMorae || 20) / 2) || 10;
}

export function matchesSearch(bar: Bar, searchQuery: string): boolean {
  if (!searchQuery) return true;
  const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((token) => {
    if (token.startsWith('phoneme:')) {
      const target = token.split(':')[1] || '';
      const core = bar.corePhoneme || moraEngine.extractCorePhoneme(bar.text) || '';
      return core.includes(target);
    }
    if (token.startsWith('stress:')) {
      const target = token.split(':')[1] || '';
      return accentScanner.scan(bar.text).join('').includes(target);
    }
    if (token.startsWith('weight:')) {
      const w = parseInt(token.split(':')[1], 10);
      if (Number.isNaN(w)) return true;
      return Math.abs((bar.rhythmicWeight || 0) - w) <= 15;
    }
    return (
      bar.text.includes(token) ||
      moraEngine.getPhoneticTrait(bar.text).includes(token)
    );
  });
}

export function passesFilters(bar: Bar, filters: TableFilters): boolean {
  if (bar.deleted) return false;
  if (!bar.text) return false;
  if (!matchesSearch(bar, filters.searchQuery)) return false;
  if (filters.emotionFilter && filters.emotionFilter !== 'all' && bar.emotion !== filters.emotionFilter) return false;
  if (filters.footFilter && filters.footFilter !== 'all') {
    // metricGrid is not always present — skip gracefully
    const grid = (bar as any).metricGrid;
    if (grid) {
      const hasFoot = grid.some((col: any) => col.footType === filters.footFilter);
      if (!hasFoot) return false;
    }
  }
  if (filters.rhymeFilter) {
    const core = moraEngine.extractCorePhoneme(bar.text);
    if (!core?.includes(filters.rhymeFilter)) return false;
  }
  if (filters.stressFilter) {
    const stressString = accentScanner.scan(bar.text).join('');
    if (!stressString.includes(filters.stressFilter)) return false;
  }
  return true;
}

export function applyCrossFilter(bars: Bar[], vizSelection: VizSelection | null): Bar[] {
  if (!vizSelection || vizSelection.barIds.length === 0) return bars;
  const allow = new Set(vizSelection.barIds);
  return bars.filter((b) => allow.has(b.id));
}

export function sortBars(bars: Bar[], sortBy: SortBy): Bar[] {
  return [...bars].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case 'moraCount':
        return (b.totalMorae || 0) - (a.totalMorae || 0);
      case 'sonicWeight':
        return (b.sonicWeight || 0) - (a.sonicWeight || 0);
      case 'serialNumber':
        return (a.serialNumber || '').localeCompare(b.serialNumber || '');
      default:
        return 0;
    }
  });
}

export type SonicClusterResolver = (bar: Bar) => string | null;

export function groupBars(
  bars: Bar[],
  groupMode: GroupMode,
  sonicResolver?: SonicClusterResolver
): Record<string, Bar[]> {
  if (groupMode === 'none') return { 'جميع البارات': bars };
  return bars.reduce((groups, bar) => {
    let key = 'أخرى';
    if (groupMode === 'rhyme') {
      key = moraEngine.extractCorePhoneme(bar.text) || 'بدون قافية';
    } else if (groupMode === 'family') {
      key = bar.emotion || 'غير مصنف';
    } else if (groupMode === 'ai') {
      key = bar.dominantMood || bar.emotion || 'عام';
    } else if (groupMode === 'sonic') {
      key = sonicResolver?.(bar) || 'غير مُعنقَد';
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(bar);
    return groups;
  }, {} as Record<string, Bar[]>);
}

export function buildDerivedBars(
  bars: Bar[],
  filters: TableFilters,
  vizSelection: VizSelection | null
): Bar[] {
  const filtered = bars.filter((b) => passesFilters(b, filters));
  const crossed = applyCrossFilter(filtered, vizSelection);
  return sortBars(crossed, filters.sortBy);
}

export function computeDerivedStats(bars: Bar[]): DerivedStats {
  if (bars.length === 0) return { total: 0, avgRhythmicWeight: 0, avgSyllables: 0, favorites: 0 };
  let sumWeight = 0, sumSyll = 0, favorites = 0;
  for (const bar of bars) {
    sumWeight += bar.rhythmicWeight ?? 0;
    sumSyll += syllablesOf(bar);
    if (bar.isFavorite) favorites++;
  }
  return {
    total: bars.length,
    avgRhythmicWeight: Math.round((sumWeight / bars.length) * 100),
    avgSyllables: Number((sumSyll / bars.length).toFixed(1)),
    favorites,
  };
}
