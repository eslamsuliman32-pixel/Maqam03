import React from 'react';
import { HelpCircle, RefreshCw, Layers, CheckCircle } from 'lucide-react';

export const ReverseEnginePanel: React.FC = () => {
  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4 text-right" dir="rtl">
      <div className="flex border-b border-white/5 pb-3 justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold-400" />
          <span>الهندسة العكسية للمقامات (Mora Reverse Decimator)</span>
        </h3>
        <span className="text-[9px] text-text-muted font-mono">REVERSE_ENGINE</span>
      </div>

      <div className="p-3 bg-bg-base/40 rounded-xl space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-text-secondary font-bold">حالة الكاش المقطعي</span>
          <span className="text-[9px] text-quality-perfect bg-quality-perfect/10 px-2 py-0.5 rounded-full">جاهز للرصد</span>
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed">
          يقوم هذا المحرك بتحليل نبرات دندنة الملحن وتحويلها عروضيًا إلى تفعيلات ونبضات Offbeat متوافقة تلقائيًا لتقليل الجهد الفني اللازم للكتابة.
        </p>
      </div>

      <button className="w-full bg-white/5 hover:bg-gold-400/15 hover:text-gold-300 font-bold text-xs py-2 rounded-xl transition-all border border-white/5">
        إعادة استخراج أنماط الحركة
      </button>
    </div>
  );
};
