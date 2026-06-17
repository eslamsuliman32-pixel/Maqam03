import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createPersistStorage } from "../lib/storage/createPersistStorage";
import { cloudSyncEngine } from "../services/CloudSyncEngine";
import { BarAnalysis } from "../services/geminiService";
import {
  AcousticResonanceProfile,
  ArabicDialect,
  moraEngine,
  BarRole,
  DominantAcousticCharacter,
  PhonemeCharacterization,
} from "../services/moraEngine";
import { accentScanner } from "../services/accentScanner";
import {
  NarrativeArcLabel,
  ThematicVector,
  SemanticTag,
} from "../services/geminiService";
import { AccentBit } from "../types/accent";

const repositoryStorage = createPersistStorage({
  namespace: "repository",
  priority: 0,
  maxRetries: 7,
  debounceMs: 1000,
  enableRealtime: true,
  onHydrated: (source) => {
    console.info(`[RepositoryStore] Hydrated from: ${source}`);
    window.dispatchEvent(new CustomEvent("maqam:store:hydrated", { detail: { source } }));
  },
  onSyncError: (error) => {
    console.error("[RepositoryStore] Sync error:", error);
    window.dispatchEvent(new CustomEvent("maqam:store:sync-error", { detail: { error } }));
  },
});

import { computeDigitalSignature } from "../lib/arabic-prosody/vectorizer";
import { Bar } from "../types";
import { applyDerivedFilters, CompositeFilter, PhoneticFilter } from "./phonetic-filters";
export type { Bar, CompositeFilter, PhoneticFilter };

// ───────────────────────── الأنواع (جديد) ─────────────────────────

export interface BarReference {
  id: string;
  barNumber: number;
  startPPQ: number; // بداية البار على الشبكة الموسيقية
  endPPQ: number; // نهايته
  wordIds: string[]; // مراجع كلمات تُستهلك من lyricsStore
  isHighlighted: boolean; // تفاعل بصري مع الميترونوم/التشغيل
}

export interface SectionReference {
  id: string;
  name: string; // "Intro" | "Verse" | "Chorus" ...
  color: string; // لون الـ Clip على الـ Playlist
  barIds: string[];
}

export interface SongSnapshot { // شكل الحفظ/التحميل
  sections: Record<string, SectionReference>;
  bars: Record<string, BarReference>;
  sectionOrder: string[];
}

export interface RepositoryStore {
  // ─── Legacy State ───
  bars: Bar[];
  filteredBars: Bar[];
  selectedBars: string[];
  isLoading: boolean;

  searchQuery: string;
  stressFilter: string;
  rhymeFilter: string;
  twoFactorFilter: { factor1: string; factor2: string } | null;
  threeFactorFilter: {
    factor1: string;
    factor2: string;
    factor3: string;
  } | null;

  narrativeArcFilter: string;
  barRoleFilter: string;
  resonanceCharacterFilter: string;
  semanticTagFilter: string;
  compositeFilter: CompositeFilter | null;
  phoneticFilter?: PhoneticFilter;

  reprocessProgress: number;
  lastFullReprocessAt: string | null;
  dialectFilter: string;
  themeFilter: string;
  minQualityScore: number;
  dateRangeFilter: { from: Date; to: Date } | undefined;
  passingThreshold: number;

  syncStatus: "idle" | "syncing" | "error" | "offline";
  lastSyncedAt: number | null;
  hydrationSource: "local" | "cloud" | "snapshot" | null;

  // ─── Tree / Playlist State (جديد) ───
  sections: Record<string, SectionReference>;
  playlistBars: Record<string, BarReference>;
  sectionOrder: string[];
  activeBarId: string | null;
  snapPPQ: number; // مقدار الالتصاق (تقسيم 1/16 افتراضياً)

  // ─── Legacy Actions ───
  forceSync: () => Promise<void>;
  rehydrateFromCloud: () => Promise<void>;
  addBar: (
    bar: Partial<Bar> & { text: string; dialect: ArabicDialect },
  ) => string;
  addBatch: (
    bars: (Partial<Bar> & { text: string; dialect: ArabicDialect })[],
  ) => void;
  updateBar: (id: string, updates: Partial<Bar>) => void;
  updateBatch: (updates: { id: string; updates: Partial<Bar> }[]) => void;
  deleteBar: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleSelection: (id: string) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;

  setSearchQuery: (query: string) => void;
  setStressFilter: (filter: string) => void;
  setRhymeFilter: (filter: string) => void;
  setTwoFactorFilter: (
    filters: { factor1: string; factor2: string } | null,
  ) => void;
  setThreeFactorFilter: (
    filters: { factor1: string; factor2: string; factor3: string } | null,
  ) => void;

  setNarrativeArcFilter: (arc: string) => void;
  setBarRoleFilter: (role: string) => void;
  setResonanceCharacterFilter: (character: string) => void;
  setSemanticTagFilter: (tag: string) => void;
  setCompositeFilter: (filter: CompositeFilter | null) => void;
  setPhoneticFilter: (filter: PhoneticFilter | undefined) => void;
  setDialectFilter: (dialect: string) => void;
  setThemeFilter: (theme: string) => void;
  setMinQualityScore: (score: number) => void;
  setDateRangeFilter: (range: { from: Date; to: Date } | undefined) => void;
  setPassingThreshold: (threshold: number) => void;
  clearAllFilters: () => void;

  enrichBarAcoustic: (id: string) => void;
  enrichBarSemantic: (id: string, semanticData: Partial<Bar>) => void;
  enrichBatchAcoustic: (ids?: string[]) => void;
  reprocessAllBars: () => Promise<void>;
  computeSignaturesOnly: () => Promise<void>;
  clearRepository: () => void;
  embedBatch: () => Promise<void>;
  getNextSerialNumber: () => string;

  // ─── Tree / Playlist Actions (جديد) ───
  addSection: (name: string, color?: string) => string;
  addBarToSection: (sectionId: string, startPPQ: number, endPPQ: number) => string | null;

  assignWordToBar: (barId: string, wordId: string) => void;
  removeWordFromBar: (barId: string, wordId: string) => void;

  moveBar: (barId: string, newStartPPQ: number) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  renameSection: (sectionId: string, name: string) => void;
  recolorSection: (sectionId: string, color: string) => void;

  removeBar: (barId: string) => void;
  removeSection: (sectionId: string) => void;

  setActiveBar: (barId: string | null) => void;
  setSnap: (snapPPQ: number) => void;

  serialize: () => SongSnapshot;
  hydrate: (snapshot: SongSnapshot) => void;
  resetRepository: () => void;
}

const generateId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2, 11);
  }
};

const genId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

// التصاق القيمة بأقرب تقسيم على الشبكة
const snapToGrid = (ppq: number, snapPPQ: number): number =>
  snapPPQ > 0 ? Math.round(ppq / snapPPQ) * snapPPQ : ppq;

const PPQ = 960;
const DEFAULT_SNAP = PPQ / 4; // 1/16 = 240 PPQ

const normalizeText = (value: string): string => value.trim().toLowerCase();

import { syllabify, extractRhymeCore, normalizeArabic } from "../lib/arabic-prosody/normalizer";

const analyzeBarInternally = (
  text: string,
  dialect: ArabicDialect,
): Partial<Bar> => {
  const profile = moraEngine.analyze(text, dialect);
  const corePhoneme = extractRhymeCore(text) || moraEngine.extractCorePhoneme(text);
  const stressBits = accentScanner.scan(
    text,
    dialect === "fusha" ? "standard" : (dialect as any),
  );
  
  // New Prosodic Analysis
  const syllables = syllabify(text);
  
  const fingerprintCode = accentScanner.generateFingerprintCode(
    text,
    stressBits,
    profile.totalMorae,
    corePhoneme,
  );

  const resonance = moraEngine.analyzeAcousticResonance(text);
  const characterization = moraEngine.analyzePhonemeCharacterization(text);
  const polyrhythm = accentScanner.analyzePolyrhythm(
    text,
    dialect === "fusha" ? "standard" : (dialect as any),
  );

  // Derive weight class
  let weightClass: Bar["weightClass"] = "medium_light";
  if (profile.sonicWeight > 40) weightClass = "super_heavy";
  else if (profile.sonicWeight > 30) weightClass = "heavy";
  else if (profile.sonicWeight > 20) weightClass = "medium_heavy";
  else if (profile.sonicWeight < 10) weightClass = "light";

  return {
    totalMorae: profile.totalMorae,
    sonicWeight: profile.sonicWeight,
    rhythmicWeight: profile.rhythmicWeight,
    corePhoneme,
    fingerprintCode,
    syllableCount: accentScanner.countSyllables(text),
    emotion: moraEngine.getEmotionalTone(text),
    acousticResonance: resonance,
    phonemeCharacterization: characterization,
    resonanceFingerprint: resonance.resonanceFingerprint,
    qalqalaIntensity: resonance.qalqalaIntensity,
    rakhwaIndex: resonance.rakhwaIndex,
    shiddaScore: resonance.shiddaScore,
    safirDensity: resonance.safirDensity,
    hulqiDepth: resonance.hulqiDepth,
    overallResonance: resonance.overallResonance,
    dominantAcousticCharacter: resonance.dominantCharacter,
    suggestedBarRole: resonance.suggestedRole,
    acousticEmotionalSignature: resonance.emotionalSignature,
    isAcousticEnriched: true,
    polyrhythmIndex: polyrhythm.index,
    syncopeScore: polyrhythm.syncopeScore,
    flowSwitchCount: polyrhythm.switchCount,
    dominantGrid: polyrhythm.dominantGrid,
    rhythmicTension: polyrhythm.tension,
    flowCode:
      (accentScanner as any).buildFlowCode?.(polyrhythm.flowSwitches) ??
      "STEADY",

    // Missing required fields from BarAnalysis
    index: 0,
    weightClass,
    flowMode: "pocket",
    endPhoneme: corePhoneme,
    internalRhymes: 0,
    alignmentScore: 0,
    compatibleBeats: [],
    strengthNote: "تحليل آلي",
    weaknessNote: "لا يوجد",
  };
};

export const repoSelectors = {
  // Legacy
  bars: (s: RepositoryStore) => s.bars,
  filteredBars: (s: RepositoryStore) => s.filteredBars,
  selectedBars: (s: RepositoryStore) => s.selectedBars,

  // New Hierarchical (Playlist) Selectors
  sectionsList: (s: RepositoryStore) =>
    s.sectionOrder.map((id) => s.sections[id]).filter(Boolean),

  barsOfSection: (sectionId: string) => (s: RepositoryStore) => {
    const sec = s.sections[sectionId];
    return sec ? sec.barIds.map((id) => s.playlistBars[id]).filter(Boolean) : [];
  },

  barById: (id: string) => (s: RepositoryStore) => s.playlistBars[id],

  activeBar: (s: RepositoryStore) =>
    s.activeBarId ? s.playlistBars[s.activeBarId] : null,

  // الحدود الزمنية للقسم تُشتق من باراته - لا تُخزَّن (مصدر وحيد للحقيقة)
  sectionBounds: (sectionId: string) => (s: RepositoryStore) => {
    const sec = s.sections[sectionId];
    if (!sec || sec.barIds.length === 0) return null;
    const bars = sec.barIds.map((id) => s.playlistBars[id]).filter(Boolean);
    return {
      startPPQ: Math.min(...bars.map((b) => b.startPPQ)),
      endPPQ: Math.max(...bars.map((b) => b.endPPQ)),
    };
  },

  // البار الذي يحتوي لحظة PPQ معيّنة (لتحديد البار النشط أثناء التشغيل)
  barAtPPQ: (ppq: number) => (s: RepositoryStore) =>
    Object.values(s.playlistBars).find(
      (b) => ppq >= b.startPPQ && ppq < b.endPPQ
    ) ?? null,
};

export const useRepositoryStore = create<RepositoryStore>()(
  persist(
    immer((set, get) => ({
      // ─── Legacy State Initializers ───
      bars: [],
      filteredBars: [],
      selectedBars: [],
      isLoading: false,

      searchQuery: "",
      stressFilter: "",
      rhymeFilter: "",
      twoFactorFilter: null,
      threeFactorFilter: null,

      narrativeArcFilter: "",
      barRoleFilter: "",
      resonanceCharacterFilter: "",
      semanticTagFilter: "",
      compositeFilter: null,
      syncStatus: "idle",
      lastSyncedAt: null,
      hydrationSource: null,

      reprocessProgress: 0,
      lastFullReprocessAt: null,
      dialectFilter: "all",
      themeFilter: "",
      minQualityScore: 0,
      dateRangeFilter: undefined,
      passingThreshold: 75,

      // ─── Tree / Playlist State Initializers (جديد) ───
      sections: {},
      playlistBars: {},
      sectionOrder: [],
      activeBarId: null,
      snapPPQ: DEFAULT_SNAP,

      // ─── Legacy Actions ───
      forceSync: async () => {
        set((state) => {
          state.syncStatus = "syncing";
        });
        try {
          const raw = JSON.stringify({
            state: {
              bars: get().bars,
              activeFilter: {
                searchQuery: get().searchQuery,
                stressFilter: get().stressFilter,
                rhymeFilter: get().rhymeFilter,
                twoFactorFilter: get().twoFactorFilter,
                threeFactorFilter: get().threeFactorFilter,
                narrativeArcFilter: get().narrativeArcFilter,
                barRoleFilter: get().barRoleFilter,
                resonanceCharacterFilter: get().resonanceCharacterFilter,
                semanticTagFilter: get().semanticTagFilter,
                compositeFilter: get().compositeFilter,
                phoneticFilter: get().phoneticFilter,
              },
            },
            version: 3,
          });
          cloudSyncEngine.schedule("maqam-repository-storage", raw, {
            namespace: "repository",
            priority: 0,
            debounceMs: 0,
          });
          set((state) => {
            state.syncStatus = "idle";
            state.lastSyncedAt = Date.now();
          });
        } catch {
          set((state) => {
            state.syncStatus = "error";
          });
        }
      },

      rehydrateFromCloud: async () => {
        const cloudPayload = await cloudSyncEngine.pullFromCloud(
          "maqam-repository-storage",
          "repository"
        );
        if (!cloudPayload) return;

        try {
          const parsed = JSON.parse(cloudPayload);
          const bars: Bar[] = parsed?.state?.bars ?? [];
          set((state) => {
            state.bars = bars;
            state.filteredBars = applyDerivedFilters(bars, state);
            state.hydrationSource = "cloud" as const;
            state.lastSyncedAt = Date.now();
          });
        } catch (e) {
          console.error("[RepositoryStore] Failed to parse cloud payload", e);
        }
      },

      getNextSerialNumber: () => {
        const { bars } = get();
        const count = bars.filter((bar) => !bar.deleted).length + 1;
        return `BAR-${count.toString().padStart(4, "0")}`;
      },

      toggleSelection: (id) =>
        set((state) => {
          state.selectedBars = state.selectedBars.includes(id)
            ? state.selectedBars.filter((selectedId) => selectedId !== id)
            : [...state.selectedBars, id];
        }),

      setSelection: (ids) => set((state) => { state.selectedBars = ids; }),

      clearSelection: () => set((state) => { state.selectedBars = []; }),

      addBar: (barData) => {
        const id = generateId();
        const analysis = analyzeBarInternally(barData.text, barData.dialect);
        set((state) => {
          const newBar: Bar = {
            id,
            serialNumber: state.getNextSerialNumber(),
            isFavorite: false,
            createdAt: new Date().toISOString(),
            tags: [],
            ...barData,
            ...analysis,
          } as Bar;

          state.bars = [newBar, ...state.bars];
          state.filteredBars = applyDerivedFilters(state.bars, state);
        });
        return id;
      },

      addBatch: (incoming) =>
        set((state) => {
          const uniqueIncoming = incoming.filter(
            (newBar) =>
              !state.bars.some(
                (existing) => existing.text.trim() === newBar.text.trim(),
              ),
          );

          if (uniqueIncoming.length === 0) return;

          const baseCount = state.bars.filter((bar) => !bar.deleted).length;
          const enriched = uniqueIncoming.map((barData, index) => {
            const analysis = analyzeBarInternally(
              barData.text,
              barData.dialect,
            );
            return {
              id: generateId(),
              serialNumber: `BAR-${(baseCount + index + 1).toString().padStart(4, "0")}`,
              isFavorite: false,
              createdAt: new Date().toISOString(),
              tags: [],
              ...barData,
              ...analysis,
            } as Bar;
          });

          state.bars = [...enriched, ...state.bars];
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      updateBar: (id, updates) =>
        set((state) => {
          state.bars = state.bars.map((bar) =>
            bar.id === id ? { ...bar, ...updates } : bar,
          );
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      updateBatch: (updates) =>
        set((state) => {
          const updateMap = new Map<string, Partial<Bar>>(
            updates.map((item) => [item.id, item.updates] as const),
          );
          state.bars = state.bars.map((bar) => {
            const patch = updateMap.get(bar.id);
            return patch ? { ...bar, ...patch } : bar;
          });
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      deleteBar: (id) =>
        set((state) => {
          const target = state.bars.find((bar) => bar.id === id);
          if (target?.isPermanent) {
            console.warn("Cannot delete a permanent bar");
            return;
          }

          state.bars = state.bars.map((bar) =>
            bar.id === id ? { ...bar, deleted: true } : bar,
          );
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      toggleFavorite: (id) =>
        set((state) => {
          state.bars = state.bars.map((bar) =>
            bar.id === id ? { ...bar, isFavorite: !bar.isFavorite } : bar,
          );
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setStressFilter: (filter) => set((state) => { state.stressFilter = filter; }),
      setRhymeFilter: (filter) => set((state) => { state.rhymeFilter = filter; }),
      setTwoFactorFilter: (filter) => set((state) => { state.twoFactorFilter = filter; }),
      setThreeFactorFilter: (filter) => set((state) => { state.threeFactorFilter = filter; }),

      setNarrativeArcFilter: (arc) =>
        set((state) => {
          state.narrativeArcFilter = arc;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setBarRoleFilter: (role) =>
        set((state) => {
          state.barRoleFilter = role;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setResonanceCharacterFilter: (character) =>
        set((state) => {
          state.resonanceCharacterFilter = character;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setSemanticTagFilter: (tag) =>
        set((state) => {
          state.semanticTagFilter = tag;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setCompositeFilter: (filter) =>
        set((state) => {
          state.compositeFilter = filter;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setPhoneticFilter: (filter) =>
        set((state) => {
          state.phoneticFilter = filter;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setDialectFilter: (dialect) =>
        set((state) => {
          state.dialectFilter = dialect;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setThemeFilter: (theme) =>
        set((state) => {
          state.themeFilter = theme;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setMinQualityScore: (score) =>
        set((state) => {
          state.minQualityScore = score;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setDateRangeFilter: (range) =>
        set((state) => {
          state.dateRangeFilter = range;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      setPassingThreshold: (threshold) =>
        set((state) => {
          state.passingThreshold = threshold;
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      clearAllFilters: () =>
        set((state) => {
          state.searchQuery = "";
          state.stressFilter = "";
          state.rhymeFilter = "";
          state.twoFactorFilter = null;
          state.threeFactorFilter = null;
          state.narrativeArcFilter = "";
          state.barRoleFilter = "";
          state.resonanceCharacterFilter = "";
          state.semanticTagFilter = "";
          state.dialectFilter = "all";
          state.themeFilter = "";
          state.minQualityScore = 0;
          state.dateRangeFilter = undefined;
          state.compositeFilter = null;
          state.phoneticFilter = undefined;
          state.passingThreshold = 75;
          state.filteredBars = state.bars.filter((bar) => !bar.deleted);
        }),

      enrichBarAcoustic: (id) =>
        set((state) => {
          const bar = state.bars.find((item) => item.id === id);
          if (!bar) return;

          const resonance = moraEngine.analyzeAcousticResonance(bar.text);
          const characterization = moraEngine.analyzePhonemeCharacterization(
            bar.text,
          );
          const polyrhythm = accentScanner.analyzePolyrhythm(
            bar.text,
            bar.dialect === "fusha" ? "standard" : (bar.dialect as any),
          );

          const updates: Partial<Bar> = {
            acousticResonance: resonance,
            phonemeCharacterization: characterization,
            resonanceFingerprint: resonance.resonanceFingerprint,
            qalqalaIntensity: resonance.qalqalaIntensity,
            rakhwaIndex: resonance.rakhwaIndex,
            shiddaScore: resonance.shiddaScore,
            safirDensity: resonance.safirDensity,
            hulqiDepth: resonance.hulqiDepth,
            overallResonance: resonance.overallResonance,
            dominantAcousticCharacter: resonance.dominantCharacter,
            suggestedBarRole: resonance.suggestedRole,
            acousticEmotionalSignature: resonance.emotionalSignature,
            polyrhythmIndex: polyrhythm.index,
            syncopeScore: polyrhythm.syncopeScore,
            flowSwitchCount: polyrhythm.switchCount,
            dominantGrid: polyrhythm.dominantGrid,
            rhythmicTension: polyrhythm.tension,
            isAcousticEnriched: true,
          };

          state.bars = state.bars.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          );
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      enrichBarSemantic: (id, semanticData) =>
        set((state) => {
          state.bars = state.bars.map((bar) =>
            bar.id === id
              ? { ...bar, ...semanticData, isSemanticEnriched: true }
              : bar,
          );
          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      enrichBatchAcoustic: (ids) =>
        set((state) => {
          const targetIds = ids ? new Set(ids) : null;
          state.bars = state.bars.map((bar) => {
            if (targetIds && !targetIds.has(bar.id)) return bar;

            const resonance = moraEngine.analyzeAcousticResonance(bar.text);
            const characterization = moraEngine.analyzePhonemeCharacterization(
              bar.text,
            );
            const polyrhythm = accentScanner.analyzePolyrhythm(
              bar.text,
              bar.dialect === "fusha" ? "standard" : (bar.dialect as any),
            );

            return {
              ...bar,
              acousticResonance: resonance,
              phonemeCharacterization: characterization,
              resonanceFingerprint: resonance.resonanceFingerprint,
              qalqalaIntensity: resonance.qalqalaIntensity,
              rakhwaIndex: resonance.rakhwaIndex,
              shiddaScore: resonance.shiddaScore,
              safirDensity: resonance.safirDensity,
              hulqiDepth: resonance.hulqiDepth,
              overallResonance: resonance.overallResonance,
              dominantAcousticCharacter: resonance.dominantCharacter,
              suggestedBarRole: resonance.suggestedRole,
              acousticEmotionalSignature: resonance.emotionalSignature,
              polyrhythmIndex: polyrhythm.index,
              syncopeScore: polyrhythm.syncopeScore,
              flowSwitchCount: polyrhythm.switchCount,
              dominantGrid: polyrhythm.dominantGrid,
              rhythmicTension: polyrhythm.tension,
              isAcousticEnriched: true,
            } as Bar;
          });

          state.filteredBars = applyDerivedFilters(state.bars, state);
        }),

      reprocessAllBars: async () => {
        const { bars } = get();
        const activeBars = bars.filter(b => !b.deleted && b.text);
        if (activeBars.length === 0) return;

        set((state) => {
          state.isLoading = true;
          state.reprocessProgress = 0;
        });

        const BATCH_SIZE = 25;
        let processedCount = 0;
        const totalToProcess = activeBars.length;

        for (let i = 0; i < totalToProcess; i += BATCH_SIZE) {
          const batch = activeBars.slice(i, i + BATCH_SIZE);
          
          await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to breathe

          set(state => {
            const batchIds = new Set(batch.map(b => b.id));
            const newBars = state.bars.map(bar => {
              if (batchIds.has(bar.id)) {
                try {
                   const analysis = analyzeBarInternally(bar.text, bar.dialect || "fusha");
                   const digitalSignature = computeDigitalSignature(bar.text);
                   return { ...bar, ...analysis, digitalSignature, isAcousticEnriched: true };
                } catch (err) {
                   console.error(`Error reprocessing bar ${bar.id}:`, err);
                   return bar;
                }
              }
              return bar;
            });

            processedCount += batch.length;
            const progress = Math.min(100, Math.round((processedCount / totalToProcess) * 100));

            state.bars = newBars;
            state.reprocessProgress = progress;
            state.filteredBars = applyDerivedFilters(newBars, state);
          });
        }

        set((state) => {
          state.isLoading = false;
          state.reprocessProgress = 100;
          state.lastFullReprocessAt = new Date().toISOString();
        });

        // Trigger a force sync to cloud after major update
        await get().forceSync();
      },

      computeSignaturesOnly: async () => {
        const { bars } = get();
        const BATCH_SIZE = 100;
        let processed = 0;
        const total = bars.length;

        set((state) => {
          state.isLoading = true;
          state.reprocessProgress = 0;
        });

        for (let i = 0; i < total; i += BATCH_SIZE) {
          const batch = bars.slice(i, i + BATCH_SIZE);
          const batchIds = new Set(batch.map(b => b.id));

          set(state => {
            const newBars = state.bars.map(bar => {
              if (batchIds.has(bar.id)) {
                return {
                  ...bar,
                  digitalSignature: computeDigitalSignature(bar.text),
                };
              }
              return bar;
            });
            processed += batch.length;
            state.bars = newBars;
            state.reprocessProgress = Math.round((processed / total) * 100);
          });
          await new Promise(r => setTimeout(r, 5));
        }

        set((state) => {
          state.isLoading = false;
          state.reprocessProgress = 100;
        });
        await get().forceSync();
      },

      embedBatch: async () => {
        // No-op after matchmaking removal
      },

      clearRepository: () => {
        console.group("[RepositoryStore] Clear Repository Operation");
        console.log("Current bar count:", get().bars.length);
        
        set((state) => {
          state.bars = [];
          state.filteredBars = [];
          state.selectedBars = [];
          state.reprocessProgress = 0;
        });

        console.log("New bar count set to 0");
        
        // Trigger a sync immediately but allow a small delay to ensure React/Zustand state consistency
        setTimeout(async () => {
          console.log("Triggering cloud sync for empty repository...");
          await get().forceSync();
          console.log("Cloud sync completed.");
          console.groupEnd();
        }, 100);
      },

      // ─── Tree / Playlist Actions (جديد) ───
      addSection: (name, color = "#3b82f6") => {
        const id = genId("sec");
        set((s) => {
          s.sections[id] = { id, name, color, barIds: [] };
          s.sectionOrder.push(id);
        });
        return id;
      },

      addBarToSection: (sectionId, startPPQ, endPPQ) => {
        const snap = get().snapPPQ;
        let barId: string | null = null;
        set((s) => {
          const section = s.sections[sectionId];
          if (!section) return;
          barId = genId("bar");
          s.playlistBars[barId] = {
            id: barId,
            barNumber: section.barIds.length + 1,
            startPPQ: snapToGrid(startPPQ, snap),
            endPPQ: snapToGrid(endPPQ, snap),
            wordIds: [],
            isHighlighted: false,
          };
          section.barIds.push(barId);
        });
        return barId;
      },

      assignWordToBar: (barId, wordId) => set((s) => {
        const bar = s.playlistBars[barId];
        if (bar && !bar.wordIds.includes(wordId)) bar.wordIds.push(wordId);
      }),

      removeWordFromBar: (barId, wordId) => set((s) => {
        const bar = s.playlistBars[barId];
        if (bar) bar.wordIds = bar.wordIds.filter((id) => id !== wordId);
      }),

      moveBar: (barId, newStartPPQ) => set((s) => {
        const bar = s.playlistBars[barId];
        if (!bar) return;
        const duration = bar.endPPQ - bar.startPPQ; // الحفاظ على الطول
        const snapped = snapToGrid(Math.max(0, newStartPPQ), s.snapPPQ);
        bar.startPPQ = snapped;
        bar.endPPQ = snapped + duration;
      }),

      reorderSections: (fromIndex, toIndex) => set((s) => {
        if (
          fromIndex < 0 || toIndex < 0 ||
          fromIndex >= s.sectionOrder.length ||
          toIndex >= s.sectionOrder.length
        ) return;
        const [moved] = s.sectionOrder.splice(fromIndex, 1);
        s.sectionOrder.splice(toIndex, 0, moved);
      }),

      renameSection: (sectionId, name) => set((s) => {
        const sec = s.sections[sectionId];
        if (sec) sec.name = name;
      }),

      recolorSection: (sectionId, color) => set((s) => {
        const sec = s.sections[sectionId];
        if (sec) sec.color = color;
      }),

      removeBar: (barId) => set((s) => {
        delete s.playlistBars[barId];
        for (const sec of Object.values(s.sections)) {
          sec.barIds = sec.barIds.filter((id) => id !== barId);
        }
        if (s.activeBarId === barId) s.activeBarId = null;
      }),

      removeSection: (sectionId) => set((s) => {
        const sec = s.sections[sectionId];
        if (!sec) return;
        for (const barId of sec.barIds) delete s.playlistBars[barId];
        delete s.sections[sectionId];
        s.sectionOrder = s.sectionOrder.filter((id) => id !== sectionId);
      }),

      setActiveBar: (barId) => set((s) => {
        if (s.activeBarId && s.playlistBars[s.activeBarId]) {
          s.playlistBars[s.activeBarId].isHighlighted = false;
        }
        s.activeBarId = barId;
        if (barId && s.playlistBars[barId]) s.playlistBars[barId].isHighlighted = true;
      }),

      setSnap: (snapPPQ) => set((s) => { s.snapPPQ = snapPPQ; }),

      serialize: () => {
        const { sections, playlistBars, sectionOrder } = get();
        return { sections, bars: playlistBars, sectionOrder };
      },

      hydrate: (snapshot) => set((s) => {
        s.sections = snapshot.sections;
        s.playlistBars = snapshot.bars;
        s.sectionOrder = snapshot.sectionOrder;
        s.activeBarId = null;
      }),

      resetRepository: () => set((s) => {
        s.sections = {};
        s.playlistBars = {};
        s.sectionOrder = [];
        s.activeBarId = null;
      }),
    })),
    {
      name: "maqam-repository-storage",
      version: 3,
      storage: createJSONStorage(() => repositoryStorage),
      partialize: (state) => ({
        bars: state.bars,
        searchQuery: state.searchQuery,
        stressFilter: state.stressFilter,
        rhymeFilter: state.rhymeFilter,
        twoFactorFilter: state.twoFactorFilter,
        threeFactorFilter: state.threeFactorFilter,
        narrativeArcFilter: state.narrativeArcFilter,
        barRoleFilter: state.barRoleFilter,
        resonanceCharacterFilter: state.resonanceCharacterFilter,
        semanticTagFilter: state.semanticTagFilter,
        dialectFilter: state.dialectFilter,
        themeFilter: state.themeFilter,
        minQualityScore: state.minQualityScore,
        dateRangeFilter: state.dateRangeFilter,
        compositeFilter: state.compositeFilter,
        passingThreshold: state.passingThreshold,
        
        // Tree / Playlist State Persistance
        sections: state.sections,
        playlistBars: state.playlistBars,
        sectionOrder: state.sectionOrder,
        snapPPQ: state.snapPPQ,
      }),
      migrate: (persistedState: any, version: number) => {
        console.log(`[RepositoryStore] Migrating from version ${version} to 3`);

        let legacyBars = (persistedState as any)?.bars ?? [];

        // Ensure every bar has the mandatory new fields
        const upgradedBars = legacyBars.map((bar: any) => {
          if (!bar.text) return bar;

          // If the bar is missing core metadata, re-analyze it partially
          if (!bar.corePhoneme || bar.index === undefined) {
            const analysis = analyzeBarInternally(
              bar.text,
              bar.dialect || "fusha",
            );
            return {
              ...analysis,
              ...bar, // Keep existing if present
              id: bar.id || generateId(),
              serialNumber: bar.serialNumber || "BAR-OLD",
              createdAt: bar.createdAt || new Date().toISOString(),
              isFavorite: !!bar.isFavorite,
              tags: bar.tags || [],
            };
          }
          return bar;
        });

        const migratedState = {
          bars: upgradedBars,
          selectedBars: [],
          isLoading: false,
          searchQuery: (persistedState as any)?.searchQuery ?? "",
          stressFilter: (persistedState as any)?.stressFilter ?? "",
          rhymeFilter: (persistedState as any)?.rhymeFilter ?? "",
          twoFactorFilter: (persistedState as any)?.twoFactorFilter ?? null,
          threeFactorFilter: (persistedState as any)?.threeFactorFilter ?? null,
          narrativeArcFilter: (persistedState as any)?.narrativeArcFilter ?? "",
          barRoleFilter: (persistedState as any)?.barRoleFilter ?? "",
          resonanceCharacterFilter:
            (persistedState as any)?.resonanceCharacterFilter ?? "",
          semanticTagFilter: (persistedState as any)?.semanticTagFilter ?? "",
          compositeFilter: (persistedState as any)?.compositeFilter ?? null,
          
          sections: (persistedState as any)?.sections ?? {},
          playlistBars: (persistedState as any)?.playlistBars ?? {},
          sectionOrder: (persistedState as any)?.sectionOrder ?? [],
          activeBarId: null,
          snapPPQ: (persistedState as any)?.snapPPQ ?? DEFAULT_SNAP,
        } as RepositoryStore;

        migratedState.filteredBars = applyDerivedFilters(
          migratedState.bars,
          migratedState,
        );
        return migratedState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[RepositoryStore] Rehydration error:", error);
          return;
        }
        if (state) {
          setTimeout(() => {
            useRepositoryStore.setState((s) => ({
              filteredBars: applyDerivedFilters(s.bars, s),
              hydrationSource: "local",
            }));
          }, 10);

          cloudSyncEngine.subscribeRealtime(
            "maqam-repository-storage",
            "repository",
            (cloudPayload) => {
              try {
                const parsed = JSON.parse(cloudPayload);
                const bars: Bar[] = parsed?.state?.bars ?? [];
                useRepositoryStore.setState((s) => ({
                  bars,
                  filteredBars: applyDerivedFilters(bars, s),
                  hydrationSource: "cloud",
                  lastSyncedAt: Date.now(),
                }));
              } catch {}
            }
          );
        }
      },
    },
  ),
);

// Window event listener for generic rehydration
if (typeof window !== "undefined") {
  window.addEventListener(
    "_maqamrehydrate_maqam-repository-storage",
    (e: Event) => {
      const { payload } = (e as CustomEvent).detail;
      try {
        const parsed = JSON.parse(payload);
        const bars: Bar[] = parsed?.state?.bars ?? [];
        useRepositoryStore.setState((state) => ({
          bars,
          filteredBars: applyDerivedFilters(bars, state),
          hydrationSource: "cloud",
          lastSyncedAt: Date.now(),
        }));
      } catch {}
    }
  );
}

export { computeBarMatchScore, applyCompositeFilterToPool } from "./phonetic-filters";
