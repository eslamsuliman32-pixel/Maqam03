/*
  createPersistStorage — يصل بين Zustand persist والـ CloudSyncEngine
  يدعم الـ Hydration الذكي: محلي فوري + سحابي في الخلفية
 */

import { StateStorage } from "zustand/middleware";
import { storageEngine } from "./StorageEngine";
import { cloudSyncEngine } from "../../services/CloudSyncEngine";
import { auth } from "../firebase";

export interface PersistStorageOptions {
  namespace?: string;
  priority?: 0 | 1 | 2;
  maxRetries?: number;
  debounceMs?: number;
  enableRealtime?: boolean;
  onHydrated?: (source: "local" | "cloud" | "snapshot") => void;
  onSyncError?: (error: Error) => void;
}

export const createPersistStorage = (
  options: PersistStorageOptions = {}
): StateStorage => {
  const {
    namespace = "default",
    priority = 2,
    maxRetries = 5,
    debounceMs,
    onHydrated,
    onSyncError,
  } = options;

  return {
    // ─── getItem: استرجاع ذكي ───────────────────────────────────────────────
    getItem: async (key: string): Promise<string | null> => {
      // 1. استرجاع محلي فوري (يرسم الواجهة بلا تأخير)
      const localRecord = await storageEngine.get(key, namespace);
      const localPayload = localRecord?.payload ?? null;

      if (localPayload) {
        onHydrated?.("local");
      }

      // 2. في الخلفية: جلب السحابي ومقارنته
      const isLoggedIn = !!auth.currentUser;
      if (isLoggedIn) {
        (async () => {
          try {
            const cloudPayload = await cloudSyncEngine.pullFromCloud(key, namespace);

            if (!cloudPayload) return;

            // إذا لم يكن هناك محلي، استخدم السحابي مباشرة
            if (!localPayload) {
              await storageEngine.set(key, cloudPayload, namespace);
              onHydrated?.("cloud");
              return;
            }

            // مقارنة الـ checksum: إذا تطابقا لا داعي للتحديث
            const cloudChecksum = await storageEngine.computeChecksum(cloudPayload);
            if (cloudChecksum === localRecord?.checksum) return;

            // السحابي مختلف — طبّق الـ rehydration
            await storageEngine.set(key, cloudPayload, namespace);
            onHydrated?.("cloud");

            // أعلم الـ Store بالتحديث (Zustand rehydrate)
            const storeKey = `_maqamrehydrate_${key}`;
            window.dispatchEvent(
              new CustomEvent(storeKey, { detail: { payload: cloudPayload } })
            );
          } catch (e) {
            onSyncError?.(e as Error);
          }
        })();
      }

      // 3. احتياط: snapshot
      if (!localPayload) {
        const snapshot = await storageEngine.getLatestSnapshot(key, namespace);
        if (snapshot) {
          onHydrated?.("snapshot");
          return snapshot;
        }
      }

      return localPayload;
    },

    // ─── setItem: حفظ مع مزامنة ─────────────────────────────────────────────
    setItem: async (key: string, value: string): Promise<void> => {
      // لا نكتب إذا كانت القيمة فارغة أو JSON فارغ
      if (!value || value === "{}" || value === "null") return;

      cloudSyncEngine.schedule(key, value, {
        namespace,
        priority,
        maxRetries,
        debounceMs,
      });
    },

    // ─── removeItem ──────────────────────────────────────────────────────────
    removeItem: async (key: string): Promise<void> => {
      await storageEngine.delete(key, namespace);
    },
  };
};
