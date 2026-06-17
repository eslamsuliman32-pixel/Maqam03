import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { FlowLabState, FlowTextCell, CellType, RhymeLockType } from './types';
import { HybridAnalysisPipeline } from '../services/audioAnalysis/hybridPipeline';
import { ProjectStorage } from '../services/storage/projectStorage';
import { generateInitialCells } from '../utils/cellGenerator';
import { v4 as uuidv4 } from 'uuid';

const analysisPipeline = new HybridAnalysisPipeline();

async function generateFingerprint(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer.slice(0, 10000));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useFlowLabStore = create<FlowLabState>()(
  devtools(
    immer((set, get) => ({
      // الحالة الأولية
      audioFile: null,
      audioBuffer: null,
      audioDuration: 0,
      
      analysisStatus: 'idle',
      analysisProgress: 0,
      analysisError: null,
      useCloudAnalysis: false,
      
      analysisResult: null,
      
      activeTab: 'melodic',
      activeLeadInstrument: null,
      
      textCells: [],
      editingCellId: null,
      selectedCellIds: [],
      
      canvasViewport: {
        startTime: 0,
        endTime: 10,
        zoom: 1,
      },
      
      suggestions: [],
      suggestionsLoading: false,
      currentPrompt: '',
      
      history: {
        past: [],
        future: [],
      },

      // الإجراءات
      loadAudio: async (file: File) => {
        set({ audioFile: file, analysisStatus: 'uploading' });

        try {
          // تحويل الملف إلى AudioBuffer
          const arrayBuffer = await file.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          set({
            audioBuffer,
            audioDuration: audioBuffer.duration,
            canvasViewport: {
              startTime: 0,
              endTime: Math.min(audioBuffer.duration, 10),
              zoom: 1,
            },
          });

          // بدء التحليل تلقائياً
          await get().startAnalysis();
        } catch (error) {
          set({
            analysisStatus: 'error',
            analysisError: (error as Error).message,
          });
        }
      },

      startAnalysis: async () => {
        const { audioFile, audioBuffer, useCloudAnalysis } = get();
        
        if (!audioFile || !audioBuffer) return;

        set({ analysisStatus: 'analyzing-local', analysisProgress: 0 });

        try {
          const result = await analysisPipeline.analyze(
            audioFile,
            audioBuffer,
            useCloudAnalysis,
            (progress, stage) => {
              set({
                analysisProgress: progress,
                analysisStatus: stage as any,
              });
            }
          );

          set({ analysisStatus: 'generating-cells' });

          // توليد الخلايا الأولية
          const initialCells = generateInitialCells(result);

          set({
            analysisResult: result,
            textCells: initialCells,
            analysisStatus: 'done',
            analysisProgress: 100,
            activeLeadInstrument: result.leadCurves[0]?.instrument || null,
          });

          // حفظ في الكاش
          const fingerprint = await generateFingerprint(audioFile);
          await ProjectStorage.cacheAnalysis(fingerprint, result);
        } catch (error) {
          set({
            analysisStatus: 'error',
            analysisError: (error as Error).message,
          });
        }
      },

      toggleAnalysisMode: () => {
        set((state) => {
          state.useCloudAnalysis = !state.useCloudAnalysis;
        });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setActiveLeadInstrument: (instrument) => set({ activeLeadInstrument: instrument }),

      // إدارة الخلايا
      updateCellText: (cellId, text) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            // حفظ في التاريخ قبل التعديل
            state.history.past.push([...state.textCells]);
            state.history.future = [];
            
            cell.text = text;
            cell.userEdited = true;
          }
        });
      },

      updateCellDuration: (cellId, duration) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            state.history.past.push([...state.textCells]);
            state.history.future = [];
            cell.duration = duration;
          }
        });
      },

      setCellType: (cellId, type) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            state.history.past.push([...state.textCells]);
            state.history.future = [];
            cell.type = type;
          }
        });
      },

      addCell: (cellData) => {
        set((state) => {
          state.history.past.push([...state.textCells]);
          state.history.future = [];
          
          state.textCells.push({
            ...cellData,
            id: uuidv4(),
            userEdited: true,
          });
          
          // ترتيب حسب الوقت
          state.textCells.sort((a, b) => a.startTime - b.startTime);
        });
      },

      removeCell: (cellId) => {
        set((state) => {
          state.history.past.push([...state.textCells]);
          state.history.future = [];
          
          state.textCells = state.textCells.filter(c => c.id !== cellId);
        });
      },

      mergeCells: (cellIds) => {
        set((state) => {
          if (cellIds.length < 2) return;
          
          state.history.past.push([...state.textCells]);
          state.history.future = [];
          
          const cells = cellIds
            .map(id => state.textCells.find(c => c.id === id))
            .filter(Boolean)
            .sort((a, b) => a!.startTime - b!.startTime);
          
          if (cells.length < 2) return;
          
          const mergedCell: FlowTextCell = {
            id: uuidv4(),
            startTime: cells[0]!.startTime,
            duration: cells[cells.length - 1]!.startTime + cells[cells.length - 1]!.duration - cells[0]!.startTime,
            text: cells.map(c => c!.text).join(''),
            type: 'combo',
            userEdited: true,
          };
          
          state.textCells = state.textCells.filter(c => !cellIds.includes(c.id));
          state.textCells.push(mergedCell);
          state.textCells.sort((a, b) => a.startTime - b.startTime);
        });
      },

      splitCell: (cellId, splitTime) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (!cell) return;
          
          state.history.past.push([...state.textCells]);
          state.history.future = [];
          
          const relativeTime = splitTime - cell.startTime;
          const ratio = relativeTime / cell.duration;
          const splitIndex = Math.floor(cell.text.length * ratio);
          
          const cell1: FlowTextCell = {
            ...cell,
            id: uuidv4(),
            duration: relativeTime,
            text: cell.text.slice(0, splitIndex),
          };
          
          const cell2: FlowTextCell = {
            ...cell,
            id: uuidv4(),
            startTime: splitTime,
            duration: cell.duration - relativeTime,
            text: cell.text.slice(splitIndex),
          };
          
          state.textCells = state.textCells.filter(c => c.id !== cellId);
          state.textCells.push(cell1, cell2);
          state.textCells.sort((a, b) => a.startTime - b.startTime);
        });
      },

      // المسامير
      addSpike: (cellId, intensity = 0.8) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            cell.spike = { active: true, intensity, pitchDelta: 0 };
          }
        });
      },

      removeSpike: (cellId) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            cell.spike = null;
          }
        });
      },

      updateSpikeIntensity: (cellId, intensity) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell?.spike) {
            cell.spike.intensity = intensity;
          }
        });
      },

      autoDetectSpikes: () => {
        set((state) => {
          const { analysisResult } = state;
          if (!analysisResult) return;
          
          // منطق الكشف التلقائي عن المسامير بناءً على القمم اللحنية
        });
      },

      // القوافي
      addRhymeLock: (cellId, type) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            cell.rhymeLock = type;
          }
        });
      },

      removeRhymeLock: (cellId) => {
        set((state) => {
          const cell = state.textCells.find(c => c.id === cellId);
          if (cell) {
            cell.rhymeLock = null;
          }
        });
      },

      lockBeatRhymes: (beatIndex, type) => {
        set((state) => {
          const { analysisResult } = state;
          if (!analysisResult) return;
          
          state.textCells.forEach(cell => {
            if (cell.barIndex !== undefined) {
              const bar = analysisResult.bars[cell.barIndex];
              if (bar && bar.beats[beatIndex]) {
                const beatTime = bar.beats[beatIndex].time;
                if (Math.abs(cell.startTime - beatTime) < 0.05) {
                  cell.rhymeLock = type;
                }
              }
            }
          });
        });
      },

      // التحديد
      selectCell: (cellId, multi = false) => {
        set((state) => {
          if (multi) {
            if (state.selectedCellIds.includes(cellId)) {
              state.selectedCellIds = state.selectedCellIds.filter(id => id !== cellId);
            } else {
              state.selectedCellIds.push(cellId);
            }
          } else {
            state.selectedCellIds = [cellId];
          }
        });
      },

      clearSelection: () => set({ selectedCellIds: [] }),

      startEditCell: (cellId) => set({ editingCellId: cellId }),

      commitCellEdit: () => set({ editingCellId: null }),

      cancelCellEdit: () => set({ editingCellId: null }),

      // العرض
      setViewport: (viewport) => {
        set((state) => {
          state.canvasViewport = { ...state.canvasViewport, ...viewport };
        });
      },

      zoomIn: () => {
        set((state) => {
          state.canvasViewport.zoom = Math.min(state.canvasViewport.zoom * 1.5, 10);
        });
      },

      zoomOut: () => {
        set((state) => {
          state.canvasViewport.zoom = Math.max(state.canvasViewport.zoom / 1.5, 0.1);
        });
      },

      resetZoom: () => {
        set((state) => {
          state.canvasViewport.zoom = 1;
        });
      },

      // الاقتراحات
      requestSuggestions: async (prompt) => {
        set({ suggestionsLoading: true, currentPrompt: prompt || '' });
        
        try {
          // مؤقتاً: بيانات وهمية
          const mockSuggestions = [
            {
              id: uuidv4(),
              verse: 'نص تجريبي للاقتراح الأول',
              fitScore: 8.5,
              rhymeScheme: 'AABB',
              syllableCount: 16,
              emotionalTone: ['قوي', 'حماسي'],
            },
          ];
          
          set({ suggestions: mockSuggestions, suggestionsLoading: false });
        } catch (error) {
          set({ suggestionsLoading: false });
        }
      },

      applySuggestion: (suggestionId) => {
        set((state) => {
          const suggestion = state.suggestions.find(s => s.id === suggestionId);
          if (!suggestion) return;
          
          state.history.past.push([...state.textCells]);
          state.history.future = [];
        });
      },

      // التاريخ
      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return;
          
          const previous = state.history.past.pop()!;
          state.history.future.push([...state.textCells]);
          state.textCells = previous;
        });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return;
          
          const next = state.history.future.pop()!;
          state.history.past.push([...state.textCells]);
          state.textCells = next;
        });
      },

      // المشروع
      exportProject: async () => {
        const state = get();
        const projectData = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          state: {
            textCells: state.textCells,
            analysisResult: state.analysisResult,
            activeTab: state.activeTab,
          },
        };
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], {
          type: 'application/json',
        });
        
        return blob;
      },

      importProject: async (file) => {
        try {
          const text = await file.text();
          const projectData = JSON.parse(text);
          
          set({
            textCells: projectData.state.textCells,
            analysisResult: projectData.state.analysisResult,
            activeTab: projectData.state.activeTab,
          });
        } catch (error) {
          console.error('فشل استيراد المشروع:', error);
        }
      },

      clearProject: () => {
        set({
          audioFile: null,
          audioBuffer: null,
          audioDuration: 0,
          analysisStatus: 'idle',
          analysisProgress: 0,
          analysisError: null,
          analysisResult: null,
          textCells: [],
          selectedCellIds: [],
          editingCellId: null,
          suggestions: [],
          history: { past: [], future: [] },
        });
      },

    })),
    { name: 'FlowLabStore' }
  )
);
