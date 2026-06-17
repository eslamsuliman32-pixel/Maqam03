// src/maqam/components/HookEngineeringPanel.tsx
import React, { useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, Brain, Copy, RefreshCw, Sparkles, Check, TrendingUp } from "lucide-react";
import { useMaqamAnalysisStore } from "../store/maqamAnalysis.store";
import type { HookAnalysis } from "../types/hook.types";
import { SuggestionPanel } from "../../components/SuggestionPanel";

// ── Hook Pattern Engine ───────────────────────────────────────────────────────
interface HookPattern {
  id:       string;
  label:    string;
  desc:     string;
  template: (kw: string) => string;
  /** يُقدّر جودة النمط بناءً على خصائص الكلمة */
  scoreHeuristic: (kw: string) => number;
}

const HOOK_PATTERNS: HookPattern[] = [
  {
    id:    "repetition",
    label: "تكرار التأسيس",
    desc:  "يثبّت الكلمة في الذاكرة بثلاثية متصاعدة",
    template: (kw) => `${kw}، ${kw}، والله ${kw}`,
    scoreHeuristic: (kw) => 75 + Math.min(kw.length * 2, 20),
  },
  {
    id:    "contrast",
    label: "المفارقة الحادة",
    desc:  "يخلق توتراً دراميًا بالتضاد",
    template: (kw) => `كل شيء وما فيش ${kw}`,
    scoreHeuristic: (kw) => 70 + Math.min(kw.length, 15),
  },
  {
    id:    "question",
    label: "السؤال الفلسفي",
    desc:  "يفتح حواراً داخلياً مع المستمع",
    template: (kw) => `إيه معنى ${kw} من غير ما تكون معايا؟`,
    scoreHeuristic: (kw) => 68 + Math.min(kw.length * 1.5, 18),
  },
  {
    id:    "affirmation",
    label: "التأكيد المضغوط",
    desc:  "يوصل المعنى بأقل عدد ممكن من الكلمات",
    template: (kw) => `${kw} وبس، ${kw} وكفى`,
    scoreHeuristic: (kw) => 72 + Math.min(kw.length * 1.8, 22),
  },
  {
    id:    "inversion",
    label: "القلب الدرامي",
    desc:  "يعكس التوقعات ويخلق مفاجأة",
    template: (kw) => `مش ${kw}، إنت اللي بتتوه`,
    scoreHeuristic: (kw) => 65 + Math.min(kw.length * 2.2, 25),
  },
  {
    id:    "temporal",
    label: "البُعد الزمني",
    desc:  "يربط الحاضر بالماضي أو المستقبل",
    template: (kw) => `كنت مصدقش إن ${kw} ممكن يخلّص`,
    scoreHeuristic: (kw) => 66 + Math.min(kw.length, 20),
  },
];

/** إزالة كلمات الحشو للضغط الدلالي */
const FILLER_WORDS = new Set([
  "وهو","وهي","كمان","برضو","بس","يعني","إن","ما",
  "دا","دي","ده","في","على","من","عن","مع",
]);

function compressSemantics(text: string): string {
  const words = text.split(/\s+/);
  const compressed = words.filter((w) => !FILLER_WORDS.has(w.trim()));
  // نتأكد من إبقاء الحد الأدنى من الكلمات لأن الضغط الزائد يكسر المعنى
  return compressed.length >= 3 ? compressed.join(" ") : text;
}

/** تطبيق التناظر الصوتي */
function applySymmetryFix(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length < 4) return text; // لا يستحق التقسيم

  const half   = Math.ceil(words.length / 2);
  const first  = words.slice(0, half).join(" ");
  const second = words.slice(half).join(" ");
  return `${first} | ${second}`;
}

function generateHookVariants(keywords: string[]): {
  pattern: string;
  desc:    string;
  text:    string;
  score:   number;
}[] {
  if (!keywords.length) return [];

  // نستخدم أهم كلمة مفتاحية أو نجمع أول اثنتين
  const primaryKw   = keywords[0];
  const secondaryKw = keywords[1] ?? "";

  return HOOK_PATTERNS.map((p) => {
    const kw    = p.id === "contrast" && secondaryKw ? secondaryKw : primaryKw;
    const text  = p.template(kw);
    const score = Math.min(95, Math.round(p.scoreHeuristic(kw)));
    return { pattern: p.label, desc: p.desc, text, score };
  }).sort((a, b) => b.score - a.score); // ترتيب تنازلي حسب الجودة
}

// ── Sub-Components ────────────────────────────────────────────────────────────
const MetricBar = memo(({
  label, value, color = "from-fuchsia-500 to-orange-300", icon,
}: {
  label:  string;
  value:  number;
  color?: string;
  icon?:  React.ReactNode;
}) => (
  <div className="rounded-2xl bg-zinc-900 p-4">
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-zinc-400">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-xs">{label}</span>
      </div>
      <span className="font-black text-white tabular-nums">{value}</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  </div>
));
MetricBar.displayName = "MetricBar";

const HookVariantCard = memo(({
  pattern, desc, text, score, onApply,
}: {
  pattern:  string;
  desc:     string;
  text:     string;
  score:    number;
  onApply:  (t: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const scoreColor =
    score >= 80 ? "text-emerald-400" :
    score >= 70 ? "text-cyan-400"    : "text-yellow-400";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* silent */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-zinc-900 p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-fuchsia-400">{pattern}</span>
          <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
        </div>
        <span className={`text-sm font-black tabular-nums ${scoreColor}`}>{score}</span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-200 bg-zinc-800/50 rounded-xl px-3 py-2">
        {text}
      </p>
      <div className="flex gap-2 mt-auto">
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white transition"
          aria-label={copied ? "تم النسخ" : "نسخ الهوك"}
        >
          {copied
            ? <Check size={12} className="text-emerald-400" />
            : <Copy size={12} />
          }
          {copied ? "تم" : "نسخ"}
        </button>
        <button
          onClick={() => onApply(text)}
          className="rounded-lg bg-fuchsia-600/80 px-3 py-1 text-xs font-semibold text-white hover:bg-fuchsia-500 transition flex-1 text-center"
        >
          استخدام كهوك رئيسي
        </button>
      </div>
    </motion.div>
  );
});
HookVariantCard.displayName = "HookVariantCard";

// ── Production Result Block ───────────────────────────────────────────────────
function ProductionResult({
  label, content, colorClass, onCopy, onApply, applyLabel,
}: {
  label:      string;
  content:    string;
  colorClass: string;
  onCopy:     () => void;
  onApply:    () => void;
  applyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(content); } catch { /* silent */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 space-y-2 ${colorClass}`}
    >
      <p className="text-xs font-bold">{label}</p>
      <p className="text-sm text-zinc-200 leading-relaxed">{content}</p>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white transition"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          {copied ? "تم" : "نسخ"}
        </button>
        <button
          onClick={onApply}
          className="rounded-lg bg-zinc-700 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-600 transition"
        >
          {applyLabel}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function HookEngineeringPanel() {
  const {
    hookAnalysis,
    runTier2Analysis,
    applyHookText
  } = useMaqamAnalysisStore();

  const [variants,     setVariants]    = useState<ReturnType<typeof generateHookVariants>>([]);
  const [symmetryVer,  setSymmetryVer] = useState<string | null>(null);
  const [compressed,   setCompressed]  = useState<string | null>(null);
  const [activeTab,    setActiveTab]   = useState<"metrics" | "produce">("metrics");
  const [isGenerating, setIsGenerating] = useState(false);

  const overallScore = useMemo(() => {
    if (!hookAnalysis) return 0;
    const { memorabilityScore, symmetryScore, semanticCompressionScore, cadenceScore } = hookAnalysis;
    return Math.round(
      memorabilityScore * 0.4 +
      symmetryScore     * 0.2 +
      semanticCompressionScore * 0.2 +
      cadenceScore      * 0.2
    );
  }, [hookAnalysis]);

  const handleGenerateVariants = useCallback(async () => {
    if (!hookAnalysis) return;
    setIsGenerating(true);
    // نضيف تأخيراً رمزياً لإظهار حالة التحميل
    await new Promise((r) => setTimeout(r, 300));
    setVariants(generateHookVariants(hookAnalysis.keywords));
    setActiveTab("produce");
    setIsGenerating(false);
  }, [hookAnalysis]);

  const handleSymmetryFix = useCallback(() => {
    if (!hookAnalysis) return;
    const result = applySymmetryFix(hookAnalysis.hookText);
    setSymmetryVer(result !== hookAnalysis.hookText ? result : hookAnalysis.hookText + " | " + hookAnalysis.hookText.slice(0, 8) + "...");
  }, [hookAnalysis]);

  const handleCompress = useCallback(() => {
    if (!hookAnalysis) return;
    const result = compressSemantics(hookAnalysis.hookText);
    setCompressed(result);
  }, [hookAnalysis]);

  if (!hookAnalysis) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-right space-y-4" dir="rtl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Anchor size={18} className="text-fuchsia-400" />
          هندسة الهوك
        </h2>
        <p className="text-sm text-zinc-500">
          يتطلب تحليل النص أولاً لاستخراج اللحظة الأكثر تذكراً وبدء إنتاج البدائل.
        </p>
        <button
          onClick={() => runTier2Analysis(true)}
          className="rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-500 transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
        >
          تحليل وبدء إنتاج الهوك
        </button>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-right space-y-5"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Anchor size={18} className="text-fuchsia-400" />
            هندسة الهوك
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">ولّد، عدّل، وطبّق الهوك مباشرةً على مشروعك</p>
        </div>
        <div className="rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 px-4 py-3 text-center">
          <div className="text-[10px] text-zinc-400 mb-0.5">الدرجة الكلية</div>
          <div className="text-3xl font-black text-fuchsia-300 tabular-nums">{overallScore}</div>
          <div className="text-[9px] text-zinc-600 mt-0.5">Memorability: {hookAnalysis.memorabilityScore}</div>
        </div>
      </div>

      {/* Current Hook */}
      <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 space-y-3">
        <div className="text-xs text-zinc-500">الهوك الحالي</div>
        <p className="text-base font-semibold text-white leading-relaxed">{hookAnalysis.hookText}</p>
        {hookAnalysis.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hookAnalysis.keywords.map((kw: string) => (
              <span
                key={kw}
                className="rounded-lg bg-fuchsia-500/20 px-2 py-0.5 text-xs font-bold text-fuchsia-300"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2" role="tablist">
        {(["metrics", "produce"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-1 focus:ring-fuchsia-400 ${
              activeTab === tab
                ? "bg-fuchsia-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {tab === "metrics" ? "📊 المقاييس" : "🎛️ الإنتاج"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "metrics" && (
          <motion.div
            key="metrics"
            role="tabpanel"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <MetricBar label="التناظر الصوتي"   value={hookAnalysis.symmetryScore}            color="from-fuchsia-500 to-orange-300" />
            <MetricBar label="التكثيف الدلالي"  value={hookAnalysis.semanticCompressionScore} color="from-cyan-500 to-blue-400"       />
            <MetricBar label="الكادنس الإيقاعي"  value={hookAnalysis.cadenceScore}             color="from-violet-500 to-pink-400"    />
            <MetricBar label="المفارقة الثقافية" value={hookAnalysis.culturalSurpriseScore}    color="from-orange-500 to-red-400"     />

            {/* Suggestions */}
            {hookAnalysis.suggestions.length > 0 && (
              <div className="md:col-span-2 xl:col-span-4 rounded-2xl bg-zinc-900/60 p-4">
                <h3 className="mb-2 text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  توصيات تحسين الهوك
                </h3>
                <ul className="space-y-1.5">
                  {hookAnalysis.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-500 flex gap-1.5">
                      <span className="text-fuchsia-600 shrink-0">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "produce" && (
          <motion.div
            key="produce"
            role="tabpanel"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerateVariants}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
              >
                {isGenerating
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Sparkles size={13} />
                }
                توليد {HOOK_PATTERNS.length} بدائل
              </button>
              <button
                onClick={handleSymmetryFix}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition focus:outline-none focus:ring-1 focus:ring-violet-400"
              >
                <Brain size={13} />
                تناظر صوتي تلقائي
              </button>
              <button
                onClick={handleCompress}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <RefreshCw size={13} />
                ضغط دلالي
              </button>
            </div>

            {/* Production Results */}
            {symmetryVer && (
              <ProductionResult
                label="✦ نسخة التناظر الصوتي"
                content={symmetryVer}
                colorClass="border-violet-500/30 bg-violet-500/10 text-violet-400"
                onCopy={() => navigator.clipboard.writeText(symmetryVer).catch(() => {})}
                onApply={() => applyHookText?.(symmetryVer)}
                applyLabel="تطبيق كهوك رئيسي"
              />
            )}

            {compressed && compressed !== hookAnalysis.hookText && (
              <ProductionResult
                label="✦ نسخة مضغوطة دلالياً"
                content={compressed}
                colorClass="border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                onCopy={() => navigator.clipboard.writeText(compressed).catch(() => {})}
                onApply={() => applyHookText?.(compressed)}
                applyLabel="تطبيق كهوك رئيسي"
              />
            )}

            {/* Variants Grid */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400">البدائل المولّدة (مرتبة حسب الجودة)</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {variants.map((v) => (
                    <HookVariantCard
                      key={v.pattern}
                      {...v}
                      onApply={(t) => applyHookText?.(t)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <h3 className="mb-3 text-xs font-bold text-zinc-300">مستودع البارات الذكي (اقتراحات إضافية للهوك)</h3>
              <SuggestionPanel
                criteria={{ narrativeRole: 'هوك', keyword: hookAnalysis.keywords?.[0] }}
                onSelect={(txt) => applyHookText?.(txt)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
