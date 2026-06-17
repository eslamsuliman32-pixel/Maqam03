import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// Robust API Key retrieval on server
const getGeminiApiKey = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_KEY_01
  ];

  const placeholders = [
    "AIzaSyA4bWmRml-sSFEKWJRAoCKJG2nugZJjmOI",
    "AIzaSyDAdU1Eb6herKrGsc0XuqYbTxaBcX6aYyE",
    "AIzaSyAc0RmbZw0jW-dxSKYH3fmEaqdRrCtMO9E",
    "MY_GEMINI_API_KEY",
    "YOUR_GEMINI_API_KEY"
  ];

  for (const k of keys) {
    if (k && k.trim() && !placeholders.includes(k.trim())) {
      const trimmed = k.trim();
      console.log(`[getGeminiApiKey] Using loaded key starting with ${trimmed.slice(0, 7)}...`);
      return trimmed;
    }
  }
  console.warn("[getGeminiApiKey] No valid non-placeholder API key found among configured environment variables.");
  return "";
};

// Phonetic to Rhythmic Matrix Engine API
router.post("/phonetic-matrix", (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text string is required for processing." });
    }

    const analysis = {}; // placeholder
    return res.json({ success: true, analysis });
  } catch (error) {
    console.error("Phonetic Engine Error:", error);
    return res.status(500).json({ error: "Failed to process text" });
  }
});

// Rhyme Engine API
router.post("/rhyme", (req, res) => {
  // Logic to interact with the Python/Phonetics engine will go here
  res.json({ message: "Rhyme processing endpoint hit", data: req.body });
});

// Rhythm Analysis API
router.post("/rhythm", (req, res) => {
  // Logic for audio beat analysis will go here
  res.json({ message: "Rhythm analysis endpoint hit", data: req.body });
});

// Scoring and Semantics API
router.post("/scoring", (req, res) => {
  res.json({ message: "Scoring endpoint hit", data: req.body });
});

// ────────────────────────────────────────────────────────────────
// 🔹 STACCATO FLOW SYSTEM - GEMINI SERVER-SIDE ENDPOINTS
// ────────────────────────────────────────────────────────────────

router.post("/flow-ai/analyze", async (req, res) => {
  try {
    const { bars, currentPattern } = req.body;
    if (!bars || !Array.isArray(bars)) {
      return res.status(400).json({ error: "Invalid bars payload." });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "No Gemini key available on server." });
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const barsText = bars
      .map((b: any, i: number) => `البار ${i + 1}: "${b.content || ""}" (${b.syllableCount || 0} مقطع)`)
      .join("\n");

    const prompt = `
أنت محلل راب عربي متخصص في مدرسة "MAQAM RAP".
حلّل هذه البارات بدقة عالية:

${barsText}

النمط المختار: ${currentPattern || "AAAA"}

قيّم وأعد JSON فقط بهذه البنية الدقيقة:
{
  "score": <رقم من 0 إلى 100>,
  "detectedPattern": "<AAAA|AABB|ABAB|ABBA|STACCATO|PHONETIC_BEND|FREE_FLOW|TRIPLET>",
  "rhymingPairs": [["كلمة1", "كلمة2", <نقطة_تطابق_0_إلى_1>]],
  "weakBars": [<أرقام_البارات_الضعيفة مثل ["bar-id"] أو أرقام كمؤشرات>],
  "suggestions": ["اقتراح1", "اقتراح2", "اقتراح3"],
  "phoneticBends": ["كلمة_مختلطة1"],
  "overallQuality": "<excellent|good|average|weak>"
}

معايير التقييم:
- تطابق القافية الصوتية (50%)
- انتظام عدد المقاطع (30%)
- وجود انثناء صوتي (20%)
أعد JSON فقط بدون أي علامات ماركداون أو لغويات زائدة خارج الكائن البنيوي.
    `.trim();

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "{}";
    return res.json({ result: text });
  } catch (error: any) {
    console.error("Flow AI Analyze Error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze flow pattern." });
  }
});

router.post("/flow-ai/suggest", async (req, res) => {
  try {
    const { anchorWord, pattern, context, count } = req.body;
    if (!anchorWord) {
      return res.status(400).json({ error: "anchorWord is required." });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "No Gemini key available on server." });
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const prompt = `
أنت مساعد كتابة راب عربي متخصص.
الكلمة المرساة: "${anchorWord}"
النمط: ${pattern || "AAAA"}
السياق: "${context || "رأس جاف، راب إيقاعي حاد"}"

أقترح ${count || 8} كلمات تُقافي "${anchorWord}" بدرجات متفاوتة:
- 3 كلمات قافية تامة
- 3 كلمات سجع جزئي
- 2 كلمات انثناء صوتي (عربي-إنجليزي)

أعد مصفوفة JSON فقط بالشكل التالي: ["كلمة1", "كلمة2", ...]
بدون أي علامات أو سطور توضيحية.
    `.trim();

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "[]";
    return res.json({ result: text });
  } catch (error: any) {
    console.error("Flow AI Suggestion Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate suggestions." });
  }
});

router.post("/flow-ai/complete", async (req, res) => {
  try {
    const { partialContent, anchorWord, pattern, previousBars } = req.body;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "No Gemini key available on server." });
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const context = Array.isArray(previousBars) ? previousBars.slice(-2).join(" | ") : "";

    const prompt = `
أنت مؤلف راب عربي محترف. أكمل هذا المصراع الناقص:

المصراع الناقص: "${partialContent || ""}..."
الكلمة المرساة للقافية: "${anchorWord || ""}"
النمط: ${pattern || "AAAA"}
البارات السابقة: ${context || "لا يوجد"}

اكتب إكمالاً واحداً فقط للمصراع يتوافق مع:
1. نفس عدد المقاطع الصوتية (8-12 مقطع)
2. القافية على "${anchorWord}"
3. نفس مستوى الطاقة والمزاج

أعد النص المكتمل فقط بدون شرح أو علامات اقتباس.
    `.trim();

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    return res.json({ result: text });
  } catch (error: any) {
    console.error("Flow AI Complete Bar Error:", error);
    return res.status(500).json({ error: error.message || "Failed to complete bar." });
  }
});

export default router;

