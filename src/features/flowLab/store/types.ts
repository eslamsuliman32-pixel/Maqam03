export interface BeatEvent {
  id: string;
  time: number;
  type: 'kick' | 'snare' | 'hihat' | 'other';
  intensity: number; // 0-1
  confidence: number; // 0-1
}

export interface BarSegment {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  beats: BeatEvent[];
  tempo: number; // BPM local
}

export interface PitchPoint {
  time: number;
  frequency: number;
  confidence: number;
}

export interface LeadCurve {
  instrument: string;
  category: 'strings' | 'brass' | 'woodwind' | 'synth' | 'vocal' | 'other';
  dataPoints: PitchPoint[];
  startTime: number;
  endTime: number;
  dominance: number; // 0-1, قوة حضور الآلة
}

export interface LeadSwitch {
  startTime: number;
  endTime: number;
  instrument: string;
  transitionType: 'hard' | 'soft';
}

export interface SpikeConfig {
  active: boolean;
  intensity: number; // 0-1
  pitchDelta: number; // التغير في التردد
}

export type RhymeLockType = 'internal' | 'final';

export type CellType = 'vowel' | 'consonant' | 'combo' | 'silence';

export interface FlowTextCell {
  id: string;
  startTime: number;
  duration: number;
  text: string;
  type: CellType;
  
  // ارتباطات
  linkedBeat?: BeatEvent['type'] | null;
  linkedPitch?: number | null; // التردد المرتبط
  
  // تحسينات
  spike?: SpikeConfig | null;
  rhymeLock?: RhymeLockType | null;
  
  // ميتاداتا
  confidence?: number; // ثقة التعيين التلقائي
  userEdited?: boolean;
  barIndex?: number;
}

export interface VerseSuggestion {
  id: string;
  verse: string;
  fitScore: number; // 0-10
  rhymeScheme: string;
  syllableCount: number;
  emotionalTone: string[];
}

export interface AnalysisResult {
  beatGrid: BeatEvent[];
  bars: BarSegment[];
  leadCurves: LeadCurve[];
  leadTimeline: LeadSwitch[];
  globalTempo: number;
  timeSignature: string;
  key?: string;
}

export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing-local' | 'analyzing-cloud' | 'generating-cells' | 'done' | 'error';

export type FlowLabTab = 'melodic' | 'layered' | 'percussive' | 'elite';

export interface FlowLabState {
  // ملف الصوت
  audioFile: File | null;
  audioBuffer: AudioBuffer | null;
  audioDuration: number;
  
  // حالة التحليل
  analysisStatus: AnalysisStatus;
  analysisProgress: number; // 0-100
  analysisError: string | null;
  useCloudAnalysis: boolean; // تبديل بين محلي/سحابي
  
  // نتائج التحليل
  analysisResult: AnalysisResult | null;
  
  // التبويب النشط
  activeTab: FlowLabTab;
  
  // الآلة القائدة المختارة (للوضع اللحني)
  activeLeadInstrument: string | null;
  
  // خلايا التدفق
  textCells: FlowTextCell[];
  
  // التحرير
  editingCellId: string | null;
  selectedCellIds: string[]; // للتحديد المتعدد
  
  // العرض
  canvasViewport: {
    startTime: number;
    endTime: number;
    zoom: number; // 0.1 - 10
  };
  
  // الاقتراحات
  suggestions: VerseSuggestion[];
  suggestionsLoading: boolean;
  currentPrompt: string;
  
  // التاريخ (Undo/Redo)
  history: {
    past: FlowTextCell[][];
    future: FlowTextCell[][];
  };
  
  // الإجراءات
  loadAudio: (file: File) => Promise<void>;
  startAnalysis: () => Promise<void>;
  toggleAnalysisMode: () => void;
  
  setActiveTab: (tab: FlowLabTab) => void;
  setActiveLeadInstrument: (instrument: string | null) => void;
  
  // إدارة الخلايا
  updateCellText: (cellId: string, text: string) => void;
  updateCellDuration: (cellId: string, duration: number) => void;
  setCellType: (cellId: string, type: CellType) => void;
  addCell: (cell: Omit<FlowTextCell, 'id'>) => void;
  removeCell: (cellId: string) => void;
  mergeCells: (cellIds: string[]) => void;
  splitCell: (cellId: string, splitTime: number) => void;
  
  // المسامير
  addSpike: (cellId: string, intensity?: number) => void;
  removeSpike: (cellId: string) => void;
  updateSpikeIntensity: (cellId: string, intensity: number) => void;
  autoDetectSpikes: () => void;
  
  // القوافي
  addRhymeLock: (cellId: string, type: RhymeLockType) => void;
  removeRhymeLock: (cellId: string) => void;
  lockBeatRhymes: (beatIndex: number, type: RhymeLockType) => void;
  
  // التحديد
  selectCell: (cellId: string, multi?: boolean) => void;
  clearSelection: () => void;
  startEditCell: (cellId: string) => void;
  commitCellEdit: () => void;
  cancelCellEdit: () => void;
  
  // العرض
  setViewport: (viewport: Partial<FlowLabState['canvasViewport']>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  
  // الاقتراحات
  requestSuggestions: (prompt?: string) => Promise<void>;
  applySuggestion: (suggestionId: string) => void;
  
  // التاريخ
  undo: () => void;
  redo: () => void;
  
  // المشروع
  exportProject: () => Promise<Blob>;
  importProject: (file: File) => Promise<void>;
  clearProject: () => void;
}
