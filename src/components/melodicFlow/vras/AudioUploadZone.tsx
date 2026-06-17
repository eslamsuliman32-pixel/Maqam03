"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { useVRASStore } from "../../../store/vrasStore";

export const AudioUploadZone: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { actions } = useVRASStore();

  const handleFile = (file: File) => {
    if (file.type.startsWith("audio/")) {
      actions.uploadAudio(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8" dir="rtl">
      {/* ── عنوان ── */}
      <div className="text-center space-y-2">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/20 flex items-center justify-center text-4xl">
          🎼
        </div>
        <h2 className="text-2xl font-black text-white">نظام التوافق البصري الإيقاعي</h2>
        <p className="text-sm text-white/40 font-arabic">
          ارفع البيت الموسيقي لتبدأ في رصف البارات النصية وفق الشبكة الإيقاعية الذكية
        </p>
      </div>

      {/* ── منطقة الرفع ── */}
      <motion.div
        className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-amber-400/60 bg-amber-400/5"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
        }`}
        whileHover={{ scale: 1.01 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className="space-y-3">
          <span className="text-5xl block">🎵</span>
          <p className="text-lg font-black text-white/80 font-arabic">
            اسحب ملف البيت الموسيقي هنا
          </p>
          <p className="text-sm text-white/30 font-arabic">
            أو انقر للاختيار من الجهاز • MP3, WAV, OGG, FLAC
          </p>
        </div>
      </motion.div>

      {/* ── ميزات النظام ── */}
      <div className="grid grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2"
          >
            <span className="text-2xl block">{f.icon}</span>
            <p className="text-xs font-bold text-white/60 font-arabic">{f.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const FEATURES = [
  { icon: "🔬", label: "تحليل BPM والأقسام الموسيقية" },
  { icon: "🎛️", label: "شبكة إيقاعية بصرية تفاعلية" },
  { icon: "🧠", label: "رصف ذكي بالذكاء الاصطناعي" },
  { icon: "🔁", label: "مشغّل بتكرار أجزاء كـ FL Studio" },
  { icon: "📊", label: "مطابقة المقاطع الصوتية والقوافي" },
  { icon: "💡", label: "نصائح إبداعية من المساعد الذكي" },
];
