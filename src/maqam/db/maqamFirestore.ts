import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { firestoreDb } from "../../firebase/firebaseApp";
import { handleFirestoreError, OperationType } from "../../lib/firebase";
import type {
  MaqamProjectDocument,
  MaqamProjectSummary,
} from "../types/project.types";

const COLLECTION_NAME = "maqamProjects";

type FirestoreProjectPayload = MaqamProjectDocument & {
  firestoreUpdatedAt?: unknown;
};

function projectRef(projectId: string) {
  return doc(firestoreDb, COLLECTION_NAME, projectId);
}

function collectionRef() {
  return collection(firestoreDb, COLLECTION_NAME);
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

export async function saveProjectRemote(
  project: MaqamProjectDocument
): Promise<void> {
  const payload: FirestoreProjectPayload = {
    ...project,
    meta: {
      ...project.meta,
      syncStatus: "synced",
    },
    firestoreUpdatedAt: serverTimestamp(),
  };

  const ref = projectRef(project.meta.id);
  try {
    await setDoc(ref, payload, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ref.path);
  }
}

export async function getProjectRemote(
  projectId: string
): Promise<MaqamProjectDocument | null> {
  const ref = projectRef(projectId);
  try {
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) return null;

    const data = snapshot.data() as FirestoreProjectPayload;

    const { firestoreUpdatedAt: _firestoreUpdatedAt, ...project } = data;

    return project;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ref.path);
    return null;
  }
}

export async function listProjectSummariesRemote(params?: {
  ownerId?: string | null;
  max?: number;
}): Promise<MaqamProjectSummary[]> {
  const constraints = [];

  if (params?.ownerId) {
    constraints.push(where("meta.ownerId", "==", params.ownerId));
  }

  constraints.push(orderBy("meta.updatedAt", "desc"));
  constraints.push(limit(params?.max ?? 50));

  const q = query(collectionRef(), ...constraints);
  try {
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as FirestoreProjectPayload;
      return toSummary(data);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export async function deleteProjectRemote(projectId: string): Promise<void> {
  const ref = projectRef(projectId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ref.path);
  }
}
