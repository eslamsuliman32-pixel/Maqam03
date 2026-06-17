import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════
// PHONETIC ANALYSIS ENGINE — Arabic/Multilingual Flow Engineering
// ═══════════════════════════════════════════════════════════════

/** استخراج الجذر الصوتي من النهاية (للقافية) */
function extractRhymeCore(text: string): string {
  const cleaned = text.trim().replace(/[،.!؟]/g, "");
  const words = cleaned.split(/\s+/);
  const lastWord = words[words.length - 1] || "";
  // استخراج آخر 2-3 حروف كجوهر قافية
  return lastWord.slice(-3).toLowerCase();
}

/** حساب التشابه الصوتي بين نصين (Phonetic Jaccard) */
function phoneticSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  const setA = new Set(a.replace(/\s+/g, "").split(""));
  const setB = new Set(b.replace(/\s+/g, "").split(""));

  const intersection = new Set([...setA].filter((c) => setB.has(c)));
  const union = new Set([...setA, ...setB]);

  const jaccard = intersection.size / union.size;

  // مكافأة إضافية إذا تطابقت نهايات الكلمتين (قافية)
  const rhymeBonus = extractRhymeCore(a) === extractRhymeCore(b) ? 0.35 : 0;

  return Math.min(1, jaccard + rhymeBonus);
}

/** تصنيف الثقل الصوتي بناءً على عدد الحروف الثقيلة */
function classifyPhoneticWeight(text: string): "light" | "medium" | "heavy" {
  const heavyChars = /[قطضصغخ]/g;
  const heavyCount = (text.match(heavyChars) || []).length;
  const ratio = heavyCount / Math.max(1, text.replace(/\s/g, "").length);
  if (ratio > 0.25) return "heavy";
  if (ratio > 0.1) return "medium";
  return "light";
}

/** تقدير عدد المورات (وحدات الإيقاع) */
function estimateMoraCount(text: string): number {
  const withoutDiacritics = text.replace(/[\u064B-\u065F]/g, "");
  const syllables = withoutDiacritics.replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(syllables * 0.6));
}

/** حساب الكثافة الدلالية (semantic density) من خصائص النص */
function computeSemanticDensity(text: string, theme: string): number {
  if (!text || text.trim().length < 2) return 0;

  const themeKeywords: Record<string, string[]> = {
    betrayal: [
      "خيانة",
      "غدر",
      "كذب",
      "وعد",
      "ضيعت",
      "باع",
      "خذل",
      "يوم",
      "ولّى",
    ],
    isolation: [
      "وحدة",
      "بعيد",
      "صمت",
      "ظلام",
      "خوف",
      "زحمة",
      "غريب",
      "ما فيش",
      "فارغ",
    ],
    loss: ["فقد", "رحل", "مات", "غاب", "بعد", "نسيت", "خسرت", "ضاع", "تركت"],
    general: [],
  };

  const keywords = themeKeywords[theme] || [];
  if (keywords.length === 0) {
    // للـ general: كثافة بناءً على طول النص فقط
    return Math.min(1, text.trim().length / 40);
  }

  const hits = keywords.filter((kw) => text.includes(kw)).length;
  const baseScore = Math.min(1, text.trim().length / 40) * 0.4;
  const themeScore = Math.min(0.6, (hits / keywords.length) * 1.5);

  return baseScore + themeScore;
}

// ═══════════════════════════════════════════════════════════════
// STORE TYPES
// ═══════════════════════════════════════════════════════════════

export type LinkType = "rhyme" | "semantic" | "phonetic-echo" | "thematic";

export interface SemanticNode {
  id: string;
  word: string;
  gridPosition: number;
  semanticScore: number;
  phoneticWeight: "light" | "medium" | "heavy";
  moraCount: number;
  rhymeCore: string;
  theme: string;
  timestamp: number;
}

export interface SemanticLink {
  sourceId: string;
  targetId: string;
  strength: number;
  type: LinkType;
}

export interface FlowDiagnostics {
  totalNodes: number;
  totalLinks: number;
  averageSemanticDensity: number;
  rhymeDensity: number; // % من الـ nodes التي لها رابط قافية
  thematicCohesion: number; // 0-1: مدى تماسك الموضوع
  dominantLinkType: LinkType | null;
  weakNodes: string[]; // IDs للعقد ذات الكثافة المنخفضة
}

interface FlowEngineeringState {
  nodes: SemanticNode[];
  links: SemanticLink[];
  theme: string;
  diagnostics: FlowDiagnostics;

  setTheme: (theme: string) => void;
  addNode: (node: SemanticNode) => void;
  addLink: (link: SemanticLink) => void;
  clearGraph: () => void;
  analyzeFlow: (text: string, gridPosition: number) => Promise<void>;
  recomputeDiagnostics: () => void;
  pruneWeakLinks: (threshold?: number) => void;
  highlightRhymeChain: (nodeId: string) => SemanticLink[];
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS COMPUTER
// ═══════════════════════════════════════════════════════════════

function computeDiagnostics(
  nodes: SemanticNode[],
  links: SemanticLink[],
): FlowDiagnostics {
  if (nodes.length === 0) {
    return {
      totalNodes: 0,
      totalLinks: 0,
      averageSemanticDensity: 0,
      rhymeDensity: 0,
      thematicCohesion: 0,
      dominantLinkType: null,
      weakNodes: [],
    };
  }

  const avgDensity =
    nodes.reduce((sum, n) => sum + n.semanticScore, 0) / nodes.length;

  const rhymeLinkedNodeIds = new Set(
    links
      .filter((l) => l.type === "rhyme")
      .flatMap((l) => [l.sourceId, l.targetId]),
  );
  const rhymeDensity = rhymeLinkedNodeIds.size / nodes.length;

  // Thematic cohesion: كم نسبة الـ nodes التي تشترك في نفس الـ theme
  const themeCounts = nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.theme] = (acc[n.theme] || 0) + 1;
    return acc;
  }, {});
  const maxThemeCount = Math.max(...Object.values(themeCounts));
  const thematicCohesion = maxThemeCount / nodes.length;

  // النوع السائد للروابط
  const typeCounts = links.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});
  const dominantLinkType =
    (Object.entries(typeCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] as LinkType) ?? null;

  const weakNodes = nodes.filter((n) => n.semanticScore < 0.3).map((n) => n.id);

  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    averageSemanticDensity: avgDensity,
    rhymeDensity,
    thematicCohesion,
    dominantLinkType,
    weakNodes,
  };
}

// ═══════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════

const EMPTY_DIAGNOSTICS: FlowDiagnostics = {
  totalNodes: 0,
  totalLinks: 0,
  averageSemanticDensity: 0,
  rhymeDensity: 0,
  thematicCohesion: 0,
  dominantLinkType: null,
  weakNodes: [],
};

export const useFlowEngineeringStore = create<FlowEngineeringState>(
  (set, get) => ({
    nodes: [],
    links: [],
    theme: "general",
    diagnostics: EMPTY_DIAGNOSTICS,

    setTheme: (theme) => {
      set({ theme });
      // إعادة تقييم الكثافة الدلالية عند تغيير الموضوع
      set((state) => {
        const updatedNodes = state.nodes.map((n) => ({
          ...n,
          semanticScore: computeSemanticDensity(n.word, theme),
          theme,
        }));
        return {
          nodes: updatedNodes,
          diagnostics: computeDiagnostics(updatedNodes, state.links),
        };
      });
    },

    addNode: (node) =>
      set((state) => {
        const nodes = [...state.nodes, node];
        return { nodes, diagnostics: computeDiagnostics(nodes, state.links) };
      }),

    addLink: (link) =>
      set((state) => {
        const links = [...state.links, link];
        return { links, diagnostics: computeDiagnostics(state.nodes, links) };
      }),

    clearGraph: () =>
      set({ nodes: [], links: [], diagnostics: EMPTY_DIAGNOSTICS }),

    // ─────────────────────────────────────────────────────────
    // CORE: analyzeFlow — المحرك الحقيقي للتحليل
    // ─────────────────────────────────────────────────────────
    analyzeFlow: async (text: string, gridPosition: number) => {
      const state = get();

      if (!text || text.trim().length < 2) return;

      const rhymeCore = extractRhymeCore(text);
      const semanticScore = computeSemanticDensity(text, state.theme);
      const phoneticWeight = classifyPhoneticWeight(text);
      const moraCount = estimateMoraCount(text);

      // استبدال node موجود في نفس الـ gridPosition (لا تكرار)
      const existingIndex = state.nodes.findIndex(
        (n) => n.gridPosition === gridPosition,
      );

      const newNode: SemanticNode = {
        id:
          existingIndex !== -1
            ? state.nodes[existingIndex].id
            : (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
        word: text,
        gridPosition,
        semanticScore,
        phoneticWeight,
        moraCount,
        rhymeCore,
        theme: state.theme,
        timestamp: Date.now(),
      };

      const baseNodes =
        existingIndex !== -1
          ? state.nodes.map((n, i) => (i === existingIndex ? newNode : n))
          : [...state.nodes, newNode];

      // ── بناء الروابط الذكية ──────────────────────────────
      const newLinks: SemanticLink[] = [];
      const existingLinks = state.links.filter(
        (l) => l.sourceId !== newNode.id && l.targetId !== newNode.id,
      );

      for (const node of baseNodes) {
        if (node.id === newNode.id) continue;

        // 1. رابط القافية (أقوى نوع)
        if (rhymeCore.length >= 2 && node.rhymeCore === rhymeCore) {
          newLinks.push({
            sourceId: node.id,
            targetId: newNode.id,
            strength: 0.9,
            type: "rhyme",
          });
          continue; // لا نضيف روابط أخرى إذا وجدت قافية
        }

        // 2. رابط صوتي (phonetic echo)
        const phonSim = phoneticSimilarity(node.word, text);
        if (phonSim > 0.55) {
          newLinks.push({
            sourceId: node.id,
            targetId: newNode.id,
            strength: phonSim,
            type: "phonetic-echo",
          });
          continue;
        }

        // 3. رابط دلالي-موضوعي
        if (
          semanticScore > 0.5 &&
          node.semanticScore > 0.5 &&
          node.theme === state.theme
        ) {
          const strength = (semanticScore + node.semanticScore) / 2;
          newLinks.push({
            sourceId: node.id,
            targetId: newNode.id,
            strength,
            type: "semantic",
          });
        }
      }

      const allLinks = [...existingLinks, ...newLinks];
      const diagnostics = computeDiagnostics(baseNodes, allLinks);

      set({ nodes: baseNodes, links: allLinks, diagnostics });
    },

    // ─────────────────────────────────────────────────────────
    recomputeDiagnostics: () => {
      const { nodes, links } = get();
      set({ diagnostics: computeDiagnostics(nodes, links) });
    },

    // حذف الروابط الضعيفة تحت عتبة معينة
    pruneWeakLinks: (threshold = 0.4) => {
      set((state) => {
        const links = state.links.filter((l) => l.strength >= threshold);
        return { links, diagnostics: computeDiagnostics(state.nodes, links) };
      });
    },

    // إرجاع سلسلة القوافي الكاملة لعقدة معينة
    highlightRhymeChain: (nodeId: string) => {
      const { links } = get();
      return links.filter(
        (l) =>
          l.type === "rhyme" &&
          (l.sourceId === nodeId || l.targetId === nodeId),
      );
    },
  }),
);
