import { create } from "zustand";

interface RapState {
  loading: boolean;
  error: string | null;
  results: any[];
  sourceBar: string;
  blueprint: any | null;
  matrixData: any | null;
  activeBarIndex: number;
  setActiveBarIndex: (index: number) => void;
  initWorker: () => void;
  compose: (sourceBar: string, preferences?: Record<string, any>) => Promise<void>;
  generateMatrix: (text: string) => Promise<void>;
  setBlueprint: (blueprint: any) => void;
  clear: () => void;
}

export const useRapEngineStore = create<RapState>((set) => ({
  loading: false,
  error: null,
  results: [],
  sourceBar: "",
  blueprint: null,
  matrixData: null,
  activeBarIndex: 0,
  setActiveBarIndex: (index) => set({ activeBarIndex: index }),

  initWorker: () => {
    console.warn("Rap Engine Worker is currently disabled (Cleanup Mode)");
  },

  compose: async (sourceBar) => {
    console.warn("Compose called in Cleanup Mode for bar:", sourceBar);
  },

  generateMatrix: async (text: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/maqam/phonetic-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate matrix");
      }
      
      set({ matrixData: data.analysis, sourceBar: text, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  setBlueprint: (blueprint) => set({ blueprint }),

  clear: () =>
    set({
      results: [],
      error: null,
      sourceBar: "",
      loading: false,
      blueprint: null,
      matrixData: null
    }),
}));
