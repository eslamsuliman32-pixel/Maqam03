import React from "react";
import {
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp,
  Activity,
  User,
  HelpCircle,
} from "lucide-react";
import { useFlowMethodologyStore } from "../../store/flowMethodologyStore";

export function LayeredFlowMatrix() {
  const { layeredMatrix, actions } = useFlowMethodologyStore();

  const handleComputeMatrix = () => {
    actions.refreshMatrix();
  };

  if (!layeredMatrix) {
    return (
      <div className="bg-bg-surface p-12 rounded-2xl border border-white/5 text-center space-y-4 shadow-lg pr-4">
        <Layers className="w-12 h-12 text-gold-400 mx-auto animate-pulse" />
        <h3 className="text-sm font-black text-text-primary">مصفوفة الدمج الكلي للطبقات غير نشطة</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          اضغط على الزر أدناه لتفعيل دمج الهيكل العظمي، التصميم الصوتي للكلمات، منحنى الحنجرة، وهزات التعبير في لوحة مركبة واحدة مدهشة.
        </p>
        <button
          onClick={handleComputeMatrix}
          className="px-5 py-2.5 bg-gold-400 hover:bg-gold-500 text-bg-base text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(212,160,23,0.15)] mx-auto block"
        >
          حساب الطبقات المركبة 2D
        </button>
      </div>
    );
  }

  const { rows, overallCoherence, masterySuggestions, totalActiveLayers, weakPoints } =
    layeredMatrix;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── الرأس الكلي لمؤشر تماسك المزيج ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-text-muted">مؤشر التماسك الهارموني الشامل:</div>
            <div className="text-3xl font-black text-neural-emerald font-mono mt-1">
              {overallCoherence}%
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-2">
            تم احتساب توافق التوزيع فوق 4 بارات تزامنية مستمرة.
          </p>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-text-muted">إجمالي تراكب المزيج النشط:</div>
            <div className="text-3xl font-black text-gold-300 font-mono mt-1">
              {totalActiveLayers} <span className="text-xs font-sans text-text-secondary">طباطبية</span>
            </div>
          </div>
          <p className="text-[10px] text-text-secondary mt-2">
            مشتملة على الكلمات الهيكلية، الهمهمة، ومخططات الحنجرة.
          </p>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-text-muted">الاستقرار الإيقاعي وعواميد التنفس:</div>
            <div className="text-3xl font-black text-neural-amethyst font-mono mt-1">
              {weakPoints.length === 0 ? "كامل ومثالي" : `${weakPoints.length} ثغرات`}
            </div>
          </div>
          <div className="text-[10px] text-text-secondary mt-2">
            نقاط رصد انقطاع النفس أو الهبوط المفاجئ للطاقة اللفظية.
          </div>
        </div>
      </div>

      {/* ─── اللوحة الوسطى: المزيج الهوائي المتكامل 2D ──────── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <h3 className="text-xs font-black text-gold-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>لوحة المزج الهارموني المركب (Composite Matrix 2D)</span>
          </h3>
          <button
            onClick={handleComputeMatrix}
            className="text-[10px] text-gold-400 hover:text-gold-300 px-3 py-1 font-bold border border-gold-400/20 rounded-lg hover:bg-gold-400/5 transition-all"
          >
            تحديث حساب المزيج
          </button>
        </div>

        {/* عرض خلايا البارات في جدول مصفوفة مدهش */}
        <div className="space-y-4">
          {rows.map((row, rIdx) => (
            <div
              key={rIdx}
              className="bg-bg-base/30 p-4 rounded-xl border border-white/5 space-y-3"
            >
              <div className="text-xs font-bold text-text-secondary flex items-center gap-2">
                <span className="w-4 h-4 bg-white/5 text-text-muted text-[10px] font-mono flex items-center justify-center rounded">
                  {rIdx + 1}
                </span>
                <span>البار الإيقاعي المركب</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {row.cells.map((cell, cIdx) => {
                  const thermalClass =
                    cell.compositeScore >= 80
                      ? "border-neural-crimson shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                      : cell.compositeScore >= 60
                        ? "border-neural-amethyst shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                        : "border-neural-sapphire/35";

                  return (
                    <div
                      key={cIdx}
                      className={`p-3 rounded-lg border bg-bg-surface/80 space-y-3 relative overflow-hidden transition-all ${thermalClass}`}
                    >
                      <div className="flex justify-between items-center text-[9px] text-text-muted">
                        <span>نبضة {cell.beat.position}</span>
                        <span className="font-mono text-[8px] bg-white/5 text-text-secondary px-1 rounded font-bold">
                          {cell.compositeScore}%
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {/* 1) الكلمات الهيكلية الفوقية */}
                        <div className="text-xs font-black text-text-primary h-4 overflow-hidden truncate">
                          {cell.beat.syllable ? cell.beat.syllable : "📭 فارغ"}
                        </div>

                        {/* 2) السكاتينج */}
                        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                          <span className="text-[8px] bg-white/5 text-text-muted rounded px-0.5">Scat</span>
                          <span className="text-gold-200 truncate">
                            {cell.scattingLayer ? cell.scattingLayer.syllables[cIdx] || "·" : "·"}
                          </span>
                        </div>

                        {/* 3) المنسوب النغمي التقديري */}
                        <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                          <span className="text-[8px] bg-white/5 text-text-muted rounded px-0.5">Pitch</span>
                          <span className="text-neural-amethyst font-mono font-bold">
                            {cell.intonationLayer ? `${Math.round(cell.intonationLayer.pitch)}Hz` : "50Hz"}
                          </span>
                        </div>
                      </div>

                      {/* مؤشر الهزة الحادة المسجل التعبيري */}
                      {cell.tonalSpikeLayer && (
                        <div className="absolute top-1 left-1 bg-neural-crimson w-1.5 h-1.5 rounded-full animate-bounce" title="هزة تعبيرية مشدودة" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── التوجيه الفني ومقترحات النخبة ──────── */}
      <div className="bg-bg-surface p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg">
        <h3 className="text-xs font-black text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>مقترحات التدقيق من نظام MAQAM الذكي</span>
        </h3>

        <div className="space-y-2">
          {masterySuggestions.map((sug, sIdx) => (
            <div
              key={sIdx}
              className="text-xs p-3.5 bg-bg-base/40 rounded-xl border border-white/5 flex items-start gap-2.5 leading-relaxed font-sans"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-1.5 shrink-0" />
              <span>{sug}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
