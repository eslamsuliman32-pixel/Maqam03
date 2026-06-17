// ═══════════════════════════════════════════════════════════════
// مكون الشبكة الإيقاعية البصرية — تمثيل BPM والنبضات
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface RhythmicGridProps {
  bpm: number;
  bars: Array<{ id: string; syllableCount: number; intensity: number; content: string }>;
  activeBarId?: string | null;
  onBarSelect?: (barId: string) => void;
}

const BEATS_PER_BAR = 4;
const BEAT_SUBDIVISIONS = 4;

export const RhythmicGrid: React.FC<RhythmicGridProps> = ({
  bpm,
  bars,
  activeBarId,
  onBarSelect,
}) => {
  const [activeBeat, setActiveBeat] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatDuration = (60 / bpm) * 1000;

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActiveBeat(-1);
      return;
    }

    const totalBeats = bars.length * BEATS_PER_BAR;
    let beat = 0;

    intervalRef.current = setInterval(() => {
      setActiveBeat(beat % (totalBeats * BEAT_SUBDIVISIONS));
      beat++;
    }, beatDuration / BEAT_SUBDIVISIONS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm, bars.length, beatDuration]);

  return (
    <div className="space-y-3" dir="rtl">
      {/* شريط التحكم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm
              transition-all duration-200 font-bold cursor-pointer
              ${isPlaying
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 ring-1 ring-emerald-500/50'
              }
            `}
            title={isPlaying ? 'إيقاف' : 'تشغيل الإيقاع'}
          >
            {isPlaying ? '⏹' : '▶'}
          </button>
          <span className="text-xs text-zinc-500 font-mono">{bpm} BPM</span>
        </div>

        {/* مؤشر النبضة الحالية */}
        <div className="flex gap-1">
          {Array.from({ length: BEATS_PER_BAR }).map((_, i) => {
            const globalBeat = activeBeat >= 0 ? Math.floor(activeBeat / BEAT_SUBDIVISIONS) % BEATS_PER_BAR : -1;
            return (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-100 ${
                  isPlaying && globalBeat === i
                    ? 'bg-yellow-400 shadow-yellow-400/80 shadow-sm'
                    : 'bg-zinc-700'
                }`}
                animate={isPlaying && globalBeat === i ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.1 }}
              />
            );
          })}
        </div>
      </div>

      {/* الشبكة الإيقاعية */}
      <div className="space-y-2">
        {bars.map((bar, barIdx) => {
          const isActive = bar.id === activeBarId;
          const barStartBeat = barIdx * BEATS_PER_BAR;
          const currentBeatInSubdivisions = activeBeat >= 0 ? Math.floor(activeBeat / 1) : -1;
          const isCurrentlyPlaying = isPlaying &&
            currentBeatInSubdivisions >= barStartBeat * BEAT_SUBDIVISIONS &&
            currentBeatInSubdivisions < (barStartBeat + BEATS_PER_BAR) * BEAT_SUBDIVISIONS;

          return (
            <motion.div
              key={bar.id}
              onClick={() => onBarSelect?.(bar.id)}
              className={`
                relative p-2 rounded-lg cursor-pointer
                transition-all duration-200 border
                ${isActive
                  ? 'border-yellow-500/50 bg-yellow-500/5'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }
                ${isCurrentlyPlaying ? 'ring-1 ring-emerald-500/30' : ''}
              `}
              animate={isCurrentlyPlaying ? { backgroundColor: ['rgba(16,185,129,0.03)', 'rgba(16,185,129,0.08)', 'rgba(16,185,129,0.03)'] } : {}}
              transition={{ duration: beatDuration / 1000, repeat: Infinity }}
            >
              <div className="flex items-center gap-2">
                {/* رقم البار */}
                <span className="text-[10px] text-zinc-600 font-mono w-4">
                  {barIdx + 1}
                </span>

                {/* شبكة النبضات */}
                <div className="flex gap-0.5 flex-1">
                  {Array.from({ length: BEATS_PER_BAR * BEAT_SUBDIVISIONS }).map((_, beatIdx) => {
                    const localBeatSubdivisionIndex = barStartBeat * BEAT_SUBDIVISIONS + beatIdx;
                    const isThisBeatActive = isPlaying && currentBeatInSubdivisions === localBeatSubdivisionIndex;

                    const isMajorBeat = beatIdx % BEAT_SUBDIVISIONS === 0;
                    const hasSyllable = beatIdx < bar.syllableCount * (BEAT_SUBDIVISIONS / 3);

                    return (
                      <motion.div
                        key={beatIdx}
                        className={`
                          rounded-sm flex-1 transition-colors duration-100
                          ${isMajorBeat ? 'h-4' : 'h-2 self-center'}
                          ${hasSyllable
                            ? isThisBeatActive
                              ? 'bg-yellow-400'
                              : isMajorBeat ? 'bg-zinc-400' : 'bg-zinc-600'
                            : 'bg-zinc-800'
                          }
                        `}
                        animate={isThisBeatActive ? { scaleY: [1, 1.5, 1] } : {}}
                        transition={{ duration: 0.1 }}
                      />
                    );
                  })}
                </div>

                {/* مؤشر الشدة */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 rounded-full ${
                        i < bar.intensity
                          ? 'bg-orange-500'
                          : 'bg-zinc-800'
                      }`}
                      style={{ height: `${6 + i * 2}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* معاينة المحتوى */}
              {bar.content && (
                <p className="text-[10px] text-zinc-500 mt-1 truncate text-right font-arabic">
                  {bar.content}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default RhythmicGrid;
