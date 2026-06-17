import { usePlaybackStore } from "../../store/playbackStore";
import { useBeatAnalysisStore } from "../../store/beatAnalysisStore";
import { secondsToPpq, ppqToSeconds } from "../../services/timeMapping";

export class PlaybackEngine {
  private audio?: HTMLAudioElement;
  private rafId = 0;
  private lastTime = 0;
  private isVirtual = false;

  constructor(audio?: HTMLAudioElement) {
    if (audio) {
      this.audio = audio;
    } else {
      this.isVirtual = true;
    }
  }

  play() {
    usePlaybackStore.getState().setPlaying(true);
    if (!this.isVirtual && this.audio) {
      void this.audio.play();
    }
    this.lastTime = performance.now();
    this.loop();
  }

  pause() {
    usePlaybackStore.getState().setPlaying(false);
    if (!this.isVirtual && this.audio) {
      this.audio.pause();
    }
    cancelAnimationFrame(this.rafId);
  }

  seekToPPQ(ppq: number) {
    const grid = useBeatAnalysisStore.getState().beatGrid;
    const bpm = grid?.tempoMap[0]?.bpm ?? 140; // fallback to 140
    let sec = (ppq / 960) * (60 / bpm);
    if (grid) {
      sec = ppqToSeconds(ppq, grid);
    }

    if (!this.isVirtual && this.audio) {
      this.audio.currentTime = sec;
    }
    usePlaybackStore.getState().setPosition(sec, ppq);
  }

  destroy() {
    this.pause();
  }

  private loop = () => {
    const now = performance.now();
    const grid = useBeatAnalysisStore.getState().beatGrid;
    const bpm = grid?.tempoMap[0]?.bpm ?? 140; // fallback to 140

    let sec = 0;
    let ppq = 0;

    if (!this.isVirtual && this.audio) {
      sec = this.audio.currentTime;
      if (grid) {
        ppq = secondsToPpq(sec, grid);
      } else {
        ppq = (sec / (60 / bpm)) * 960;
      }
    } else {
      // ساعة افتراضية دقيقة في الخفاء لمنع توقف التفاعل
      const currentPos = usePlaybackStore.getState().currentSec;
      const deltaSec = (now - this.lastTime) / 1000;
      sec = currentPos + deltaSec;
      if (grid) {
        ppq = secondsToPpq(sec, grid);
      } else {
        ppq = (sec / (60 / bpm)) * 960;
      }
    }
    this.lastTime = now;

    const { loopStartPPQ, loopEndPPQ } = usePlaybackStore.getState();

    // التكرار: العودة لبداية الحلقة عند بلوغ نهايتها
    if (loopEndPPQ !== null && loopStartPPQ !== null && ppq >= loopEndPPQ) {
      this.seekToPPQ(loopStartPPQ);
    } else {
      usePlaybackStore.getState().setPosition(sec, ppq);
    }

    const playing = usePlaybackStore.getState().isPlaying;
    if (playing) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };
}
