import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createPersistStorage } from "../lib/storage/createPersistStorage";

const projectStorage = createPersistStorage({
  namespace: "projects",
  priority: 1,
  maxRetries: 5,
  debounceMs: 1200,
  onHydrated: (source) => {
    console.info(`[ProjectStore] Hydrated from: ${source}`);
  },
});

export interface ProjectBarRef {
  id: string; // The bar's ID from the repository
  order: number;
}

export interface Track {
  id: string;
  name: string;
  bars: ProjectBarRef[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
}

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;

  createProject: (name: string, description?: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  
  addTrackToProject: (projectId: string, trackName: string) => void;
  deleteTrack: (projectId: string, trackId: string) => void;

  addBarToTrack: (projectId: string, trackId: string, barId: string) => void;
  removeBarFromTrack: (projectId: string, trackId: string, barId: string) => void;
  reorderBarsInTrack: (projectId: string, trackId: string, newOrderIds: string[]) => void;
  moveBarBetweenTracks: (projectId: string, fromTrackId: string, toTrackId: string, barId: string, position?: number) => void;
  updateProjectMeta: (id: string, meta: Partial<Pick<Project, "name" | "description">>) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      createProject: (name, description = "") =>
        set((state) => {
          const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tracks: [
              { id: crypto.randomUUID(), name: "Track 1", bars: [] },
            ],
          };
          return {
            projects: [...state.projects, newProject],
            activeProjectId: newProject.id,
          };
        }),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),

      addTrackToProject: (projectId, trackName) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                tracks: [
                  ...p.tracks,
                  { id: crypto.randomUUID(), name: trackName, bars: [] },
                ],
              };
            }
            return p;
          }),
        })),

      deleteTrack: (projectId, trackId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                tracks: p.tracks.filter((t) => t.id !== trackId),
              };
            }
            return p;
          }),
        })),

      addBarToTrack: (projectId, trackId, barId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                tracks: p.tracks.map((t) => {
                  if (t.id === trackId) {
                    if (t.bars.some((ref) => ref.id === barId)) return t;
                    return {
                      ...t,
                      bars: [...t.bars, { id: barId, order: t.bars.length }],
                    };
                  }
                  return t;
                }),
              };
            }
            return p;
          }),
        })),

      removeBarFromTrack: (projectId, trackId, barId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                tracks: p.tracks.map((t) => {
                  if (t.id === trackId) {
                    return {
                      ...t,
                      bars: t.bars.filter((ref) => ref.id !== barId),
                    };
                  }
                  return t;
                }),
              };
            }
            return p;
          }),
        })),

      reorderBarsInTrack: (projectId, trackId, newOrderIds) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                updatedAt: new Date().toISOString(),
                tracks: p.tracks.map((t) => {
                  if (t.id === trackId) {
                    const newBars = newOrderIds.map((id, index) => {
                        const existing = t.bars.find((b) => b.id === id);
                      return { id, order: index };
                    });
                    return { ...t, bars: newBars };
                  }
                  return t;
                }),
              };
            }
            return p;
          }),
        })),

      moveBarBetweenTracks: (projectId, fromTrackId, toTrackId, barId, position) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              const project = { ...p, updatedAt: new Date().toISOString(), tracks: [...p.tracks] };
              const fromTrackIndex = project.tracks.findIndex((t) => t.id === fromTrackId);
              const toTrackIndex = project.tracks.findIndex((t) => t.id === toTrackId);
              
              if (fromTrackIndex === -1 || toTrackIndex === -1) return p;
              
              const fromTrack = { ...project.tracks[fromTrackIndex], bars: [...project.tracks[fromTrackIndex].bars] };
              const toTrack = { ...project.tracks[toTrackIndex], bars: [...project.tracks[toTrackIndex].bars] };
              
              const barRefIndex = fromTrack.bars.findIndex(b => b.id === barId);
              if (barRefIndex === -1) return p;
              
              const [barRef] = fromTrack.bars.splice(barRefIndex, 1);
              
              if (position !== undefined) {
                toTrack.bars.splice(position, 0, barRef);
              } else {
                toTrack.bars.push(barRef);
              }
              
              // update orders
              fromTrack.bars = fromTrack.bars.map((b, i) => ({ ...b, order: i }));
              toTrack.bars = toTrack.bars.map((b, i) => ({ ...b, order: i }));
              
              project.tracks[fromTrackIndex] = fromTrack;
              project.tracks[toTrackIndex] = toTrack;
              
              return project;
            }
            return p;
          })
        })),

      updateProjectMeta: (id, meta) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === id) {
              return { ...p, ...meta, updatedAt: new Date().toISOString() };
            }
            return p;
          })
        })),
    }),
    {
      name: "maqam-projects-storage",
      storage: createJSONStorage(() => projectStorage),
    }
  )
);
