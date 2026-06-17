import React from "react";
import {
  Activity,
  User,
  Zap,
  Check,
  TrendingUp,
  Sliders,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useFlowMethodologyStore } from "../../store/flowMethodologyStore";
import { DEFAULT_EMOTION_CURVES, generateDefaultCurve } from "../../services/intonationEngine";
import { EmotionType } from "../../types/flowEngine.types";

export function IntonationMaster() {
  const { intonationCurve, actions } = useFlowMethodologyStore();

  const emotions: { value: EmotionType; label: string; desc: string; artist: string }[] = [
    { value: "storytelling", label: "سردي (Storytelling)", desc: "متزن ومرن، رصين للإلقاء الروائي", artist: "شب جديد" },
    { value: "rage", label: "ثوري / غاضب (Rage)", desc: "قفزات حادة ونبرة هجومية عالية الطاقة", artist: "السبع" },
    { value: "melancholy", label: "مكتئب (Melancholy)", desc: "منخفض تراجيدي حزين لمحاكاة الخيانة أو الندم", artist: "السينابتيك" },
    { value: "triumph", label: "منتصر / فخور (Triumph)", desc: "رنان وقوي يُعبّر عن التفوق والمجد", artist: "دبل كليك" },
    { value: "sarcasm", label: "متهكم / ساخر (Sarcasm)", desc: "انحناءات زئبقية سريعة متهكمة ومضحكة", artist: "أبو الأنوار" },
    { value: "hype", label: "حماسي صاخب (Hype)", desc: "شديد لترهيب الجماهير ودفع الهتاف", artist: "مروان بابلو" },
  ];

  const handleSelectEmotion = (emotion: EmotionType) => {
    const curve = generateDefaultCurve(emotion);
    actions.setIntonationCurve(curve);
    actions.refreshMatrix();
  };

  // إعداد البيانات للرسم البياني
  const chartData = intonationCurve.map((point) => ({
    name: point.label,
    time: Math.round(point.time * 100),
    pitch: point.pitch,
  }));

  const activeEmotion = intonationCurve[0]?.emotion || "storytelling";

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── الأنماط الصوتية العاطفية ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg overflow-y-auto max-h-[460px]">
          <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5 border-b border-white/5 pb-2.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>قوالب طبقة الحنجرة</span>
          </h3>

          <div className="space-y-2">
            {emotions.map((emo) => {
              const isSelected = activeEmotion === emo.value;
              return (
                <button
                  key={emo.value}
                  onClick={() => handleSelectEmotion(emo.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-right transition-all group ${
                    isSelected
                      ? "bg-neural-amethyst/10 border-neural-amethyst text-neural-amethyst"
                      : "bg-bg-base/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>{emo.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-neural-amethyst animate-ping" />}
                    </div>
                    <div className="text-[9px] text-text-secondary mt-1">
                      {emo.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── الرسم التفاعلي المتقدم للفولت الإنشادي ──────── */}
        <div className="md:col-span-2 bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>رسم بياني لنبرة الصوت (Intonation Contour)</span>
              </h3>
              <span className="text-[10px] text-text-muted">Pitch Envelope</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-2">
              الخط النغمي أدناه يُمثّل الصعود والانخفاض والسرعة لتغيير النبر التعبيري خلال مدة البيت الإنشادي المقترح.
            </p>
          </div>

          {/* مساحة الرسم البياني الفعلي */}
          <div className="h-64 w-full bg-bg-base/40 p-3 rounded-xl border border-white/5 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="pitchColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4A4868" fontSize={9} tickLine={false} />
                <YAxis stroke="#4A4868" fontSize={9} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#12121A", borderColor: "rgba(255,255,255,0.06)", borderRadius: "8px", direction: "rtl", textAlign: "right" }}
                  labelStyle={{ fontSize: "10px", color: "#9A94AB" }}
                  itemStyle={{ fontSize: "11px", color: "#F2EEE8" }}
                />
                <Area type="monotone" dataKey="pitch" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#pitchColor)" />
                <ReferenceLine y={50} stroke="#4A4868" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* المحاكاة الحية والتسجيل */}
          <div className="bg-bg-base/50 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neural-amethyst/15 flex items-center justify-center text-neural-amethyst border border-neural-amethyst/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-text-muted">المرجع التدريبي المقترح:</div>
                <div className="text-xs font-bold text-text-primary">
                  {emotions.find((e) => e.value === activeEmotion)?.artist || "شب جديد"}
                </div>
              </div>
            </div>

            {/* تعديل يدوي سريع لكل النبرات */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {intonationCurve.map((point, index) => (
                <div key={index} className="flex flex-col items-center bg-bg-surface/80 p-1.5 rounded border border-white/5 min-w-[50px]">
                  <span className="text-[7px] text-text-muted">{point.label}</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={point.pitch}
                    onChange={(e) => {
                      const newCurve = [...intonationCurve];
                      newCurve[index] = { ...point, pitch: Math.max(10, Math.min(100, parseInt(e.target.value) || 50)) };
                      actions.setIntonationCurve(newCurve);
                      actions.refreshMatrix();
                    }}
                    className="w-10 text-center bg-transparent border-0 font-mono text-xs text-gold-300 font-bold focus:outline-none focus:ring-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
