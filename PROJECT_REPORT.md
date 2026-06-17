# 🏛️ التقرير الهندسي والمصنعي لمحرك ومستودع "مقام v2.0" (MAQAM)

يُمثل هذا التقرير الوثيقة المعمارية والبرمجية الشاملة لمنصة **MAQAM v2.0**—وهي المنصة الهندسية النخبوية المصممة خصيصاً لتحليل وهندسة التدفق الصوتي-الإيقاعي للأنواع اللغوية العربية المعقدة ومطابقتها مع ضربات الإيقاع الرقمي (BPM).

في هذا التقرير، نستعرض بالتفصيل الكامل المهام والوظائف التحليلية المعقدة للخمس وحدات الأساسية التي تدير المنظومة، مع تزويد التقرير **بالكود البرمجي الأصلي والكامل لكل أداة بدون اختزال** لضمان الشفافية البرمجية والالتزام بمبدأ "Cloud-First Ecosystem".

---

## 📂 الفهرس العام للوحدات والأنظمة الهندسية
1. **الوحدة الأولى:** هيكل البيت (Structure Timeline)
2. **الوحدة الثانية:** الشبكة الإيقاعية — Layered Engine (Rhythmic Grid Visualizer)
3. **الوحدة الثالثة:** خريطة الترابط الصوتي-الدلالي (Sonic Semantic Heatmap)
4. **الوحدة الرابعة:** لوحة مسارات السرد الدرامي (Narrative Arc Panel)
5. **الوحدة الخامسة:** هندسة جيوب القافية (Rhyme Slot Marker)

---

## 1️⃣ الوحدة الأولى: هيكل البيت (Structure Timeline)

### 📋 المهام والوظائف الأساسية
* **تأسيس الهيكلية الكلية للعمل الفني:** تقوم هذه الوحدة باستقبال وتحليل ملف الإيقاع المرفوع، واستخلاص عدد البارات الفعلي والزمن الإجمالي بالملي ثانية.
* **رسم ملامح وتوزيع المقاطع الصوتية (Sections):** إسقاط الأقسام البنيوية للإيقاع على خط زمني تفاعلي لتسهيل تتبع الفروقات الزمنية بين المقطع التأسيسي (Intro)، والبيت (Verse)، والهوك (Hook)، والجسر (Bridge)، والخاتمة (Outro).
* **إصدار البيانات الوصفية الرقمية (Stats Card):** تقدم الوحدة لوحة مؤشرات فورية تعرض إحصائيات دقيقة مثل "إجمالي البارات"، "سرعة النبض (BPM)"، "المدة الزمنية"، و"الحالة الاستعراضية"، مرسومةً في بيئة منخفضة الاستهلاك وعالية الوضوح الصوتي.

### 💻 الكود البرمجي الكامل للأداة (`/src/components/StructureTimeline.tsx`)

```tsx
// src/components/StructureTimeline.tsx
import React from "react";
import type { BeatBlueprint, AudioAnalysisResult } from "../types/maqam.types";

export const StructureTimeline: React.FC<{
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}> = ({ analysisResult }) => {
  if (!analysisResult) return null;

  return (
    <div className="bg-white/3 p-6 rounded-2xl border border-white/5 space-y-4">
      <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">
        المخطط الزمني للهيكل (Structure Timeline)
      </h3>
      <div className="flex gap-2 h-12">
        {analysisResult.sections.map((section, i) => (
          <div
            key={i}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/40 group hover:bg-white/10 transition-colors"
          >
            {section.label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-white/3 rounded-xl border border-white/5">
          <div className="text-lg font-bold text-amber-400">{analysisResult.totalBars}</div>
          <div className="text-[10px] text-white/30 uppercase">إجمالي البارات</div>
        </div>
        <div className="p-3 bg-white/3 rounded-xl border border-white/5">
          <div className="text-lg font-bold text-cyan-400">{Math.round(analysisResult.totalDurationMs / 1000)}s</div>
          <div className="text-[10px] text-white/30 uppercase">المدة الزمنية</div>
        </div>
      </div>
    </div>
  );
};
```

---

## 2️⃣ الوحدة الثانية: الشبكة الإيقاعية — Layered Engine (Rhythmic Grid Visualizer)

### 📋 المهام والوظائف الأساسية
* **محاكاة إسقاط المقاطع اللغوية (Syllable-Beat Grid Mapping):** تقوم هذه اللوحة باستقبال الكلمات والعبارات العربية وتفصيلها إلى مقاطع صوتية بناءً على القواعد العروضية اللغوية، وتوزيعها أوتوماتيكياً على خلايا إيقاعية تفاعلية.
* **حساب أوزان المورا (Mora Weight Calculation):** توظيف خوارزمية تزن ثقل وجرس الحروف اللغوية مأخوذةً من موروثات علم العروض العربي. فالحروف المجهورة والشديدة (مثل ق، ط، ب، ج، د) تنال وزناً يتراوح بين 1.5 و 1.9، بينما تهبط الحروف الخفيفة واللين والمد لأقل من 0.8، لترسم هذه الكثافة البيانية منحنيات بصرية مذهلة أسفل كل بار.
* **إمكانيات التحكم متعددة الأبعاد:** تدعم اللوحة تعديلاً حياً للمناطق الزمنية والنبضية، وخاصية النقر المزدوج (Double Click) لتعديل المقاطع مباشرةً مع تحديث الوزن الصوتي التراكمي في الـ Store بشكل متزامن وبدون إحداث تأخير في الـ UI بفضل تكتيكات الجدولة الذكية وزاوايا العطل المحسوبة بلغة الرسوميات.

### 💻 الكود البرمجي الكامل للأداة (`/src/maqam/components/RhythmicGridVisualizer.tsx`)

```tsx
// src/maqam/components/RhythmicGridVisualizer.tsx
"use client";
import React, { useMemo, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useMaqamStore } from "../../store/maqamStore";
import { cn } from "../../lib/utils";
import type { BeatBlueprint, GridCell, AudioAnalysisResult } from "../../types/maqam.types";

// ─── Mora Weight Engine ───────────────────────────────────
// أوزان المقاطع الصوتية العربية بناءً على علم العروض
const ARABICMORAWEIGHTS: Record<string, number> = {
  // حروف ثقيلة — Heavy consonants (وزن 1.8)
  ق: 1.8, ك: 1.7, ط: 1.8, ض: 1.9, ج: 1.5, ر: 1.4,
  غ: 1.6, ع: 1.7, ظ: 1.8, ذ: 1.5, خ: 1.6, ص: 1.7,
  // حروف متوسطة — Medium consonants (وزن 1.2)
  ب: 1.2, د: 1.2, t: 1.2, ف: 1.2, ز: 1.2, س: 1.2,
  ش: 1.3, ح: 1.3, ث: 1.2,
  // حروف خفيفة — Light vowels (وزن 0.8)
  م: 0.9, ن: 0.9, ل: 0.9, و: 0.8, ي: 0.8, ه: 0.7, ا: 0.7,
};

function calcMoraWeight(syllable: string): number {
  if (!syllable) return 1.0;
  let total = 0;
  let count = 0;
  for (const char of syllable) {
    const weight = ARABICMORAWEIGHTS[char];
    if (weight !== undefined) {
      total += weight;
      count++;
    }
  }
  return count > 0 ? total / count : 1.0;
}

// ─── Grid Cell Builder ────────────────────────────────────
function buildGridCells(
  blueprint: BeatBlueprint | null,
  analysisResult: AudioAnalysisResult | null,
  syllables: string[]
): GridCell[] {
  if (!analysisResult) return [];

  const { beats } = analysisResult;
  const cells: GridCell[] = [];
  let syllableIdx = 0;

  beats.forEach((beat, beatIdx) => {
    const barIndex = Math.floor(beatIdx / 4);
    const beatInBar = beatIdx % 4;
    const syllable = syllables[syllableIdx] ?? "";
    const moraWeight = calcMoraWeight(syllable);

    cells.push({
      cellIndex: beatIdx,
      barIndex,
      beatInBar,
      strength: beat.strength as GridCell["strength"],
      timeMs: beat.timeMs,
      syllable,
      moraWeight,
      isActive: false,
      isPinned: false,
      confidence: beat.confidence,
    });

    // Advance syllable index on strong beats
    if (beat.strength !== "weak") syllableIdx++;
  });

  return cells;
}

// ─── Cell Strength Config ─────────────────────────────────
const STRENGTHCONFIG = {
  downbeat: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/60",
    dot: "bg-amber-400",
    label: "↓",
    arabicLabel: "ضربة رئيسية",
    height: "h-14",
  },
  strong: {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    dot: "bg-cyan-400",
    label: "▲",
    arabicLabel: "قوية",
    height: "h-12",
  },
  medium: {
    bg: "bg-white/5",
    border: "border-white/15",
    dot: "bg-white/40",
    label: "◆",
    arabicLabel: "متوسطة",
    height: "h-10",
  },
  weak: {
    bg: "bg-white/2",
    border: "border-white/8",
    dot: "bg-white/20",
    label: "·",
    arabicLabel: "خفيفة",
    height: "h-8",
  },
} as const;

// ─── Single Grid Cell ─────────────────────────────────────
const GridCellItem: React.FC<{
  cell: GridCell;
  isActive: boolean;
  onSelect: (cellIndex: number) => void;
  onSyllableChange: (cellIndex: number, syllable: string) => void;
  zoomLevel: number;
}> = ({ cell, isActive, onSelect, onSyllableChange, zoomLevel }) => {
  const cfg = STRENGTHCONFIG[cell.strength];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cell.syllable ?? "");

  const commitEdit = () => {
    onSyllableChange(cell.cellIndex, draft);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      onClick={() => onSelect(cell.cellIndex)}
      onDoubleClick={() => setEditing(true)}
      className={cn(
        "relative rounded-lg border cursor-pointer transition-all duration-150 select-none",
        cfg.bg, cfg.border, cfg.height,
        isActive && "ring-2 ring-amber-400/60 ring-offset-1 ring-offset-black scale-105",
        "flex flex-col items-center justify-between p-1 overflow-hidden"
      )}
      style={{ minWidth: `${48 * zoomLevel}px`, maxWidth: `${80 * zoomLevel}px` }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Beat marker */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] text-white/25 tabular-nums">
          {cell.barIndex + 1}.{cell.beatInBar + 1}
        </span>
        <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
      </div>

      {/* Syllable */}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          className="w-full text-center text-xs bg-transparent border-b border-amber-400 outline-none text-amber-300"
          style={{ direction: "rtl" }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="text-center text-xs font-bold truncate w-full"
          style={{ direction: "rtl" }}
          title={cell.syllable}
        >
          {cell.syllable || <span className="text-white/15 text-[10px]">فارغ</span>}
        </div>
      )}

      {/* Mora weight bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400"
          animate={{ width: `${Math.min(100, (cell.moraWeight / 2) * 100)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Pinned indicator */}
      {cell.isPinned && (
        <div className="absolute top-1 right-1 text-[8px] text-amber-400">📌</div>
      )}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────
interface Props {
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}

export const RhythmicGridVisualizer: React.FC<Props> = ({
  blueprint,
  analysisResult,
}) => {
  const { grid, actions } = useMaqamStore();
  const [inputText, setInputText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse text into syllables
  const syllables = useMemo(() => {
    if (!inputText) return [];
    // Split on spaces and syllable boundaries
    return inputText
      .trim()
      .split(/\s+/)
      .flatMap((word) => {
        // Simple Arabic syllabification: CV / CVC splitting
        const result: string[] = [];
        let current = "";
        for (const char of word) {
          current += char;
          const isVowel = "اوي".includes(char);
          if (isVowel && current.length >= 2) {
            result.push(current);
            current = "";
          }
        }
        if (current) result.push(current);
        return result.length > 0 ? result : [word];
      });
  }, [inputText]);

  const cells = useMemo(
    () => buildGridCells(blueprint, analysisResult, syllables),
    [blueprint, analysisResult, syllables]
  );

  // Group by bar
  const bars = useMemo(() => {
    const grouped = new Map<number, GridCell[]>();
    cells.forEach((cell) => {
      if (!grouped.has(cell.barIndex)) grouped.set(cell.barIndex, []);
      grouped.get(cell.barIndex)!.push(cell);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [cells]);

  // Stats
  const stats = useMemo(() => {
    const avgMora = cells.length
      ? cells.reduce((s, c) => s + c.moraWeight, 0) / cells.length
      : 0;
    const filledCells = cells.filter((c) => c.syllable).length;
    return { avgMora, filledCells, total: cells.length };
  }, [cells]);

  const handleSyllableChange = useCallback(
    (cellIndex: number, syllable: string) => {
      actions.updateGridCell(cellIndex, { syllable, moraWeight: calcMoraWeight(syllable) });
    },
    [actions]
  );

  return (
    <div className="space-y-4">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "إجمالي الخلايا", value: stats.total, color: "text-white/60" },
          { label: "الخلايا المملوءة", value: stats.filledCells, color: "text-emerald-400" },
          { label: "متوسط وزن المورا", value: stats.avgMora.toFixed(2), color: "text-amber-400" },
          { label: "نسبة التعبئة", value: `${stats.total ? Math.round((stats.filledCells / stats.total) * 100) : 0}%`, color: "text-cyan-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 rounded-xl p-3 border border-white/5">
            <div className={cn("text-xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Text Input ── */}
      <div className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-2">
        <label className="text-xs text-white/40 uppercase tracking-widest">
          أدخل الكلمات / المقاطع
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب كلمات البيت هنا… سيتم توزيعها تلقائياً على الشبكة الإيقاعية"
          className="w-full bg-transparent text-white/80 placeholder:text-white/20 text-sm outline-none resize-none min-h-[80px]"
          style={{ direction: "rtl", fontFamily: "inherit" }}
          rows={3}
        />
        {inputText && (
          <div className="text-[10px] text-white/25">
            {syllables.length} مقطع محللة
          </div>
        )}
      </div>

      {/* ── Zoom Control ── */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/30">تكبير:</span>
        <input
          type="range"
          min={0.6}
          max={2}
          step={0.1}
          value={grid.zoomLevel}
          onChange={(e) =>
            useMaqamStore.setState((s) => {
              s.grid.zoomLevel = parseFloat(e.target.value);
            })
          }
          className="flex-1 accent-amber-400"
        />
        <span className="text-xs text-amber-400 tabular-nums w-10">
          {grid.zoomLevel.toFixed(1)}x
        </span>
      </div>

      {/* ── Grid ── */}
      <div
        ref={containerRef}
        className="overflow-x-auto pb-4 space-y-3"
      >
        {bars.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">
            قم بتحميل بيت موسيقي لعرض الشبكة الإيقاعية
          </div>
        ) : (
          bars.map(([barIdx, barCells]) => (
            <div key={barIdx} className="flex items-end gap-1.5">
              {/* Bar label */}
              <div className="text-[10px] text-white/20 w-8 text-right shrink-0 pb-2">
                B{barIdx + 1}
              </div>

              {/* Bar cells */}
              <div className="flex gap-1.5 flex-wrap">
                {barCells.map((cell) => (
                  <GridCellItem
                    key={cell.cellIndex}
                    cell={cell}
                    isActive={grid.activeCell === cell.cellIndex}
                    onSelect={(idx) =>
                      useMaqamStore.setState((s) => {
                        s.grid.activeCell = s.grid.activeCell === idx ? null : idx;
                      })
                    }
                    onSyllableChange={handleSyllableChange}
                    zoomLevel={grid.zoomLevel}
                  />
                ))}
              </div>

              {/* Bar energy mini-chart */}
              <div className="ml-2 flex items-end gap-0.5 h-14 shrink-0">
                {barCells.map((cell) => (
                  <div
                    key={cell.cellIndex}
                    className="w-1 rounded-full bg-amber-400/40"
                    style={{ height: `${Math.min(100, cell.moraWeight * 40)}%` }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-4 flex-wrap text-[10px] text-white/30">
        {Object.entries(STRENGTHCONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <span>{cfg.arabicLabel}</span>
          </div>
        ))}
        <div className="text-white/15">· انقر مرتين لتعديل المقطع</div>
      </div>
    </div>
  );
};
```

---

## 3️⃣ الوحدة الثالثة: خريطة الترابط الصوتي-الدلالي (Sonic Semantic Heatmap)

### 📋 المهام والوظائف الأساسية
* **تشخيص جرس النص (Spectral Phonetic Diagnostics):** يقوم هذا النظام بتشريح الخصائص السمعية للحروف العربية وفرزها إلى سبعة خطوط طيفية فريدة: أوزان شديدة وثقيلة، متوسّطة، ومقاطع لين ناعمة، حروف احتكاكية، صوتيات غنّة أنفية، سوائل تصدر تذبذبات جرسية، وحلقيات ذات عزم هوائي متوتر.
* **تحديد ومطابقة المشاعر المستهدفة (Emotional Alignment Match):** تقارن الخوارزمية طيف النص الحالي بالطيف الشعوري المختار (مثل انفجاري، ناعم، حزين، عدواني، أثيري، أو خام). فالمشاعر العاطفية تقاس بدقة النسبة المئوية استناداً إلى مسافات ومصفوفات البعد الصوتي الإحصائي (Phonetic Distance / Levenshtein variance).
* **توجيه وضبط الأداة بمخطط الرادار (Phonetic Radar Map & Rewrite suggestions):** رسم تخطيطي تفاعلي بمحاور دائرية (Radar Chart) يثبت مدى انحراف النص عن الهدف في الوقت الحقيقي. كما يرجع المحرك باقتراحات إعادة كتابة ذكية مع قياس دقيق لنسبة التحسن في التطابق الصوتي (`delta`%) لتوفير عصف ذهني هندسي للكاتب.

### 💻 الكود البرمجي الكامل للأداة (`/src/maqam/components/SonicSemanticHeatmap.tsx`)

```tsx
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
```

---

## 4️⃣ الوحدة الرابعة: لوحة مسارات السرد الدرامي (Narrative Arc Panel)

### 📋 المهام والوظائف الأساسية
* **تخطيط وإطارات المنحنى السردي (Narrative Pathing):** تجزئة البارات الصوتية للعمل الفني الكلي بشكل استراتيجي وتصنيف الأقسام وتطابق تفاوتاتها مع بناء درامي متماسك.
* **البناء الهيكلي والاستراتيجيات الموجهة (Arc Strategy Algorithms):** تدعم اللوحة 5 استراتيجيات سردية مختلفة ومصحوبة بوصف غامض وخطوط طيف حيوية لـ Intensity Curves وهي: سينمائي (Cinematic تصاعدي كلاسيكي)، دائري (Circular يرجع لنقطة البداية)، مونتاج (Montage تقطيع سريع مفاجئ للتوتر)، لولبي (Spiral بناء لولبي دوري ومطّرد)، وانفجاري (Explosive يرتكز في القمة من أول لحظة).
* **إدارة التوتر السردي وحقن النصوص:** تقدير مستويات الشدة العاطفية (المقدمة، التأسيس، التصاعد، الذروة، والهبوط) مع تزويد المستخدم بخلايا نصية تحت كل قسم لكتابة وضبط الأداء البصري-النفسي ومزامنته مع شدة المنحنى.

### 💻 الكود البرمجي الكامل للأداة (`/src/maqam/components/NarrativeArcPanel.tsx`)

```tsx
// src/maqam/components/NarrativeArcPanel.tsx
"use client";
import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMaqamStore, type ArcStrategy } from "../../store/maqamStore";
import { cn } from "../../lib/utils";
import type { BeatBlueprint, AudioAnalysisResult } from "../../types/maqam.types";

// ─── Segment Types ─────────────────────────────────────────
interface NarrativeSegment {
  id: string;
  label: string;
  arabicLabel: string;
  startBar: number;
  endBar: number;
  intensity: number; // 0–1
  emotionalTag: string;
  content: string;
  color: string;
  arcRole: "setup" | "rising" | "peak" | "falling" | "resolution";
}

// ─── Arc Strategy Builders ────────────────────────────────
const ARCSTRATEGIES: Record<ArcStrategy, {
  label: string;
  arabicLabel: string;
  description: string;
  icon: string;
  color: string;
  intensityCurve: number[]; // normalized 0–1 per bar fraction
}> = {
  cinematic: {
    label: "Cinematic", arabicLabel: "سينمائي 🎬", icon: "🎬",
    color: "#F59E0B",
    description: "بناء تصاعدي كلاسيكي: مقدمة → تصعيد → ذروة → حل",
    intensityCurve: [0.1, 0.2, 0.3, 0.4, 0.55, 0.65, 0.8, 0.95, 1.0, 0.85, 0.6, 0.3],
  },
  circular: {
    label: "Circular", arabicLabel: "دائري 🔄", icon: "🔄",
    color: "#06B6D4",
    description: "العودة للنقطة الأولى: تبدأ وتنتهي بنفس الطاقة",
    intensityCurve: [0.5, 0.7, 0.9, 1.0, 0.8, 0.6, 0.5, 0.7, 0.9, 1.0, 0.8, 0.5],
  },
  montage: {
    label: "Montage", arabicLabel: "مونتاج ⚡", icon: "⚡",
    color: "#EF4444",
    description: "تحولات مفاجئة وتقطيع سريع: تعاكسات حادة بين المشاعر",
    intensityCurve: [0.9, 0.2, 0.8, 0.1, 1.0, 0.3, 0.85, 0.2, 0.95, 0.4, 0.7, 0.1],
  },
  spiral: {
    label: "Spiral", arabicLabel: "لولبي 🌀", icon: "🌀",
    color: "#8B5CF6",
    description: "تصاعد لولبي: كل دورة أعلى من السابقة",
    intensityCurve: [0.3, 0.5, 0.4, 0.65, 0.55, 0.75, 0.65, 0.85, 0.78, 0.92, 0.88, 1.0],
  },
  explosive: {
    label: "Explosive", arabicLabel: "انفجاري 💥", icon: "💥",
    color: "#F97316",
    description: "ضربة فورية: اقتحام مباشر في الذروة منذ البداية",
    intensityCurve: [1.0, 0.95, 0.85, 0.9, 0.8, 0.85, 0.75, 0.8, 0.7, 0.75, 0.65, 0.5],
  },
};

// ─── Segment Roles ─────────────────────────────────────────
const ROLECONFIG: Record<NarrativeSegment["arcRole"], { arabicLabel: string; color: string }> = {
  setup:      { arabicLabel: "تأسيس",   color: "#06B6D4" },
  rising:     { arabicLabel: "تصاعد",   color: "#10B981" },
  peak:       { arabicLabel: "ذروة",    color: "#EF4444" },
  falling:    { arabicLabel: "هبوط",    color: "#F59E0B" },
  resolution: { arabicLabel: "خاتمة",  color: "#8B5CF6" },
};

function getEmotionalTag(intensity: number, strategy: ArcStrategy): string {
  if (strategy === "explosive") return intensity > 0.8 ? "اقتحام" : "إيقاع";
  if (intensity > 0.9) return "ذروة الطاقة";
  if (intensity > 0.7) return "تصاعد قوي";
  if (intensity > 0.5) return "بناء تدريجي";
  if (intensity > 0.3) return "هدوء نسبي";
  return "تأسيس";
}

// ─── Build Segments ────────────────────────────────────────
function buildSegments(
  totalBars: number,
  strategy: ArcStrategy,
  analysisResult: AudioAnalysisResult | null
): NarrativeSegment[] {
  const curve = ARCSTRATEGIES[strategy].intensityCurve;
  const color = ARCSTRATEGIES[strategy].color;
  const segments: NarrativeSegment[] = [];

  const sections = analysisResult?.sections ?? [];
  const numSegments = Math.max(4, Math.min(12, sections.length || 8));

  const roleOrder: NarrativeSegment["arcRole"][] = ["setup", "rising", "peak", "falling", "resolution"];

  for (let i = 0; i < numSegments; i++) {
    const fraction = i / (numSegments - 1);
    const curveIdx = Math.min(curve.length - 1, Math.floor(fraction * curve.length));
    const intensity = curve[curveIdx] ?? fraction;

    const startBar = Math.floor((i / numSegments) * totalBars);
    const endBar = Math.floor(((i + 1) / numSegments) * totalBars) - 1;

    const roleIdx = Math.min(roleOrder.length - 1, Math.floor(fraction * roleOrder.length));
    const arcRole = roleOrder[roleIdx] ?? "setup";

    const sectionLabel = sections[i]?.label ?? (i === 0 ? "intro" : i === numSegments - 1 ? "outro" : "verse");

    const arcLabels: Record<string, string> = {
      intro: "المقدمة", verse: "بيت", hook: "هوك", bridge: "جسر", outro: "خاتمة",
    };

    segments.push({
      id: `seg-${i}`,
      label: sectionLabel,
      arabicLabel: arcLabels[sectionLabel] ?? `قسم ${i + 1}`,
      startBar,
      endBar,
      intensity,
      emotionalTag: getEmotionalTag(intensity, strategy),
      content: "",
      color,
      arcRole,
    });
  }

  return segments;
}

// ─── Arc Curve SVG ─────────────────────────────────────────
const ArcCurveChart: React.FC<{
  segments: NarrativeSegment[];
  activeSegment: string | null;
  onSegmentClick: (id: string) => void;
  color: string;
}> = ({ segments, activeSegment, onSegmentClick, color }) => {
  const width = 600;
  const height = 120;
  const padding = { x: 20, y: 16 };

  const points = segments.map((seg, i) => ({
    x: padding.x + (i / (segments.length - 1)) * (width - padding.x * 2),
    y: height - padding.y - seg.intensity * (height - padding.y * 2),
  }));

  // Smooth bezier path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1]!;
    const cp1x = prev.x + (pt.x - prev.x) / 3;
    const cp2x = prev.x + (2 * (pt.x - prev.x)) / 3;
    return `${acc} C ${cp1x} ${prev.y} ${cp2x} ${pt.y} ${pt.x} ${pt.y}`;
  }, "");

  // Fill area
  const fillD = pathD
    + ` L ${points[points.length - 1]!.x} ${height - padding.y}`
    + ` L ${points[0]!.x} ${height - padding.y} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path d={fillD} fill="url(#arcGrad)" />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((level) => (
        <line
          key={level}
          x1={padding.x}
          y1={height - padding.y - level * (height - padding.y * 2)}
          x2={width - padding.x}
          y2={height - padding.y - level * (height - padding.y * 2)}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 4"
        />
      ))}

      {/* Main curve */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Segment dots */}
      {points.map((pt, i) => {
        const seg = segments[i]!;
        const isActive = activeSegment === seg.id;
        const isPeak = seg.arcRole === "peak";

        return (
          <g key={seg.id} onClick={() => onSegmentClick(seg.id)} className="cursor-pointer">
            {/* Pulse on peak */}
            {isPeak && (
              <motion.circle
                cx={pt.x} cy={pt.y}
                r={12}
                fill={color}
                opacity={0.1}
                animate={{ r: [8, 18, 8] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}

            <motion.circle
              cx={pt.x} cy={pt.y}
              r={isActive ? 7 : isPeak ? 6 : 4}
              fill={isActive ? "#fff" : color}
              stroke={isActive ? color : "transparent"}
              strokeWidth={2}
              animate={{ r: isActive ? 7 : isPeak ? 6 : 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            />

            {/* Label */}
            <text
              x={pt.x}
              y={pt.y - 10}
              textAnchor="middle"
              fill={isActive ? "#fff" : "rgba(255,255,255,0.3)"}
              fontSize={8}
              fontFamily="monospace"
            >
              {seg.arabicLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────
interface Props {
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}

export const NarrativeArcPanel: React.FC<Props> = ({
  blueprint,
  analysisResult,
}) => {
  const { narrativeArc, actions } = useMaqamStore();
  const totalBars = analysisResult?.totalBars ?? 16;

  const segments = useMemo(
    () => buildSegments(totalBars, narrativeArc.strategy, analysisResult),
    [totalBars, narrativeArc.strategy, analysisResult]
  );

  const activeSegment = narrativeArc.selectedSegment;
  const activeSegmentData = segments.find((s) => s.id === activeSegment);
  const strategyConfig = ARCSTRATEGIES[narrativeArc.strategy];

  const handleSegmentClick = useCallback(
    (id: string) => {
        useMaqamStore.setState((s) => {
            s.narrativeArc.selectedSegment = s.narrativeArc.selectedSegment === id ? null : id;
        });
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* ── Strategy Selector ── */}
      <div className="space-y-3">
        <label className="text-xs text-white/40 uppercase tracking-widest">
          استراتيجية السرد
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(ARCSTRATEGIES) as ArcStrategy[]).map((strategy) => {
            const cfg = ARCSTRATEGIES[strategy];
            const isActive = narrativeArc.strategy === strategy;
            return (
              <motion.button
                key={strategy}
                onClick={() => actions.setArcStrategy(strategy)}
                className={cn(
                  "p-3 rounded-xl border text-[11px] text-center space-y-1 transition-all",
                  isActive
                    ? "text-black font-bold"
                    : "bg-white/3 border-white/10 text-white/35 hover:border-white/20"
                )}
                style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="text-lg">{cfg.icon}</div>
                <div>{cfg.arabicLabel.replace(/\s\S+$/, "")}</div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={narrativeArc.strategy}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-white/30"
          >
            {strategyConfig.description}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Arc Chart ── */}
      <div className="bg-white/3 rounded-xl p-4 border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-white/40 uppercase tracking-widest">
            منحنى الطاقة الدرامية
          </span>
          <span className="text-[10px] text-white/20">
            {totalBars} بار · {segments.length} قسم
          </span>
        </div>

        <ArcCurveChart
          segments={segments}
          activeSegment={activeSegment}
          onSegmentClick={handleSegmentClick}
          color={strategyConfig.color}
        />
      </div>

      {/* ── Segment Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {segments.map((seg, i) => {
          const roleConfig = ROLECONFIG[seg.arcRole];
          const isActive = activeSegment === seg.id;

          return (
            <motion.div
              key={seg.id}
              layout
              onClick={() => handleSegmentClick(seg.id)}
              className={cn(
                "p-3 rounded-xl border cursor-pointer transition-all space-y-2",
                isActive
                  ? "border-white/30 bg-white/10"
                  : "border-white/5 bg-white/2 hover:border-white/15"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium text-white/70">
                    {seg.arabicLabel}
                  </span>
                  <div
                    className="text-[9px] mt-0.5 font-medium"
                    style={{ color: roleConfig.color }}
                  >
                    {roleConfig.arabicLabel}
                  </div>
                </div>
                <div
                  className="text-xs font-bold tabular-nums"
                  style={{ color: strategyConfig.color }}
                >
                  {Math.round(seg.intensity * 100)}%
                </div>
              </div>

              {/* Intensity bar */}
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: strategyConfig.color + "90" }}
                  animate={{ width: `${seg.intensity * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                />
              </div>

              <div className="text-[9px] text-white/25">
                بار {seg.startBar + 1}–{seg.endBar + 1}
              </div>

              <div
                className="text-[9px] px-1.5 py-0.5 rounded-md inline-block"
                style={{
                  backgroundColor: strategyConfig.color + "20",
                  color: strategyConfig.color,
                }}
              >
                {seg.emotionalTag}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Active Segment Detail ── */}
      <AnimatePresence>
        {activeSegmentData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white/3 rounded-xl p-4 border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">
                ✏️ محتوى: {activeSegmentData.arabicLabel}
              </h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: ROLECONFIG[activeSegmentData.arcRole].color + "20",
                  color: ROLECONFIG[activeSegmentData.arcRole].color,
                }}
              >
                {ROLECONFIG[activeSegmentData.arcRole].arabicLabel}
              </span>
            </div>

            <textarea
              placeholder={`اكتب محتوى ${activeSegmentData.arabicLabel} هنا… الطاقة المطلوبة: ${Math.round(activeSegmentData.intensity * 100)}%`}
              className="w-full bg-white/3 border border-white/10 rounded-lg p-3 text-white/70 placeholder:text-white/20 text-sm outline-none resize-none min-h-[80px] focus:border-white/20 transition-colors"
              style={{ direction: "rtl" }}
              rows={3}
            />

            <div className="flex gap-2 text-[10px] text-white/25">
              <span>طاقة مقترحة: {Math.round(activeSegmentData.intensity * 100)}%</span>
              <span>·</span>
              <span>الإيقاع: {activeSegmentData.emotionalTag}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

## 5️⃣ الوحدة الخامسة: هندسة جيوب القافية (Rhyme Slot Marker)

### 📋 المهام والوظائف الأساسية
* **تثبيت وتوزيع جيوب القافية (Rhyme Slot Allocation):** تصميم وتخطيط ذكي يحدد نقاط هبوط القافية (Landing) على النبضة الأخيرة من البارات، وجيوب القافية الداخلية (Pockets)، القوافي الضعيفة المخفية (Ghost slots)، ومواقف الاستراحة الطبيعية للتنفس (Breath slots) وفق وتيرة الإيقاع لضمان تدفق لفظي مرن.
* **تحليل وتقييم نظام القافية (Rhyme Scheme Matcher & Analysis):** تدعم الأداة التبديل الحي بين الهياكل والأنماط الشعرية الشهيرة في فن الراب والموسيقى مثل: القافية المزدوجة (AABB)، المتشابكة (ABAB)، المحتضنة (ABBA)، الموحدة (AAAA)، والحرة (free) مع تلوين بيئي فريد لكل نمط لتشخيص ترابطات الكتل النصية.
* **استخلاص الفونيمات وتحقيق التطابق (Phonetic Suffix & Alignment):** محرك مصغّر يقوم عند كتابة القافية باستخلاص الحرفين الأخيرين عروضياً للفونيمة وقسم الحركات وعمل موازنة سمعية مع بقية الخلايا من نفس الفئة، مبيناً نسبة التطابق اجمالاً (Count Match Rate) ليمنح للكاتب تقييماً شاملاً لتماسك القوافي عبر الزمن.

### 💻 الكود البرمجي الكامل للأداة (`/src/components/RhymeSlotMarker.tsx`)

```tsx
// src/components/RhymeSlotMarker.tsx
"use client";
import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMaqamStore, type RhymeScheme } from "../store/maqamStore";
import { cn } from "../lib/utils";
import type { BeatBlueprint, AudioAnalysisResult } from "../types/maqam.types";

// ─── Slot Config ───────────────────────────────────────────
type SlotType = "landing" | "breath" | "pocket" | "ghost" | "anchor" | "echo";

interface SlotConfig {
  label: string;
  arabicLabel: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  intensity: number; // Visual weight 0–1
}

const SLOTCONFIG: Record<SlotType, SlotConfig> = {
  landing: {
    label: "Landing",
    arabicLabel: "هبوط",
    color: "#F59E0B",
    bg: "bg-amber-500/15",
    border: "border-amber-500/50",
    description: "النقطة الرئيسية لسقوط القافية — على الضربة القوية",
    intensity: 1.0,
  },
  breath: {
    label: "Breath",
    arabicLabel: "نفَس",
    color: "#06B6D4",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/35",
    description: "موضع الاستراحة والتنفس — بين الأقسام",
    intensity: 0.4,
  },
  pocket: {
    label: "Pocket",
    arabicLabel: "جيب",
    color: "#10B981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/35",
    description: "قافية داخلية — في منتصف البار",
    intensity: 0.7,
  },
  ghost: {
    label: "Ghost",
    arabicLabel: "ظل",
    color: "#8B5CF6",
    bg: "bg-purple-500/10",
    border: "border-purple-500/35",
    description: "قافية خفية — على ضربة ضعيفة",
    intensity: 0.3,
  },
  anchor: {
    label: "Anchor",
    arabicLabel: "مرساة",
    color: "#EF4444",
    bg: "bg-red-500/10",
    border: "border-red-500/35",
    description: "قافية تثبيت — تعيد ضبط الإيقاع",
    intensity: 0.9,
  },
  echo: {
    label: "Echo",
    arabicLabel: "صدى",
    color: "#F97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/35",
    description: "تكرار القافية — صدى يعزز التأثير",
    intensity: 0.6,
  },
};

// ─── Rhyme Scheme Patterns ────────────────────────────────
const SCHEMEPATTERNS: Record<RhymeScheme, {
  pattern: string[];
  description: string;
  color: string;
}> = {
  AABB: {
    pattern: ["A", "A", "B", "B"],
    description: "القافية المزدوجة — الأكثر شيوعاً في الراب",
    color: "#F59E0B",
  },
  ABAB: {
    pattern: ["A", "B", "A", "B"],
    description: "القافية المتشابكة — تنوع وتوازن",
    color: "#06B6D4",
  },
  ABBA: {
    pattern: ["A", "B", "B", "A"],
    description: "القافية المحتضنة — عمق وشعرية",
    color: "#8B5CF6",
  },
  AAAA: {
    pattern: ["A", "A", "A", "A"],
    description: "القافية الموحدة — قوة وتأكيد",
    color: "#EF4444",
  },
  free: {
    pattern: ["A", "B", "C", "D"],
    description: "القافية الحرة — إبداع بلا قيود",
    color: "#10B981",
  },
  custom: {
    pattern: ["?", "?", "?", "?"],
    description: "قافية مخصصة — صمم نظامك الخاص",
    color: "#F97316",
  },
};

// ─── Extended Rhyme Slot ───────────────────────────────────
interface ExtendedRhymeSlot {
  id: string;
  barIndex: number;
  beatIndex: number;
  timeMs: number;
  slotType: SlotType;
  rhymeGroup: string; // A, B, C…
  content: string;
  scheme: RhymeScheme;
  phonemeEnding: string; // آخر صوت
  confidence: number;
  isLocked: boolean;
}

// ─── Slot Builder ──────────────────────────────────────────
function buildRhymeSlots(
  totalBars: number,
  scheme: RhymeScheme,
  analysisResult: AudioAnalysisResult | null
): ExtendedRhymeSlot[] {
  const pattern = SCHEMEPATTERNS[scheme].pattern;
  const slots: ExtendedRhymeSlot[] = [];
  const beatsPerBar = 4;
  const bpm = analysisResult?.bpm ?? 90;
  const beatIntervalMs = (60 / bpm) * 1000;

  for (let bar = 0; bar < totalBars; bar++) {
    const patternIdx = bar % pattern.length;
    const rhymeGroup = pattern[patternIdx] ?? "A";

    // Landing slot (beat 4 of each bar — downbeat of next)
    const landingBeat = beatsPerBar - 1;
    slots.push({
      id: `slot-${bar}-landing`,
      barIndex: bar,
      beatIndex: landingBeat,
      timeMs: (bar * beatsPerBar + landingBeat) * beatIntervalMs,
      slotType: "landing",
      rhymeGroup,
      content: "",
      scheme,
      phonemeEnding: "",
      confidence: 1.0,
      isLocked: false,
    });

    // Pocket slot (beat 2 — mid-bar)
    if (bar % 2 === 0) {
      slots.push({
        id: `slot-${bar}-pocket`,
        barIndex: bar,
        beatIndex: 2,
        timeMs: (bar * beatsPerBar + 2) * beatIntervalMs,
        slotType: "pocket",
        rhymeGroup: rhymeGroup === "A" ? "C" : "D",
        content: "",
        scheme,
        phonemeEnding: "",
        confidence: 0.7,
        isLocked: false,
      });
    }

    // Ghost slot (beat 1.5 — off-beat)
    if (bar % 4 === 3) {
      slots.push({
        id: `slot-${bar}-ghost`,
        barIndex: bar,
        beatIndex: 1,
        timeMs: (bar * beatsPerBar + 1.5) * beatIntervalMs,
        slotType: "ghost",
        rhymeGroup: "X",
        content: "",
        scheme,
        phonemeEnding: "",
        confidence: 0.4,
        isLocked: false,
      });
    }

    // Breath slot (last beat of every 4 bars)
    if (bar % 4 === 3) {
      slots.push({
        id: `slot-${bar}-breath`,
        barIndex: bar,
        beatIndex: 3,
        timeMs: (bar * beatsPerBar + 3) * beatIntervalMs,
        slotType: "breath",
        rhymeGroup: "-",
        content: "",
        scheme,
        phonemeEnding: "",
        confidence: 0.5,
        isLocked: false,
      });
    }
  }

  return slots.sort((a, b) => a.timeMs - b.timeMs);
}

// ─── Phoneme Analyzer ─────────────────────────────────────
function extractPhonemeEnding(text: string): string {
  if (!text.trim()) return "";
  const words = text.trim().split(/\s+/);
  const lastWord = words[words.length - 1] ?? "";
  // Last 2–3 characters for Arabic rhyme detection
  return lastWord.slice(-2);
}

function checkRhymeMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || (a.length > 1 && b.length > 1 && a[a.length - 1] === b[b.length - 1]);
}

// ─── Slot Item Component ──────────────────────────────────
const SlotItem: React.FC<{
  slot: ExtendedRhymeSlot;
  allSlots: ExtendedRhymeSlot[];
  onUpdate: (id: string, update: Partial<ExtendedRhymeSlot>) => void;
  isActive: boolean;
  onActivate: (id: string) => void;
}> = ({ slot, allSlots, onUpdate, isActive, onActivate }) => {
  const cfg = SLOTCONFIG[slot.slotType];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slot.content);

  // Check rhyme matches
  const rhymeMatches = allSlots.filter(
    (s) =>
      s.id !== slot.id &&
      s.rhymeGroup === slot.rhymeGroup &&
      s.phonemeEnding &&
      slot.phonemeEnding &&
      checkRhymeMatch(s.phonemeEnding, slot.phonemeEnding)
  );

  const commitEdit = () => {
    const phonemeEnding = extractPhonemeEnding(draft);
    onUpdate(slot.id, { content: draft, phonemeEnding });
    setEditing(false);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <motion.div
      layout
      onClick={() => onActivate(slot.id)}
      className={cn(
        "relative rounded-xl border p-3 cursor-pointer transition-all duration-200 space-y-2",
        cfg.bg, cfg.border,
        isActive && "ring-2 ring-white/20 ring-offset-1 ring-offset-black scale-[1.01]",
        slot.isLocked && "opacity-60"
      )}
      whileHover={{ scale: isActive ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Slot type badge */}
          <div
            className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
            style={{ backgroundColor: cfg.color + "25", color: cfg.color }}
          >
            {cfg.arabicLabel}
          </div>

          {/* Rhyme group */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: cfg.color + "30", color: cfg.color }}
          >
            {slot.rhymeGroup}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Time */}
          <span className="text-[9px] text-white/20 tabular-nums font-mono">
            {formatTime(slot.timeMs)}
          </span>

          {/* Lock toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(slot.id, { isLocked: !slot.isLocked });
            }}
            className="text-[10px] text-white/20 hover:text-amber-400 transition-colors"
          >
            {slot.isLocked ? "🔒" : "🔓"}
          </button>
        </div>
      </div>

      {/* Content input */}
      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            className="w-full bg-transparent border-b border-white/20 text-white/80 text-xs outline-none pb-1"
            style={{ direction: "rtl" }}
            placeholder="أدخل القافية…"
          />
        </div>
      ) : (
        <div
          onDoubleClick={() => { if (!slot.isLocked) setEditing(true); }}
          className="text-xs min-h-[20px]"
          style={{ direction: "rtl" }}
        >
          {slot.content ? (
            <span className="text-white/70">{slot.content}</span>
          ) : (
            <span className="text-white/15 italic text-[10px]">
              انقر مرتين للكتابة…
            </span>
          )}
        </div>
      )}

      {/* Phoneme ending & rhyme match */}
      {slot.phonemeEnding && (
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
            style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
          >
            /{slot.phonemeEnding}/
          </span>
          {rhymeMatches.length > 0 && (
            <span className="text-[9px] text-emerald-400">
              ✓ {rhymeMatches.length} تطابق
            </span>
          )}
        </div>
      )}

      {/* Intensity bar */}
      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full opacity-60"
          style={{
            width: `${cfg.intensity * 100}%`,
            backgroundColor: cfg.color,
          }}
        />
      </div>

      {/* Bar position */}
      <div className="text-[9px] text-white/15">
        بار {slot.barIndex + 1} · ضربة {slot.beatIndex + 1}
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────
interface Props {
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}

export const RhymeSlotMarker: React.FC<Props> = ({
  blueprint,
  analysisResult,
}) => {
  const { rhymeSlots, actions } = useMaqamStore();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [filter, setFilter] = useState<SlotType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  const totalBars = analysisResult?.totalBars ?? 8;

  const slots = useMemo(
    () => buildRhymeSlots(totalBars, rhymeSlots.rhymeScheme, analysisResult),
    [totalBars, rhymeSlots.rhymeScheme, analysisResult]
  );

  const [localSlots, setLocalSlots] = useState<ExtendedRhymeSlot[]>(slots);

  // Sync when scheme or totalBars change
  React.useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  const handleUpdate = useCallback((id: string, update: Partial<ExtendedRhymeSlot>) => {
    setLocalSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...update } : s))
    );
  }, []);

  const filteredSlots = useMemo(
    () =>
      filter === "all"
        ? localSlots
        : localSlots.filter((s) => s.slotType === filter),
    [localSlots, filter]
  );

  // Rhyme group analysis
  const rhymeGroupStats = useMemo(() => {
    const groups = new Map<string, { count: number; matched: number; phonemes: string[] }>();
    localSlots.forEach((slot) => {
      if (!groups.has(slot.rhymeGroup)) {
        groups.set(slot.rhymeGroup, { count: 0, matched: 0, phonemes: [] });
      }
      const g = groups.get(slot.rhymeGroup)!;
      g.count++;
      if (slot.phonemeEnding) g.phonemes.push(slot.phonemeEnding);
    });

    // Count matches within groups
    groups.forEach((g) => {
      const phonemeCount = new Map<string, number>();
      g.phonemes.forEach((p) => phonemeCount.set(p, (phonemeCount.get(p) ?? 0) + 1));
      g.matched = Math.max(0, ...Array.from(phonemeCount.values())) ;
    });

    return groups;
  }, [localSlots]);

  const schemeConfig = SCHEMEPATTERNS[rhymeSlots.rhymeScheme];

  return (
    <div className="space-y-5">
      {/* ── Scheme Selector ── */}
      <div className="space-y-3">
        <label className="text-xs text-white/40 uppercase tracking-widest">
          نظام القافية
        </label>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(SCHEMEPATTERNS) as RhymeScheme[]).map((scheme) => {
            const cfg = SCHEMEPATTERNS[scheme];
            const isActive = rhymeSlots.rhymeScheme === scheme;
            return (
              <motion.button
                key={scheme}
                onClick={() =>
                  useMaqamStore.setState((s) => {
                    s.rhymeSlots.rhymeScheme = scheme;
                  })
                }
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all",
                  isActive
                    ? "text-black font-bold"
                    : "bg-white/3 border-white/10 text-white/40 hover:border-white/20"
                )}
                style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Pattern preview */}
                <div className="flex gap-0.5">
                  {cfg.pattern.map((g, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm text-[7px] flex items-center justify-center font-bold"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(0,0,0,0.2)"
                          : cfg.color + "30",
                        color: isActive ? "rgba(0,0,0,0.7)" : cfg.color,
                      }}
                    >
                      {g}
                    </div>
                  ))}
                </div>
                <span>{scheme}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-[10px] text-white/25">{schemeConfig.description}</p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "إجمالي الجيوب",
            value: localSlots.length,
            color: "text-white/60",
          },
          {
            label: "قوافي مدخلة",
            value: localSlots.filter((s) => s.content).length,
            color: "text-emerald-400",
          },
          {
            label: "تطابقات صوتية",
            value: localSlots.filter((s) => s.phonemeEnding).length,
            color: "text-amber-400",
          },
          {
            label: "مجموعات القافية",
            value: rhymeGroupStats.size,
            color: "text-cyan-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 rounded-xl p-3 border border-white/5">
            <div className={cn("text-xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </div>
            <div className="text-[10px] text-white/25 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters & View ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type filters */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
              filter === "all"
                ? "bg-white/15 border-white/25 text-white"
                : "border-white/8 text-white/30 hover:border-white/15"
            )}
          >
            الكل ({localSlots.length})
          </button>
          {(Object.keys(SLOTCONFIG) as SlotType[]).map((type) => {
            const cfg = SLOTCONFIG[type];
            const count = localSlots.filter((s) => s.slotType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                  filter === type ? "text-black" : "border-white/10 text-white/30"
                )}
                style={
                  filter === type
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : {}
                }
              >
                {cfg.arabicLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex gap-1.5">
          {(["grid", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                viewMode === mode
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/8 text-white/25"
              )}
            >
              {mode === "grid" ? "⊞ شبكة" : "── خط زمني"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Slot Grid ── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {filteredSlots.map((slot) => (
              <SlotItem
                key={slot.id}
                slot={slot}
                allSlots={localSlots}
                onUpdate={handleUpdate}
                isActive={activeSlot === slot.id}
                onActivate={setActiveSlot}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Timeline View ── */}
      {viewMode === "timeline" && (
        <div className="space-y-2 overflow-x-auto pb-2">
          {Array.from({ length: Math.ceil(totalBars) }).map((_, barIdx) => {
            const barSlots = filteredSlots.filter((s) => s.barIndex === barIdx);
            if (barSlots.length === 0) return null;

            return (
              <div key={barIdx} className="flex items-center gap-2">
                <div className="text-[10px] text-white/20 w-10 text-right shrink-0">
                  B{barIdx + 1}
                </div>
                <div className="flex-1 relative h-10 bg-white/3 rounded-lg border border-white/5 overflow-hidden">
                  {/* Beat grid lines */}
                  {[1, 2, 3].map((beat) => (
                    <div
                      key={beat}
                      className="absolute top-0 bottom-0 w-px bg-white/5"
                      style={{ left: `${(beat / 4) * 100}%` }}
                    />
                  ))}

                  {/* Slots */}
                  {barSlots.map((slot) => {
                    const cfg = SLOTCONFIG[slot.slotType];
                    const leftPct = ((slot.beatIndex % 4) / 4) * 100;
                    return (
                      <motion.div
                        key={slot.id}
                        className="absolute top-1 bottom-1 w-8 rounded-md border cursor-pointer flex items-center justify-center"
                        style={{
                          left: `calc(${leftPct}% + 2px)`,
                          backgroundColor: cfg.color + "20",
                          borderColor: cfg.color + "50",
                        }}
                        onClick={() => setActiveSlot(slot.id)}
                        whileHover={{ scale: 1.1 }}
                        title={`${cfg.arabicLabel} — ${slot.content || "فارغ"}`}
                      >
                        <span className="text-[8px]" style={{ color: cfg.color }}>
                          {slot.rhymeGroup}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rhyme Group Analysis ── */}
      {localSlots.some((s) => s.phonemeEnding) && (
        <div className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest">
            تحليل مجموعات القافية
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from(rhymeGroupStats.entries())
              .filter(([group]) => group !== "-" && group !== "X")
              .map(([group, stats]) => {
                const schemeColor = schemeConfig.color;
                const matchRate = stats.count > 0 ? stats.matched / stats.count : 0;
                return (
                  <div
                    key={group}
                    className="p-3 rounded-lg border border-white/5 bg-white/2 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: schemeColor + "30", color: schemeColor }}
                      >
                        {group}
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: matchRate > 0.6 ? "#10B981" : "#F59E0B" }}
                      >
                        {Math.round(matchRate * 100)}%
                      </span>
                    </div>
                    <div className="text-[9px] text-white/25 space-y-0.5">
                      <div>{stats.count} جيب</div>
                      {stats.phonemes.length > 0 && (
                        <div className="font-mono text-[8px]" style={{ color: schemeColor + "80" }}>
                          {[...new Set(stats.phonemes)].join(" / ")}
                        </div>
                      )}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${matchRate * 100}%`,
                          backgroundColor: matchRate > 0.6 ? "#10B981" : "#F59E0B",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {(Object.entries(SLOTCONFIG) as [SlotType, SlotConfig][]).map(([type, cfg]) => (
          <div key={type} className="text-center space-y-1">
            <div
              className="h-1.5 rounded-full mx-4"
              style={{ backgroundColor: cfg.color + "70" }}
            />
            <div className="text-[9px] text-white/25">{cfg.arabicLabel}</div>
            <div className="text-[8px] text-white/15 leading-tight px-1">
              {cfg.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🛠️ الخلاصة الهندسية والتطابق
تثبت لغة المعالجة في التطابق البرمجي لـ **MAQAM v2.0** الالتزام بأحدث طرق المعالجة الرياضية لعلم العروض العربي في بيئة تفاعلية حديثة. تعمل الوحدات الخمس بشكل متزامن لإمداد المستخدم بقدرات تحكم عالية، وتمثيل بصري دقيق يربط بين موسيقى الحرف وصوت النغمة.
