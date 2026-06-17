"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useBeatWriterStore,
  LyricBar,
  BeatSection,
  analyzeArabicText,
} from "../../store/beatWriterStore";

const SECTION_CONFIG: Record<BeatSection, { label: string; icon: string; color: string }> = {
  intro:  { label: "مقدمة",  icon: "🎬", color: "#6B7280" },
  verse:  { label: "مقطع",   icon: "📝", color: "#8B5CF6" },
  hook:   { label: "هوك",    icon: "🎯", color: "#F59E0B" },
  bridge: { label: "جسر",    icon: "🌉", color: "#0EA5E9" },
  outro:  { label: "خاتمة",  icon: "🎪", color: "#10B981" },
};

export const LyricEditor: React.FC = () => {
  const {
    draftText, lyricBars, activeSection,
    selectedInstrumentId, instruments, beatGrid, currentTime,
    actions,
  } = useBeatWriterStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selInst = instruments.find((i) => i.id === selectedInstrumentId);
  const analysis = useMemo(() => analyzeArabicText(draftText), [draftText]);

  // مجموعات الأقسام
  const barsBySection = useMemo(() => {
    const groups: Record<BeatSection, LyricBar[]> = {
      intro: [], verse: [], hook: [], bridge: [], outro: [],
    };
    lyricBars.forEach((b) => {
      if (groups[b.section]) {
        groups[b.section].push(b);
      }
    });
    return groups;
  }, [lyricBars]);

  return (
    <div className="flex h-full overflow-hidden" dir="rtl">

      {/* ── منطقة الكتابة ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#060810]">

        {/* اختيار الآلة والقسم */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2
          border-b border-white/[0.05] bg-black/20">

          {/* الآلة المختارة */}
          {selInst && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                font-bold flex-shrink-0"
              style={{
                backgroundColor: selInst.color + "15",
                color: selInst.color,
                border: `1px solid ${selInst.color}30`,
              }}
            >
              <span>{selInst.icon}</span>
              <span>{selInst.nameAr}</span>
              <span className="text-[8px] opacity-60">مختارة</span>
            </div>
          )}

          {/* أقسام البيت */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(Object.entries(SECTION_CONFIG) as [BeatSection, typeof SECTION_CONFIG[BeatSection]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => actions.setActiveSection(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px]
                    font-bold whitespace-nowrap cursor-pointer transition-all flex-shrink-0
                    ${activeSection === key
                      ? "text-black"
                      : "bg-white/[0.03] text-white/40 hover:text-white/60 border border-white/5"
                    }`}
                  style={activeSection === key ? { backgroundColor: cfg.color } : {}}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  {barsBySection[key].length > 0 && (
                    <span
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px]
                        font-black"
                      style={
                        activeSection === key
                          ? { backgroundColor: "rgba(0,0,0,0.2)" }
                          : { backgroundColor: cfg.color + "30", color: cfg.color }
                      }
                    >
                      {barsBySection[key].length}
                    </span>
                  )}
                </button>
              )
            )}
          </div>

          {/* الوقت الحالي */}
          <div className="mr-auto flex items-center gap-1.5 text-[9px] text-white/30
            flex-shrink-0">
            <span>📍</span>
            <span className="font-mono text-amber-400">{currentTime.toFixed(2)}s</span>
            {beatGrid && (
              <span className="text-white/20">
                (شريط {Math.floor(currentTime / beatGrid.barDuration) + 1})
              </span>
            )}
          </div>
        </div>

        {/* منطقة الإدخال */}
        <div className="flex-shrink-0 p-4 border-b border-white/[0.05] space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={draftText}
              onChange={(e) => actions.setDraftText(e.target.value)}
              placeholder={`اكتب سطر ${SECTION_CONFIG[activeSection].label} هنا...\nستُربط تلقائياً بـ ${selInst?.nameAr ?? "الآلة المختارة"}`}
              className="w-full bg-[#0a0e1a] border border-white/[0.06] rounded-xl
                px-4 py-3 text-white text-sm font-medium leading-relaxed
                resize-none placeholder:text-white/15 focus:outline-none
                focus:border-white/15 transition-colors"
              style={{ height: "88px", fontFamily: "Tajawal, sans-serif" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  actions.commitDraft();
                }
              }}
              autoFocus
            />

            {/* مؤشر التحليل الفوري */}
            {draftText.trim() && (
              <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                <FlowBadge analysis={analysis} />
              </div>
            )}
          </div>

          {/* زر الحفظ */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={actions.commitDraft}
              disabled={!draftText.trim() || !beatGrid}
              whileTap={{ scale: 0.96 }}
              className="flex-1 py-2 rounded-xl text-[10px] font-black cursor-pointer
                transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={
                draftText.trim()
                  ? {
                      background: `linear-gradient(to left, ${SECTION_CONFIG[activeSection].color}, ${SECTION_CONFIG[activeSection].color}99)`,
                      color: "#000",
                    }
                  : { backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }
              }
            >
              {draftText.trim() ? `✓ حفظ على مسار ${selInst?.nameAr ?? ""}` : "اكتب سطراً أولاً"}
            </motion.button>
            <span className="text-[8px] text-white/20 bg-white/5 px-2 py-1 rounded
              border border-white/5 flex-shrink-0">
              Ctrl+↵
            </span>
          </div>
        </div>

        {/* ملف أقسام البيت والبارات المصاحبة كلوحات مجهزة للإدراج */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
          {!beatGrid ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-center space-y-2 py-8">
              <p className="text-3xl">✏️</p>
              <p className="text-xs">يرجى تهيئة البيت أولاً</p>
            </div>
          ) : (
            beatGrid.sections.map((section, sIdx) => {
              const cfg = SECTION_CONFIG[section.type] || { label: section.label, icon: "🎵", color: "#6B7280" };
              // تصفية أسطر الكلمات التي تنتمي لهذا الجزء أو التي تقع في زمن هذا القسم
              const sectionBars = lyricBars.filter(bar => bar.section === section.type);

              return (
                <div 
                  key={section.id || sIdx}
                  className="bg-[#0b0e1a]/80 border border-white/[0.04] rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01]"
                  style={{ borderLeft: `4px solid ${cfg.color}` }}
                >
                  {/* رأس المقطع (الفيرس أو الكورس إلخ) */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cfg.icon}</span>
                      <span className="font-extrabold text-xs text-white" style={{ color: cfg.color }}>
                        {section.label}
                      </span>
                      <span className="text-[9px] text-white/30 font-mono">
                        (شريط {section.startBar + 1} - {section.endBar})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-white/30 font-semibold font-mono">
                         {section.startTime.toFixed(1)}s - {section.endTime.toFixed(1)}s
                       </span>
                       <button
                         onClick={() => {
                           actions.seekTo(section.startTime);
                           actions.setActiveSection(section.type); 
                           textareaRef.current?.focus();
                         }}
                         className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[8px] font-black cursor-pointer transition-all border border-white/5"
                       >
                         ⚡ انتقال وتعيين
                       </button>
                    </div>
                  </div>

                  {/* أسطر الكلمات المدرجة والمنظمة في هذا القسم */}
                  <div className="p-3 space-y-2">
                    {sectionBars.length === 0 ? (
                      // مكان إدراج فريد مصمم لمنطقة خالية من الكلمات لمساعدة المرتجل في ترتيب بارات الكتابة
                      <div 
                        onClick={() => {
                          actions.seekTo(section.startTime);
                          actions.setActiveSection(section.type);
                          textareaRef.current?.focus();
                        }}
                        className="border border-dashed border-white/5 hover:border-white/20 rounded-lg p-3 text-center cursor-pointer transition-all hover:bg-white/[0.02] group"
                      >
                        <p className="text-[10px] text-white/40 font-bold group-hover:text-amber-400/80 transition-colors">
                          ➕ مكان إدراج بار نصّي في {cfg.label}
                        </p>
                        <p className="text-[8.5px] text-white/20">
                          اضغط لنقل الكيرسر لشريط البداية {section.startBar + 1} والبدء في الراب
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {sectionBars.map((bar, sliceIdx) => (
                            <LyricBarCard
                              key={bar.id}
                              bar={bar}
                              index={sliceIdx}
                              isEditing={editingId === bar.id}
                              instName={instruments.find((i) => i.id === bar.instrumentId)?.nameAr ?? ""}
                              instIcon={instruments.find((i) => i.id === bar.instrumentId)?.icon ?? ""}
                              onEdit={() => setEditingId(editingId === bar.id ? null : bar.id)}
                              onUpdate={(text) => {
                                actions.updateLyricBar(bar.id, { text });
                                setEditingId(null);
                              }}
                              onRemove={() => actions.removeLyricBar(bar.id)}
                              onSelect={() => actions.selectBar(bar.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* زر إدراج فرعي للمتابعة الفورية */}
                    {sectionBars.length > 0 && (
                      <button
                        onClick={() => {
                          const lastBar = sectionBars[sectionBars.length - 1];
                          const nextTime = Math.min(section.endTime, lastBar.endTime + 0.1);
                          actions.seekTo(nextTime);
                          actions.setActiveSection(section.type);
                          textareaRef.current?.focus();
                        }}
                        className="w-full py-1 border border-dotted border-white/5 hover:border-white/12 rounded-lg text-center text-[8.5px] text-white/25 hover:text-amber-400/80 cursor-pointer hover:bg-white/[0.01]"
                      >
                        ➕ إدراج سطر آخر متلاحق في هذا القسم...
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── لوحة المؤشرات ── */}
      <FlowMetricsPanel barsBySection={barsBySection} />
    </div>
  );
};

// ════════════════════════════════════════
//  شارة التحليل الفوري
// ════════════════════════════════════════

const FlowBadge: React.FC<{
  analysis: ReturnType<typeof analyzeArabicText>;
}> = ({ analysis }) => {
  const ratingConfig = {
    excellent: { label: "ممتاز ✓", color: "#10B981" },
    good:      { label: "جيد",     color: "#F59E0B" },
    fair:      { label: "مقبول",   color: "#0EA5E9" },
    poor:      { label: "ثقيل ✗",  color: "#EF4444" },
  };
  const cfg = ratingConfig[analysis.flowRating];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[8px] font-bold"
      style={{ backgroundColor: cfg.color + "20", color: cfg.color, border: `1px solid ${cfg.color}30` }}
    >
      <span>{analysis.syllableCount} مقطع</span>
      <span>•</span>
      <span>{cfg.label}</span>
    </div>
  );
};

// ════════════════════════════════════════
//  بطاقة سطر الكلمات
// ════════════════════════════════════════

const LyricBarCard: React.FC<{
  bar: LyricBar;
  index: number;
  isEditing: boolean;
  instName: string;
  instIcon: string;
  onEdit: () => void;
  onUpdate: (text: string) => void;
  onRemove: () => void;
  onSelect: () => void;
}> = ({ bar, index, isEditing, instName, instIcon, onEdit, onUpdate, onRemove, onSelect }) => {
  const [localText, setLocalText] = useState(bar.text);
  const sectionCfg = SECTION_CONFIG[bar.section];

  const flowColor =
    bar.flowScore >= 75 ? "#10B981" : bar.flowScore >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className="rounded-xl border overflow-hidden transition-all duration-150"
      style={
        bar.isSelected
          ? { borderColor: bar.color + "50", backgroundColor: bar.color + "08" }
          : { borderColor: "rgba(255,255,255,0.04)", backgroundColor: "rgba(255,255,255,0.015)" }
      }
      onClick={onSelect}
    >
      {/* رأس البطاقة */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <span className="text-[8px] text-white/20 font-mono w-4">{index + 1}</span>

        <span
          className="text-[7px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
          style={{ backgroundColor: sectionCfg.color + "20", color: sectionCfg.color }}
        >
          {sectionCfg.icon} {sectionCfg.label}
        </span>

        <span className="text-[8px] text-white/30 flex-shrink-0">
          {instIcon} {instName}
        </span>

        <div className="flex-1" />

        {/* مؤشرات */}
        <span
          className="text-[7px] px-1 rounded font-bold"
          style={{ backgroundColor: flowColor + "20", color: flowColor }}
        >
          فلو {bar.flowScore}%
        </span>
        <span className="text-[7px] text-white/25 font-mono">
          {bar.syllableCount}مق
        </span>
        <span className="text-[7px] text-white/20 font-mono">
          {bar.startTime.toFixed(1)}s
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-5 h-5 flex items-center justify-center text-[8px]
            text-white/25 hover:text-white/60 rounded hover:bg-white/5
            cursor-pointer transition-colors"
        >✏</button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-5 h-5 flex items-center justify-center text-[8px]
            text-white/25 hover:text-red-400 rounded hover:bg-red-500/10
            cursor-pointer transition-colors"
        >✕</button>
      </div>

      {/* النص */}
      {!isEditing ? (
        <p
          className="px-2.5 pb-2 text-[12px] font-medium text-white/80 leading-relaxed"
          style={{ fontFamily: "Tajawal, sans-serif" }}
        >
          {bar.text}
        </p>
      ) : (
        <div className="px-2.5 pb-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg p-2
              text-white text-[11px] resize-none focus:outline-none
              focus:border-white/20"
            style={{ minHeight: "50px", fontFamily: "Tajawal, sans-serif" }}
            autoFocus
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => onUpdate(localText)}
              className="flex-1 py-1 bg-emerald-500/15 text-emerald-400 rounded text-[8px]
                font-bold cursor-pointer hover:bg-emerald-500/25 transition-colors"
            >✓ حفظ</button>
            <button
              onClick={() => { setLocalText(bar.text); onEdit(); }}
              className="px-2 py-1 bg-white/5 text-white/40 rounded text-[8px]
                cursor-pointer hover:bg-white/10 transition-colors"
            >إلغاء</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ════════════════════════════════════════
//  لوحة المؤشرات
// ════════════════════════════════════════

const FlowMetricsPanel: React.FC<{
  barsBySection: Record<BeatSection, LyricBar[]>;
}> = ({ barsBySection }) => {
  const { lyricBars, instruments } = useBeatWriterStore();

  const stats = useMemo(() => {
    if (lyricBars.length === 0) return null;
    const avgFlow = Math.round(lyricBars.reduce((s, b) => s + b.flowScore, 0) / lyricBars.length);
    const avgVibe = Math.round(lyricBars.reduce((s, b) => s + b.vibeMatch, 0) / lyricBars.length);
    const avgSyl = Math.round(lyricBars.reduce((s, b) => s + b.syllableCount, 0) / lyricBars.length);
    const totalBars = lyricBars.length;
    return { avgFlow, avgVibe, avgSyl, totalBars };
  }, [lyricBars]);

  return (
    <div
      className="flex-shrink-0 bg-[#070a14] border-r border-white/[0.05]
        overflow-y-auto flex flex-col"
      style={{ width: "180px" }}
      dir="rtl"
    >
      <div className="px-3 py-2.5 border-b border-white/[0.05]">
        <p className="text-[10px] font-black text-white/60">📊 مؤشرات الفلو</p>
      </div>

      {!stats ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[9px] text-white/20 text-center leading-relaxed">
            ابدأ الكتابة<br />لرؤية المؤشرات
          </p>
        </div>
      ) : (
        <div className="p-3 space-y-4">
          {/* النقطة الكلية */}
          <div
            className="text-center p-3 rounded-xl border border-white/5"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <p className="text-[8px] text-white/30 mb-1">جودة الفلو</p>
            <p
              className="text-2xl font-black font-mono"
              style={{
                color: stats.avgFlow >= 75 ? "#10B981" : stats.avgFlow >= 55 ? "#F59E0B" : "#EF4444",
              }}
            >
              {stats.avgFlow}
            </p>
            <p className="text-[7px] text-white/20">/ 100</p>
          </div>

          {/* المقاييس */}
          <div className="space-y-2">
            <MiniMeter label="توافق المزاج" value={stats.avgVibe} />
            <MiniMeter
              label="معدل المقاطع"
              value={Math.min(100, (stats.avgSyl / 10) * 100)}
              displayVal={`${stats.avgSyl}/سطر`}
            />
          </div>

          {/* إحصاء الأقسام */}
          <div className="space-y-1.5">
            <p className="text-[8px] text-white/25">الأقسام</p>
            {(Object.entries(barsBySection) as [BeatSection, LyricBar[]][])
              .filter(([, bars]) => bars.length > 0)
              .map(([section, bars]) => {
                const cfg = SECTION_CONFIG[section];
                return (
                  <div key={section} className="flex items-center gap-1.5 text-[8px]">
                    <span>{cfg.icon}</span>
                    <span className="text-white/40 flex-1">{cfg.label}</span>
                    <span
                      className="font-bold px-1 rounded text-[7px]"
                      style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
                    >
                      {bars.length}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* الآلات المستخدمة */}
          <div className="space-y-1.5">
            <p className="text-[8px] text-white/25">الآلات المستخدمة</p>
            {instruments
              .filter((inst) => lyricBars.some((b) => b.instrumentId === inst.id))
              .map((inst) => {
                const count = lyricBars.filter((b) => b.instrumentId === inst.id).length;
                return (
                  <div key={inst.id} className="flex items-center gap-1.5 text-[8px]">
                    <span>{inst.icon}</span>
                    <span className="text-white/40 flex-1 truncate">{inst.nameAr}</span>
                    <span
                      className="font-bold text-[7px] px-1 rounded"
                      style={{ backgroundColor: inst.color + "20", color: inst.color }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* نصائح */}
          <QuickTips avgFlow={stats.avgFlow} avgSyl={stats.avgSyl} />
        </div>
      )}
    </div>
  );
};

// ── مقياس مصغر ──
const MiniMeter: React.FC<{
  label: string; value: number; displayVal?: string;
}> = ({ label, value, displayVal }) => {
  const color = value >= 70 ? "#10B981" : value >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[8px]">
        <span className="text-white/35">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>
          {displayVal ?? `${Math.round(value)}%`}
        </span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
};

// ── نصائح سريعة ──
const QuickTips: React.FC<{ avgFlow: number; avgSyl: number }> = ({ avgFlow, avgSyl }) => {
  const tips: string[] = [];
  if (avgSyl > 11) tips.push("⚡ المقاطع كثيرة - خفف");
  if (avgSyl < 4) tips.push("💡 أضف كلمات - قصير");
  if (avgFlow < 60) tips.push("🔄 راجع توزيع الكلمات");
  if (tips.length === 0) tips.push("✅ الفلو سليم");

  return (
    <div className="bg-black/20 rounded-lg p-2 border border-white/[0.04] space-y-0.5">
      {tips.map((tip, i) => (
        <p key={i} className="text-[7px] text-amber-200/60 leading-relaxed">{tip}</p>
      ))}
    </div>
  );
};
