import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  MaqamProjectDocument,
  MaqamProjectSummary,
} from "../types/project.types";

const DB_NAME = "maqam-os2-db";
const DB_VERSION = 1;

interface MaqamOs2DbSchema extends DBSchema {
  projects: {
    key: string;
    value: MaqamProjectDocument;
    indexes: {
      "by-updatedAt": string;
      "by-ownerId": string;
      "by-syncStatus": string;
    };
  };
  projectSummaries: {
    key: string;
    value: MaqamProjectSummary;
    indexes: {
      "by-updatedAt": string;
      "by-syncStatus": string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MaqamOs2DbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<MaqamOs2DbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MaqamOs2DbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", {
            keyPath: "meta.id",
          });

          projectStore.createIndex("by-updatedAt", "meta.updatedAt");
          projectStore.createIndex("by-ownerId", "meta.ownerId");
          projectStore.createIndex("by-syncStatus", "meta.syncStatus");
        }

        if (!db.objectStoreNames.contains("projectSummaries")) {
          const summaryStore = db.createObjectStore("projectSummaries", {
            keyPath: "id",
          });

          summaryStore.createIndex("by-updatedAt", "updatedAt");
          summaryStore.createIndex("by-syncStatus", "syncStatus");
        }
      },
    });
  }

  return dbPromise;
}

function toSummary(project: MaqamProjectDocument): MaqamProjectSummary {
  return {
    id: project.meta.id,
    title: project.meta.title,
    ownerId: project.meta.ownerId,
    bpm: project.meta.bpm,
    updatedAt: project.meta.updatedAt,
    syncStatus: project.meta.syncStatus,
    version: project.meta.version,
  };
}

export async function saveProjectLocal(
  project: MaqamProjectDocument
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["projects", "projectSummaries"], "readwrite");

  await Promise.all([
    tx.objectStore("projects").put(project),
    tx.objectStore("projectSummaries").put(toSummary(project)),
    tx.done,
  ]);
}

export async function getProjectLocal(
  projectId: string
): Promise<MaqamProjectDocument | null> {
  const db = await getDb();
  return (await db.get("projects", projectId)) ?? null;
}

export async function listProjectSummariesLocal(): Promise<MaqamProjectSummary[]> {
  const db = await getDb();

  const summaries = await db.getAllFromIndex(
    "projectSummaries",
    "by-updatedAt"
  );

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteProjectLocal(projectId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["projects", "projectSummaries"], "readwrite");

  await Promise.all([
    tx.objectStore("projects").delete(projectId),
    tx.objectStore("projectSummaries").delete(projectId),
    tx.done,
  ]);
}

export async function listDirtyProjectsLocal(): Promise<MaqamProjectDocument[]> {
  const db = await getDb();
  const all = await db.getAll("projects");

  return all.filter(
    (project) =>
      project.meta.syncStatus === "dirty" ||
      project.meta.syncStatus === "local-only" ||
      project.meta.syncStatus === "error"
  );
}
