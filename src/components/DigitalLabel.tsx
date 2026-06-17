import React from "react";
import { motion } from "motion/react";
import { Bar } from "../store/repositoryStore";
import { Hash, Fingerprint, Calendar, User, ShieldCheck } from "lucide-react";

interface DigitalLabelProps {
  bar: Bar;
  variant?: "compact" | "full";
}

export const DigitalLabel: React.FC<DigitalLabelProps> = ({
  bar,
  variant = "full",
}) => {
  const isFull = variant === "full";

  return (
    <motion.div
      whileHover={{ y: -2, rotate: -0.5 }}
      className={`
        relative bg-[#E8E8E8] text-[#1A1A1A] font-mono p-4 rounded-sm shadow-xl
        border-l-4 border-gold-600 overflow-hidden select-none
        ${isFull ? "w-full" : "w-fit min-w-[200px] scale-90 origin-top-right"}
      `}
    >
      {/* Background Micro-text */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-[40px] font-black pointer-events-none rotate-12">
        MAQAM
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-tighter text-gold-600">
            Product Authenticity
          </span>
          <span className="text-lg font-black leading-none">
            {bar.serialNumber}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-gray-500">
            Classification
          </span>
          <span
            className={`text-[10px] font-black uppercase px-1 py-0.5 rounded ${
              bar.suggestedBarRole === "punchline"
                ? "bg-red-200 text-red-900 border border-red-900/10"
                : bar.suggestedBarRole === "hook"
                  ? "bg-gold-200 text-gold-900 border border-gold-900/10"
                  : "bg-gray-200 text-gray-900"
            }`}
          >
            {bar.suggestedBarRole?.replace("_", " ") || "STANDARD"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-300 pt-3">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 opacity-60">
            <Fingerprint className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase">
              Resonance Code
            </span>
          </div>
          <div className="text-[10px] font-black tracking-widest bg-white/50 px-1.5 py-1 rounded">
            {bar.resonanceFingerprint || "Q0-R0-S0-H0"}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 opacity-60">
            <Hash className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase">
              Stress Signature
            </span>
          </div>
          <div className="text-[10px] font-black tracking-widest bg-white/50 px-1.5 py-1 rounded truncate">
            {bar.fingerprintCode?.split("-")[0] || "NONE"}
          </div>
        </div>
      </div>

      {isFull && (
        <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 opacity-40">
                <Calendar className="w-2.5 h-2.5" />
                <span className="text-[7px] font-black uppercase">
                  Timestamp
                </span>
              </div>
              <span className="text-[8px] font-black">
                {new Date(bar.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 opacity-40">
                <User className="w-2.5 h-2.5" />
                <span className="text-[7px] font-black uppercase">Engine</span>
              </div>
              <span className="text-[8px] font-black">v2.0.4-ELITE</span>
            </div>
          </div>

          <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-400 rounded-full opacity-60">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Barcode-ish line */}
      <div className="mt-4 h-6 flex gap-1 items-end overflow-hidden opacity-20">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className="w-[1px] bg-black"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
};
