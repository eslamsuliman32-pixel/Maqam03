import { v4 as uuidv4 } from "uuid";
import {
  TonalSpike,
  BeatRideConfig,
  SyncopationConfig,
  Bar,
  Beat,
  EmotionType,
} from "../types/flowEngine.types";

/**
 * إنشاء Spike صوتي حاد في نبرة معينة.
 */
export function createTonalSpike(
  barId: string,
  beatPosition: 1 | 2 | 3 | 4,
  spikeType: TonalSpike["spikeType"],
  intensity: number = 80,
  targetSyllable: string = "كلا",
  emotionIntent: EmotionType = "rage"
): TonalSpike {
  const colors: Record<TonalSpike["spikeType"], string> = {
    "pitch-rise": "bg-neural-sapphire",
    "pitch-drop": "bg-neural-amethyst",
    "volume-burst": "bg-neural-crimson",
    rasp: "bg-neural-gold",
    whisper: "bg-neural-emerald",
    cry: "bg-neural-rose",
  };

  return {
    id: uuidv4(),
    barId,
    beatPosition,
    spikeType,
    intensity,
    duration: 150 + Math.random() * 150,
    targetSyllable,
    emotionIntent,
    visualColor: colors[spikeType] || "bg-yellow-500",
  };
}

/**
 * حساب مدى موازاة أو تطابق الحروف الصامتة الانفجارية مع الإيقاع (Consonant Alignment Score).
 * كلما وافق الحرف الانفجاري (مثل: ق، ك، ط، ت) الضربة الإيقاعية القوية، ارتفعت الدرجة.
 */
export function calculateConsonantAlignment(
  bar: Bar,
  config: BeatRideConfig
): number {
  let score = 0;
  let matches = 0;
  const explosiveSet = new Set(config.explosiveConsonants);

  bar.beats.forEach((beat) => {
    if (!beat.syllable || beat.isRest) return;

    // الحرف الأول من المقطع
    const firstChar = beat.syllable[0];
    const isExplosive = explosiveSet.has(firstChar);

    // إذا كانت الدقة هي ضربة الكيك أو طبلة السنير
    const isAnchorBeat =
      config.kickBeats.includes(beat.position) ||
      config.snareBeats.includes(beat.position);

    if (isExplosive && isAnchorBeat) {
      score += 25;
      matches++;
    } else if (!isExplosive && !isAnchorBeat) {
      score += 15;
    } else if (isExplosive && !isAnchorBeat) {
      score += 5; // خارج الإيقاع (سنكبة مقبولة)
    }
  });

  return Math.min(100, Math.round(score + (matches / 4) * 20));
}

/**
 * تقييم معيار السنكبة والبوليرزمية (Polyrhythmic Rhythmic Tension).
 */
export function calculateSyncopationTension(
  bar: Bar,
  config: SyncopationConfig
): number {
  let tension = 0;

  // تأثير مستويات السوينغ والانزلاق الزمني
  tension += (bar.swingAmount / 100) * 25;

  // الدقات الخلفية (offbeat)
  const offbeats = bar.beats.filter(
    (b) => b.position % 2 === 0 && b.syllable.length > 0 && !b.isRest
  );
  tension += offbeats.length * (config.offbeatEmphasis / 100) * 15;

  // النغمات الشبحية (Ghost notes)
  const ghosts = bar.beats.filter((b) => b.accent === "ghost");
  tension += ghosts.length * (config.ghostNoteFrequency / 100) * 10;

  if (config.polyrhythmEnabled) tension += 20;

  if (config.tupletMode !== "none") {
    tension += config.tupletMode === "quintuplet" ? 15 : 10;
  }

  return Math.min(100, Math.round(tension));
}
