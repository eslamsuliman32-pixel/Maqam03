import Dexie, { Table } from 'dexie';

export interface StoredProject {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  audioFingerprint: string;
  bpm: number;
  duration: number;
  state: {
    textCells: any[];
    analysisResult: any;
    activeTab: string;
  };
  metadata: {
    artist?: string;
    title?: string;
    tags?: string[];
  };
}

export interface StoredAudioCache {
  id?: number;
  fingerprint: string;
  analysisResult: any;
  createdAt: Date;
  expiresAt: Date;
}

export class FlowLabDatabase extends Dexie {
  projects!: Table<StoredProject, number>;
  audioCache!: Table<StoredAudioCache, number>;

  constructor() {
    super('FlowLabDB');
    
    this.version(1).stores({
      projects: '++id, name, createdAt, updatedAt, audioFingerprint',
      audioCache: '++id, fingerprint, createdAt, expiresAt',
    });
  }
}

export const db = new FlowLabDatabase();
