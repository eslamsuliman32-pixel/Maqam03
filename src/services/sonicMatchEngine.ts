// src/services/sonicMatchEngine.ts
import type { Bar, SonicFingerprint, SonicMatchGroup } from "../types/sonic";

// توكنات الألوان من نظام التصميم (Tailwind tokens) — لا ألوان صريحة
const PALETTE = [
  "match-1", "match-2", "match-3", "match-4",
  "match-5", "match-6", "match-7", "match-8",
];

/** تشابه تقريبي (Levenshtein مُطبّع) لالتقاط القوافي والتكرار اللفظي */
const similarity = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return 1 - d[m][n] / Math.max(m, n);
};

const MATCH_THRESHOLD = 0.7; // عتبة "التطابق التقريبي"

/**
 * بناء البصمة الصوتية: تجميع المقاطع المتشابهة صوتياً وتخصيص لون لكل مجموعة.
 * دالة خالصة — تُستدعى من المتجر فقط.
 */
export const buildFingerprint = (verseId: string, bars: Bar[]): SonicFingerprint => {
  const groups: SonicMatchGroup[] = [];
  const cellGroupMap: Record<string, string> = {};

  const allSegments = bars.flatMap((bar) =>
    bar.segments.map((seg) => ({ seg, barIndex: bar.index }))
  );

  for (const { seg } of allSegments) {
    // ابحث عن مجموعة قائمة تتطابق صوتياً
    const group = groups.find(
      (g) => similarity(g.phoneticKey, seg.phoneticKey) >= MATCH_THRESHOLD
    );

    if (group) {
      group.occurrences += 1;
      seg.matchGroupId = group.id;
      cellGroupMap[seg.id] = group.id;
    } else {
      const newGroup: SonicMatchGroup = {
        id: crypto.randomUUID(),
        phoneticKey: seg.phoneticKey,
        color: PALETTE[groups.length % PALETTE.length],
        occurrences: 1,
      };
      groups.push(newGroup);
      seg.matchGroupId = newGroup.id;
      cellGroupMap[seg.id] = newGroup.id;
    }
  }

  // لوّن فقط المجموعات المتكررة فعلاً (التطابق يتطلب تكراراً)
  const repeated = groups.filter((g) => g.occurrences > 1);
  for (const g of groups) {
    if (g.occurrences === 1) {
      for (const { seg } of allSegments) {
        if (seg.matchGroupId === g.id) {
          seg.matchGroupId = null;
          delete cellGroupMap[seg.id];
        }
      }
    }
  }

  return { verseId, groups: repeated, cellGroupMap };
};
