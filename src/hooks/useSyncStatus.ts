/*
  useSyncStatus — يوفر حالة المزامنة لأي مكوّن
 */

import { useState, useEffect, useCallback } from "react";
import { cloudSyncEngine } from "../services/CloudSyncEngine";
import { useRepositoryStore } from "../store/repositoryStore";

export interface SyncStatusInfo {
  status: "idle" | "syncing" | "error" | "offline";
  lastSyncedAt: number | null;
  hydrationSource: "local" | "cloud" | "snapshot" | null;
  isOnline: boolean;
  forceSync: () => Promise<void>;
  rehydrateFromCloud: () => Promise<void>;
}

export function useSyncStatus(): SyncStatusInfo {
  const [engineStatus, setEngineStatus] = useState(cloudSyncEngine.getStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Assuming these fields are available in useRepositoryStore after the next changes
  const lastSyncedAt = useRepositoryStore((s: any) => s.lastSyncedAt);
  const hydrationSource = useRepositoryStore((s: any) => s.hydrationSource);
  const forceSync = useRepositoryStore((s: any) => s.forceSync);
  const rehydrateFromCloud = useRepositoryStore((s: any) => s.rehydrateFromCloud);

  useEffect(() => {
    const unsub = cloudSyncEngine.onStatusChange(setEngineStatus);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      unsub();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleForceSync = useCallback(async () => {
    if (forceSync) await forceSync();
  }, [forceSync]);

  return {
    status: engineStatus,
    lastSyncedAt: lastSyncedAt ?? null,
    hydrationSource: hydrationSource ?? null,
    isOnline,
    forceSync: handleForceSync,
    rehydrateFromCloud: rehydrateFromCloud || (async () => {}),
  };
}
