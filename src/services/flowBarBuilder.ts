// src/services/flowBarBuilder.ts

import { FlowBar, IntensityLevel } from '../types/flowLabElite';

const getIntensity = (value: number): IntensityLevel => {
  if (value >= 0.72) return 'high';
  if (value >= 0.42) return 'medium';
  return 'low';
};

const getHint = (intensity: IntensityLevel) => {
  if (intensity === 'high') {
    return 'استخدم كلمات قصيرة وحادة. لا تزحم المساحة.';
  }

  if (intensity === 'medium') {
    return 'مساحة مناسبة لجملة متوازنة أو قافية داخلية.';
  }

  return 'مساحة تنفس. يمكنك مد الجملة أو ترك فراغ مؤثر.';
};

export const buildFlowBars = (analysisResult: any): FlowBar[] => {
  const bars = analysisResult?.bars || [];

  return bars.map((bar: any, index: number) => {
    const startTime = bar.startTime ?? bar.start ?? index * (bar.duration ?? 2);
    const duration = bar.duration ?? 2;
    const endTime = bar.endTime ?? startTime + duration;

    const rawIntensity =
      bar.leadIntensity ??
      bar.energy ??
      bar.density ??
      Math.random() * 0.7 + 0.15;

    const intensity = getIntensity(rawIntensity);

    return {
      id: bar.id || `bar-${index + 1}`,
      index: index + 1,
      startTime,
      endTime,
      duration,
      intensity,
      suggestedWritingHint: getHint(intensity),
      words: bar.words || '',
      syllableEstimate: bar.words ? Math.max(1, Math.ceil(bar.words.length / 3.2)) : 0,
    };
  });
};
