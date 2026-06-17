import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Film, CheckCircle } from 'lucide-react';
import { useFlowLabStore } from '../store/flowLabSlice';

export const AudioUploader: React.FC = () => {
  const loadAudio = useFlowLabStore((state) => state.loadAudio);
  const audioFile = useFlowLabStore((state) => state.audioFile);
  const useCloudAnalysis = useFlowLabStore((state) => state.useCloudAnalysis);
  const toggleAnalysisMode = useFlowLabStore((state) => state.toggleAnalysisMode);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      loadAudio(acceptedFiles[0]);
    }
  }, [loadAudio]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    multiple: false
  } as any);

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer backdrop-blur-xl ${
          isDragActive
            ? 'border-gold-400 bg-gold-400/5 shadow-[0_0_30px_rgba(212,160,23,0.1)]'
            : 'border-white/10 bg-bg-surface/40 hover:border-gold-400/30 hover:bg-bg-surface/60'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,160,23,0.1)]">
            <Music className="w-8 h-8 text-gold-400" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-primary">
              {isDragActive ? "أفلت الملف هنا للبدء..." : "اسحب ملف البيت الصوتي هنا أو انقر للاختيار"}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              يدعم الملفات الصوتية MP3, WAV, M4A, OGG حتى حجم 50 ميجابايت
            </p>
          </div>
        </div>
      </div>

      <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-text-primary">تفعيل التحليل السحابي المدعوم عصبيًا</h4>
          <p className="text-[10px] text-text-muted mt-0.5">استخدم سيرفرات سحابية لتحسين دقة كشف البارات واللحن الأساسي</p>
        </div>
        <button
          onClick={toggleAnalysisMode}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            useCloudAnalysis ? 'bg-gold-400' : 'bg-white/10'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-bg-base shadow ring-0 transition duration-200 ease-in-out ${
              useCloudAnalysis ? '-translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
