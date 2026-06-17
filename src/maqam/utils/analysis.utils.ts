
export function calculateInputFingerprint(bars: { id: string; text: string, section: string }[]): string {
  // Simple hash to track changes efficiently
  return bars.map(b => `${b.id}:${b.text}:${b.section}`).join('|');
}
