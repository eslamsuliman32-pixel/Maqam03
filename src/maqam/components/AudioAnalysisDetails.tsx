import { FileAudio, Hash, Info, ListMusic, Timer } from "lucide-react";
import type { AudioBeatAnalysisResult } from "../types/audioAnalysis.types";

interface AudioAnalysisDetailsProps {
  analysis: AudioBeatAnalysisResult;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 55) return "text-yellow-400";
  return "text-red-400";
}

function scoreBarColor(score: number): string {
  if (score >= 75) return "bg-emerald-500/50";
  if (score >= 55) return "bg-yellow-500/50";
  return "bg-red-500/50";
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "0ms";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function AudioAnalysisDetails({ analysis }: AudioAnalysisDetailsProps) {
  const { audioInfo, beatTracking, energyFrames } = analysis;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* وحدة معلومات الملف — Maqam OS2 Engineering Unit */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:border-cyan-500/30 text-right" dir="rtl">
        <div className="absolute -left-4 -top-4 text-white/5 group-hover:text-cyan-500/5 pointer-events-none">
          <FileAudio size={120} strokeWidth={1} />
        </div>

        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
          <Info size={14} className="text-cyan-500" />
          معلومات الملف المشفّر
        </h3>

        <div className="grid grid-cols-2 gap-y-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-zinc-500">Duration</div>
            <div className="font-mono text-lg font-bold text-white">
              {formatMs(audioInfo.durationMs)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase text-zinc-500">Sample Rate</div>
            <div className="font-mono text-lg font-bold text-white">
              {audioInfo.sampleRate / 1000}kHz
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase text-zinc-500">Channels</div>
            <div className="font-mono text-lg font-bold text-white uppercase">
              {audioInfo.numberOfChannels === 1 ? "Mono" : "Stereo"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase text-zinc-500">DSP Frames</div>
            <div className="font-mono text-lg font-bold text-white">
              {energyFrames.length.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/40 p-2 text-[10px] text-zinc-500">
          <Timer size={12} />
          <span>Web Audio API Decoding: Done</span>
        </div>
      </div>

      {/* وحدة مرشحي الـ BPM — Maqam OS2 Engine Unit */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:border-fuchsia-500/30 text-right" dir="rtl">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
          <ListMusic size={14} className="text-fuchsia-500" />
          مرشحي الـ BPM (Probabilistic)
        </h3>

        <div className="space-y-3">
          {beatTracking.bpmCandidates.length > 0 ? (
            beatTracking.bpmCandidates.map((candidate, idx) => (
              <div key={candidate.bpm} className="relative">
                <div className="mb-1 flex items-end justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">#{idx + 1}</span>
                    <span className="font-black text-white">{candidate.bpm}</span>
                    <span className="text-[10px] text-zinc-500">BPM</span>
                  </div>
                  <div className={`font-mono text-xs font-bold ${scoreColor(candidate.score)}`}>
                    {candidate.score}%
                  </div>
                </div>
                
                <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${scoreBarColor(candidate.score)}`}
                    style={{ width: `${candidate.score}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-zinc-600">
              لا توجد ترشيحات واضحة للـ BPM.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/40 p-2 text-[10px] text-zinc-500">
          <Hash size={12} />
          <span>Based on Onset Interval Analysis</span>
        </div>
      </div>
    </div>
  );
}
