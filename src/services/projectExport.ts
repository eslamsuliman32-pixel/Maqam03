import { useLyricsStore } from "../store/lyricsStore";
import { useAlignmentStore } from "../store/alignmentStore";
import { useRepositoryStore } from "../store/repositoryStore";
import { useBeatAnalysisStore } from "../store/beatAnalysisStore";
import type { SyllableAlignment, FlowDensityFrame } from "../types/alignment";

const PROJECT_VERSION = "1.0";

export interface MaqamProject {
  version: string;
  exportedAt: string;
  bpm: number;
  lyrics: unknown;
  alignment: unknown;
  repository: unknown;
}

// تجميع المشروع كاملاً في كائن واحد
export const buildProject = (): MaqamProject => ({
  version: PROJECT_VERSION,
  exportedAt: new Date().toISOString(),
  bpm: useBeatAnalysisStore.getState().beatGrid?.tempoMap[0]?.bpm ?? 120,
  lyrics: useLyricsStore.getState().serialize(),
  alignment: useAlignmentStore.getState().serialize(),
  repository: useRepositoryStore.getState().serialize(),
});

// تنزيل ملف
const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // تحرير الـ URL مباشرة بعد نقرة المحاكاة لتجنب تسريب الذاكرة
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// تصدير المشروع كملف .maqam.json
export const exportProjectFile = (name = "track") => {
  const project = buildProject();
  const json = JSON.stringify(project, null, 2);
  downloadBlob(json, `${name}.maqam.json`, "application/json");
};

// تصدير الكلمات نصاً صرفاً (مرتبة بالعد والأقسام)
export const exportLyricsText = (name = "track") => {
  const repo = useRepositoryStore.getState();
  const lyrics = useLyricsStore.getState();
  const lines: string[] = [];

  for (const secId of repo.sectionOrder) {
    const sec = repo.sections[secId];
    if (!sec) continue;
    lines.push(`[${sec.name}]`);
    for (const barId of sec.barIds) {
      const bar = repo.playlistBars[barId];
      if (!bar) continue;
      const barWords = bar.wordIds
        .map((wid) => lyrics.words[wid]?.text ?? "")
        .filter(Boolean)
        .join(" ");
      lines.push(`  ${barWords}`);
    }
    lines.push("");
  }
  downloadBlob(lines.join("\n"), `${name}.txt`, "text/plain");
};

// حساب الأداء وتقرير التدفق الفني بشكل مستقل وحقيقي
export const analyzeFlowPerformance = (
  alignments: SyllableAlignment[],
  density: FlowDensityFrame[]
) => {
  if (alignments.length === 0) {
    return {
      score: 0,
      status: "لا توجد كلمات",
      message: "لم تكتب أو تحاذِ كلمات بعد للبدء في التحليل الموسيقي للتدفق.",
      recommendations: ["يرجى كتابة كلمات أو استيراد تحليل محاذاة صوتية."]
    };
  }

  // 1. نسبة الضربات المحاذية بدقة
  const total = alignments.length;
  const onBeatCount = alignments.filter((a) => a.isOnBeat).length;
  const onBeatRatio = onBeatCount / total;

  // 2. المحاذاة اليدوية (تقييم الحرفية/التعديل اليدوي)
  const manualCount = alignments.filter((a) => a.alignmentSource === "manual").length;
  const manualRatio = manualCount / total;

  // 3. متوسط الانحراف الزمني (MS)
  const avgOffset = alignments.reduce((sum, a) => sum + Math.abs(a.offsetFromBeatMs), 0) / total;

  // 4. تقييم السرعة القصوى ومتوسط التدفق
  const speeds = density.map((d) => d.deliverySpeed).filter((s) => s > 0);
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const avgSpeed = speeds.length > 0 ? speeds.reduce((s, a) => s + a, 0) / speeds.length : 0;

  // معادلة حقيقية لتقييم الاحترافية التقنية بمدى القرب من الفوز بالبيت
  let score = Math.round(onBeatRatio * 60 + (1 - Math.min(1, avgOffset / 150)) * 30 + Math.min(1, manualRatio) * 10);
  score = Math.max(0, Math.min(100, score));

  let status = "مبتدئ / غير متزن";
  let message = "";
  const recommendations: string[] = [];

  if (score >= 90) {
    status = "تدفق ممتصّ للبيت (Pocket Flow Master)";
    message = `عظيم! كلماتك متصلة بالضربات القوية تماماً (على الموعد الخالص). المحاذاة والالتصاق ممتازان، ومتوسط انحرافك هو فقط ${avgOffset.toFixed(1)} مللي ثانية.`;
  } else if (score >= 75) {
    status = "تدفق احترافي متزن (Laid-Back Or Pushing Hybrid)";
    message = `ممتاز، التدفق ناضج ومتناسق بشكل كافٍ مع بعض الفروق الدقيقة المبررة. انحرافك المتوسط ${avgOffset.toFixed(1)} مللي ثانية يمنح المقطع طابعاً بشرياً حياً.`;
  } else if (score >= 50) {
    status = "تدفق تجريبي بحاجة لشد المحاذاة";
    message = `تدفقك جيد ولكنه مهتز في بعض المواضع. نسبة الثبات على الضربة تعادل ${(onBeatRatio * 100).toFixed(0)}%. بعض المقاطع بحاجة لشد وقت البداية.`;
  } else {
    status = "تدفق متشتت عن إيقاع الشبكة";
    message = `الانحراف الزمني المتوسط كبير جداً (${avgOffset.toFixed(1)} مللي ثانية). يبدو أن المقاطع الصوتية تسبح خارج حدود الإيقاع تماماً.`;
  }

  // توليد توصيات حقيقية مبنية كلياً على القيم المحسوبة
  if (avgOffset > 60) {
    recommendations.push("قم بمحاذاة المقاطع المنزلقة يدوياً في Playlist لتقليل الانحراف الإجمالي.");
  }
  if (onBeatRatio < 0.70) {
    recommendations.push("احرص على مطابقة بدايات نطق الكلمات مع نقاط الضربات القوية (Downbeats) المميزة باللون الأخضر.");
  }
  if (maxSpeed > 10) {
    recommendations.push(`تم رصد سرعة نطق قصوى بلغت ${maxSpeed.toFixed(1)} مقطع/ثانية، احرص على تقليل الكلمات في المقاطع الأكثر كثافة لتجنب الازدحام.`);
  }
  if (manualCount === 0) {
    recommendations.push("جرّب سحب أحد التموجات لضبط توقيتها يدوياً لإضفاء لمسة الفلو المطلوبة وعزل التلوين الأزرق.");
  }

  if (recommendations.length === 0) {
    recommendations.push("استمر على هذا المستوى الثابت الرائع من الإلقاء والتحكم!");
  }

  return { score, status, message, recommendations };
};

// تصدير تقرير التدفق الفني
export const exportFlowReport = (name = "track") => {
  const alignments = Object.values(useAlignmentStore.getState().alignments) as SyllableAlignment[];
  const density = useAlignmentStore.getState().flowDensity;
  const feedback = analyzeFlowPerformance(alignments, density);

  const report = [
    `# تقرير التدفق لملف: ${name}`,
    `تاريخ التصدير: ${new Date().toLocaleDateString("ar-EG")}`,
    ``,
    `## التقييم الإجمالي للتدفق اللفظي`,
    `- **التصنيف الفني:** ${feedback.status}`,
    `- **درجة التطابق والمحاذاة:** ${feedback.score} / 100`,
    ``,
    `### التحليل والتشخيص الحركي`,
    feedback.message,
    ``,
    `## التوصيات والإجراءات التصحيحية المحسوبة`,
    ...feedback.recommendations.map((r) => `- ${r}`),
  ].join("\n");

  downloadBlob(report, `${name}-flow-report.md`, "text/markdown");
};

// استيراد مشروع وإعادة بثّه للمتاجر
export const importProjectFile = async (file: File) => {
  const text = await file.text();
  const project = JSON.parse(text) as MaqamProject;
  if (project.version !== PROJECT_VERSION) {
    console.warn(`نسخة مشروع ذات إصدار مختلف: ${project.version}`);
  }
  useLyricsStore.getState().hydrate(project.lyrics);
  useAlignmentStore.getState().hydrate(project.alignment);
  useRepositoryStore.getState().hydrate(project.repository as never);
};
