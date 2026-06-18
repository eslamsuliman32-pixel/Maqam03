// ═══════════════════════════════════════════════════════════════
//  MAQAM — VRAS Bar Converter
//  يحوّل البارات من مستودع التطبيق الرئيسي (Bar) إلى صيغة VRAS (TextBar)
// ═══════════════════════════════════════════════════════════════

import type { Bar } from "../types";
import type { TextBar, EmotionTag, EnergyLevel } from "../store/vrasStore";
import { countExplosiveLetters } from "../store/vrasStore";

const VALID_EMOTIONS: EmotionTag[] = [
  "aggressive", "sad", "triumphant", "cinematic", "neutral", "romantic",
];

function mapEmotion(raw?: string): EmotionTag {
  if (!raw) return "neutral";
  const lower = raw.toLowerCase();
  if (VALID_EMOTIONS.includes(lower as EmotionTag)) return lower as EmotionTag;
  // Arabic → English mapping
  const arMap: Record<string, EmotionTag> = {
    "حزين": "sad", "غاضب": "aggressive", "انتصار": "triumphant",
    "رومانسي": "romantic", "سينمائي": "cinematic",
  };
  return arMap[raw] ?? "neutral";
}

function mapEnergyFromWeights(bar: Bar): EnergyLevel {
  // Use sonicWeight / rhythmicWeight (0–1 scale) if available
  const w = ((bar.sonicWeight ?? 0) + (bar.rhythmicWeight ?? 0)) / 2;
  if (w >= 0.85) return "peak";
  if (w >= 0.65) return "high";
  if (w >= 0.40) return "medium";
  if (w > 0) return "low";
  return "medium"; // fallback when weights not computed
}

function detectRhymeEnd(text: string): string {
  const words = text.trim().split(/\s+/);
  const last = words[words.length - 1];
  return last?.slice(-3) || "";
}

export function repositoryBarToTextBar(bar: Bar): TextBar {
  const explosiveCount = countExplosiveLetters(bar.text);
  const textLen = bar.text.replace(/\s/g, "").length || 1;

  return {
    id: bar.id,
    text: bar.text,
    syllableCount: bar.syllableCount || bar.totalMorae || 0,
    // endPhoneme is often the full rhyme syllable from mora engine
    rhymeEnd: bar.endPhoneme?.slice(-3) || detectRhymeEnd(bar.text),
    rhymeScheme: "free",
    emotion: mapEmotion(bar.emotion),
    energy: mapEnergyFromWeights(bar),
    hasInternalRhyme: (bar.internalRhymes ?? 0) > 0,
    explosiveLetterRatio: Math.min(1, explosiveCount / textLen),
    wordCount: bar.text.trim().split(/\s+/).length,
    tags: [
      ...(bar.tags ?? []),
      ...(bar.semanticTags?.map(String) ?? []),
      bar.narrativeArc ?? "",
      bar.flowMode ?? "",
    ].filter(Boolean),
    matchScore: undefined,
  };
}

export function repositoryBarsToTextBars(bars: Bar[]): TextBar[] {
  return bars
    .filter((b) => !b.deleted && b.text?.trim())
    .map(repositoryBarToTextBar);
}
