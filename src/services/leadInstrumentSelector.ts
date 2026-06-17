// src/services/leadInstrumentSelector.ts

import {
  LeadInstrumentCandidate,
  LeadInstrumentId,
} from '../types/flowLabElite';

const INSTRUMENT_META: Record<
  LeadInstrumentId,
  { labelAr: string; labelEn: string; icon: string }
> = {
  'synth-lead': {
    labelAr: 'السينث القائد',
    labelEn: 'Lead Synth',
    icon: '🎹',
  },
  strings: {
    labelAr: 'الوتريات',
    labelEn: 'Strings',
    icon: '🎻',
  },
  brass: {
    labelAr: 'النحاسيات',
    labelEn: 'Brass',
    icon: '🎺',
  },
  vocal: {
    labelAr: 'الصوت الأساسي',
    labelEn: 'Vocals',
    icon: '🎤',
  },
  bass: {
    labelAr: 'الباس',
    labelEn: 'Bass',
    icon: '🔊',
  },
  piano: {
    labelAr: 'البيانو',
    labelEn: 'Piano',
    icon: '🎼',
  },
  unknown: {
    labelAr: 'غير محدد',
    labelEn: 'Unknown',
    icon: '✨',
  },
};

const clampScore = (value: number) => {
  return Math.max(0, Math.min(100, Math.round(value)));
};

const buildReason = (
  presence: number,
  motion: number,
  beatSync: number,
  continuity: number,
  writingSpace: number
) => {
  const strengths: string[] = [];

  if (presence >= 70) strengths.push('واضحة داخل البيت');
  if (motion >= 70) strengths.push('حركتها اللحنية مناسبة للكتابة');
  if (beatSync >= 70) strengths.push('متزامنة مع الضربات الأساسية');
  if (continuity >= 70) strengths.push('مستمرة بما يكفي لتوجيه التدفق');
  if (writingSpace >= 70) strengths.push('تترك مساحة جيدة للكلمات');

  if (strengths.length === 0) {
    return 'اختيار مقبول، لكنه يحتاج مراجعة يدوية قبل تثبيته.';
  }

  return `تم ترشيحها لأنها ${strengths.join('، ')}.`;
};

export const suggestLeadInstrument = (analysisResult: any): {
  suggested: LeadInstrumentCandidate;
  candidates: LeadInstrumentCandidate[];
} => {
  const availableChannels =
    analysisResult?.channels ||
    analysisResult?.stems ||
    [
      { id: 'synth-lead', energy: 0.86, motion: 0.78, beatSync: 0.81, continuity: 0.74, vocalMasking: 0.2 },
      { id: 'strings', energy: 0.68, motion: 0.52, beatSync: 0.55, continuity: 0.88, vocalMasking: 0.32 },
      { id: 'brass', energy: 0.58, motion: 0.45, beatSync: 0.72, continuity: 0.36, vocalMasking: 0.28 },
      { id: 'vocal', energy: 0.72, motion: 0.67, beatSync: 0.62, continuity: 0.69, vocalMasking: 0.82 },
      { id: 'bass', energy: 0.8, motion: 0.34, beatSync: 0.84, continuity: 0.81, vocalMasking: 0.35 },
      { id: 'piano', energy: 0.54, motion: 0.66, beatSync: 0.57, continuity: 0.61, vocalMasking: 0.3 },
    ];

  const candidates: LeadInstrumentCandidate[] = availableChannels.map((channel: any) => {
    const id = (channel.id || 'unknown') as LeadInstrumentId;
    const meta = INSTRUMENT_META[id] || INSTRUMENT_META.unknown;

    const presenceScore = clampScore((channel.energy ?? 0.5) * 100);
    const motionScore = clampScore((channel.motion ?? 0.5) * 100);
    const beatSyncScore = clampScore((channel.beatSync ?? 0.5) * 100);
    const continuityScore = clampScore((channel.continuity ?? 0.5) * 100);

    const vocalMasking = channel.vocalMasking ?? 0.35;
    const writingSpaceScore = clampScore((1 - vocalMasking) * 100);

    const confidence = clampScore(
      presenceScore * 0.24 +
        motionScore * 0.24 +
        beatSyncScore * 0.22 +
        continuityScore * 0.14 +
        writingSpaceScore * 0.16
    );

    return {
      id,
      labelAr: meta.labelAr,
      labelEn: meta.labelEn,
      icon: meta.icon,
      confidence,
      presenceScore,
      motionScore,
      beatSyncScore,
      continuityScore,
      writingSpaceScore,
      reason: buildReason(
        presenceScore,
        motionScore,
        beatSyncScore,
        continuityScore,
        writingSpaceScore
      ),
    };
  });

  const sortedCandidates = candidates.sort((a, b) => b.confidence - a.confidence);

  return {
    suggested: sortedCandidates[0],
    candidates: sortedCandidates,
  };
};
