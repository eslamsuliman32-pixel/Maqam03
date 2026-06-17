/*
  CloudSyncEngine — محرك المزامنة السحابية من الجيل الرابع
  ─────────────────────────────────────────────────────────
  المميزات:
    • Vector Clock لحل تعارضات البيانات
    • Adaptive Debounce بناءً على حجم البيانات
    • Exponential Backoff مع Jitter للـ Retry
    • GZIP Compression للحزم > 20KB
    • Atomic writes عبر Firestore Transactions
    • Offline Queue مستمرة حتى بعد إعادة التشغيل
 */

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp,
  Firestore,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { storageEngine } from "../lib/storage/StorageEngine";

// ─── Types ────────────────────────────────────────────────────────────────────
interface VectorClock {
  [nodeId: string]: number;
}

interface CloudRecord {
  payload: string;
  isCompressed: boolean;
  checksum: string;
  vectorClock: VectorClock;
  schemaVersion: number;
  updatedAtServer: Timestamp | null;
  updatedAtClient: number;
  namespace: string;
}

interface SyncOptions {
  namespace?: string;
  priority?: 0 | 1 | 2;
  maxRetries?: number;
  debounceMs?: number;
  enableRealtime?: boolean;
}

type SyncStatus = "idle" | "syncing" | "error" | "offline";

type SyncListener = (status: SyncStatus, key?: string) => void;

// ─── Compression ─────────────────────────────────────────────────────────────
const compress = async (str: string): Promise<string> => {
  const stream = new Response(str).body!.pipeThrough(
    new CompressionStream("gzip")
  );
  const buffer = await new Response(stream).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const decompress = async (b64: string): Promise<string> => {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const stream = new Response(bytes).body!.pipeThrough(
    new DecompressionStream("gzip")
  );
  return new Response(stream).text();
};

// ─── Vector Clock ────────────────────────────────────────────────────────────
const nodeId = (() => {
  const stored = localStorage.getItem("maqamnodeid");
  if (stored) return stored;
  const id = `node_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem("maqamnodeid", id);
  return id;
})();

const tickClock = (clock: VectorClock): VectorClock => ({
  ...clock,
  [nodeId]: (clock[nodeId] ?? 0) + 1,
});

/*
  مقارنة ساعتين:
   1  = local أحدث
  -1  = remote أحدث
   0  = متزامنتان
   2  = تعارض حقيقي (Conflict)
 */
const compareClock = (local: VectorClock, remote: VectorClock): -1 | 0 | 1 | 2 => {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  let localNewer = false;
  let remoteNewer = false;

  for (const k of keys) {
    const l = local[k] ?? 0;
    const r = remote[k] ?? 0;
    if (l > r) localNewer = true;
    if (r > l) remoteNewer = true;
  }

  if (localNewer && remoteNewer) return 2;  // Conflict
  if (localNewer) return 1;
  if (remoteNewer) return -1;
  return 0;
};

const mergeClock = (a: VectorClock, b: VectorClock): VectorClock => {
  const merged: VectorClock = { ...a };
  for (const k of Object.keys(b)) {
    merged[k] = Math.max(merged[k] ?? 0, b[k]);
  }
  return merged;
};

// ─── Engine ──────────────────────────────────────────────────────────────────
class CloudSyncEngine {
  private db: Firestore;
  private vectorClocks = new Map<string, VectorClock>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingPayloads = new Map<string, string>();
  private realtimeUnsubscribers = new Map<string, () => void>();
  private status: SyncStatus = "idle";
  private listeners: Set<SyncListener> = new Set();
  private isOnline = navigator.onLine;
  private processingQueue = false;
  private readonly COMPRESSIONTHRESHOLD = 20480; // 20KB
  private readonly SCHEMAVERSION = 4;

  constructor() {
    this.db = db;
    this.setupNetworkListeners();
    this.startQueueProcessor();
  }

  // ─── Network ────────────────────────────────────────────────────────────────
  private setupNetworkListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.setStatus("idle");
      this.processQueue(); // استئناف القائمة فور عودة الشبكة
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.setStatus("offline");
    });
  }

  private setStatus(s: SyncStatus, key?: string) {
    this.status = s;
    this.listeners.forEach((l) => l(s, key));
  }

  onStatusChange(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  // ─── Debounce Adaptif ────────────────────────────────────────────────────────
  private computeDebounce(payloadSize: number, userDebounce?: number): number {
    if (userDebounce !== undefined) return userDebounce;
    // صغير < 10KB → 800ms | متوسط < 50KB → 1500ms | كبير → 3000ms
    if (payloadSize < 10240) return 800;
    if (payloadSize < 51200) return 1500;
    return 3000;
  }

  // ─── Schedule Write ──────────────────────────────────────────────────────────
  schedule(
    key: string,
    payload: string,
    options: SyncOptions = {}
  ): void {
    const { namespace = "default", debounceMs, priority = 2, maxRetries = 5 } = options;

    // حفظ محلي فوري (Optimistic)
    storageEngine
      .set(key, payload, namespace)
      .catch((e) => console.error("[CloudSync] Local write failed", e));

    // تحديث الـ pending payload للـ key
    this.pendingPayloads.set(key, payload);

    // إلغاء الـ timer القديم
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    const delay = this.computeDebounce(payload.length, debounceMs);

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(key);
      const latestPayload = this.pendingPayloads.get(key);
      if (!latestPayload) return;
      this.pendingPayloads.delete(key);

      if (!this.isOnline) {
        // أضف للقائمة المستمرة
        await this.enqueueForLater(key, latestPayload, namespace, priority, maxRetries);
        return;
      }

      await this.pushToCloud(key, latestPayload, namespace, priority, maxRetries);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  // ─── Push To Cloud ───────────────────────────────────────────────────────────
  private async pushToCloud(
    key: string,
    payload: string,
    namespace: string,
    priority: number,
    maxRetries: number
  ): Promise<void> {
    const authUser = auth.currentUser;
    const userId = authUser?.uid;
    if (!userId) return;

    this.setStatus("syncing", key);

    try {
      const checksum = await storageEngine.computeChecksum(payload);
      const existingClock = this.vectorClocks.get(key) ?? {};
      const newClock = tickClock(existingClock);

      const isCompressed = payload.length > this.COMPRESSIONTHRESHOLD;
      const finalPayload = isCompressed ? await compress(payload) : payload;

      const ref = doc(this.db, "users", userId, "stores", `${namespace}_${key}`);

      await runTransaction(this.db, async (tx) => {
        const snap = await tx.get(ref);

        if (snap.exists()) {
          const remote = snap.data() as CloudRecord;
          const comparison = compareClock(newClock, remote.vectorClock ?? {});

          if (comparison === 0) {
            // متزامنان — لا حاجة للكتابة
            this.setStatus("idle", key);
            return;
          }

          if (comparison === 2) {
            // تعارض: نطبق سياسة "الأحدث زمنياً يفوز" مع دمج الـ Clock
            const remoteTime = remote.updatedAtClient ?? 0;
            const localTime = Date.now();
            if (remoteTime > localTime) {
              // السحابة أحدث → نتجاهل التحديث المحلي ونجلب السحابي
              console.warn(`[CloudSync] Conflict on ${key}: remote wins`);
              await this.pullAndApply(ref, key, namespace);
              return;
            }
            // المحلي أحدث → نكمل الكتابة مع دمج الـ Clock
            const mergedClock = mergeClock(newClock, remote.vectorClock ?? {});
            const record: CloudRecord = {
              payload: finalPayload,
              isCompressed,
              checksum,
              vectorClock: tickClock(mergedClock),
              schemaVersion: this.SCHEMAVERSION,
              updatedAtServer: serverTimestamp() as Timestamp,
              updatedAtClient: Date.now(),
              namespace,
            };
            tx.set(ref, record);
            this.vectorClocks.set(key, record.vectorClock);
            return;
          }
        }

        // لا يوجد سجل سابق أو المحلي أحدث
        const record: CloudRecord = {
          payload: finalPayload,
          isCompressed,
          checksum,
          vectorClock: newClock,
          schemaVersion: this.SCHEMAVERSION,
          updatedAtServer: serverTimestamp() as Timestamp,
          updatedAtClient: Date.now(),
          namespace,
        };
        tx.set(ref, record);
        this.vectorClocks.set(key, newClock);
      });

      this.setStatus("idle", key);
    } catch (error: any) {
      console.error("[CloudSync] Push failed", error);
      this.setStatus("error", key);
      // أضف للقائمة للمحاولة لاحقاً
      await this.enqueueForLater(key, payload, namespace, priority, maxRetries);
    }
  }

  // ─── Pull From Cloud ─────────────────────────────────────────────────────────
  async pullFromCloud(key: string, namespace = "default"): Promise<string | null> {
    const authUser = auth.currentUser;
    const userId = authUser?.uid;
    if (!userId) return null;

    try {
      const ref = doc(this.db, "users", userId, "stores", `${namespace}_${key}`);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return await this.extractPayload(snap.data() as CloudRecord, key);
    } catch (e) {
      console.error("[CloudSync] Pull failed", e);
      return null;
    }
  }

  private async pullAndApply(
    ref: any,
    key: string,
    namespace: string
  ): Promise<void> {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const remote = snap.data() as CloudRecord;
    const payload = await this.extractPayload(remote, key);
    if (payload) {
      await storageEngine.set(key, payload, namespace, remote.schemaVersion);
      this.vectorClocks.set(key, remote.vectorClock ?? {});
    }
  }

  private async extractPayload(
    record: CloudRecord,
    key: string
  ): Promise<string | null> {
    try {
      let payload = record.isCompressed
        ? await decompress(record.payload)
        : record.payload;

      // تحقق من سلامة البيانات
      const checksum = await storageEngine.computeChecksum(payload);
      if (checksum !== record.checksum) {
        console.error(`[CloudSync] Checksum mismatch for ${key}! Data may be corrupted.`);
        return null;
      }

      if (record.vectorClock) {
        this.vectorClocks.set(key, record.vectorClock);
      }

      return payload;
    } catch (e) {
      console.error("[CloudSync] Failed to extract payload", e);
      return null;
    }
  }

  // ─── Offline Queue ───────────────────────────────────────────────────────────
  private async enqueueForLater(
    key: string,
    payload: string,
    namespace: string,
    priority: number,
    maxRetries: number
  ): Promise<void> {
    const checksum = await storageEngine.computeChecksum(payload);
    await storageEngine.enqueueSyncItem({
      storeKey: key,
      payload,
      checksum,
      priority,
      retryCount: 0,
      maxRetries,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
      status: "pending",
    });
  }

  // ─── Queue Processor ─────────────────────────────────────────────────────────
  private startQueueProcessor() {
    setInterval(() => this.processQueue(), 15000); // فحص كل 15 ثانية
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isOnline) return;
    const authUser = auth.currentUser;
    const userId = authUser?.uid;
    if (!userId) return;

    this.processingQueue = true;

    try {
      const items = await storageEngine.getPendingSyncItems();
      if (!items.length) return;

      for (const item of items) {
        await storageEngine.updateSyncItem(item.id, { status: "syncing" });

        try {
          await this.pushToCloud(item.storeKey, item.payload, "default", item.priority, 0);
          await storageEngine.clearSyncItem(item.id);
        } catch {
          const retryCount = item.retryCount + 1;
          if (retryCount >= item.maxRetries) {
            await storageEngine.updateSyncItem(item.id, { status: "failed" });
          } else {
            // Exponential Backoff مع Jitter
            const jitter = Math.random() * 1000;
            const delay = Math.min(1000 * Math.pow(2, retryCount) + jitter, 60000);
            await storageEngine.updateSyncItem(item.id, {
              status: "pending",
              retryCount,
              nextRetryAt: Date.now() + delay,
            });
          }
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  // ─── Realtime Listener ───────────────────────────────────────────────────────
  subscribeRealtime(
    key: string,
    namespace = "default",
    onUpdate: (payload: string) => void
  ): () => void {
    const authUser = auth.currentUser;
    const userId = authUser?.uid;
    if (!userId) return () => {};

    const ref = doc(this.db, "users", userId, "stores", `${namespace}_${key}`);

    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists() || snap.metadata.hasPendingWrites) return;

        const remote = snap.data() as CloudRecord;
        const localRecord = await storageEngine.get(key, namespace);
        const localClock = this.vectorClocks.get(key) ?? {};
        const comparison = compareClock(localClock, remote.vectorClock ?? {});

        // تحديث فقط إذا كانت السحابة أحدث
        if (comparison === -1 || comparison === 2) {
          const payload = await this.extractPayload(remote, key);
          if (payload) {
            await storageEngine.set(key, payload, namespace, remote.schemaVersion);
            onUpdate(payload);
          }
        }
      },
      (error) => {
        console.error("[CloudSync] Realtime listener error", error);
      }
    );

    this.realtimeUnsubscribers.set(`${namespace}:${key}`, unsub);
    return unsub;
  }

  unsubscribeRealtime(key: string, namespace = "default") {
    const k = `${namespace}:${key}`;
    this.realtimeUnsubscribers.get(k)?.();
    this.realtimeUnsubscribers.delete(k);
  }

  unsubscribeAll() {
    this.realtimeUnsubscribers.forEach((unsub) => unsub());
    this.realtimeUnsubscribers.clear();
  }
}

export const cloudSyncEngine = new CloudSyncEngine();
