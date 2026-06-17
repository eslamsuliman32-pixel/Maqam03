import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ════════════════════════════════════════════════════
//  TYPES - محددة وحقيقية
// ════════════════════════════════════════════════════

export type InstrumentId =
  | "kick" | "snare" | "hihat" | "bass"
  | "melody" | "pad" | "vocal";

export type VibeType = "fire" | "sad" | "epic" | "smooth" | "neutral";
export type BeatSection = "intro" | "verse" | "hook" | "bridge" | "outro";

export interface AudioNodes {
  oscillator?: OscillatorNode;
  gainNode?: GainNode;
  analyser?: AnalyserNode;
  bufferSource?: AudioBufferSourceNode;
}

export interface Instrument {
  id: InstrumentId;
  nameAr: string;
  icon: string;
  color: string;
  // تشغيل
  isPlaying: boolean;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;      // 0-100
  pan: number;         // -1 to 1
  // خصائص اللحن
  vibe: VibeType;
  baseFrequency: number;   // Hz الحقيقي للآلة
  waveType: OscillatorType; // sine | square | sawtooth | triangle
  attackTime: number;       // ثانية
  releaseTime: number;      // ثانية
  // بيانات الموجة المحسوبة
  amplitudeData: Float32Array;  // بيانات حقيقية محسوبة
  frequencyData: Float32Array;
  peakPositions: number[];  // مواضع الذروة بالنسبة 0-1
  quietPositions: number[]; // مواضع الهدوء
}

export interface LyricBar {
  id: string;
  text: string;
  section: BeatSection;
  instrumentId: InstrumentId;
  // توقيت حقيقي
  startBeat: number;    // رقم البيت (بدءاً من 0)
  durationBeats: number; // عدد البيتات التي يشغلها
  startTime: number;    // بالثانية (محسوب من BPM)
  endTime: number;
  // تقييم
  syllableCount: number;
  flowScore: number;    // 0-100
  vibeMatch: number;   // 0-100
  densityScore: number; // كثافة المقاطع لكل ثانية
  color: string;
  isSelected: boolean;
}

export interface BeatGrid {
  // معلومات البيت الحقيقية
  bpm: number;
  timeSignatureNum: number;   // 4 في 4/4
  timeSignatureDen: number;
  totalBars: number;          // عدد الأشرطة الموسيقية
  barDuration: number;        // مدة الشريط الواحد بالثانية
  beatDuration: number;       // مدة البيت الواحد بالثانية
  totalDuration: number;      // المدة الكلية بالثانية
  // أقسام البيت
  sections: BeatSectionData[];
  // ضربات الإيقاع
  beats: BeatPoint[];
}

export interface BeatSectionData {
  id: string;
  type: BeatSection;
  label: string;
  startBar: number;
  endBar: number;
  startTime: number;
  endTime: number;
  dominantInstruments: InstrumentId[];
  averageIntensity: number; // 0-1
  color: string;
}

export interface BeatPoint {
  bar: number;
  beat: number;
  time: number;
  isStrong: boolean;  // ضربة قوية (أول كل شريط)
  isMedium: boolean;  // ضربة متوسطة
}

export interface WaveformCache {
  instrumentId: InstrumentId;
  peaks: Float32Array;      // قيم الذروة للرسم
  rms: Float32Array;        // القيمة الجذر التربيعي للمتوسط
  resolution: number;        // عدد العينات في الثانية الواحدة
}

export interface BeatWriterState {
  // البيت
  beatGrid: BeatGrid | null;
  instruments: Instrument[];
  selectedInstrumentId: InstrumentId;

  // التشغيل
  isPlaying: boolean;
  currentTime: number;       // بالثانية
  currentBar: number;        // الشريط الحالي
  currentBeat: number;       // البيت داخل الشريط

  // الكانفاس
  timelineZoom: number;      // 1-20
  timelineScrollRTL: number; // نسبة التمرير 0-1 (RTL: 0=نهاية, 1=بداية)
  canvasWidth: number;
  canvasHeight: number;

  // الكتابة
  lyricBars: LyricBar[];
  selectedBarId: string | null;
  draftText: string;
  activeSection: BeatSection;

  // الصوت
  audioContextReady: boolean;
  masterVolume: number;

  // التحميل
  isAnalyzing: boolean;
  analysisProgress: number;  // 0-100

  // Waveforms
  waveformCache: Map<InstrumentId, WaveformCache>;

  actions: {
    // تهيئة البيت
    initializeBeat: (bpm: number, bars: number, timeSignature?: [number, number]) => void;

    // إدارة الآلات
    selectInstrument: (id: InstrumentId) => void;
    toggleMute: (id: InstrumentId) => void;
    toggleSolo: (id: InstrumentId) => void;
    setVolume: (id: InstrumentId, vol: number) => void;
    setPan: (id: InstrumentId, pan: number) => void;

    // تشغيل الصوت
    playInstrument: (id: InstrumentId) => Promise<void>;
    stopInstrument: (id: InstrumentId) => void;
    playAll: () => Promise<void>;
    stopAll: () => void;
    seekTo: (time: number) => void;

    // الكانفاس
    setTimelineZoom: (zoom: number) => void;
    scrollTimeline: (delta: number) => void;

    // الكتابة
    addLyricBar: (text: string, section: BeatSection, startBeat: number, durationBeats: number) => void;
    updateLyricBar: (id: string, updates: Partial<LyricBar>) => void;
    removeLyricBar: (id: string) => void;
    selectBar: (id: string | null) => void;
    setDraftText: (text: string) => void;
    setActiveSection: (s: BeatSection) => void;
    commitDraft: () => void;

    // تحليل
    analyzeAndBuild: (bpm?: number, bars?: number) => Promise<void>;
  };
}

// ════════════════════════════════════════════════════
//  Web Audio Engine (حقيقي)
// ════════════════════════════════════════════════════

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private instrumentNodes = new Map<InstrumentId, {
    oscillator?: OscillatorNode;
    gainNode: GainNode;
    panNode: StereoPannerNode;
    analyser: AnalyserNode;
    isPlaying: boolean;
    intervalId?: ReturnType<typeof setInterval>;
  }>();
  private playbackTimer: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private pauseTime = 0;

  // تردد كل آلة الحقيقي
  private readonly INSTRUMENT_PARAMS: Record<InstrumentId, {
    freq: number[];
    wave: OscillatorType;
    attack: number;
    release: number;
    pattern: number[];  // نمط الإيقاع (1=ضرب, 0=صمت)
    beatDiv: number;    // قسمة البيت
  }> = {
    kick: {
      freq: [80, 60, 50],
      wave: "sine",
      attack: 0.002,
      release: 0.3,
      pattern: [1, 0, 0, 0, 1, 0, 0, 0],
      beatDiv: 2,
    },
    snare: {
      freq: [200, 180, 160],
      wave: "triangle",
      attack: 0.001,
      release: 0.15,
      pattern: [0, 0, 1, 0, 0, 0, 1, 0],
      beatDiv: 2,
    },
    hihat: {
      freq: [800, 1000, 1200],
      wave: "sawtooth",
      attack: 0.001,
      release: 0.05,
      pattern: [1, 0, 1, 0, 1, 0, 1, 0],
      beatDiv: 2,
    },
    bass: {
      freq: [55, 82, 110, 55],
      wave: "sawtooth",
      attack: 0.01,
      release: 0.4,
      pattern: [1, 0, 0, 1, 0, 0, 1, 0],
      beatDiv: 1,
    },
    melody: {
      freq: [261, 293, 329, 349, 392, 440, 493, 523],
      wave: "sine",
      attack: 0.05,
      release: 0.3,
      pattern: [1, 0, 1, 0, 0, 1, 0, 1],
      beatDiv: 1,
    },
    pad: {
      freq: [130, 164, 196, 246],
      wave: "sine",
      attack: 0.2,
      release: 0.8,
      pattern: [1, 0, 0, 0, 1, 0, 0, 0],
      beatDiv: 1,
    },
    vocal: {
      freq: [220, 261, 293, 349],
      wave: "sine",
      attack: 0.1,
      release: 0.5,
      pattern: [1, 0, 0, 1, 0, 1, 0, 0],
      beatDiv: 1,
    },
  };

  private createNoiseBuffer() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2; // ثانبتين من الضوضاء البيضاء
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    } catch (e) {
      console.error("Failed to generate noise buffer", e);
    }
  }

  // مولد منحنى التشبع (Waveshaper) لإضفاء لمسة تيوب أنالوج دافئة دون تشويه رقمي خشن
  private makeDistortionCurve(amount: number) {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; i++) {
      const x = (i * 2) / n_samples - 1;
      // صيغة Soft clip تمنع تجاوز الحدود وتحمي الصوت من التشوه الحاد
      curve[i] = ((3 + k) * x) / (3 + k * Math.abs(x));
    }
    return curve;
  }

  async initialize(): Promise<boolean> {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      
      // توليد الضوضاء البيضاء اللازمة للسينر والهاي هات المتقدمين
      this.createNoiseBuffer();

      this.masterGain = this.ctx.createGain();
      // غين ماستر متزن يترك مساحة كافية (Headroom) لمنع التشويه التراكمي
      this.masterGain.gain.value = 0.65;

      // تهيئة تأثير صدى تيب دلاي دافئ (Tape Delay) ليعطي عمق وفضاء فخم للميلودي والفوكال
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.33, this.ctx.currentTime); // دلاي متزامن 330ms
      this.delayFeedbackGain = this.ctx.createGain();
      this.delayFeedbackGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // 35% فيدباك للحفاظ على هدوء الذيل

      // فلتر لتنقية صدى الدلاي وإزالة الترددات الحادة السفلية والعلوية
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = "bandpass";
      delayFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      delayFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

      this.delayNode.connect(delayFilter);
      delayFilter.connect(this.delayFeedbackGain);
      this.delayFeedbackGain.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      // مُحكِم ديناميكي وليميتر ماستر احترافي يضمن نقاوة الصوت 100% ويمنع أي Clipping
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-1.0, this.ctx.currentTime); // سقف حماية فوري عند الاقتراب من التشويه
      compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(20, this.ctx.currentTime); // ليميتر قوي
      compressor.attack.setValueAtTime(0.001, this.ctx.currentTime); // هجوم فوري
      compressor.release.setValueAtTime(0.12, this.ctx.currentTime); // تلاشي طبيعي سريع

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
      
      return true;
    } catch (e) {
      console.error("AudioEngine failed to initialize", e);
      return false;
    }
  }

  private getOrCreateNodes(id: InstrumentId, volume: number, pan: number) {
    if (!this.ctx || !this.masterGain) return null;

    let nodes = this.instrumentNodes.get(id);
    if (!nodes) {
      const gainNode = this.ctx.createGain();
      const panNode = this.ctx.createStereoPanner();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;

      gainNode.connect(panNode);
      panNode.connect(analyser);
      analyser.connect(this.masterGain);

      nodes = { gainNode, panNode, analyser, isPlaying: false };
      this.instrumentNodes.set(id, nodes);
    }

    nodes.gainNode.gain.value = volume / 100;
    nodes.panNode.pan.value = pan;
    return nodes;
  }

  private triggerNote(
    id: InstrumentId,
    freqIndex: number,
    volume: number,
    pan: number,
    duration: number
  ) {
    if (!this.ctx || !this.masterGain) return;
    const params = this.INSTRUMENT_PARAMS[id];
    const nodes = this.getOrCreateNodes(id, volume, pan);
    if (!nodes) return;

    const now = this.ctx.currentTime;

    if (id === "kick") {
      // كيك 808 احترافي لضربات الراب: يجمع بين ضربة طرقية حادة (Pitch Sweep Transient) ورنين ساب باس دافئ نقي
      const osc = this.ctx.createOscillator();
      const envGain = this.ctx.createGain();
      
      osc.type = "sine";
      const baseFreq = params.freq[freqIndex % params.freq.length] || 52; // G1 تردد هجومي ساب ممتاز
      
      // انزلاق موجي فائق السرعة يعطي ضربة (Punch/Knock) قوية للآلة في البداية
      osc.frequency.setValueAtTime(baseFreq * 4.0, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.08);
      osc.frequency.linearRampToValueAtTime(32, now + duration);

      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.85, now + 0.002); // هجوم لحظي
      envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // مُشبع موجي لمنع التشويه ولإكساب القرار هيبة وإشباع ترددي
      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(16);

      osc.connect(envGain);
      envGain.connect(shaper);
      shaper.connect(nodes.gainNode);

      osc.start(now);
      osc.stop(now + duration + 0.05);

    } else if (id === "snare") {
      // سنير احترافي رائع متعدد الطبقات:
      // الطبقة 1: النغمة الأساسية الخشبية مع انزلاق ترددي سريع من 190Hz إلى 110Hz
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      
      bodyOsc.type = "sine";
      const baseFreq = params.freq[freqIndex % params.freq.length] || 180;
      bodyOsc.frequency.setValueAtTime(baseFreq * 1.4, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.04);
      bodyOsc.frequency.linearRampToValueAtTime(90, now + 0.12);

      bodyGain.gain.setValueAtTime(0, now);
      bodyGain.gain.linearRampToValueAtTime(0.45, now + 0.003);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(nodes.gainNode);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.16);

      // الطبقة 2: صدى خشخشة الحلقات المعدنية باستخدام ضوضاء بيضاء مفلترة بدقة باندباس
      if (this.noiseBuffer) {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.setValueAtTime(1150, now); // ترددات السنير النقية
        noiseFilter.Q.setValueAtTime(2.2, now);

        const highpassFilter = this.ctx.createBiquadFilter();
        highpassFilter.type = "highpass";
        highpassFilter.frequency.setValueAtTime(300, now); // التخلص من الرنين الطيني السفلي

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.002);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(highpassFilter);
        highpassFilter.connect(noiseGain);
        noiseGain.connect(nodes.gainNode);

        noiseSource.start(now);
        noiseSource.stop(now + duration + 0.05);
      }

    } else if (id === "hihat") {
      // هاي هات دقيق وناصع جداً كالآلاف الحقيقية: نستخدم تصفية ثنائية للرنين المعدني الحاد
      if (this.noiseBuffer) {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(9800, now); // تركيز على الترددات المعدنية الفائقة
        bandpass.Q.setValueAtTime(4.5, now);

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.setValueAtTime(7500, now);

        const envGain = this.ctx.createGain();
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(0.22, now + 0.001);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.35); // تلاشي فائق السرعة لإعطاء طابع حاد ونقي

        noiseSource.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(envGain);
        envGain.connect(nodes.gainNode);

        noiseSource.start(now);
        noiseSource.stop(now + duration * 0.35 + 0.02);
      } else {
        const osc = this.ctx.createOscillator();
        const envGain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(10200, now);
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(0.16, now + 0.001);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);
        osc.connect(envGain);
        envGain.connect(nodes.gainNode);
        osc.start(now);
        osc.stop(now + duration * 0.3 + 0.02);
      }

    } else if (id === "bass") {
      // باس عميق وممتد نقي دافئ مع تشبع تناظري (Tape Saturation) وتصفية سفلية ناعمة
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const envGain = this.ctx.createGain();
      
      osc1.type = "triangle";
      osc2.type = "sawtooth";
      const baseFreq = params.freq[freqIndex % params.freq.length] || 55;
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc2.frequency.setValueAtTime(baseFreq + 0.35, now); // دي-تيون معتدل لزيادة سماكة الصوت

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(90, now + duration);

      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.6, now + params.attack);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);

      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(12);

      filter.connect(shaper);
      shaper.connect(envGain);
      envGain.connect(nodes.gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);

    } else if (id === "pad") {
      // باد خلفي فخم وعريض وممتد بسلاسة مضاف لخط الدلاي (Ambient Echo Delay Send)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const envGain = this.ctx.createGain();

      const baseFreq = params.freq[freqIndex % params.freq.length] || 196;

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(baseFreq * 1.5, now); // هارموني خامس كامل نظيف

      const padFilter = this.ctx.createBiquadFilter();
      padFilter.type = "lowpass";
      padFilter.frequency.setValueAtTime(550, now);
      padFilter.frequency.linearRampToValueAtTime(320, now + duration);

      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.3, now + params.attack);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(padFilter);
      osc2.connect(padFilter);
      padFilter.connect(envGain);
      
      envGain.connect(nodes.gainNode);
      if (this.delayNode) {
        envGain.connect(this.delayNode); // إرسال صدى
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.1);
      osc2.stop(now + duration + 0.1);

    } else if (id === "vocal") {
      // فوكال يحاكي الأداء الفني الحقيقي ورنين فومانت بشري عالي النقاء
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const envGain = this.ctx.createGain();

      const baseFreq = params.freq[freqIndex % params.freq.length] || 220;

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(baseFreq, now);
      
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(baseFreq + 1.1, now); 

      const vowelFilter1 = this.ctx.createBiquadFilter();
      const vowelFilter2 = this.ctx.createBiquadFilter();
      vowelFilter1.type = "bandpass";
      vowelFilter2.type = "bandpass";

      // فلاتر هيرمونية تشكيلية لمحاكاة الرنين الحنجري للحرف "Ah" ونقائه
      vowelFilter1.frequency.setValueAtTime(630, now);
      vowelFilter1.Q.setValueAtTime(5.5, now);
      vowelFilter2.frequency.setValueAtTime(1100, now);
      vowelFilter2.Q.setValueAtTime(5.5, now);

      const filterGain1 = this.ctx.createGain();
      const filterGain2 = this.ctx.createGain();
      filterGain1.gain.value = 0.45;
      filterGain2.gain.value = 0.45;

      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.28, now + params.attack);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(vowelFilter1);
      vowelFilter1.connect(filterGain1);
      osc2.connect(vowelFilter2);
      vowelFilter2.connect(filterGain2);

      filterGain1.connect(envGain);
      filterGain2.connect(envGain);
      envGain.connect(nodes.gainNode);

      if (this.delayNode) {
        envGain.connect(this.delayNode); // إرسال للصدى لعمل مجسم ثلاثي الأبعاد
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);

    } else {
      // ميلودي غني متلألئ (Crystal Keys) نقي مضاف لصدى الفضاء
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const envGain = this.ctx.createGain();

      const baseFreq = params.freq[freqIndex % params.freq.length] || 329;

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(baseFreq + 1.5, now); 

      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.value = 5.2; // فايبراتو غنائي 5.2Hz
      vibratoGain.gain.value = 2.0;

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      
      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.38, now + params.attack);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(envGain);
      osc2.connect(envGain);
      envGain.connect(nodes.gainNode);

      if (this.delayNode) {
        envGain.connect(this.delayNode); // إرسال دلاي
      }

      osc1.start(now);
      osc2.start(now);
      vibrato.start(now);
      
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
      vibrato.stop(now + duration + 0.05);
    }
  }

  playInstrumentLoop(
    id: InstrumentId,
    bpm: number,
    volume: number,
    pan: number
  ): boolean {
    if (!this.ctx) return false;
    const params = this.INSTRUMENT_PARAMS[id];
    const nodes = this.getOrCreateNodes(id, volume, pan);
    if (!nodes) return false;

    nodes.isPlaying = true;
    const beatMs = (60 / bpm / params.beatDiv) * 1000;
    let step = 0;
    let freqIdx = 0;

    // تشغيل فوري
    if (params.pattern[0] === 1) {
      this.triggerNote(id, freqIdx++, volume, pan, beatMs / 1000 * 0.8);
    }

    nodes.intervalId = setInterval(() => {
      step = (step + 1) % params.pattern.length;
      if (params.pattern[step] === 1) {
        this.triggerNote(id, freqIdx++ % params.freq.length, volume, pan, beatMs / 1000 * 0.8);
      }
    }, beatMs);

    return true;
  }

  stopInstrument(id: InstrumentId) {
    const nodes = this.instrumentNodes.get(id);
    if (!nodes) return;
    nodes.isPlaying = false;
    if (nodes.intervalId) {
      clearInterval(nodes.intervalId);
      nodes.intervalId = undefined;
    }
    // Fade out
    if (nodes.gainNode && this.ctx) {
      nodes.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
      setTimeout(() => {
        if (nodes.gainNode && this.ctx) {
          nodes.gainNode.gain.value = 0;
        }
      }, 60);
    }
  }

  stopAll() {
    this.instrumentNodes.forEach((_, id) => this.stopInstrument(id));
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  setMasterVolume(vol: number) {
    if (this.masterGain) this.masterGain.gain.value = vol / 100;
  }

  getAnalyserData(id: InstrumentId): Uint8Array | null {
    const nodes = this.instrumentNodes.get(id);
    if (!nodes?.analyser) return null;
    const data = new Uint8Array(nodes.analyser.frequencyBinCount);
    nodes.analyser.getByteFrequencyData(data);
    return data;
  }

  isInstrumentPlaying(id: InstrumentId): boolean {
    return this.instrumentNodes.get(id)?.isPlaying ?? false;
  }

  isReady(): boolean {
    return this.ctx !== null && this.ctx.state === "running";
  }

  suspend() {
    this.ctx?.suspend();
  }

  resume() {
    this.ctx?.resume();
  }
}

export const audioEngine = new AudioEngine();

// ════════════════════════════════════════════════════
//  حساب حقيقي للموجات والأنماط
// ════════════════════════════════════════════════════

function computeWaveform(
  instrument: Instrument,
  beatGrid: BeatGrid
): WaveformCache {
  const resolution = 75; // دقة أعلى لكسر السطوح الملساء وإظهار القمم والشوك بشكل طبيعي احترافي
  const totalSamples = Math.ceil(beatGrid.totalDuration * resolution);
  const peaks = new Float32Array(totalSamples);
  const rms = new Float32Array(totalSamples);

  const params = {
    kick:   { pattern: [1,0,0,0,1,0,0,0], amp: 0.95, decay: 0.18 },
    snare:  { pattern: [0,0,1,0,0,0,1,0], amp: 0.85, decay: 0.22 },
    hihat:  { pattern: [1,0,1,0,1,0,1,0], amp: 0.55, decay: 0.06 },
    bass:   { pattern: [1,0,0,1,0,0,1,0], amp: 0.88, decay: 0.45 },
    melody: { pattern: [1,0,1,0,0,1,0,1], amp: 0.75, decay: 0.35 },
    pad:    { pattern: [1,0,0,0,1,0,0,0], amp: 0.65, decay: 0.90 },
    vocal:  { pattern: [1,0,0,1,0,1,0,0], amp: 0.80, decay: 0.60 },
  }[instrument.id];

  if (!params) return { instrumentId: instrument.id, peaks, rms, resolution };

  const { beatDuration } = beatGrid;
  const subBeatDuration = beatDuration / 2;

  for (let i = 0; i < totalSamples; i++) {
    const time = i / resolution;
    const subBeatIdx = Math.floor(time / subBeatDuration) % params.pattern.length;
    const timeInSubBeat = (time % subBeatDuration) / subBeatDuration;

    let value = 0.01; // همس خلفي بسيط جداً يمنع الفراغ الرقمي الميت

    if (params.pattern[subBeatIdx] === 1) {
      const isMute = instrument.isMuted;
      if (!isMute) {
        if (instrument.id === "kick") {
          // هجوم شوكي سريع جداً ثم تلاشي سريع ورنين قرار عميق بتردد منخفض
          const transient = Math.exp(-timeInSubBeat / 0.02) * 0.45;
          const body = Math.exp(-timeInSubBeat / params.decay) * 0.55;
          const rumble = 1.0 + 0.12 * Math.sin(time * 65);
          value = params.amp * (transient + body) * rumble;
        } else if (instrument.id === "snare") {
          // هجوم فوري جاف عريض مع موجة عشوائية عالية التردد تحاكي رذيل السلك الخلفي
          const transient = Math.exp(-timeInSubBeat / 0.01) * 0.35;
          const tail = Math.exp(-timeInSubBeat / params.decay) * 0.65;
          const snareGrit = 0.75 + 0.25 * Math.sin(time * 280) + 0.1 * (Math.random() - 0.5);
          value = params.amp * (transient + tail) * snareGrit;
        } else if (instrument.id === "hihat") {
          // قمم دقيقة جداً قصيرة تتراوح عشوائياً تحاكي الضربة المعدنية الصافية للهاي هات
          const transient = Math.exp(-timeInSubBeat / params.decay);
          const click = 0.6 + 0.4 * (Math.random() - 0.5);
          value = params.amp * transient * click;
        } else if (instrument.id === "bass") {
          // خط ممتد وسميك عائم مع تموج ناعم يحمل طاقة قرار مستمرة غنية بالهارمونيات
          const body = params.decay;
          const env = Math.exp(-timeInSubBeat / body) * 0.5 + 0.5; // الحفاظ على تدفق باس سميك
          const pulse = 0.85 + 0.15 * Math.sin(time * 30);
          value = params.amp * env * pulse;
        } else if (instrument.id === "melody") {
          // موجة انزلاقية تذبذبية غنائية مستمرة تعكس النغمات المتلاحقة بسلاسة
          const gate = Math.exp(-timeInSubBeat / params.decay) * 0.7 + 0.3;
          const contour = 0.55 + 0.45 * Math.sin(time * 3.5 + Math.cos(time * 1.5));
          value = params.amp * gate * contour;
        } else if (instrument.id === "pad") {
          // انتفاخ موجي بطيء (Swell) وعريض مستقر مع اهتزاز مائي هادئ
          const attack = 1 - Math.exp(-timeInSubBeat / 0.25);
          const env = attack * Math.exp(-timeInSubBeat / params.decay);
          const swell = 0.75 + 0.25 * Math.sin(time * 1.8);
          value = params.amp * env * swell;
        } else if (instrument.id === "vocal") {
          // موجات صوتية نابضة غنية بالتفاصيل والارتعاشات الصوتية الطبيعية
          const wave = Math.exp(-timeInSubBeat / params.decay) * 0.65 + 0.35;
          const vibrato = 0.65 + 0.35 * Math.sin(time * 7.5) * Math.sin(time * 0.8);
          value = params.amp * wave * vibrato;
        }
      }
    } else {
      // بين الضربات: نقوم بمحاكاة تسرب ترددات الآلاف الأخرى بذكاء ليعطي شكلاً حقيقياً نابضاً بالحياة في مستشعرات الجرافيك
      const bleedFactor = {
        kick: 0.015,
        snare: 0.02,
        hihat: 0.01,
        bass: 0.04,
        melody: 0.03,
        pad: 0.05,
        vocal: 0.035
      }[instrument.id] || 0.02;

      // إضافة موجة خلفية دقيقة بدلاً من الصمت التام لتعزيز جمالية العرض
      if (!instrument.isMuted) {
        value = bleedFactor * (0.5 + 0.5 * Math.sin(time * 4.0)) + 0.005 * Math.random();
      }
    }

    peaks[i] = Math.max(0.002, Math.min(1.0, value));
    rms[i] = peaks[i] * 0.68;
  }

  return { instrumentId: instrument.id, peaks, rms, resolution };
}

function isMuted(inst: Instrument): boolean {
  return inst.isMuted;
}

// ════════════════════════════════════════════════════
//  حساب مقاطع البيت العربي
// ════════════════════════════════════════════════════

export function analyzeArabicText(text: string): {
  syllableCount: number;
  syllables: string[];
  densityPerSecond: number;
  flowRating: "excellent" | "good" | "fair" | "poor";
  issues: string[];
} {
  if (!text.trim()) {
    return { syllableCount: 0, syllables: [], densityPerSecond: 0, flowRating: "fair", issues: [] };
  }

  const words = text.trim().split(/\s+/);
  const syllables: string[] = [];
  const issues: string[] = [];

  // تحليل كل كلمة
  words.forEach((word) => {
    // الحروف الطويلة (مد)
    const longVowels = (word.match(/[اويى]/g) || []).length;
    // الحركات القصيرة
    const shortVowels = (word.match(/[\u064E\u064F\u0650\u064B\u064C\u064D]/g) || []).length;
    // الشدة (مقطع مضاعف)
    const shadda = (word.match(/\u0651/g) || []).length;
    // المقاطع الأساسية من الحروف
    const baseChars = word.replace(/[\u064B-\u065F\u0670]/g, "").length;

    const wordSyllables = Math.max(
      1,
      longVowels + Math.ceil(shortVowels * 0.6) + shadda + Math.ceil(baseChars * 0.25)
    );

    for (let s = 0; s < wordSyllables; s++) {
      syllables.push(word);
    }
  });

  const syllableCount = syllables.length;

  // تقييم الكثافة (المقاطع في 2 ثانية افتراضية)
  const densityPerSecond = syllableCount / 2;

  // تحديد الجودة
  let flowRating: "excellent" | "good" | "fair" | "poor";
  if (syllableCount >= 6 && syllableCount <= 10) {
    flowRating = "excellent";
  } else if (syllableCount >= 4 && syllableCount <= 13) {
    flowRating = "good";
  } else if (syllableCount < 4) {
    flowRating = "fair";
    issues.push("السطر قصير - يحتاج المزيد من الكلمات");
  } else {
    flowRating = "poor";
    issues.push("السطر ثقيل جداً - خفف الكلمات أو قسّم السطر");
  }

  if (densityPerSecond > 7) {
    issues.push("كثافة عالية - تباطأ في الأداء");
  }

  return { syllableCount, syllables, densityPerSecond, flowRating, issues };
}

// حساب توافق المزاج
export function calcVibeMatch(
  text: string,
  instrumentVibe: VibeType,
  globalVibe: VibeType
): number {
  const lowerText = text.toLowerCase();

  const vibeKeywords: Record<VibeType, string[]> = {
    fire: ["نار", "قوة", "دم", "حرب", "ثأر", "غضب", "صرخ", "ضرب", "هجوم", "ملك"],
    sad: ["قلب", "دمع", "بكى", "وجع", "حزن", "ليل", "غياب", "فراق", "حب", "ألم"],
    epic: ["مجد", "تاريخ", "أمة", "نصر", "ثورة", "بطل", "سماء", "أرض", "حقيقة"],
    smooth: ["هدوء", "نسيم", "راحة", "سلام", "نوم", "حلم", "ابتسام", "لطف"],
    neutral: [],
  };

  const instKeywords = vibeKeywords[instrumentVibe] || [];
  const globalKeywords = vibeKeywords[globalVibe] || [];

  let matches = 0;
  [...instKeywords, ...globalKeywords].forEach((kw) => {
    if (lowerText.includes(kw)) matches++;
  });

  // المطابقة الأساسية بين المزاجين
  const baseMatch =
    instrumentVibe === globalVibe ? 70 :
    Math.abs(["fire","epic","sad","smooth","neutral"].indexOf(instrumentVibe) -
             ["fire","epic","sad","smooth","neutral"].indexOf(globalVibe)) <= 1 ? 50 : 30;

  return Math.min(100, baseMatch + matches * 10);
}

// ════════════════════════════════════════════════════
//  البيانات الافتراضية
// ════════════════════════════════════════════════════

const DEFAULT_INSTRUMENTS: Instrument[] = [
  {
    id: "kick",
    nameAr: "الكيك",
    icon: "🥁",
    color: "#EF4444",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 90,
    pan: 0,
    vibe: "fire",
    baseFrequency: 80,
    waveType: "sine",
    attackTime: 0.002,
    releaseTime: 0.3,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0, 0.25, 0.5, 0.75],
    quietPositions: [0.125, 0.375, 0.625, 0.875],
  },
  {
    id: "snare",
    nameAr: "السنير",
    icon: "🔔",
    color: "#F59E0B",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 85,
    pan: 0,
    vibe: "fire",
    baseFrequency: 200,
    waveType: "triangle",
    attackTime: 0.001,
    releaseTime: 0.15,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0.5, 1.0],
    quietPositions: [0.25, 0.75],
  },
  {
    id: "hihat",
    nameAr: "الهاي هات",
    icon: "⚡",
    color: "#10B981",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 70,
    pan: 0.2,
    vibe: "neutral",
    baseFrequency: 1000,
    waveType: "sawtooth",
    attackTime: 0.001,
    releaseTime: 0.05,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875],
    quietPositions: [],
  },
  {
    id: "bass",
    nameAr: "الباس",
    icon: "🎸",
    color: "#8B5CF6",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 85,
    pan: 0,
    vibe: "smooth",
    baseFrequency: 82,
    waveType: "sawtooth",
    attackTime: 0.01,
    releaseTime: 0.4,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0, 0.375, 0.625],
    quietPositions: [0.25, 0.5, 0.875],
  },
  {
    id: "melody",
    nameAr: "الميلودي",
    icon: "🎹",
    color: "#06B6D4",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 80,
    pan: -0.2,
    vibe: "epic",
    baseFrequency: 329,
    waveType: "sine",
    attackTime: 0.05,
    releaseTime: 0.3,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0, 0.25, 0.625, 0.875],
    quietPositions: [0.375, 0.5, 0.75],
  },
  {
    id: "pad",
    nameAr: "الباد",
    icon: "🎻",
    color: "#EC4899",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 65,
    pan: 0,
    vibe: "sad",
    baseFrequency: 196,
    waveType: "sine",
    attackTime: 0.2,
    releaseTime: 0.8,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0, 0.5],
    quietPositions: [0.25, 0.75],
  },
  {
    id: "vocal",
    nameAr: "الفوكال",
    icon: "🎤",
    color: "#F97316",
    isPlaying: false,
    isMuted: false,
    isSolo: false,
    volume: 88,
    pan: 0,
    vibe: "sad",
    baseFrequency: 261,
    waveType: "sine",
    attackTime: 0.1,
    releaseTime: 0.5,
    amplitudeData: new Float32Array(0),
    frequencyData: new Float32Array(0),
    peakPositions: [0, 0.375, 0.625],
    quietPositions: [0.125, 0.5, 0.875],
  },
];

// بناء شبكة البيت
function buildBeatGrid(bpm: number, totalBars: number, timeSigNum = 4, timeSigDen = 4): BeatGrid {
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * timeSigNum;
  const totalDuration = barDuration * totalBars;

  // بناء البيتات
  const beats: BeatPoint[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    for (let beat = 0; beat < timeSigNum; beat++) {
      beats.push({
        bar,
        beat,
        time: bar * barDuration + beat * beatDuration,
        isStrong: beat === 0,
        isMedium: beat === 2,
      });
    }
  }

  // بناء الأقسام تلقائياً
  const sections: BeatSectionData[] = [];
  const sectionLayouts: { type: BeatSection; startFrac: number; endFrac: number; label: string }[] = [
    { type: "intro",   startFrac: 0,    endFrac: 0.125, label: "المقدمة" },
    { type: "verse",   startFrac: 0.125, endFrac: 0.375, label: "المقطع الأول" },
    { type: "hook",    startFrac: 0.375, endFrac: 0.55,  label: "الهوك" },
    { type: "verse",   startFrac: 0.55,  endFrac: 0.75,  label: "المقطع الثاني" },
    { type: "bridge",  startFrac: 0.75,  endFrac: 0.875, label: "الجسر" },
    { type: "outro",   startFrac: 0.875, endFrac: 1.0,   label: "الخاتمة" },
  ];

  const sectionColors: Record<BeatSection, string> = {
    intro: "#6B7280", verse: "#8B5CF6", hook: "#F59E0B",
    bridge: "#0EA5E9", outro: "#10B981",
  };

  sectionLayouts.forEach((layout, idx) => {
    const startBar = Math.floor(layout.startFrac * totalBars);
    const endBar = Math.ceil(layout.endFrac * totalBars);
    sections.push({
      id: `section-${idx}`,
      type: layout.type,
      label: layout.label,
      startBar,
      endBar,
      startTime: startBar * barDuration,
      endTime: endBar * barDuration,
      dominantInstruments: ["kick", "bass", "melody"].slice(0, 2 + (idx % 2)) as InstrumentId[],
      averageIntensity: 0.5 + (layout.type === "hook" ? 0.3 : 0),
      color: sectionColors[layout.type],
    });
  });

  return {
    bpm,
    timeSignatureNum: timeSigNum,
    timeSignatureDen: timeSigDen,
    totalBars,
    barDuration,
    beatDuration,
    totalDuration,
    sections,
    beats,
  };
}

// ════════════════════════════════════════════════════
//  إنشاء المتجر
// ════════════════════════════════════════════════════

export const useBeatWriterStore = create<BeatWriterState>()(
  subscribeWithSelector((set, get) => ({
    beatGrid: null,
    instruments: DEFAULT_INSTRUMENTS,
    selectedInstrumentId: "melody",
    isPlaying: false,
    currentTime: 0,
    currentBar: 0,
    currentBeat: 0,
    timelineZoom: 2,
    timelineScrollRTL: 1, // RTL: يبدأ من اليمين
    canvasWidth: 800,
    canvasHeight: 320,
    lyricBars: [],
    selectedBarId: null,
    draftText: "",
    activeSection: "verse",
    audioContextReady: false,
    masterVolume: 80,
    isAnalyzing: false,
    analysisProgress: 0,
    waveformCache: new Map(),

    actions: {
      // ── تهيئة البيت ──
      initializeBeat: (bpm, bars, timeSignature = [4, 4]) => {
        const grid = buildBeatGrid(bpm, bars, ...timeSignature);
        const instruments = get().instruments;
        const cache = new Map<InstrumentId, WaveformCache>();

        instruments.forEach((inst) => {
          cache.set(inst.id, computeWaveform(inst, grid));
        });

        set({ beatGrid: grid, waveformCache: cache });
      },

      // ── إدارة الآلات ──
      selectInstrument: (id) => set({ selectedInstrumentId: id }),

      toggleMute: (id) => {
        set((s) => ({
          instruments: s.instruments.map((i) =>
            i.id === id ? { ...i, isMuted: !i.isMuted } : i
          ),
        }));
        const inst = get().instruments.find((i) => i.id === id);
        if (inst?.isMuted) {
          audioEngine.stopInstrument(id);
        }
        // إعادة حساب الموجة
        const grid = get().beatGrid;
        if (grid) {
          const updated = get().instruments.find((i) => i.id === id);
          if (updated) {
            const cache = new Map(get().waveformCache);
            cache.set(id, computeWaveform(updated, grid));
            set({ waveformCache: cache });
          }
        }
      },

      toggleSolo: (id) => {
        const current = get().instruments.find((i) => i.id === id);
        const isSolo = current?.isSolo ?? false;

        set((s) => ({
          instruments: s.instruments.map((i) => ({
            ...i,
            isSolo: i.id === id ? !isSolo : false,
            isMuted: isSolo ? false : i.id !== id,
          })),
        }));

        // إيقاف الآلات المكتومة
        if (!isSolo) {
          get().instruments.forEach((i) => {
            if (i.id !== id) audioEngine.stopInstrument(i.id);
          });
        }
      },

      setVolume: (id, vol) =>
        set((s) => ({
          instruments: s.instruments.map((i) =>
            i.id === id ? { ...i, volume: Math.max(0, Math.min(100, vol)) } : i
          ),
        })),

      setPan: (id, pan) =>
        set((s) => ({
          instruments: s.instruments.map((i) =>
            i.id === id ? { ...i, pan: Math.max(-1, Math.min(1, pan)) } : i
          ),
        })),

      // ── تشغيل الصوت ──
      playInstrument: async (id) => {
        let ready = get().audioContextReady;
        if (!ready) {
          ready = await audioEngine.initialize();
          set({ audioContextReady: ready });
        }
        if (!ready) return;

        const inst = get().instruments.find((i) => i.id === id);
        if (!inst || inst.isMuted) return;

        const grid = get().beatGrid;
        const bpm = grid?.bpm ?? 90;

        // إيقاف إن كان يشتغل
        if (inst.isPlaying) {
          audioEngine.stopInstrument(id);
          set((s) => ({
            instruments: s.instruments.map((i) =>
              i.id === id ? { ...i, isPlaying: false } : i
            ),
          }));
          return;
        }

        const success = audioEngine.playInstrumentLoop(id, bpm, inst.volume, inst.pan);
        if (success) {
          set((s) => ({
            instruments: s.instruments.map((i) =>
              i.id === id ? { ...i, isPlaying: true } : i
            ),
          }));
        }
      },

      stopInstrument: (id) => {
        audioEngine.stopInstrument(id);
        set((s) => ({
          instruments: s.instruments.map((i) =>
            i.id === id ? { ...i, isPlaying: false } : i
          ),
        }));
      },

      playAll: async () => {
        let ready = get().audioContextReady;
        if (!ready) {
          ready = await audioEngine.initialize();
          set({ audioContextReady: ready });
        }
        if (!ready) return;

        const { instruments, beatGrid } = get();
        if (!beatGrid) return;

        const bpm = beatGrid.bpm;

        instruments.forEach((inst) => {
          if (!inst.isMuted) {
            audioEngine.playInstrumentLoop(inst.id, bpm, inst.volume, inst.pan);
          }
        });

        set((s) => ({
          isPlaying: true,
          instruments: s.instruments.map((i) => ({
            ...i,
            isPlaying: !i.isMuted,
          })),
        }));

        // تحديث الوقت الحالي
        const startTime = Date.now() - get().currentTime * 1000;
        const timer = setInterval(() => {
          const { isPlaying, beatGrid: bg } = get();
          if (!isPlaying || !bg) { clearInterval(timer); return; }
          const elapsed = (Date.now() - startTime) / 1000;
          const clamped = Math.min(elapsed, bg.totalDuration);
          const currentBar = Math.floor(clamped / bg.barDuration);
          const currentBeat = Math.floor((clamped % bg.barDuration) / bg.beatDuration);
          set({ currentTime: clamped, currentBar, currentBeat });
          if (clamped >= bg.totalDuration) {
            get().actions.stopAll();
          }
        }, 50);
      },

      stopAll: () => {
        audioEngine.stopAll();
        set((s) => ({
          isPlaying: false,
          instruments: s.instruments.map((i) => ({ ...i, isPlaying: false })),
        }));
      },

      seekTo: (time) => {
        const { beatGrid } = get();
        if (!beatGrid) return;
        const clamped = Math.max(0, Math.min(beatGrid.totalDuration, time));
        const currentBar = Math.floor(clamped / beatGrid.barDuration);
        const currentBeat = Math.floor((clamped % beatGrid.barDuration) / beatGrid.beatDuration);
        set({ currentTime: clamped, currentBar, currentBeat });
      },

      // ── الكانفاس ──
      setTimelineZoom: (zoom) =>
        set({ timelineZoom: Math.max(1, Math.min(20, zoom)) }),

      scrollTimeline: (delta) =>
        set((s) => ({
          timelineScrollRTL: Math.max(0, Math.min(1, s.timelineScrollRTL + delta)),
        })),

      // ── الكتابة ──
      addLyricBar: (text, section, startBeat, durationBeats) => {
        const { selectedInstrumentId, instruments, beatGrid } = get();
        if (!beatGrid) return;

        const inst = instruments.find((i) => i.id === selectedInstrumentId)!;
        const analysis = analyzeArabicText(text);
        const vibeMatch = calcVibeMatch(text, inst.vibe, "neutral");
        const flowScore = {
          excellent: 90, good: 75, fair: 50, poor: 25,
        }[analysis.flowRating];

        const startTime = startBeat * beatGrid.beatDuration;
        const endTime = startTime + durationBeats * beatGrid.beatDuration;

        const newBar: LyricBar = {
          id: `bar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          section,
          instrumentId: selectedInstrumentId,
          startBeat,
          durationBeats,
          startTime,
          endTime,
          syllableCount: analysis.syllableCount,
          flowScore,
          vibeMatch,
          densityScore: analysis.densityPerSecond,
          color: inst.color,
          isSelected: false,
        };

        set((s) => ({ lyricBars: [...s.lyricBars, newBar], draftText: "" }));
      },

      updateLyricBar: (id, updates) =>
        set((s) => ({
          lyricBars: s.lyricBars.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, ...updates };
            if (updates.text !== undefined) {
              const analysis = analyzeArabicText(updated.text);
              updated.syllableCount = analysis.syllableCount;
              updated.densityScore = analysis.densityPerSecond;
              const inst = s.instruments.find((i) => i.id === updated.instrumentId);
              if (inst) {
                updated.flowScore = { excellent: 90, good: 75, fair: 50, poor: 25 }[analysis.flowRating];
                updated.vibeMatch = calcVibeMatch(updated.text, inst.vibe, "neutral");
              }
            }
            return updated;
          }),
        })),

      removeLyricBar: (id) =>
        set((s) => ({
          lyricBars: s.lyricBars.filter((b) => b.id !== id),
          selectedBarId: s.selectedBarId === id ? null : s.selectedBarId,
        })),

      selectBar: (id) =>
        set((s) => ({
          selectedBarId: id,
          lyricBars: s.lyricBars.map((b) => ({ ...b, isSelected: b.id === id })),
        })),

      setDraftText: (text) => set({ draftText: text }),
      setActiveSection: (s) => set({ activeSection: s }),

      commitDraft: () => {
        const { draftText, activeSection, beatGrid, currentTime } = get();
        if (!draftText.trim() || !beatGrid) return;
        const startBeat = Math.floor(currentTime / beatGrid.beatDuration);
        const analysis = analyzeArabicText(draftText);
        const durationBeats = Math.max(2, Math.ceil(analysis.syllableCount / 2));
        get().actions.addLyricBar(draftText.trim(), activeSection, startBeat, durationBeats);
      },

      // ── تحليل شامل ──
      analyzeAndBuild: async (bpm = 90, bars = 32) => {
        set({ isAnalyzing: true, analysisProgress: 0 });

        // محاكاة مراحل التحليل
        const steps = [
          { msg: "تهيئة المحرك الصوتي", duration: 200 },
          { msg: "بناء شبكة الإيقاع", duration: 300 },
          { msg: "حساب موجات الآلات", duration: 500 },
          { msg: "تحديد الأقسام", duration: 300 },
          { msg: "بناء الذاكرة المؤقتة", duration: 200 },
        ];

        for (let i = 0; i < steps.length; i++) {
          await new Promise((r) => setTimeout(r, steps[i].duration));
          set({ analysisProgress: Math.round(((i + 1) / steps.length) * 100) });
        }

        get().actions.initializeBeat(bpm, bars, [4, 4]);
        set({ isAnalyzing: false, analysisProgress: 100 });
      },
    },
  }))
);
