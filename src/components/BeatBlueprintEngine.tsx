// src/components/BeatBlueprintEngine.tsx
"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDropzone } from "react-dropzone";
import { 
  Play, 
  Pause, 
  Upload, 
  Activity, 
  Sparkles, 
  Layers, 
  Trash2, 
  HelpCircle, 
  Cpu, 
  Music, 
  Sliders, 
  TrendingUp, 
  Hash, 
  Flame 
} from "lucide-react";
import { useMaqamStore, type MaqamState, type EmotionTarget } from "../store/maqamStore";
import { RhythmicGridVisualizer } from "../maqam/components/RhythmicGridVisualizer";
import { SonicSemanticHeatmap } from "../maqam/components/SonicSemanticHeatmap";
import { NarrativeArcPanel } from "../maqam/components/NarrativeArcPanel";
import { RhymeSlotMarker } from "./RhymeSlotMarker";
import { StructureTimeline } from "./StructureTimeline";
import { cn } from "../lib/utils";
import { royalTokens } from "../theme/tokens";

// ─── Sub-components ───────────────────────────────────────
const WaveformPreview: React.FC<{ 
  audioBuffer: AudioBuffer; 
  playheadPercent?: number;
  onScrub?: (percent: number) => void;
}> = ({ audioBuffer, playheadPercent = 0, onScrub }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background subtle bars
    ctx.fillStyle = "rgba(17, 21, 34, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#8B5CF6"); // Magic Amethyst
    gradient.addColorStop(0.5, "#D4A017"); // Royal Gold
    gradient.addColorStop(1, "#3B82F6"); // Sapphire Blue
    
    ctx.fillStyle = gradient;

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j] ?? 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      const x = i;
      const y = (1 + min) * amp;
      const h = Math.max(2, (max - min) * amp);

      // Determine active color style based on playhead position
      const isPast = (i / canvas.width) * 100 <= playheadPercent;
      if (isPast) {
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      }
      ctx.fillRect(x, y, 1.5, h);
    }
  }, [audioBuffer, playheadPercent]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onScrub) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    onScrub(Math.max(0, Math.min(100, percent)));
  };

  return (
    <div className="relative w-full group cursor-pointer">
      <canvas
        ref={canvasRef}
        width={800}
        height={90}
        onClick={handleCanvasClick}
        className="w-full rounded-xl border border-white/5 transition-all shadow-lg"
      />
      {/* Precision Playhead Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-lg pointer-events-none transition-all duration-100"
        style={{ left: `${playheadPercent}%` }}
      >
        <div className="w-2 h-2 rounded-full bg-amber-400 -mt-1 -ml-[3px]" />
      </div>
    </div>
  );
};

// ─── Module Tab Definition ────────────────────────────────
interface ModuleTab {
  id: MaqamState["activeModule"];
  label: string;
  arabicLabel: string;
  icon: React.ReactNode;
  color: string;
}

const MODULETABS: ModuleTab[] = [
  { id: "blueprint", label: "Blueprint",  arabicLabel: "هيكل البيت",     icon: <Layers size={14} />, color: "#F59E0B" },
  { id: "grid",      label: "Grid",       arabicLabel: "الشبكة الإيقاعية", icon: <Sliders size={14} />, color: "#06B6D4" },
  { id: "heatmap",   label: "Heatmap",    arabicLabel: "خريطة الطاقة",    icon: <Flame size={14} />, color: "#EF4444" },
  { id: "arc",       label: "Arc",        arabicLabel: "منحنى السرد",     icon: <TrendingUp size={14} />, color: "#8B5CF6" },
  { id: "rhyme",     label: "Rhyme",      arabicLabel: "جيوب القافية",    icon: <Hash size={14} />, color: "#10B981" },
];

// ─── Main Component ───────────────────────────────────────
export const BeatBlueprintEngine: React.FC = () => {
  const {
    blueprint,
    audioBuffer,
    analysisResult,
    isAnalyzing,
    analysisProgress,
    activeModule,
    errors,
    actions,
  } = useMaqamStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPercent, setPlayheadPercent] = useState(0);
  const playheadRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  // Web Audio Playback nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // Sync playhead state with store actions
  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setIsPlaying(false);
  };

  const startPlayback = (offsetSeconds: number) => {
    if (!audioBuffer) return;
    stopPlayback();

    // Create or resume AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Track state
    startTimeRef.current = ctx.currentTime - offsetSeconds;
    source.start(0, offsetSeconds);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      // Check if it ended naturally
      const elapsed = ctx.currentTime - startTimeRef.current;
      if (elapsed >= audioBuffer.duration) {
        setIsPlaying(false);
        setPlayheadPercent(0);
        pausedAtRef.current = 0;
      }
    };

    // Frame loops to sync visual progress
    const updateProgress = () => {
      if (!audioBuffer) return;
      const elapsed = ctx.currentTime - startTimeRef.current;
      const progress = (elapsed / audioBuffer.duration) * 100;
      
      if (progress >= 100) {
        setPlayheadPercent(100);
        setIsPlaying(false);
      } else {
        setPlayheadPercent(progress);
        animationFrameId.current = requestAnimationFrame(updateProgress);
      }
    };
    animationFrameId.current = requestAnimationFrame(updateProgress);
  };

  const togglePlay = () => {
    if (!audioBuffer) return;
    if (isPlaying) {
      // Pause
      if (audioCtxRef.current) {
        pausedAtRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
      }
      stopPlayback();
    } else {
      // Resume
      const duration = audioBuffer.duration;
      let resumeTime = pausedAtRef.current;
      if (resumeTime >= duration) resumeTime = 0;
      startPlayback(resumeTime);
    }
  };

  const handleScrub = (percent: number) => {
    if (!audioBuffer) return;
    const targetSeconds = (percent / 100) * audioBuffer.duration;
    pausedAtRef.current = targetSeconds;
    setPlayheadPercent(percent);

    if (isPlaying) {
      startPlayback(targetSeconds);
    }
  };

  // ─── Drop Zone ─────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      await actions.loadAudio(file);
    },
    [actions]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".wav", ".flac", ".ogg", ".aac"] },
    maxFiles: 1,
    maxSize: 150 * 1024 * 1024,
    multiple: false,
  } as any);

  // ─── Preset Beat Simulator ────────────────────────────
  const handleLoadDemoBeat = () => {
    // Construct rich simulation beats
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 1) Initialize visual waveform mockbuffer (16 seconds duration)
    const durationSec = 16;
    const sampleRate = 44100;
    const bufferSize = sampleRate * durationSec;
    const mockBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = mockBuffer.getChannelData(0);
    
    // Generate beautiful complex waveform profile
    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const bassPulse = Math.abs(Math.sin(2.33 * Math.PI * t)) * Math.exp(-2.0 * (t % 0.428));
      const midSnares = (i % 22050 < 400) ? Math.random() * 0.4 * Math.exp(-5.0 * ((i % 22050) / 44100)) : 0;
      const cleanSine = Math.sin(300 * Math.PI * t) * Math.exp(-4 * (t % 0.856)) * 0.25;
      data[i] = (bassPulse * 0.45 + midSnares * 0.3 + cleanSine * 0.25) * (1 - t / durationSec);
    }

    const bpm = 140;
    const beatIntervalMs = (60 / bpm) * 1000;
    const numBeats = 64; // 16 bars * 4 beats/bar

    const beats: any[] = [];
    for (let i = 0; i < numBeats; i++) {
      const timeMs = i * beatIntervalMs;
      const beatInBar = i % 4;
      let strength: "downbeat" | "strong" | "medium" | "weak" = "weak";
      if (beatInBar === 0) strength = "downbeat";
      else if (beatInBar === 2) strength = "strong";
      else if (beatInBar === 1) strength = "medium";

      beats.push({
        timeMs,
        strength,
        bpm,
        confidence: 0.92 + Math.random() * 0.07,
      });
    }

    const sections: any[] = [
      { startMs: 0, endMs: 8 * beatIntervalMs, label: "intro", averageEnergy: 0.35 },
      { startMs: 8 * beatIntervalMs, endMs: 32 * beatIntervalMs, label: "verse", averageEnergy: 0.82 },
      { startMs: 32 * beatIntervalMs, endMs: 56 * beatIntervalMs, label: "hook", averageEnergy: 0.96 },
      { startMs: 56 * beatIntervalMs, endMs: 64 * beatIntervalMs, label: "outro", averageEnergy: 0.28 },
    ];

    const analysisResult = {
      bpm,
      bpmConfidence: 0.99,
      beats,
      onsets: Array.from({ length: 150 }, (_, i) => ({
        timeMs: i * 160 + Math.random() * 30,
        energy: Math.random() * 0.9,
        spectralFlux: Math.random() * 0.8,
      })),
      sections,
      totalDurationMs: numBeats * beatIntervalMs,
      totalBars: 16,
      sampleRate,
    };

    const blueprint = {
      id: "demo-blueprint",
      fileName: "ريتم_مقام_عصبي_140_BPM.wav",
      totalDurationMs: numBeats * beatIntervalMs,
      totalBars: 16,
      bpm,
      timeSignature: [4, 4] as [number, number],
      key: "F# Minor (النهوند)",
      sections,
      createdAt: Date.now(),
    };

    // Dispatch directly to store
    useMaqamStore.setState((s) => {
      s.audioBuffer = mockBuffer;
      s.analysisResult = analysisResult;
      s.blueprint = blueprint;
      s.isAnalyzing = false;
      s.analysisProgress = 100;
      s.activeModule = "blueprint";
      s.errors = [];
    });
  };

  // ─── Module Selector ──────────────────────────────────
  const renderModule = () => {
    if (!blueprint && !analysisResult) return null;

    switch (activeModule) {
      case "blueprint":
        return <StructureTimeline blueprint={blueprint} analysisResult={analysisResult} />;
      case "grid":
        return <RhythmicGridVisualizer blueprint={blueprint} analysisResult={analysisResult} />;
      case "heatmap":
        return <SonicSemanticHeatmap />;
      case "arc":
        return <NarrativeArcPanel blueprint={blueprint} analysisResult={analysisResult} />;
      case "rhyme":
        return <RhymeSlotMarker blueprint={blueprint} analysisResult={analysisResult} />;
      default:
        return null;
    }
  };

  return (
    <div className="royal-glass w-full rounded-2xl border border-white/5 bg-void/50 text-pristine font-sans overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="relative border-b border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-void/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neural-gold to-neural-amethyst flex items-center justify-center p-0.5 shadow-lg">
            <div className="w-full h-full bg-void rounded-[10px] flex items-center justify-center">
              <Cpu className="text-neural-gold w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="text-right md:text-left">
            <h1 className="text-lg font-bold tracking-wider text-text-pristine flex items-center justify-center md:justify-start gap-2">
              استوديو التحليل والذكاء الفونيتيكي
              <Sparkles size={16} className="text-neural-gold" />
            </h1>
            <p className="text-xs text-text-ghost">
              تحليل الموجات، الكبسات الإيقاعية، جيوب القافيات والخوارزميات العروضية للبيت
            </p>
          </div>
        </div>

        {/* Diagnostic Meta info */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-void/60 px-5 py-2.5 rounded-xl border border-white/5 shadow-inner"
          >
            <div className="text-center">
              <span className="text-xs text-text-ghost uppercase block">السرعة</span>
              <span className="text-sm font-bold text-neural-gold tabular-nums">
                {analysisResult.bpm.toFixed(1)} BPM
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <span className="text-xs text-text-ghost uppercase block">المقاطع</span>
              <span className="text-sm font-bold text-deep-navy-glow">
                {analysisResult.sections.length} زمل
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <span className="text-xs text-text-ghost uppercase block">البحور / البارات</span>
              <span className="text-sm font-bold text-neural-amethyst tabular-nums">
                {analysisResult.totalBars} بار
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 space-y-6">
        
        {/* UPPER UPLOAD AND DEMO BANNER */}
        {!audioBuffer && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.div
              {...getRootProps()}
              className={cn(
                "relative lg:col-span-8 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[240px]",
                isDragActive
                  ? "border-neural-gold bg-neural-gold/5 scale-[1.01]"
                  : "border-white/10 hover:border-neural-amethyst/50 hover:bg-white/2"
              )}
              whileHover={{ scale: 1.002 }}
              whileTap={{ scale: 0.998 }}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-white/2 flex items-center justify-center mb-4 text-text-muted border border-white/5">
                <Upload size={28} className="translate-y-[1px]" />
              </div>
              <h3 className="text-base font-semibold text-text-pristine mb-2">
                اسحب ملف الإيقاع الصوتي هنا، أو انقر للتصفح
              </h3>
              <p className="text-xs text-text-ghost max-w-md">
                ندعم ملفات WAV, MP3, FLAC, M4A حتى حجم 150MB. يتم تحليل الذبذبات الفونيتيكية والعروضية داخل جهازك 100% دون رفعها لأي خادم.
              </p>
            </motion.div>

            {/* Simulated instant loader column */}
            <div className="lg:col-span-4 bg-white/2 rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neural-gold flex items-center gap-2 mb-2">
                  <Music size={16} />
                  ليس لديك ملف إيقاع جاهز؟
                </h3>
                <p className="text-xs text-text-ghost leading-relaxed mb-4">
                  شغّل الاستوديو فوراً وحمّل إيقاعاً رائعاً مصمماً خصيصاً لاختبار كل الخواص المتقدمة: مثل الشبكات العروضية، والقياس الفونيتيكي للأقسام!
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLoadDemoBeat}
                className="w-full bg-gradient-to-r from-neural-gold to-neural-amethyst text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                تحميل الإيقاع التجريبي النموذجي
              </motion.button>
            </div>
          </div>
        )}

        {/* LOADING PROGRESS MODAL */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/2 border border-white/10 rounded-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-neural-gold">
                  <Activity className="animate-spin w-4 h-4" />
                  تحليل الإيقاع والنبضات العصبية للموجة الصوتية...
                </span>
                <span className="text-white/80 tabular-nums">{analysisProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-neural-amethyst via-neural-gold to-deep-navy-glow"
                  animate={{ width: `${analysisProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="grid grid-cols-4 gap-3 text-[10px] text-text-ghost text-center font-mono">
                {[
                  { label: "BPM Detect", done: analysisProgress > 25 },
                  { label: "Grid Align", done: analysisProgress > 50 },
                  { label: "Phonetic Parse", done: analysisProgress > 75 },
                  { label: "Structure Map", done: analysisProgress > 90 },
                ].map((step, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "p-1.5 rounded-lg border",
                      step.done 
                        ? "border-neural-gold/30 text-neural-gold bg-neural-gold/5" 
                        : "border-white/5 text-white/25"
                    )}
                  >
                    {step.done ? "✓" : "•"} {step.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN VISUAL WAVE PLAYER (SHOWN AFTER DECODING) */}
        {audioBuffer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="royal-glass p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl"
          >
            {/* Real Playback Waveform */}
            <WaveformPreview 
              audioBuffer={audioBuffer} 
              playheadPercent={playheadPercent}
              onScrub={handleScrub}
            />

            {/* Custom Interactive Player Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-neural-gold hover:bg-white text-void flex items-center justify-center transition-all shadow-lg text-lg"
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-[1px]" fill="currentColor" />}
                </motion.button>
                
                <div>
                  <h4 className="text-xs font-bold text-text-pristine block">
                    {blueprint?.fileName || "ملف إيقاعي خارجي"}
                  </h4>
                  <div className="text-[10px] text-text-ghost flex gap-2 font-mono uppercase mt-0.5">
                    <span>مدى الموجة: {audioBuffer.duration.toFixed(1)}s</span>
                    <span>•</span>
                    <span>التردد: {audioBuffer.sampleRate} Hz</span>
                  </div>
                </div>
              </div>

              {/* Reset/Remove Action */}
              <button
                onClick={() => {
                  stopPlayback();
                  actions.reset();
                  setPlayheadPercent(0);
                  pausedAtRef.current = 0;
                }}
                className="text-xs text-text-ghost hover:text-red-400 border border-white/10 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                إزالة وتصفير
              </button>
            </div>
          </motion.div>
        )}

        {/* TABS MODULE NAVIGATION ONCE ANALYSIS DONE */}
        {analysisResult && (
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-void/40 border border-white/5 rounded-2xl flex-wrap">
              {MODULETABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => actions.setActiveModule(tab.id)}
                  className={cn(
                    "flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border",
                    activeModule === tab.id
                      ? "text-void bg-neural-gold border-transparent shadow-lg text-shadow-sm font-semibold"
                      : "bg-transparent text-text-muted border-transparent hover:text-text-pristine hover:bg-white/2"
                  )}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  {tab.icon}
                  <span>{tab.arabicLabel}</span>
                </motion.button>
              ))}
            </div>

            {/* TAB OUTLET WINDOW WITH FADE STAGGER */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="min-h-[300px]"
              >
                {renderModule()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ERROR BOUNDARY CONTAINER */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                {errors.map((err) => (
                  <p key={err.id} className="text-red-400 text-xs">
                    خطأ التحليل: {err.message}
                  </p>
                ))}
              </div>
              <button
                onClick={actions.clearErrors}
                className="text-xs bg-red-500/20 text-red-300 border border-red-400/20 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all font-semibold"
              >
                تحديث
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
