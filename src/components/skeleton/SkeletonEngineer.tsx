import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Hash,
  Zap,
  Grid,
  Trash2,
  Plus,
  Sparkles,
  Volume2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Play,
  RotateCcw,
  Edit3,
  HelpCircle,
  Loader2,
  Award,
  Music,
} from "lucide-react";
import { useFlowMethodologyStore } from "../../store/flowMethodologyStore";
import { generateQuatrain } from "../../services/skeletonEngine";
import { RhymeScheme, SyncopationLevel, Bar, Beat } from "../../types/flowEngine.types";
import { moraEngine } from "../../services/moraEngine";
import { lyricProcessorEngine } from "../../services/lyricProcessorEngine";

export function SkeletonEngineer() {
  const {
    activeRhymeScheme,
    activeQuatrains,
    syncopationConfig,
    actions,
  } = useFlowMethodologyStore();

  const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null);
  const [expandedQuatrains, setExpandedQuatrains] = useState<Record<string, boolean>>({});
  const [activeLyricBarId, setActiveLyricBarId] = useState<string | null>(null);
  const [lyricInputs, setLyricInputs] = useState<Record<string, string>>({});
  const [sequencerActiveBarId, setSequencerActiveBarId] = useState<string | null>(null);
  const [sequencerStep, setSequencerStep] = useState<number>(-1);

  // Auto-expand the first quatrain by default
  useEffect(() => {
    if (activeQuatrains.length > 0 && Object.keys(expandedQuatrains).length === 0) {
      setExpandedQuatrains({ [activeQuatrains[0].id]: true });
    }
  }, [activeQuatrains]);

  // Handle Metronome / Beat simulation
  useEffect(() => {
    if (!sequencerActiveBarId) {
      setSequencerStep(-1);
      return;
    }

    const interval = setTimeout(() => {
      setSequencerStep((prev) => {
        if (prev >= 3) {
          return 0; // Loop or stop
        }
        return prev + 1;
      });
    }, 300); // Simulated 100-200 BPM interval

    return () => clearTimeout(interval);
  }, [sequencerActiveBarId, sequencerStep]);

  const toggleQuatrainAccordion = (id: string) => {
    setExpandedQuatrains((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddQuatrainLocal = () => {
    // Generate a fresh quatrain with current scheme and add it to the central store
    const nextQ = generateQuatrain(activeRhymeScheme, "storytelling");
    actions.addQuatrain(nextQ);
    setExpandedQuatrains((prev) => ({ ...prev, [nextQ.id]: true }));
  };

  const handleUpdateBeatLocal = (
    quatrainId: string,
    barIndex: number,
    beatIndex: number,
    beatUpdates: Partial<Beat>
  ) => {
    const quatrain = activeQuatrains.find((q) => q.id === quatrainId);
    if (!quatrain) return;
    const bar = quatrain.bars[barIndex];
    if (!bar) return;

    const updatedBeats = [...bar.beats];
    updatedBeats[beatIndex] = {
      ...updatedBeats[beatIndex],
      ...beatUpdates,
    };

    actions.updateBar(quatrainId, barIndex, { beats: updatedBeats });
  };

  // Smart lyric splitter & allocator
  const handleDistributeLyrics = (quatrainId: string, barIndex: number, barId: string) => {
    const rawText = lyricInputs[barId];
    if (!rawText || !rawText.trim()) return;

    // Split text by space or hyphen
    const words = rawText.trim().split(/\s+/).filter(Boolean);
    const quatrain = activeQuatrains.find((q) => q.id === quatrainId);
    if (!quatrain) return;
    const bar = quatrain.bars[barIndex];
    if (!bar) return;

    const updatedBeats = bar.beats.map((beat, idx) => {
      // Decompose words into 4 slots
      // 1 Word per slot if possible, or bundle leftover words in the remaining slots
      let syllable = "";
      if (words.length <= 4) {
        syllable = words[idx] || "";
      } else {
        if (idx === 0) syllable = words[0];
        else if (idx === 1) syllable = words[1];
        else if (idx === 2) syllable = words[2];
        else syllable = words.slice(3).join(" "); // Bundle rest of words in the 4th slot
      }

      // Quick vowel analysis using Arabic traits
      const hasVowel = /[\u064E\u064F\u0650\u064B\u064C\u064D]|ا|و|ي/.test(syllable);

      return {
        ...beat,
        syllable,
        hasVowel,
      };
    });

    actions.updateBar(quatrainId, barIndex, { beats: updatedBeats });
    setActiveLyricBarId(null); // Close decomposition portal
  };

  const currentBpmWeight = useMemo(() => {
    return [0, 25, 45, 65][syncopationConfig.level - 1] || 0;
  }, [syncopationConfig.level]);

  const rhymeSchemes: { value: RhymeScheme; label: string; desc: string; patternString: string }[] = [
    { value: "AABB", label: "مزدوج (AABB)", desc: "سلس للتدريب السريع وخصم الروي المتتالي", patternString: "A A B B" },
    { value: "ABAB", label: "متناوب (ABAB)", desc: "مثالي للكوبليه السردي والنبرات الجدية", patternString: "A B A B" },
    { value: "ABBA", label: "دائري (ABBA)", desc: "يخلق تعبئة سمعية فريدة حول مركز القافية", patternString: "A B B A" },
    { value: "AAAA", label: "سد وصد (AAAA)", desc: "ضربات متلاحقة قاسية للغاية تصعق المستمع", patternString: "A A A A" },
    { value: "FREE", label: "شعر حر (FREE)", desc: "شعر عمودي حديث مع مسافات سنكبة حرة", patternString: "X X X X" },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── اللوحة العلوية: التحكم بالتوقيت والقوالب ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* مهندس قوالب التقفية */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
              <Hash className="w-4 h-4" />
              <span>مهندس القالب و الموازين</span>
            </h3>
            <span className="text-[10px] text-text-muted font-mono bg-white/5 px-2 py-0.5 rounded">
              Rhyme Scheme
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {rhymeSchemes.map((scheme) => {
              const isActive = activeRhymeScheme === scheme.value;
              return (
                <button
                  key={scheme.value}
                  onClick={() => actions.setRhymeScheme(scheme.value)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-right transition-all group ${
                    isActive
                      ? "bg-gold-400/10 border-gold-400/60 text-gold-200 shadow-md"
                      : "bg-bg-base/30 border-white/5 hover:border-white/10 hover:bg-bg-base/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{scheme.label}</span>
                      <span className="bg-white/5 text-text-muted text-[8px] font-mono px-1.5 py-0.5 rounded">
                        {scheme.patternString}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-secondary">
                      {scheme.desc}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isActive
                        ? "border-gold-400 bg-gold-400 text-bg-base font-black text-[9px]"
                        : "border-white/20 group-hover:border-white/40"
                    }`}
                  >
                    {isActive && "✓"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ضابط السنكبة الفني والموازنة */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 animate-bounce" />
                <span>تدرج النبر الشاذ (السنكبة)</span>
              </h3>
              <span className="text-[10px] text-text-muted font-mono bg-white/5 px-2 py-0.5 rounded">
                Syncopation Scale
              </span>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              قم بالتلاعب بتوقيت الكلمات والوقفات لإخراجها عن الدقات الرئيسية المعتادة. السنكبة تخلق الحماس والمباغتة الزمنية للرابر الماهر لكسر الرتابة.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((level) => {
                const isActive = syncopationConfig.level === level;
                const levelNames = ["الرصين", "المتماوج", "المتسارع", "النخبة"];
                return (
                  <button
                    key={level}
                    onClick={() => actions.setSyncopationLevel(level as SyncopationLevel)}
                    className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border transition-all ${
                      isActive
                        ? "bg-gold-400/20 border-gold-400 text-gold-300 shadow-[0_0_15px_rgba(212,160,23,0.15)]"
                        : "bg-bg-base/30 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className="text-base font-black font-mono">{level}</span>
                    <span className="text-[9px] text-text-secondary mt-1 whitespace-nowrap">
                      {levelNames[level - 1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-bg-base/50 p-4 rounded-xl border border-white/5 space-y-3 mt-4">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-text-muted flex items-center gap-1">
                <span>معامل ارتعاش السوينغ (Swing Shift):</span>
                <span className="text-[9px] text-text-muted/60">(رصد زمن إزاحة الكيك)</span>
              </span>
              <span className="text-gold-400 font-mono font-bold">
                {currentBpmWeight}%
              </span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gold-400 h-full transition-all duration-300"
                style={{ width: `${currentBpmWeight}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── الجسم الرئيسي للرباعيات والبارات ─── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <div className="flex items-center gap-1.5">
            <Grid className="w-5 h-5 text-gold-400" />
            <h3 className="text-sm font-black text-text-primary">
              هندسة النبضات اللفظية للبارات
            </h3>
          </div>
          <button
            onClick={handleAddQuatrainLocal}
            className="px-3 py-1.5 bg-gold-400 hover:bg-gold-400/90 text-bg-base rounded-xl text-xs font-black flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>رباعية جديدة</span>
          </button>
        </div>

        {activeQuatrains.length === 0 ? (
          <div className="py-12 text-center text-text-secondary space-y-3">
            <p className="text-xs">لا توجد أي رباعية فعالّة بعد في هذا الفلو.</p>
            <button
              onClick={handleAddQuatrainLocal}
              className="text-xs text-gold-400 underline font-bold"
            >
              انقر هنا لإنشاء أول رباعية
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeQuatrains.map((quatrain, qIdx) => {
              const isExpanded = expandedQuatrains[quatrain.id];
              return (
                <div key={quatrain.id} className="border border-white/5 rounded-xl overflow-hidden">
                  {/* رأس الأكورديون للرباعية */}
                  <div
                    onClick={() => toggleQuatrainAccordion(quatrain.id)}
                    className="flex justify-between items-center bg-bg-base/60 p-4 cursor-pointer hover:bg-bg-base/80 select-none transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-gold-400/10 border border-gold-400/20 text-gold-400 rounded-lg flex items-center justify-center font-bold text-xs">
                        {qIdx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-black text-text-primary">
                          رباعية التصميم الفلوية #{qIdx + 1}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] text-text-muted mt-0.5">
                          <span>النمط: {quatrain.rhymeScheme}</span>
                          <span>•</span>
                          <span>المؤشر الحركي: {quatrain.coherenceScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.removeQuatrain(quatrain.id);
                        }}
                        className="p-1 text-text-muted hover:text-neural-crimson rounded transition-all"
                        title="حذف الرباعية بأكملها"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* جسم الأكورديون للبارات */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-[#0c0c14]/40">
                      {quatrain.bars.map((bar, barIdx) => {
                        const lyricBarId = `${quatrain.id}-${barIdx}`;
                        const isLyricEditorOpen = activeLyricBarId === lyricBarId;
                        const isPlayingInSim = sequencerActiveBarId === bar.id;

                        // Perform on-the-fly Acoustic Resonance detection using the imported Engine!
                        const fullText = bar.beats.map((b) => b.syllable).join(" ");
                        const barAnalysis = moraEngine.analyzeAcousticResonance(fullText);

                        return (
                          <div
                            key={bar.id}
                            className={`p-4 rounded-xl border transition-all space-y-4 relative ${
                              isPlayingInSim
                                ? "border-gold-400 bg-gold-400/5 shadow-[0_0_15px_rgba(212,160,23,0.1)]"
                                : "border-white/5 bg-bg-base/20 hover:border-white/10"
                            }`}
                          >
                            {/* شريط معلومات البار العلوي */}
                            <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-gold-400/10 border border-gold-400/20 text-gold-400 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold">
                                  {barIdx + 1}
                                </span>
                                <span className="text-text-secondary font-black">بار {barIdx + 1}</span>

                                {bar.rhymeEndSound && (
                                  <span className="bg-neural-amethyst/10 border border-neural-amethyst/20 text-neural-amethyst text-[9px] px-2 py-0.5 rounded-md font-bold">
                                    الروي المكتشف: {bar.rhymeEndSound}
                                  </span>
                                )}

                                {/* Structural role label suggested by Mora Engine */}
                                <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-widest ${
                                  barAnalysis.suggestedRole === "punchline"
                                    ? "bg-neural-crimson/15 text-neural-crimson border border-neural-crimson/20"
                                    : barAnalysis.suggestedRole === "bridge"
                                    ? "bg-neural-sapphire/15 text-neural-sapphire border border-neural-sapphire/20"
                                    : "bg-white/5 text-text-muted"
                                }`}>
                                  {barAnalysis.suggestedRole === "punchline"
                                    ? "صدمة PUNCHLINE"
                                    : barAnalysis.suggestedRole === "bridge"
                                    ? "جسرية BRIDGE"
                                    : "مقطع رئيسي VERSE"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Simulated Sequencer Player */}
                                <button
                                  onClick={() => {
                                    if (isPlayingInSim) {
                                      setSequencerActiveBarId(null);
                                    } else {
                                      setSequencerActiveBarId(bar.id);
                                      setSequencerStep(0);
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all ${
                                    isPlayingInSim
                                      ? "bg-neural-crimson/20 text-neural-crimson border border-neural-crimson/30"
                                      : "bg-white/5 text-text-secondary hover:bg-white/10"
                                  }`}
                                  title="تشغيل تجريبي مرئي لزمن البار"
                                >
                                  <Play className={`w-3 h-3 ${isPlayingInSim ? "animate-ping text-neural-crimson" : ""}`} />
                                  <span>{isPlayingInSim ? "إيقاف المحاكاة" : "تشغيل مرئي"}</span>
                                </button>

                                {/* Smart lyric split toggler */}
                                <button
                                  onClick={() => setActiveLyricBarId(isLyricEditorOpen ? null : lyricBarId)}
                                  className="p-1.5 bg-white/5 border border-white/10 hover:border-gold-400/30 text-text-secondary hover:text-gold-300 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all"
                                >
                                  <Music className="w-3 h-3" />
                                  <span>تسكين وتفكيك ذكي للسطر</span>
                                </button>

                                <div className="text-text-muted text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded">
                                  صلابة: {barAnalysis.overallResonance}%
                                </div>
                                <div className="text-text-muted text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded">
                                  الكثافة: {bar.syllableCount} مقاطع
                                </div>
                              </div>
                            </div>

                            {/* بوابة التفكيك الصوتي التفاعلية للبار */}
                            {isLyricEditorOpen && (
                              <div className="p-3 bg-gold-400/5 border border-gold-400/20 rounded-xl space-y-2.5 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-gold-300">
                                    تفكيك الكلمات وتسكينها على الدقات الأربعة
                                  </span>
                                  <button
                                    onClick={() => setActiveLyricBarId(null)}
                                    className="text-[9px] text-text-muted hover:text-text-primary"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={lyricInputs[bar.id] || ""}
                                    onChange={(e) =>
                                      setLyricInputs((prev) => ({ ...prev, [bar.id]: e.target.value }))
                                    }
                                    placeholder="اكتب باراً كاملاً هنا، مثل: فلو سريع كالسهم الصاعد"
                                    className="flex-1 bg-bg-base border border-white/5 rounded-lg p-2 text-xs text-text-primary focus:outline-none"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleDistributeLyrics(quatrain.id, barIdx, bar.id);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleDistributeLyrics(quatrain.id, barIdx, bar.id)}
                                    className="bg-gold-400 text-bg-base text-xs font-black px-4 py-2 rounded-lg transition-all"
                                  >
                                    توزيع تلقائي
                                  </button>
                                </div>
                                <p className="text-[9px] text-text-muted">
                                    * سيقوم النظام بتحليل مخارج الحروف الشديدة وتوزيع التراكيب لتقسيم الكلمات على الدقات بالتساوي.
                                </p>
                              </div>
                            )}

                            {/* شبكة ضرب البيت والنبضات المعلقة */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                              {bar.beats.map((beat, bIdx) => {
                                const idStr = `${bar.id}-${beat.position}`;
                                const isHovered = hoveredBeatId === idStr;
                                const isBeatStepActiveInPlay = isPlayingInSim && sequencerStep === bIdx;

                                return (
                                  <div
                                    key={beat.id}
                                    className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                                      isBeatStepActiveInPlay
                                        ? "bg-gold-400/25 border-gold-400 scale-[1.03] shadow-[0_0_12px_rgba(212,160,23,0.3)]"
                                        : beat.syllable
                                        ? "bg-bg-base/60 border-gold-400/20"
                                        : "bg-bg-base/30 border-white/5"
                                    }`}
                                    onMouseEnter={() => setHoveredBeatId(idStr)}
                                    onMouseLeave={() => setHoveredBeatId(null)}
                                  >
                                    {/* تلميح إشارة الخطوة الجارية في المحاكاة */}
                                    {isBeatStepActiveInPlay && (
                                      <div className="absolute top-0 right-0 left-0 h-1 bg-gold-400 animate-pulse" />
                                    )}

                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] text-text-muted font-bold font-mono uppercase">
                                        نبضة {beat.position}
                                      </span>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            handleUpdateBeatLocal(quatrain.id, barIdx, bIdx, {
                                              isSpike: !beat.isSpike,
                                            });
                                          }}
                                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                                            beat.isSpike
                                              ? "bg-neural-crimson text-white scale-110 shadow-sm"
                                              : "bg-white/5 text-text-muted hover:bg-white/10"
                                          }`}
                                          title="تفعيل نبض التنغيم الحاد (Spike)"
                                        >
                                          ⚡
                                        </button>
                                        <span
                                          className={`text-[8px] font-mono rounded px-1.5 py-0.5 tracking-wider uppercase ${
                                            beat.accent === "strong"
                                              ? "bg-gold-400 text-bg-base font-black"
                                              : beat.accent === "ghost"
                                              ? "bg-text-secondary/20 text-text-secondary"
                                              : "bg-white/5 text-text-muted"
                                          }`}
                                        >
                                          {beat.accent}
                                        </span>
                                      </div>
                                    </div>

                                    <input
                                      type="text"
                                      value={beat.syllable}
                                      onChange={(e) => {
                                        handleUpdateBeatLocal(quatrain.id, barIdx, bIdx, {
                                          syllable: e.target.value,
                                        });
                                      }}
                                      placeholder="اكتب مقطع..."
                                      className="w-full bg-bg-surface/60 border border-white/5 focus:border-gold-400/50 rounded-lg p-2 text-xs text-text-primary text-center focus:outline-none focus:ring-0 placeholder:text-text-muted/60"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── اللوحة السفلية: المخطط والنماذج المرجعية للشبكة الإيجابية ─── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-gold-400" />
          <h4 className="text-xs font-black text-gold-300">نموذج الشبكة الأساسية (Rhythm Blueprint)</h4>
        </div>
        <p className="text-[11px] text-text-secondary">
          التركيب الإيقاعي العربي لراب الفلو يعتمد على أربعة دقات متتابعة. دقة 1 و 3 تدعم الهاي هات والكيك الحاد، بينما 2 و 4 تستقطب السنير وصخب النهايات.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { pos: 1, type: "ثقيل (الكيك الأول)", label: "حجر الأساس", accent: "downbeat" },
            { pos: 2, type: "خفيف (السنير المتمم)", label: "بداية الانحناء", accent: "upbeat" },
            { pos: 3, type: "ثقيل (الكيك التابع)", label: "نبضة الدفع", accent: "downbeat" },
            { pos: 4, type: "خفيف (سنير القفلة)", label: "موقع نهاية الروي والقافية", accent: "upbeat" },
          ].map((item) => (
            <div key={item.pos} className="border border-white/5 bg-bg-base/20 p-3.5 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-gold-400 font-bold">دقة {item.pos}</span>
                <span className="text-text-muted/60">{item.accent}</span>
              </div>
              <p className="text-xs font-bold text-text-primary">{item.type}</p>
              <p className="text-[10px] text-text-secondary">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
