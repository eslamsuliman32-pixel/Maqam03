// src/components/sonic/SonicFingerprintPanel.tsx
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  AudioWaveform, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  Music,
  Zap,
  HelpCircle,
} from "lucide-react";
import { useSonicStore } from "../../store/sonicStore";
import { SonicGrid, COLOR_THEMES } from "./SonicGrid";

const EXAMPLE_VERSES = [
  {
    title: "مقام الغضب والقوافي المسترسلة",
    text: `أنا المكتوب في لوح القوافي بقرار حامي
تراب الأرض يرجف تحت رجليني بصدى أنغامي
حروفي نار تكوي صدر كل حاقد وعامي
كلامي سيف يقطع كل شك وكل أوهامي`,
  },
  {
    title: "تطابق المورا والتقطيع الهادي",
    text: `سهرنا الليل والهاجس يراودنا بصمت الروح
رسمنا الحلم في لوحة زواياها عذاب ونوح
كتمنا الهم في صدري وعيا بالخفايا يبوح
سقينا الورد دمعات تفتح عطرها الفواح`,
  },
];

export const SonicFingerprintPanel = () => {
  const { verse, fingerprint, analyzeVerse, reset } = useSonicStore();
  const [inputText, setInputText] = useState("");
  const [showInfo, setShowInfo] = useState(true);

  // Initialize with the first example verse if state is empty
  useEffect(() => {
    if (!verse) {
      setInputText(EXAMPLE_VERSES[0].text);
      analyzeVerse(EXAMPLE_VERSES[0].text);
    } else {
      // Re-hydrate input text from stored verse
      const storedText = verse.bars.map((b) => b.text).join("\n");
      setInputText(storedText);
    }
  }, []);

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    analyzeVerse(inputText);
  };

  const handleLoadExample = (text: string) => {
    setInputText(text);
    analyzeVerse(text);
  };

  const totalSyllables = verse?.bars.reduce((acc, bar) => acc + bar.segments.length, 0) || 0;
  const matchGroupsCount = fingerprint?.groups.length || 0;

  return (
    <div className="w-full flex flex-col gap-6" dir="rtl">
      {/* Header Panel */}
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 relative overflow-hidden shrink-0 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-yellow-500 to-indigo-500 opacity-60" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center glow-accent">
              <AudioWaveform className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-arabic text-white flex items-center gap-2">
                محرك البصمة الصوتية <span className="text-[10px] font-mono tracking-widest text-gold-400 border border-gold-400/20 px-2 py-0.5 rounded">SFE v2.0</span>
              </h2>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Sonic Fingerprint Engine — تحليل عروضي دقيق مع التقطيع الإيقاعي والمطابقة التقريبية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-all cursor-pointer border border-white/5"
              title="دليل الاستخدام"
            >
              <HelpCircle className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => {
                reset();
                setInputText("");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              تصفير
            </button>
          </div>
        </div>

        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-4 pt-4 border-t border-white/[0.04] text-[11px] text-text-muted leading-relaxed flex flex-col gap-3"
          >
            <p className="font-arabic font-medium">
              💡 **نظام البصمة الصوتية (SFE)** يقوم بتقطيع الأسطر الشعرية عروضياً إلى مقاطع لفظية (كل مقطع يتكون من حرفين متحركين وساكن كحد أدنى)، ثم تلوين المتشابهات بطريقة ذكية لالتقاط القوافي وعمل رصّ (Alignment) لشدة اللفظ على شبكة إيقاعية ثابتة من 16 دقة. يمكنك بعد ذلك النقر على أي خلية والكتابة بداخلها لتوليد كلمات جديدة تحافظ على نفس التوزيع العروضي والإيقاعي تماماً!
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {EXAMPLE_VERSES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadExample(ex.text)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 group"
                >
                  <FileText className="w-3.5 h-3.5 text-gold-400/60 group-hover:text-gold-400" />
                  تحميل مثال: {ex.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel: Input & Match Groups */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Input Panel */}
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-gold-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5" />
              محرر كلمات الفيرس
            </h3>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب فيرساً كاملاً هنا... كل سطر يمثل باراً موسيقياً"
              rows={6}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 font-arabic text-sm text-text-primary focus:border-gold-400 focus:ring-1 focus:ring-gold-400 outline-none resize-none transition-all leading-loose custom-scrollbar selection:bg-gold-400/30 font-medium"
            />

            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-400 hover:to-amber-600 text-bg-base font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer select-none glow-button uppercase tracking-wider font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              تحليل البنية ومطابقة الأصوات
            </button>
          </div>

          {/* Stats & Match Group Panel */}
          {verse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-surface border border-border-default rounded-2xl p-5 shadow-lg flex flex-col gap-4"
            >
              <h3 className="text-xs font-extrabold text-gold-400 uppercase tracking-widest flex items-center gap-2">
                <Music className="w-4.5 h-4.5" />
                تحليل القوافي وعروق الفلو
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 border border-white/[0.03] rounded-xl p-3 text-center">
                  <span className="text-[10px] text-text-muted block font-arabic font-semibold uppercase tracking-wider">عدد البارات</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">{verse.bars.length}</span>
                </div>
                <div className="bg-black/20 border border-white/[0.03] rounded-xl p-3 text-center">
                  <span className="text-[10px] text-text-muted block font-arabic font-semibold uppercase tracking-wider">إجمالي المقاطع</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">{totalSyllables}</span>
                </div>
              </div>

              {/* Match groups */}
              <div className="space-y-2 mt-2">
                <span className="text-[10px] font-extrabold text-white/55 font-mono uppercase tracking-wider block">
                  مجموعات التطابق الصوتي المكتشفة ({matchGroupsCount})
                </span>

                {matchGroupsCount === 0 ? (
                  <p className="text-[11px] text-text-muted italic text-center py-4 font-arabic">
                    لم يتم العثور على تكرار أو قوافي صوتية واضحة في الفيرس الحالي.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                    {fingerprint?.groups.map((group) => {
                      const theme = COLOR_THEMES[group.color];
                      return (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/[0.05]"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${theme?.dot || "bg-white"}`} />
                            <span className="text-[11px] font-arabic font-bold text-white">
                              مجموعة {group.phoneticKey}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-text-muted">
                            {group.occurrences} تكرار
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Dynamic Interactive Matrix */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-gold-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4.5 h-4.5" />
                خلية المصفوفة الصوتية التفاعلية
              </h3>
              {verse && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    تحليل ناجح
                  </span>
                </div>
              )}
            </div>

            <SonicGrid />
          </div>
        </div>
      </div>
    </div>
  );
};
