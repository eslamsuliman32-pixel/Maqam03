import { create } from "zustand";

// ════════════════════════════════════════════════════
//                    CORE TYPES
// ════════════════════════════════════════════════════

export type InstrumentId =
  | "synth-lead"
  | "strings"
  | "brass"
  | "vocal-lead"
  | "oud"
  | "percussion";

export type EmotionMode =
  | "aggressive"
  | "sad"
  | "cinematic"
  | "triumphant"
  | "neutral";

export type CellType = "word" | "scat" | "pause" | "combo";

export type IntensityLevel = "low" | "medium" | "high" | "extreme";

export interface FrequencyPoint {
  time: number;       // ثانية
  frequency: number;  // 80Hz - 800Hz
  amplitude: number;  // 0 - 1
}

export interface LeadCurve {
  instrument: InstrumentId;
  dataPoints: FrequencyPoint[];
  dominantNote: string;
  maqamZone: string; // منطقة المقام: "صبا" | "حجاز" | "رست"
}

export interface AnalysisResult {
  leadCurves: LeadCurve[];
  bpm: number;
  keySignature: string;
  maqamType: string;
  crowdingZones: { start: number; end: number; severity: number }[];
  readyForPlacement: boolean;
  reverseEngineeredPatterns: string[];
  syllableCache: Record<string, number>;
}

export interface FlowCell {
  id: string;
  startTime: number;
  duration: number;
  text: string;
  type: CellType;
  intensity: IntensityLevel;
  pitchTarget?: number;
  emotion?: EmotionMode;
  isAnchored: boolean;
}

export interface FlowBar {
  id: string;
  index: number;
  cells: FlowCell[];
  words: string;
  intensity: IntensityLevel;
  rhymeEnd: string;
  syllableCount: number;
  matchScore: number; // 0 - 1
  emotionTag: EmotionMode;
}

export interface InstrumentChannel {
  id: InstrumentId;
  name: string;
  nameAr: string;
  isMuted: boolean;
  isActive: boolean;
  solo: boolean;
  volume: number;     // 0 - 100
  color: string;
}

export interface ScatTemplate {
  id: string;
  title: string;
  syllables: string[];
  description: string;
  tempo: "slow" | "medium" | "fast";
  emotion: EmotionMode;
}

export interface SuggestionResult {
  bar: FlowBar;
  relevanceScore: number; // 0 - 1  (0.85 = 8.5/10)
  matchReason: string;
  emotionAlign: number;
  rhythmAlign: number;
}

export interface CanvasViewport {
  startTime: number;
  zoom: number;         // 1x - 20x
  totalDuration: number;
  pixelsPerSecond: number;
}

export interface FlowEvaluation {
  clarity: number;      // 0 - 100
  coherence: number;    // 0 - 100
  crowding: number;     // 0 - 100 (عكسي)
  impact: number;       // 0 - 100
  overallScore: number; // 0 - 10
  notes: string[];
  readyForRecording: boolean;
}

export interface MaqamFlowState {
  // ── Core State ──
  activeLeadInstrument: InstrumentId;
  analysisResult: AnalysisResult | null;
  canvasViewport: CanvasViewport;
  flowBars: FlowBar[];
  flowCells: FlowCell[];
  instruments: InstrumentChannel[];
  suggestions: SuggestionResult[];
  evaluation: FlowEvaluation | null;
  emotionMode: EmotionMode;
  isAnalyzing: boolean;
  isProcessingCache: boolean;
  syllableCacheReady: boolean;
  reverseEngineering: boolean;

  // ── Actions ──
  actions: {
    setActiveInstrument: (id: InstrumentId) => void;
    toggleMute: (id: InstrumentId) => void;
    setSolo: (id: InstrumentId) => void;
    setVolume: (id: InstrumentId, volume: number) => void;
    setZoom: (zoom: number) => void;
    panViewport: (deltaTime: number) => void;
    setStartTime: (t: number) => void;
    addCell: (cell: Omit<FlowCell, "id">) => void;
    removeCell: (id: string) => void;
    updateCell: (id: string, updates: Partial<FlowCell>) => void;
    addBar: (bar: Omit<FlowBar, "id">) => void;
    removeBar: (id: string) => void;
    setEmotionMode: (mode: EmotionMode) => void;
    runAnalysis: (audioBuffer?: AudioBuffer) => Promise<void>;
    runReverseEngineering: () => Promise<void>;
    buildSyllableCache: () => void;
    generateSuggestions: () => void;
    evaluateFlow: () => void;
    applyScatTemplate: (template: ScatTemplate) => void;
    resetSession: () => void;
  };
}

// ════════════════════════════════════════════════════
//              DEFAULT DATA
// ════════════════════════════════════════════════════

const DEFAULT_INSTRUMENTS: InstrumentChannel[] = [
  {
    id: "synth-lead",
    name: "Synth Lead",
    nameAr: "السينث القائد",
    isMuted: false,
    isActive: true,
    solo: false,
    volume: 80,
    color: "#D4A017",
  },
  {
    id: "strings",
    name: "Strings",
    nameAr: "الوتريات",
    isMuted: false,
    isActive: false,
    solo: false,
    volume: 65,
    color: "#7C3AED",
  },
  {
    id: "brass",
    name: "Brass",
    nameAr: "النحاسيات",
    isMuted: true,
    isActive: false,
    solo: false,
    volume: 70,
    color: "#DC2626",
  },
  {
    id: "vocal-lead",
    name: "Vocal Lead",
    nameAr: "الصوت القائد",
    isMuted: false,
    isActive: false,
    solo: false,
    volume: 90,
    color: "#059669",
  },
  {
    id: "oud",
    name: "Oud",
    nameAr: "العود",
    isMuted: false,
    isActive: false,
    solo: false,
    volume: 75,
    color: "#B45309",
  },
  {
    id: "percussion",
    name: "Percussion",
    nameAr: "الإيقاعات",
    isMuted: false,
    isActive: false,
    solo: false,
    volume: 85,
    color: "#0891B2",
  },
];

export const SCAT_TEMPLATES: ScatTemplate[] = [
  {
    id: "emotional-mmm",
    title: "دندنة عاطفية",
    syllables: ["مْ", "مْ", "آ", "هْ"],
    description: "للفواصل الرائعة والأجواء العميقة",
    tempo: "slow",
    emotion: "sad",
  },
  {
    id: "fast-da-ba",
    title: "نبرة سريعة",
    syllables: ["دا", "با", "دي", "أو"],
    description: "على إيقاعات التراب السريعة والحادة",
    tempo: "fast",
    emotion: "aggressive",
  },
  {
    id: "hook-woh",
    title: "هوك الذروة",
    syllables: ["وو", "يا", "أو", "يا"],
    description: "للهوك والارتفاعات الدرامية",
    tempo: "medium",
    emotion: "triumphant",
  },
  {
    id: "cinematic-aaah",
    title: "سينمائي ملحمي",
    syllables: ["آاه", "واو", "مم", "آاه"],
    description: "للمشاهد الملحمية والدراما العالية",
    tempo: "slow",
    emotion: "cinematic",
  },
  {
    id: "arabic-classic",
    title: "طرب عربي",
    syllables: ["يا", "لَيْل", "يا", "عَيْن"],
    description: "قالب الطرب العربي الأصيل",
    tempo: "medium",
    emotion: "sad",
  },
];

// ════════════════════════════════════════════════════
//           SYLLABLE ESTIMATION ENGINE
// ════════════════════════════════════════════════════

export const estimateSyllablesArabic = (text: string): number => {
  if (!text) return 0;
  const vowels = (text.match(/[اوياًًٌٍَُِ]/g) || []).length;
  const words = text.trim().split(/\s+/).length;
  return Math.max(words, Math.round(vowels * 0.8 + words * 0.5));
};

// ════════════════════════════════════════════════════
//           FLOW EVALUATION ENGINE
// ════════════════════════════════════════════════════

export const evaluateWriting = (
  bars: FlowBar[],
  analysisResult: AnalysisResult | null
): FlowEvaluation => {
  if (bars.length === 0) {
    return {
      clarity: 0,
      coherence: 0,
      crowding: 0,
      impact: 0,
      overallScore: 0,
      notes: ["لا توجد بارات للتقييم"],
      readyForRecording: false,
    };
  }

  let clarity = 75;
  let coherence = 70;
  let crowding = 15;
  let impact = 55;
  const notes: string[] = [];

  bars.forEach((bar) => {
    const syllables = estimateSyllablesArabic(bar.words);
    bar.syllableCount = syllables;

    // فحص الازدحام
    if (bar.intensity === "high" && syllables > 9) {
      crowding += 16;
      clarity -= 8;
      notes.push(`بار ${bar.index}: ازدحام مقطعي — ${syllables} مقطع على إيقاع حاد`);
    } else if (bar.intensity === "extreme" && syllables > 11) {
      crowding += 25;
      clarity -= 14;
      notes.push(`بار ${bar.index}: ازدحام شديد — يُنصح بإعادة الهيكلة`);
    }

    // مكافأة التوازن
    if (syllables >= 6 && syllables <= 9 && bar.intensity !== "extreme") {
      clarity += 5;
      coherence += 3;
    }

    // فحص التوافق مع تحليل الآلة
    if (analysisResult && bar.matchScore > 0.75) {
      impact += 8;
      coherence += 5;
    }
  });

  // تطبيع القيم
  clarity = Math.max(0, Math.min(100, clarity));
  coherence = Math.max(0, Math.min(100, coherence));
  crowding = Math.max(0, Math.min(100, crowding));
  impact = Math.max(0, Math.min(100, impact));

  const overallScore = parseFloat(
    (
      (clarity * 0.3 + coherence * 0.25 + (100 - crowding) * 0.2 + impact * 0.25) /
      10
    ).toFixed(1)
  );

  if (notes.length === 0) {
    notes.push("الفلو متوازن — جاهز للتسجيل ✓");
  }

  return {
    clarity,
    coherence,
    crowding,
    impact,
    overallScore,
    notes,
    readyForRecording: overallScore >= 7.0 && crowding < 50,
  };
};

// ════════════════════════════════════════════════════
//           MOCK ANALYSIS GENERATOR
// ════════════════════════════════════════════════════

const generateMockAnalysis = (): AnalysisResult => {
  const instruments: InstrumentId[] = [
    "synth-lead", "strings", "brass", "vocal-lead", "oud", "percussion",
  ];

  const leadCurves: LeadCurve[] = instruments.map((inst) => ({
    instrument: inst,
    dataPoints: Array.from({ length: 80 }, (_, i) => ({
      time: i * 0.125,
      frequency:
        200 +
        Math.sin(i * 0.15) * 150 +
        Math.sin(i * 0.07) * 80 +
        (Math.random() - 0.5) * 40,
      amplitude: 0.4 + Math.sin(i * 0.2) * 0.3 + Math.random() * 0.3,
    })),
    dominantNote: ["D", "G", "A", "E", "F", "C"][
      Math.floor(Math.random() * 6)
    ],
    maqamZone: ["صبا", "حجاز", "رست", "بياتي", "نهاوند"][
      Math.floor(Math.random() * 5)
    ],
  }));

  return {
    leadCurves,
    bpm: 87 + Math.floor(Math.random() * 20),
    keySignature: "D Minor",
    maqamType: "حجاز كار",
    crowdingZones: [
      { start: 2.5, end: 4.0, severity: 0.7 },
      { start: 7.2, end: 8.5, severity: 0.4 },
    ],
    readyForPlacement: true,
    reverseEngineeredPatterns: [
      "4/4 تنازلي",
      "بوليريدم في الثانية الخامسة",
      "تسارع لحني عند الثانية 3.2",
    ],
    syllableCache: {
      "أنا": 2,
      "الليل": 3,
      "يا": 1,
    },
  };
};

// ════════════════════════════════════════════════════
//                  ZUSTAND STORE
// ════════════════════════════════════════════════════

// We'll insert some mock initial bars so the Suggestions Panel and Flow Evaluation show real-time values immediately
const SEED_FLOW_BARS: FlowBar[] = [
  {
    id: "bar-1",
    index: 1,
    words: "يا ليل طال المدى والقلب مجروحُ",
    intensity: "high",
    rhymeEnd: "وحُ",
    syllableCount: 9,
    matchScore: 0.85,
    emotionTag: "sad",
    cells: []
  },
  {
    id: "bar-2",
    index: 2,
    words: "أصيح بالصوت لعل الحبيب يسمعُ",
    intensity: "medium",
    rhymeEnd: "معُ",
    syllableCount: 10,
    matchScore: 0.78,
    emotionTag: "sad",
    cells: []
  },
  {
    id: "bar-3",
    index: 3,
    words: "نار بصدري ودمعي بالخد مسفوحُ",
    intensity: "extreme",
    rhymeEnd: "وحُ",
    syllableCount: 9,
    matchScore: 0.9,
    emotionTag: "sad",
    cells: []
  }
];

export const useMaqamFlowStore = create<MaqamFlowState>((set, get) => ({
  activeLeadInstrument: "synth-lead",
  analysisResult: null,
  canvasViewport: {
    startTime: 0,
    zoom: 1,
    totalDuration: 10,
    pixelsPerSecond: 100,
  },
  flowBars: SEED_FLOW_BARS,
  flowCells: [],
  instruments: DEFAULT_INSTRUMENTS,
  suggestions: [],
  evaluation: null,
  emotionMode: "neutral",
  isAnalyzing: false,
  isProcessingCache: false,
  syllableCacheReady: false,
  reverseEngineering: false,

  actions: {
    setActiveInstrument: (id) =>
      set((state) => {
        const instruments = state.instruments.map((inst) => ({
          ...inst,
          isActive: inst.id === id,
        }));
        return { instruments, activeLeadInstrument: id };
      }),

    toggleMute: (id) =>
      set((state) => {
        const instruments = state.instruments.map((inst) =>
          inst.id === id ? { ...inst, isMuted: !inst.isMuted } : inst
        );
        return { instruments };
      }),

    setSolo: (id) =>
      set((state) => {
        const current = state.instruments.find((i) => i.id === id);
        if (!current) return {};
        const isSoloing = current.solo;
        const instruments = state.instruments.map((inst) => {
          const isTarget = inst.id === id;
          return {
            ...inst,
            solo: isTarget ? !isSoloing : false,
            isMuted: isSoloing ? false : !isTarget,
          };
        });
        return { instruments };
      }),

    setVolume: (id, volume) =>
      set((state) => {
        const instruments = state.instruments.map((inst) =>
          inst.id === id
            ? { ...inst, volume: Math.max(0, Math.min(100, volume)) }
            : inst
        );
        return { instruments };
      }),

    setZoom: (zoom) =>
      set((state) => ({
        canvasViewport: {
          ...state.canvasViewport,
          zoom: Math.max(1, Math.min(20, zoom)),
        },
      })),

    panViewport: (deltaTime) =>
      set((state) => {
        const vp = state.canvasViewport;
        const viewDuration = 10 / vp.zoom;
        const maxStart = Math.max(0, vp.totalDuration - viewDuration);
        const startTime = Math.max(
          0,
          Math.min(maxStart, vp.startTime + deltaTime)
        );
        return {
          canvasViewport: {
            ...vp,
            startTime,
          },
        };
      }),

    setStartTime: (t) =>
      set((state) => ({
        canvasViewport: {
          ...state.canvasViewport,
          startTime: Math.max(0, t),
        },
      })),

    addCell: (cellData) =>
      set((state) => {
        const cell: FlowCell = {
          ...cellData,
          id: `cell-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
        return {
          flowCells: [...state.flowCells, cell],
        };
      }),

    removeCell: (id) =>
      set((state) => ({
        flowCells: state.flowCells.filter((c) => c.id !== id),
      })),

    updateCell: (id, updates) =>
      set((state) => ({
        flowCells: state.flowCells.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

    addBar: (barData) =>
      set((state) => {
        const bar: FlowBar = {
          ...barData,
          id: `bar-${Date.now()}`,
        };
        return {
          flowBars: [...state.flowBars, bar],
        };
      }),

    removeBar: (id) =>
      set((state) => ({
        flowBars: state.flowBars.filter((b) => b.id !== id),
      })),

    setEmotionMode: (mode) =>
      set((state) => {
        // Trigger suggestions update upon emotion change for beautiful reactivity
        setTimeout(() => get().actions.generateSuggestions(), 50);
        return { emotionMode: mode };
      }),

    runAnalysis: async () => {
      set({ isAnalyzing: true });
      await new Promise((r) => setTimeout(r, 1400));
      const result = generateMockAnalysis();
      set({ analysisResult: result, isAnalyzing: false });
      get().actions.buildSyllableCache();
      get().actions.generateSuggestions();
      get().actions.evaluateFlow();
    },

    runReverseEngineering: async () => {
      set({ reverseEngineering: true });
      await new Promise((r) => setTimeout(r, 900));
      set((state) => {
        if (state.analysisResult) {
          const updatedAnalysis = {
            ...state.analysisResult,
            reverseEngineeredPatterns: [
              "نمط تنازلي 4/4 مكتشف",
              "بوليريدم ثانوي في المقطع 2",
              "تصاعد لحني عند الثانية 3.2",
              "منطقة صمت موصى بها: 5.8s — 6.2s",
            ],
          };
          return { analysisResult: updatedAnalysis };
        }
        return {};
      });
      set({ reverseEngineering: false });
    },

    buildSyllableCache: () => {
      set({ isProcessingCache: true });
      const bars = get().flowBars;
      bars.forEach((bar) => {
        estimateSyllablesArabic(bar.words);
      });
      setTimeout(
        () => set({ isProcessingCache: false, syllableCacheReady: true }),
        400
      );
    },

    generateSuggestions: () => {
      const { flowBars, emotionMode, analysisResult } = get();
      if (flowBars.length === 0 || !analysisResult) return;

      const suggestions: SuggestionResult[] = flowBars
        .slice(0, 6)
        .map((bar) => {
          const emotionScore =
            bar.emotionTag === emotionMode
              ? 0.95
              : bar.emotionTag === "neutral"
              ? 0.6
              : 0.3;

          const rhythmScore = bar.matchScore || Math.random() * 0.4 + 0.55;
          const relevanceScore = emotionScore * 0.5 + rhythmScore * 0.5;

          return {
            bar,
            relevanceScore: parseFloat(relevanceScore.toFixed(2)),
            matchReason:
              emotionScore > 0.8
                ? "توافق عاطفي ممتاز مع المقام"
                : "إيقاع متوافق مع الحجاز",
            emotionAlign: emotionScore,
            rhythmAlign: rhythmScore,
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      set({ suggestions });
    },

    evaluateFlow: () => {
      const { flowBars, analysisResult } = get();
      const evaluation = evaluateWriting(flowBars, analysisResult);
      set({ evaluation });
    },

    applyScatTemplate: (template) => {
      const viewport = get().canvasViewport;
      const startOffset = viewport.startTime;
      template.syllables.forEach((syllable, idx) => {
        get().actions.addCell({
          startTime: startOffset + idx * 0.4,
          duration: 0.35,
          text: syllable,
          type: "scat",
          intensity: template.tempo === "fast" ? "high" : "medium",
          emotion: template.emotion,
          isAnchored: false,
        });
      });
      get().actions.evaluateFlow();
    },

    resetSession: () =>
      set({
        flowBars: SEED_FLOW_BARS,
        flowCells: [],
        analysisResult: null,
        suggestions: [],
        evaluation: null,
        syllableCacheReady: false,
      }),
  },
}));
