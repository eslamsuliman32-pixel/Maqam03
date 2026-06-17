import { useEffect } from "react";
import { NarrativeArcPanel } from "../maqam/components/NarrativeArcPanel";
import { HookEngineeringPanel } from "../maqam/components/HookEngineeringPanel";
import { SonicSemanticHeatmap } from "../maqam/components/SonicSemanticHeatmap";
import { BeatGridPanel } from "../maqam/components/BeatGridPanel";
import { ProjectSavePanel } from "../maqam/components/ProjectSavePanel";
import { AudioUploadBeatAnalyzerPanel } from "../maqam/components/AudioUploadBeatAnalyzerPanel";
import { TimelinePlaylist } from "../components/timeline/TimelinePlaylist";
import { useMaqamAnalysisStore } from "../maqam/store/maqamAnalysis.store";
import type { BarInput } from "../maqam/types/maqam.types";

const demoBars: BarInput[] = [
  {
    id: "bar-1",
    index: 0,
    section: "verse",
    text: "كنت في ليل طويل شايل حلمي فوق كتافي",
  },
  {
    id: "bar-2",
    index: 1,
    section: "verse",
    text: "النور كان بعيد بس صوته كان بينادي",
  },
  {
    id: "bar-3",
    index: 2,
    section: "verse",
    text: "بين ضعف وقوه كنت ببني في الرماد بلادي",
  },
  {
    id: "bar-4",
    index: 3,
    section: "verse",
    text: "رجعت لنفس الطريق بس قلبي بقى دليلي",
  },
  {
    id: "hook-1",
    index: 4,
    section: "hook",
    text: "عقلي سلاحي قلبي جراحي",
  },
  {
    id: "hook-2",
    index: 5,
    section: "hook",
    text: "ضعفي فلاحي نصري كفاحي",
  },
];

export default function MaqamWorkshopPage() {
  const setBars = useMaqamAnalysisStore((state) => state.setBars);
  const setTempoConfig = useMaqamAnalysisStore((state) => state.setTempoConfig);
  const runTier1Analysis = useMaqamAnalysisStore((state) => state.runTier1Analysis);
  const runTier2Analysis = useMaqamAnalysisStore((state) => state.runTier2Analysis);

  useEffect(() => {
    setBars(demoBars);
    setTempoConfig({
      bpm: 92,
      beatOffsetMs: 0,
      beatsPerBar: 4,
      subdivision: 4,
    });

    setTimeout(() => {
      runTier1Analysis();
      runTier2Analysis();
    }, 0);
  }, [setBars, setTempoConfig, runTier1Analysis, runTier2Analysis]);

  return (
    <main dir="rtl" className="min-h-screen bg-transparent p-6 font-[Cairo] text-white">
      <div className="space-y-6">
        <header className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
          <h1 className="text-3xl font-black">
            Maqam OS2 — Engineering Workshop
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            تحليل سردي، صوتي، دلالي، وإيقاعي مع حفظ IndexedDB ومزامنة Firestore.
          </p>
        </header>

        <ProjectSavePanel />
        <AudioUploadBeatAnalyzerPanel />

        {/* مسار الأقسام والمقاطع ملوّنة تفاعلياً كـ Playlist DAW */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-wide">الـ Playlist والمسار الإيقاعي التفاعلي (DAW Timeline)</h2>
            <span className="text-[10px] bg-gold-400/15 border border-gold-400/30 text-gold-400 font-bold px-2.5 py-0.5 rounded-full uppercase">تحرير يدوي 1/16</span>
          </div>
          <TimelinePlaylist />
        </section>

        <BeatGridPanel />
        <NarrativeArcPanel />
        <HookEngineeringPanel />
        <SonicSemanticHeatmap />
      </div>
    </main>
  );
}
