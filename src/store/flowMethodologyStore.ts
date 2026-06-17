import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  FlowMethodologyState,
  RhymeScheme,
  Quatrain,
  Bar,
  SyncopationLevel,
  SyncopationConfig,
  ScatPattern,
  ScattingSession,
  IntonationCurvePoint,
  IntonationProfile,
  TonalSpike,
  BeatRideConfig,
  TransitionConfig,
  MethodologyTab,
  FlowExercise,
} from "../types/flowEngine.types";

import {
  generateQuatrain,
  applySyncopation,
  calculateQuatrainCoherence,
  calculateDynamicRange,
} from "../services/skeletonEngine";

import {
  createScattingSession,
  generatePatternFromBeat,
} from "../services/scattingEngine";

import {
  generateDefaultCurve,
  generateIntonationProfile,
} from "../services/intonationEngine";

import { computeLayeredFlowMatrix } from "../services/layeredFlowEngine";

// ─── التمارين الافتراضية للراب العربي ───────────────────────────────

const DEFAULT_EXERCISES: FlowExercise[] = [
  {
    id: "ex_syncopation",
    title: "مدرسة السنكبة والوقفات القسرية",
    description: "تطوير مهارة الكتابة على الدقات الخلفية الصعبة لتشكيل لحن فلو مميز وجريء.",
    targetSkill: "skeleton",
    difficulty: 3,
    steps: [
      "اختر قافية من نوع AABB",
      "اضبط مستوى السنكبة على الدرجة الثالثة (عالية)",
      "اكتب كلمات توافق الدقتين الثانية والسابعة على وجه التحديد",
    ],
    bpmRange: [85, 100],
    duration: 120,
    completionCriteria: "تحقيق درجة شدة بار تفوق 75",
    isCompleted: false,
  },
  {
    id: "ex_scatting",
    title: "الهمهمة الصوتية وحقن المقاطع الحرة",
    description: "استخدام الهمهمة لملء الفراغات الإيقاعية ومحاكاة آلة الكيك والسنير.",
    targetSkill: "scatting",
    difficulty: 2,
    steps: [
      "قم بتفعيل طبقة الكيك وطبقة الهاي هات في لوحة السكاتينج",
      "أضف مقطع 'دمدم' على ضربة الكيك ومقطع 'تسس' في الوسط للتجربة",
      "حسّن توازن دقة السكاتينج الكلية لتتعدى 80%",
    ],
    bpmRange: [90, 110],
    duration: 150,
    completionCriteria: "إنشاء نمط سكاتينج بـ 8 مقاطع نشطة متوازنة",
    isCompleted: false,
  },
  {
    id: "ex_intonation",
    title: "التنغيم الدرامي والمشاعر الكاسرة",
    description: "محاكاة خريطة المشاعر والانعطافات الصوتية للنبرة لتحقيق الهيبة والوقار الشرقي.",
    targetSkill: "intonation",
    difficulty: 4,
    steps: [
      "قم باختيار مشاعر الغضب أو الثورة (Rage / Defiant)",
      "ارسم الذروة الصوتية في بداية البار الثاني",
      "قلّد نبرة الرابر المرجعي السبع",
    ],
    bpmRange: [80, 95],
    duration: 180,
    completionCriteria: "تطبيق منحنى تنغيم حاد ومحاذاته مع بار مرجعي نشط",
    isCompleted: false,
  },
];

const INITIAL_SKELETON_QUATRAIN = generateQuatrain("AABB", "storytelling");

export const useFlowMethodologyStore = create<FlowMethodologyState>((set, get) => ({
  activeRhymeScheme: "AABB",
  activeQuatrains: [INITIAL_SKELETON_QUATRAIN],
  syncopationConfig: {
    level: 1,
    offbeatEmphasis: 60,
    ghostNoteFrequency: 45,
    swingFactor: 10,
    polyrhythmEnabled: false,
    tupletMode: "none",
  },

  scattingSession: createScattingSession(90, ["kick", "snare", "hihat"]),

  intonationCurve: generateDefaultCurve("storytelling"),
  intonationProfiles: [],

  tonalSpikes: [],
  beatRideConfig: {
    pattern: "boom-bap",
    kickBeats: [1, 3],
    snareBeats: [2, 4],
    hihatPattern: ["closed", "closed", "closed", "closed"],
    explosiveConsonants: ["ب", "ك", "ت", "ط", "د", "ق"],
    melodicVowels: ["آ", "او", "اي", "يـ"],
    rideIntensity: 70,
    consonantAlignment: 80,
  },

  transitionConfigs: [],

  layeredMatrix: null,

  activeMethodologyTab: "skeleton",
  masteryLevel: 1,

  exercises: DEFAULT_EXERCISES,

  analytics: {
    totalBarsCreated: 4,
    averageCoherence: 75,
    averageDensity: 3,
    strongestLayer: "skeleton",
    weakestLayer: "transitions",
    practiceTimeMinutes: 15,
    exercisesCompleted: 0,
    lastSessionDate: new Date().toLocaleDateString("ar-EG"),
  },

  actions: {
    setRhymeScheme: (scheme: RhymeScheme) => {
      set({ activeRhymeScheme: scheme });
      // ترقية القافية للرباعية الحالية
      const quatrains = get().activeQuatrains.map((q) => {
        const matchingQuatrain = generateQuatrain(scheme, q.overallEmotion);
        return {
          ...matchingQuatrain,
          id: q.id,
        };
      });
      set({ activeQuatrains: quatrains });
      get().actions.refreshMatrix();
    },

    addQuatrain: (quatrain: Quatrain) => {
      set((state) => ({
        activeQuatrains: [...state.activeQuatrains, quatrain],
      }));
      get().actions.refreshMatrix();
    },

    removeQuatrain: (id: string) => {
      set((state) => ({
        activeQuatrains: state.activeQuatrains.filter((q) => q.id !== id),
      }));
      get().actions.refreshMatrix();
    },

    updateBar: (quatrainId: string, barIndex: number, barUpdates: Partial<Bar>) => {
      const quatrains = get().activeQuatrains.map((q) => {
        if (q.id !== quatrainId) return q;
        const newBars = [...q.bars] as [Bar, Bar, Bar, Bar];
        const originalBar = newBars[barIndex];
        newBars[barIndex] = {
          ...originalBar,
          ...barUpdates,
          // إعادة توليد الحسابات التلقائية متى تغيرت الدقات
          beats: barUpdates.beats || originalBar.beats,
        };

        // تحديث إجمالي الشدة وعدد المقاطع للبار
        const updatedBar = newBars[barIndex];
        const totalSyllables = updatedBar.beats.reduce(
          (sum, b) => sum + (b.syllable ? b.syllable.split(/[\s-]/).length : 0),
          0
        );
        updatedBar.syllableCount = totalSyllables;

        let baseScore = 40;
        const filled = updatedBar.beats.filter((b) => b.syllable.length > 0).length;
        baseScore += (filled / 4) * 35;
        const spikeCount = updatedBar.beats.filter((b) => b.isSpike).length;
        baseScore += spikeCount * 5;
        updatedBar.intensityScore = Math.min(100, baseScore);

        return {
          ...q,
          bars: newBars,
          coherenceScore: calculateQuatrainCoherence({
            ...q,
            bars: newBars,
          }),
          dynamicRange: calculateDynamicRange({
            ...q,
            bars: newBars,
          }),
        };
      });

      set({ activeQuatrains: quatrains });
      get().actions.refreshMatrix();
    },

    setSyncopationLevel: (level: SyncopationLevel) => {
      set((state) => ({
        syncopationConfig: { ...state.syncopationConfig, level },
      }));

      // إعادة تطبيق السنكبة على كافة بارات الرباعية الأولى
      const quatrains = get().activeQuatrains.map((q, qIndex) => {
        if (qIndex > 0) return q;
        const newBars = q.bars.map((bar) => applySyncopation(bar, level)) as [Bar, Bar, Bar, Bar];
        return {
          ...q,
          bars: newBars,
          coherenceScore: calculateQuatrainCoherence({ ...q, bars: newBars }),
        };
      });

      set({ activeQuatrains: quatrains });
      get().actions.refreshMatrix();
    },

    updateSyncopationConfig: (config: Partial<SyncopationConfig>) => {
      set((state) => ({
        syncopationConfig: { ...state.syncopationConfig, ...config },
      }));
    },

    addScatPattern: (pattern: ScatPattern) => {
      set((state) => ({
        scattingSession: {
          ...state.scattingSession,
          patterns: [...state.scattingSession.patterns, pattern],
        },
      }));
      get().actions.refreshMatrix();
    },

    removeScatPattern: (id: string) => {
      set((state) => ({
        scattingSession: {
          ...state.scattingSession,
          patterns: state.scattingSession.patterns.filter((p) => p.id !== id),
        },
      }));
      get().actions.refreshMatrix();
    },

    updateScattingSession: (session: Partial<ScattingSession>) => {
      set((state) => ({
        scattingSession: { ...state.scattingSession, ...session },
      }));
    },

    setIntonationCurve: (curve: IntonationCurvePoint[]) => {
      set({ intonationCurve: curve });
      get().actions.refreshMatrix();
    },

    addIntonationProfile: (profile: IntonationProfile) => {
      set((state) => ({
        intonationProfiles: [...state.intonationProfiles, profile],
      }));
    },

    removeIntonationProfile: (id: string) => {
      set((state) => ({
        intonationProfiles: state.intonationProfiles.filter((p) => p.id !== id),
      }));
    },

    addTonalSpike: (spike: TonalSpike) => {
      set((state) => ({
        tonalSpikes: [...state.tonalSpikes, spike],
      }));
      get().actions.refreshMatrix();
    },

    removeTonalSpike: (id: string) => {
      set((state) => ({
        tonalSpikes: state.tonalSpikes.filter((s) => s.id !== id),
      }));
      get().actions.refreshMatrix();
    },

    updateTonalSpike: (id: string, updates: Partial<TonalSpike>) => {
      set((state) => ({
        tonalSpikes: state.tonalSpikes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
      get().actions.refreshMatrix();
    },

    setBeatRideConfig: (config: Partial<BeatRideConfig>) => {
      set((state) => ({
        beatRideConfig: { ...state.beatRideConfig, ...config },
      }));
    },

    addTransition: (config: TransitionConfig) => {
      set((state) => ({
        transitionConfigs: [...state.transitionConfigs, config],
      }));
    },

    removeTransition: (id: string) => {
      set((state) => ({
        transitionConfigs: state.transitionConfigs.filter((c) => c.id !== id),
      }));
    },

    updateTransition: (id: string, updates: Partial<TransitionConfig>) => {
      set((state) => ({
        transitionConfigs: state.transitionConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    },

    computeMatrix: () => {
      const q = get().activeQuatrains;
      const scat = get().scattingSession.patterns;
      const curve = get().intonationCurve;
      const spikes = get().tonalSpikes;

      const matrix = computeLayeredFlowMatrix(q, scat, curve, spikes);
      set({ layeredMatrix: matrix });
    },

    refreshMatrix: () => {
      get().actions.computeMatrix();
      get().actions.updateAnalytics();
      get().actions.calculateMasteryLevel();
    },

    setActiveTab: (tab: MethodologyTab) => {
      set({ activeMethodologyTab: tab });
    },

    calculateMasteryLevel: () => {
      const scatCount = get().scattingSession.patterns.filter((p) => p.syllables.length > 0).length;
      const spikeCount = get().tonalSpikes.length;
      const curveCount = get().intonationCurve.length;

      let level: 1 | 2 | 3 | 4 = 1;
      if (scatCount > 1 && spikeCount > 1 && curveCount > 4) {
        level = 4; // مستوى النخبة الملكي
      } else if (scatCount > 0 && spikeCount > 0) {
        level = 3; // محترف
      } else if (scatCount > 0 || curveCount > 2) {
        level = 2; // ممارس
      }
      set({ masteryLevel: level });
    },

    resetMethodology: (tab?: MethodologyTab) => {
      if (!tab || tab === "skeleton") {
        set({
          activeQuatrains: [generateQuatrain("AABB", "storytelling")],
          activeRhymeScheme: "AABB",
        });
      }
      if (!tab || tab === "scatting") {
        set({ scattingSession: createScattingSession(90, ["kick", "snare", "hihat"]) });
      }
      if (!tab || tab === "intonation") {
        set({ intonationCurve: generateDefaultCurve("storytelling") });
      }
      if (!tab || tab === "advanced") {
        set({ tonalSpikes: [] });
      }
      if (!tab || tab === "transitions") {
        set({ transitionConfigs: [] });
      }
      get().actions.refreshMatrix();
    },

    exportState: () => {
      const {
        activeRhymeScheme,
        activeQuatrains,
        syncopationConfig,
        scattingSession,
        intonationCurve,
        tonalSpikes,
        beatRideConfig,
        transitionConfigs,
      } = get();
      return JSON.stringify({
        activeRhymeScheme,
        activeQuatrains,
        syncopationConfig,
        scattingSession,
        intonationCurve,
        tonalSpikes,
        beatRideConfig,
        transitionConfigs,
      });
    },

    importState: (json: string) => {
      try {
        const parsed = JSON.parse(json);
        set(parsed);
        get().actions.refreshMatrix();
      } catch (e) {
        console.error("Failed to import state:", e);
      }
    },

    completeExercise: (id: string) => {
      set((state) => {
        const updated = state.exercises.map((ex) => (ex.id === id ? { ...ex, isCompleted: true } : ex));
        const completedCount = updated.filter((ex) => ex.isCompleted).length;
        return {
          exercises: updated,
          analytics: {
            ...state.analytics,
            exercisesCompleted: completedCount,
          },
        };
      });
    },

    resetExercises: () => {
      set((state) => ({
        exercises: state.exercises.map((ex) => ({ ...ex, isCompleted: false })),
        analytics: {
          ...state.analytics,
          exercisesCompleted: 0,
        },
      }));
    },

    updateAnalytics: () => {
      set((state) => {
        const totalBars = state.activeQuatrains.flatMap((q) => q.bars).length;
        const totalCoherence = state.layeredMatrix?.overallCoherence ?? 75;
        const totalDensity = Math.round(
          state.activeQuatrains.flatMap((q) => q.bars).reduce((sum, b) => sum + b.syllableCount, 0) /
            Math.max(totalBars, 1)
        );

        return {
          analytics: {
            ...state.analytics,
            totalBarsCreated: totalBars,
            averageCoherence: totalCoherence,
            averageDensity: totalDensity,
          },
        };
      });
    },
  },
}));
