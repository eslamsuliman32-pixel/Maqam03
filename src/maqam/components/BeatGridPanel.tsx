import { Activity, AudioLines, Clock3, Gauge, Music2 } from "lucide-react";
import { useMaqamAnalysisStore } from "../store/maqamAnalysis.store";

function color(score: number): string {
  if (score >= 75) return "text-emerald-300";
  if (score >= 55) return "text-yellow-300";
  return "text-red-300";
}

function barColor(score: number): string {
  if (score >= 75) return "bg-emerald-400";
  if (score >= 55) return "bg-yellow-300";
  return "bg-red-400";
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`font-black ${color(value)}`}>{value}</span>
      </div>

      <div className="h-1.5 rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${barColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function BeatGridPanel() {
  const bpm = useMaqamAnalysisStore((state) => state.bpm);
  const beatOffsetMs = useMaqamAnalysisStore((state) => state.beatOffsetMs);
  const beatsPerBar = useMaqamAnalysisStore((state) => state.beatsPerBar);
  const setTempoConfig = useMaqamAnalysisStore((state) => state.setTempoConfig);
  const beatGridAnalysis = useMaqamAnalysisStore(
    (state) => state.beatGridAnalysis
  );
  const runTier2Analysis = useMaqamAnalysisStore(
    (state) => state.runTier2Analysis
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-right">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Audio Beat Grid</h2>
          <p className="mt-1 text-sm text-zinc-400">
            تحليل توافق النص مع الـ BPM، مواقع النبضات، القفلات، ومساحة النفس.
          </p>
        </div>

        {beatGridAnalysis && (
          <div className="rounded-2xl bg-cyan-500/10 px-4 py-3 text-center">
            <div className="text-xs text-zinc-400">Global Beat Fit</div>
            <div className="text-3xl font-black text-cyan-300">
              {beatGridAnalysis.globalBeatFitScore}
            </div>
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <label className="rounded-2xl bg-zinc-900 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <Gauge size={15} />
            BPM
          </div>
          <input
            type="number"
            value={bpm}
            min={40}
            max={220}
            onChange={(event) =>
              setTempoConfig({ bpm: Number(event.target.value) })
            }
            className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <label className="rounded-2xl bg-zinc-900 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <Clock3 size={15} />
            Offset Ms
          </div>
          <input
            type="number"
            value={beatOffsetMs}
            onChange={(event) =>
              setTempoConfig({ beatOffsetMs: Number(event.target.value) })
            }
            className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <label className="rounded-2xl bg-zinc-900 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
            <Music2 size={15} />
            Beats / Bar
          </div>
          <input
            type="number"
            value={beatsPerBar}
            min={2}
            max={8}
            onChange={(event) =>
              setTempoConfig({ beatsPerBar: Number(event.target.value) })
            }
            className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <button
          onClick={() => runTier2Analysis(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500"
        >
          <AudioLines size={18} />
          تحليل الشبكة
        </button>
      </div>

      {!beatGridAnalysis ? (
        <div className="rounded-2xl bg-zinc-900 p-5 text-sm text-zinc-400">
          اضبط الـ BPM ثم شغّل التحليل لقراءة توافق كل بار مع الشبكة الإيقاعية.
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <Metric
              label="متوسط المقاطع لكل Beat"
              value={Math.round(
                Math.min(100, beatGridAnalysis.averageSyllablesPerBeat * 24)
              )}
            />
            <Metric
              label="Global Beat Fit"
              value={beatGridAnalysis.globalBeatFitScore}
            />
            <Metric
              label="ثبات القفلات"
              value={Math.round(
                beatGridAnalysis.barFits.reduce(
                  (sum, fit) => sum + fit.cadenceLandingScore,
                  0
                ) / Math.max(1, beatGridAnalysis.barFits.length)
              )}
            />
          </div>

          <div className="space-y-3">
            {beatGridAnalysis.barFits.map((fit) => (
              <div
                key={fit.barId}
                className="rounded-2xl border border-white/10 bg-zinc-900 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                      <Activity size={14} />
                      <span>Bar {fit.index + 1}</span>
                      <span>•</span>
                      <span>{fit.section}</span>
                      <span>•</span>
                      <span>{fit.estimatedSyllables} syllables</span>
                      <span>•</span>
                      <span>{fit.syllablesPerBeat ? fit.syllablesPerBeat.toFixed(2) : "0.00"} / beat</span>
                    </div>

                    <p className="truncate text-sm text-zinc-200">{fit.text}</p>
                  </div>

                  <div className={`text-2xl font-black ${color(fit.overallBeatFitScore)}`}>
                    {fit.overallBeatFitScore}
                  </div>
                </div>

                <div className="mb-4 h-2 rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${barColor(fit.overallBeatFitScore)}`}
                    style={{ width: `${fit.overallBeatFitScore}%` }}
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-6">
                  <Metric label="Density" value={fit.densityScore} />
                  <Metric label="Downbeat" value={fit.downbeatAlignmentScore} />
                  <Metric label="Cadence" value={fit.cadenceLandingScore} />
                  <Metric label="Breath" value={fit.breathWindowScore} />
                  <Metric label="Syncopation" value={fit.syncopationScore} />
                  <Metric label="Groove" value={fit.grooveScore} />
                </div>

                {!!fit.warnings.length && (
                  <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
                    {fit.warnings.join("، ")}
                  </div>
                )}

                {!!fit.suggestions.length && (
                  <div className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-xs text-yellow-100">
                    {fit.suggestions.join("، ")}
                  </div>
                )}

                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <div className="flex min-w-full">
                    {fit.timingUnits.slice(0, 18).map((unit) => (
                      <div
                        key={`${fit.barId}-${unit.tokenIndex}`}
                        className="min-w-[96px] border-l border-white/10 p-2"
                      >
                        <div className="truncate text-xs text-zinc-200">
                          {unit.token}
                        </div>
                        <div className="mt-1 text-[10px] text-zinc-500">
                          B{unit.beatIndexStart} · phase{" "}
                          {unit.beatPhaseStart ? unit.beatPhaseStart.toFixed(2) : "0.00"}
                        </div>
                        <div className="mt-2 h-1 rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${barColor(unit.stressScore)}`}
                            style={{ width: `${unit.stressScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!!beatGridAnalysis.suggestions.length && (
            <div className="mt-6 rounded-2xl bg-zinc-900 p-4">
              <h3 className="mb-3 font-bold text-white">اقتراحات Beat Grid</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {beatGridAnalysis.suggestions.map((suggestion) => (
                  <li key={suggestion} className="rounded-xl bg-zinc-800 p-3">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
