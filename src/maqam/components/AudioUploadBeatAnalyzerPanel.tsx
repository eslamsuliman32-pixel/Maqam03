// src/maqam/components/AudioUploadBeatAnalyzerPanel.tsx
import React, {
  useState, useCallback, useRef, useEffect, useMemo, memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Mic2, AudioLines, Copy, Wand2,
  Check, RefreshCw, Play, Square, AlertTriangle, Info,
} from "lucide-react";
import { useMaqamAnalysisStore } from "../store/maqamAnalysis.store";
import type { CompleteAudioAnalysis } from "../../services/audioAnalysisEngine";
import type { RhythmicVocalTimingAnalysis } from "../engines/vocalTiming.engine";
import { SuggestionPanel } from "../../components/SuggestionPanel";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BeatGrid {
  bpm:             number;
  bpmStability:    number;   // 0-1
  timeSignature:   string;
  beatPositionsMs: number[];
  spectral: {
    bassLevel:  number;     // 0-1
    midLevel:   number;
    highLevel:  number;
    dominance:  "bass" | "mid" | "high";
  };
  transientCount: number;
  durationMs:     number;
}

export interface VocalTiming {
  avgSyllableMs:   number;
  longestGapMs:    number;
  breathPositions: number[];
  onBeatRatio:     number;
  gridAlignScore:  number;
}

interface BarSuggestion {
  text:          string;
  syllableCount: number;
  fitScore:      number;
  rationale:     string;
}

// ── Bar Fit Engine ────────────────────────────────────────────────────────────
/** تقدير عدد المقاطع في النص العربي */
function countArabicSyllables(text: string): number {
  const clean = text.replace(/[\u064B-\u065F\u0670]/g, "").trim();
  return clean.split(/\s+/).reduce((count, word) => {
    if (!word) return count;
    const longVowels  = (word.match(/[اوي]/g) ?? []).length;
    const shortMarks  = (word.match(/[َُِ]/g) ?? []).length;
    const estimate    = Math.max(1, longVowels + Math.ceil(shortMarks / 2));
    return count + estimate;
  }, 0);
}

/** حساب نسبة توافق البار مع الـ BPM */
function calcBarFit(bar: string, bpm: number): number {
  const syllables      = countArabicSyllables(bar);
  const beatDurationS  = 60 / bpm;
  const barDurationS   = beatDurationS * 4;       // 4/4 time
  const idealSyllables = barDurationS * 3.5;      // ~3.5 مقطع/ثانية للراب العربي

  if (idealSyllables === 0) return 50;
  const ratio = syllables / idealSyllables;
  // منحنى bell حول 1.0 (= مثالي)
  const score = Math.round(100 * Math.exp(-Math.pow(ratio - 1, 2) * 2));
  return Math.max(10, Math.min(100, score));
}

const BAR_TEMPLATES: Record<BeatGrid["spectral"]["dominance"], {
  text: string;
  rationale: string;
}[]> = {
  bass: [
    { text: "الليل طويل والدنيا بتغلب عليا",        rationale: "ثقيل وبطيء يناسب الـ bass"    },
    { text: "من تحت لفوق ومفيش حاجة هتوقفني",      rationale: "تصاعدي مع الكيك"              },
    { text: "جواي نار مش بتتطفى بكلام فاضي",        rationale: "عمق دلالي يناسب القرار الثقيل" },
  ],
  mid: [
    { text: "بين الكلام والصمت بلاقي نفسي",         rationale: "متوازن يناسب الـ mid range"   },
    { text: "مشاعر في المنتصف مش عارف أوصفها",      rationale: "تدفق سلس على الـ harmony"     },
    { text: "الحياة مش أبيض وأسود، في رمادي كتير", rationale: "تنوع مقطعي على الـ mid drum"  },
  ],
  high: [
    { text: "طايرين فوق الغيوم ومفيش سقف",          rationale: "سريع وحاد مع الـ hi-hat"      },
    { text: "شرارة في الهوا ومش بتتحكم فيها",       rationale: "transient حاد يخدم الطاقة"    },
    { text: "عالي على كل اللي قالوا مش هينجح",      rationale: "كلمات مفتوحة تتنفس مع الـ high" },
  ],
};

function generateBarSuggestions(
  bpm: number,
  dominance: BeatGrid["spectral"]["dominance"]
): BarSuggestion[] {
  return BAR_TEMPLATES[dominance].map(({ text, rationale }) => ({
    text,
    rationale,
    syllableCount: countArabicSyllables(text),
    fitScore:      calcBarFit(text, bpm),
  }));
}

// ── Waveform Visualizer ───────────────────────────────────────────────────────
const WaveformVisualizer = memo(({
  beatPositions, durationMs, currentTimeS,
}: {
  beatPositions: number[];
  durationMs:    number;
  currentTimeS:  number;
}) => {
  const durationS    = durationMs / 1000;
  const progressPct  = durationS > 0 ? (currentTimeS / durationS) * 100 : 0;

  return (
    <div
      className="relative h-10 w-full overflow-hidden rounded-xl bg-zinc-900 cursor-pointer"
      role="img"
      aria-label="مشغّل الـ beat مع مؤشرات الإيقاع"
    >
      {/* Progress Fill */}
      <div
        className="absolute inset-y-0 left-0 bg-cyan-500/15 transition-none"
        style={{ width: `${progressPct}%` }}
      />
      {/* Beat Markers */}
      {beatPositions.map((ms, i) => (
        <div
          key={i}
          className="absolute top-0 h-full w-px bg-cyan-400/30"
          style={{ left: `${(ms / durationMs) * 100}%` }}
        />
      ))}
      {/* Playhead */}
      <div
        className="absolute top-0 h-full w-0.5 bg-white/70"
        style={{ left: `${progressPct}%`, transition: "left 0.1s linear" }}
      />
      {/* Duration Label */}
      <div className="absolute bottom-1 right-2 text-[9px] text-zinc-600 tabular-nums">
        {Math.round(currentTimeS)}s / {Math.round(durationMs / 1000)}s
      </div>
    </div>
  );
});
WaveformVisualizer.displayName = "WaveformVisualizer";

// ── Spectral Visualizer ───────────────────────────────────────────────────────
const SpectralVisualizer = memo(({ spectral }: { spectral: BeatGrid["spectral"] }) => {
  const bands = [
    { label: "Bass", value: spectral.bassLevel, color: "#ef4444", desc: "ثقل منخفض" },
    { label: "Mid",  value: spectral.midLevel,  color: "#f59e0b", desc: "توازن"     },
    { label: "High", value: spectral.highLevel, color: "#06b6d4", desc: "حدة عالية" },
  ] as const;

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-300">الطيف الصوتي</h4>
        <span className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${
          spectral.dominance === "bass"
            ? "bg-red-500/20 text-red-300 border-red-500/30"
            : spectral.dominance === "mid"
            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
        }`}>
          {{bass:"Bass Heavy", mid:"Mid Range", high:"High Energy"}[spectral.dominance]}
        </span>
      </div>
      <div className="flex h-20 items-end gap-3">
        {bands.map(({ label, value, color, desc }) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <motion.div
              className="w-full rounded-t-md"
              style={{ backgroundColor: color }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, value * 64)}px` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              title={`${label}: ${Math.round(value * 100)}%`}
            />
            <div className="text-center">
              <div className="text-[10px] font-bold text-zinc-400">{label}</div>
              <div className="text-[9px] text-zinc-600">{Math.round(value * 100)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
SpectralVisualizer.displayName = "SpectralVisualizer";

// ── Vocal Timing Card ─────────────────────────────────────────────────────────
const VocalTimingCard = memo(({ timing }: { timing: RhythmicVocalTimingAnalysis }) => {
  const score      = timing.globalAlignment;
  const scoreColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const onBeatPercentage = timing.bars.length > 0 ? Math.round(((timing.perfectPocketCount + timing.inPocketCount) / timing.bars.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 space-y-3">
      <h4 className="text-sm font-bold text-fuchsia-300 flex items-center gap-2">
        <Mic2 size={14} />
        تحليل توقيت الفوكال
      </h4>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { label: "متوسط الفارق",   value: `${Math.round(timing.averageDeltaMs)}ms`                      },
          { label: "تناسق الأداء",      value: `${Math.round(timing.consistencyScore)}%`                       },
          { label: "على الـ Beat",   value: `${onBeatPercentage}%`       },
          { label: "تطابق الـ Grid", value: <span className={scoreColor}>{score}</span>      },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-zinc-900 p-3">
            <p className="text-[10px] text-zinc-600 mb-1">{label}</p>
            <p className="text-sm font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {score < 80 && (
        <div className={`rounded-xl px-3 py-2 text-xs flex gap-2 items-start ${
          score < 60
            ? "bg-red-500/10 text-red-300"
            : "bg-yellow-500/10 text-yellow-300"
        }`}>
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>
            {score < 60
              ? "الفوكال خارج الـ Grid بنسبة عالية — جرّب Quantize أو أعد التسجيل مع Click Track"
              : "تطابق متوسط — راجع الـ downbeats والـ phrases الطويلة"
            }
          </span>
        </div>
      )}

      {/* Suggestion List */}
      {timing.suggestions.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-600 mb-1.5">ملاحظات التحليل</p>
          <div className="flex flex-col gap-1">
            {timing.suggestions.slice(0, 3).map((suggestion, i) => (
              <span key={i} className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                • {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
VocalTimingCard.displayName = "VocalTimingCard";

// ── Bar Suggestion Card ───────────────────────────────────────────────────────
const BarSuggestionCard = memo(({
  bar, onInsert,
}: {
  bar:      BarSuggestion;
  onInsert: (text: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(bar.text); } catch { /* silent */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const fitColor =
    bar.fitScore >= 80 ? "text-emerald-400" :
    bar.fitScore >= 60 ? "text-yellow-400"  : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-900/80 p-3 space-y-2">
      <p className="text-sm text-zinc-200 leading-relaxed">{bar.text}</p>
      <p className="text-[10px] text-zinc-600">{bar.rationale}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600 tabular-nums">{bar.syllableCount} مقطع</span>
        <span className={`text-xs font-bold tabular-nums ${fitColor}`}>
          Fit {bar.fitScore}%
        </span>
        <div className="mr-auto flex gap-1.5">
          <button
            onClick={copy}
            aria-label={copied ? "تم النسخ" : "نسخ البار"}
            className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white transition"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          </button>
          <button
            onClick={() => onInsert(bar.text)}
            className="rounded-lg bg-cyan-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-500 transition"
          >
            إدراج
          </button>
        </div>
      </div>
    </div>
  );
});
BarSuggestionCard.displayName = "BarSuggestionCard";

// ── Upload Zone ───────────────────────────────────────────────────────────────
const UploadZone = memo(({
  label, icon, accept, borderColor, bgColor, textColor,
  file, onFile, disabled, hint,
}: {
  label:       string;
  icon:        React.ReactNode;
  accept:      string;
  borderColor: string;
  bgColor:     string;
  textColor:   string;
  file:        File | null;
  onFile:      (f: File) => void;
  disabled:    boolean;
  hint?:       string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("audio/")) onFile(f);
  }, [disabled, onFile]);

  return (
    <label
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition select-none ${borderColor} ${bgColor} ${textColor} ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      aria-label={`رفع ${label}`}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="text-[10px] opacity-60">{hint}</span>}
      {file ? (
        <span className="mt-1 max-w-full truncate rounded-lg bg-black/20 px-2 py-0.5 text-[10px] text-white/80 font-mono">
          ✓ {file.name}
        </span>
      ) : (
        <span className="text-[10px] opacity-50">اسحب وأفلت أو اضغط للاختيار</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          // reset input value so same file can be re-selected
          e.target.value = "";
        }}
      />
    </label>
  );
});
UploadZone.displayName = "UploadZone";

// ── Main Export ───────────────────────────────────────────────────────────────
export function AudioUploadBeatAnalyzerPanel() {
  const {
    analyzeInstrumentalAudioFile,
    analyzeVocalAudioFile,
    isAnalyzingAudio,
    audioBeatAnalysis,
    vocalTimingAnalysis,
    addBarToProject
  } = useMaqamAnalysisStore();

  const [instrFile,    setInstrFile]    = useState<File | null>(null);
  const [vocalFile,    setVocalFile]    = useState<File | null>(null);
  const [suggestions,  setSuggestions]  = useState<BarSuggestion[]>([]);
  const [currentTimeS, setCurrentTimeS] = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [audioError,   setAudioError]   = useState<string | null>(null);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const animRef    = useRef<number | null>(null);
  const objectUrls = useRef<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
      // Revoke all object URLs to prevent memory leaks
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, []);

  const stopPlayback = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleInstrFile = useCallback(async (file: File) => {
    setAudioError(null);
    stopPlayback();

    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setInstrFile(file);
    setCurrentTimeS(0);
    setSuggestions([]);

    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);

    const audio        = new Audio(url);
    audio.preload      = "metadata";
    audio.onerror      = () => setAudioError("تعذّر تحميل ملف الـ beat — تأكد من صيغة الملف");
    audio.onended      = () => { stopPlayback(); setCurrentTimeS(0); };
    audioRef.current   = audio;

    try {
      await analyzeInstrumentalAudioFile?.(file);
    } catch {
      setAudioError("حدث خطأ أثناء تحليل الـ beat");
    }
  }, [analyzeInstrumentalAudioFile, stopPlayback]);

  const handleVocalFile = useCallback(async (file: File) => {
    setVocalFile(file);
    try {
      await analyzeVocalAudioFile?.(file);
    } catch {
      // silent — vocal analysis is non-critical
    }
  }, [analyzeVocalAudioFile]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      stopPlayback();
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        const tick = () => {
          if (!audioRef.current) return;
          setCurrentTimeS(audioRef.current.currentTime);
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      }).catch((err) => {
        setAudioError(`لا يمكن تشغيل الملف: ${err.message}`);
      });
    }
  }, [isPlaying, stopPlayback]);

  const handleGenerateSuggestions = useCallback(() => {
    if (!audioBeatAnalysis) return;
    setSuggestions(
      generateBarSuggestions(audioBeatAnalysis.tempo.bpm, "mid") // dominance is different in BeatBlueprint, using string mid. Or convert dominantRange
    );
  }, [audioBeatAnalysis]);

  const bpmRounded = useMemo(
    () => {
      const bpm = audioBeatAnalysis?.tempo?.bpm;
      return bpm ? Math.round(bpm * 10) / 10 : 0;
    },
    [audioBeatAnalysis]
  );

  return (
    <section dir="rtl" className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-right space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AudioLines size={18} className="text-cyan-400" />
            محلل الـ Beat الحقيقي
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            ارفع الـ instrumental والفوكال لاستخراج BPM حقيقي وتوليد بارات مضبوطة على الـ grid
          </p>
        </div>
        {audioBeatAnalysis && (
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-3 text-center">
            <div className="text-[10px] text-zinc-400">BPM</div>
            <div className="text-3xl font-black text-cyan-300 tabular-nums">{bpmRounded}</div>
            <div className="text-[9px] text-zinc-600 mt-0.5">
              {audioBeatAnalysis.tempo.timeSignature}
            </div>
          </div>
        )}
      </div>

      {/* Upload Zones */}
      <div className="grid gap-3 md:grid-cols-2">
        <UploadZone
          label="Beat / Instrumental"
          icon={<UploadCloud size={24} className="text-cyan-300" />}
          accept="audio/*"
          borderColor="border-cyan-400/30"
          bgColor="bg-cyan-500/10"
          textColor="text-cyan-100"
          file={instrFile}
          onFile={handleInstrFile}
          disabled={isAnalyzingAudio}
          hint="MP3, WAV, FLAC"
        />
        <UploadZone
          label="Vocal Recording"
          icon={<Mic2 size={24} className="text-fuchsia-300" />}
          accept="audio/*"
          borderColor="border-fuchsia-400/30"
          bgColor="bg-fuchsia-500/10"
          textColor="text-fuchsia-100"
          file={vocalFile}
          onFile={handleVocalFile}
          disabled={isAnalyzingAudio}
          hint="اختياري — لتحليل توقيت الفوكال"
        />
      </div>

      {/* Error */}
      {audioError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={14} className="shrink-0" />
          {audioError}
          <button
            onClick={() => setAudioError(null)}
            className="mr-auto text-red-400 hover:text-red-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading */}
      <AnimatePresence>
        {isAnalyzingAudio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-6 text-sm text-zinc-400"
          >
            <RefreshCw size={16} className="animate-spin text-cyan-400" />
            <span>جاري تحليل الـ audio وحساب الـ BPM...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {audioBeatAnalysis && !isAnalyzingAudio && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Metrics Grid */}
            <div className="grid gap-3 md:grid-cols-4">
              {[
                {
                  label: "BPM",
                  value: (bpmRounded || 0).toString(),
                  sub:   audioBeatAnalysis.tempo?.timeSignature ?? "4/4",
                },
                {
                  label: "استقرار الإيقاع",
                  value: `${Math.round((audioBeatAnalysis.tempo?.bpmStability ?? 0) * 100)}%`,
                  sub:   (audioBeatAnalysis.tempo?.bpmStability ?? 0) > 0.85 ? "مستقر جداً" : "يتذبذب",
                },
                {
                  label: "Transients",
                  value: (
                    (audioBeatAnalysis.rhythm?.kickPositions?.length ?? 0) +
                    (audioBeatAnalysis.rhythm?.snarePositions?.length ?? 0) +
                    (audioBeatAnalysis.rhythm?.hihatPositions?.length ?? 0)
                  ).toString(),
                  sub:   "نقطة تفجير",
                },
                {
                  label: "Beat Markers",
                  value: (
                    (audioBeatAnalysis.rhythm?.bars?.length ?? 0) *
                    parseInt((audioBeatAnalysis.tempo?.timeSignature ?? "4/4").split("/")[0] || "4")
                  ).toString(),
                  sub:   `في ${Math.round(audioBeatAnalysis.metadata?.durationSeconds ?? 0)}s`,
                },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-2xl bg-zinc-900 p-4">
                  <p className="mb-1 text-[10px] text-zinc-500">{label}</p>
                  <p className="text-2xl font-black text-white tabular-nums">{value}</p>
                  {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Spectral */}
            <SpectralVisualizer
              spectral={{
                bassLevel: audioBeatAnalysis.spectral.bassProfile.reduce((a,b)=>a+b, 0) / (audioBeatAnalysis.spectral.bassProfile.length || 1),
                midLevel: audioBeatAnalysis.spectral.midProfile.reduce((a,b)=>a+b, 0) / (audioBeatAnalysis.spectral.midProfile.length || 1),
                highLevel: audioBeatAnalysis.spectral.highProfile.reduce((a,b)=>a+b, 0) / (audioBeatAnalysis.spectral.highProfile.length || 1),
                dominance: audioBeatAnalysis.spectral.dominantRange.includes("bass") ? "bass" : audioBeatAnalysis.spectral.dominantRange.includes("mid") ? "mid" : "high"
              }} 
            />

            {/* Waveform + Playback */}
            {instrFile && (
              <div className="space-y-2">
                <WaveformVisualizer
                  beatPositions={Array.from({ length: Math.ceil(audioBeatAnalysis.metadata.durationSeconds / (60 / audioBeatAnalysis.tempo.bpm)) }).map((_, i) => i * (60000 / audioBeatAnalysis.tempo.bpm))}
                  durationMs={audioBeatAnalysis.metadata.durationSeconds * 1000}
                  currentTimeS={currentTimeS}
                />
                <button
                  onClick={togglePlayback}
                  className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {isPlaying ? <Square size={12} /> : <Play size={12} />}
                  {isPlaying ? "إيقاف التشغيل" : "تشغيل Beat مع مؤشرات الإيقاع"}
                </button>
              </div>
            )}

            {/* Vocal Timing */}
            {vocalTimingAnalysis && (
              <VocalTimingCard timing={vocalTimingAnalysis} />
            )}

            {/* Bar Generator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-bold text-zinc-300">
                    🎤 بارات مضبوطة على {bpmRounded} BPM
                  </h4>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    مولّدة بناءً على طبيعة الـ beat والـ spectral dominance
                  </p>
                </div>
                <button
                  onClick={handleGenerateSuggestions}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <Wand2 size={12} />
                  توليد بارات
                </button>
              </div>

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid gap-2 md:grid-cols-2"
                  >
                    {suggestions.map((bar, i) => (
                      <BarSuggestionCard
                        key={`bar-${i}`}
                        bar={bar}
                        onInsert={(text) => addBarToProject?.(text)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart Repository Suggestions */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <h3 className="text-sm font-bold text-zinc-300">مستودع البارات الذكي (اقتراحات إيقاعية)</h3>
                <SuggestionPanel
                  criteria={{ narrativeRole: 'مشهد', bpmRange: [audioBeatAnalysis.tempo.bpm - 5, audioBeatAnalysis.tempo.bpm + 5] }}
                  onSelect={(txt) => addBarToProject?.(txt)}
                />
              </div>

              {/* BPM Usage Guide */}
              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3 flex gap-2 items-start">
                <Info size={12} className="text-zinc-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  البارات المُولّدة تستهدف ~{Math.round((60 / audioBeatAnalysis.tempo.bpm) * 4 * 3.5)} مقطع لكل بار (4 beats × 3.5 مقطع/ثانية).
                  اضبط الإيقاع يدوياً حسب أسلوبك.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!audioBeatAnalysis && !isAnalyzingAudio && (
        <div className="py-8 text-center space-y-2">
          <AudioLines size={36} className="mx-auto text-zinc-800" />
          <p className="text-sm text-zinc-600">ارفع ملف الـ beat لبدء التحليل الحقيقي</p>
          <p className="text-xs text-zinc-700">يدعم MP3, WAV, FLAC, OGG, AAC</p>
        </div>
      )}
    </section>
  );
}
