# 🏛️ التقرير التقني الشامل: معمارية وأدوات MAQAM RAP لمنهجية الفلو

يقدم هذا التقرير تحليلاً مفصلاً للمهام والوظائف المغذية لأدوات هندسة الفلو (Flow Methodology) في نظام MAQAM RAP، مدعماً بالأكواد البرمجية التوضيحية لكل مسار ووحدة.

---

## 0/ مستودع تدفقات الفلو (MAQAM RAP)
**الوظيفة والمهمة:** 
يُعدّ المستودع `flowMethodologyStore` العقل المدبر والقلب النابض للنظام (State Manager). يقوم بتخزين ومزامنة كافة الطبقات (الهيكل، الهمهمة، التون، والهزات) في طبقة رياكت باستخدام `Zustand`. يتحكم في تدفقات البيانات، ويقوم بتغذية واجهات الرابر بكل المستجدات اللحظية للإيقاع.

**الكود البرمجي (المخزن المركزي Zustand):**
```typescript
import { create } from "zustand";
import { FlowMethodologyState } from "../types/flowEngine.types";

export const useFlowMethodologyStore = create<FlowMethodologyState>((set, get) => ({
  activeTab: "skeleton",
  activeRhymeScheme: "AABB",
  // الهيكل الأساسي للبارات والرباعيات
  activeQuatrains: [],
  // ضابط النبر الشاذ والسوينج
  syncopationConfig: { level: 1, swingFactor: 0, ghostNoteFrequency: 20 },
  // مصفوفة الدمج الكلي للطبقات المتعددة
  layeredMatrix: null,

  actions: {
    // دوال المزامنة المركزية لمعالجة الطبقات الصوتية
    refreshMatrix: () => {
      const state = get();
      if (state.activeQuatrains.length > 0) {
        set({ layeredMatrix: computeLayeredFlowMatrix(state) });
      }
    },
    // ... المزيد من النواقل الحركية ...
  }
}));
```

---

## 1/ الهيكل العظمي (Skeleton) & 10/ Skeleton
**الوظيفة والمهمة:**
وحدة `SkeletonEngineer` هي واجهة التخطيط المعماري التي يركب من خلالها مصمم الفلو "الأساسيات النوتية". تُظهر شبكة مرئية (Grid) مُقسَّمة للبارات، تُتيح تفكيك الكلمات إلى مقاطع (Syllables) لتسكينها بدقة على الدقات الإيقاعية الأربعة.

**الكود البرمجي:**
```typescript
export function SkeletonEngineer() {
  const { activeQuatrains, actions } = useFlowMethodologyStore();
  
  return (
    <div className="space-y-6">
      {/* عرض البارات داخل الرباعية وحساب النبضات الفائقة */}
      {activeQuatrains.map((q) => (
         <div key={q.id}>
           {q.bars.map((bar) => (
             <div className="grid grid-cols-4 gap-3">
               {/* ٤ نبضات لكل بار (4 Beats) */}
               {bar.beats.map((beat) => (
                 <BeatCell key={beat.id} beat={beat} />
               ))}
             </div>
           ))}
         </div>
      ))}
    </div>
  );
}
```

---

## 2/ مهندس القالب والموازين (Rhyme Architect)
**الوظيفة والمهمة:**
يتحكم في نظام التقفية (AABB, ABAB, ABBA، أو الفري ستايل الحر). يعمل هذا المهندس على فرض قواعد صوتية على نهايات البارات وإجبار البار على إغلاق القافية بشكل سلس حسب القالب المختار، مما يمنع التشتت ويصقل موازين القوافي.

**الكود البرمجي:**
```typescript
{rhymeSchemes.map((scheme) => (
  <button
    onClick={() => actions.setRhymeScheme(scheme.value)}
    className={activeRhymeScheme === scheme.value ? "border-gold-400 text-gold-200" : ""}
  >
    <div className="text-xs font-black">{scheme.label}</div>
    <div className="text-[10px]">{scheme.desc}</div> {/* مثال: (AABB) سائد وسلسل للتكرار */}
  </button>
))}
```

---

## 3/ تدرج النبر الشاذ - السنكبة (Syncopation Scale)
**الوظيفة والمهمة:**
خوارزمية دفع الكلمات وتأخيرها لخلق (Off-beats). تحتوي على 4 مستويات: بدءاً من "الرصين" وحتى "النخبة". يقوم بالتلاعب التلقائي بمواقع الوقفات (Rests) لكسر رتابة الإيقاع التقليدي، ما يسمى فنيًا بالـ Syncopation.

**الكود البرمجي:**
```typescript
const levels = [1, 2, 3, 4] as SyncopationLevel[];
const swingFactors = [0, 25, 45, 65]; // نسبة الاهتزاز أو الانحراف הזمني

<button onClick={() => actions.setSyncopationLevel(level)}>
  <span className="font-mono">{level}</span>
  <span className="text-[9px]">
    {[ "الرصين", "المتماوج", "المتسارع", "النخبة" ][level - 1]}
  </span>
</button>
```

---

## 4/ هندسة النبضات اللفظية للبارات
**الوظيفة والمهمة:**
مصفوفة تسمح للكاتب بكتابة "السيلابل" (المقطع اللفظي) على موضع كسر معين داخل البار، وتقسيم الجملة على النبضات (Beats) الأساسية لتحديد (Accent) قوي، ضعيف، أو شبحي لكل نبضة.

---

## 5/ بار القافية (Rhyme Bar / Bar Header)
**الوظيفة والمهمة:**
يُشكل الهيدر الأساسي فوق شبكة النبضات لتعريف رقم البار وإبراز "القفلة" (ما إذا كان هذا البار هو القفلة أ أم ب). يُمثل نظام توجيه مرئي للرابر ليعرف متى يجب عليه التركيز على وزن نهاية الكلمة.

**الكود البرمجي (لرؤوس البارات 4 و 5):**
```typescript
<div className="flex items-center gap-2">
  <span className="text-[10px] font-bold"> {barIndex + 1} </span>
  <span className="text-xs">بار القافية</span>
  {bar.rhymeEndSound && (
    <span className="bg-neural-amethyst/10 text-neural-amethyst text-[9px] px-1.5 py-0.5 rounded">
      نهاية الروي: {bar.rhymeEndSound}
    </span>
  )}
</div>
```

---

## 6/ نهاية الروي: (مثال: ـار / ـام)
**الوظيفة والمهمة:**
مؤشر التحليل الصوتي الذي يكتشف الحرف الأخير وحركته الممدودة (الروي). يضمن أن القافية المُنفذة تُطابق هندسة הקالب الأصلية المُختارة وتنبيه الرابر للإيقاع الدلالي (مثل: نار، دمار، عار = ـار).

---

## 7/ نبضة 1 (Beat 1)
**الوظيفة والمهمة:**
خلية الكيك الدماغية الأولى للبار. تعتبر حجر الأساس للهارموني، وعادة ما تدمر الإقاعات إذا تم تفويت أو تأخير إلقاء أول سيلابل قوي فيها. يحتوي الكود على قدرة تحديد (isSpike) لهز هذه النبضة.

**الكود البرمجي:**
```typescript
<div className={`p-3 rounded-lg border ${beat.syllable ? "bg-bg-base/60" : "bg-bg-base/20"}`}>
  <div className="flex justify-between items-center mb-1.5">
    <span className="text-[9px] font-bold">نبضة {beat.position}</span> {/* نبضة 1 */}
    <button onClick={() => toggleSpike(beat)} title="تفعيل نبض التنغيم الحاد">
      {beat.isSpike ? "⚡" : "•"}
    </button>
  </div>
  <input value={beat.syllable} placeholder="اكتب نبضة..." />
</div>
```

---

## 8/ الشدة التقديرية (Intensity Score)
**الوظيفة والمهمة:**
مقياس خوارزمي (من 0 إلى 100%) يُحلل كمية المقاطع اللفظية المزدحمة في البار بالنسبة لزمنه، مصطفاً مع التوتر وحِدة الكلمات، للتنبؤ بمدى "صعوبة" وتأثير الكلمات عند إلقائها الحقيقي.

**الكود البرمجي:**
```typescript
<div className="text-text-muted text-[10px]">
  الشدة التقديرية: {" "}
  <span className="text-neural-emerald font-bold font-mono">
    {bar.intensityScore}%
  </span>
</div>
```

---

## 9/ ديناميكية التدفق الفني (Dynamic Flow)
**الوظيفة والمهمة:**
لوحة التحكم المركزية (`FlowMethodologyHub`) التي تدمج كافة الوحدات كأنظمة متفاعلة. تُنظم المعابر وتضمن انسيابية مرور الداتا عبر السنكبة والهمهمة والهزات النغمية لخلق تجربة راب متكاملة للكاتب بدون تشتت.

---

## 11/ مدرسة السنكبة والوقفات القسرية
**الوظيفة والمهمة:**
وحدة تهتم بتعليم وتوليد الإيقاعات الحرة (Polyrhythm) والتلاعب بالتوتر الإيقاعي المركب عن طريق دفع الدقات للخلف أو الأمام بنسبة غياب محسوبة. هي الموطن الحقيقي لتوليد ما يُعرف بالتدفق الشاذ والشبحي.

**الكود البرمجي:**
```typescript
// مؤشر التوتر الإيقاعي (Rhythmic Tension)
export const calculateSyncopationTension = (bar: Bar, config: SyncopationConfig) => {
  let tension = config.level * 15;
  tension += (config.offbeatEmphasis / 100) * 20;
  if (config.polyrhythmEnabled) tension += 25;
  return Math.min(100, Math.round(tension));
};
```

---

## 12/ مختبر التحديات القسرية (Forced Challenges / Matchmaking)
**الوظيفة والمهمة:**
ميكانيكية ترفيهية وتعليمية تجبر الرابر على كتابة بارات تحت قيود عشوائية قاسية (مثل: "لا تستخدم حرف الرّاء" أو "توقف قبل النبضة الرابعة"). تقيس دمج مهارات الكتابة مع تحديات الضغط النفسي (Batting Mode). 

---

## 13/ الهمهمة الصوتية وحقن المقاطع الحرة (Scatting Engine)
**الوظيفة والمهمة:**
وحدة `ScattingDesigner` تقوم بالهندسة العكسية للكلمات (Reverse Engineering). إذا أدخلت جملة كـ "طاخ، دوم، طاخ"، تقوم بتحفيز الإيقاع المتوافق معه (Kick, Snare). تعتمد على تحويل مخارج الأحرف إلى أصوات إيقاعية كمسودة قبل كتابة الـ Lyrics الفعلية.

**الكود البرمجي:**
```typescript
const handleReverseEngineer = () => {
    // تفكيك الكلمات لعمل نمط مقترح مبسط في السكاتينغ
    const result = reverseEngineerSentence(inputText);
    const allSyllables = result.flatMap((r) => r.suggestedPattern.syllables);
    
    // حقن الكلمات الصوتية كالطبل والمجهار
    actions.updateScattingSession({ patterns: updatedPatterns });
};
```

---

## 14/ التنغيم الدرامي والمشاعر الكاسرة (Intonation & Emotional Spikes)
**الوظيفة والمهمة:**
تعمل `IntonationMaster` و `TonalSpikeEditor` معاً لضبط منحنى طبقة الصوت (Pitch Contour) والهزات المباغتة للراب (Volume Bursts). يمكن للرابر تحديد قوالب مثل "القصصي، العدواني المتهور، المتفاخر" وسيُعدل النظام توجيهات الصراخ (Spikes) في منتصف البارات أو نهاياتها لدبّ الحياة في الكلمات الجافة المكتوبة على الورق.

**الكود البرمجي:**
```typescript
import { AreaChart, Area } from "recharts";

// توليد نقاط الارتفاع والانخفاض الدرامية لمحاكاة النبرة
const chartData = intonationCurve.map((point) => ({
  name: point.label,
  time: Math.round(point.time * 100),
  pitch: point.pitch, // مقياس حِدة الصوت
}));

// حقن قفزة مفاجئة Tonal Spike
const handleAddSpike = () => {
  const newSpike = createTonalSpike(barId, beatPosition, "pitch-rise", 80, "كلا!");
  actions.addTonalSpike(newSpike);
};
```

---
*تم توليد هذا التقرير آلياً من مهندس الذكاء الاصطناعي بنظام MAQAM RAP v2.0.*
