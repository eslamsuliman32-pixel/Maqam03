import { create } from "zustand";

interface PlaybackState {
  isPlaying: boolean;
  currentSec: number;
  currentPPQ: number;
  loopStartPPQ: number | null; // نقاط التكرار (خطوط حمراء)
  loopEndPPQ: number | null;
  setPosition: (sec: number, ppq: number) => void;
  setPlaying: (playing: boolean) => void;
  setLoop: (startPPQ: number | null, endPPQ: number | null) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  currentSec: 0,
  currentPPQ: 0,
  loopStartPPQ: null,
  loopEndPPQ: null,
  setPosition: (currentSec, currentPPQ) => set({ currentSec, currentPPQ }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setLoop: (loopStartPPQ, loopEndPPQ) => set({ loopStartPPQ, loopEndPPQ }),
}));
