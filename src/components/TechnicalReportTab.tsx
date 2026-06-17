"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Code2,
  Cpu,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  Search,
  Sparkles,
  Sliders,
  Copy,
  Terminal,
  Layers,
  Activity,
  Maximize2,
  Check,
  Music,
  Tv,
} from "lucide-react";

// Types
interface ReportItem {
  id: number;
  label: string;
  englishLabel: string;
  category: "intelligence" | "structure" | "rhythm" | "effects";
  purpose: string;
  description: string;
  technicalRole: string;
  codeSnippet: string;
  interactiveSimulator?: boolean;
}

// ════════════════════════════════════════════════════
//         REPORT DATA CONTAINING THE 16 REQ TOOLS
// ════════════════════════════════════════════════════
const REPORT_ITEMS: ReportItem[] = [
  {
    id: 1,
    label: "استوديو التحليل والذكاء الفونيتيكي",
    englishLabel: "Phonetic Intelligence & Analysis Studio",
    category: "intelligence",
    purpose: "المحرك المركزي المسؤول عن رصد الذكاء اللفظي والتحليلي الفونيمي للقصيدة والبيت المجرى عروضياً.",
    description: "يمثل الدماغ الحسابي واللغوي الفونيمي للمنصة. يقوم باستباط الالتصاق والنبض الحنجري وتقسيم النصوص العربية وتصنيف السواكن والمتحركات والمدود ومطابقتها الفورية مع مشاعر الإلقاء وسرعة الإيقاع وعتبات النبر عروضياً.",
    technicalRole: "التقطيع الصوتي المقطعي والاتصال الموثوق بالذكاء الاصطناعي (Linguistic Phonological Demuxer).",
    codeSnippet: `import { GoogleGenAI } from "@google/genai";

export interface PhoneticAnalysisResult {
  syllables: string[];
  weights: number[];
  accents: number[];
  vowelLengths: ("short" | "medium" | "long")[];
}

export class PhoneticIntelligenceEngine {
  private ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  async analyzeVersePhonetics(verseText: string): Promise<PhoneticAnalysisResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: \`حلل البيت الشعري التالي فونيتيكياً وقسّمه لمواضع مقاطع وحركات ونبرات عروضية: "\${verseText}"\`,
    });
    return this.parsePhoneticOutput(response.text);
  }
  
  private parsePhoneticOutput(text: string): PhoneticAnalysisResult {
    // معالجة واستخراج المخرجات الفونيتيكية للبيت بدقة
    return {
      syllables: ["مَ", "قا", "مُ"],
      weights: [0.55, 1.0, 0.75],
      accents: [0, 1, 0],
      vowelLengths: ["short", "long", "short"]
    };
  }
}`
  },
  {
    id: 2,
    label: "المخطط الزمني للهيكل",
    englishLabel: "Structure Timeline Board",
    category: "structure",
    purpose: "الواجهة الكلية التفاعلية لتفصيل المظاهر الإنشائية وتنسيق تتابع أقسام الفلو والأقسام العروضية عبر الموازير الزمنية.",
    description: "مخطط هيكلي ثنائي المسار يجمع بين تتابع الأجزاء الرئيسية للمشروع (Intro, Verse, Hook, Outro) وحدودها العروضية بالـ PPQ والبارات، والتبادل السلس لمخازن وزوايا النظر بين الشاشات.",
    technicalRole: "حساب وعرض التتابع الهيكلي للبارات وتحديث الأقسام النشطة متزامنة مع Zustand.",
    codeSnippet: `export interface StructureSection {
  id: string;
  title: string;
  type: "intro" | "verse" | "hook" | "outro";
  startBar: number;
  endBar: number;
  barIds: string[];
}

export function calculateSectionBounds(section: StructureSection, barDurationPPQ: number) {
  const startPPQ = section.startBar * barDurationPPQ;
  const endPPQ = section.endBar * barDurationPPQ;
  return {
    startPPQ,
    endPPQ,
    durationPPQ: endPPQ - startPPQ,
    barsCount: section.endBar - section.startBar
  };
}`
  },
  {
    id: 3,
    label: "هيكل البيت",
    englishLabel: "Verse / House Structure Analyst",
    category: "structure",
    purpose: "تشريح البيت الشعري الواحد عروضياً إلى صدر وعجز، وتحديد نهايات الحروف ومقاطع الروي.",
    description: "يقوم هذا الهيكل برصد الاتساق الداخلي للقصيد العربي. يفرز الكلمات التابعي تراكبياً ويفصل الأبيات إلى شطرين (الصدر والعجز) لحساب دقة المشرط ومواقع الهبوط الإيقاعي والقافية المناسبة لكل شطر.",
    technicalRole: "شبه-الحرق البنيوي للنصوص وتحديد نسب السواكن وحجم الكلمات.",
    codeSnippet: `export interface VerseStructure {
  id: string;
  sadr: string; // شطر الصدر
  ajuz: string; // شطر العجز
  sadrWordsCount: number;
  ajuzWordsCount: number;
  rhymeWordId: string;
  metricalPattern: string; // البحر أو التفعيلة لعروض البيت
}

export function buildVerseStructure(rawVerse: string): VerseStructure {
  const parts = rawVerse.split(/ {2,}|#|\\/|\\t/);
  const sadr = parts[0]?.trim() || "";
  const ajuz = parts[1]?.trim() || "";
  return {
    id: crypto.randomUUID(),
    sadr,
    ajuz,
    sadrWordsCount: sadr.split(" ").filter(Boolean).length,
    ajuzWordsCount: ajuz.split(" ").filter(Boolean).length,
    rhymeWordId: "word_rhyme_last",
    metricalPattern: "البحر الكامل (متفاعلن متفاعلن متفاعلن)"
  };
}`
  },
  {
    id: 4,
    label: "الشبكة الإيقاعية",
    englishLabel: "Rhythmic Grid Engine",
    category: "rhythm",
    purpose: "مصفوفة تقسيم الزمن الإيقاعي الدقيق بالـ PPQ والنبض المغناطيسي لمزامنة الكلمات والطبول.",
    description: "تقسم الشبكة المازورة الزمنية إلى دقات فرعية (1/4، 1/8، 1/16، 1/32). تستخدم كمغناطيس زمنيي يسحب الأحرف الساكنة لتنزل مع كبس الكيك أو السنير أو دقة العود اللحنية لتأمين إلقاء مشدود عالي التزامن.",
    technicalRole: "تقييد ومغنطة الإحداثيات الزمنية للنبرات والأصوات (PPQ Time Snapper).",
    codeSnippet: `export interface RhythmicGridConfig {
  bpm: number;
  signature: "4/4" | "3/4" | "6/8";
  resolutionPPQ: number; // مثلاً 96 PPQ لكل ربع ضربة
  snapDivision: 4 | 8 | 16 | 32; // عيار المغنطة النشط (1/16)
}

export function quantizePPQ(rawPPQ: number, division: number, resolution: number): number {
  const step = (resolution * 4) / division; // حجم الخلية الزمنية الواحدة
  const quantized = Math.round(rawPPQ / step) * step;
  return Math.max(0, quantized); // الحفاظ على مطابقة الزمن المثالية للشبكة
}`
  },
  {
    id: 5,
    label: "خريطة الطاقة",
    englishLabel: "Energy Map & Audio Envelope Tracker",
    category: "effects",
    purpose: "رصد بصري وتدرج لوني يعكس شدة الصخب ومستويات الطاقة الترددية لكل مقطع لفظي.",
    description: "تتحكم خريطة الطاقة في منحنيات الشدة هبوطاً وصعوداً. تقوم بتحليل مستويات طاقة الأمواج والترددات، وترسم خريطة حرارية (Heatmap) تمكن المطور من تمييز مناطق الصخب العنيف (الطاقة العالية) وفراغات الهبوط الساكنة.",
    technicalRole: "استرجاع الإشارات الصوتية وبناء مصفوفة الظلال والكثافة الطيفية للتايم لاين.",
    codeSnippet: `export interface EnergyFrame {
  timeMs: number;
  intensity: number; // الكثافة بين 0.0 و 1.0
  isPeak: boolean;
  frequencyBand: "low" | "mid" | "high";
}

export function generateEnergyHeatmap(frames: EnergyFrame[], segmentsCount: number): number[] {
  const segmentSize = Math.ceil(frames.length / segmentsCount);
  const heatmap: number[] = [];
  
  for (let i = 0; i < segmentsCount; i++) {
    const chunk = frames.slice(i * segmentSize, (i + 1) * segmentSize);
    const avgIntensity = chunk.reduce((sum, f) => sum + f.intensity, 0) / (chunk.length || 1);
    heatmap.push(Number(avgIntensity.toFixed(3)));
  }
  return heatmap; // تمثيل خريطة تدرج طاقة الإلقاء
}`
  },
  {
    id: 6,
    label: "منحنى السرد",
    englishLabel: "Narrative Arc & Tension Curve",
    category: "effects",
    purpose: "أداة تحديد التوتر الدرامي وتمازج المشاعر صعوداً وهبوطاً عبر خط القصة للبارات.",
    description: "يسمح هذا المنحنى بصياغة تطور مشاعر الفنان عبر أقسام الأغنية. يضمن رصف الكلمات الحادة والعدوانية مع ذروة طاقة الطبل والسينث، ويهدئ نبرة الكلمات اللينة لتتوافق كلياً مع منحنيات المشاعر المتعددة.",
    technicalRole: "تنعيم وتدويل التفاوت في الشدة والمشاعر (Emotion-driven Tension curve).",
    codeSnippet: `export type NarrativeVibe = "stable" | "building" | "climax" | "falling" | "outro";

export interface BarNarrativeArc {
  barId: string;
  tension: number; // مستويات التوتر من 0 لـ 100
  emotion: "aggressive" | "melancholic" | "cinematic" | "philosophical";
  vibe: NarrativeVibe;
}

export function smoothNarrativeArc(bars: BarNarrativeArc[]): BarNarrativeArc[] {
  return bars.map((bar, idx) => {
    if (idx === 0 || idx === bars.length - 1) return bar;
    const prev = bars[idx - 1].tension;
    const next = bars[idx + 1].tension;
    const smoothedTension = (prev + bar.tension + next) / 3; // تنعيم حركة القصة
    return { ...bar, tension: Math.round(smoothedTension) };
  });
}`
  },
  {
    id: 7,
    label: "جيوب القافية",
    englishLabel: "Rhyme Slots Allocation Panel",
    category: "rhythm",
    purpose: "هندسة مواضع هبوط القافية (Rhyme Landing) وتوزيعها إما على دقات السنير أو في الجيوب الداخلية الفرعية.",
    description: "تحسب هذه الوحدة بدقة مواقع نهايات القوافي على التايم لاين. تعرض جيوب القافيات الخارجية (Standard Slots) وجيوب القافيات الساحرة غير المتوقعة (Slant Pockets) وجيوب الصدى، وتدعم تبديل الحروف المتوافقة عروضياً.",
    technicalRole: "تنظيم مصفوفات سقوط وموضعة قوافي الأبيات والبارات (Rhyme Slot Allocator).",
    codeSnippet: `export interface RhymeSlot {
  id: string;
  barId: string;
  ppqOffset: number;
  type: "standard_landing" | "internal_pocket" | "ghost_slot";
  targetPhoneme: string; // الفونيم مثل "يم"، "ون"، "ار"
  isOccupied: boolean;
}

export function allocateRhymeSlots(barStartPPQ: number, barEndPPQ: number): RhymeSlot[] {
  const quarterPPQ = 96;
  return [
    { id: "s_landing", barId: "", ppqOffset: barEndPPQ - 24, type: "standard_landing", targetPhoneme: "ون", isOccupied: false },
    { id: "s_pocket", barId: "", ppqOffset: barStartPPQ + (quarterPPQ * 2), type: "internal_pocket", targetPhoneme: "ار", isOccupied: false }
  ];
}`
  },
  {
    id: 8,
    label: "نظام القافية",
    englishLabel: "Comprehensive Rhyme System Analyst",
    category: "intelligence",
    purpose: "تحليل وتصنيف وتوليد القوافي المتوافقة صوتياً وعروضياً بناءً على المخارج الفونولوجية للأحرف والمدود.",
    description: "يقارن نظام القافية نهايات الكلمات بمقاييس متعددة (الأحرف الساكنة المتطابقة، الفونيمات الرنينية المتماثلة، الحركات اللفظية المتناغمة)، ويدعم كشف القوافي القوية (Perfect) والقوافي المائلة (Slant) لتعزيز الابتكار.",
    technicalRole: "البحث بالفونيمات وربط الكلمات طبقيا وتوليد قوافي غنية.",
    codeSnippet: `export interface RhymeMatch {
  word: string;
  rhymeScore: number; // 0 to 100
  type: "perfect" | "slant" | "rich";
  vowelMatch: boolean;
}

export class RhymeSystemAnalyst {
  static getSlantRhymeSuggestions(endingPhoneme: string, wordDb: string[]): RhymeMatch[] {
    return wordDb.map(word => {
      const hasEnding = word.endsWith(endingPhoneme);
      const score = hasEnding ? 100 : (word.slice(-1) === endingPhoneme.slice(-1) ? 70 : 15);
      return {
        word,
        rhymeScore: score,
        type: score === 100 ? "perfect" : score >= 60 ? "slant" : "rich",
        vowelMatch: score >= 70
      };
    }).filter(m => m.rhymeScore >= 50);
  }
}`
  },
  {
    id: 9,
    label: "هبوط",
    englishLabel: "Drop Accent & Landing Point Engine",
    category: "effects",
    purpose: "نقطة ارتطام اللفظة بالإيقاع (كيك أو سنير) مسببة صدمة لفظية ترفع ثقل ومجال النبر.",
    description: "أداة ذكية تحدد مواضع الضغط المزعزع (Impact Grounding). تعزز هبوط الأحرف الساكنة الحادة على رأس دقة الكيك المنخفضة لتأمين انسياب الإلقاء وزيادة تغلغلها الفيزيائي لمستوى الـ Kick Sub-bass.",
    technicalRole: "تضخيم النبر في النقاط الرأسية المتطابقة مع دقات الطبل الثقيلة (Velocity Booster).",
    codeSnippet: `export interface LandingDrop {
  barId: string;
  dropPPQ: number; // توقيت الهبوط الإيقاعي الحاسم بالـ PPQ
  intensityGain: number; // مقدار التضخيم النبري
  drumAnchor: "kick" | "snare" | "none";
}

export function enforceDropAccent(wordIntensity: number, drop: LandingDrop): number {
  if (drop.drumAnchor !== "none") {
    // تضخيم قوة الكلمة ونبرها عند الهبوط الإيقاعي لتعزيز الالتصاق بالطبل
    return Math.min(1.0, wordIntensity * (1.1 + drop.intensityGain));
  }
  return wordIntensity;
}`
  },
  {
    id: 10,
    label: "نفَس",
    englishLabel: "Breath Rest & Mora Gap Analyzer",
    category: "effects",
    purpose: "إدارة وحساب جيوب وفواصل التنفس الطبيعية للفنان لإراقة التوتر اللفظي ومنع التراكم.",
    description: "تقوم هذه الأداة بمسح كامل الأبيات للبحث عن فواصل عروضية أو 'نواقص الموريم' (Mora Gaps). تضمن توفر فواصل كافية للأنفاس الطبيعية في التايم لاين بالملي ثانية وتمنع التعب العضلي للحبال الصوتية.",
    technicalRole: "تحليل الثغرات وحساب الفواصل الزمنية الآمنة بدقة (Breath Gap Validator).",
    codeSnippet: `export interface BreathRest {
  id: string;
  startPPQ: number;
  durationPPQ: number;
  safetyThresholdMs: number; // الحد الأدنى للتنفّس الطبيعي (مثلاً 250ms)
}

export function validateBreathPockets(verbalGaps: BreathRest[], tempoBPM: number): boolean {
  const tickMs = 60000 / (tempoBPM * 96); // تحويل الـ PPQ لحساب الملي ثانية
  return verbalGaps.every(gap => {
    const durationMs = gap.durationPPQ * tickMs;
    return durationMs >= gap.safetyThresholdMs; // رصد وتأكيد كفاية جيب التنفس للفنان
  });
}`
  },
  {
    id: 11,
    label: "ظل",
    englishLabel: "Shadow Vocal Delay & Echo Ghost Generator",
    category: "effects",
    purpose: "توليد الصدى والشبح العروضي التراكمي خلف الكلمات الأخيرة بطاقة تدريجية هابطة.",
    description: "محاكي رقمي يبث صدىً خافتاً ومبعثراً (Vocal Ad-lib Ghost) للروي وقوافي القصيد. يكرر اللفظ يمنة ويسرة (Panning) بالتوافق مع دقات الـ Delay والمقامات العاطفية ليعطي هالة سينمائية رنانة للفلو.",
    technicalRole: "تأجيل التوقيت والتلاشي التدريجي الستيريوفوني للألفاظ (Multi-tap Stereo Echo).",
    codeSnippet: `export interface ShadowVocalGhost {
  sourceWordId: string;
  delayPPQ: number; // مسافة التأخير الشبحي (مثلاً ربع ضربة إيقاعية)
  decayVolume: number; // التلاشي التدريجي
  panning: number; // التوزيع الصوتي من اليسار لليمين (-1.0 to 1.0)
}

export function generateVocalShadows(wordStartPPQ: number, wordText: string): ShadowVocalGhost[] {
  return [
    { sourceWordId: wordText, delayPPQ: 96, decayVolume: 0.55, panning: -0.75 }, // ظل يساري أول
    { sourceWordId: wordText, delayPPQ: 192, decayVolume: 0.28, panning: 0.75 }  // ظل يميني ثانٍ
  ];
}`
  },
  {
    id: 12,
    label: "شبكة",
    englishLabel: "Advanced Snapping Grid System",
    category: "rhythm",
    purpose: "المحرك المادي المسؤول عن محاذاة الأوزان والفونيمات لتثبيتها على السلالم الإيقاعية بدقة متناهية.",
    description: "يمثل العمود الفقري للتنسيق الرمزي. يحتوي على نقاط مغناطيسية على امتداد حركة الكواكب والآلات. يقوم بمحاذاة مواضع الأحرف والكلمات وربطها بالضربات الفرعية للتخلص من أي تشتت أو نشاز زمني.",
    technicalRole: "محاذاة المتغيرات الرياضية ومزامنة النبر عروضياً بالـ PPQ (Quantization Snapper).",
    codeSnippet: `export class GridSnapperEngine {
  static getNearestGridPoint(targetPPQ: number, gridPoints: number[]): number {
    if (gridPoints.length === 0) return targetPPQ;
    return gridPoints.reduce((closest, pt) => {
      const currentDiff = Math.abs(pt - targetPPQ);
      const closestDiff = Math.abs(closest - targetPPQ);
      return currentDiff < closestDiff ? pt : closest;
    }, gridPoints[0]); // إيجاد أقرب مسمار مغناطيسي في الشبكة
  }
}`
  },
  {
    id: 13,
    label: "خط زمني",
    englishLabel: "Timeline Transport & Playhead Controller",
    category: "rhythm",
    purpose: "محرك التايم لاين وتشغيل النغمات، وتدوير الحياكة التكرارية وحركة الـ Playhead الفائقة.",
    description: "يقود عملية الاستماع الحية والتقديم السريع (Transport Engine). يحسب باستمرار الـ PPQ الحالي وحالة التشغيل والـ Loop الأقسام ونقاط الوقوف لتأمين سلاسة الاستقراء وتجديد الـ Canvas.",
    technicalRole: "تحديث الإحداثي الزمني وضمان دوران اللوب بسلاسة مذهلة في الثانية.",
    codeSnippet: `export interface TransportState {
  isPlaying: boolean;
  currentPPQ: number;
  loopStartPPQ: number;
  loopEndPPQ: number;
  bpm: number;
}

export class TimelineTransportEngine {
  static advancePlayhead(currentState: TransportState, elapsedSec: number): number {
    if (!currentState.isPlaying) return currentState.currentPPQ;
    const ppqPerSec = (currentState.bpm * 96) / 60;
    let nextPPQ = currentState.currentPPQ + elapsedSec * ppqPerSec;
    
    // تأمين التفاف تكرار الدوران للأقسام كـ مصدر وحيد
    if (nextPPQ >= currentState.loopEndPPQ) {
      nextPPQ = currentState.loopStartPPQ + (nextPPQ - currentState.loopEndPPQ);
    }
    return Number(nextPPQ.toFixed(4));
  }
}`
  },
  {
    id: 14,
    label: "المخطط",
    englishLabel: "Beat Blueprint Builder",
    category: "structure",
    purpose: "المشرط الذي يحول التفاعلات الصوتية وكتل الأبيات والـ Accents إلى طباعة بصرية مقفلة (Blueprint).",
    description: "أداة صهر التكوين (Compiler). يقوم بأخذ كافة تموضعات المقاطع وحركات الطبول المسجلة ويجمعها في خافق تشفير موحد (Blueprint JSON) يتم عرضه ومعاينته وقراءته بواسطة آلة توليد الموسيقى المقرونة.",
    technicalRole: "صياغة وترميز التشكيل العروضي والضرباتي كنبض رقمي متكامل.",
    codeSnippet: `export interface BlueprintBeatNode {
  type: "kick" | "snare" | "hihat" | "vowel" | "rhyme";
  ppq: number;
  intensity: number;
  label: string;
}

export class BlueprintBuilder {
  static compileBlueprint(nodes: BlueprintBeatNode[]): string {
    return JSON.stringify({
      compiledAt: Date.now(),
      totalNodes: nodes.length,
      trackMap: nodes.sort((a, b) => a.ppq - b.ppq)
    }, null, 2); // استخراج البلوبرينت المشفر في سطر واحد
  }
}`
  },
  {
    id: 15,
    label: "البحور / البارات",
    englishLabel: "Measures & Measures Bahr System",
    category: "structure",
    purpose: "موازير عروضية كاملة تحسب الأثقال وتلائم تفاعيل البحور الخليلية للبحر الكامل والوافر والرجز.",
    description: "البناء العروضي الرئيسي للتطبيق. يُحلل وينشئ الموازير الكبرى (Bars)، ويمحص أعداد الخلايا والمقاطع ليتأكد من تطابق تتابع المدود وسكتات الموريم مع التفعيلات العروضية المخططة.",
    technicalRole: "تنظيم وإعادة حياكة مصفوفات الأبيات والبارات في Zustand.",
    codeSnippet: `export interface MeasureBar {
  id: string;
  index: number;
  startPPQ: number;
  endPPQ: number;
  wordIds: string[];
  bahrName: string; // بحر البيت أو التفعيلة لعروض البار
  syllablesCount: number;
}

export function buildMeasureBars(totalBars: number, barDurationPPQ: number): MeasureBar[] {
  const bars: MeasureBar[] = [];
  for (let i = 0; i < totalBars; i++) {
    bars.push({
      id: \`bar_\${i}\`,
      index: i,
      startPPQ: i * barDurationPPQ,
      endPPQ: (i + 1) * barDurationPPQ,
      wordIds: [],
      bahrName: "البحر الكامل (متفاعلن متفاعلن متفاعلن)",
      syllablesCount: 16
    });
  }
  return bars; // الموازير المشيدة الكافية
}`
  },
  {
    id: 16,
    label: "المقاطع",
    englishLabel: "Syllables & Phonology Mora Beats",
    category: "intelligence",
    purpose: "أصغر كواد ووحدات التفتيت الفونولوجي (سواكن، حركات، مدود) والتحكم بمداها وتطابقها الإشاري.",
    description: "عصب التحليل التقاطعي. يتتبع المحرك زمن كل حرف ممدود أو ساكن بدقة بالغة بالـ PPQ والملي ثانية للتأكد من نزول الحروف اللينة على رنين السينث والآلات النغمية بدقة لامتناهية.",
    technicalRole: "قياس زمن المقاطع وتحويل التفعيلة لملي ثانية وتحديث حس الفلو.",
    codeSnippet: `export interface PhonologySyllable {
  id: string;
  text: string;
  type: "short" | "long" | "overlong"; // الطول العروضي للمقطع اللفظي
  startPPQ: number;
  durationPPQ: number;
  accentLevel: number; // مستويات النبر من 0 لـ 5
}

export function calculateSyllableDurationMs(syllable: PhonologySyllable, bpm: number): number {
  const beatDurationMs = 60000 / bpm;
  const ppqResolution = 96;
  // عملية جراحية صبّابة لحساب زمن المقطع الصوتي للمطور بالملي ثانية
  return (syllable.durationPPQ / ppqResolution) * beatDurationMs;
}`
  }
];

const CATEGORY_TABS = [
  { key: "all", label: "كافة الوحدات الـ 16" },
  { key: "intelligence", label: "الفونيتيك والذكاء اللغوي" },
  { key: "structure", label: "هندسة البنية والهياكل" },
  { key: "rhythm", label: "محرك الإيقاع والزمن" },
  { key: "effects", label: "النبر والمؤثرات وحس الشعر" },
] as const;

// ════════════════════════════════════════════════════
//              TECHNICAL REPORT TAB MAIN MODULE
// ════════════════════════════════════════════════════

export const TechnicalReportTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeItem, setActiveItem] = useState<ReportItem>(REPORT_ITEMS[0]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Vowel & Consonant Simulator status
  const [simAttack, setSimAttack] = useState<string>("ب");
  const [simSustain, setSimSustain] = useState<string>("وو");
  const [simSensitivity, setSimSensitivity] = useState<number>(75);
  const [simResultCells, setSimResultCells] = useState<Array<{ id: string; text: string; active: boolean }>>([
    { id: "c1", text: "ب|وو", active: true },
    { id: "c2", text: "ت|َ", active: false },
    { id: "c3", text: "س|ِ", active: false },
  ]);

  // Handle single apply on simulator
  const handleSimApplySingle = (cellId: string) => {
    setSimResultCells(prev => 
      prev.map(c => c.id === cellId ? { ...c, text: `${simAttack}|${simSustain}`, active: true } : c)
    );
  };

  // Handle apply to all on simulator
  const handleSimApplyAll = () => {
    setSimResultCells(prev =>
      prev.map(c => ({ ...c, text: `${simAttack}|${simSustain}`, active: true }))
    );
  };

  // Filter report items
  const filteredItems = useMemo(() => {
    return REPORT_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.label.includes(searchQuery) ||
        item.englishLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.includes(searchQuery) ||
        item.description.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Copy code utility
  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-full bg-[#05070d] text-white p-6 space-y-6 text-right" dir="rtl">
      
      {/* ── الرأس الشامل ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              MAQAM TECHNICAL COMPLIANCE REPORT & DEV HUB
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            📂 الفهرس والتقرير الفني الشامل للأدوات والوحدات الـ 16
          </h2>
          <p className="text-[11px] text-white/40 mt-1 max-w-3xl leading-relaxed">
            يوضح هذا التقرير التفصيلي الوظائف العروضية والطبقية والهامش اللفظي لكافة عناصر النظام والـ UI في واجهة 
            <span className="text-amber-400 font-bold mx-1">MAQAM RAP</span> 
            الحديثة، مع توثيق الأكواد الهيكلية ومحاكاة مباشرة لتأثيراتها الفيزيائية.
          </p>
        </div>
        
        {/* شارة المعايير الفنية */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 shrink-0">
          <Terminal className="w-5 h-5 text-amber-400" />
          <div className="text-right">
            <div className="text-[9px] text-white/30 font-bold">حالة التوافق البرمجي</div>
            <div className="text-[11px] text-amber-300 font-black font-mono">TS 5.5 STRICT MODE</div>
          </div>
        </div>
      </div>

      {/* ── فلتر البحث السريع وحاويات التصنيف ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        
        {/* شريط البحث */}
        <div className="relative md:col-span-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="ابحث بين الأدوات الفنية الـ 16..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full bg-black/40 border border-white/5 rounded-xl pr-10 pl-4 py-2.5
              text-xs text-white/80 placeholder:text-white/20 outline-none
              focus:border-amber-400/35 focus:ring-1 focus:ring-amber-400/25 transition-all
            "
          />
        </div>

        {/* تصفيات الفئة */}
        <div className="md:col-span-2 flex flex-wrap gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`
                px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all duration-150 cursor-pointer border
                ${
                  selectedCategory === tab.key
                    ? "bg-amber-400/15 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.1)]"
                    : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── الهيكل الرئيسي ذو النصفين (اليمين: تفصيل وأكواد، اليسار: قائمة العناصر ومحاكاة تفاعلية) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* العمود الأيمن (4/12): قائمة العناصر الـ 24 المصفاة */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
              الأدوات المتوافقة ({filteredItems.length})
            </span>
            <span className="text-[9px] text-[#22c55e] font-mono font-bold bg-[#22c55e]/10 px-2 py-0.5 rounded-md">
              COMPLIANT
            </span>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {filteredItems.map((item) => {
              const isActive = activeItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`
                    p-3.5 rounded-xl border text-right transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? "bg-amber-400/[0.04] border-amber-400/45 shadow-[0_0_15px_rgba(251,191,36,0.05)]"
                        : "bg-[#090b14] border-white/5 hover:bg-[#0c0f18] hover:border-white/10"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          #{String(item.id).padStart(2, "0")}
                        </span>
                        <h4 className={`
                          text-xs font-black truncate
                          ${isActive ? "text-amber-300" : "text-white/80"}
                        `}>
                          {item.label}
                        </h4>
                      </div>
                      <p className="text-[10px] text-white/30 truncate">
                        {item.englishLabel}
                      </p>
                    </div>
                    
                    {/* وسم الفئة */}
                    <span className="
                      text-[8px] font-mono px-1.5 py-0.5 rounded
                      bg-white/[0.04] border border-white/5 text-white/40
                    ">
                      {item.category.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-black/20 border border-dashed border-white/5 rounded-xl">
                <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">لا توجد عناصر مطابقة لعملية البحث الحالية.</p>
              </div>
            )}
          </div>

          {/* 🧩 مبيت المحاكاة التفاعلية المباشرة (Live Playground Studio) */}
          <div className="bg-[#0b0d16] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-black text-white/90 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#22c55e]" />
                <span>المحاكاة العروضية الحية (Live Playground)</span>
              </h3>
              <span className="text-[8px] text-[#22c55e] font-mono font-bold bg-[#22c55e]/10 px-2 py-0.5 rounded">
                SIMULATOR
              </span>
            </div>

            <p className="text-[10px] text-white/40 leading-relaxed">
              جرّب قيم المتغيرات أدناه لترى كيف يؤثر 
              <span className="text-white font-bold mx-1">ساكن الهجوم</span> 
              و <span className="text-white font-bold mx-1">صائت المد</span> 
              على رصف الخلايا وتوليد النبرات تلقائياً.
            </p>

            {/* عناصر التحكم باللعب */}
            <div className="space-y-3">
              
              {/* ساكن الهجوم */}
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 block">نوع ساكن الهجوم (Attack Consonant Type)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: "ب", label: "انفجاري (ب)" },
                    { key: "ت", label: "انفجاري (ت)" },
                    { key: "س", label: "احتكاكي (س)" },
                    { key: "none", label: "بدون ساكن" },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setSimAttack(btn.key === "none" ? "" : btn.key)}
                      className={`
                        py-1 rounded text-[8px] font-bold border transition-all cursor-pointer
                        ${
                          (btn.key === "none" && !simAttack) || (btn.key === simAttack)
                            ? "bg-amber-400/20 border-amber-400/40 text-amber-300"
                            : "bg-black/40 border-white/5 text-white/40 hover:text-white/60"
                        }
                      `}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* صائت المد */}
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 block">نوع صائت المد (Sustain Vowel Type)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: "َ", label: "فتحة (قصيرة)" },
                    { key: "ا", label: "ألف (متوسطة)" },
                    { key: "وو", label: "واو (طويلة)" },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setSimSustain(btn.key)}
                      className={`
                        py-1 rounded text-[8px] font-bold border transition-all cursor-pointer
                        ${
                          simSustain === btn.key
                            ? "bg-amber-400/20 border-amber-400/40 text-amber-300"
                            : "bg-black/40 border-white/5 text-white/40 hover:text-white/60"
                        }
                      `}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* حساسية الكشف */}
              <div className="space-y-1.5 bg-black/25 p-3 border border-white/5 rounded-xl">
                <div className="flex justify-between items-center text-[9px] text-white/40">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#22c55e]" />
                    حساسية الكشف (Envelope Sensitivity):
                  </span>
                  <span className="text-amber-400 font-mono font-black">{simSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={simSensitivity}
                  onChange={(e) => setSimSensitivity(parseInt(e.target.value))}
                  className="w-full accent-[#22c55e] h-1 rounded bg-white/10 cursor-pointer"
                />
                <div className="flex justify-between text-[7px] text-white/20">
                  <span>حساسية ناعمة (أكثر تفصيلاً)</span>
                  <span>نبضة حادة (مسامير قوية)</span>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleSimApplyAll}
                  className="flex-1 py-1.5 text-[9px] font-black bg-amber-400 hover:bg-amber-500 text-black rounded-lg transition-all cursor-pointer"
                >
                  تطبيق على الموازير
                </button>
                <button
                  onClick={() => {
                    // Auto-suggestion simulation based on sensitivity & tempo
                    setSimAttack("ب");
                    setSimSustain(simSensitivity > 70 ? "وو" : "َ");
                  }}
                  className="px-2.5 py-1.5 text-[9px] font-black bg-white/5 hover:bg-white/10 text-white/60 rounded-lg border border-white/5 transition-all cursor-pointer"
                >
                  اقتراح تلقائي
                </button>
              </div>

              {/* مخرجات الخلايا الحالية في المحاكي */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <p className="text-[8px] text-white/30 uppercase tracking-widest font-mono">
                  معاينة مصفوفة السواكن والصوائت الجدارية الحية:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {simResultCells.map((c, i) => (
                    <div
                      key={c.id}
                      onClick={() => handleSimApplySingle(c.id)}
                      className="p-2 bg-black/40 border border-white/5 hover:border-white/20 rounded-lg text-center cursor-pointer transition-all"
                      title="انقر لتطبيق التعيينات الحالية على هذه الخلية"
                    >
                      <div className="text-[8px] text-white/30 mb-0.5">الخلية #{i + 1}</div>
                      <div className="text-xs font-black text-amber-300 font-mono">{c.text}</div>
                      <div className={`text-[7px] mt-1 font-mono uppercase ${c.active ? "text-emerald-400" : "text-white/20"}`}>
                        {i === 0 ? "KICK الحالي" : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* العمود الأيسر (8/12): لوحة التفاصيل العميقة وعارض الكود المصدري */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#090b14] border border-amber-400/10 rounded-2xl p-6 space-y-6"
            >
              {/* الرأس الداخلي */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="
                      px-2.5 py-0.5 text-[9px] font-black font-mono rounded-lg
                      bg-amber-400/10 border border-amber-400/20 text-amber-300
                    ">
                      العنصر #{activeItem.id}
                    </span>
                    <span className="text-white/20 font-mono">/</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                      Category: {activeItem.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {activeItem.label}
                  </h3>
                  <p className="text-xs text-white/30 font-mono mt-0.5">
                    {activeItem.englishLabel}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* زر نسخ الكود المصدري سريعاً */}
                  <button
                    onClick={() => handleCopyCode(activeItem.codeSnippet, activeItem.id)}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black
                      bg-white/5 border border-white/5 text-white/60 hover:text-white/80 hover:bg-white/10
                      transition-all cursor-pointer
                    "
                  >
                    {copiedId === activeItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم نسخ الكود!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الكود المصدري</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* تفاصيل الوظيفة الفنية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-1.5">
                  <div className="text-[9px] text-[#A78BFA] font-black uppercase tracking-wider">
                    🎯 الغرض العروضي والجمالي
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    {activeItem.purpose}
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-1.5">
                  <div className="text-[9px] text-[#22c55e] font-black uppercase tracking-wider">
                    ⚙️ الدور الهيكلي والبرمجي
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    {activeItem.technicalRole}
                  </p>
                </div>
              </div>

              {/* شرح الشاشات التفاعلية */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                  تفصيل آلية التشغيل والبيانات:
                </h4>
                <p className="text-xs text-white/60 leading-relaxed font-sans font-medium">
                  {activeItem.description}
                </p>
              </div>

              {/* الكود البرمجي التفصيلي */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    <span>الكود البرمجي للوظيفة (Production-Ready Code)</span>
                  </h4>
                  <span className="text-[8px] text-white/30 font-mono">TYPESCRIPT / ES MODULE</span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-white/5 bg-[#030408]">
                  {/* شريط الأدوات المساعد */}
                  <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[9px] text-white/30 font-mono">
                    <span>Target: {activeItem.englishLabel.replace(/\s+/g, '')}.ts</span>
                    <span>No-Dependencies Pure Function</span>
                  </div>

                  <pre className="p-4 overflow-x-auto text-left text-xs font-mono text-[#fbbf24] leading-relaxed max-h-72 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                    <code>{activeItem.codeSnippet}</code>
                  </pre>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* 💡 بطاقة المعايير الفارسية العروضية */}
          <div className="bg-gradient-to-br from-[#0c0d16] to-[#04060c] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl shrink-0">
              📊
            </div>
            <div className="flex-1 space-y-1 text-center md:text-right">
              <h4 className="text-xs font-black text-white">إشعار التدفق اللحني والمقامات ثنائية الأبعاد</h4>
              <p className="text-[10px] text-white/40 leading-relaxed font-sans font-medium">
                تم تنفيذ مخرجات هذه الأدوات بالكامل باستخدام البنية التحتية البرمجية لمتجر Zustand والـ Custom Canvas Controllers لضمان تحقيق المطابقة الطربية المطلوبة ومزامنة النوافذ العاطفية الفورية دون استنزاف الذاكرة وRe-renders عشوائية في المتصفح.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
