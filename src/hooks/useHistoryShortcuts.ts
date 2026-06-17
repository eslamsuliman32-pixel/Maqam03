import { useEffect } from "react";
import { useHistoryStore } from "../store/historyStore";

export const useHistoryShortcuts = () => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) {
        useHistoryStore.getState().redo();
      } else {
        useHistoryStore.getState().undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
};
