/**
 * MAQAM v2.0
 * Elite Arabic Rap Production Platform
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Music,
  Settings,
  Cpu,
  Cloud,
  Terminal,
  Activity,
  Layers,
  Upload,
  Hash,
  CheckCircle2,
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Folder,
  PenTool,
  ChevronRight,
  Sparkles,
  Database,
  Zap,
  Maximize2,
  Play,
  Pause,
  AudioWaveform,
  Star,
  Trash2,
  Loader2,
  BookOpen,
  Send,
  Save,
  RefreshCw,
  BrainCircuit,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import WaveSurfer from "wavesurfer.js";

// Services
import { analyzeAudioFile } from "./services/audioAnalysisEngine";
import { moraEngine } from "./services/moraEngine";
import { geminiService } from "./services/geminiService";
import { accentScanner } from "./services/accentScanner";

// Components
import { AudioUploader } from "./components/AudioUploader";
import { BeatBlueprintEngine } from "./components/BeatBlueprintEngine";
import { MoraMatrix } from "./components/MoraMatrix";
import { BarCard } from "./components/BarCard";
import { RhythmicMatrix } from "./components/RhythmicMatrix";
import { ChatAssistant } from "./components/ChatAssistant";
import { BatchImportModal } from "./components/BatchImportModal";
import { RapAcademy } from "./components/NewRapAcademy";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { ProjectsManager } from "./components/ProjectsManager";
import { RuntimeMonitor } from "./components/RuntimeMonitor";
import MaqamWorkshopPage from "./pages/MaqamWorkshopPage";
import { BarRepositoryDisplay } from "./components/BarRepositoryDisplay";
import MaqamEngine from "./MaqamEngine";
import { FlowMethodologyHub } from "./components/FlowMethodologyHub";
import { SonicFingerprintPanel } from "./components/sonic/SonicFingerprintPanel";

// Store
import { useRepositoryStore, Bar as BarType } from "./store/repositoryStore";
import { useEditorStore } from "./store/editorStore";
import { useAccentStore } from "./store/accentStore";
import { useRapEngineStore } from "./store/useRapEngineStore";
import { forceCloudSync } from "./services/firebaseSync";

type Tab =
  | "dashboard"
  | "beat"
  | "repository"
  | "projects"
  | "engineering_workshop"
  | "rap_academy2"
  | "maqam"
  | "flow_methodology"
  | "sonic_fingerprint";

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(8, 8, 16, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#D4A017";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-10 z-0"
    />
  );
};

import { useSyncStatus } from "./hooks/useSyncStatus";

const SyncIndicator = () => {
  const syncInfo = useSyncStatus();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface/50 border border-white/5 rounded-full backdrop-blur-md">
      <div
        className={`w-2 h-2 rounded-full ${
          syncInfo.status === "syncing"
            ? "bg-blue-400 animate-pulse"
            : syncInfo.status === "error"
              ? "bg-red-400"
              : "bg-green-400"
        }`}
      />
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
        {syncInfo.status === "syncing"
          ? "مزامنة السحابة..."
          : syncInfo.status === "error"
            ? "خطأ في المزامنة"
            : "محمي هاردوير"}
      </span>
    </div>
  );
};

const NavButton = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.1, y: -2 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`relative flex flex-col items-center gap-1.5 transition-all duration-500 group flex-1 lg:flex-initial ${active ? "text-gold-400" : "text-text-muted hover:text-text-primary"}`}
  >
    {active && (
      <motion.div
        layoutId="nav-active"
        className="absolute -top-1 lg:top-1/2 lg:-right-4 lg:-translate-y-1/2 w-8 lg:w-1 h-1 lg:h-8 bg-gold-400 rounded-full shadow-[0_0_15px_rgba(212,160,23,0.5)]"
      />
    )}
    <div
      className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? "bg-gold-400/20 border border-gold-400/40 shadow-[0_0_20px_rgba(212,160,23,0.1)]" : "bg-bg-base/30 border border-white/5 group-hover:border-white/10"}`}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: "w-5 h-5 lg:w-6 h-6",
      })}
    </div>
    <span
      className={`text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.1em] lg:tracking-[0.2em] transition-all duration-500 ${active ? "opacity-100" : "hidden lg:block lg:opacity-0 group-hover:opacity-100"}`}
    >
      {label}
    </span>
  </motion.button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("beat");
  const { currentBarText, setCurrentBarText, beatBlueprint, setBeatBlueprint } =
    useEditorStore();
  const { setBlueprint: setRapBlueprint } = useRapEngineStore();
  const [moraProfile, setMoraProfile] = useState<any>(null);
  const [isAnalyzingBar, setIsAnalyzingBar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [groupMode, setGroupMode] = useState<
    | "none"
    | "rhythm"
    | "rhyme"
    | "family"
    | "ai"
    | "rhythm_rhyme"
    | "mora_rhyme"
    | "family_rhythm"
    | "slantRhyme"
    | "flexible_rhythm"
    | "vibe_match"
    | "emotion"
    | "phoneticTrait"
  >("none");
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    | "newest"
    | "sonicWeight"
    | "rhythmicWeight"
    | "corePhoneme"
    | "moraCount"
    | "serialNumber"
    | "accent_foot"
  >("newest");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [footFilter, setFootFilter] = useState<string>("all");
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [barToDelete, setBarToDelete] = useState<BarType | null>(null);
  const [isRefreshingRepo, setIsRefreshingRepo] = useState(false);
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);
  const [minMetaphoricalDepth, setMinMetaphoricalDepth] = useState<number>(0);
  const [narrativeArcFilter, setNarrativeArcFilter] = useState<string>("all");
  const [minResonanceDensity, setMinResonanceDensity] = useState<number>(0);

  useEffect(() => {
    const handleExportToWorkshop = (e: any) => {
      // Just navigates to rap_academy2
      setActiveTab("rap_academy2");
    };
    window.addEventListener("export-to-workshop", handleExportToWorkshop);
    return () =>
      window.removeEventListener("export-to-workshop", handleExportToWorkshop);
  }, []);

  const handleRefreshRepository = async () => {
    setIsRefreshingRepo(true);
    try {
      const { pullFromCloud } = await import("./services/firebaseSync");
      await pullFromCloud("maqam", "maqam-repository-storage");
      await useRepositoryStore.persist.rehydrate();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsRefreshingRepo(false), 800);
  };

  const handleDirectSync = async () => {
    setIsSyncingDirect(true);
    try {
      await forceCloudSync();
      await useRepositoryStore.persist.rehydrate();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setIsSyncingDirect(false), 800);
  };

  const handleFindSimilar = (id: string) => {
    const targetBar = bars.find((b) => b.id === id);
    if (!targetBar) return;

    // Multi-factor similarity search using advanced tokens
    const phoneme =
      targetBar.corePhoneme || moraEngine.extractCorePhoneme(targetBar.text);
    const weight = targetBar.rhythmicWeight || 0;
    const stress = accentScanner.scan(targetBar.text).join("").substring(0, 4); // Use first 4 bits for broad match

    // Composite query that our new store logic can parse
    const sq = `phoneme:${phoneme} stress:${stress} weight:${weight}`;

    setSearchQuery(sq);
  };

  const {
    bars,
    addBar,
    deleteBar,
    toggleFavorite,
    updateBatch,
    selectedBars,
    toggleSelection,
    clearSelection,
    stressFilter,
    setStressFilter,
    rhymeFilter,
    setRhymeFilter,
    twoFactorFilter,
    threeFactorFilter,
  } = useRepositoryStore();

  const handleDeleteRequest = (bar: BarType) => {
    setBarToDelete(bar);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (barToDelete) {
      deleteBar(barToDelete.id);
      setDeleteConfirmOpen(false);
      setBarToDelete(null);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStressFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStressFilter(e.target.value);
  };

  const handleBarClick = (bar: BarType) => {
    toggleSelection(bar.id);
  };

  const handleAnalyzeBar = async () => {
    if (!currentBarText.trim()) return;
    setIsAnalyzingBar(true);
    try {
      const profile = await geminiService.analyzeBars(
        [currentBarText],
        "trap",
        90,
        "fusha",
      );
      setMoraProfile(profile[0]);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzingBar(false);
    }
  };

  const handleSaveBar = () => {
    if (!currentBarText.trim()) return;

    const newBar: BarType = {
      id: crypto.randomUUID(),
      serialNumber: "", // will be set by store
      text: currentBarText,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      tags: [],
      ...moraProfile,
    };

    addBar(newBar);
    setCurrentBarText("");
    setMoraProfile(null);
    setActiveTab("repository");
  };

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentBarText;

    const newText = text.substring(0, start) + `[${tag}]` + text.substring(end);
    setCurrentBarText(newText);

    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      const targetIndex = start + tag.length + 2;
      textarea.setSelectionRange(targetIndex, targetIndex);
    }, 0);
  };

  const handleInsertSymbol = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentBarText;

    const newText = text.substring(0, start) + symbol + text.substring(end);
    setCurrentBarText(newText);

    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus();
      const targetIndex = start + symbol.length;
      textarea.setSelectionRange(targetIndex, targetIndex);
    }, 0);
  };

  const handleInsertRhyme = (rhyme: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentBarText;

    const newText = text.substring(0, start) + rhyme + text.substring(end);
    setCurrentBarText(newText);

    const targetIndex = start + rhyme.length;
    textarea.setSelectionRange(targetIndex, targetIndex);
  };

  const handleStepClick = (stepIndex: number) => {
    if (!textareaRef.current || !currentBarText) return;
    const totalLength = currentBarText.length;
    const targetIndex = Math.floor((stepIndex / 16) * totalLength);
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(targetIndex, targetIndex);
  };

  const isCategorizingRef = useRef(false);
  const handleSmartCategorize = async () => {
    const barsToCategorize =
      selectedBars.length > 0
        ? bars.filter((b) => selectedBars.includes(b.id))
        : bars;

    if (barsToCategorize.length === 0 || isCategorizingRef.current) return;
    isCategorizingRef.current = true;
    setIsCategorizing(true);
    try {
      const categories = await geminiService.smartCategorize(
        barsToCategorize.map((b) => ({ id: b.id, text: b.text })),
      );
      const updates: { id: string; updates: Partial<BarType> }[] = [];

      Object.entries(categories).forEach(([categoryName, indices]) => {
        if (Array.isArray(indices)) {
          indices.forEach((idx: any) => {
            const bar = barsToCategorize[idx];
            if (bar) {
              const existingTags = bar.tags.filter(
                (t) => !t.startsWith("cat:"),
              );
              updates.push({
                id: bar.id,
                updates: { tags: [...existingTags, `cat:${categoryName}`] },
              });
            }
          });
        }
      });

      updateBatch(updates);
      setGroupMode("ai");
      if (selectedBars.length > 0) clearSelection();
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        console.warn("Categorization request was aborted");
      } else {
        console.error("AI Categorization error:", err);
      }
    } finally {
      isCategorizingRef.current = false;
      setIsCategorizing(false);
    }
  };

  const [isUpdatingEmotions, setIsUpdatingEmotions] = useState(false);
  const handleUpdateEmotions = async () => {
    const barsToUpdate = bars.filter((b) => !b.emotion);
    if (barsToUpdate.length === 0) return;

    setIsUpdatingEmotions(true);
    try {
      // Process in batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < barsToUpdate.length; i += batchSize) {
        const batch = barsToUpdate.slice(i, i + batchSize);
        const analyses = await geminiService.analyzeBars(
          batch.map((b) => b.text),
          "trap",
          90,
          "fusha",
        );

        const updates = batch.map((bar, idx) => ({
          id: bar.id,
          updates: { emotion: analyses[idx]?.emotion || "أخرى" },
        }));

        updateBatch(updates);
      }
    } catch (error) {
      console.error("Failed to update emotions:", error);
    } finally {
      setIsUpdatingEmotions(false);
    }
  };

  // Helper for Levenshtein distance
  const levenshtein = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0),
    );
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const sortedBars = useMemo(() => {
    let filtered = [...bars];

    // Dual/Triple Filtering Logic Implementation
    const activeFilters = {
      emotion: emotionFilter !== "all" ? emotionFilter : null,
      foot: footFilter !== "all" ? footFilter : null,
      stress: stressFilter || null,
      rhyme: rhymeFilter || null,
      minMetaphoricalDepth,
      narrativeArc: narrativeArcFilter !== "all" ? narrativeArcFilter : null,
      minResonanceDensity,
    };

    if (activeFilters.emotion) {
      filtered = filtered.filter((b) => b.emotion === activeFilters.emotion);
    }

    if (activeFilters.foot) {
      filtered = filtered.filter((b) => {
        return (
          accentScanner.classify(accentScanner.scan(b.text)) ===
          activeFilters.foot
        );
      });
    }

    if (activeFilters.rhyme) {
      const target = activeFilters.rhyme.trim();
      filtered = filtered.filter((b) => {
        const rhyme = b.corePhoneme || moraEngine.extractCorePhoneme(b.text);
        if (rhyme.includes(target)) return true;
        // Approximate matching (Levenshtein distance <= 1 for rhymes)
        return levenshtein(rhyme, target) <= 1;
      });
    }

    // تحديث الفلاتر في sortedBars
    if (activeFilters.minMetaphoricalDepth) {
      filtered = filtered.filter(
        (b) => (b.metaphoricalDepth || 0) >= activeFilters.minMetaphoricalDepth,
      );
    }
    if (activeFilters.narrativeArc) {
      filtered = filtered.filter(
        (b) => b.narrativeArc === activeFilters.narrativeArc,
      );
    }
    if (activeFilters.minResonanceDensity) {
      filtered = filtered.filter(
        (b) => (b.overallResonance || 0) >= activeFilters.minResonanceDensity,
      );
    }

    if (activeFilters.stress) {
      const query = activeFilters.stress.replace(/\s+/g, "");
      const isRegex =
        query.includes("[") || query.includes("*") || query.includes(".");

      filtered = filtered.filter((bar) => {
        const code = accentScanner
          .scan(bar.text)
          .join("")
          .replace(/\[/g, "")
          .replace(/\]/g, "");

        if (isRegex) {
          try {
            const regex = new RegExp(query.replace(/\*/g, ".*"));
            return regex.test(code);
          } catch (e) {
            return code.includes(query);
          }
        }

        if (code.includes(query)) return true;

        // Fuzzy match if no direct match and long enough
        if (query.length >= 3) {
          const distance = levenshtein(code, query);
          return distance <= 2;
        }

        return false;
      });
    }

    // Factor Mapping helper
    const getFactorValue = (bar: BarType, factor: string) => {
      switch (factor) {
        case "rhyme":
          return bar.corePhoneme || moraEngine.extractCorePhoneme(bar.text);
        case "stress":
          return accentScanner.scan(bar.text).join("");
        case "mora":
          return bar.totalMorae || 0;
        case "rhythmic":
          return bar.rhythmicWeight || 0;
        case "sonic":
          return bar.sonicWeight || 0;
        default:
          return "";
      }
    };

    // Two-Factor Matching
    if (twoFactorFilter) {
      const { factor1, factor2 } = twoFactorFilter;
      filtered = filtered.filter((bar) => {
        return getFactorValue(bar, factor1) === getFactorValue(bar, factor2);
      });
    }

    // Three-Factor Matching
    if (threeFactorFilter) {
      const { factor1, factor2, factor3 } = threeFactorFilter;
      filtered = filtered.filter((bar) => {
        const val1 = getFactorValue(bar, factor1);
        const val2 = getFactorValue(bar, factor2);
        const val3 = getFactorValue(bar, factor3);
        return val1 === val2 && val2 === val3;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "sonicWeight":
          return (b.sonicWeight || 0) - (a.sonicWeight || 0);
        case "rhythmicWeight":
          return (b.rhythmicWeight || 0) - (a.rhythmicWeight || 0);
        case "corePhoneme":
          const aPhoneme =
            moraEngine.extractCorePhoneme(a.text) || a.corePhoneme || "";
          const bPhoneme =
            moraEngine.extractCorePhoneme(b.text) || b.corePhoneme || "";
          return aPhoneme.localeCompare(bPhoneme, "ar");
        case "moraCount":
          return (b.totalMorae || 0) - (a.totalMorae || 0);
        case "serialNumber":
          return (a.serialNumber || "").localeCompare(b.serialNumber || "");
        case "accent_foot":
          const aFoot = accentScanner.classify(accentScanner.scan(a.text));
          const bFoot = accentScanner.classify(accentScanner.scan(b.text));
          return aFoot.localeCompare(bFoot);
        case "newest":
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
      }
    });
  }, [bars, sortBy, emotionFilter, footFilter, stressFilter, rhymeFilter]);

  const groupedBars = useMemo(() => {
    if (groupMode === "none") return { الكل: sortedBars };

    const groups: Record<string, BarType[]> = {};

    const getFamily = (phoneme: string = "") => {
      if (!phoneme) return "أخرى";
      const lastChar = phoneme.slice(-1);
      if (["ب", "م", "ف", "و"].includes(lastChar)) return "شفوية";
      if (["ت", "د", "ط"].includes(lastChar)) return "نطعية";
      if (["س", "ص", "ز"].includes(lastChar)) return "أسلية";
      if (["ق", "ك"].includes(lastChar)) return "لهوية";
      if (
        ["ع", "ح", "غ", "خ", "هـ", "ه", "ة", "أ", "إ", "آ"].includes(lastChar)
      )
        return "حلقية";
      if (["ل", "ن", "ر"].includes(lastChar)) return "ذلقية";
      if (["ي", "ى", "ا"].includes(lastChar)) return "جوفية";
      if (["ش", "ج", "ي"].includes(lastChar)) return "شجرية";
      if (["ض", "ظ", "ذ", "ث"].includes(lastChar)) return "لثوية/أخرى";
      return "أخرى";
    };

    const getWeightClass = (weight: number = 0) => {
      if (weight <= 3) return "خفيف (1-3)";
      if (weight <= 6) return "متوسط (4-6)";
      if (weight <= 8) return "ثقيل (7-8)";
      return "مزدحم (9-10)";
    };

    sortedBars.forEach((bar) => {
      let key = "أخرى";
      const phoneme =
        moraEngine.extractCorePhoneme(bar.text) || bar.corePhoneme || "";
      const weight = bar.rhythmicWeight || 0;

      if (groupMode === "rhythm") {
        key = `وزن إيقاعي: ${weight}`;
      } else if (groupMode === "rhyme") {
        key = `قافية: ${phoneme}`;
      } else if (groupMode === "family") {
        key = `عائلة: ${getFamily(phoneme)}`;
      } else if (groupMode === "slantRhyme") {
        key = moraEngine.getSlantRhymeGroup(phoneme);
      } else if (groupMode === "emotion") {
        key = `التأثير العاطفي: ${moraEngine.getEmotionalTone(bar.text)}`;
      } else if (groupMode === "phoneticTrait") {
        key = `الطبيعة الصوتية: ${moraEngine.getPhoneticTrait(bar.text)}`;
      } else if (groupMode === "ai") {
        key =
          bar.tags?.find((t) => t.startsWith("cat:"))?.replace("cat:", "") ||
          "غير مصنف ذكياً";
      } else if (groupMode === "rhythm_rhyme") {
        key = `وزن: ${weight} | قافية: ${phoneme}`;
      } else if (groupMode === "mora_rhyme") {
        key = `مورا: ${bar.totalMorae || 0} | قافية: ${phoneme}`;
      } else if (groupMode === "family_rhythm") {
        key = `عائلة: ${getFamily(phoneme)} | وزن: ${weight}`;
      } else if (groupMode === "stress_rhyme") {
        key = `نبر: ${accentScanner.scan(bar.text).join("")} | قافية: ${phoneme}`;
      } else if (groupMode === "stress_emotion_rhyme") {
        key = `نبر: ${accentScanner.scan(bar.text).join("")} | عاطفة: ${bar.emotion || "غير مصنف"} | قافية: ${phoneme}`;
      } else if (groupMode === "accent_foot") {
        key = `التفعيلة: ${accentScanner.classify(accentScanner.scan(bar.text))}`;
      } else if (groupMode === "flexible_rhythm") {
        key = `قافية: ${phoneme} | تقارب إيقاعي: ${getWeightClass(weight)}`;
      } else if (groupMode === "vibe_match") {
        key = `تشابه شامل: ${getFamily(phoneme)} | ${getWeightClass(weight)}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(bar);
    });
    return groups;
  }, [sortedBars, groupMode]);

  useEffect(() => {
    if (!currentBarText) {
      setMoraProfile(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const profile = moraEngine.analyze(currentBarText);
      setMoraProfile(profile);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [currentBarText]);

  const isEngineAnalyzingRef = useRef(false);
  const [isEngineAnalyzing, setIsEngineAnalyzing] = useState(false);

  const [analyticalError, setAnalyticalError] = useState<string | null>(null);

  const handleBlueprintEngineAnalyze = async (file: File) => {
    if (isEngineAnalyzingRef.current) return;
    setAnalyticalError(null);
    isEngineAnalyzingRef.current = true;
    setIsEngineAnalyzing(true);

    try {
      // Use the actual audio analysis engine for elite precision
      const realAnalysis = await analyzeAudioFile(file);
      await handleAudioAnalysis(realAnalysis);
    } catch (error: any) {
      console.error("Failed to analyze audio in engine", error);
      setAnalyticalError(error.message || String(error));
    } finally {
      isEngineAnalyzingRef.current = false;
      setIsEngineAnalyzing(false);
    }
  };

  const isAnalyzingAudioRef = useRef(false);
  const handleAudioAnalysis = async (analysis: any) => {
    if (isAnalyzingAudioRef.current) return;
    isAnalyzingAudioRef.current = true;

    try {
      // Step 1: AI Classifies beat and generates the "Execution Protocol" (Directives)
      const aiAnalysis = await geminiService.classifyBeat(analysis);

      // Step 2: Relational Sync (Merge real timing with AI directives)
      if (
        aiAnalysis.trackProtocol?.sections &&
        analysis.trackProtocol?.sections
      ) {
        aiAnalysis.trackProtocol.sections = analysis.trackProtocol.sections.map(
          (realSec: any, i: number) => {
            const aiSec = aiAnalysis.trackProtocol.sections[i];
            return {
              ...realSec,
              directives: aiSec?.directives || [],
            };
          },
        );
      }

      const fullBlueprint = {
        ...analysis,
        ...aiAnalysis,
        // Override with ground truth from engine
        bpm: analysis.beatInfo?.bpm || analysis.bpm || 90,
        metadata: analysis.metadata || {},
        transientMap: {
          kicks: analysis.beatInfo?.kickPositions || [],
          snares: analysis.beatInfo?.snarePositions || [],
          hihats: analysis.beatInfo?.hatGridPositions || [],
          hatPattern: {
            type: analysis.beatInfo?.hatPattern || "none",
            positions: analysis.beatInfo?.hatGridPositions || [],
          },
        },
      };

      if (!fullBlueprint.trackProtocol)
        fullBlueprint.trackProtocol = analysis.trackProtocol;

      // Step 3: Studio-wide Propagation
      setBeatBlueprint(fullBlueprint);
      setRapBlueprint(fullBlueprint);

      // Notify user of successful blueprint generation
      console.log("✅ Beat Fingerprint Extracted. Execution Protocol ready.");
    } catch (err: any) {
      console.error("AI Beat Classification Failed:", err);
      setAnalyticalError(`فشل تحليل AI: ${err.message || String(err)}`);
      // Fallback with base structural data
      const fallback = { ...analysis, beatType: "trap", energy: 0.8 };
      setBeatBlueprint(fallback);
      setRapBlueprint(fallback);
    } finally {
      isAnalyzingAudioRef.current = false;
    }
  };

  const isSavingBarRef = useRef(false);
  const saveBar = async () => {
    if (!currentBarText.trim() || isSavingBarRef.current) return;
    isSavingBarRef.current = true;
    setIsAnalyzingBar(true);
    try {
      addBar({
        text: currentBarText,
        dialect: "fusha",
      });
      setCurrentBarText("");
    } catch (err) {
      console.error(err);
    } finally {
      isSavingBarRef.current = false;
      setIsAnalyzingBar(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-bg-base text-text-primary font-arabic selection:bg-gold-400/30 selection:text-gold-400 overflow-hidden flex flex-col"
    >
      <MatrixRain />
      <RuntimeMonitor />

      {/* Header */}
      <header className="h-16 border-b border-border-default bg-bg-primary/80 backdrop-blur-md flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center border border-gold-400/30 glow-accent">
            <Cpu className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-mono font-bold tracking-[0.2em] text-gold-400 glow-text">
              MAQAM v2.0
            </h1>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.3em]">
              الدمج الصوتي–الموسيقي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleDirectSync}
            disabled={isSyncingDirect}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            <Cloud
              className={`w-4 h-4 ${isSyncingDirect ? "animate-pulse" : ""}`}
            />
            {isSyncingDirect ? "جاري المزامنة..." : "مزامنة سحابية"}
          </button>
          <SyncIndicator />
          <button className="p-2 hover:bg-gold-400/10 rounded-lg transition-colors text-text-muted hover:text-gold-400">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar / Bottom Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 w-full lg:w-24 lg:static lg:h-auto bg-bg-surface/60 backdrop-blur-2xl border-t lg:border-r border-white/5 flex lg:flex-col flex-row items-center justify-center lg:justify-start lg:pt-8 py-2 gap-2 lg:gap-6 z-50 transition-all duration-500 overflow-y-auto custom-scrollbar shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gold-400/5 via-transparent to-purple-500/5 pointer-events-none hidden lg:block" />
          <NavButton
            icon={<AudioWaveform />}
            label="التحليل"
            active={activeTab === "beat"}
            onClick={() => setActiveTab("beat")}
          />
          <NavButton
            icon={<Database />}
            label="المستودع (كلاسيك)"
            active={activeTab === "repository"}
            onClick={() => setActiveTab("repository")}
          />
          <NavButton
            icon={<Cpu />}
            label="الورشة الهندسية"
            active={activeTab === "engineering_workshop"}
            onClick={() => setActiveTab("engineering_workshop")}
          />
          <NavButton
            icon={<BookOpen />}
            label="الأكاديمية"
            active={activeTab === "rap_academy2"}
            onClick={() => setActiveTab("rap_academy2")}
          />
          <NavButton
            icon={<Music />}
            label="الصوتيات (مقام)"
            active={activeTab === "maqam"}
            onClick={() => setActiveTab("maqam")}
          />
          <NavButton
            icon={<Layers />}
            label="منهجية الفلو"
            active={activeTab === "flow_methodology"}
            onClick={() => setActiveTab("flow_methodology")}
          />
          <NavButton
            icon={<BrainCircuit />}
            label="البصمة الصوتية"
            active={activeTab === "sonic_fingerprint"}
            onClick={() => setActiveTab("sonic_fingerprint")}
          />
          <NavButton
            icon={<Folder />}
            label="المشاريع"
            active={activeTab === "projects"}
            onClick={() => setActiveTab("projects")}
          />
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 relative z-10 lg:px-8 px-4 py-6 pb-24 lg:pb-6 overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "rap_academy2" && (
              <motion.div
                key="rap_academy2"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full max-w-[1800px] mx-auto"
              >
                <RapAcademy />
              </motion.div>
            )}
            {activeTab === "maqam" && (
              <motion.div
                key="maqam"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full max-w-[1800px] mx-auto"
              >
                <div className="h-full bg-[#111118] border border-border-default rounded-3xl overflow-hidden shadow-2xl">
                  <MaqamEngine />
                </div>
              </motion.div>
            )}
            {activeTab === "beat" && (
              <motion.div
                key="beat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full max-w-[1800px] mx-auto"
              >
                <div className="w-full flex-1 flex flex-col bg-bg-surface/50 border border-border-default rounded-xl overflow-hidden shadow-2xl h-[calc(100vh-140px)]">
                  <div className="flex items-center justify-between p-6 border-b border-border-default bg-bg-surface shrink-0">
                    <h3 className="text-lg font-bold text-gold-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      استوديو التحليل الموسيقي
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <BeatBlueprintEngine />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "repository" && (
              <motion.div
                key="repository"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-full flex flex-col gap-6 max-w-[1440px] mx-auto"
              >
                <BarRepositoryDisplay
                  bars={bars}
                  selectedBars={selectedBars}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  groupMode={groupMode}
                  setGroupMode={setGroupMode}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  emotionFilter={emotionFilter}
                  setEmotionFilter={setEmotionFilter}
                  footFilter={footFilter}
                  setFootFilter={setFootFilter}
                  rhymeFilter={rhymeFilter}
                  setRhymeFilter={setRhymeFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isCategorizing={isCategorizing}
                  handleSmartCategorize={handleSmartCategorize}
                  isUpdatingEmotions={isUpdatingEmotions}
                  handleUpdateEmotions={handleUpdateEmotions}
                  isRefreshingRepo={isRefreshingRepo}
                  handleRefreshRepository={handleRefreshRepository}
                  setIsBatchImportOpen={setIsBatchImportOpen}
                  stressFilter={stressFilter}
                  handleStressFilterChange={handleStressFilterChange}
                  handleFindSimilar={handleFindSimilar}
                  handleDeleteRequest={handleDeleteRequest}
                  setActiveTab={setActiveTab}
                  toggleFavorite={toggleFavorite}
                  toggleSelection={toggleSelection}
                  clearSelection={clearSelection}
                />
              </motion.div>
            )}

            {activeTab === "engineering_workshop" && (
              <motion.div
                key="engineering_workshop"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full"
              >
                <MaqamWorkshopPage />
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-full flex flex-col gap-6 max-w-[1440px] mx-auto"
              >
                <ProjectsManager />
              </motion.div>
            )}

            {activeTab === "flow_methodology" && (
              <motion.div
                key="flow_methodology"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full max-w-[1800px] mx-auto"
              >
                <FlowMethodologyHub />
              </motion.div>
            )}

            {activeTab === "sonic_fingerprint" && (
              <motion.div
                key="sonic_fingerprint"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full max-w-[1800px] mx-auto"
              >
                <SonicFingerprintPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-10 border-t border-border-default bg-bg-primary/80 backdrop-blur-md flex items-center justify-between px-6 text-[10px] font-mono text-text-muted">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <Terminal className="w-3 h-3" /> MAQAM_CORE_V2.0
          </span>
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3" /> حمولة المعالج: 14%
          </span>
          <span className="flex items-center gap-2 text-gold-400/60">
            <CheckCircle2 className="w-3 h-3" /> التشفير نشط
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>© 2026 MAQAM_LABS</span>
          <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
        </div>
      </footer>

      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
      />
      <DeleteConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBarToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        barText={barToDelete?.text}
      />
      <ChatAssistant />
    </div>
  );
}

const LayerItem = ({
  label,
  status,
}: {
  label: string;
  status: "complete" | "active" | "pending";
}) => (
  <div className="flex items-center justify-between">
    <span
      className={`text-xs font-mono ${status === "pending" ? "text-text-muted" : "text-text-secondary"}`}
    >
      {label}
    </span>
    <div className="flex items-center gap-2">
      {status === "complete" && (
        <CheckCircle2 className="w-3 h-3 text-quality-perfect" />
      )}
      {status === "active" && (
        <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
      )}
      {status === "pending" && (
        <div className="w-2 h-2 rounded-full bg-text-muted/20" />
      )}
      <span
        className={`text-[8px] font-mono uppercase ${status === "complete" ? "text-quality-perfect" : status === "active" ? "text-gold-400" : "text-text-muted"}`}
      >
        {status === "complete"
          ? "مكتمل"
          : status === "active"
            ? "جارٍ"
            : "في الانتظار"}
      </span>
    </div>
  </div>
);
