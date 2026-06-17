import { useLyricsStore } from "../store/lyricsStore";
import { useAlignmentStore } from "../store/alignmentStore";
import { useBeatAnalysisStore } from "../store/beatAnalysisStore";
import { useHistoryStore } from "../store/historyStore";
import { buildSyllableAlignment } from "./alignmentEngine";
import { ppqToSeconds } from "./timeMapping";

const SNAP_16TH = 240; // 960 / 4

const snap = (ppq: number) => Math.round(ppq / SNAP_16TH) * SNAP_16TH;

/**
 * يحرّك مقطعاً لفظياً إلى موضع PPQ جديد ويعيد تقييم محاذاته.
 * يعلّمه manual=true (عبر buildSyllableAlignment) ليُرسم أزرق (تعديل يدوي).
 */
export const commitSyllableMove = (syllableId: string, newStartPPQ: number) => {
  // Capture before modifying state
  useHistoryStore.getState().capture("Syllable Move");

  const snapped = Math.max(0, snap(newStartPPQ));
  const grid = useBeatAnalysisStore.getState().beatGrid;
  const oldSyllable = useLyricsStore.getState().syllables[syllableId];
  if (!oldSyllable) return;

  const durationPPQ = oldSyllable.offsetPPQ - oldSyllable.onsetPPQ;

  // 1. حساب الثواني بناءً على الشبكة إن وجِدت
  let startSec = oldSyllable.onsetSeconds;
  let endSec = oldSyllable.offsetSeconds;
  if (grid) {
    startSec = ppqToSeconds(snapped, grid);
    endSec = ppqToSeconds(snapped + durationPPQ, grid);
  } else {
    startSec = snapped / 960 * 0.5;
    endSec = startSec + (oldSyllable.offsetSeconds - oldSyllable.onsetSeconds);
  }

  // 2. تحديث التوقيت في مصدر الحقيقة (الـ Store)
  useLyricsStore.getState().updateSyllableTiming(
    syllableId,
    snapped,
    snapped + durationPPQ,
    startSec,
    endSec
  );

  // 3. إعادة حساب المحاذاة وتخزينها
  const updatedSyllable = useLyricsStore.getState().syllables[syllableId];
  const oldAlignment = useAlignmentStore.getState().alignments[syllableId];
  const barId = oldAlignment?.barId ?? "default_bar";

  if (updatedSyllable && grid) {
    const newAlignment = buildSyllableAlignment(updatedSyllable, barId, grid);
    // تأكيد تعيينها كـ manual لإضاءة المحاذاة باللون الأزرق (COLOR_MANUAL)
    newAlignment.alignmentSource = "manual";
    useAlignmentStore.getState().upsertAlignment(newAlignment);
  }
};
