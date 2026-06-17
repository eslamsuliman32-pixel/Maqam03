/*
  StorageEngine — محرك التخزين الموحّد
  يدير: IndexedDB (أولوية) → LocalStorage (احتياط) → Memory (طارئ)
 */

import { openDB, IDBPDatabase, DBSchema } from "idb";

// ─── Schema ───────────────────────────────────────────────────────────────────
interface MaqamDBSchema extends DBSchema {
  stores: {
    key: string;
    value: StorageRecord;
    indexes: { "by-updated": number; "by-namespace": string };
  };
  syncqueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { "by-priority": number; "by-timestamp": number };
  };
  snapshots: {
    key: string;
    value: SnapshotRecord;
  };
}

export interface StorageRecord {
  key: string;
  namespace: string;
  payload: string;
  checksum: string;
  version: number;
  updatedAt: number;
  size: number;
}

export interface SyncQueueItem {
  id: string;
  storeKey: string;
  payload: string;
  checksum: string;
  priority: number;      // 0=critical, 1=high, 2=normal
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
  createdAt: number;
  status: "pending" | "syncing" | "failed" | "done";
}

export interface SnapshotRecord {
  key: string;
  snapshots: Array<{ timestamp: number; payload: string; checksum: string }>;
  maxSnapshots: number;
}

// ─── Engine ──────────────────────────────────────────────────────────────────
class StorageEngine {
  private db: IDBPDatabase<MaqamDBSchema> | null = null;
  private memoryCache = new Map<string, StorageRecord>();
  private initPromise: Promise<void> | null = null;
  private readonly DB_NAME = "maqam_storage_v4";
  private readonly DB_VERSION = 4;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = openDB<MaqamDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion) {
        // stores
        if (!db.objectStoreNames.contains("stores")) {
          const store = db.createObjectStore("stores", { keyPath: "key" });
          store.createIndex("by-updated", "updatedAt");
          store.createIndex("by-namespace", "namespace");
        }
        // syncqueue
        if (!db.objectStoreNames.contains("syncqueue")) {
          const queue = db.createObjectStore("syncqueue", { keyPath: "id" });
          queue.createIndex("by-priority", "priority");
          queue.createIndex("by-timestamp", "createdAt");
        }
        // snapshots
        if (!db.objectStoreNames.contains("snapshots")) {
          db.createObjectStore("snapshots", { keyPath: "key" });
        }
        // Migration من الإصدارات القديمة
        if (oldVersion < 4) {
          StorageEngine.migrateFromLegacy(db as any);
        }
      },
      blocked() {
        console.warn("[StorageEngine] DB blocked — requesting close of old version");
      },
      blocking() {
        console.warn("[StorageEngine] DB blocking newer version");
      },
    }).then((db) => {
      this.db = db;
    });

    return this.initPromise;
  }

  private static migrateFromLegacy(db: any) {
    // نقل البيانات القديمة من maqam-repository-storage / maqam-projects-storage
    const legacyKeys = [
      "maqam-repository-storage",
      "maqam-projects-storage",
    ];
    legacyKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        console.info(`[StorageEngine] Migrating legacy key: ${key}`);
        // تُكمل المزامنة لاحقاً عبر CloudSyncEngine
      }
    });
  }

  // ─── Checksum ───────────────────────────────────────────────────────────────
  async computeChecksum(data: string): Promise<string> {
    const buffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  }

  // ─── Read ────────────────────────────────────────────────────────────────────
  async get(key: string, namespace = "default"): Promise<StorageRecord | null> {
    await this.init();

    // 1. Memory cache (أسرع)
    const cacheKey = `${namespace}:${key}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // 2. IndexedDB
    try {
      const record = await this.db!.get("stores", cacheKey);
      if (record) {
        this.memoryCache.set(cacheKey, record);
        return record;
      }
    } catch (e) {
      console.warn("[StorageEngine] IDB read failed, falling back to localStorage", e);
    }

    // 3. LocalStorage احتياط
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        return {
          key: cacheKey,
          namespace,
          payload: raw,
          checksum: await this.computeChecksum(raw),
          version: 0,
          updatedAt: Date.now(),
          size: raw.length,
        };
      }
    } catch {}

    return null;
  }

  // ─── Write ───────────────────────────────────────────────────────────────────
  async set(
    key: string,
    payload: string,
    namespace = "default",
    version = 1
  ): Promise<StorageRecord> {
    await this.init();

    const checksum = await this.computeChecksum(payload);
    const cacheKey = `${namespace}:${key}`;

    // تحقق: إذا لم يتغير الـ checksum، لا نكتب (يوفر I/O)
    const existing = this.memoryCache.get(cacheKey);
    if (existing?.checksum === checksum) {
      return existing;
    }

    const record: StorageRecord = {
      key: cacheKey,
      namespace,
      payload,
      checksum,
      version,
      updatedAt: Date.now(),
      size: payload.length,
    };

    // كتابة في الكاش أولاً (Optimistic)
    this.memoryCache.set(cacheKey, record);

    // ثم IndexedDB
    try {
      await this.db!.put("stores", record);
    } catch (e) {
      console.warn("[StorageEngine] IDB write failed, using localStorage only", e);
      try {
        localStorage.setItem(key, payload);
      } catch {}
    }

    // Snapshot دوري (كل 10 تعديلات)
    await this.pushSnapshot(cacheKey, payload, checksum);

    return record;
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  async delete(key: string, namespace = "default"): Promise<void> {
    await this.init();
    const cacheKey = `${namespace}:${key}`;
    this.memoryCache.delete(cacheKey);
    try {
      await this.db!.delete("stores", cacheKey);
    } catch {}
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  // ─── Snapshots ───────────────────────────────────────────────────────────────
  private snapshotCounters = new Map<string, number>();

  private async pushSnapshot(
    key: string,
    payload: string,
    checksum: string
  ): Promise<void> {
    const count = (this.snapshotCounters.get(key) ?? 0) + 1;
    this.snapshotCounters.set(key, count);
    if (count % 10 !== 0) return; // snapshot كل 10 كتابات

    try {
      const existing = (await this.db!.get("snapshots", key)) ?? {
        key,
        snapshots: [],
        maxSnapshots: 5,
      };
      existing.snapshots.push({ timestamp: Date.now(), payload, checksum });
      if (existing.snapshots.length > existing.maxSnapshots) {
        existing.snapshots = existing.snapshots.slice(-existing.maxSnapshots);
      }
      await this.db!.put("snapshots", existing);
    } catch {}
  }

  async getLatestSnapshot(key: string, namespace = "default"): Promise<string | null> {
    await this.init();
    const cacheKey = `${namespace}:${key}`;
    try {
      const record = await this.db!.get("snapshots", cacheKey);
      if (record?.snapshots.length) {
        return record.snapshots[record.snapshots.length - 1].payload;
      }
    } catch {}
    return null;
  }

  // ─── Sync Queue ──────────────────────────────────────────────────────────────
  async enqueueSyncItem(item: Omit<SyncQueueItem, "id">): Promise<string> {
    await this.init();
    const id = `${item.storeKey}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await this.db!.put("syncqueue", { ...item, id });
    return id;
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    await this.init();
    const now = Date.now();
    const all = await this.db!.getAllFromIndex("syncqueue", "by-priority");
    return all
      .filter((i) => i.status === "pending" && i.nextRetryAt <= now)
      .sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
  }

  async updateSyncItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    await this.init();
    const item = await this.db!.get("syncqueue", id);
    if (item) {
      await this.db!.put("syncqueue", { ...item, ...updates });
    }
  }

  async clearSyncItem(id: string): Promise<void> {
    await this.init();
    await this.db!.delete("syncqueue", id);
  }
}

export const storageEngine = new StorageEngine();
