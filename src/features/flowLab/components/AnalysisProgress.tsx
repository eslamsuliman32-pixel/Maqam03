import React from 'react';
import { Loader2, Activity, Volume2, Search, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFlowLabStore } from '../store/flowLabSlice';

export const AnalysisProgress: React.FC = () => {
  const analysisProgress = useFlowLabStore((state) => state.analysisProgress);
  const analysisStatus = useFlowLabStore((state) => state.analysisStatus);
  const analysisError = useFlowLabStore((state) => state.analysisError);
  const audioFile = useFlowLabStore((state) => state.audioFile);
  const clearProject = useFlowLabStore((state) => state.clearProject);

  const getStageTitle = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'جاري قراءة الملف الصوتي وفهرسة العينات...';
      case 'analyzing-local':
        return 'جاري استيراد الحزم واستخراج البارات محلياً (Meyda Engine)...';
      case 'analyzing-cloud':
        return 'جاري بث الإشارة الصوتية للتحليل السحابي الذكي...';
      case 'generating-cells':
        return 'جاري رسم المصفوفة الإيقاعية وإنشاء خلايا النبر والصائت...';
      case 'error':
        return 'فشل تحليل الملف الصوتي';
      default:
        return 'معالجة ذكية للبيت الصوتي...';
    }
  };

  if (analysisStatus === 'error') {
    return (
      <div className="max-w-md w-full p-8 bg-bg-surface/60 border border-red-500/20 rounded-3xl text-center space-y-6 backdrop-blur-3xl shadow-2xl" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-text-primary">
            {getStageTitle('error')}
          </h3>
          <p className="text-xs text-red-400 font-sans tracking-wide leading-relaxed bg-red-500/5 p-3 rounded-xl border border-red-500/10">
            {analysisError || 'حدث خطأ غير متوقع أثناء معالجة الإشارات الصوتية.'}
          </p>
          {audioFile && (
            <p className="text-[10px] text-text-muted font-mono truncate max-w-xs mx-auto">
              الملف: {audioFile.name}
            </p>
          )}
        </div>

        <button
          onClick={clearProject}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-gold-400/10 hover:text-gold-300 border border-white/5 hover:border-gold-400/25 rounded-2xl text-xs font-bold transition-all mx-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تفريغ ومحاولة ملف آخر</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full p-8 bg-bg-surface/60 border border-white/5 rounded-3xl text-center space-y-6 backdrop-blur-3xl shadow-2xl" dir="rtl">
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="absolute inset-0 rounded-full border border-gold-400/20 animate-spin-slow" />
        <div className="absolute -inset-1 rounded-full border-2 border-t-gold-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="w-16 h-16 rounded-full bg-gold-400/5 flex items-center justify-center border border-gold-400/25">
          <Activity className="w-8 h-8 text-gold-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-text-primary">
          {getStageTitle(analysisStatus)}
        </h3>
        {audioFile && (
          <p className="text-xs text-text-muted font-mono truncate max-w-xs mx-auto">
            {audioFile.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {/* Progress tracks */}
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-l from-gold-400 to-gold-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${analysisProgress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
          <span>{analysisProgress}%</span>
          <span>STAGE: {analysisStatus.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
