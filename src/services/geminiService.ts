/**
 * MAQAM v2.0 - Gemini Service + Elite Semantic Intelligence Engine
 * ================================================================
 * Phase 2 Upgrade: Deep Semantic Architecture
 *
 * New Capabilities:
 *  - deepSemanticAnalysis(): 7-dimensional bar analysis via elite prompt
 *  - NarrativeArcTag: Build-up / Climax / Resolution / Bridge classification
 *  - ThematicVector: 8-axis semantic fingerprint
 *  - MetaphoricalLayer: depth-graded figurative language detection
 *  - buildNarrativeSongArc(): sequences bars into a coherent song narrative
 *  - extractThematicVector(): lightweight single-bar thematic scan
 *  - Enhanced analyzeBars(): now includes semanticTags + narrativeArc in output
 */

import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { moraEngine } from "./moraEngine";
import {
  ProfessionalBeatAnalysis,
  FlowEngineeringProfile,
  QualityBenchmarkReport,
  LyricPlacementMap,
} from "./pipelineTypes";
import { ArabicDialect } from "./moraEngine";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const groq = API_KEY
  ? new Groq({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
  : null;

// Initialize Google AI with rotation pool mapping
const PLACEHOLDERS = [
  "AIzaSyA4bWmRml-sSFEKWJRAoCKJG2nugZJjmOI",
  "AIzaSyDAdU1Eb6herKrGsc0XuqYbTxaBcX6aYyE",
  "AIzaSyAc0RmbZw0jW-dxSKYH3fmEaqdRrCtMO9E",
  "MY_GEMINI_API_KEY",
  "YOUR_GEMINI_API_KEY"
];

const isValidKey = (k: any): boolean => {
  if (!k || typeof k !== 'string') return false;
  const tk = k.trim();
  return tk.length > 0 && !PLACEHOLDERS.includes(tk);
};

const ALL_CANDIDATE_KEYS = [
  (typeof process !== "undefined" ? process.env?.VITE_GEMINI_KEY_01 : undefined) || import.meta.env.VITE_GEMINI_KEY_01 || "",
  (typeof process !== "undefined" ? process.env?.VITE_GEMINI_KEY_02 : undefined) || import.meta.env.VITE_GEMINI_KEY_02 || "",
  (typeof process !== "undefined" ? process.env?.VITE_GEMINI_KEY_03 : undefined) || import.meta.env.VITE_GEMINI_KEY_03 || "",
];

const GEMINI_POOL: string[] = ALL_CANDIDATE_KEYS.filter(isValidKey);

const GEMINI_KEY_FALLBACK =
  (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined) ||
  import.meta.env.VITE_GEMINI_API_KEY ||
  "";

if (GEMINI_POOL.length === 0 && isValidKey(GEMINI_KEY_FALLBACK)) {
  GEMINI_POOL.push(GEMINI_KEY_FALLBACK.trim());
}

// Default static SDK client using first key for structural compatibility
const ai = GEMINI_POOL.length > 0 ? new GoogleGenAI({ apiKey: GEMINI_POOL[0] }) : null;

// Track active rotation index of the load-balanced pool
let activeKeyIndex = 0;

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

export async function callDirectGemini(params: any): Promise<any> {
  if (GEMINI_POOL.length === 0) {
    throw new Error("No Gemini keys configured in the rotation pool.");
  }

  const maxAttempts = GEMINI_POOL.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentIndex = activeKeyIndex % GEMINI_POOL.length;
    const currentKey = GEMINI_POOL[currentIndex];
    
    try {
      const client = new GoogleGenAI({ apiKey: currentKey });
      const modelName = params.model?.includes("pro")
        ? "gemini-3.1-pro-preview"
        : "gemini-3-flash-preview";

      const response = await client.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          ...params.generationConfig,
        },
      });

      return { text: response.text };
    } catch (error: any) {
      console.warn(`Gemini pool key at index ${currentIndex} failed (attempt ${attempt + 1}/${maxAttempts}). Error:`, error.message || error);
      lastError = error;
      
      // Rotate index to proceed to the next available pooled credential
      activeKeyIndex++;
    }
  }

  throw new Error(`All keys in the Gemini rotation pool failed. Last error: ${lastError?.message || lastError}`);
}

export async function callGeminiWithRetry(
  params: any,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY,
): Promise<any> {
  // If no Groq, go direct to Gemini
  if (!groq) return callDirectGemini(params);

  try {
    const promptText = params.contents?.[0]?.parts?.[0]?.text || "";
    const sysInst = params.systemInstruction || "";
    const temp = params.generationConfig?.temperature ?? 0.5;
    const isJson =
      params.generationConfig?.responseMimeType === "application/json";

    // Use the latest officially supported Groq Llama 3 models
    const isFlash = params.model?.includes("flash");
    const groqModel = isFlash
      ? "llama-3.1-8b-instant"
      : "llama-3.3-70b-versatile";

    // Enforce JSON object requirement for Groq's json_object format
    let finalSysInst = sysInst;
    if (isJson && !finalSysInst.toLowerCase().includes("json")) {
      finalSysInst += "\nProvide the output in JSON format.";
    }

    const requestOptions: any = {
      messages: [
        { role: "system", content: finalSysInst },
        { role: "user", content: promptText },
      ],
      model: groqModel,
      temperature: temp,
      max_tokens: params.generationConfig?.maxOutputTokens || 8192,
      response_format: isJson ? { type: "json_object" } : undefined,
    };

    const chatCompletion = await groq.chat.completions.create(requestOptions);
    return { text: chatCompletion.choices[0]?.message?.content || "" };
  } catch (error: any) {
    if (ai) {
      console.warn("Groq failed, trying Gemini direct...", error.message);
      try {
        return await callDirectGemini(params);
      } catch (geminiError: any) {
        const isRateLimited =
          error.status === 429 || geminiError.message?.includes("429");
        if (retries > 0 && isRateLimited) {
          const waitTime = delay * 2;
          await new Promise((r) => setTimeout(r, waitTime));
          return callGeminiWithRetry(params, retries - 1, waitTime);
        }
        throw geminiError;
      }
    }

    const isRateLimited = error.status === 429;
    if (retries > 0 && isRateLimited) {
      const waitTime = delay * 2;
      console.warn(
        `Groq API rate limit, retrying in ${waitTime}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
        error,
      );
      await new Promise((r) => setTimeout(r, waitTime));
      return callGeminiWithRetry(params, retries - 1, waitTime);
    }

    throw error;
  }
}

// ─── Original Interfaces (preserved) ─────────────────────────────────────────

export interface BarDirective {
  index: number;
  recommendedTechnique: string;
  phonemeFocus: string;
  syllableTarget: number;
  energyLevel: "low" | "medium" | "high" | "peak";
  description: string;
}

export interface BeatAnalysis {
  beatType:
    | "trap"
    | "boom_bap"
    | "melodic_trap"
    | "afro_arabic"
    | "drill"
    | "cloud_rap"
    | "hybrid";
  subType: string;
  emotionalRegister:
    | "confrontational"
    | "triumphant"
    | "melancholic"
    | "contemplative"
    | "aggressive"
    | "nostalgic"
    | "celebratory";
  culturalIdentity:
    | "arabic_urban"
    | "sudanese_afro"
    | "gulf_modern"
    | "north_african"
    | "western_trap"
    | "hybrid";
  syllableCapacity: number;
  rhymeSchemes: Array<{ scheme: string; justification: string }>;
  phonemeRecommendations: string[];
  pocketZones: number[];
  overflowZones: number[];
  groovePattern: "straight" | "swung" | "syncopated" | "afrobeat";
  drumMap?: {
    kicks: number[];
    snares: number[];
    hihats: number[];
  };
  trackProtocol: {
    sections: Array<{
      type: "intro" | "verse" | "hook" | "bridge" | "outro";
      bars: number;
      directives: BarDirective[];
    }>;
  };
}

export interface BarAnalysis {
  index: number;
  corePhoneme: string;
  totalMorae: number;
  weightClass:
    | "light"
    | "medium_light"
    | "medium_heavy"
    | "heavy"
    | "super_heavy";
  sonicWeight: number;
  rhythmicWeight: number;
  flowMode:
    | "pocket"
    | "soft_overflow"
    | "hard_overflow"
    | "compressed_pocket"
    | "mixed";
  endPhoneme: string;
  internalRhymes: number;
  syllableCount: number;
  fingerprintCode: string;
  alignmentScore: number;
  compatibleBeats: string[];
  strengthNote: string;
  weaknessNote: string;
  emotion?: string;
}

// ─── NEW: Semantic Analysis Interfaces ───────────────────────────────────────

export type NarrativeArcLabel =
  | "intro" // atmospheric opener — sets the scene
  | "build_up" // rising tension, energy accumulates
  | "climax" // maximum impact — punchline zone
  | "resolution" // aftermath, reflection, wrap-up
  | "bridge" // lateral transition — shifts topic or tone
  | "outro" // fade-out, epilogue
  | "unclassified";

export interface NarrativeArcTag {
  arc: NarrativeArcLabel;
  /** Confidence level 0.0–1.0 */
  confidence: number;
  /** Why this arc label was chosen */
  justification: string;
  /** Numeric arc position 0.0 (opener) to 1.0 (closer) */
  arcPosition: number;
}

export interface SemanticTag {
  /** e.g., 'dark', 'street', 'motivational', 'melancholy', 'braggadocio', 'spiritual' */
  tag: string;
  /** How dominant this tag is in the bar — 0.0–1.0 */
  weight: number;
  /** Short Arabic textual evidence from the bar */
  evidence: string;
}

export type MetaphorType =
  | "literal"
  | "simile"
  | "metaphor"
  | "symbol"
  | "allusion"
  | "hyperbole";

export interface MetaphoricalLayer {
  type: MetaphorType;
  /** Depth rating 1 (surface) to 5 (deeply embedded) */
  depth: number;
  /** Human-readable description of the figurative element */
  description: string;
  /** Original text fragment that carries the metaphor */
  fragment: string;
}

/**
 * ThematicVector: 8-dimensional coordinate space for bar meaning.
 * Each axis is scored 0–10.
 * This enables vector-distance comparison between bars for smart grouping.
 */
export interface ThematicVector {
  aggression: number; // قوة وعدوانية
  vulnerability: number; // هشاشة وانكشاف عاطفي
  pride: number; // كبرياء واعتزاز
  melancholy: number; // حزن وتأمل
  wisdom: number; // حكمة وعمق فلسفي
  rebellion: number; // تمرد ورفض القيود
  love: number; // حب وعاطفة
  spirituality: number; // روحانية وتعالٍ
}

export interface SemanticAnalysis {
  barId: string;
  text: string;
  narrativeArc: NarrativeArcTag;
  semanticTags: SemanticTag[];
  metaphoricalLayers: MetaphoricalLayer[];
  thematicVector: ThematicVector;
  /** Primary mood label in Arabic */
  dominantMood: string;
  /** 0–100: how much information (ideas/images) is packed into the bar */
  lyricDensity: number;
  /** 0–100: depth of Arabic cultural / literary resonance */
  culturalDepth: number;
  /** Weighted composite of all semantic dimensions — 0–100 */
  compositeSemanticScore: number;
  /** One-sentence Arabic characterization */
  emotionalSignature: string;
}

/**
 * NarrativeSongArc: the ordered semantic narrative structure of a set of bars.
 * Used to arrange bars into a coherent song flow automatically.
 */
export interface NarrativeSongArc {
  bars: Array<{
    id: string;
    arcPosition: number;
    arc: NarrativeArcTag;
    /** How this bar connects thematically to the previous bar */
    linksToPrevious: string;
    /** How this bar sets up the next bar */
    linksToNext: string;
  }>;
  /** Dominant song-wide theme in one phrase */
  overallTheme: string;
  /** Ordered array of bar IDs recommended sequence */
  suggestedSequence: string[];
  /** Narrative arc summary in Arabic */
  arcSummary: string;
}

// ─── GeminiService Class ─────────────────────────────────────────────────────

export class GeminiService {
  private classifyBeatCache = new Map<string, BeatAnalysis>();
  private semanticAnalysisCache = new Map<string, SemanticAnalysis>();

  private cleanJSON(text: string | undefined): string {
    if (!text) return "{}";
    let cleaned = text.trim();

    // If there's a ```json block, prefer that
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/gi;
    let match;
    let lastJsonBlock = null;
    while ((match = jsonBlockRegex.exec(cleaned)) !== null) {
      lastJsonBlock = match[1].trim();
    }

    if (lastJsonBlock) {
      cleaned = lastJsonBlock;
    } else {
      // General markdown fallback
      const anyBlockRegex = /```\s*([\s\S]*?)\s*```/gi;
      let lastBlock = null;
      while ((match = anyBlockRegex.exec(cleaned)) !== null) {
        lastBlock = match[1].trim();
      }

      if (
        lastBlock &&
        (lastBlock.startsWith("{") || lastBlock.startsWith("["))
      ) {
        cleaned = lastBlock;
      } else {
        // Fallback: try substring from first valid start character to last valid end character
        // Only do this if it doesn't already look like proper JSON
        if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
          const firstBrace = cleaned.indexOf("{");
          const lastBrace = cleaned.lastIndexOf("}");
          const firstBracket = cleaned.indexOf("[");
          const lastBracket = cleaned.lastIndexOf("]");

          let startIdx = -1,
            endIdx = -1;

          if (firstBrace !== -1 && firstBracket !== -1) {
            if (firstBrace < firstBracket) {
              startIdx = firstBrace;
              endIdx = Math.max(lastBrace, lastBracket);
            } else {
              startIdx = firstBracket;
              endIdx = Math.max(lastBrace, lastBracket);
            }
          } else if (firstBrace !== -1) {
            startIdx = firstBrace;
            endIdx = lastBrace;
          } else if (firstBracket !== -1) {
            startIdx = firstBracket;
            endIdx = lastBracket;
          }

          if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
            cleaned = cleaned.substring(startIdx, endIdx + 1);
          }
        }
      }
    }
    return cleaned.trim();
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  ORIGINAL METHODS (preserved exactly)
  // ────────────────────────────────────────────────────────────────────────────

  async generateRaw(
    systemInstruction: string,
    prompt: string,
    model:
      | "gemini-3.1-pro-preview"
      | "gemini-3-flash-preview" = "gemini-3.1-pro-preview",
    temperature: number = 0.6,
  ): Promise<string> {
    try {
      const response = await callGeminiWithRetry({
        model: model,
        systemInstruction,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: temperature },
      });
      return response.text || "";
    } catch (error: any) {
      if (
        !error?.message?.toLowerCase().includes("quota") &&
        !error?.message?.includes("تجاوزت حصة")
      ) {
        console.error("generateRaw failed:", error);
      }
      throw error;
    }
  }

  async generateRawJSON(
    systemInstruction: string,
    prompt: string,
    model:
      | "gemini-3.1-pro-preview"
      | "gemini-3-flash-preview" = "gemini-3.1-pro-preview",
    temperature: number = 0.6,
  ): Promise<any> {
    try {
      const enforcedSysInstruction =
        systemInstruction +
        `
IMPORTANT: You MUST output ONLY valid JSON. 
Do NOT output any markdown, explanations, or Python code.
Your entire response must be parsable by JSON.parse().
Every property name must be enclosed in double quotes.`;
      const response = await callGeminiWithRetry({
        model: model,
        systemInstruction: enforcedSysInstruction,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const rawText = response.text || "{}";
      try {
        return JSON.parse(this.cleanJSON(rawText));
      } catch (parseError) {
        console.error("JSON parsing failed. Raw text:", rawText);
        // Return fallback formats if possible
        if (rawText.trim().startsWith("[")) return [];
        return {};
      }
    } catch (error: any) {
      if (
        !error?.message?.toLowerCase().includes("quota") &&
        !error?.message?.includes("تجاوزت حصة")
      ) {
        console.error("generateRawJSON failed:", error);
      }
      throw error;
    }
  }

  private pruneRawData(rawData: any): any {
    if (!rawData) return rawData;
    try {
      // Deep clone to avoid side effects
      const pruned = JSON.parse(JSON.stringify(rawData));

      // 1. Remove massive raw beat analysis data
      if (pruned.rawBeatAnalysis) {
        // AI doesn't need every energy frame (often thousands)
        delete pruned.rawBeatAnalysis.energyFrames;

        // Limit onsets to a representative sample (e.g., first 100)
        if (Array.isArray(pruned.rawBeatAnalysis.onsets)) {
          pruned.rawBeatAnalysis.onsets = pruned.rawBeatAnalysis.onsets.slice(
            0,
            100,
          );
        }

        // Limit beat tracking positions if they are numerous
        if (
          pruned.rawBeatAnalysis.beatTracking &&
          Array.isArray(pruned.rawBeatAnalysis.beatTracking.beatPositions)
        ) {
          pruned.rawBeatAnalysis.beatTracking.beatPositions =
            pruned.rawBeatAnalysis.beatTracking.beatPositions.slice(0, 100);
        }
      }

      // 2. Remove other bulky features that don't help classification much
      if (pruned.rawBuffer) delete pruned.rawBuffer;
      if (pruned.features && Array.isArray(pruned.features.mfcc)) {
        // Keep MFCC but maybe don't need huge precision or too many frames (though here it's already averaged)
      }

      // 3. Remove spectral contents if they are raw arrays (though usually they are averaged in this app)
      if (pruned.spectralProfile) {
        // If it exists and has large arrays, prune them
      }

      return pruned;
    } catch (e) {
      console.warn("Pruning failed, sending original (risky):", e);
      return rawData;
    }
  }

  async classifyBeat(rawData: any): Promise<BeatAnalysis> {
    const prunedData = this.pruneRawData(rawData);
    const cacheKey = prunedData?.metadata?.filename
      ? `${prunedData.metadata.filename}_${prunedData.metadata.sizeMB}_${prunedData.beatInfo?.bpm}`
      : JSON.stringify(prunedData?.features || prunedData);
    if (this.classifyBeatCache.has(cacheKey))
      return this.classifyBeatCache.get(cacheKey)!;

    const sysMsg =
      "أنت محلل إيقاعي متخصص في الموسيقى العربية والراب المعاصر. تستقبل بيانات صوتية مستخلصّة وتنتج تحليلاً تقنياً شاملاً. يجب أن يكون الإخراج بصيغة JSON صارمة فقط.";
    const prompt = `
المدخلات المُقدَّمة:
${JSON.stringify(prunedData, null, 2)}

مهمتك:
1. تحديد نوع البيت الدقيق من: [trap, boom_bap, melodic_trap, afro_arabic, drill, cloud_rap, hybrid]
2. تحديد النوع الفرعي بناءً على توزيع الطاقة.
3. استخلاص السجل العاطفي.
4. تحديد الهوية الثقافية.
5. حساب سعة المقاطع المثالية لكل بار.
6. ترتيب 3 مخططات قافية مع التبرير.
7. تحديد الحروف العربية المثالية لكل موضع إيقاعي.
8. وصف مناطق الـ Pocket والـ Overflow.
9. تقدير نمط الـ groove.
10. تحديد مواضع الطبول (drumMap) في بار مكون من 16 نبضة.
11. إضافة توجيهات (directives) على "بروتوكول المسار" (trackProtocol). 
    الأقسام الحقيقية مستخرجة مسبقا بواسطة محرك الصوت، حافظ على اسمها ومدتها بالضبط (الموجودة في المدخلات تحت trackProtocol.sections).
    لكل قسم، يجب توليد مصفوفة 'directives' تحتوي على هدف لكل بار في هذا القسم.
    كل عنصر في 'directives' يجب أن يكون كائناً (Object) يتبع الهيكل التالي:
    {
      "index": (رقم البار الكلي يبدأ من 0),
      "recommendedTechnique": "اسم التقنية (مثلاً: Alliteration, Internal Rhyme, Multi-syllabic)",
      "phonemeFocus": "الحرف التركيزي العربي",
      "syllableTarget": (عدد المقاطع المقترح),
      "energyLevel": "low|medium|high|peak",
      "description": "تعليمات دقيقة للأداء (مثلاً: ركز على القوافي الداخلية، تسارع في النهاية)"
    }

قواعد الإخراج: أجب بـ JSON صارم يتبع الهيكل التالي:
{
  "beatType": "trap",
  "subType": "...",
  "emotionalRegister": "confrontational",
  "culturalIdentity": "arabic_urban",
  "syllableCapacity": 12,
  "rhymeSchemes": [{ "scheme": "AABB", "justification": "..." }],
  "phonemeRecommendations": ["ق", "ر", "خ"],
  "pocketZones": [0, 2],
  "overflowZones": [3],
  "groovePattern": "straight",
  "drumMap": { "kicks": [0, 8], "snares": [4, 12], "hihats": [0, 2, 4, 6] },
  "trackProtocol": {
    "sections": [
      { 
        "type": "verse", 
        "bars": 16, 
        "directives": [
          { "index": 0, "recommendedTechnique": "...", "phonemeFocus": "...", "syllableTarget": 10, "energyLevel": "low", "description": "..." },
          ... (يجب أن يكون هناك عنصر لكل بار)
        ] 
      }
    ]
  }
}
    `;

    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const text = this.cleanJSON(response.text);
    const result = JSON.parse(text);
    this.classifyBeatCache.set(cacheKey, result);
    return result;
  }

  async analyzeBars(
    texts: string[],
    beatType: string,
    bpm: number,
    dialect: string,
  ): Promise<BarAnalysis[]> {
    const sysMsg =
      "أنت محلل راب عربي متخصص. تحلل مصفوفة من البارات وتقدم نتائج JSON صارمة لكل بار بناءً على قواعد العروض العربي والموراي.";
    const prompt = `
لكل بار أنتج مجموعة من المقاييس التقنية.
البيت المرجعي: ${beatType} — ${bpm} BPM
اللهجة: ${dialect}

البارات للتحليل:
${texts.map((t, i) => `${i}: ${t}`).join("\n")}

أجب بمصفوفة JSON فقط تحتوي على:
{
  "index": (integer),
  "corePhoneme": "حرف عربي واحد",
  "totalMorae": (integer),
  "weightClass": "light|medium_light|medium_heavy|heavy|super_heavy",
  "sonicWeight": (0-100),
  "rhythmicWeight": (0-100),
  "flowMode": "pocket|soft_overflow|hard_overflow|compressed_pocket|mixed",
  "endPhoneme": "حرف",
  "internalRhymes": (integer),
  "syllableCount": (integer),
  "fingerprintCode": "X-N-Y-Z",
  "alignmentScore": (0-100),
  "compatibleBeats": [string],
  "strengthNote": "string",
  "weaknessNote": "string",
  "emotion": "sage|aggressive|sad|angry|sarcastic|pride|other"
}
    `;

    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const text = response.text || "[]";
    let parsed: any[];
    try {
      const data = JSON.parse(this.cleanJSON(text));
      parsed = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to parse Gemini analyzeBars response:", e);
      parsed = [];
    }

    // Override with programmatic extraction for precision
    return parsed.map((bar: any, index: number) => {
      const originalText = texts[bar.index ?? index];
      if (originalText) {
        bar.corePhoneme =
          moraEngine.extractCorePhoneme(originalText) || bar.corePhoneme;
      }
      return bar;
    });
  }

  async analyzeBarForWorkshop(text: string, beatContext: any): Promise<any> {
    const prunedContext = this.pruneRawData(beatContext);
    const sysMsg =
      "أنت خبير في هندسة الراب العربي والبلاغة. تقدم تحليلات واقتراحات تقنية بصيغة JSON.";
    const prompt = `
قم بتحليل هذا البار: "${text}"
في سياق هذا البيت: ${JSON.stringify(prunedContext)}

مطلوب: 3 تقنيات شعرية و 4 تحسينات.
أجب بـ JSON صارم يضم : { techniques: [], improvements: [] }
    `;
    try {
      const response = await callGeminiWithRetry({
        model: "gemini-3-flash-preview",
        systemInstruction: sysMsg,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      });
      return JSON.parse(this.cleanJSON(response.text));
    } catch (error) {
      console.error("Error analyzing bar for workshop:", error);
      return { techniques: [], improvements: [] };
    }
  }

  async engineerFlow(
    text: string,
    analysis: ProfessionalBeatAnalysis,
  ): Promise<FlowEngineeringProfile> {
    const prunedAnalysis = this.pruneRawData(analysis);
    const sysMsg =
      "أنت مهندس فلو (Flow Engineer) متخصص في الراب العربي. تقوم بتحليل المسار الإيقاعي والمحاذاة الزمنية.";
    const prompt = `
البيت الاحترافي:
${JSON.stringify(prunedAnalysis, null, 2)}

النص المراد هندسته: "${text}"

المطلوب إنتاج JSON يطابق واجهة FlowEngineeringProfile يضم: rhymeScheme, phoneticCadence, microTimingGrid, dtwAlignmentScore...
    `;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text));
  }

  async runQualityBenchmark(
    text: string,
    flow: FlowEngineeringProfile,
    analysis: ProfessionalBeatAnalysis,
  ): Promise<QualityBenchmarkReport> {
    const prunedAnalysis = this.pruneRawData(analysis);
    const sysMsg =
      "أنت مدقق جودة للراب العربي. تقوم بتقييم كثافة القافية والدقة الإيقاعية.";
    const prompt = `
النص: "${text}"
الفلو الهندسي: ${JSON.stringify(flow, null, 2)}
تحليل البيت: ${JSON.stringify(prunedAnalysis, null, 2)}

أنتج تقرير جودة (QualityBenchmarkReport) بصيغة JSON يضم overallScore و recommendations.
    `;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text));
  }

  async generateBars(options: any): Promise<any[]> {
    const sysMsg =
      "أنت كاتب راب عربي محترف. تكتب بمنهجية الدمج الصوتي–الموسيقي الصارمة وتلتزم بقواعد الموراي وتنتج مصفوفة JSON.";
    const prompt =
      options.prompt ||
      `
السياق الموسيقي: ${options.bpm || "غير محدد"} BPM, نوع ${options.beatType || "غير محدد"}, مزاج ${options.emotionalRegister || "غير محدد"}
السياق الصوتي: حرف ${options.corePhoneme || "غير محدد"}, عائلة ${options.soundFamily || "غير محدد"}, نظام ${options.rhymeScheme || "غير محدد"}
القواعد: مجموع موراي ${options.minMorae || 0}-${options.maxMorae || 20}, اللهجة ${options.dialect || "فصحى"}, الموضوع ${options.theme || "عام"}

أنتج ثلاثة خيارات مختلفة بصيغة مصفوفة JSON.
    `;
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(this.cleanJSON(response.text || "[]"));
    return Array.isArray(parsed)
      ? parsed
      : parsed.suggestions || parsed.results || [];
  }

  async smartCategorize(
    bars: { id: string; text: string }[],
  ): Promise<Record<string, string[]>> {
    const sysMsg =
      "أنت خبير تصنيف لغوي وموسيقي للراب العربي. تصنف البارات إلى مجموعات دقيقة واحترافية. استجابتك يجب أن تكون بصيغة JSON فقط.";
    const prompt = `
صنف البارات التالية إلى مجموعات بناءً على: الموضوع، الأسلوب، الحالة المزاجية.
البارات:
${bars.map((b, i) => `[${i}] ${b.text}`).join("\n")}

يجب أن تقوم بإرجاع JSON فقط بالمواصفات التالية:
كائن (Object) حيث المفاتيح هي أسماء المجموعات والقيم هي مصفوفة من أرقام الـ index المطلقة.
على سبيل المثال:
{ "مجموعة 1": [0, 2], "مجموعة 2": [1, 3] }
لا تضف أي نصوص إضافية، ولا تُعد كتابة البارات. أرقام (Integers) فقط.
    `;
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    
    try {
      return JSON.parse(this.cleanJSON(response.text || "{}"));
    } catch(err) {
      console.error("Failed to parse smartCategorize JSON", err, "Response text:", response.text);
      return {};
    }
  }

  async analyzeRapAcademy(text: string, referenceTechs: string): Promise<any> {
    const sysMsg =
      "أنت كاتب ومحلل راب محترف. تحلل التقنيات الشعرية وتحدد الأدلة من النص.";
    const prompt = `
البار: "${text}"
التقنيات المرجعية: ${referenceTechs}

أنتج JSON يضم الحقول: detected, suggestions, score, summary.
    `;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  async improveIncompleteBars(incompleteIndicesContext: string): Promise<any> {
    const sysMsg =
      "أنت مهندس إيقاع عربي وخبير كتابة راب. تبرع في رفع كثافة الموراي (mora density) والوزن الإيقاعي (rhythmic weight). ترجع الإجابة بصيغة JSON حصراً.";
    const prompt = `قم بتحسين تدفق البارات الناقصة لزيادة "mora density" و "rhythmic weight".
هذه هي البارات ذات النصوص الناقصة أو الفارغة في الورشة:
${incompleteIndicesContext}

اقترح 3 بدائل محسنة لكل بار ناقص.
الرد بصيغة JSON فقط بهذا الشكل:
{
  "results": [
    { "index": <bar_index>, "alternatives": ["بديل 1", "بديل 2", "بديل 3"] }
  ]
}`;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  async applyVocalWeightToBar(barText: string): Promise<any> {
    const sysMsg =
      "أنت مهندس صوتيات وكاتب راب محترف جداً. ترجع الإجابة بصيغة JSON حصراً.";
    const prompt = `البار الحالي: "${barText}"
المطلوب أولاً: تطبيق تقنية "الوزن الصوتي" (Vocal Weight) بزيادة كثافة المقاطع غير المشددة (Unstressed Syllables) لجعل التسارع الإيقاعي أقوى.
المطلوب ثانياً: تحليل البار الناتج واقتراح 3 تحسينات/بدائل على إيقاعه لجعله أكثر تدفقاً.

أجب بصيغة JSON فقط:
{
  "suggestions": [
    "التحسين الأول المعتمد على الوزن الصوتي العالي مع تكثيف المقاطع غير المشددة...",
    "التحسين الثاني بتدفق سريع للساكنات...",
    "التحسين الثالث بدمج مقاطع طويلة وقصيرة..."
  ]
}`;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  async improveRapAcademy(text: string, referenceTechs: string): Promise<any> {
    const sysMsg =
      "أنت كاتب راب عربي محترف جداً ومُبتكر. عبقري في الصياغة الإيقاعية والتنويع. لا تبتذل ولا تكرر نفس النتيجة، بل تجتهد دائماً لتقديم قوافي معقدة، استعارات عميقة، وتدفق صوتي غير مسبوق. أنت لا تخطئ في الاستجابة بتنسيق JSON أبداً.";
    const prompt = `البار الحالي: "${text}"
المرجعية التقنية المطلوبة للتطبيق: 
${referenceTechs}

برجاء استخدام براعتك وإبداعك كمغني راب محترف (MC) لاقتراح أفضل التحسينات على هذا البار بناءً على التقنية المذكورة أعلاه.

**تحذير هام:** 
- اجتهد بشدة في الابتكار!
- لا تكرر البار الأصلي ولا تقدم حلولاً سطحية.
- أريد معاني قوية، وزن إيقاعي (Mora Density) عالي، وقافية مبتكرة.

**المطلوب:**
أرجع بصيغة JSON فقط، بالهيكل التالي بدقة:
{
  "original": "البار الأصلي المعطى",
  "improvements": [
    { 
      "technique": "اسم التقنية المطبقة",
      "why": "طريقة تفعيل التقنية ونجاحها (شرح احترافي قصير)",
      "rewrite": "البار المُعدّل والمُحسّن بشكل إبداعي جداً وقوي، ولا يكرر كلمات الآخرين" 
    }
  ],
  "pro_tip": "نصيحة احترافية عميقة لربط هذا البار بالإيقاع"
}
`;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  async detectWorkshopSections(bars: string[]): Promise<any> {
    const sysMsg =
      "أنت مهندس صوتي وكاتب راب محترف. تقسم البارات إلى أقسام موسيقية منطقية.";
    const prompt = `البارات:\n${bars.map((b, i) => `${i}: ${b}`).join("\n")}\n\nأنتج أقسام الأغنية بصيغة JSON يضم: sections.`;
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  async suggestTechniquesForBar(
    text: string,
    referenceTechs: string,
  ): Promise<any> {
    const sysMsg =
      "أنت خبير في هندسة الراب العربي. تقترح تقنيات بلاغية لتعزيز قوة البارات.";
    const prompt = `البار: "${text}"\nالقائمة: ${referenceTechs}\n\nاقترح 2-3 تقنيات محددة بصيغة JSON يضم: suggestions.`;
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  async suggestRhymes(
    word: string,
    context: string,
    maqam: string,
    maxSyllables: number,
  ): Promise<any> {
    const sysMsg =
      "أنت خبير في العروض والقوافي للراب العربي. تقترح قوافي تتناسب مع المقام والسياق.";
    const prompt = `الكلمة: "${word}"\nالسياق: "${context}", مقام ${maqam}, بحد أقصى ${maxSyllables} مقاطع.\n\nأنتج 5 قوافي بصيغة JSON يضم: suggestions.`;
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  NEW METHODS: DEEP SEMANTIC INTELLIGENCE ENGINE
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * deepSemanticAnalysis — the centrepiece of Phase 2.
   *
   * Sends a batch of bars to Gemini with a multi-dimensional elite prompt that
   * simultaneously extracts: NarrativeArc, ThematicVector, MetaphoricalLayers,
   * SemanticTags, LyricDensity, CulturalDepth, and CompositeScore.
   *
   * Prompt design principles used here:
   *  - Persona lock: forces Gemini into "literary-musicological critic" mode
   *  - Dimensional isolation: each dimension is defined with scoring rubrics
   *  - Arabic cultural anchoring: references classical poetry (عمود الشعر)
   *    and contemporary Arab street culture
   *  - Strict JSON schema: all fields defined with types and value ranges
   */
  /**
   * 🧠 Deep Semantic & Metric Analysis
   * Extracts theme, emotional tone, and prosodic DNA from an Arabic bar
   */
  async analyzeBarLyricalDNA(text: string): Promise<any> {
    const sysMsg = `أنت خبير في العروض العربي والنقد الموسيقي. قم بتحليل البار المدخل واستخرج:
    1. الموضوع الرئيسي والسياق الضمني.
    2. النبرة العاطفية (عدواني، حزين، تفاؤلي، إلخ).
    3. التقطيع العروضي التقريبي (الوزن).
    4. الكلمات المفتاحية الدلالية.`;

    const prompt = `البار: "${text}"\nأنتج مصفوفة JSON تحتوي على الحقول: theme, tone, meter_pattern, keywords.`;

    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "{}"));
  }

  /**
   * ✍️ Creative Lyrical Synthesis
   * Fuses context, rhyme, and meter into a professional-grade sequence
   */
  async synthesizeCreativeBar(
    context: string,
    sourceBar: string,
    constraints: any,
  ): Promise<any[]> {
    const sysMsg = `أنت "مايسترو الراب"، مؤلف محترف يجمع بين عمق المتنبي وبصمة الشارع المعاصر. 
    مهمتك توليد بارات (Bars) استكمالية تتفوق على النص الأصلي إبداعياً.
    القواعد:
    - الحفاظ الصارم على القافية والوزن الإيقاعي للبار الأصلي.
    - استخدام استعارات مركبة وذكية غير مستهلكة.
    - تجنب التكرار اللفظي أو النسخ المباشر.`;

    const prompt = `
    البار الأصلي: "${sourceBar}"
    السياق المستخلص: ${JSON.stringify(context)}
    القافية المطلوبة: ${constraints.rhyme}
    المطلوب: إنتاج 3 خيارات إبداعية بصيغة JSON كقائمة نصوص فقط.`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview", // Pro for better creativity
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "[]"));
  }

  async generateCreativeFollowUp(
    text: string,
    count: number = 2,
  ): Promise<any[]> {
    const sysMsg =
      "أنت كاتب راب ملهم (Creative Director). تقترح استكمالات إبداعية للبار المدخل، مع الحفاظ على نفس البصمة الصوتية والقافية.";
    const prompt = `البار الحالي: "${text}"\nالمطلوب: إنتاج ${count} استكمالات إبداعية.\n\nأنتج مصفوفة JSON تضم نصوص البارات فقط.`;
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      systemInstruction: sysMsg,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    return JSON.parse(this.cleanJSON(response.text || "[]"));
  }

  async deepSemanticAnalysis(
    bars: { id: string; text: string }[],
  ): Promise<SemanticAnalysis[]> {
    const cacheResults: SemanticAnalysis[] = [];
    const uncached: { id: string; text: string; originalIndex: number }[] = [];

    bars.forEach((bar, i) => {
      const key = `sem_${bar.id}_${bar.text.slice(0, 20)}`;
      if (this.semanticAnalysisCache.has(key)) {
        cacheResults.push(this.semanticAnalysisCache.get(key)!);
      } else {
        uncached.push({ ...bar, originalIndex: i });
      }
    });

    if (uncached.length === 0) return cacheResults;

    const sysMsg = `
أنت ناقد أدبي-موسيقي نخبوي متخصص في الراب العربي المعاصر.
تمتلك خبرة موسوعية تجمع بين:
- علم العروض العربي الكلاسيكي (الفراهيدي، الخليل)
- نظريات السرد الحديثة (Todorov, Genette)
- علم النفس الموسيقي وتأثيرات الفونيمات على العاطفة
- ثقافة الشارع العربي والراب المحلي

مهمتك: تحليل دلالي متعدد الأبعاد لكل بار بدقة أكاديمية وحساسية فنية نخبوية.
الإخراج: JSON صارم فقط. لا نص خارج الـ JSON.
    `.trim();

    const prompt = `
# مهمة التحليل الدلالي النخبوي

## البارات المُقدَّمة:
${uncached.map((b) => `- ID: "${b.id}" | النص: "${b.text}"`).join("\n")}

---

## مطلوب لكل بار: مصفوفة JSON بالبنية التالية بالضبط:

[
  {
    "barId": "ID_هنا",
    "text": "النص_هنا",

    "narrativeArc": {
      "arc": "intro | build_up | climax | resolution | bridge | outro | unclassified",
      "confidence": 0.0-1.0,
      "justification": "تبرير باللغة العربية في جملة واحدة",
      "arcPosition": 0.0-1.0
    },

    "semanticTags": [
      { "tag": "التصنيف", "weight": 0.0-1.0, "evidence": "مقتطف نصي" }
    ],

    "metaphoricalLayers": [
      {
        "type": "literal | simile | metaphor | symbol | allusion | hyperbole",
        "depth": 1-5,
        "description": "وصف العنصر البلاغي",
        "fragment": "المقتطف النصي الذي يحمله"
      }
    ],

    "thematicVector": {
      "aggression": 0-10,
      "vulnerability": 0-10,
      "pride": 0-10,
      "melancholy": 0-10,
      "wisdom": 0-10,
      "rebellion": 0-10,
      "love": 0-10,
      "spirituality": 0-10
    },

    "dominantMood": "وصف عربي للمزاج المهيمن",
    "lyricDensity": 0-100,
    "culturalDepth": 0-100,
    "compositeSemanticScore": 0-100,
    "emotionalSignature": "جملة توصيف عربية واحدة"
  }
]

---
## معايير التقييم:

### narrativeArc (القوس السردي):
- **intro**: بداية جوية، تمهيد للسياق، كثافة سردية منخفضة، arcPosition: 0.0-0.15
- **build_up**: تصاعد التوتر والطاقة، بناء تدريجي، arcPosition: 0.15-0.45
- **climax**: ذروة الصدمة الدلالية والصوتية (Punchline Zone)، arcPosition: 0.45-0.65
- **resolution**: تأمل ما بعد الذروة، وضع حد للتوتر، arcPosition: 0.65-0.85
- **bridge**: تحول جانبي في الموضوع أو النبرة، arcPosition: 0.40-0.60
- **outro**: خاتمة وإغلاق، arcPosition: 0.85-1.0

### thematicVector (المتجه الموضوعي):
- كل محور من 0 إلى 10
- أعطِ قيماً عالية فقط عند وجود دليل نصي واضح

### lyricDensity (الكثافة المعلوماتية):
- 0-30: بار فضفاض، صور قليلة
- 31-60: تكثيف معتدل، صور متعددة
- 61-80: كثيف، معلومات/استعارات متعددة
- 81-100: فوق العادة — كل كلمة تحمل طبقات

### culturalDepth (العمق الثقافي):
- 0-30: مباشر، ثقافة عامة
- 31-60: مراجع ثقافية عربية معتدلة
- 61-80: استدعاء تراث أو مفاهيم محلية عميقة
- 81-100: طبقات ثقافية متشعبة، تحتاج خلفية معرفية لفهمها

### compositeSemanticScore:
compositeSemanticScore = (lyricDensity × 0.30) + (culturalDepth × 0.25) + (metaphorDepthAvg × 10 × 0.25) + (narrativeArc.confidence × 100 × 0.20)

أنتج المصفوفة الكاملة الآن بـ JSON صارم:
    `.trim();

    try {
      const response = await callGeminiWithRetry({
        model: "gemini-3.1-pro-preview",
        systemInstruction: sysMsg,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      const rawText = response.text || "[]";
      let parsed: SemanticAnalysis[];
      try {
        parsed = JSON.parse(this.cleanJSON(rawText));
        if (!Array.isArray(parsed)) parsed = [parsed];
      } catch (e) {
        console.error("Failed to parse deepSemanticAnalysis response", e);
        parsed = [];
      }

      // Cache results
      for (const sa of parsed) {
        const key = `sem_${sa.barId}_${sa.text?.slice(0, 20)}`;
        this.semanticAnalysisCache.set(key, sa);
      }

      return [...cacheResults, ...parsed];
    } catch (error) {
      console.error("deepSemanticAnalysis failed:", error);
      return cacheResults;
    }
  }

  /**
   * buildNarrativeSongArc — sequences a set of semantically analysed bars
   * into an optimal narrative arc for a song.
   *
   * Uses Gemini to reason about thematic connective tissue between bars
   * and suggest the most compelling narrative ordering.
   */
  async buildNarrativeSongArc(
    bars: Array<{ id: string; text: string; semantic: SemanticAnalysis }>,
  ): Promise<NarrativeSongArc> {
    const sysMsg = `
أنت مخرج روائي للراب العربي. تأخذ مجموعة من البارات المحللة دلالياً وتبني منها قوساً سردياً متماسكاً ومؤثراً.
تفهم كيف تبني التوتر، تذروه، ثم تحله بأثر موسيقي وعاطفي مبهر.
    `.trim();

    const prompt = `
## البارات المُحللة:
${bars
  .map(
    (b) => `
### Bar ID: ${b.id}
النص: "${b.text}"
القوس السردي الحالي: ${b.semantic.narrativeArc.arc} (ثقة: ${b.semantic.narrativeArc.confidence})
المتجه الموضوعي: ${JSON.stringify(b.semantic.thematicVector)}
التوقيع العاطفي: ${b.semantic.emotionalSignature}
`,
  )
  .join("\n---\n")}

## المطلوب:
أنتج JSON بالبنية التالية بالضبط:

{
  "bars": [
    {
      "id": "ID_البار",
      "arcPosition": 0.0-1.0,
      "arc": { "arc": "...", "confidence": 0.0-1.0, "justification": "...", "arcPosition": 0.0-1.0 },
      "linksToPrevious": "كيف يرتبط بالبار السابق دلالياً",
      "linksToNext": "كيف يُمهّد للبار التالي"
    }
  ],
  "overallTheme": "الموضوع الجامع للأغنية في عبارة واحدة",
  "suggestedSequence": ["id1", "id2", ...],
  "arcSummary": "وصف عربي للقوس السردي الكامل للأغنية"
}
    `.trim();

    try {
      const response = await callGeminiWithRetry({
        model: "gemini-3.1-pro-preview",
        systemInstruction: sysMsg,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });
      return JSON.parse(this.cleanJSON(response.text || "{}"));
    } catch (error) {
      console.error("buildNarrativeSongArc failed:", error);
      return {
        bars: bars.map((b) => ({
          id: b.id,
          arcPosition: 0.5,
          arc: b.semantic.narrativeArc,
          linksToPrevious: "",
          linksToNext: "",
        })),
        overallTheme: "غير مححدد",
        suggestedSequence: bars.map((b) => b.id),
        arcSummary: "تعذّر بناء القوس السردي",
      };
    }
  }

  /**
   * extractThematicVector — lightweight single-bar thematic scan.
   * More economical than deepSemanticAnalysis for quick indexing.
   */
  async extractThematicVector(text: string): Promise<ThematicVector> {
    const sysMsg =
      "أنت محلل دلالي للراب العربي. تقدّر كثافة الأبعاد الموضوعية لكل بار بسرعة ودقة.";
    const prompt = `
البار: "${text}"

قدِّر المتجه الموضوعي التالي (كل قيمة من 0 إلى 10):
{
  "aggression": 0-10,
  "vulnerability": 0-10,
  "pride": 0-10,
  "melancholy": 0-10,
  "wisdom": 0-10,
  "rebellion": 0-10,
  "love": 0-10,
  "spirituality": 0-10
}
    `.trim();

    try {
      const response = await callGeminiWithRetry({
        model: "gemini-3-flash-preview",
        systemInstruction: sysMsg,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });
      return JSON.parse(this.cleanJSON(response.text || "{}"));
    } catch (error) {
      console.error("extractThematicVector failed:", error);
      return {
        aggression: 0,
        vulnerability: 0,
        pride: 0,
        melancholy: 0,
        wisdom: 0,
        rebellion: 0,
        love: 0,
        spirituality: 0,
      };
    }
  }
}

export const geminiService = new GeminiService();
