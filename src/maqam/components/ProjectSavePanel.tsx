import { Cloud, CloudOff, Database, Save, Trash2 } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useMaqamAnalysisStore } from "../store/maqamAnalysis.store";
import { useMaqamProjectStore } from "../store/maqamProject.store";
import type { MaqamProjectAnalysisBundle } from "../types/project.types";

function statusLabel(status?: string): string {
  switch (status) {
    case "synced":
      return "متزامن";
    case "dirty":
      return "تعديلات غير مرفوعة";
    case "local-only":
      return "محلي فقط";
    case "syncing":
      return "جاري المزامنة";
    case "error":
      return "خطأ في المزامنة";
    default:
      return "غير محفوظ";
  }
}

export function ProjectSavePanel() {
  const bars = useMaqamAnalysisStore((state) => state.bars);
  const bpm = useMaqamAnalysisStore((state) => state.bpm);
  const beatOffsetMs = useMaqamAnalysisStore((state) => state.beatOffsetMs);
  const beatsPerBar = useMaqamAnalysisStore((state) => state.beatsPerBar);
  const analysisState = useMaqamAnalysisStore(
    useShallow((state) => ({
        phoneticResults: state.phoneticResults,
        narrativeArc: state.narrativeArc,
        hookAnalysis: state.hookAnalysis,
        sonicSemanticLines: state.sonicSemanticLines,
        beatGridAnalysis: state.beatGridAnalysis,
        audioBeatAnalysis: state.audioBeatAnalysis,
        vocalTimingAnalysis: state.vocalTimingAnalysis,
    }))
  );

  const currentProject = useMaqamProjectStore((state) => state.currentProject);
  const createNewProject = useMaqamProjectStore((state) => state.createNewProject);
  const saveCurrentProject = useMaqamProjectStore(
    (state) => state.saveCurrentProject
  );
  const syncCurrentProject = useMaqamProjectStore(
    (state) => state.syncCurrentProject
  );
  const deleteCurrentProject = useMaqamProjectStore(
    (state) => state.deleteCurrentProject
  );

  const isSaving = useMaqamProjectStore((state) => state.isSaving);
  const isSyncing = useMaqamProjectStore((state) => state.isSyncing);
  const error = useMaqamProjectStore((state) => state.error);

  const handleSave = async () => {
    const analysis = analysisState as MaqamProjectAnalysisBundle;

    if (!currentProject) {
      await createNewProject({
        title: "مشروع Maqam جديد",
        bpm,
        beatOffsetMs,
        beatsPerBar,
        bars,
      });

      return;
    }

    await saveCurrentProject({
      bpm,
      beatOffsetMs,
      beatsPerBar,
      bars,
      analysis,
    });
  };

  const handleSaveAndSync = async () => {
    await handleSave();
    await syncCurrentProject();
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 text-right">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">حفظ المشروع</h2>
          <p className="mt-1 text-sm text-zinc-400">
            حفظ محلي عبر IndexedDB مع مزامنة Firestore عند الحاجة.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-center">
          <div className="text-xs text-zinc-500">Sync Status</div>
          <div className="text-sm font-bold text-cyan-200">
            {statusLabel(currentProject?.meta.syncStatus)}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          <Save size={17} />
          {isSaving ? "جاري الحفظ..." : "حفظ محلي"}
        </button>

        <button
          onClick={handleSaveAndSync}
          disabled={isSaving || isSyncing || !currentProject}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-60"
        >
          {isSyncing ? <CloudOff size={17} /> : <Cloud size={17} />}
          {isSyncing ? "جاري المزامنة..." : "حفظ ومزامنة"}
        </button>

        <button
          onClick={() => deleteCurrentProject(false)}
          disabled={!currentProject}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600/80 px-4 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-60"
        >
          <Trash2 size={17} />
          حذف محلي
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Database size={14} />
        <span>
          Project ID:{" "}
          <span className="text-zinc-300">
            {currentProject?.meta.id ?? "لم يتم إنشاء مشروع بعد"}
          </span>
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </section>
  );
}
