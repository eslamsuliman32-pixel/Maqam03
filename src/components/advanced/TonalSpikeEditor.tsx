import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Plus,
  Trash2,
  TrendingDown,
  Music,
  Maximize2,
  GitCommit,
  BrainCircuit,
  Settings,
} from "lucide-react";
import { useFlowMethodologyStore } from "../../store/flowMethodologyStore";
import { createTonalSpike, calculateConsonantAlignment, calculateSyncopationTension } from "../../services/advancedFlowEngine";
import { TonalSpike, EmotionType } from "../../types/flowEngine.types";

export function TonalSpikeEditor() {
  const {
    tonalSpikes,
    activeQuatrains,
    beatRideConfig,
    syncopationConfig,
    actions,
  } = useFlowMethodologyStore();

  const [selectedBar, setSelectedBar] = useState(activeQuatrains[0]?.bars[0]?.id || "");
  const [selectedBeat, setSelectedBeat] = useState<1 | 2 | 3 | 4>(1);
  const [spikeType, setSpikeType] = useState<TonalSpike["spikeType"]>("pitch-rise");
  const [intensity, setIntensity] = useState(80);
  const [targetSyllable, setTargetSyllable] = useState("كا");

  // تجميع كافة البارات المتاحة للاختيار
  const allBars = activeQuatrains.flatMap((q) => q.bars);

  // تحديث البار المحدد الأولي إذا غير صالح
  React.useEffect(() => {
    if (allBars.length > 0 && !selectedBar) {
      setSelectedBar(allBars[0].id);
    }
  }, [allBars]);

  const handleAddSpike = () => {
    if (!selectedBar) return;
    const newSpike = createTonalSpike(
      selectedBar,
      selectedBeat,
      spikeType,
      intensity,
      targetSyllable,
      activeQuatrains[0]?.overallEmotion || "storytelling"
    );
    actions.addTonalSpike(newSpike);
    actions.refreshMatrix();
  };

  const getBarLabel = (barId: string) => {
    const idx = allBars.findIndex((b) => b.id === barId);
    return idx !== -1 ? `الامتداد الإيقاعي ${idx + 1}` : "بار إضافي";
  };

  // حساب دقة الربط الصوتي الاستقراء من البارات
  const alignmentScore = allBars.length > 0
    ? calculateConsonantAlignment(allBars[0], beatRideConfig)
    : 75;

  const tensionScore = allBars.length > 0
    ? calculateSyncopationTension(allBars[0], syncopationConfig)
    : 45;

  const spikeTypes: { value: TonalSpike["spikeType"]; label: string; desc: string }[] = [
    { value: "pitch-rise", label: "ارتفاع النغمة الحنجري", desc: "ارتفاع حاد في التردد الأساسي" },
    { value: "pitch-drop", label: "هبوط نغمة عميق", desc: "تمهيد ثقيل للباص" },
    { value: "volume-burst", label: "تفجير صوتي انفجاري", desc: "دفع هواء مفاجئ من الحجاب" },
    { value: "rasp", label: "بحّة خشنة (Rasp)", desc: "إضافة خشونة أو غلاظة حنجرية" },
    { value: "whisper", label: "نبر هامس (Whisper)", desc: "نطق هامس ومشدود" },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── اللوحة العلوية: أدوات الهندسة وقوة الارتداد ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* قطاع رصد تطابق الحروف الصامتة الانفجارية */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>مطابق ومحاذاة الحروف (Beat Rider Engine)</span>
            </h3>
            <span className="text-[10px] text-text-muted">Consonant Sync</span>
          </div>

          <p className="text-[11px] text-text-secondary">
            يقوم هذا المحرّك بمطابقة نطق بعض الحروف الصامتة الصعبة (مثل القاف، الكاف، والطاء) مع موازين المجهار (الكيك) لتوليد ركوب إيقاعي صلب متناغم.
          </p>

          <div className="bg-bg-base/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-text-muted">درجة تطابق الحروف مع الكيك والسنير:</div>
              <div className="text-2xl font-black font-mono text-neural-emerald mt-1">
                {alignmentScore}%
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-left text-[9px] text-text-secondary font-mono">
              <div>Explosives: {beatRideConfig.explosiveConsonants.join(", ")}</div>
              <div>Melodic: {beatRideConfig.melodicVowels.join(", ")}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={() => {
                actions.setBeatRideConfig({
                  explosiveConsonants: ["ق", "ك", "ط"],
                });
                actions.refreshMatrix();
              }}
              className="p-2 border border-white/5 rounded-lg text-[10px] hover:border-gold-400 bg-bg-base/30 text-text-secondary"
            >
              تركيز الحروف الصلبة (ق، ك، ط)
            </button>
            <button
              onClick={() => {
                actions.setBeatRideConfig({
                  explosiveConsonants: ["ب", "ت", "د", "ض"],
                });
                actions.refreshMatrix();
              }}
              className="p-2 border border-white/5 rounded-lg text-[10px] hover:border-gold-400 bg-bg-base/30 text-text-secondary"
            >
              تركيز الحروف الرقيقة (ب، ت، د)
            </button>
          </div>
        </div>

        {/* قطاع رصد التوتر غير المنتظم لشبكة الإيقاع الحرة */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>مؤشر التوتر والتعقيد الزمني (Rhythmic Tension)</span>
            </h3>
            <span className="text-[10px] text-text-muted">Polyrhythmic Tension</span>
          </div>

          <p className="text-[11px] text-text-secondary">
            مقدار انحراف التدفق الصوتي عن خطوط الإملاء التقليدية والرباعيات، معززاً بالغموض السمعي والنغمات الشبحية السريعة.
          </p>

          <div className="bg-bg-base/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-text-muted">التوتر الإيقاعي المركب:</div>
              <div className="text-2xl font-black font-mono text-neural-amethyst mt-1">
                {tensionScore}%
              </div>
            </div>
            <button
              onClick={() => {
                actions.updateSyncopationConfig({
                  polyrhythmEnabled: !syncopationConfig.polyrhythmEnabled,
                });
                actions.refreshMatrix();
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                syncopationConfig.polyrhythmEnabled
                  ? "bg-neural-amethyst text-white border-neural-amethyst shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  : "bg-bg-base border-white/5 text-text-secondary hover:border-white/10"
              }`}
            >
              {syncopationConfig.polyrhythmEnabled ? "✓ تم تفعيل بولي ريتم" : "بوليريزم غير نشط"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-text-muted">حجم النغمة الشبحية (Ghost%):</span>
              <input
                type="range"
                min="0"
                max="100"
                value={syncopationConfig.ghostNoteFrequency}
                onChange={(e) => {
                  actions.updateSyncopationConfig({ ghostNoteFrequency: parseInt(e.target.value) });
                  actions.refreshMatrix();
                }}
                className="w-full accent-neural-amethyst"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-text-muted">نبر الدقات الخلفية (On Offbeats%):</span>
              <input
                type="range"
                min="0"
                max="100"
                value={syncopationConfig.offbeatEmphasis}
                onChange={(e) => {
                  actions.updateSyncopationConfig({ offbeatEmphasis: parseInt(e.target.value) });
                  actions.refreshMatrix();
                }}
                className="w-full accent-neural-amethyst"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── محرر إضافة الارتفاع والبحّات الفجائية (Tonal Spikes) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* استمارة الإضافة */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg md:col-span-1">
          <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
            <Plus className="w-3.5 h-3.5" />
            <span>حقن هزة مباغتة (Tonal Spike)</span>
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] text-text-muted">البار المستهدف:</label>
              <select
                value={selectedBar}
                onChange={(e) => setSelectedBar(e.target.value)}
                className="w-full bg-bg-base border border-white/5 rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
              >
                {allBars.map((bar) => (
                  <option key={bar.id} value={bar.id}>
                    {getBarLabel(bar.id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-text-muted">النبضة (Beat Position):</label>
              <select
                value={selectedBeat}
                onChange={(e) => setSelectedBeat(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full bg-bg-base border border-white/5 rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    نبضة {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-text-muted">نوع الضغط الصوتي:</label>
              <select
                value={spikeType}
                onChange={(e) => setSpikeType(e.target.value as TonalSpike["spikeType"])}
                className="w-full bg-bg-base border border-white/5 rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
              >
                {spikeTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-text-muted">الكلمة المحددة للضغط:</label>
              <input
                type="text"
                value={targetSyllable}
                onChange={(e) => setTargetSyllable(e.target.value)}
                placeholder="مثال: ياه، كلا، غضب"
                className="w-full bg-bg-base border border-white/5 rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
              />
            </div>

            <button
              onClick={handleAddSpike}
              className="w-full py-2.5 bg-neural-crimson hover:bg-neural-crimson/95 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>حقن الهزة في المخطط</span>
            </button>
          </div>
        </div>

        {/* عرض الهزات النشطة */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-2.5">
              <Maximize2 className="w-3.5 h-3.5 text-neural-crimson animate-pulse" />
              <span>قائمة قفزات التعبير الحادة النشطة</span>
            </h3>
            <p className="text-[10px] text-text-secondary mt-2">
              الهزات المحقونة تصنع تعليماً درامياً مميزاً وترفع من حماس المستمع بشكل مفاجئ.
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[280px] my-3 pr-1">
            {tonalSpikes.length === 0 ? (
              <div className="text-center text-text-muted text-xs py-8 font-sans">
                لا توجد هزات تعبيرية محقونة في هذه الشبكة بعد.
              </div>
            ) : (
              tonalSpikes.map((spike) => (
                <div
                  key={spike.id}
                  className="flex justify-between items-center p-3 bg-bg-base/40 border border-white/5 rounded-xl text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${spike.visualColor}`} />
                    <span className="text-text-primary font-bold font-sans">
                      {spikeTypes.find((t) => t.value === spike.spikeType)?.label || spike.spikeType}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="text-gold-300 font-sans font-bold">
                      "{spike.targetSyllable}"
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-text-secondary font-sans">
                      {getBarLabel(spike.barId)} • نبضة {spike.beatPosition}
                    </span>
                    <button
                      onClick={() => {
                        actions.removeTonalSpike(spike.id);
                        actions.refreshMatrix();
                      }}
                      className="p-1 hover:bg-neural-crimson/10 text-text-muted hover:text-neural-crimson rounded transition-all"
                      title="حذف الهزة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-[10px] text-text-muted">
            إجمالي الهزات النشطة: <span className="text-neural-crimson font-bold font-mono">{tonalSpikes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
