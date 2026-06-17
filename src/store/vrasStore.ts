import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ════════════════════════════════════════════════════
//                    CORE TYPES
// ════════════════════════════════════════════════════

export type SectionType =
  | "intro"
  | "verse"
  | "chorus"
  | "bridge"
  | "outro"
  | "hook"
  | "pre-chorus";

export type RhymeScheme = "AA" | "AB" | "AABB" | "ABAB" | "AAAA" | "free";

export type EmotionTag =
  | "aggressive"
  | "sad"
  | "triumphant"
  | "cinematic"
  | "neutral"
  | "romantic";

export type EnergyLevel = "silent" | "low" | "medium" | "high" | "peak";

export type BarStatus =
  | "empty"
  | "suggested"
  | "placed"
  | "locked"
  | "conflict";

// ── نقطة دقة إيقاعية واحدة ──
export interface BeatPoint {
  time: number;        // بالثانية
  type: "kick" | "snare" | "hihat" | "bass" | "melody";
  amplitude: number;   // 0-1
  bar: number;         // رقم البار
  beat: number;        // رقم الدقة داخل البار (1-4)
  subdivision: number; // التقسيم الفرعي
}

// ── قسم موسيقي واحد ──
export interface MusicalSection {
  id: string;
  type: SectionType;
  label: string;
  startTime: number;
  endTime: number;
  startBar: number;
  endBar: number;
  barCount: number;
  energyProfile: EnergyLevel[];  // مستوى الطاقة لكل بار
  recommendedSyllables: number[]; // عدد المقاطع الموصى به لكل بار
  color: string;
  isExpanded: boolean;
}

// ── تحليل البيت الموسيقي الكامل ──
export interface BeatAnalysis {
  fileName: string;
  duration: number;          // المدة الكلية بالثانية
  bpm: number;               // النبضات في الدقيقة
  timeSignature: string;     // مثل "4/4"
  totalBars: number;
  beatsPerBar: number;
  secondsPerBar: number;
  secondsPerBeat: number;
  keySignature: string;
  maqamType: string;
  energyMap: number[];       // خريطة الطاقة (0-1) لكل ثانية
  kickPositions: number[];   // مواضع الكيك بالثانية
  snarePositions: number[];  // مواضع السنير بالثانية
  basslineEnergy: number[];  // طاقة الباسلاين لكل بار
  beatPoints: BeatPoint[];
  sections: MusicalSection[];
  crowdingRisk: number[];    // خطر الازدحام لكل بار (0-1)
  suggestedBarCount: number;
  waveformData: number[];    // بيانات الشكل الموجي للعرض
}

// ── بار نصي واحد من قاعدة البيانات ──
export interface TextBar {
  id: string;
  text: string;               // نص البار
  syllableCount: number;      // عدد المقاطع الصوتية
  rhymeEnd: string;           // قافية النهاية
  rhymeScheme: RhymeScheme;
  emotion: EmotionTag;
  energy: EnergyLevel;
  hasInternalRhyme: boolean;  // قافية داخلية
  explosiveLetterRatio: number; // نسبة الحروف الانفجارية (0-1)
  wordCount: number;
  tags: string[];             // وسوم إضافية
  matchScore?: number;        // درجة المطابقة (تُحسب ديناميكيًا)
}

// ── خلية وضع بار داخل الشبكة ──
export interface BarSlot {
  id: string;
  slotIndex: number;          // رقم الخلية في القسم
  sectionId: string;
  globalBarIndex: number;     // الرقم الكلي في البيت
  status: BarStatus;
  placedBar: TextBar | null;
  suggestedBars: TextBar[];
  targetSyllables: number;    // عدد المقاطع المستهدف
  energyLevel: EnergyLevel;
  rhymePosition: "A" | "B" | "C" | "free";
  timeRange: [number, number]; // [start, end] بالثانية
  isHighlighted: boolean;
  aiNote?: string;            // ملاحظة المساعد الذكي
}

// ── نتيجة اقتراح المساعد الذكي ──
export interface AIAdvice {
  id: string;
  targetSlotId?: string;
  type: "internal-rhyme" | "explosive-letters" | "syllable-adjust" | "emotion-shift" | "flow-break";
  title: string;
  body: string;
  priority: "low" | "medium" | "high" | "critical";
  actionLabel?: string;
  icon: string;
}

// ── إحصائيات الجلسة ──
export interface SessionStats {
  totalSlots: number;
  filledSlots: number;
  avgMatchScore: number;
  rhymeConsistency: number;  // 0-100
  flowScore: number;         // 0-10
  energyBalance: number;     // 0-100
  readyForRecording: boolean;
}

// ── حالة المشغّل الصوتي ──
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loopStart: number | null;   // نقطة بداية التكرار
  loopEnd: number | null;     // نقطة نهاية التكرار
  isLooping: boolean;
  playbackRate: number;       // سرعة التشغيل 0.5 - 2.0
}

// ── حالة عرض الـ Canvas ──
export interface CanvasViewState {
  scrollX: number;
  zoom: number;               // 1 - 10
  highlightedSection: string | null;
  showKickMarkers: boolean;
  showEnergyMap: boolean;
  showSectionLabels: boolean;
  showSyllableGuide: boolean;
  selectedSlotId: string | null;
  hoveredTime: number | null;
}

// ════════════════════════════════════════════════════
//                MAIN STORE STATE
// ════════════════════════════════════════════════════

export interface VRASState {
  // ── الحالة الرئيسية ──
  phase: "upload" | "analyzing" | "ready" | "composing";
  audioFile: File | null;
  audioUrl: string | null;
  beatAnalysis: BeatAnalysis | null;
  barDatabase: TextBar[];
  barSlots: BarSlot[];
  aiAdvices: AIAdvice[];
  sessionStats: SessionStats | null;
  player: PlayerState;
  canvas: CanvasViewState;
  isAnalyzing: boolean;
  analysisProgress: number;   // 0-100

  // ── الفلاتر ──
  activeEmotionFilter: EmotionTag | "all";
  activeSectionFilter: string | null;
  searchQuery: string;

  actions: {
    // ── تحميل الملف ──
    uploadAudio: (file: File) => Promise<void>;
    runBeatAnalysis: () => Promise<void>;

    // ── قاعدة البيانات ──
    loadBarDatabase: (bars: TextBar[]) => void;
    addBar: (bar: Omit<TextBar, "id">) => void;
    removeBar: (id: string) => void;
    importBarsFromText: (rawText: string) => void;

    // ── إدارة الخلايا ──
    placeBarInSlot: (slotId: string, bar: TextBar) => void;
    removeBarFromSlot: (slotId: string) => void;
    lockSlot: (slotId: string) => void;
    autoFillSection: (sectionId: string) => void;
    autoFillAll: () => void;
    generateSuggestionsForSlot: (slotId: string) => void;

    // ── المشغّل ──
    play: () => void;
    pause: () => void;
    seekTo: (time: number) => void;
    setVolume: (v: number) => void;
    setLoop: (start: number, end: number) => void;
    clearLoop: () => void;
    setPlaybackRate: (rate: number) => void;

    // ── Canvas ──
    setZoom: (z: number) => void;
    setScrollX: (x: number) => void;
    toggleKickMarkers: () => void;
    toggleEnergyMap: () => void;
    selectSlot: (id: string | null) => void;
    setHoveredTime: (t: number | null) => void;

    // ── الفلاتر ──
    setEmotionFilter: (e: EmotionTag | "all") => void;
    setSearchQuery: (q: string) => void;

    // ── المساعد الذكي ──
    generateAIAdvices: () => void;
    dismissAdvice: (id: string) => void;
    applyAdvice: (id: string) => void;

    // ── الإحصائيات ──
    recalculateStats: () => void;
    exportSession: () => object;
    resetSession: () => void;
  };
}

// ════════════════════════════════════════════════════
//                 UTILITY ENGINES
// ════════════════════════════════════════════════════

export const estimateSyllablesArabic = (text: string): number => {
  if (!text.trim()) return 0;
  const longVowels = (text.match(/[اويى]/g) || []).length;
  const shortVowels = (text.match(/[\u064E\u064F\u0650]/g) || []).length;
  const words = text.trim().split(/\s+/).length;
  return Math.max(words, Math.round(longVowels * 1.2 + shortVowels * 0.7 + words * 0.4));
};

export const detectRhymeEnd = (text: string): string => {
  const words = text.trim().split(/\s+/);
  const last = words[words.length - 1];
  return last?.slice(-3) || "";
};

export const countExplosiveLetters = (text: string): number => {
  const explosives = /[بتدكقطضظ]/g;
  return (text.match(explosives) || []).length;
};

export const matchBarToSlot = (bar: TextBar, slot: BarSlot): number => {
  let score = 0;
  const syllableDiff = Math.abs(bar.syllableCount - slot.targetSyllables);
  score += Math.max(0, 1 - syllableDiff / 5) * 40;
  const energyMap: Record<EnergyLevel, number> = {
    silent: 0, low: 1, medium: 2, high: 3, peak: 4,
  };
  const energyDiff = Math.abs(energyMap[bar.energy] - energyMap[slot.energyLevel]);
  score += Math.max(0, 1 - energyDiff / 4) * 30;
  score += bar.hasInternalRhyme ? 15 : 0;
  score += bar.explosiveLetterRatio * 15;
  return Math.round(Math.min(100, score));
};

// ── توليد بيانات التحليل المحاكاة ──
const generateMockBeatAnalysis = (fileName: string): BeatAnalysis => {
  const bpm = 88;
  const duration = 192; // 3 دقائق و12 ثانية
  const beatsPerBar = 4;
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * beatsPerBar;
  const totalBars = Math.floor(duration / secondsPerBar);

  // توليد خريطة الطاقة
  const energyMap = Array.from({ length: Math.ceil(duration) }, (_, i) => {
    return 0.3 + Math.sin(i * 0.1) * 0.3 + Math.sin(i * 0.05) * 0.2 + Math.random() * 0.2;
  });

  // مواضع الكيك (كل نبضة في الـ 4/4)
  const kickPositions: number[] = [];
  const snarePositions: number[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * secondsPerBar;
    kickPositions.push(barStart);
    kickPositions.push(barStart + secondsPerBeat * 2);
    snarePositions.push(barStart + secondsPerBeat);
    snarePositions.push(barStart + secondsPerBeat * 3);
  }

  // بناء الأقسام الموسيقية
  const sections: MusicalSection[] = [
    {
      id: "sec-intro", type: "intro", label: "المقدمة (Intro)",
      startTime: 0, endTime: 16, startBar: 0, endBar: 5, barCount: 6,
      energyProfile: ["low", "low", "medium", "medium", "medium", "high"],
      recommendedSyllables: [6, 6, 7, 7, 8, 8],
      color: "#7C3AED", isExpanded: true,
    },
    {
      id: "sec-verse1", type: "verse", label: "المقطع الأول (Verse 1)",
      startTime: 16, endTime: 64, startBar: 6, endBar: 21, barCount: 16,
      energyProfile: Array(16).fill("high") as EnergyLevel[],
      recommendedSyllables: Array(16).fill(9),
      color: "#D4A017", isExpanded: true,
    },
    {
      id: "sec-chorus1", type: "chorus", label: "اللازمة الأولى (Chorus)",
      startTime: 64, endTime: 96, startBar: 22, endBar: 31, barCount: 10,
      energyProfile: Array(10).fill("peak") as EnergyLevel[],
      recommendedSyllables: Array(10).fill(7),
      color: "#059669", isExpanded: true,
    },
    {
      id: "sec-verse2", type: "verse", label: "المقطع الثاني (Verse 2)",
      startTime: 96, endTime: 144, startBar: 32, endBar: 47, barCount: 16,
      energyProfile: Array(16).fill("high") as EnergyLevel[],
      recommendedSyllables: Array(16).fill(10),
      color: "#D4A017", isExpanded: true,
    },
    {
      id: "sec-bridge", type: "bridge", label: "الجسر (Bridge)",
      startTime: 144, endTime: 160, startBar: 48, endBar: 53, barCount: 6,
      energyProfile: ["medium", "medium", "high", "high", "peak", "peak"],
      recommendedSyllables: [8, 8, 9, 9, 11, 11],
      color: "#DC2626", isExpanded: true,
    },
    {
      id: "sec-chorus2", type: "chorus", label: "اللازمة الثانية (Chorus)",
      startTime: 160, endTime: 192, startBar: 54, endBar: 63, barCount: 10,
      energyProfile: Array(10).fill("peak") as EnergyLevel[],
      recommendedSyllables: Array(10).fill(7),
      color: "#059669", isExpanded: true,
    },
  ];

  // توليد بيانات الشكل الموجي
  const waveformData = Array.from({ length: 500 }, (_, i) =>
    Math.abs(Math.sin(i * 0.15) * 0.6 + Math.sin(i * 0.07) * 0.3 + Math.random() * 0.1)
  );

  return {
    fileName,
    duration,
    bpm,
    timeSignature: "4/4",
    totalBars,
    beatsPerBar,
    secondsPerBar,
    secondsPerBeat,
    keySignature: "D Minor",
    maqamType: "حجاز كار",
    energyMap,
    kickPositions,
    snarePositions,
    basslineEnergy: Array.from({ length: totalBars }, () => Math.random() * 0.5 + 0.3),
    beatPoints: kickPositions.map((t, i) => ({
      time: t, type: "kick", amplitude: 0.8 + Math.random() * 0.2,
      bar: Math.floor(i / 2), beat: (i % 2) * 2 + 1, subdivision: 1,
    })),
    sections,
    crowdingRisk: Array.from({ length: totalBars }, () => Math.random() * 0.4),
    suggestedBarCount: sections.reduce((sum, s) => sum + s.barCount, 0),
    waveformData,
  };
};

// ── توليد قاعدة بيانات البارات التجريبية ──
const generateSampleDatabase = (): TextBar[] => {
  const sampleBars = [
    { text: "يا ليل طال المدى والقلب مجروحُ", emotion: "sad" as EmotionTag, energy: "high" as EnergyLevel, rhymeEnd: "وحُ", syllableCount: 9 },
    { text: "أصيح بالصوت لعل الحبيب يسمعُ", emotion: "sad" as EmotionTag, energy: "medium" as EnergyLevel, rhymeEnd: "معُ", syllableCount: 10 },
    { text: "نار بصدري ودمعي على الخد مسفوحُ", emotion: "sad" as EmotionTag, energy: "peak" as EnergyLevel, rhymeEnd: "وحُ", syllableCount: 11 },
    { text: "قمت من الأرض أعلى من السماء", emotion: "triumphant" as EmotionTag, energy: "peak" as EnergyLevel, rhymeEnd: "ماء", syllableCount: 8 },
    { text: "كل يوم أبني ما هدموه بالأيدي", emotion: "aggressive" as EmotionTag, energy: "high" as EnergyLevel, rhymeEnd: "يدي", syllableCount: 9 },
    { text: "صوتي رعد والحروف كلها برق", emotion: "aggressive" as EmotionTag, energy: "peak" as EnergyLevel, rhymeEnd: "برق", syllableCount: 7 },
    { text: "من أعماق الظلام جئت بالنور", emotion: "cinematic" as EmotionTag, energy: "medium" as EnergyLevel, rhymeEnd: "نور", syllableCount: 8 },
    { text: "أشعل الليل لهبًا حتى الفجر", emotion: "aggressive" as EmotionTag, energy: "high" as EnergyLevel, rhymeEnd: "فجر", syllableCount: 7 },
    { text: "مشيت على الجمر ولم تحرق أقدامي", emotion: "triumphant" as EmotionTag, energy: "high" as EnergyLevel, rhymeEnd: "دامي", syllableCount: 10 },
    { text: "الليالي شاهدة على صبري الطويل", emotion: "sad" as EmotionTag, energy: "medium" as EnergyLevel, rhymeEnd: "ويل", syllableCount: 9 },
    { text: "كل كلمة سيف وكل سطر ميدان", emotion: "aggressive" as EmotionTag, energy: "peak" as EnergyLevel, rhymeEnd: "دان", syllableCount: 10 },
    { text: "وقفت وحدي في وجه العالم كله", emotion: "triumphant" as EmotionTag, energy: "high" as EnergyLevel, rhymeEnd: "كله", syllableCount: 9 },
  ];

  return sampleBars.map((bar, i) => ({
    id: `bar-db-${i}`,
    ...bar,
    rhymeScheme: "AA",
    hasInternalRhyme: Math.random() > 0.6,
    explosiveLetterRatio: countExplosiveLetters(bar.text) / bar.text.length,
    wordCount: bar.text.split(/\s+/).length,
    tags: [bar.emotion, bar.energy],
    matchScore: undefined,
  }));
};

// ── بناء خلايا البارات من التحليل ──
const buildBarSlots = (analysis: BeatAnalysis, database: TextBar[]): BarSlot[] => {
  const slots: BarSlot[] = [];
  let globalIndex = 0;

  analysis.sections.forEach((section) => {
    for (let i = 0; i < section.barCount; i++) {
      const targetSyllables = section.recommendedSyllables[i] || 8;
      const energyLevel = section.energyProfile[i] || "medium";
      const startTime = section.startTime + i * analysis.secondsPerBar;
      const endTime = startTime + analysis.secondsPerBar;

      const suggestions = database
        .map((bar) => ({
          ...bar,
          matchScore: matchBarToSlot(bar, {
            id: "", slotIndex: i, sectionId: section.id, globalBarIndex: globalIndex,
            status: "empty", placedBar: null, suggestedBars: [],
            targetSyllables, energyLevel,
            rhymePosition: i % 2 === 0 ? "A" : "B",
            timeRange: [startTime, endTime],
            isHighlighted: false,
          }),
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 5);

      slots.push({
        id: `slot-${section.id}-${i}`,
        slotIndex: i,
        sectionId: section.id,
        globalBarIndex: globalIndex,
        status: "empty",
        placedBar: null,
        suggestedBars: suggestions,
        targetSyllables,
        energyLevel,
        rhymePosition: i % 2 === 0 ? "A" : "B",
        timeRange: [startTime, endTime],
        isHighlighted: false,
      });

      globalIndex++;
    }
  });

  return slots;
};

// ── توليد نصائح المساعد الذكي ──
const generateAdvices = (slots: BarSlot[]): AIAdvice[] => {
  const advices: AIAdvice[] = [];

  const emptySlots = slots.filter((s) => s.status === "empty");
  if (emptySlots.length > 0) {
    advices.push({
      id: "adv-empty",
      type: "syllable-adjust",
      title: `${emptySlots.length} خلية فارغة`,
      body: "يوجد خلايا لم تُملأ بعد. استخدم زر التعبئة التلقائية أو اختر بارات يدويًا.",
      priority: "high",
      actionLabel: "تعبئة تلقائية",
      icon: "⚠️",
    });
  }

  const peakSlots = slots.filter((s) => s.energyLevel === "peak" && s.status === "placed");
  if (peakSlots.length > 0) {
    advices.push({
      id: "adv-explosive",
      type: "explosive-letters",
      title: "زد الحروف الانفجارية",
      body: `في ${peakSlots.length} خلية ذات طاقة عالية، يُنصح باستخدام حروف (ب، ت، د، ك، ق) لزيادة التأثير الإيقاعي.`,
      priority: "medium",
      icon: "💥",
    });
  }

  advices.push({
    id: "adv-internal-rhyme",
    type: "internal-rhyme",
    title: "أضف قافية داخلية هنا",
    body: "في البارات من 3 إلى 6 في المقطع الأول، يمكن إضافة قافية داخلية منتصف البار لزيادة التدفق الإيقاعي.",
    priority: "medium",
    icon: "🎯",
  });

  return advices;
};

// ════════════════════════════════════════════════════
//                  STORE CREATION
// ════════════════════════════════════════════════════

const INITIAL_PLAYER: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  loopStart: null,
  loopEnd: null,
  isLooping: false,
  playbackRate: 1,
};

const INITIAL_CANVAS: CanvasViewState = {
  scrollX: 0,
  zoom: 1,
  highlightedSection: null,
  showKickMarkers: true,
  showEnergyMap: true,
  showSectionLabels: true,
  showSyllableGuide: true,
  selectedSlotId: null,
  hoveredTime: null,
};

export const useVRASStore = create<VRASState>()(
  subscribeWithSelector((set, get) => ({
    phase: "upload",
    audioFile: null,
    audioUrl: null,
    beatAnalysis: null,
    barDatabase: generateSampleDatabase(),
    barSlots: [],
    aiAdvices: [],
    sessionStats: null,
    player: INITIAL_PLAYER,
    canvas: INITIAL_CANVAS,
    isAnalyzing: false,
    analysisProgress: 0,
    activeEmotionFilter: "all",
    activeSectionFilter: null,
    searchQuery: "",

    actions: {
      // ── تحميل وتحليل الملف ──
      uploadAudio: async (file) => {
        const url = URL.createObjectURL(file);
        set({ audioFile: file, audioUrl: url, phase: "analyzing" });
        await get().actions.runBeatAnalysis();
      },

      runBeatAnalysis: async () => {
        const { audioFile, barDatabase } = get();
        if (!audioFile) return;

        set({ isAnalyzing: true, analysisProgress: 0 });

        // محاكاة مراحل التحليل التدريجي
        const stages = [
          { progress: 15, delay: 400, msg: "فحص BPM والإيقاع..." },
          { progress: 35, delay: 600, msg: "رسم خريطة الطاقة..." },
          { progress: 55, delay: 500, msg: "تحديد أقسام البيت..." },
          { progress: 75, delay: 700, msg: "تحليل المقامات..." },
          { progress: 90, delay: 400, msg: "بناء الشبكة الإيقاعية..." },
          { progress: 100, delay: 300, msg: "اكتمل التحليل ✓" },
        ];

        for (const stage of stages) {
          await new Promise((r) => setTimeout(r, stage.delay));
          set({ analysisProgress: stage.progress });
        }

        const analysis = generateMockBeatAnalysis(audioFile.name);
        const slots = buildBarSlots(analysis, barDatabase);
        const advices = generateAdvices(slots);

        set({
          beatAnalysis: analysis,
          barSlots: slots,
          aiAdvices: advices,
          player: { ...get().player, duration: analysis.duration },
          phase: "ready",
          isAnalyzing: false,
        });

        get().actions.recalculateStats();
      },

      // ── قاعدة البيانات ──
      loadBarDatabase: (bars) => set({ barDatabase: bars }),

      addBar: (barData) => {
        const bar: TextBar = {
          ...barData,
          id: `bar-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
        set((s) => ({ barDatabase: [...s.barDatabase, bar] }));
      },

      removeBar: (id) =>
        set((s) => ({ barDatabase: s.barDatabase.filter((b) => b.id !== id) })),

      importBarsFromText: (rawText) => {
        const lines = rawText.split("\n").filter((l) => l.trim());
        const bars: TextBar[] = lines.map((line, i) => ({
          id: `imported-${i}`,
          text: line.trim(),
          syllableCount: estimateSyllablesArabic(line),
          rhymeEnd: detectRhymeEnd(line),
          rhymeScheme: "free",
          emotion: "neutral",
          energy: "medium",
          hasInternalRhyme: false,
          explosiveLetterRatio: countExplosiveLetters(line) / line.length,
          wordCount: line.trim().split(/\s+/).length,
          tags: ["imported"],
        }));
        set((s) => ({ barDatabase: [...s.barDatabase, ...bars] }));
      },

      // ── إدارة الخلايا ──
      placeBarInSlot: (slotId, bar) => {
        set((s) => ({
          barSlots: s.barSlots.map((slot) =>
            slot.id === slotId
              ? { ...slot, placedBar: bar, status: "placed" }
              : slot
          ),
        }));
        get().actions.recalculateStats();
        get().actions.generateAIAdvices();
      },

      removeBarFromSlot: (slotId) => {
        set((s) => ({
          barSlots: s.barSlots.map((slot) =>
            slot.id === slotId
              ? { ...slot, placedBar: null, status: "empty" }
              : slot
          ),
        }));
        get().actions.recalculateStats();
      },

      lockSlot: (slotId) => {
        set((s) => ({
          barSlots: s.barSlots.map((slot) =>
            slot.id === slotId
              ? { ...slot, status: slot.status === "locked" ? "placed" : "locked" }
              : slot
          ),
        }));
      },

      generateSuggestionsForSlot: (slotId) => {
        const { barDatabase, barSlots } = get();
        const slot = barSlots.find((s) => s.id === slotId);
        if (!slot) return;

        const suggestions = barDatabase
          .map((bar) => ({ ...bar, matchScore: matchBarToSlot(bar, slot) }))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, 8);

        set((s) => ({
          barSlots: s.barSlots.map((sl) =>
            sl.id === slotId ? { ...sl, suggestedBars: suggestions } : sl
          ),
        }));
      },

      autoFillSection: (sectionId) => {
        const { barSlots, barDatabase } = get();
        const emptyInSection = barSlots.filter(
          (s) => s.sectionId === sectionId && s.status === "empty"
        );

        const updatedSlots = [...barSlots];
        emptyInSection.forEach((slot) => {
          const best = barDatabase
            .map((bar) => ({ ...bar, matchScore: matchBarToSlot(bar, slot) }))
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))[0];

          if (best) {
            const idx = updatedSlots.findIndex((s) => s.id === slot.id);
            updatedSlots[idx] = { ...slot, placedBar: best, status: "suggested" };
          }
        });

        set({ barSlots: updatedSlots });
        get().actions.recalculateStats();
      },

      autoFillAll: () => {
        const { beatAnalysis } = get();
        if (!beatAnalysis) return;
        beatAnalysis.sections.forEach((section) => {
          get().actions.autoFillSection(section.id);
        });
      },

      // ── المشغّل ──
      play: () => set((s) => ({ player: { ...s.player, isPlaying: true } })),
      pause: () => set((s) => ({ player: { ...s.player, isPlaying: false } })),
      seekTo: (time) =>
        set((s) => ({
          player: { ...s.player, currentTime: Math.max(0, Math.min(time, s.player.duration)) },
        })),
      setVolume: (v) =>
        set((s) => ({ player: { ...s.player, volume: Math.max(0, Math.min(100, v)) } })),
      setLoop: (start, end) =>
        set((s) => ({ player: { ...s.player, loopStart: start, loopEnd: end, isLooping: true } })),
      clearLoop: () =>
        set((s) => ({ player: { ...s.player, loopStart: null, loopEnd: null, isLooping: false } })),
      setPlaybackRate: (rate) =>
        set((s) => ({
          player: { ...s.player, playbackRate: Math.max(0.5, Math.min(2.0, rate)) },
        })),

      // ── Canvas ──
      setZoom: (z) =>
        set((s) => ({ canvas: { ...s.canvas, zoom: Math.max(1, Math.min(10, z)) } })),
      setScrollX: (x) =>
        set((s) => ({ canvas: { ...s.canvas, scrollX: Math.max(0, x) } })),
      toggleKickMarkers: () =>
        set((s) => ({ canvas: { ...s.canvas, showKickMarkers: !s.canvas.showKickMarkers } })),
      toggleEnergyMap: () =>
        set((s) => ({ canvas: { ...s.canvas, showEnergyMap: !s.canvas.showEnergyMap } })),
      selectSlot: (id) => {
        set((s) => ({ canvas: { ...s.canvas, selectedSlotId: id } }));
        if (id) get().actions.generateSuggestionsForSlot(id);
      },
      setHoveredTime: (t) =>
        set((s) => ({ canvas: { ...s.canvas, hoveredTime: t } })),

      // ── الفلاتر ──
      setEmotionFilter: (e) => set({ activeEmotionFilter: e }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      // ── المساعد الذكي ──
      generateAIAdvices: () => {
        const advices = generateAdvices(get().barSlots);
        set({ aiAdvices: advices });
      },
      dismissAdvice: (id) =>
        set((s) => ({ aiAdvices: s.aiAdvices.filter((a) => a.id !== id) })),
      applyAdvice: (id) => {
        const advice = get().aiAdvices.find((a) => a.id === id);
        if (advice?.type === "syllable-adjust") get().actions.autoFillAll();
        get().actions.dismissAdvice(id);
      },

      // ── الإحصائيات ──
      recalculateStats: () => {
        const { barSlots } = get();
        if (barSlots.length === 0) return;

        const filled = barSlots.filter((s) => s.status !== "empty");
        const avgScore =
          filled.reduce((sum, s) => sum + (s.placedBar?.matchScore || 0), 0) /
          Math.max(1, filled.length);

        const flowScore = Math.min(10, (avgScore / 100) * 10);

        set({
          sessionStats: {
            totalSlots: barSlots.length,
            filledSlots: filled.length,
            avgMatchScore: Math.round(avgScore),
            rhymeConsistency: 75 + Math.random() * 20,
            flowScore: parseFloat(flowScore.toFixed(1)),
            energyBalance: 70 + Math.random() * 25,
            readyForRecording: flowScore >= 7 && filled.length === barSlots.length,
          },
        });
      },

      exportSession: () => ({
        timestamp: new Date().toISOString(),
        analysis: get().beatAnalysis,
        slots: get().barSlots,
        stats: get().sessionStats,
      }),

      resetSession: () =>
        set({
          phase: "upload",
          audioFile: null,
          audioUrl: null,
          beatAnalysis: null,
          barSlots: [],
          aiAdvices: [],
          sessionStats: null,
          player: INITIAL_PLAYER,
          canvas: INITIAL_CANVAS,
        }),
    },
  }))
);
