import React from 'react';
import { useFlowLabStore } from '../store/flowLabSlice';
import { AudioUploader } from './AudioUploader';
import { AnalysisProgress } from './AnalysisProgress';
import { FlowTabs } from './FlowTabs';
import { BeatGridOverview } from './BeatGridOverview';
import { MelodicView } from './melodic/MelodicView';
import { LayeredView } from './layered/LayeredView';
import { PercussiveView } from './percussive/PercussiveView';
import { SuggestionPanel } from './SuggestionPanel';
import { MaqamFlowLabElite } from '../../../components/MaqamFlowLabElite';
import { Sparkles, Trash2, Cpu, FileText } from 'lucide-react';

export const FlowLab: React.FC = () => {
  const { analysisStatus, activeTab, clearProject, analysisResult } = useFlowLabStore();

  if (analysisStatus === 'idle') {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-right" dir="rtl">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[10px] font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>نظام مُحاكاة الفلو واللحن الأصيل ديسيماتور v2.0</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-text-primary tracking-tight font-sans">
            منظومة الفلو عالي الدقة <span className="text-gold-400">FlowLab</span>
          </h1>
          <p className="text-xs text-text-secondary max-w-lg mx-auto leading-relaxed">
            مستودع تدفقات الفلو التفاعلي يُمكّنك من تحليل البيت الإيقاعي، وتتبع الآلة الموسيقية القائدة ورسم النبرات العروضية بدقة ملكية صلبة.
          </p>
        </div>
        <AudioUploader />
      </div>
    );
  }

  if (analysisStatus !== 'done') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <AnalysisProgress />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 text-right space-y-6" dir="rtl">
      {/* الهيدر والمؤشرات */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-surface/30 p-5 rounded-2xl border border-border-subtle backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-gold-400/10 text-gold-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-gold-400/20">
              FlowLab Active
            </span>
            <span className="text-text-muted text-xs font-mono">•</span>
            <span className="text-[10px] text-text-muted font-mono uppercase">LATEST_ONSET_ANALYSIS</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-text-primary font-sans">
            منطقة تحليل تدفق الـ <span className="text-gold-400">RAP FLOW</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={clearProject}
            className="flex items-center gap-2 px-4 py-2 bg-red-400/10 border border-red-500/20 hover:bg-red-400/20 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>تنظيف الملف الحالي</span>
          </button>
        </div>
      </div>

      {/* شريط الإحصاء عالي الدقة */}
      <div className="bg-bg-surface/40 border border-white/5 rounded-2xl p-4">
        <BeatGridOverview />
      </div>

      {/* التبويبات الفنية الثلاثة */}
      <div className="bg-bg-surface/40 border border-white/5 rounded-xl overflow-hidden">
        <FlowTabs />
      </div>

      {/* المحتوى الرئيسي للمسارات مع اللوحة الذكية الجانبية */}
      {activeTab === 'elite' ? (
        <MaqamFlowLabElite analysisResult={analysisResult} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* منطقة العمل الفلو */}
          <div className="lg:col-span-3 bg-bg-surface/20 border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
            {activeTab === 'melodic' && <MelodicView />}
            {activeTab === 'layered' && <LayeredView />}
            {activeTab === 'percussive' && <PercussiveView />}
          </div>

          {/* المساعد العصبي الجانبي لوصف الأبيات */}
          <div className="lg:col-span-1 bg-bg-surface/30 border border-white/5 rounded-2xl p-4 shadow-xl">
            <SuggestionPanel />
          </div>
        </div>
      )}
    </div>
  );
};
