// src/maqam/components/SonicSemanticHeatmap.tsx
"use client";
import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMaqamStore, type EmotionTarget } from "../../store/maqamStore";
import { cn } from "../../lib/utils";

// ─── Phonetic Profiles ────────────────────────────────────
interface PhoneticProfile {
  heavy: number;   // انفجاري: ق ك ط ض
  medium: number;  // متوسط: ب د ت ف
  soft: number;    // ناعم: م ن ل و ي ه
  fricative: number; // احتكاكي: س ش ح خ
  nasal: number;   // أنفي: م ن
  liquid: number;  // سائل: ل ر
  glottal: number; // حلقي: ع ح ه
}

// ─── Emotion Target Profiles ──────────────────────────────
const EMOTIONPROFILES: Record<EmotionTarget, PhoneticProfile & { label: string; arabicLabel: string; color: string; description: string }> = {
  explosive: {
    heavy: 0.8, medium: 0.5, soft: 0.1, fricative: 0.3, nasal: 0.1, liquid: 0.2, glottal: 0.4,
    label: "Explosive", arabicLabel: "انفجاري 💥", color: "#EF4444",
    description: "نصوص قوية ومكثفة — تسيطر الحروف الثقيلة والمنفجرة",
  },
  smooth: {
    heavy: 0.1, medium: 0.3, soft: 0.9, fricative: 0.4, nasal: 0.7, liquid: 0.8, glottal: 0.2,
    label: "Smooth", arabicLabel: "ناعم 🌊", color: "#06B6D4",
    description: "تدفق سلس — تهيمن حروف اللين والسائلة",
  },
  melancholic: {
    heavy: 0.2, medium: 0.4, soft: 0.7, fricative: 0.5, nasal: 0.8, liquid: 0.6, glottal: 0.5,
    label: "Melancholic", arabicLabel: "حزين 🌧", color: "#8B5CF6",
    description: "عمق مشاعري — الحروف الأنفية والحلقية تحمل الألم",
  },
  aggressive: {
    heavy: 0.9, medium: 0.6, soft: 0.05, fricative: 0.5, nasal: 0.1, liquid: 0.2, glottal: 0.6,
    label: "Aggressive", arabicLabel: "عدواني ⚡", color: "#F97316",
    description: "طاقة هجومية — هيمنة مطلقة للحروف الثقيلة",
  },
  ethereal: {
    heavy: 0.05, medium: 0.2, soft: 1.0, fricative: 0.6, nasal: 0.5, liquid: 0.9, glottal: 0.1,
    label: "Ethereal", arabicLabel: "أثيري ✨", color: "#10B981",
    description: "خفة وشفافية — الحروف السائلة والخفيفة تصنع الغموض",
  },
  raw: {
    heavy: 0.5, medium: 0.7, soft: 0.3, fricative: 0.7, nasal: 0.3, liquid: 0.4, glottal: 0.8,
    label: "Raw", arabicLabel: "خام 🔥", color: "#F59E0B",
    description: "خشن وحقيقي — توازن حاد مع طغيان الاحتكاكي والحلقي",
  },
};

// ─── Advanced Spectral Calculator ─────────────────────────
function calcAdvancedSpectral(text: string): PhoneticProfile {
  const total = text.replace(/\s/g, "").length || 1;

  const heavy     = (text.match(/[قكطضجغعظذخص]/g) ?? []).length;
  const medium    = (text.match(/[بدتفزسش]/g) ?? []).length;
  const soft      = (text.match(/[ويها]/g) ?? []).length;
  const fricative = (text.match(/[سشحخفث]/g) ?? []).length;
  const nasal     = (text.match(/[من]/g) ?? []).length;
  const liquid    = (text.match(/[لر]/g) ?? []).length;
  const glottal   = (text.match(/[عحهء]/g) ?? []).length;

  const normalize = (n: number) => Math.min(1, (n / total) * 5);

  return {
    heavy:     normalize(heavy),
    medium:    normalize(medium),
    soft:      normalize(soft),
    fricative: normalize(fricative),
    nasal:     normalize(nasal),
    liquid:    normalize(liquid),
    glottal:   normalize(glottal),
  };
}

// ─── Phonetic Distance ────────────────────────────────────
function calcPhoneticDistance(actual: PhoneticProfile, target: PhoneticProfile): number {
  const keys = Object.keys(actual) as (keyof PhoneticProfile)[];
  const sumSq = keys.reduce((sum, key) => {
    return sum + Math.pow(actual[key] - target[key], 2);
  }, 0);
  return Math.sqrt(sumSq / keys.length);
}

function calcMatchScore(actual: PhoneticProfile, target: PhoneticProfile): number {
  const distance = calcPhoneticDistance(actual, target);
  return Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
}

// ─── Rewrite Suggestion Engine ────────────────────────────
interface RewriteSuggestion {
  original: string;
  suggestion: string;
  reason: string;
  delta: number; // improvement %
}

function generateRewriteSuggestions(
  text: string,
  emotion: EmotionTarget
): RewriteSuggestion[] {
  const profile = EMOTIONPROFILES[emotion];
  const suggestions: RewriteSuggestion[] = [];

  const words = text.split(/\s+/);
  const substitutions: Record<EmotionTarget, Record<string, string>> = {
    explosive: { صوت: "قصف", ضوء: "طاقة", كلام: "قضية", نار: "طغيان" },
    smooth:    { قوة: "مياه", طاقة: "نسيم", صراع: "تناغم", ضجيج: "هدوء" },
    melancholic: { فرح: "حنين", قوة: "ألم", نصر: "وداع", حياة: "ذكرى" },
    aggressive: { سلام: "حرب", كلمة: "ضربة", صمت: "صراخ", هدوء: "عاصفة" },
    ethereal:  { كثير: "قليل", ثقيل: "خفيف", واضح: "ضبابي", قريب: "بعيد" },
    raw:       { جميل: "حقيقي", لطيف: "خشن", هادئ: "صريح", مهذب: "صادق" },
  };

  const targetSubs = (substitutions[emotion] as Record<string, string>) ?? {};

  words.forEach((word) => {
    const sub = targetSubs[word];
    if (sub) {
      const originalScore = calcMatchScore(calcAdvancedSpectral(word), profile);
      const newScore = calcMatchScore(calcAdvancedSpectral(sub), profile);
      if (newScore > originalScore) {
        suggestions.push({
          original: word,
          suggestion: sub,
          reason: `تحسين التوافق الصوتي من ${originalScore}% إلى ${newScore}%`,
          delta: newScore - originalScore,
        });
      }
    }
  });

  return suggestions.sort((a, b) => b.delta - a.delta).slice(0, 5);
}

// ─── Radar Chart Component ────────────────────────────────
const PhoneticRadar: React.FC<{
  actual: PhoneticProfile;
  target: PhoneticProfile;
  color: string;
}> = ({ actual, target, color }) => {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const keys = Object.keys(actual) as (keyof PhoneticProfile)[];
  const labels: Record<keyof PhoneticProfile, string> = {
    heavy: "ثقيل", medium: "متوسط", soft: "ناعم",
    fricative: "احتكاكي", nasal: "أنفي", liquid: "سائل", glottal: "حلقي",
  };

  const getPoint = (angle: number, value: number) => ({
    x: cx + Math.cos(angle - Math.PI / 2) * r * value,
    y: cy + Math.sin(angle - Math.PI / 2) * r * value,
  });

  const actualPoints = keys.map((k, i) =>
    getPoint((2 * Math.PI * i) / keys.length, actual[k])
  );
  const targetPoints = keys.map((k, i) =>
    getPoint((2 * Math.PI * i) / keys.length, target[k])
  );

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1.0].map((scale) => (
        <circle
          key={scale}
          cx={cx} cy={cy}
          r={r * scale}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {keys.map((_, i) => {
        const angle = (2 * Math.PI * i) / keys.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Target polygon */}
      <path
        d={toPath(targetPoints)}
        fill={color + "18"}
        stroke={color + "60"}
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />

      {/* Actual polygon */}
      <motion.path
        d={toPath(actualPoints)}
        fill={color + "30"}
        stroke={color}
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Labels */}
      {keys.map((k, i) => {
        const angle = (2 * Math.PI * i) / keys.length - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (r + 14);
        const ly = cy + Math.sin(angle) * (r + 14);
        return (
          <text
            key={k}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={8}
            fontFamily="monospace"
          >
            {labels[k]}
          </text>
        );
      })}
    </svg>
  );
};

// ─── Heatmap Row ──────────────────────────────────────────
const HeatmapRow: React.FC<{
  label: string;
  actual: number;
  target: number;
  color: string;
}> = ({ label, actual, target, color }) => {
  const match = Math.max(0, 1 - Math.abs(actual - target));
  const barColor = match > 0.7 ? "#10B981" : match > 0.4 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-white/40">
        <span>{label}</span>
        <span style={{ color: barColor }}>{Math.round(match * 100)}%</span>
      </div>
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        {/* Target marker */}
        <div
          className="absolute top-0 w-0.5 h-full opacity-40"
          style={{ left: `${target * 100}%`, backgroundColor: color }}
        />
        {/* Actual bar */}
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor + "90" }}
          animate={{ width: `${actual * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
export const SonicSemanticHeatmap: React.FC = () => {
  const { heatmap, actions } = useMaqamStore();
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<RewriteSuggestion[]>([]);

  const emotionConfig = EMOTIONPROFILES[heatmap.targetEmotion];

  const spectral = useMemo(
    () => (text ? calcAdvancedSpectral(text) : null),
    [text]
  );

  const matchScore = useMemo(
    () =>
      spectral
        ? calcMatchScore(spectral, emotionConfig)
        : null,
    [spectral, emotionConfig]
  );

  const handleAnalyze = useCallback(() => {
    if (!text) return;
    const sug = generateRewriteSuggestions(text, heatmap.targetEmotion);
    setSuggestions(sug);
  }, [text, heatmap.targetEmotion]);

  const applysuggestion = useCallback(
    (original: string, replacement: string) => {
      setText((prev) => prev.replace(new RegExp(original, "g"), replacement));
    },
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left Panel: Input & Emotion ── */}
      <div className="space-y-4">
        {/* Emotion Selector */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 uppercase tracking-widest">
            المشاعر المستهدفة
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(EMOTIONPROFILES) as EmotionTarget[]).map((emotion) => {
              const cfg = EMOTIONPROFILES[emotion];
              const isActive = heatmap.targetEmotion === emotion;
              return (
                <motion.button
                  key={emotion}
                  onClick={() => actions.setTargetEmotion(emotion)}
                  className={cn(
                    "p-3 rounded-xl border text-xs transition-all text-center",
                    isActive
                      ? "text-black font-bold"
                      : "bg-white/3 border-white/10 text-white/40 hover:border-white/20"
                  )}
                  style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {cfg.arabicLabel}
                </motion.button>
              );
            })}
          </div>

          {/* Emotion description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={heatmap.targetEmotion}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[10px] text-white/30 leading-relaxed"
            >
              {emotionConfig.description}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 uppercase tracking-widest">
            النص المراد تحليله
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSuggestions([]);
            }}
            placeholder="أدخل كلمات الراب لتحليل طاقتها الصوتية…"
            className="w-full bg-white/3 border border-white/10 rounded-xl p-3 text-white/80 placeholder:text-white/20 text-sm outline-none resize-none min-h-[120px] focus:border-white/20 transition-colors"
            style={{ direction: "rtl" }}
            rows={5}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={!text}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-30 disabled:cursor-not-allowed"
            >
              تحليل الطاقة الصوتية
            </button>
            {text && (
              <button
                onClick={() => { setText(""); setSuggestions([]); }}
                className="px-4 py-2 rounded-lg text-xs text-white/30 hover:text-red-400 border border-white/10 transition-colors"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Heatmap Bars */}
        {spectral && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40">تحليل الطيف الصوتي</span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: emotionConfig.color }}
              >
                {matchScore}% توافق
              </span>
            </div>

            {(Object.keys(spectral) as (keyof PhoneticProfile)[]).map((key) => {
              const labels: Record<keyof PhoneticProfile, string> = {
                heavy: "ثقيل (ق ك ط ض)", medium: "متوسط (ب د ت ف)",
                soft: "ناعم (و ي ه ا)", fricative: "احتكاكي (س ش ح خ)",
                nasal: "أنفي (م ن)", liquid: "سائل (ل ر)", glottal: "حلقي (ع ح ه)",
              };
              return (
                <HeatmapRow
                  key={key}
                  label={labels[key]}
                  actual={spectral[key]}
                  target={emotionConfig[key]}
                  color={emotionConfig.color}
                />
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ── Right Panel: Radar & Suggestions ── */}
      <div className="space-y-4">
        {/* Match Score Circle */}
        {matchScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/3 rounded-xl p-6 border border-white/5 text-center space-y-3"
          >
            <div
              className="text-6xl font-bold tabular-nums"
              style={{ color: emotionConfig.color }}
            >
              {matchScore}
              <span className="text-2xl text-white/30">%</span>
            </div>
            <div className="text-xs text-white/30">
              مستوى التوافق مع المشاعر المستهدفة
            </div>
            <div className="flex justify-center">
              <div
                className="h-1.5 rounded-full w-full max-w-[200px]"
                style={{
                  background: "linear-gradient(90deg, #EF4444, #F59E0B, #10B981)",
                }}
              >
                <motion.div
                  className="w-3 h-3 rounded-full -mt-0.75 border-2 border-black"
                  style={{ backgroundColor: emotionConfig.color }}
                  animate={{ marginLeft: `${matchScore * 0.8}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Radar Chart */}
        {spectral && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/3 rounded-xl p-4 border border-white/5"
          >
            <p className="text-[10px] text-white/30 text-center mb-2 uppercase tracking-widest">
              رادار الطيف الصوتي
            </p>
            <PhoneticRadar
              actual={spectral}
              target={emotionConfig}
              color={emotionConfig.color}
            />
            <div className="flex justify-center gap-4 text-[9px] text-white/25 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 opacity-50" style={{ backgroundColor: emotionConfig.color, borderTop: "1px dashed" }} />
                النص الحالي
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 opacity-30" style={{ backgroundColor: emotionConfig.color }} />
                الهدف
              </div>
            </div>
          </motion.div>
        )}

        {/* Rewrite Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-3"
            >
              <p className="text-xs text-white/40 uppercase tracking-widest">
                اقتراحات إعادة الكتابة
              </p>
              {suggestions.map((sug, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 bg-white/3 rounded-lg border border-white/10"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white/40 line-through">{sug.original}</span>
                      <span className="text-white/20">→</span>
                      <span style={{ color: emotionConfig.color }} className="font-medium">
                        {sug.suggestion}
                      </span>
                      <span className="text-emerald-400 text-[10px]">+{sug.delta}%</span>
                    </div>
                    <p className="text-[10px] text-white/25">{sug.reason}</p>
                  </div>
                  <button
                    onClick={() => applysuggestion(sug.original, sug.suggestion)}
                    className="text-[10px] px-2 py-1 rounded-md text-black font-medium shrink-0 transition-opacity hover:opacity-80"
                    style={{ backgroundColor: emotionConfig.color }}
                  >
                    تطبيق
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
