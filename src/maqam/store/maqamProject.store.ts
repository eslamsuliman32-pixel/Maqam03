import { create } from "zustand";
import type {
  MaqamProjectDocument,
  MaqamProjectSummary,
} from "../types/project.types";
import type { BarInput } from "../types/maqam.types";
import {
  createProject,
  listProjects,
  loadProject,
  loadProjectPreferRemote,
  removeProject,
  saveProjectDraft,
  syncDirtyProjects,
  syncProject,
} from "../db/maqamProject.repository";

interface MaqamProjectState {
  currentProject: MaqamProjectDocument | null;
  projectSummaries: MaqamProjectSummary[];
  isLoading: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  error: string | null;

  createNewProject: (input: {
    title: string;
    ownerId?: string | null;
    bpm?: number;
    beatOffsetMs?: number;
    beatsPerBar?: number;
    bars?: BarInput[];
  }) => Promise<MaqamProjectDocument>;

  loadLocalProject: (projectId: string) => Promise<MaqamProjectDocument | null>;
  loadProjectWithRemote: (projectId: string) => Promise<MaqamProjectDocument | null>;
  refreshProjectList: () => Promise<void>;

  saveCurrentProject: (patch?: {
    title?: string;
    ownerId?: string | null;
    bpm?: number;
    beatOffsetMs?: number;
    beatsPerBar?: number;
    bars?: BarInput[];
    analysis?: MaqamProjectDocument["analysis"];
  }) => Promise<MaqamProjectDocument | null>;

  syncCurrentProject: () => Promise<MaqamProjectDocument | null>;
  syncAllDirty: () => Promise<void>;
  deleteCurrentProject: (remote?: boolean) => Promise<void>;
  setCurrentProject: (project: MaqamProjectDocument | null) => void;
  clearError: () => void;
}

export const useMaqamProjectStore = create<MaqamProjectState>((set, get) => ({
  currentProject: null,
  projectSummaries: [],
  isLoading: false,
  isSaving: false,
  isSyncing: false,
  error: null,

  createNewProject: async (input) => {
    set({ isSaving: true, error: null });

    try {
      const project = await createProject(input);
      const summaries = await listProjects();

      set({
        currentProject: project,
        projectSummaries: summaries,
        isSaving: false,
      });

      return project;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create project.",
        isSaving: false,
      });

      throw error;
    }
  },

  loadLocalProject: async (projectId) => {
    set({ isLoading: true, error: null });

    try {
      const project = await loadProject(projectId);

      set({
        currentProject: project,
        isLoading: false,
      });

      return project;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load project.",
        isLoading: false,
      });

      throw error;
    }
  },

  loadProjectWithRemote: async (projectId) => {
    set({ isLoading: true, error: null });

    try {
      const project = await loadProjectPreferRemote(projectId);
      const summaries = await listProjects();

      set({
        currentProject: project,
        projectSummaries: summaries,
        isLoading: false,
      });

      return project;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load project with remote.",
        isLoading: false,
      });

      throw error;
    }
  },

  refreshProjectList: async () => {
    set({ isLoading: true, error: null });

    try {
      const summaries = await listProjects();

      set({
        projectSummaries: summaries,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to refresh projects.",
        isLoading: false,
      });
    }
  },

  saveCurrentProject: async (patch) => {
    const current = get().currentProject;

    if (!current) return null;

    set({ isSaving: true, error: null });

    try {
      const saved = await saveProjectDraft({
        projectId: current.meta.id,
        title: patch?.title,
        ownerId: patch?.ownerId,
        bpm: patch?.bpm,
        beatOffsetMs: patch?.beatOffsetMs,
        beatsPerBar: patch?.beatsPerBar,
        bars: patch?.bars,
        analysis: patch?.analysis,
      });

      const summaries = await listProjects();

      set({
        currentProject: saved,
        projectSummaries: summaries,
        isSaving: false,
      });

      return saved;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to save project.",
        isSaving: false,
      });

      throw error;
    }
  },

  syncCurrentProject: async () => {
    const current = get().currentProject;

    if (!current) return null;

    set({ isSyncing: true, error: null });

    try {
      const synced = await syncProject(current.meta.id);
      const summaries = await listProjects();

      set({
        currentProject: synced,
        projectSummaries: summaries,
        isSyncing: false,
      });

      return synced;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to sync project.",
        isSyncing: false,
      });

      throw error;
    }
  },

  syncAllDirty: async () => {
    set({ isSyncing: true, error: null });

    try {
      await syncDirtyProjects();
      const summaries = await listProjects();

      set({
        projectSummaries: summaries,
        isSyncing: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to sync dirty projects.",
        isSyncing: false,
      });

      throw error;
    }
  },

  deleteCurrentProject: async (remote = false) => {
    const current = get().currentProject;

    if (!current) return;

    set({ isLoading: true, error: null });

    try {
      await removeProject({
        projectId: current.meta.id,
        remote,
      });

      const summaries = await listProjects();

      set({
        currentProject: null,
        projectSummaries: summaries,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete project.",
        isLoading: false,
      });

      throw error;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),
}));
