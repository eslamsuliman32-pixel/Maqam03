// ═══════════════════════════════════════════════════════════════
//  MAQAM — Core Audio Analysis Engine v4.0 (Real DSP)
//  المحرك الأساسي للتحليل الصوتي — تحليل ترددي حقيقي عبر FFT/STFT
//
//  v4.0 يستبدل التقطيع الزمني الزائف بتحويل فورييه سريع حقيقي:
//   • فصل ترددي فعلي للنطاقات (كيك/سنير/هاي-هات)
//   • كشف الإيقاع عبر التدفق الطيفي (spectral flux)
//   • كشف BPM عبر الارتباط الذاتي لمظروف الطاقة الإيقاعية
//   • شكل موجي حقيقي مستخرج من العيّنات الصوتية
// ═══════════════════════════════════════════════════════════════

import type {
  BeatBlueprint, Bar, OnsetEvent, RhymeSlot,
  SongSection, SectionType, EnergyLevel
} from "../types/audio.types";

export type { BeatBlueprint };
export type CompleteAudioAnalysis = BeatBlueprint;

// ── Constants ────────────────────────────────────────────────
const ANALYSIS_RATE = 32000;   // معدل عيّنات التحليل (Nyquist 16kHz يغطي الهاي-هات)
const FFT_SIZE       = 2048;   // دقة ترددية ≈ 15.6Hz/bin
const HOP_SIZE       = 640;    // مظروف بمعدل 50 إطار/ثانية
const MIN_BPM        = 60;
const MAX_BPM        = 200;
const MIN_ONSET_GAP  = 0.07;   // أدنى فاصل بين الـ onsets (ثانية)
const WAVE_BUCKETS   = 1400;   // عدد نقاط الشكل الموجي

// نطاقات ترددية حقيقية (Hz) لتصنيف أدوات الإيقاع
const BANDS = {
  sub:     [30, 100],     // أساس الكيك
  bass:    [100, 250],    // جسم الكيك / الباس
  lowMid:  [250, 800],
  mid:     [800, 2500],   // جسم السنير / الصوت
  highMid: [2500, 6000],  // طقطقة السنير / الحضور
  high:    [6000, 14000], // الهاي-هات / الصنوج
} as const;

type BandName = keyof typeof BANDS;

// ── Utilities ────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

function normalize(arr: number[]): number[] {
  const max = Math.max(...arr, 1e-9);
  return arr.map(v => v / max);
}

function mean(arr: number[] | Float32Array): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return arr.length ? s / arr.length : 0;
}

function std(arr: number[], m: number): number {
  if (arr.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < arr.length; i++) { const d = arr[i] - m; s += d * d; }
  return Math.sqrt(s / arr.length);
}

function energyToLevel(score: number): EnergyLevel {
  if (score >= 0.80) return "peak";
  if (score >= 0.55) return "high";
  if (score >= 0.30) return "mid";
  return "low";
}

// ── Real Radix-2 Iterative FFT ───────────────────────────────
// تحويل فورييه سريع في المكان (in-place). re/im طولهما N = قوة لـ 2.

function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;

  // ترتيب عكس البِتّات (bit reversal)
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }

  // الفراشات (butterflies)
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wLenRe = Math.cos(ang);
    const wLenIm = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let wRe = 1, wIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i + k];
        const aIm = im[i + k];
        const bRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
        const bIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
        re[i + k] = aRe + bRe;
        im[i + k] = aIm + bIm;
        re[i + k + half] = aRe - bRe;
        im[i + k + half] = aIm - bIm;
        const nwRe = wRe * wLenRe - wIm * wLenIm;
        wIm = wRe * wLenIm + wIm * wLenRe;
        wRe = nwRe;
      }
    }
  }
}

// نافذة Hann (لتقليل التسرّب الطيفي)
function makeHannWindow(size: number): Float32Array {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return w;
}

// تحويل حدود النطاق (Hz) إلى مدى bins
function bandBins(rate: number, fftSize: number, lo: number, hi: number) {
  const binHz = rate / fftSize;
  return {
    min: Math.max(1, Math.floor(lo / binHz)),
    max: Math.min(fftSize / 2 - 1, Math.ceil(hi / binHz)),
  };
}

// ── Decode + Resample to mono analysis buffer ────────────────

async function decodeAndPrepare(file: File): Promise<{
  origMono: Float32Array;
  origRate: number;
  duration: number;
  analysis: Float32Array;
}> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const duration = audioBuffer.duration;
  const origRate = audioBuffer.sampleRate;

  // مزج لقناة واحدة (mono) للشكل الموجي الأصلي
  const chCount = audioBuffer.numberOfChannels;
  const len = audioBuffer.length;
  const origMono = new Float32Array(len);
  for (let ch = 0; ch < chCount; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < len; i++) origMono[i] += data[i] / chCount;
  }

  // إعادة أخذ العيّنات إلى ANALYSIS_RATE عبر OfflineAudioContext
  const targetLen = Math.ceil(duration * ANALYSIS_RATE);
  const offline = new OfflineAudioContext(1, targetLen, ANALYSIS_RATE);
  const src = offline.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  const analysis = rendered.getChannelData(0).slice();

  await audioContext.close();
  return { origMono, origRate, duration, analysis };
}

// ── STFT: per-frame band energies + spectral flux ────────────

interface STFTResult {
  frameTimes:  number[];                       // وقت كل إطار (ثانية)
  bandEnergy:  Record<BandName, number[]>;      // طاقة كل نطاق لكل إطار
  bandFlux:    Record<BandName, number[]>;      // تدفق إيجابي لكل نطاق
  totalFlux:   number[];                        // التدفق الطيفي الكلي
  rms:         number[];                        // RMS لكل إطار
  fps:         number;                          // إطارات/ثانية للمظروف
}

async function computeSTFT(
  signal: Float32Array,
  onProgress?: (p: number) => void,
): Promise<STFTResult> {
  const window = makeHannWindow(FFT_SIZE);
  const frameCount = Math.max(1, Math.floor((signal.length - FFT_SIZE) / HOP_SIZE));
  const fps = ANALYSIS_RATE / HOP_SIZE;

  const bandRanges = Object.fromEntries(
    (Object.keys(BANDS) as BandName[]).map(name => [
      name,
      bandBins(ANALYSIS_RATE, FFT_SIZE, BANDS[name][0], BANDS[name][1]),
    ])
  ) as Record<BandName, { min: number; max: number }>;

  const bandEnergy = Object.fromEntries(
    (Object.keys(BANDS) as BandName[]).map(n => [n, [] as number[]])
  ) as Record<BandName, number[]>;
  const bandFlux = Object.fromEntries(
    (Object.keys(BANDS) as BandName[]).map(n => [n, [] as number[]])
  ) as Record<BandName, number[]>;
  const totalFlux: number[] = [];
  const rms: number[] = [];
  const frameTimes: number[] = [];

  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const prevMag = new Float32Array(FFT_SIZE / 2);
  const prevBand = Object.fromEntries(
    (Object.keys(BANDS) as BandName[]).map(n => [n, 0])
  ) as Record<BandName, number>;

  for (let f = 0; f < frameCount; f++) {
    const start = f * HOP_SIZE;

    // تطبيق النافذة + حساب RMS
    let sumSq = 0;
    for (let i = 0; i < FFT_SIZE; i++) {
      const s = signal[start + i] || 0;
      sumSq += s * s;
      re[i] = s * window[i];
      im[i] = 0;
    }
    rms.push(Math.sqrt(sumSq / FFT_SIZE));
    frameTimes.push(start / ANALYSIS_RATE);

    fft(re, im);

    // مقادير الطيف + تدفق كلي
    let flux = 0;
    for (let b = 0; b < FFT_SIZE / 2; b++) {
      const mag = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
      const diff = mag - prevMag[b];
      if (diff > 0) flux += diff;
      prevMag[b] = mag;
      // نخزّن المقدار مؤقتًا في re لإعادة استخدامه في طاقة النطاق
      re[b] = mag;
    }
    totalFlux.push(flux);

    // طاقة + تدفق كل نطاق
    for (const name of Object.keys(BANDS) as BandName[]) {
      const { min, max } = bandRanges[name];
      let e = 0;
      for (let b = min; b <= max; b++) e += re[b]; // re[b] = المقدار الآن
      e /= (max - min + 1);
      bandEnergy[name].push(e);
      const d = e - prevBand[name];
      bandFlux[name].push(d > 0 ? d : 0);
      prevBand[name] = e;
    }

    // إفساح المجال للواجهة + تقرير التقدم كل فترة
    if (onProgress && (f & 1023) === 0) {
      onProgress(f / frameCount);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  return { frameTimes, bandEnergy, bandFlux, totalFlux, rms, fps };
}

// ── BPM via autocorrelation of the onset-strength envelope ───

function detectBPM(stft: STFTResult): { bpm: number; stability: number } {
  const env = stft.totalFlux;
  const fps = stft.fps;
  const n = env.length;
  if (n < 8) return { bpm: 90, stability: 0 };

  // إزالة المتوسط
  const m = mean(env);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = Math.max(0, env[i] - m);

  const minLag = Math.floor((60 / MAX_BPM) * fps);
  const maxLag = Math.min(n - 1, Math.floor((60 / MIN_BPM) * fps));

  // الارتباط الذاتي الخام
  const ac: number[] = new Array(maxLag * 3 + 2).fill(0);
  const acMaxLag = Math.min(n - 1, maxLag * 3);
  for (let lag = minLag; lag <= acMaxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += x[i] * x[i + lag];
    ac[lag] = sum / (n - lag);
  }

  // الارتباط الذاتي المعزّز بالتوافقيات (يدعم الأساس فوق مضاعفاته)
  // eac[lag] = ac[lag] + ½·ac[2·lag] + ⅓·ac[3·lag]
  let bestLag = minLag;
  let bestVal = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const eac = ac[lag] + 0.5 * (ac[2 * lag] || 0) + 0.33 * (ac[3 * lag] || 0);
    if (eac > bestVal) { bestVal = eac; bestLag = lag; }
  }

  let bpm = (60 * fps) / bestLag;
  while (bpm < 70) bpm *= 2;
  while (bpm > 160) bpm /= 2;

  const acAvg = mean(ac.filter(v => v > 0)) || 1;
  const stability = clamp(ac[bestLag] / (acAvg * 3));

  return {
    bpm: Math.round(bpm * 10) / 10,
    stability: Math.round(stability * 100) / 100,
  };
}

// ── Onset detection + drum classification (real bands) ───────

function detectOnsets(
  stft: STFTResult,
  bpm: number,
): OnsetEvent[] {
  const { totalFlux, bandEnergy, frameTimes, fps } = stft;
  const n = totalFlux.length;
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * 4;

  // مظروف منعّم + عتبة تكيّفية محلية
  const win = Math.max(3, Math.floor(fps * 0.1)); // ±100ms
  const onsets: OnsetEvent[] = [];
  let lastOnset = -Infinity;

  // تطبيع التدفق الكلي
  const fMax = Math.max(...totalFlux, 1e-9);
  const flux = totalFlux.map(v => v / fMax);

  for (let i = 1; i < n - 1; i++) {
    const lo = Math.max(0, i - win);
    const hi = Math.min(n, i + win);
    const localSlice = flux.slice(lo, hi);
    const lm = mean(localSlice);
    const ls = std(localSlice, lm);
    const threshold = lm + 1.5 * ls + 0.03;

    const isPeak = flux[i] > flux[i - 1] && flux[i] >= flux[i + 1];
    const t = frameTimes[i];

    if (isPeak && flux[i] > threshold && t - lastOnset >= MIN_ONSET_GAP) {
      lastOnset = t;

      // تصنيف الأداة عبر توزيع الطاقة الطيفي الفعلي عند لحظة الضربة
      const lowE  = bandEnergy.sub[i] + bandEnergy.bass[i];
      const midE  = bandEnergy.lowMid[i] + bandEnergy.mid[i] + bandEnergy.highMid[i];
      const highE = bandEnergy.high[i];
      const tot   = lowE + midE + highE + 1e-9;
      const lowRatio  = lowE / tot;
      const highRatio = highE / tot;

      let type: OnsetEvent["type"];
      if (lowRatio > 0.42) {
        type = "kick";                                   // هيمنة الترددات المنخفضة
      } else if (highRatio > 0.38 && lowRatio < 0.25) {
        type = "hihat";                                  // ترددات عالية مع باس ضعيف
      } else {
        type = "snare";                                  // طيف عريض / متوسط
      }

      const barIndex = Math.floor(t / secondsPerBar);
      const beatInBar = (t % secondsPerBar) / secondsPerBeat;
      const beatIndex = clamp(Math.floor(beatInBar) + 1, 1, 4);
      const subdivIndex = clamp(Math.round((beatInBar % 1) * 4), 0, 3);

      onsets.push({
        timeSeconds: t,
        barIndex,
        beatIndex: beatIndex as any,
        subdivisionIndex: subdivIndex,
        strength: clamp(flux[i]),
        type,
      });
    }
  }

  return onsets;
}

// ── Per-bar spectral aggregation (real band energies) ────────

function analyzeSpectralPerBar(
  stft: STFTResult,
  totalBars: number,
  secondsPerBar: number,
): { bassProfile: number[]; midProfile: number[]; highProfile: number[]; energyCurve: number[] } {
  const bassProfile = new Array(totalBars).fill(0);
  const midProfile  = new Array(totalBars).fill(0);
  const highProfile = new Array(totalBars).fill(0);
  const energyCurve = new Array(totalBars).fill(0);
  const counts      = new Array(totalBars).fill(0);

  const { frameTimes, bandEnergy, rms } = stft;

  for (let i = 0; i < frameTimes.length; i++) {
    const bar = Math.floor(frameTimes[i] / secondsPerBar);
    if (bar < 0 || bar >= totalBars) continue;
    bassProfile[bar] += bandEnergy.sub[i] + bandEnergy.bass[i];
    midProfile[bar]  += bandEnergy.lowMid[i] + bandEnergy.mid[i];
    highProfile[bar] += bandEnergy.highMid[i] + bandEnergy.high[i];
    energyCurve[bar] += rms[i];
    counts[bar]++;
  }

  for (let b = 0; b < totalBars; b++) {
    const c = Math.max(1, counts[b]);
    bassProfile[b] /= c;
    midProfile[b]  /= c;
    highProfile[b] /= c;
    energyCurve[b] /= c;
  }

  return {
    bassProfile: normalize(bassProfile),
    midProfile:  normalize(midProfile),
    highProfile: normalize(highProfile),
    energyCurve: normalize(energyCurve),
  };
}

// ── Real waveform peaks from original samples ────────────────

function computeWaveform(
  origMono: Float32Array,
  buckets: number,
): { peaks: number[]; rmsCurve: number[] } {
  const peaks: number[] = [];
  const rmsCurve: number[] = [];
  const bucketSize = Math.max(1, Math.floor(origMono.length / buckets));

  for (let b = 0; b < buckets; b++) {
    const start = b * bucketSize;
    const end = Math.min(start + bucketSize, origMono.length);
    let peak = 0;
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      const a = Math.abs(origMono[i]);
      if (a > peak) peak = a;
      sumSq += origMono[i] * origMono[i];
    }
    peaks.push(peak);
    rmsCurve.push(Math.sqrt(sumSq / Math.max(1, end - start)));
    if (start >= origMono.length) break;
  }

  return { peaks: normalize(peaks), rmsCurve: normalize(rmsCurve) };
}

// ── Rhyme Slot Generator ─────────────────────────────────────

function generateRhymeSlots(
  onsets: OnsetEvent[],
  barIndex: number,
  secondsPerBar: number,
  energyScore: number,
): RhymeSlot[] {
  const slots: RhymeSlot[] = [];
  const secondsPerBeat = secondsPerBar / 4;

  const landingBeats = [2, 4];
  landingBeats.forEach(beat => {
    const time = barIndex * secondsPerBar + (beat - 1) * secondsPerBeat;
    const nearSnare = onsets.some(
      o => o.type === "snare" && Math.abs(o.timeSeconds - time) < 0.08
    );
    slots.push({
      barIndex,
      beatPosition: beat,
      timeSeconds: time,
      slotType: nearSnare ? "landing" : "pocket",
      confidence: nearSnare ? 0.92 : 0.65,
      suggestedSyllableCount: Math.round(4 + energyScore * 4),
    });
  });

  slots.push({
    barIndex,
    beatPosition: 4.5,
    timeSeconds: barIndex * secondsPerBar + 3.5 * secondsPerBeat,
    slotType: "breath",
    confidence: 0.75,
    suggestedSyllableCount: 0,
  });

  onsets
    .filter(o => o.type === "kick" && o.beatIndex <= 3)
    .slice(0, 2)
    .forEach(kick => {
      slots.push({
        barIndex,
        beatPosition: kick.beatIndex + 0.5,
        timeSeconds: kick.timeSeconds + secondsPerBeat * 0.5,
        slotType: "ghost",
        confidence: 0.50,
        suggestedSyllableCount: 2,
      });
    });

  return slots.sort((a, b) => a.beatPosition - b.beatPosition);
}

// ── Bar Builder ──────────────────────────────────────────────

function buildBars(
  totalBars: number,
  secondsPerBar: number,
  onsets: OnsetEvent[],
  spectral: ReturnType<typeof analyzeSpectralPerBar>,
): Bar[] {
  const avgEnergy = spectral.energyCurve.reduce((a, b) => a + b, 0) / Math.max(1, totalBars);

  return Array.from({ length: totalBars }, (_, i) => {
    const barOnsets = onsets.filter(o => o.barIndex === i);
    const energyScore = spectral.energyCurve[i] ?? 0;
    const bassE = spectral.bassProfile[i] ?? 0;
    const midE = spectral.midProfile[i] ?? 0;
    const highE = spectral.highProfile[i] ?? 0;

    const hasSilence = energyScore < avgEnergy * 0.25;
    const silenceRatio = hasSilence ? clamp(1 - energyScore / (avgEnergy * 0.25)) : 0;
    const rhymeSlots = generateRhymeSlots(barOnsets, i, secondsPerBar, energyScore);

    return {
      index: i,
      startTime: i * secondsPerBar,
      endTime: (i + 1) * secondsPerBar,
      durationSeconds: secondsPerBar,
      onsets: barOnsets,
      energyLevel: energyToLevel(energyScore),
      energyScore,
      bassEnergy: bassE,
      midEnergy: midE,
      highEnergy: highE,
      hasSilence,
      silenceRatio,
      rhymeSlots,
    };
  });
}

// ── Structure Detector ───────────────────────────────────────

const SECTION_COLORS: Record<SectionType, string> = {
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
  let prevLevel = bars[0].energyLevel;

  const flush = (endBar: number) => {
    if (endBar <= sectionStart) return;
    const slice = bars.slice(sectionStart, endBar);
    const avgEnergy = slice.reduce((a, b) => a + b.energyScore, 0) / slice.length;
    const barCount = endBar - sectionStart;

    let type: SectionType;
    const idx = sections.length;
    if (idx === 0 && barCount <= 4)                        type = "intro";
    else if (avgEnergy >= 0.75)                            type = "chorus";
    else if (avgEnergy >= 0.55)                            type = "hook";
    else if (avgEnergy >= 0.25)                            type = "verse";
    else                                                   type = "bridge";

    const domBass = slice.reduce((a, b) => a + b.bassEnergy, 0) / slice.length;
    const domMid  = slice.reduce((a, b) => a + b.midEnergy, 0) / slice.length;
    const domHigh = slice.reduce((a, b) => a + b.highEnergy, 0) / slice.length;

    sections.push({
      id: `section-${idx}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${
        sections.filter(s => s.type === type).length + 1
      }`,
      startBar: sectionStart,
      endBar: endBar - 1,
      startTime: bars[sectionStart].startTime,
      endTime: bars[endBar - 1].endTime,
      barCount,
      averageEnergy: avgEnergy,
      dominantFrequency: domBass > domMid && domBass > domHigh ? "bass"
                       : domMid > domHigh                      ? "mid" : "high",
      colorHex: SECTION_COLORS[type],
    });
    sectionStart = endBar;
  };

  for (let i = 1; i < bars.length; i++) {
    const barsSinceStart = i - sectionStart;
    const energyJump = Math.abs(bars[i].energyScore - bars[i - 1].energyScore) > 0.30;
    const levelChange = bars[i].energyLevel !== prevLevel;
    const naturalBoundary = barsSinceStart >= 4 && barsSinceStart % 4 === 0;

    if ((energyJump && barsSinceStart >= 2) || (levelChange && naturalBoundary)) {
      flush(i);
    }
    if (barsSinceStart >= 8) flush(i);

    prevLevel = bars[i].energyLevel;
  }
  flush(bars.length);

  // إعادة تصنيف القسم الأخير كـ outro إن كان قصيرًا ومنخفض الطاقة
  if (sections.length > 1) {
    const last = sections[sections.length - 1];
    if (last.barCount <= 4 && last.averageEnergy < 0.4) {
      last.type = "outro";
      last.colorHex = SECTION_COLORS.outro;
      last.label = "Outro 1";
    }
  }

  return sections;
}

// ── Main Exported Function ───────────────────────────────────

export async function analyzeAudioFile(
  file: File,
  onProgress?: (progress: number, stage: string) => void,
): Promise<BeatBlueprint> {

  const report = (p: number, s: string) => onProgress?.(p, s);

  report(5, "فك تشفير الملف الصوتي...");
  const { origMono, duration, analysis } = await decodeAndPrepare(file);

  report(15, "تحليل الطيف الترددي (FFT)...");
  const stft = await computeSTFT(analysis, (p) => {
    report(15 + Math.round(p * 45), "تحليل الطيف الترددي (FFT)...");
  });

  report(62, "كشف السرعة الإيقاعية BPM...");
  const { bpm, stability } = detectBPM(stft);
  const secondsPerBeat = 60 / bpm;
  const secondsPerBar = secondsPerBeat * 4;
  const totalBars = Math.max(1, Math.floor(duration / secondsPerBar));
  const gridResolution = Math.round(secondsPerBeat * 250);

  report(70, "رصد مواضع الكيك والسنير...");
  const onsets = detectOnsets(stft, bpm);

  report(78, "تحليل الطيف الترددي لكل بار...");
  const spectral = analyzeSpectralPerBar(stft, totalBars, secondsPerBar);

  report(84, "بناء خريطة البارات...");
  const bars = buildBars(totalBars, secondsPerBar, onsets, spectral);

  report(89, "كشف أقسام البيت...");
  const sections = detectStructure(bars);

  report(93, "استخراج الشكل الموجي...");
  const waveform = computeWaveform(origMono, WAVE_BUCKETS);

  report(96, "هندسة جيوب القافية...");
  const allSlots = bars.flatMap(b => b.rhymeSlots);

  const dominantRange = (() => {
    const avgBass = spectral.bassProfile.reduce((a, b) => a + b, 0) / totalBars;
    const avgMid  = spectral.midProfile.reduce((a, b) => a + b, 0) / totalBars;
    const avgHigh = spectral.highProfile.reduce((a, b) => a + b, 0) / totalBars;
    if (avgBass > avgMid && avgBass > avgHigh) return "bass-heavy";
    if (avgMid > avgHigh)                       return "mid-focused";
    if (avgHigh > avgBass * 1.5)                return "high-sharp";
    return "balanced";
  })();

  const recommendedFlow = bpm >= 140 ? "syncopated"
                        : bpm >= 110 ? "off-beat"
                        : bpm >= 85  ? "on-beat"
                        : "triplet";

  report(100, "اكتمل التحليل.");

  return {
    metadata: {
      filename: file.name,
      durationSeconds: duration,
      totalBars,
      analyzedAt: Date.now(),
    },
    tempo: {
      bpm,
      bpmStability: stability,
      timeSignature: "4/4",
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
      kickPositions: onsets.filter(o => o.type === "kick"),
      snarePositions: onsets.filter(o => o.type === "snare"),
      hihatPositions: onsets.filter(o => o.type === "hihat"),
      swingFactor: clamp(1 - stability),
    },
    structure: {
      sections,
      totalSections: sections.length,
      hasIntro: sections.some(s => s.type === "intro"),
      hasOutro: sections.some(s => s.type === "outro"),
    },
    rhymeArchitecture: {
      allSlots,
      primaryLanding: allSlots.filter(s => s.slotType === "landing" && s.confidence > 0.8),
      breathPoints: allSlots.filter(s => s.slotType === "breath"),
      pocketZones: allSlots.filter(s => s.slotType === "pocket"),
      recommendedFlow,
    },
    waveform,
  };
}
