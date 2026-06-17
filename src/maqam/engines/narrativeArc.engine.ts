// src/maqam/engines/narrativeArc.engine.ts
import type { BarInput, EmotionTarget } from "../types/maqam.types";
import type {
  NarrativeArcAnalysis,
  NarrativeNode,
  NarrativeTechnique,
} from "../types/narrative.types";
import { analyzeArabicPhonetics } from "./arabicPhonetics.engine";
import {
  endingSoundSimilarity,
  lexicalOverlap,
  tokenizeArabic,
} from "../utils/arabicText.utils";
import { average, clampScore, weightedAverage } from "../utils/scoring.utils";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface NarrativeArcExtended extends NarrativeArcAnalysis {
  emotionalArcMap:      EmotionalArcPoint[];
  narrativeTensionCurve: TensionPoint[];
  thematicClusters:     ThematicCluster[];
  arcType:              NarrativeArcType;
  arcTypeLabel:         string;
  globalSuggestions:    string[];
}

export interface EmotionalArcPoint {
  barIndex:    number;
  barId:       string;
  emotion:     EmotionTarget;
  intensity:   number; // 0–100
  timeMode:    NarrativeNode["detectedTimeMode"];
}

export interface TensionPoint {
  barIndex:  number;
  tension:   number; // 0–100
  driver:    "contradiction" | "metaphor" | "density" | "emotion_shift";
}

export interface ThematicCluster {
  label:    string;
  barIds:   string[];
  keywords: string[];
  strength: number;
}

export type NarrativeArcType =
  | "hero_rise"
  | "tragic_descent"
  | "circular"
  | "fragmented_mosaic"
  | "steady_tension"
  | "emotional_spiral"
  | "undefined";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PAST_MARKERS    = new Set(["كان","كنت","زمان","امس","ماضي","فات","رجعت","كانت"]);
const PRESENT_MARKERS = new Set(["انا","الان","دلوقتي","هنا","واقف","شايف","ده","عايش"]);
const FUTURE_MARKERS  = new Set(["بكره","سوف","هكون","هصير","جاي","قدام","رح","هنعمل"]);

const CONTRADICTION_PAIRS: Array<[string, string]> = [
  ["قوه","ضعف"],  ["نجاح","فشل"], ["نور","ظلام"],  ["حياه","موت"],
  ["واقع","خيال"],["فوق","تحت"],  ["قرب","بعد"],   ["حب","كره"],
  ["سلام","حرب"], ["صمت","صوت"],  ["امل","يأس"],   ["حلم","وهم"],
];

const METAPHOR_MARKERS = new Set([
  "كأن","مثل","زي","بحر","نار","سيف","قلب","ظل",
  "موج","جبل","ذئب","صقر","قناع","مرآه","غابه",
  "صحرا","برق","رعد","شمس","قمر","سهم","جرح",
]);

const EMOTION_INTENSITY: Record<EmotionTarget, number> = {
  anger:     92, triumph: 88, defiance: 82, pride: 78,
  tension:   70, love:    62, hope:     58, sadness:    50,
  melancholy:44, neutral: 30,
};

const EMOTION_LEXICON: Record<EmotionTarget, string[]> = {
  anger:     ["غضب","نار","حرب","كسر","ثوره","دم"],
  sadness:   ["حزن","دمع","ليل","وحده","جرح","برد"],
  pride:     ["فخر","تاج","ملك","نصر","قمه","اسمي"],
  love:      ["حب","قلب","روح","عين","حنين"],
  tension:   ["خوف","توتر","ضغط","قلق","سقوط"],
  hope:      ["امل","نور","صبح","حلم","طريق"],
  defiance:  ["رغم","ضد","اكسر","ارفض","اقاوم"],
  melancholy:["ذكرى","غبار","غياب","مطر","صمت"],
  triumph:   ["انتصار","نصر","وصلت","رفعت","فزت"],
  neutral:   [],
};

// ─────────────────────────────────────────────
// CORE DETECTION
// ─────────────────────────────────────────────

function detectTimeMode(text: string): NarrativeNode["detectedTimeMode"] {
  const tokens = tokenizeArabic(text);
  if (tokens.some((t) => PAST_MARKERS.has(t)))    return "past";
  if (tokens.some((t) => PRESENT_MARKERS.has(t))) return "present";
  if (tokens.some((t) => FUTURE_MARKERS.has(t)))  return "future";
  return "unknown";
}

function estimateEmotion(text: string): EmotionTarget {
  const tokens = tokenizeArabic(text);
  let best: EmotionTarget = "neutral";
  let best_score = 0;

  for (const [emotion, words] of Object.entries(EMOTION_LEXICON) as Array<[EmotionTarget, string[]]>) {
    const score = tokens.filter((t) => words.includes(t)).length;
    if (score > best_score) { best = emotion; best_score = score; }
  }
  return best;
}

function contradictionScore(text: string): number {
  const tokens = new Set(tokenizeArabic(text));
  let hits = 0;
  for (const [a, b] of CONTRADICTION_PAIRS) {
    if (tokens.has(a) && tokens.has(b)) hits++;
  }
  return clampScore(hits * 38);
}

function metaphorScore(text: string): number {
  const tokens = tokenizeArabic(text);
  const hits   = tokens.filter((t) => METAPHOR_MARKERS.has(t)).length;
  return clampScore(hits * 20);
}

function semanticDensity(text: string): number {
  const tokens = tokenizeArabic(text);
  const unique = new Set(tokens);
  if (!tokens.length) return 0;
  const uniqueness    = unique.size / tokens.length;
  const lengthFactor  = Math.min(1, tokens.length / 14);
  return clampScore((uniqueness * 0.65 + lengthFactor * 0.35) * 100);
}

function anchorScore(current: string, allBars: BarInput[]): number {
  const overlaps = allBars.map((bar) => lexicalOverlap(current, bar.text));
  return clampScore(average(overlaps) * 100);
}

// ─────────────────────────────────────────────
// ARC ANALYTICS
// ─────────────────────────────────────────────

function buildEmotionalArcMap(nodes: NarrativeNode[]): EmotionalArcPoint[] {
  return nodes.map((node) => ({
    barIndex:  node.barIndex,
    barId:     node.id,
    emotion:   node.emotionalTone,
    intensity: EMOTION_INTENSITY[node.emotionalTone] ?? 30,
    timeMode:  node.detectedTimeMode,
  }));
}

function buildTensionCurve(nodes: NarrativeNode[]): TensionPoint[] {
  return nodes.map((node, i) => {
    const prev = nodes[i - 1];
    let driver: TensionPoint["driver"] = "density";
    let tension = node.semanticDensity * 0.4;

    if (node.contradictionScore > 30) {
      tension += node.contradictionScore * 0.35;
      driver = "contradiction";
    } else if (node.metaphorScore > 30) {
      tension += node.metaphorScore * 0.3;
      driver = "metaphor";
    } else if (prev && prev.emotionalTone !== node.emotionalTone) {
      tension += 30;
      driver = "emotion_shift";
    }

    return {
      barIndex: node.barIndex,
      tension:  clampScore(tension),
      driver,
    };
  });
}

function buildThematicClusters(
  verseBars: BarInput[],
  nodes: NarrativeNode[]
): ThematicCluster[] {
  const clusters: ThematicCluster[] = [];

  // Group by dominant emotion
  const emotionGroups = new Map<EmotionTarget, { bars: BarInput[]; nodes: NarrativeNode[] }>();
  nodes.forEach((node, i) => {
    const bar = verseBars[i];
    if (!bar) return;
    const group = emotionGroups.get(node.emotionalTone) ?? { bars: [], nodes: [] };
    group.bars.push(bar);
    group.nodes.push(node);
    emotionGroups.set(node.emotionalTone, group);
  });

  for (const [emotion, group] of emotionGroups) {
    if (!group.bars.length) continue;
    const allTokens = group.bars.flatMap((b) => tokenizeArabic(b.text));
    const freq = new Map<string, number>();
    for (const t of allTokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    const keywords = [...freq.entries()]
      .filter(([w]) => w.length >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    clusters.push({
      label:    emotion,
      barIds:   group.bars.map((b) => b.id),
      keywords,
      strength: clampScore(average(group.nodes.map((n) => n.semanticDensity))),
    });
  }

  return clusters;
}

function classifyArcType(
  emotionalArc: EmotionalArcPoint[],
  circularityScore: number,
  montageScore: number
): { type: NarrativeArcType; label: string } {
  if (circularityScore >= 62) {
    return { type: "circular", label: "قوس دائري — يعود إلى نقطة البداية بمعنى أعمق" };
  }

  const intensities = emotionalArc.map((p) => p.intensity);
  const firstHalf   = intensities.slice(0, Math.ceil(intensities.length / 2));
  const secondHalf  = intensities.slice(Math.floor(intensities.length / 2));
  const firstAvg    = average(firstHalf);
  const secondAvg   = average(secondHalf);

  if (secondAvg - firstAvg > 20) {
    return { type: "hero_rise", label: "صعود بطولي — يتصاعد نحو الانتصار والتحرر" };
  }
  if (firstAvg - secondAvg > 20) {
    return { type: "tragic_descent", label: "هبوط مأساوي — ينحدر نحو الألم والكسر" };
  }
  if (montageScore >= 60) {
    return { type: "fragmented_mosaic", label: "فسيفساء مفككة — مشاهد متقطعة تشكّل صورة كاملة" };
  }

  const emotionChanges = emotionalArc.filter((p, i) => {
    return i > 0 && emotionalArc[i - 1]?.emotion !== p.emotion;
  }).length;

  if (emotionChanges >= emotionalArc.length * 0.5) {
    return { type: "emotional_spiral", label: "دوامة مشاعرية — تتقلب بين الأقطار الشعورية" };
  }
  if (average(intensities) > 65) {
    return { type: "steady_tension", label: "توتر ثابت — طاقة عالية مستمرة طوال النص" };
  }
  return { type: "undefined", label: "قوس غير محدد — يحتاج إلى بناء سردي أوضح" };
}

// ─────────────────────────────────────────────
// TECHNIQUE DETECTOR
// ─────────────────────────────────────────────

function detectTechniques(scores: {
  circularity: number; montage: number; contradiction: number;
  metaphor: number;    integration: number;
}): NarrativeTechnique[] {
  const t: NarrativeTechnique[] = [];
  if (scores.circularity   >= 62) t.push("enhancedcircularnarrative");
  if (scores.montage       >= 58) t.push("advancednarrativemontage");
  if (scores.contradiction >= 45) t.push("harmonizedcontradictoryimagery");
  if (scores.metaphor      >= 50) t.push("evolvingmetaphormatrix");
  if (scores.integration   >= 60) t.push("integratedsonicsemanticline");
  return t;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export function analyzeNarrativeArc(bars: BarInput[]): NarrativeArcExtended {
  const verseBars = bars.filter((b) => b.section === "verse");

  // ── Node building ───────────────────────────
  const nodes: NarrativeNode[] = verseBars.map((bar) => ({
    id:               bar.id,
    barIndex:         bar.index,
    text:             bar.text,
    detectedTimeMode: detectTimeMode(bar.text),
    emotionalTone:    estimateEmotion(bar.text),
    semanticDensity:  semanticDensity(bar.text),
    contradictionScore: contradictionScore(bar.text),
    metaphorScore:    metaphorScore(bar.text),
    anchorScore:      anchorScore(bar.text, verseBars),
  }));

  // ── Circularity ─────────────────────────────
  const first = verseBars[0];
  const last  = verseBars.at(-1);
  const circularityScore = first && last
    ? clampScore(
        lexicalOverlap(first.text, last.text) * 45 +
        endingSoundSimilarity(first.text, last.text) * 35 +
        (100 - Math.abs(semanticDensity(last.text) - semanticDensity(first.text))) * 0.2
      )
    : 0;

  // ── Montage ─────────────────────────────────
  const timeModes       = new Set(nodes.map((n) => n.detectedTimeMode));
  const emotionChanges  = nodes.filter((n, i) =>
    i > 0 && nodes[i - 1]?.emotionalTone !== n.emotionalTone
  ).length;
  const montageScore    = clampScore(
    timeModes.size * 20 +
    emotionChanges * 14 +
    average(nodes.map((n) => n.semanticDensity)) * 0.28
  );

  // ── Contradiction harmony ───────────────────
  const contradictionHarmonyScore = clampScore(
    average(nodes.map((n) => n.contradictionScore)) * 0.7 +
    average(nodes.map((n) => n.anchorScore)) * 0.3
  );

  // ── Metaphor evolution ──────────────────────
  const metaphorEvolutionScore = clampScore(
    average(nodes.map((n) => n.metaphorScore)) * 0.72 +
    new Set(
      verseBars.flatMap((b) =>
        tokenizeArabic(b.text).filter((t) => METAPHOR_MARKERS.has(t))
      )
    ).size * 5.5
  );

  // ── Sonic-semantic integration ──────────────
  const phoneticAnalyses = verseBars.map(analyzeArabicPhonetics);
  const sonicSemanticIntegrationScore = clampScore(
    average(phoneticAnalyses.map((result, i) => {
      const node    = nodes[i];
      if (!node) return 0;
      const emotion = node.emotionalTone;
      const p       = result.phonetics;

      if (["anger", "defiance"].includes(emotion)) {
        return weightedAverage([
          { value: p.impact,              weight: 0.45 },
          { value: p.heaviness,           weight: 0.35 },
          { value: node.semanticDensity,  weight: 0.20 },
        ]);
      }
      if (["sadness", "melancholy", "love"].includes(emotion)) {
        return weightedAverage([
          { value: p.smoothness,          weight: 0.45 },
          { value: p.elongation,          weight: 0.25 },
          { value: node.semanticDensity,  weight: 0.30 },
        ]);
      }
      if (emotion === "triumph" || emotion === "pride") {
        return weightedAverage([
          { value: p.impact,              weight: 0.40 },
          { value: p.bounce,              weight: 0.30 },
          { value: node.semanticDensity,  weight: 0.30 },
        ]);
      }
      return weightedAverage([
        { value: p.bounce,              weight: 0.30 },
        { value: p.impact,             weight: 0.25 },
        { value: node.semanticDensity, weight: 0.45 },
      ]);
    }))
  );

  // ── Global score ─────────────────────────────
  const globalNarrativeScore = clampScore(
    weightedAverage([
      { value: circularityScore,              weight: 0.20 },
      { value: montageScore,                  weight: 0.20 },
      { value: contradictionHarmonyScore,     weight: 0.18 },
      { value: metaphorEvolutionScore,        weight: 0.20 },
      { value: sonicSemanticIntegrationScore, weight: 0.22 },
    ])
  );

  // ── Extended analytics ───────────────────────
  const emotionalArcMap       = buildEmotionalArcMap(nodes);
  const narrativeTensionCurve = buildTensionCurve(nodes);
  const thematicClusters      = buildThematicClusters(verseBars, nodes);
  const { type: arcType, label: arcTypeLabel } = classifyArcType(
    emotionalArcMap, circularityScore, montageScore
  );

  // ── Detected techniques ──────────────────────
  const detectedTechniques = detectTechniques({
    circularity:  circularityScore,
    montage:      montageScore,
    contradiction: contradictionHarmonyScore,
    metaphor:     metaphorEvolutionScore,
    integration:  sonicSemanticIntegrationScore,
  });

  // ── Suggestions ──────────────────────────────
  const suggestions: string[] = [];
  if (circularityScore < 55) {
    suggestions.push("اربط آخر الفيرس بأوله عبر تكرار صورة أو كلمة مفتاحية لكن بمعنى أعمق.");
  }
  if (montageScore < 50) {
    suggestions.push("أضف قفزة زمنية أو انتقالًا بصريًا سريعًا بين مشهدين لبناء مونتاج سردي.");
  }
  if (contradictionHarmonyScore < 45) {
    suggestions.push("استخدم ثنائية متناقضة (نور/ظلام — قوة/ضعف) داخل نفس البار.");
  }
  if (metaphorEvolutionScore < 50) {
    suggestions.push("اختر استعارة مركزية واحدة وكررها مع تطوير معناها تدريجيًا عبر الفيرس.");
  }
  if (sonicSemanticIntegrationScore < 58) {
    suggestions.push("اربط الحالة الشعورية بنوعية الأصوات: الغضب يحتاج حروفًا أثقل، والحزن يحتاج مدودًا وأنفاسًا أوسع.");
  }

  const globalSuggestions: string[] = [...suggestions];
  if (arcType === "undefined") {
    globalSuggestions.push("حدد نوع قوسك السردي: هل تصعد؟ تهبط؟ تدور؟ — القرار يوجه كل قرار لغوي بعده.");
  }
  if (thematicClusters.length > 3) {
    globalSuggestions.push("لديك أكثر من 3 محاور مشاعرية — ادمج الأضعف في الأقوى لمنح النص وحدة أعمق.");
  }

  return {
    circularityScore,
    montageScore,
    contradictionHarmonyScore,
    metaphorEvolutionScore,
    sonicSemanticIntegrationScore,
    globalNarrativeScore,
    nodes,
    detectedTechniques,
    suggestions,
    // Extended
    emotionalArcMap,
    narrativeTensionCurve,
    thematicClusters,
    arcType,
    arcTypeLabel,
    globalSuggestions,
  };
}
