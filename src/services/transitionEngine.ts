import { v4 as uuidv4 } from "uuid";
import {
  TransitionConfig,
  TransitionStrategy,
  IntonationCurvePoint,
} from "../types/flowEngine.types";

/**
 * إنشاء معايير الانتقال بين قسمين للراب (رباعيتين).
 */
export function createTransitionConfig(
  fromQuatrainId: string,
  toQuatrainId: string,
  strategy: TransitionStrategy = "breath"
): TransitionConfig {
  const spilloverPresets: Record<TransitionStrategy, string[]> = {
    rhythmic: ["أيو", "يلا"],
    tonal: ["آه", "يه"],
    breath: [],
    spillover: ["يا", "من", "هنا"],
    compound: ["أيو", "أوه"],
  };

  return {
    id: uuidv4(),
    strategy,
    fromQuatrainId,
    toQuatrainId,
    blendDuration: strategy === "compound" ? 4 : 2,
    smoothness: strategy === "breath" ? 90 : 70,
    breathMarkPosition: strategy === "breath" || strategy === "compound" ? 3.5 : null,
    spilloverSyllables: spilloverPresets[strategy] || [],
    pitchBridge: strategy === "tonal" || strategy === "compound" ? [50, 60, 70, 80] : [],
  };
}

/**
 * دمج المنحنيات النغمية لقسمين لتأهيل الانتقال الآمن (Pitch Bridge).
 */
export function generatePitchBridge(
  config: TransitionConfig,
  startPitch: number,
  endPitch: number
): number[] {
  const steps = config.blendDuration * 2; // دقة أعلى للمزج
  const bridge: number[] = [];

  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    // منحنى الخلط اللين (S-Curve)
    const smoothFactor = Math.sin((factor * Math.PI) / 2);
    const pitch = startPitch + smoothFactor * (endPitch - startPitch);
    bridge.push(Math.round(pitch));
  }

  return bridge;
}

/**
 * تقييم سلاسة الانتقال والربط الذهبي (Transition Quality Score).
 */
export function calculateTransitionSmoothness(
  config: TransitionConfig
): number {
  let score = 50;

  switch (config.strategy) {
    case "breath":
      // وجود علامة تنفس يزيد السلاسة الفيزيائية للرئة
      score += config.breathMarkPosition !== null ? 35 : 10;
      break;
    case "spillover":
      // انزلاق المقاطع يزيد الترابط السمعي لكن يقلل وضوح الهيكل
      score += config.spilloverSyllables.length > 0 ? 30 : 15;
      break;
    case "tonal":
      score += config.pitchBridge.length > 0 ? 40 : 10;
      break;
    case "rhythmic":
      score += config.blendDuration > 1 ? 30 : 20;
      break;
    case "compound": default:
      score += 45;
      break;
  }

  return Math.min(100, score);
}
