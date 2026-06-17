import type {
  MaqamProjectAnalysisBundle,
  MaqamProjectDocument,
  MaqamProjectSummary,
} from "../types/project.types";
import type { BarInput } from "../types/maqam.types";
import { createMaqamId } from "../utils/id.utils";
import { nowIso } from "../utils/date.utils";
import { auth } from "../../lib/firebase";
import {
  deleteProjectLocal,
  getProjectLocal,
  listDirtyProjectsLocal,
  listProjectSummariesLocal,
  saveProjectLocal,
} from "./maqamIndexedDb";
import {
  deleteProjectRemote,
  getProjectRemote,
  listProjectSummariesRemote,
  saveProjectRemote,
} from "./maqamFirestore";

export interface CreateProjectInput {
  title: string;
  ownerId?: string | null;
  bpm?: number;
  beatOffsetMs?: number;
  beatsPerBar?: number;
  bars?: BarInput[];
}

export interface UpdateProjectInput {
  projectId: string;
  title?: string;
  ownerId?: string | null;
  bpm?: number;
  beatOffsetMs?: number;
  beatsPerBar?: number;
  bars?: BarInput[];
  analysis?: Partial<MaqamProjectAnalysisBundle>;
}

function emptyAnalysis(): MaqamProjectAnalysisBundle {
  return {
    phoneticResults: [],
    narrativeArc: null,
    hookAnalysis: null,
    sonicSemanticLines: [],
    beatGridAnalysis: null,
    audioBeatAnalysis: null,
    vocalTimingAnalysis: null,
  };
}

export function createProjectDocument(
  input: CreateProjectInput
): MaqamProjectDocument {
  const timestamp = nowIso();

  return {
    meta: {
      id: createMaqamId("project"),
      title: input.title,
      ownerId: input.ownerId ?? null,
      bpm: input.bpm ?? 90,
      beatOffsetMs: input.beatOffsetMs ?? 0,
      beatsPerBar: input.beatsPerBar ?? 4,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastSyncedAt: null,
      syncStatus: "local-only",
      version: 1,
    },
    bars: input.bars ?? [],
    analysis: emptyAnalysis(),
  };
}

export async function createProject(
  input: CreateProjectInput
): Promise<MaqamProjectDocument> {
  const project = createProjectDocument(input);

  await saveProjectLocal(project);

  return project;
}

export async function saveProjectDraft(
  input: UpdateProjectInput
): Promise<MaqamProjectDocument> {
  const existing = await getProjectLocal(input.projectId);

  if (!existing) {
    throw new Error(`Project not found locally: ${input.projectId}`);
  }

  const timestamp = nowIso();

  const next: MaqamProjectDocument = {
    ...existing,
    meta: {
      ...existing.meta,
      title: input.title ?? existing.meta.title,
      ownerId:
        input.ownerId === undefined ? existing.meta.ownerId : input.ownerId,
      bpm: input.bpm ?? existing.meta.bpm,
      beatOffsetMs: input.beatOffsetMs ?? existing.meta.beatOffsetMs,
      beatsPerBar: input.beatsPerBar ?? existing.meta.beatsPerBar,
      updatedAt: timestamp,
      syncStatus: existing.meta.syncStatus === "local-only" ? "local-only" : "dirty",
      version: existing.meta.version + 1,
    },
    bars: input.bars ?? existing.bars,
    analysis: {
      ...existing.analysis,
      ...input.analysis,
    },
  };

  await saveProjectLocal(next);

  return next;
}

export async function loadProject(projectId: string): Promise<MaqamProjectDocument | null> {
  return getProjectLocal(projectId);
}

export async function loadProjectPreferRemote(
  projectId: string
): Promise<MaqamProjectDocument | null> {
  const [local, remote] = await Promise.all([
    getProjectLocal(projectId),
    getProjectRemote(projectId).catch(() => null),
  ]);

  if (!remote) return local;
  if (!local) {
    await saveProjectLocal({
      ...remote,
      meta: {
        ...remote.meta,
        syncStatus: "synced",
      },
    });

    return remote;
  }

  const remoteIsNewer = remote.meta.updatedAt > local.meta.updatedAt;

  if (remoteIsNewer && local.meta.syncStatus !== "dirty") {
    const normalizedRemote: MaqamProjectDocument = {
      ...remote,
      meta: {
        ...remote.meta,
        syncStatus: "synced",
      },
    };

    await saveProjectLocal(normalizedRemote);

    return normalizedRemote;
  }

  return local;
}

export async function listProjects(): Promise<MaqamProjectSummary[]> {
  return listProjectSummariesLocal();
}

export async function listRemoteProjects(params?: {
  ownerId?: string | null;
  max?: number;
}): Promise<MaqamProjectSummary[]> {
  return listProjectSummariesRemote(params);
}

export async function syncProject(projectId: string): Promise<MaqamProjectDocument> {
  const local = await getProjectLocal(projectId);

  if (!local) {
    throw new Error(`Project not found locally: ${projectId}`);
  }

  const currentUid = auth.currentUser?.uid ?? null;
  const ownerId = local.meta.ownerId || currentUid;

  const syncing: MaqamProjectDocument = {
    ...local,
    meta: {
      ...local.meta,
      ownerId,
      syncStatus: "syncing",
    },
  };

  await saveProjectLocal(syncing);

  try {
    const timestamp = nowIso();

    const synced: MaqamProjectDocument = {
      ...local,
      meta: {
        ...local.meta,
        ownerId,
        syncStatus: "synced",
        lastSyncedAt: timestamp,
        updatedAt: local.meta.updatedAt,
      },
    };

    await saveProjectRemote(synced);
    await saveProjectLocal(synced);

    return synced;
  } catch (error) {
    const failed: MaqamProjectDocument = {
      ...local,
      meta: {
        ...local.meta,
        ownerId,
        syncStatus: "error",
      },
    };

    await saveProjectLocal(failed);

    throw error;
  }
}

export async function syncDirtyProjects(): Promise<MaqamProjectDocument[]> {
  const dirty = await listDirtyProjectsLocal();

  const results: MaqamProjectDocument[] = [];

  for (const project of dirty) {
    const synced = await syncProject(project.meta.id);
    results.push(synced);
  }

  return results;
}

export async function removeProject(params: {
  projectId: string;
  remote?: boolean;
}): Promise<void> {
  await deleteProjectLocal(params.projectId);

  if (params.remote) {
    await deleteProjectRemote(params.projectId);
  }
}
