"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useMaqamFlowStore,
  InstrumentChannel,
  InstrumentId,
} from "../../store/maqamFlowLabStore";

const INSTRUMENT_ICONS: Record<InstrumentId, string> = {
  "synth-lead": "🎹",
  strings: "🎻",
  brass: "🎺",
  "vocal-lead": "🎤",
  oud: "🪕",
  percussion: "🥁",
};

// ════════════════════════════════════════════════════
//              LEAD ISOLATOR COMPONENT
// ════════════════════════════════════════════════════

export const LeadIsolator: React.FC = () => {
  const {
    instruments,
    activeLeadInstrument,
    analysisResult,
    actions,
  } = useMaqamFlowStore();

  const [expandedId, setExpandedId] = useState<InstrumentId | null>(null);

  return (
    <div className="
      bg-[#0c0c18] border border-white/5 rounded-2xl
      overflow-hidden text-right
    " dir="rtl">
      {/* ── رأس الوحدة ── */}
      <div className="
        flex items-center justify-between
        px-4 py-3 border-b border-white/5
        bg-white/[0.02]
      ">
        <div className="flex items-center gap-2">
          <span className="text-base text-gold-400">🎚️</span>
          <div>
            <h3 className="text-xs font-black text-white/90">عزل الآلة وتصفية الحنجرة</h3>
            <p className="text-[10px] text-white/30">Channel Isolator</p>
          </div>
        </div>

        {/* المقام المكتشف */}
        {analysisResult && (
          <div className="
            flex items-center gap-1.5 px-2.5 py-1 rounded-lg
            bg-amber-500/10 border border-amber-500/20
          ">
            <span className="text-[10px] text-white/40">المقام:</span>
            <span className="text-[11px] font-bold text-amber-400">
              {analysisResult.maqamType}
            </span>
          </div>
        )}
      </div>

      {/* ── قائمة الآلات ── */}
      <div className="p-3 space-y-2">
        {instruments.map((inst, idx) => (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <InstrumentRow
              instrument={inst}
              isActive={activeLeadInstrument === inst.id}
              isExpanded={expandedId === inst.id}
              maqamZone={
                analysisResult?.leadCurves.find(
                  (c) => c.instrument === inst.id
                )?.maqamZone
              }
              dominantNote={
                analysisResult?.leadCurves.find(
                  (c) => c.instrument === inst.id
                )?.dominantNote
              }
              onSelect={() => actions.setActiveInstrument(inst.id)}
              onToggleMute={() => actions.toggleMute(inst.id)}
              onSolo={() => actions.setSolo(inst.id)}
              onVolumeChange={(v) => actions.setVolume(inst.id, v)}
              onExpand={() =>
                setExpandedId(expandedId === inst.id ? null : inst.id)
              }
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
//              INSTRUMENT ROW
// ════════════════════════════════════════════════════

interface InstrumentRowProps {
  instrument: InstrumentChannel;
  isActive: boolean;
  isExpanded: boolean;
  maqamZone?: string;
  dominantNote?: string;
  onSelect: () => void;
  onToggleMute: () => void;
  onSolo: () => void;
  onVolumeChange: (v: number) => void;
  onExpand: () => void;
}

const InstrumentRow: React.FC<InstrumentRowProps> = ({
  instrument,
  isActive,
  isExpanded,
  maqamZone,
  dominantNote,
  onSelect,
  onToggleMute,
  onSolo,
  onVolumeChange,
  onExpand,
}) => {
  const icon = INSTRUMENT_ICONS[instrument.id];

  return (
    <div
      className={`
        rounded-xl border transition-all duration-200 overflow-hidden
        ${
          isActive
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-white/[0.04] bg-white/[0.02] hover:border-white/10"
        }
        ${instrument.isMuted ? "opacity-50" : ""}
      `}
    >
      {/* الصف الرئيسي */}
      <div className="flex items-center gap-2.5 p-2.5">
        {/* أيقونة الآلة */}
        <button
          onClick={onSelect}
          className={`
            w-8 h-8 rounded-lg flex-shrink-0
            flex items-center justify-center text-base
            transition-all duration-200 cursor-pointer
            ${
              isActive
                ? "shadow-lg"
                : "bg-white/[0.04] hover:bg-white/[0.08]"
            }
          `}
          style={
            isActive
              ? {
                  background: `${instrument.color}20`,
                  boxShadow: `0 0 12px ${instrument.color}30`,
                }
              : {}
          }
          title={`تحديد ${instrument.nameAr}`}
        >
          {icon}
        </button>

        {/* اسم الآلة */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center gap-1.5">
            <span
              className={`
                text-xs font-bold truncate
                ${isActive ? "text-amber-300" : "text-white/70"}
              `}
            >
              {instrument.nameAr}
            </span>
            {isActive && (
              <span className="
                text-[8px] px-1 rounded
                bg-amber-500/20 text-amber-400
                font-bold flex-shrink-0
              ">
                قائد
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {maqamZone && (
              <span className="text-[9px] text-[#A78BFA] font-medium">المنطقة: {maqamZone}</span>
            )}
            {dominantNote && (
              <span className="text-[9px] text-white/30 font-mono bg-white/[0.03] px-1 rounded">
                {dominantNote}
              </span>
            )}
          </div>
        </div>

        {/* أدوات التحكم */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Solo */}
          <ChannelButton
            onClick={onSolo}
            label="S"
            isActive={instrument.solo}
            activeColor="text-amber-400 bg-amber-500/20"
            title="Solo"
          />

          {/* Mute */}
          <ChannelButton
            onClick={onToggleMute}
            label="M"
            isActive={instrument.isMuted}
            activeColor="text-red-400 bg-red-500/20"
            title="Mute"
          />

          {/* توسيع */}
          <button
            onClick={onExpand}
            className="
              w-5 h-5 flex items-center justify-center
              text-white/20 hover:text-white/50
              transition-colors text-[10px] cursor-pointer
            "
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* شريط الصوت المضغوط */}
      <div className="px-2.5 pb-2">
        <VolumeBar
          volume={instrument.volume}
          color={instrument.color}
          onChange={onVolumeChange}
          isMuted={instrument.isMuted}
        />
      </div>

      {/* التفاصيل الموسعة */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <InstrumentDetails
              instrument={instrument}
              maqamZone={maqamZone}
              dominantNote={dominantNote}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChannelButton: React.FC<{
  onClick: () => void;
  label: string;
  isActive: boolean;
  activeColor: string;
  title: string;
}> = ({ onClick, label, isActive, activeColor, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      w-5 h-5 rounded flex items-center justify-center
      text-[9px] font-black transition-all duration-150 cursor-pointer
      ${
        isActive
          ? activeColor
          : "text-white/25 bg-white/[0.04] hover:text-white/50 hover:bg-white/[0.08]"
      }
    `}
  >
    {label}
  </button>
);

const VolumeBar: React.FC<{
  volume: number;
  color: string;
  onChange: (v: number) => void;
  isMuted: boolean;
}> = ({ volume, color, onChange, isMuted }) => (
  <div className="flex items-center gap-2">
    <span className="text-[8px] text-white/30 w-6 text-left font-mono">
      {volume}%
    </span>
    <div className="relative flex-1 h-1 bg-white/5 rounded-full">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all"
        style={{
          width: `${isMuted ? 0 : volume}%`,
          backgroundColor: color,
          opacity: 0.7,
        }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          absolute inset-0 w-full h-full opacity-0 cursor-pointer
        "
      />
    </div>
  </div>
);

const InstrumentDetails: React.FC<{
  instrument: InstrumentChannel;
  maqamZone?: string;
  dominantNote?: string;
}> = ({ instrument, maqamZone, dominantNote }) => (
  <div className="
    px-3 pb-3 pt-1 border-t border-white/5
    grid grid-cols-2 gap-2 text-right bg-white/[0.01]
  ">
    <DetailItem label="قناة الآلة" value={instrument.name} />
    <DetailItem label="منطقة المقام" value={maqamZone || "غير محللة"} />
    <DetailItem label="النغمة السائدة" value={dominantNote || "غير مسحوبة"} />
    <DetailItem label="الحالة الكهربائية" value={instrument.isMuted ? "حظر / كتم" : "رصد نشط"} />
  </div>
);

const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-[9px] text-white/25">{label}</p>
    <p className="text-[10px] text-white/60 font-medium">{value}</p>
  </div>
);
