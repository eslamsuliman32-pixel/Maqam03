import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Filter,
  CheckCircle2,
  X,
  Type,
  Music,
  Activity,
  Mic2,
  RotateCcw,
  ChevronDown,
  Hash,
  Sparkles,
  Search,
  Fingerprint,
} from "lucide-react";
import {
  PhoneticFilter,
  SingleFilterParam,
  ArabicMeter,
  ArabicFoot,
  PhoneticFilterPresets,
} from "../store/phonetic-filters";
import { useRepositoryStore } from "../store/repositoryStore";

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PARAM_LABELS: Record<string, { label: string; icon: any }> = {
  perfectrhyme: { label: "القافية التامة", icon: Type },
  obliquerhyme: { label: "القافية المتقاربة", icon: Music },
  internalrhyme: { label: "القافية الداخلية", icon: Mic2 },
  syllablecount: { label: "عدد المقاطع (الطول)", icon: Hash },
  meter: { label: "البحر الشعري", icon: Music },
  flow: { label: "انسيابية التدفق (الفلو)", icon: Sparkles },
  signature: { label: "بصمة الذكاء الاصطناعي (AI)", icon: Fingerprint },
};

const METERS: ArabicMeter[] = [
  "طويل", "مديد", "بسيط", "وافر", "كامل", "هزج", "رجز", "رمل", "سريع", "منسرح", "خفيف", "مقتضب", "مجتث", "متقارب", "متدارك"
];

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { phoneticFilter, setPhoneticFilter } = useRepositoryStore();
  const [activeParams, setActiveParams] = useState<SingleFilterParam[]>([]);
  const [values, setValues] = useState<any>({});
  const [tolerance, setTolerance] = useState<PhoneticFilter["matchTolerance"]>("relaxed");
  const [operator, setOperator] = useState<"AND" | "OR" | "WEIGHTED">("WEIGHTED");

  // Sync state with store if filter exists
  useEffect(() => {
    if (phoneticFilter) {
      setActiveParams(phoneticFilter.params);
      setValues(phoneticFilter.values || {});
      setTolerance(phoneticFilter.matchTolerance);
      setOperator(phoneticFilter.operator);
    }
  }, [phoneticFilter, isOpen]);

  const toggleParam = (param: SingleFilterParam) => {
    setActiveParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    );
  };

  const handleApply = async () => {
    if (activeParams.length === 0) {
      setPhoneticFilter(undefined);
      onClose();
      return;
    }

    const finalValues = { ...values };
    if (activeParams.includes("signature") && values.referenceText) {
      const { computeDigitalSignature } = await import("../lib/arabic-prosody/vectorizer");
      finalValues.sourceSignature = computeDigitalSignature(values.referenceText);
    }

    const filter: PhoneticFilter = {
      mode: activeParams.length === 1 ? "single" : activeParams.length === 2 ? "dual" : "triple",
      params: activeParams as any,
      values: finalValues,
      matchTolerance: tolerance,
      operator,
    };

    setPhoneticFilter(filter);
    onClose();
  };

  const handleReset = () => {
    setActiveParams([]);
    setValues({});
    setTolerance("relaxed");
    setOperator("WEIGHTED");
    setPhoneticFilter(undefined);
  };

  const applyPreset = (preset: PhoneticFilter) => {
    setActiveParams(preset.params);
    setValues(preset.values || {});
    setTolerance(preset.matchTolerance);
    setOperator(preset.operator);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute top-full right-0 mt-4 w-[450px] bg-bg-surface/95 backdrop-blur-2xl border border-gold-400/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-[100] overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-r from-gold-400/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-400/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">نظام الفلترة المتقدم</h3>
            <p className="text-[10px] text-gold-400 font-mono uppercase tracking-widest">Advanced Phonetic Filter v2.1</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8 scrollbar-hide">
        {/* Presets */}
        <section>
          <h4 className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-3 h-3 text-gold-400" /> الفلاتر الجاهزة
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
               onClick={() => applyPreset(PhoneticFilterPresets.bySyllableCount(12))}
               className="p-3 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-gold-400/50 hover:bg-gold-400/5 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Hash className="w-5 h-5 text-text-muted group-hover:text-gold-400 transition-colors" />
              <span className="text-[10px] font-bold text-text-primary">ميزان سريع (١٢ مقطع)</span>
            </button>
            <button
               onClick={() => applyPreset(PhoneticFilterPresets.byRhythmicWeight("كامل"))}
               className="p-3 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-gold-400/50 hover:bg-gold-400/5 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Music className="w-5 h-5 text-text-muted group-hover:text-gold-400 transition-colors" />
              <span className="text-[10px] font-bold text-text-primary">بحر الكامل</span>
            </button>
            <button
               onClick={() => applyPreset(PhoneticFilterPresets.byInternalRhyme())}
               className="p-3 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-gold-400/50 hover:bg-gold-400/5 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Mic2 className="w-5 h-5 text-text-muted group-hover:text-gold-400 transition-colors" />
              <span className="text-[10px] font-bold text-text-primary">قافية داخلية مركبة</span>
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3 text-gold-400" /> معايير الفلترة الصوتية الدقيقة
            </h4>
            <span className="text-[9px] text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{activeParams.length} فعال</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PARAM_LABELS) as SingleFilterParam[]).map((param) => {
              const { label, icon: Icon } = PARAM_LABELS[param];
              const isActive = activeParams.includes(param);

              return (
                <button
                  key={param}
                  onClick={() => toggleParam(param)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
                    isActive
                      ? "bg-gold-400/10 border-gold-400/50 text-gold-400 shadow-[0_0_15px_rgba(212,160,23,0.1)]"
                      : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 opacity-70" />
                    <span className="text-[11px] font-bold">{label}</span>
                  </div>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Values Section */}
        {activeParams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gold-400/5 border border-gold-400/10 rounded-2xl space-y-6"
          >
            <h4 className="text-[10px] text-gold-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3 animate-pulse" /> تفاصيل المعايير النشطة
            </h4>

            {activeParams.map((param) => {
              const labelData = PARAM_LABELS[param];
              if (!labelData) return null;

              return (
              <div key={param} className="space-y-3">
                <label className="text-[10px] text-text-muted font-mono">{labelData.label}</label>

                {param === "syllablecount" && (
                   <input
                     type="number"
                     placeholder="عدد المقاطع (الطول العام)"
                     value={values.targetSyllableCount || ""}
                     onChange={(e) => setValues({...values, targetSyllableCount: parseInt(e.target.value)})}
                     className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold-400/50 outline-none transition-all text-right"
                   />
                )}

                {param === "perfectrhyme" && (
                   <input
                     type="text"
                     placeholder="الروي أو القافية (مثال: ون، ار، ي)"
                     value={values.perfectRhymeCore || ""}
                     onChange={(e) => setValues({...values, perfectRhymeCore: e.target.value})}
                     className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold-400/50 outline-none transition-all text-right font-arabic"
                     dir="rtl"
                   />
                )}

                {param === "meter" && (
                   <select
                     value={values.targetMeter || ""}
                     onChange={(e) => setValues({...values, targetMeter: e.target.value})}
                     className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold-400/50 outline-none transition-all text-right"
                   >
                     <option value="">تحديد البحر الشعري...</option>
                     {METERS.map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                   </select>
                )}

                 {param === "rhythmicweight" && (
                   <select
                     value={values.targetMeter || ""}
                     onChange={(e) => setValues({...values, targetMeter: e.target.value})}
                     className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold-400/50 outline-none transition-all text-right"
                   >
                     <option value="">تحديد البحر الشعري...</option>
                     {METERS.map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                   </select>
                 )}

                 {param === "flow" && (
                    <input
                      type="number"
                      placeholder="نسبة الانسيابية الدنيا (مثلاً: 80)"
                      value={values.minFlowScore || ""}
                      onChange={(e) => setValues({...values, minFlowScore: parseInt(e.target.value)})}
                      className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold-400/50 outline-none transition-all text-right"
                    />
                 )}

                 {param === "obliquerhyme" && (
                    <input
                      type="text"
                      placeholder="حرف الروي للتقارب"
                      value={values.obliqueRhymeConsonant || ""}
                      onChange={(e) => setValues({...values, obliqueRhymeConsonant: e.target.value})}
                      className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-gold-400/50 outline-none transition-all text-right font-arabic"
                      dir="rtl"
                    />
                 )}

                  {param === "signature" && (
                   <div className="space-y-4 p-4 bg-gold-400/5 rounded-2xl border border-gold-400/10">
                     <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] text-gold-400 font-bold uppercase">النص المرجعي (المصدر)</span>
                        {!values.referenceText && (
                          <span className="text-[9px] text-quality-low animate-pulse">⚠️ مطلوب للتفعيل</span>
                        )}
                     </div>
                     <textarea
                       placeholder="الصق هنا النص الذي تريد البحث عن بصمات مشابهة له... (مثال: شعبي، راب، فصيح)"
                       value={values.referenceText || ""}
                       onChange={(e) => setValues({...values, referenceText: e.target.value})}
                       className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold-400/50 outline-none transition-all text-right min-h-[100px] shadow-inner"
                       dir="rtl"
                     />
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <span className="text-[9px] text-text-muted block mb-2 px-1">دقة المحرك</span>
                         <select
                           value={values.signaturePreset || "balanced"}
                           onChange={(e) => setValues({...values, signaturePreset: e.target.value as any})}
                           className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-gold-400/50 outline-none transition-all text-right"
                         >
                           <option value="strict">صارمة (Strict)</option>
                           <option value="balanced">متوازنة (Balanced)</option>
                           <option value="loose">مرنة (Loose)</option>
                         </select>
                       </div>
                       <div>
                         <span className="text-[9px] text-text-muted block mb-2 px-1">عدد النتائج</span>
                         <input
                           type="number"
                           min="1"
                           max="200"
                           value={values.signatureTopK || 50}
                           onChange={(e) => setValues({...values, signatureTopK: parseInt(e.target.value)})}
                           className="w-full bg-bg-base/50 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-bold focus:border-gold-400/50 outline-none transition-all text-right"
                         />
                       </div>
                     </div>
                   </div>
                 )}

              </div>
              );
            })}
          </motion.section>
        )}
      </div>

      {/* Global Settings */}
      <div className="p-6 bg-bg-surface flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">مستوى الصرامة:</span>
          <select
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-gold-400/50 transition-all text-gold-400"
          >
            <option value="strict">صارم جداً (Strict)</option>
            <option value="relaxed">مرن وملائم (Relaxed)</option>
            <option value="fuzzy">تجريبي واسع (Fuzzy)</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between gap-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-text-muted hover:text-quality-low transition-colors text-[11px] font-bold"
        >
          <RotateCcw className="w-4 h-4" /> تصفير الكل
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-[11px] font-bold text-text-muted"
          >
            إلغاء
          </button>
          <button
            onClick={handleApply}
            className="px-8 py-2.5 rounded-xl bg-gold-400 text-bg-base font-black text-[11px] hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] transition-all flex items-center gap-2"
          >
            تطبيق الفلتر
          </button>
        </div>
      </div>
    </motion.div>
  );
};
