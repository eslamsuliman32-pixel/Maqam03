import type { BarInput, EmotionTarget } from "../types/maqam.types";
import type { HookAnalysis } from "../types/hook.types";
import type { NarrativeArcAnalysis } from "../types/narrative.types";

const GEMINIAPIKEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

interface GeminiTextResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINIAPIKEY) {
    throw new Error("VITE_GEMINI_API_KEY is missing.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINIAPIKEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.75,
          topP: 0.9,
          maxOutputTokens: 1200,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  const data = (await response.json()) as GeminiTextResponse;

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

export async function improveHookWithGemini(params: {
  hook: string;
  analysis: HookAnalysis;
  targetEmotion?: EmotionTarget;
}): Promise<string> {
  const prompt = `أنت مساعد هندسة راب عربي داخل تطبيق Maqam OS2.
حلّل الهوك التالي واقترح 3 نسخ محسّنة فقط، بدون شرح طويل.

الهوك:
${params.hook}

نتائج التحليل:
• Memorability: ${params.analysis.memorabilityScore}
• Symmetry: ${params.analysis.symmetryScore}
• Semantic Compression: ${params.analysis.semanticCompressionScore}
• Paradox: ${params.analysis.paradoxScore}
• Cadence: ${params.analysis.cadenceScore}
• Resonant Keyword: ${params.analysis.resonantKeywordScore}
• Sonic Harmony: ${params.analysis.sonicHarmonyScore}
• Target Emotion: ${params.targetEmotion ?? "غير محدد"}

الشروط:
حافظ على العربية الطبيعية.
اجعل الهوك قصيرًا وسهل الحفظ.
أضف قافية واضحة.
أضف مفارقة أو صورة حسية لو مناسب.
لا تقلد فنانًا بعينه.`;

  return callGemini(prompt);
}

export async function improveNarrativeVerseWithGemini(params: {
  bars: BarInput[];
  analysis: NarrativeArcAnalysis;
  targetEmotion?: EmotionTarget;
}): Promise<string> {
  const verse = params.bars.map((bar) => bar.text).join("\n");

  const prompt = `أنت محرك هندسة سردية للراب العربي داخل Maqam OS2.
حسّن الفيرس التالي بناءً على نتائج التحليل، وأعد كتابة نسخة أقوى من 8 إلى 12 بار.

الفيرس:
${verse}

نتائج القوس السردي:
• Circularity: ${params.analysis.circularityScore}
• Montage: ${params.analysis.montageScore}
• Contradiction Harmony: ${params.analysis.contradictionHarmonyScore}
• Metaphor Evolution: ${params.analysis.metaphorEvolutionScore}
• Sonic-Semantic Integration: ${params.analysis.sonicSemanticIntegrationScore}
• Global Score: ${params.analysis.globalNarrativeScore}
• Target Emotion: ${params.targetEmotion ?? "غير محدد"}

الشروط:
أضف سردًا دائريًا يعود للنقطة الأولى بمعنى أعمق.
استخدم مونتاجًا سرديًا: انتقال زمني أو مشهدي.
وظّف ثنائية متناقضة واحدة على الأقل.
طوّر استعارة مركزية عبر الفيرس.
حافظ على قابلية الأداء على بيت راب.
لا تكتب شرحًا؛ أعط النص المحسّن فقط.`;

  return callGemini(prompt);
}
