// ═══════════════════════════════════════════════════════════════
//  MAQAM — Core Audio Analysis Engine v3.0
//  المحرك الأساسي للتحليل الصوتي
// ═══════════════════════════════════════════════════════════════

import type {
  BeatBlueprint, Bar, OnsetEvent, RhymeSlot,
  SongSection, SectionType, EnergyLevel
} from "../types/audio.types";

export type { BeatBlueprint };
export type CompleteAudioAnalysis = BeatBlueprint;

// ── Constants ────────────────────────────────────────────────
const FFTSIZE              = 2048;
const HOPSIZE              = 512;
const BASSMAXHZ           = 250;
const MIDMINHZ            = 250;
const MIDMAXHZ            = 4000;
const HIGHMINHZ           = 4000;
const ONSETKICKTHRESHOLD  = 0.65;
const ONSETSNARETHRESHOLD = 0.45;
const ONSETHIHATTHRESHOLD = 0.30;
const MINBPM               = 60;
const MAXBPM               = 200;

// ── Utilities ────────────────────────────────────────────────

function getBinRange(sampleRate: number, fftSize: number, minHz: number, maxHz: number) {
  const binWidth = sampleRate / fftSize;
  return {
    min: Math.floor(minHz / binWidth),
    max: Math.min(Math.ceil(maxHz / binWidth), fftSize / 2 - 1),
  };
}

function computeRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

function normalize(arr: number[]): number[] {
  const max = Math.max(...arr, 1e-9);
  return arr.map(v => v / max);
}

function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

function energyToLevel(score: number): EnergyLevel {
  if (score >= 0.80) return "peak";
  if (score >= 0.55) return "high";
  if (score >= 0.30) return "mid";
  return "low";
}

// ── BPM Detection via Autocorrelation ───────────────────────

function detectBPM(channelData: Float32Array, sampleRate: number): {
  bpm: number;
  stability: number;
} {
  const frameSize  = Math.floor(sampleRate * 3); // 3-second window
  const frame      = channelData.slice(0, Math.min(frameSize, channelData.length));
  const acLength   = Math.floor(sampleRate * 2);
  const ac         = new Float32Array(acLength);

  // Autocorrelation
  for (let lag = 0; lag < acLength; lag++) {
    let sum = 0;
    for (let i = 0; i < frame.length - lag; i++) {
      sum += frame[i] * frame[i + lag];
    }
    ac[lag] = sum / (frame.length - lag);
  }

  // Find peaks in BPM range
  const minLag = Math.floor((60 / MAXBPM) * sampleRate);
  const maxLag = Math.floor((60 / MINBPM) * sampleRate);

  let bestLag     = minLag;
  let bestAC      = -Infinity;
  const peaks: number[] = [];

  for (let lag = minLag; lag <= maxLag; lag++) {
    if (ac[lag] > bestAC) {
      bestAC  = ac[lag];
      bestLag = lag;
    }
    if (
      lag > minLag &&
      lag < maxLag &&
      ac[lag] > ac[lag - 1] &&
      ac[lag] > ac[lag + 1] &&
      ac[lag] > ac[0] / 0.3
    ) {
      peaks.push(lag);
    }
  }

  const bpm       = (60 * sampleRate) / bestLag;
  const stability = clamp(bestAC / (ac[0] || 1));

  return {
    bpm:       Math.round(clamp(bpm, MINBPM, MAXBPM) * 10) / 10,
    stability: Math.round(stability * 100) / 100,
  };
}

// ── Onset Detection ──────────────────────────────────────────

function detectOnsets(
  audioBuffer:  AudioBuffer,
  bpm:          number,
  sampleRate:   number
): OnsetEvent[] {
  const channelData     = audioBuffer.getChannelData(0);
  const secondsPerBeat  = 60 / bpm;
  const secondsPerBar   = secondsPerBeat * 4;
  const hopSamples      = HOPSIZE;
  const onsets: OnsetEvent[] = [];

  const offlineCtx  = new OfflineAudioContext(1, channelData.length, sampleRate);
  const analyser    = offlineCtx.createAnalyser();
  analyser.fftSize  = FFTSIZE;

  // Frame-by-frame energy diff (spectral flux)
  const frameCount  = Math.floor(channelData.length / hopSamples);

  let prevBassEnergy = 0;
  let prevMidEnergy  = 0;
  let prevHighEnergy = 0;

  for (let frame = 0; frame < frameCount; frame++) {
    const startSample = frame * hopSamples;
    const endSample   = Math.min(startSample + FFTSIZE, channelData.length);
    const segment     = channelData.slice(startSample, endSample);

    // Compute energy per band using RMS on segment slices
    const bassSlice  = segment.slice(0, Math.floor(segment.length * (BASSMAXHZ / (sampleRate / 2))));
    const midSlice   = segment.slice(
      Math.floor(segment.length * (MIDMINHZ  / (sampleRate / 2))),
      Math.floor(segment.length * (MIDMAXHZ  / (sampleRate / 2)))
    );
    const highSlice  = segment.slice(Math.floor(segment.length * (HIGHMINHZ / (sampleRate / 2))));

    const bassE = computeRMS(bassSlice.length  > 0 ? bassSlice  : segment);
    const midE  = computeRMS(midSlice.length   > 0 ? midSlice   : segment);
    const highE = computeRMS(highSlice.length  > 0 ? highSlice  : segment);

    const bassDiff = bassE - prevBassEnergy;
    const midDiff  = midE  - prevMidEnergy;
    const highDiff = highE - prevHighEnergy;

    const timeSeconds = (startSample / sampleRate);
    const barIndex    = Math.floor(timeSeconds / secondsPerBar);
    const beatInBar   = (timeSeconds % secondsPerBar) / secondsPerBeat;
    const beatIndex   = Math.floor(beatInBar) + 1;
    const subdivIndex = Math.round((beatInBar % 1) * 4);

    // Classify onset type by spectral content
    if (bassDiff > ONSETKICKTHRESHOLD * 0.1) {
      onsets.push({
        timeSeconds,
        barIndex,
        beatIndex:         clamp(beatIndex, 1, 4) as any,
        subdivisionIndex:  clamp(subdivIndex, 0, 3),
        strength:          clamp(bassDiff * 8),
        type:              "kick",
      });
    } else if (midDiff > ONSETSNARETHRESHOLD * 0.05 && midDiff > bassDiff) {
      onsets.push({
        timeSeconds,
        barIndex,
        beatIndex:         clamp(beatIndex, 1, 4) as any,
        subdivisionIndex:  clamp(subdivIndex, 0, 3),
        strength:          clamp(midDiff * 8),
        type:              "snare",
      });
    } else if (highDiff > ONSETHIHATTHRESHOLD * 0.03) {
      onsets.push({
        timeSeconds,
        barIndex,
        beatIndex:         clamp(beatIndex, 1, 4) as any,
        subdivisionIndex:  clamp(subdivIndex, 0, 3),
        strength:          clamp(highDiff * 8),
        type:              "hihat",
      });
    }

    prevBassEnergy = bassE;
    prevMidEnergy  = midE;
    prevHighEnergy = highE;
  }

  // Deduplicate close onsets (within 50ms)
  return onsets.filter((o, i) =>
    i === 0 || o.timeSeconds - onsets[i - 1].timeSeconds > 0.05
  );
}

// ── Spectral Analysis per Bar ────────────────────────────────

function analyzeSpectralPerBar(
  audioBuffer:   AudioBuffer,
  totalBars:     number,
  secondsPerBar: number
): { bassProfile: number[]; midProfile: number[]; highProfile: number[]; energyCurve: number[] } {
  const channelData  = audioBuffer.getChannelData(0);
  const sampleRate   = audioBuffer.sampleRate;
  const bassProfile: number[] = [];
  const midProfile:  number[] = [];
  const highProfile: number[] = [];
  const energyCurve: number[] = [];

  for (let bar = 0; bar < totalBars; bar++) {
    const startSample = Math.floor(bar * secondsPerBar * sampleRate);
    const endSample   = Math.min(
      Math.floor((bar + 1) * secondsPerBar * sampleRate),
      channelData.length
    );

    if (startSample >= channelData.length) break;

    const segment = channelData.slice(startSample, endSample);
    const len     = segment.length;

    // Approximate band energy via position-based sampling
    const bassEnd  = Math.floor(len * (BASSMAXHZ  / (sampleRate / 2)));
    const midStart = Math.floor(len * (MIDMINHZ   / (sampleRate / 2)));
    const midEnd   = Math.floor(len * (MIDMAXHZ   / (sampleRate / 2)));
    const highStart= Math.floor(len * (HIGHMINHZ  / (sampleRate / 2)));

    const bassE = computeRMS(segment.slice(0, Math.max(bassEnd, 1)));
    const midE  = computeRMS(segment.slice(
      Math.max(midStart, 0),
      Math.max(midEnd, midStart + 1)
    ));
    const highE = computeRMS(segment.slice(Math.max(highStart, 0)));
    const total = computeRMS(segment);

    bassProfile.push(bassE);
    midProfile.push(midE);
    highProfile.push(highE);
    energyCurve.push(total);
  }

  return {
    bassProfile:  normalize(bassProfile),
    midProfile:   normalize(midProfile),
    highProfile:  normalize(highProfile),
    energyCurve:  normalize(energyCurve),
  };
}

// ── Rhyme Slot Generator ─────────────────────────────────────

function generateRhymeSlots(
  onsets:        OnsetEvent[],
  barIndex:      number,
  secondsPerBar: number,
  energyScore:   number
): RhymeSlot[] {
  const slots: RhymeSlot[] = [];
  const secondsPerBeat     = secondsPerBar / 4;

  // Standard rap landing positions: beat 2 & 4 (snare hits)
  const landingBeats = [2, 4];
  landingBeats.forEach(beat => {
    const time     = barIndex * secondsPerBar + (beat - 1) * secondsPerBeat;
    const nearSnare= onsets.some(
      o => o.type === "snare" && Math.abs(o.timeSeconds - time) < 0.08
    );
    slots.push({
      barIndex,
      beatPosition:          beat,
      timeSeconds:           time,
      slotType:              nearSnare ? "landing" : "pocket",
      confidence:            nearSnare ? 0.92 : 0.65,
      suggestedSyllableCount: Math.round(4 + energyScore * 4),
    });
  });

  // Breath points: end of bar (beat 4.5 – 4.75)
  slots.push({
    barIndex,
    beatPosition:          4.5,
    timeSeconds:           barIndex * secondsPerBar + 3.5 * secondsPerBeat,
    slotType:              "breath",
    confidence:            0.75,
    suggestedSyllableCount: 0,
  });

  // Ghost pockets: after each kick
  onsets
    .filter(o => o.type === "kick" && o.beatIndex <= 3)
    .slice(0, 2)
    .forEach(kick => {
      slots.push({
        barIndex,
        beatPosition:          kick.beatIndex + 0.5,
        timeSeconds:           kick.timeSeconds + secondsPerBeat * 0.5,
        slotType:              "ghost",
        confidence:            0.50,
        suggestedSyllableCount: 2,
      });
    });

  return slots.sort((a, b) => a.beatPosition - b.beatPosition);
}

// ── Bar Builder ──────────────────────────────────────────────

function buildBars(
  totalBars:     number,
  secondsPerBar: number,
  onsets:        OnsetEvent[],
  spectral:      ReturnType<typeof analyzeSpectralPerBar>
): Bar[] {
  return Array.from({ length: totalBars }, (_, i) => {
    const barOnsets    = onsets.filter(o => o.barIndex === i);
    const energyScore  = spectral.energyCurve[i] ?? 0;
    const bassE        = spectral.bassProfile[i]  ?? 0;
    const midE         = spectral.midProfile[i]   ?? 0;
    const highE        = spectral.highProfile[i]  ?? 0;

    // Silence detection: if energy is very low relative to average
    const avgEnergy    = spectral.energyCurve.reduce((a, b) => a + b, 0) / totalBars;
    const hasSilence   = energyScore < avgEnergy * 0.25;
    const silenceRatio = hasSilence ? clamp(1 - energyScore / (avgEnergy * 0.25)) : 0;

    // Rhyme slots: identify pockets after kick/snare hits
    const rhymeSlots   = generateRhymeSlots(barOnsets, i, secondsPerBar, energyScore);

    return {
      index:         i,
      startTime:     i * secondsPerBar,
      endTime:       (i + 1) * secondsPerBar,
      durationSeconds: secondsPerBar,
      onsets:        barOnsets,
      energyLevel:   energyToLevel(energyScore),
      energyScore,
      bassEnergy:    bassE,
      midEnergy:     midE,
      highEnergy:    highE,
      hasSilence,
      silenceRatio,
      rhymeSlots,
    };
  });
}

// ── Structure Detector ───────────────────────────────────────

const SECTIONCOLORS: Record<SectionType, string> = {
  intro:   "#6366F1",
  verse:   "#10B981",
  hook:    "#F59E0B",
  chorus:  "#EF4444",
  bridge:  "#8B5CF6",
  drop:    "#EC4899",
  outro:   "#64748B",
};

function detectStructure(bars: Bar[]): SongSection[] {
  if (bars.length === 0) return [];

  const sections: SongSection[] = [];
  let sectionStart = 0;
  let prevLevel    = bars[0].energyLevel;

  const flush = (endBar: number) => {
    if (endBar <= sectionStart) return;
    const slice     = bars.slice(sectionStart, endBar);
    const avgEnergy = slice.reduce((a, b) => a + b.energyScore, 0) / slice.length;
    const barCount  = endBar - sectionStart;

    let type: SectionType;
    const idx = sections.length;
    if (idx === 0 && barCount <= 4)                     type = "intro";
    else if (idx === sections.length - 1 && barCount <= 4) type = "outro";
    else if (avgEnergy >= 0.75)                         type = "chorus";
    else if (avgEnergy >= 0.55)                         type = "hook";
    else if (avgEnergy >= 0.25)                         type = "verse";
    else                                                type = "bridge";

    const domBass = slice.reduce((a, b) => a + b.bassEnergy, 0) / slice.length;
    const domMid  = slice.reduce((a, b) => a + b.midEnergy,  0) / slice.length;
    const domHigh = slice.reduce((a, b) => a + b.highEnergy, 0) / slice.length;

    sections.push({
      id:               `section-${idx}`,
      type,
      label:            `${type.charAt(0).toUpperCase() + type.slice(1)} ${
        sections.filter(s => s.type === type).length + 1
      }`,
      startBar:         sectionStart,
      endBar:           endBar - 1,
      startTime:        bars[sectionStart].startTime,
      endTime:          bars[endBar - 1].endTime,
      barCount,
      averageEnergy:    avgEnergy,
      dominantFrequency: domBass > domMid && domBass > domHigh ? "bass"
                       : domMid  > domHigh                     ? "mid"  : "high",
      colorHex:         SECTIONCOLORS[type],
    });
    sectionStart = endBar;
  };

  // Segment on energy transitions (every 4–8 bars)
  for (let i = 1; i < bars.length; i++) {
    const barsSinceStart = i - sectionStart;
    const energyJump     = Math.abs(bars[i].energyScore - bars[i - 1].energyScore) > 0.30;
    const levelChange    = bars[i].energyLevel !== prevLevel;
    const naturalBoundary= barsSinceStart >= 4 && barsSinceStart % 4 === 0;

    if ((energyJump && barsSinceStart >= 2) || (levelChange && naturalBoundary)) {
      flush(i);
    }
    if (barsSinceStart >= 8) flush(i);

    prevLevel = bars[i].energyLevel;
  }
  flush(bars.length);

  return sections;
}

// ── Main Exported Function ───────────────────────────────────

export async function analyzeAudioFile(
  file:           File,
  onProgress?:    (progress: number, stage: string) => void
): Promise<BeatBlueprint> {

  const report = (p: number, s: string) => onProgress?.(p, s);

  report(5, "فك تشفير الملف الصوتي...");
  const audioContext  = new AudioContext();
  const arrayBuffer   = await file.arrayBuffer();

  report(20, "تحليل البنية الطيفية...");
  const audioBuffer   = await audioContext.decodeAudioData(arrayBuffer);
  const channelData   = audioBuffer.getChannelData(0);
  const sampleRate    = audioBuffer.sampleRate;
  const duration      = audioBuffer.duration;

  report(35, "كشف السرعة الإيقاعية BPM...");
  const { bpm, stability } = detectBPM(channelData, sampleRate);
  const secondsPerBeat     = 60 / bpm;
  const secondsPerBar      = secondsPerBeat * 4;
  const totalBars          = Math.floor(duration / secondsPerBar);
  const gridResolution     = Math.round(secondsPerBeat * 250); // ms per 16th

  report(50, "رصد مواضع الكيك والسنير...");
  const onsets = detectOnsets(audioBuffer, bpm, sampleRate);

  report(65, "تحليل الطيف الترددي لكل بار...");
  const spectral  = analyzeSpectralPerBar(audioBuffer, totalBars, secondsPerBar);

  report(75, "بناء خريطة البارات...");
  const bars      = buildBars(totalBars, secondsPerBar, onsets, spectral);

  report(85, "كشف أقسام البيت...");
  const sections  = detectStructure(bars);

  report(93, "هندسة جيوب القافية...");
  const allSlots  = bars.flatMap(b => b.rhymeSlots);

  const dominantRange = (() => {
    const avgBass = spectral.bassProfile.reduce((a, b) => a + b, 0) / totalBars;
    const avgMid  = spectral.midProfile.reduce( (a, b) => a + b, 0) / totalBars;
    const avgHigh = spectral.highProfile.reduce((a, b) => a + b, 0) / totalBars;
    if (avgBass > avgMid && avgBass > avgHigh) return "bass-heavy";
    if (avgMid  > avgHigh)                     return "mid-focused";
    if (avgHigh > avgBass * 1.5)               return "high-sharp";
    return "balanced";
  })();

  // Recommended flow style based on BPM & swing
  const recommendedFlow = bpm >= 140 ? "syncopated"
                        : bpm >= 110 ? "off-beat"
                        : bpm >= 85  ? "on-beat"
                        : "triplet";

  report(100, "اكتمل التحليل.");
  await audioContext.close();

  return {
    metadata: {
      filename:       file.name,
      durationSeconds: duration,
      totalBars,
      analyzedAt:     Date.now(),
    },
    tempo: {
      bpm,
      bpmStability:    stability,
      timeSignature:   "4/4",
      secondsPerBar,
      secondsPerBeat,
      gridResolution,
    },
    spectral: {
      ...spectral,
      dominantRange,
    },
    rhythm: {
      bars,
      kickPositions:  onsets.filter(o => o.type === "kick"),
      snarePositions: onsets.filter(o => o.type === "snare"),
      hihatPositions: onsets.filter(o => o.type === "hihat"),
      swingFactor:    clamp(1 - stability),
    },
    structure: {
      sections,
      totalSections:  sections.length,
      hasIntro:       sections.some(s => s.type === "intro"),
      hasOutro:       sections.some(s => s.type === "outro"),
    },
    rhymeArchitecture: {
      allSlots,
      primaryLanding: allSlots.filter(s => s.slotType === "landing" && s.confidence > 0.8),
      breathPoints:   allSlots.filter(s => s.slotType === "breath"),
      pocketZones:    allSlots.filter(s => s.slotType === "pocket"),
      recommendedFlow,
    },
  };
}
