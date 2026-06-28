"use client";
// ============================================================================
//  HeatmapLens.tsx — 🔥 بصمة المخارج
//  تُحوِّل النصوص إلى خريطة حرارية على مخارج الحروف العربية:
//    • 8 فئات مخرجية (شفوية، أسنانية، حلقية…)
//    • كثافة اللون تعكس تكرار الحروف في المجموعة الظاهرة
//    • نقر خلية → Brush على البارات الغنية بتلك الفئة
//    • تفاصيل إضافية: قائمة الحروف، النسبة، عدد البارات المؤثرة
// ============================================================================

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useObservatory } from "../ObservatoryContext";

// ── فئات المخارج ─────────────────────────────────────────────────────────────
interface PhonemeGroup {
  id: string;
  label: string;          // الاسم العربي للمخرج
  letters: string;        // الحروف التابعة (بدون مسافات)
  description: string;    // وصفٌ مختصر يساعد المؤدّي
  color: string;          // لون بارد→ساخن مُحدَّد مسبقاً
  hotColor: string;       // اللون عند الذروة
  icon: string;
}

const PHONEME_GROUPS: PhonemeGroup[] = [
  {
    id: "labial",
    label: "شفوية",
    letters: "بمو",
    description: "حروف تُنتَج بتلامس الشفتين — تمنح البار دفئاً وثقلاً",
    color: "#2D3A8C",
    hotColor: "#818CF8",
    icon: "👄",
  },
  {
    id: "labiodental",
    label: "شفوية أسنانية",
    letters: "ف",
    description: "الفاء — نَفَس خفيف منسجمٌ في البار الرومانسي",
    color: "#1E3A5F",
    hotColor: "#38BDF8",
    icon: "💨",
  },
  {
    id: "dental",
    label: "أسنانية",
    letters: "تدطضن",
    description: "حروف اللثة والأسنان — صلابةٌ إيقاعية في مقدمة الفم",
    color: "#3B2F6A",
    hotColor: "#A78BFA",
    icon: "🦷",
  },
  {
    id: "sibilant",
    label: "صفيرية",
    letters: "زسصش",
    description: "حروف الصفير — توترٌ وحدّةٌ تمزق الصمت",
    color: "#163020",
    hotColor: "#34D399",
    icon: "🌬️",
  },
  {
    id: "lateral",
    label: "جانبية/تكرارية",
    letters: "لر",
    description: "اللام والراء — سلاسةٌ وتدفقٌ موسيقي ممتد",
    color: "#1A2E4A",
    hotColor: "#60A5FA",
    icon: "🌊",
  },
  {
    id: "palatal",
    label: "غارية",
    letters: "جيش",
    description: "وسط اللسان — ليونةٌ وجمالٌ صوتي",
    color: "#2D1B4E",
    hotColor: "#C084FC",
    icon: "👅",
  },
  {
    id: "velar",
    label: "طبقية",
    letters: "كخغ",
    description: "مؤخّرة الحلق — عمقٌ وقوةٌ تُضخّم الكلمة",
    color: "#2D1800",
    hotColor: "#FB923C",
    icon: "🔉",
  },
  {
    id: "pharyngeal",
    label: "حلقية",
    letters: "حع",
    description: "الحاء والعين — طاقةٌ حشوية تميّز العربية وتُعمّق التأثير",
    color: "#3B1400",
    hotColor: "#F97316",
    icon: "🔊",
  },
  {
    id: "glottal",
    label: "حنجرية",
    letters: "هء",
    description: "الهاء والهمزة — انطلاقةٌ نفَسية تفتح الكلمة",
    color: "#1A0A00",
    hotColor: "#EF4444",
    icon: "🎤",
  },
  {
    id: "emphatic",
    label: "مُفخَّمة",
    letters: "طضظص",
    description: "الحروف المطبقة — ثقلٌ وقوةٌ تُهيمن على المقطع",
    color: "#1A0A1A",
    hotColor: "#F43F5E",
    icon: "💥",
  },
];

// ── تكرار الحروف في نص ────────────────────────────────────────────────────────
function letterFreq(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const ch of text.replace(/[^ء-ي]/g, "")) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  return freq;
}

// ── حساب الكثافة لكل فئة ────────────────────────────────────────────────────
interface GroupStats {
  group: PhonemeGroup;
  totalLetters: number;   // عدد الحروف في الفئة عبر كل البارات
  totalChars: number;     // الإجمالي
  pct: number;            // النسبة المئوية 0-100
  richBars: string[];     // معرّفات البارات الغنية بهذه الفئة (>15%)
  topLetter: string;      // الحرف الأكثر تكراراً في الفئة
}

function computeGroupStats(bars: { id: string; text: string }[]): GroupStats[] {
  // كل حروف النصوص مجتمعةً
  const globalFreq: Record<string, number> = {};
  let totalGlobal = 0;
  for (const bar of bars) {
    const freq = letterFreq(bar.text);
    for (const [ch, c] of Object.entries(freq)) {
      globalFreq[ch] = (globalFreq[ch] || 0) + c;
      totalGlobal += c;
    }
  }

  return PHONEME_GROUPS.map((group) => {
    const letters = group.letters.split("");
    const totalLetters = letters.reduce((s, ch) => s + (globalFreq[ch] || 0), 0);
    const pct = totalGlobal > 0 ? (totalLetters / totalGlobal) * 100 : 0;

    // البارات الغنية بهذه الفئة (>15% من حروفها)
    const richBars = bars
      .filter((bar) => {
        const freq = letterFreq(bar.text);
        const barTotal = Object.values(freq).reduce((s, c) => s + c, 0);
        if (!barTotal) return false;
        const barGroupCount = letters.reduce((s, ch) => s + (freq[ch] || 0), 0);
        return barGroupCount / barTotal > 0.15;
      })
      .map((b) => b.id);

    // الحرف الأسخن في الفئة
    const topLetter = letters.reduce(
      (best, ch) => (globalFreq[ch] || 0) > (globalFreq[best] || 0) ? ch : best,
      letters[0] || ""
    );

    return { group, totalLetters, totalChars: totalGlobal, pct, richBars, topLetter };
  });
}

// ── interpolate بين لونين بناءً على intensity ──────────────────────────────
function heatColor(cold: string, hot: string, t: number): string {
  // t ∈ [0,1]
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ] as [number, number, number];
  };
  const [cr, cg, cb] = parse(cold);
  const [hr, hg, hb] = parse(hot);
  const r = Math.round(cr + (hr - cr) * t);
  const g = Math.round(cg + (hg - cg) * t);
  const b = Math.round(cb + (hb - cb) * t);
  return `rgb(${r},${g},${b})`;
}

// ============================================================================
export const HeatmapLens: React.FC = () => {
  const { derivedBars, brush, clearBrush, vizSelection } = useObservatory();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const stats = useMemo(
    () => computeGroupStats(derivedBars.map((b) => ({ id: b.id, text: b.text }))),
    [derivedBars]
  );

  // أقصى نسبة لتطبيع الحرارة
  const maxPct = useMemo(() => Math.max(...stats.map((s) => s.pct), 1), [stats]);

  const selectedIds = useMemo(() => new Set(vizSelection?.barIds || []), [vizSelection]);

  const handleGroupClick = (stat: GroupStats) => {
    if (activeGroup === stat.group.id) {
      setActiveGroup(null);
      clearBrush();
      return;
    }
    setActiveGroup(stat.group.id);
    if (stat.richBars.length > 0) {
      brush(stat.richBars, {
        lens: "heatmap",
        label: `مخرج ${stat.group.label} — ${stat.richBars.length} بار`,
      });
    } else {
      clearBrush();
    }
  };

  const activeDetail = stats.find((s) => s.group.id === activeGroup) || null;

  if (!derivedBars.length) {
    return (
      <div className="w-full h-full min-h-[420px] flex items-center justify-center text-white/30 text-sm font-arabic">
        لا توجد بارات للعرض — عدّل الفلاتر
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4" dir="rtl">
      {/* ── رأس ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <div>
            <h2 className="text-sm font-black text-white font-arabic">بصمة المخارج</h2>
            <p className="text-[10px] text-white/30 font-arabic">
              {derivedBars.length} بار · انقر خليةً لتصفية البارات الغنية بمخرجها
            </p>
          </div>
        </div>
        {vizSelection && (
          <button
            onClick={() => { clearBrush(); setActiveGroup(null); }}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 hover:bg-amber-400/20 transition-colors font-arabic"
          >
            ✕ مسح التصفية
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex gap-4">
        {/* ── شبكة الخلايا ── */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 content-start">
          {stats.map((stat) => {
            const t = Math.min(1, stat.pct / maxPct);
            const bg = heatColor(stat.group.color, stat.group.hotColor, t);
            const isActive = activeGroup === stat.group.id;
            const hasRich = stat.richBars.length > 0;

            return (
              <motion.button
                key={stat.group.id}
                onClick={() => handleGroupClick(stat)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all text-right cursor-pointer ${
                  isActive
                    ? "border-white/30 ring-2 ring-white/20"
                    : "border-white/[0.06] hover:border-white/15"
                } ${!hasRich ? "opacity-50" : ""}`}
                style={{ backgroundColor: bg + "CC" }}
              >
                {/* مقياس الحرارة كشريط علوي */}
                <div className="absolute top-0 right-0 left-0 h-1 rounded-t-2xl overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: stat.group.hotColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl">{stat.group.icon}</span>
                  <span
                    className="text-xl font-black font-mono"
                    style={{ color: stat.group.hotColor }}
                  >
                    {stat.pct.toFixed(1)}%
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-black text-white font-arabic mb-0.5">
                    {stat.group.label}
                  </h3>
                  <div className="flex items-center gap-1 flex-wrap">
                    {stat.group.letters.split("").map((ch) => (
                      <span
                        key={ch}
                        className={`text-[11px] font-bold rounded px-1 font-arabic ${
                          ch === stat.topLetter
                            ? "text-white"
                            : "text-white/40"
                        }`}
                        style={ch === stat.topLetter ? { color: stat.group.hotColor } : {}}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                {/* عدد البارات الغنية */}
                <div
                  className="text-[9px] font-mono mt-auto"
                  style={{ color: stat.group.hotColor + "CC" }}
                >
                  {hasRich ? `${stat.richBars.length} بار غني` : "نادر"}
                </div>

                {isActive && (
                  <motion.div
                    layoutId="active-heat-ring"
                    className="absolute inset-0 rounded-2xl border-2"
                    style={{ borderColor: stat.group.hotColor }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── لوحة التفاصيل الجانبية ── */}
        <AnimatePresence>
          {activeDetail && (
            <motion.aside
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 240 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="shrink-0 overflow-hidden"
            >
              <div
                className="w-[240px] h-full p-4 rounded-2xl border border-white/10 flex flex-col gap-4"
                style={{ backgroundColor: activeDetail.group.color + "88" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeDetail.group.icon}</span>
                  <div>
                    <h3
                      className="text-sm font-black font-arabic"
                      style={{ color: activeDetail.group.hotColor }}
                    >
                      {activeDetail.group.label}
                    </h3>
                    <span className="text-[10px] text-white/40 font-mono">
                      {activeDetail.pct.toFixed(2)}% من الحروف
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-white/60 leading-relaxed font-arabic">
                  {activeDetail.group.description}
                </p>

                {/* شريط التوزيع */}
                <div className="space-y-1.5">
                  <p className="text-[9px] text-white/30 font-arabic">توزيع الحروف:</p>
                  {activeDetail.group.letters.split("").map((ch) => {
                    const freq = activeDetail.totalLetters > 0
                      ? (/* individual letter count captured */ 1)
                      : 0;
                    return (
                      <div key={ch} className="flex items-center gap-2">
                        <span
                          className="text-base font-bold w-6 text-center"
                          style={{ color: activeDetail.group.hotColor }}
                        >
                          {ch}
                        </span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: activeDetail.group.hotColor }}
                            initial={{ width: 0 }}
                            animate={{
                              width: ch === activeDetail.topLetter ? "100%" : "40%",
                            }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        {ch === activeDetail.topLetter && (
                          <span className="text-[8px] font-mono" style={{ color: activeDetail.group.hotColor }}>
                            الأعلى
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto p-3 rounded-xl bg-black/20 border border-white/5">
                  <p className="text-[10px] text-white/50 font-arabic">
                    <b style={{ color: activeDetail.group.hotColor }}>{activeDetail.richBars.length}</b> بار
                    {" "}تحتوي على أكثر من 15% من حروف هذا المخرج.
                    {activeDetail.richBars.length === 0 && " لا توجد بارات بكثافة كافية."}
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── مفتاح الحرارة ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[9px] text-white/20 font-arabic">الكثافة:</span>
        <div className="flex items-center gap-0 h-3 flex-1 max-w-[200px] rounded-full overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-full"
              style={{ backgroundColor: heatColor("#1a1a2e", "#EF4444", i / 19) }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-white/20">
          <span>نادر</span>
          <span>مهيمن</span>
        </div>
      </div>
    </div>
  );
};
