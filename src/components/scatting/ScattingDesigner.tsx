import React, { useState } from "react";
import {
  Sparkles,
  Music,
  Tv,
  Infinity as LoopIcon,
  Zap,
  Play,
  Scissors,
  Layers,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useFlowMethodologyStore } from "../../store/flowMethodologyStore";
import {
  SCAT_SYLLABLE_LIBRARY,
  BEAT_PATTERN_TEMPLATES,
  generatePatternFromBeat,
  reverseEngineerSentence,
  ReverseEngineeringResult,
  patternToDisplayString,
} from "../../services/scattingEngine";
import { InstrumentType, BeatPattern } from "../../types/flowEngine.types";

export function ScattingDesigner() {
  const { scattingSession, actions } = useFlowMethodologyStore();
  const [inputText, setInputText] = useState("");
  const [reverseResult, setReverseResult] = useState<ReverseEngineeringResult[] | null>(null);

  const handleApplyBeatTemplate = (pattern: BeatPattern) => {
    const patterns = generatePatternFromBeat(pattern, 1);
    // تحديث النمذجة الصوتية بالجلسة
    actions.updateScattingSession({
      patterns,
      targetBpm: BEAT_PATTERN_TEMPLATES[pattern].defaultBpm,
    });
    actions.refreshMatrix();
  };

  const handleReverseEngineer = () => {
    if (!inputText.trim()) return;
    const result = reverseEngineerSentence(inputText);
    setReverseResult(result);

    // تجميع الكلمات لعمل نمط مقترح مبسط في السكاتينغ الفعلي
    if (result.length > 0) {
      const allSyllables = result.flatMap((r) => r.suggestedPattern.syllables);
      const allRhythms = result.flatMap((r) => r.suggestedPattern.rhythm);

      // ترقية الكيك في الجلسة لمطابقة كلمات المستخدم المحللة
      const updatedPatterns = scattingSession.patterns.map((p) => {
        if (p.instrument === result[0].suggestedPattern.instrument) {
          return {
            ...p,
            syllables: allSyllables.slice(0, 4) as string[],
            rhythm: allRhythms.slice(0, 4) as number[],
          };
        }
        return p;
      });

      actions.updateScattingSession({ patterns: updatedPatterns });
      actions.refreshMatrix();
    }
  };

  const instrumentNames: Record<InstrumentType, string> = {
    kick: "المجهار (Kick)",
    snare: "الرنان (Snare)",
    hihat: "النحاسيات (Hi-hat)",
    bass: "العميق (Bass)",
    melody: "النغمي (Melody)",
    "vocal-chop": "مقطع حنجري (Vocal-chop)",
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── اللوحة العلوية: قوالب سريعة للمترونوم الصوتي ──────── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>قوالب إيقاعية جاهزة للتوجيه الفرعي</span>
          </h3>
          <span className="text-[10px] text-text-muted">Metronome Presets</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {(Object.keys(BEAT_PATTERN_TEMPLATES) as BeatPattern[]).map((pattern) => (
            <button
              key={pattern}
              onClick={() => handleApplyBeatTemplate(pattern)}
              className="px-3 py-2 bg-bg-base/40 border border-white/5 hover:border-gold-400/30 hover:bg-gold-400/5 text-text-secondary hover:text-gold-200 rounded-xl text-center text-xs font-bold transition-all"
            >
              <div className="truncate">{BEAT_PATTERN_TEMPLATES[pattern].description.split(" — ")[0]}</div>
              <div className="text-[9px] text-text-muted font-mono mt-0.5 uppercase">
                {pattern}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── اللوحة الوسطى: الهندسة العكسية للمقاطع ──────── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>الهندسة العكسية ونمذجة الكلمات (Reverse Engineering)</span>
          </h3>
          <span className="text-[10px] text-text-muted">Phonetic Parser</span>
        </div>

        <p className="text-[11px] text-text-secondary">
          اكتب كلمة أو جملة عربية كاملة، وسيفككها الذكاء الاصطناعي صوتياً لربطها بآلة الإيقاع المتوافقة مع مخارج حروفها.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="مثال: دَم على دَم، أضرب كاك...أو اكتب قوافيك كاملة"
            className="flex-1 bg-bg-base border border-white/5 focus:border-gold-400/50 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:ring-0"
          />
          <button
            onClick={handleReverseEngineer}
            className="px-5 py-2.5 bg-gold-400 text-bg-base text-xs font-black rounded-xl hover:bg-gold-500 transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>تفكيك صوتي قسري</span>
          </button>
        </div>

        {/* مخرجات تفكيك الحروف */}
        {reverseResult && (
          <div className="bg-bg-base/40 p-4 rounded-xl border border-white/5 space-y-3">
            <h4 className="text-[10px] text-gold-300 font-extrabold uppercase">
              تقرير التوزيع الصوتي للهرم والموازين:
            </h4>
            <div className="space-y-2">
              {reverseResult.map((res, wIdx) => (
                <div
                  key={wIdx}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 bg-bg-surface/50 rounded-lg border border-white/5 font-mono text-[10px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-black text-xs font-sans">
                      {res.originalText}
                    </span>
                    <span className="text-text-muted">⟵</span>
                    <span className="text-gold-200">
                      {res.suggestedPattern.syllables.join(" — ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    <span className="text-text-muted">الآلة المهيمنة:</span>
                    <span className="bg-gold-400/20 text-gold-200 px-1.5 py-0.5 rounded text-[9px] font-sans">
                      {instrumentNames[res.detectedInstruments[0]?.instrument || "kick"]}
                    </span>
                    <span className="text-text-muted font-bold ml-2">
                      دقة {res.overallConfidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── الأنماط الصوتية النشطة حاليًا ──────── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <h3 className="text-xs font-black text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-2.5">
          <Music className="w-3.5 h-3.5 text-gold-400" />
          <span>المزيج التدريجي للجلسة</span>
        </h3>

        <div className="space-y-3">
          {scattingSession.patterns.map((pattern, pIdx) => (
            <div
              key={pattern.id}
              className="bg-bg-base/35 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5"
            >
              <div>
                <div className="text-xs font-extrabold text-text-primary">
                  {instrumentNames[pattern.instrument]}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  قنوات الصدمة النشطة
                </div>
              </div>

              {/* المقاطع المكون منها النمط */}
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {(pattern.syllables.length > 0 ? pattern.syllables : ["·", "·", "·", "·"]).map(
                  (syllable, sIdx) => (
                    <div
                      key={sIdx}
                      className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center font-bold text-[11px] transition-all ${
                        syllable && syllable !== "·"
                          ? "bg-neural-sapphire/15 border-neural-sapphire/35 text-neural-sapphire animate-pulse"
                          : "bg-bg-base border-white/5 text-text-muted"
                      }`}
                    >
                      <span>{syllable || "·"}</span>
                      <span className="text-[7px] text-text-muted mt-0.5 font-mono">
                        {sIdx + 1}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* التحرير السريع للمقطع */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const lib = SCAT_SYLLABLE_LIBRARY[pattern.instrument];
                    const randomSyllable = lib[Math.floor(Math.random() * lib.length)];
                    const updatedSyllables = [...pattern.syllables];
                    // ضع الكلمات العشوائية بالتناوب
                    for (let i = 0; i < 4; i++) {
                      if (Math.random() > 0.4) {
                        updatedSyllables[i] = lib[Math.floor(Math.random() * lib.length)];
                      } else {
                        updatedSyllables[i] = "·";
                      }
                    }
                    const updatedPatterns = [...scattingSession.patterns];
                    updatedPatterns[pIdx] = {
                      ...pattern,
                      syllables: updatedSyllables,
                      rhythm: [250, 250, 250, 250],
                    };
                    actions.updateScattingSession({ patterns: updatedPatterns });
                    actions.refreshMatrix();
                  }}
                  className="px-2.5 py-1.5 bg-white/5 text-text-secondary hover:text-text-primary rounded text-[10px] font-bold border border-white/5"
                >
                  توليد نمط عشوائي
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
