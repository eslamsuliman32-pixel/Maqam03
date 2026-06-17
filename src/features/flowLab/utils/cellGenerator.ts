import type { AnalysisResult, FlowTextCell, CellType } from '../store/types';
import { v4 as uuidv4 } from 'uuid';

export function generateInitialCells(analysis: AnalysisResult): FlowTextCell[] {
  const cells: FlowTextCell[] = [];

  analysis.bars.forEach((bar, barIndex) => {
    bar.beats.forEach((beat, beatIndexInBar) => {
      // إنشاء خلية للنبضة نفسها
      const beatCell: FlowTextCell = {
        id: uuidv4(),
        startTime: beat.time,
        duration: 0.1, // مدة قصيرة للهجوم
        text: getDefaultTextForBeat(beat.type),
        type: 'consonant',
        linkedBeat: beat.type,
        confidence: beat.confidence,
        userEdited: false,
        barIndex,
      };
      cells.push(beatCell);

      // إضافة خلية مد بعد النبضة إذا كان هناك مساحة
      const nextBeatTime = bar.beats[beatIndexInBar + 1]?.time || bar.endTime;
      const gapDuration = nextBeatTime - beat.time - 0.1;

      if (gapDuration > 0.15) {
        const sustainCell: FlowTextCell = {
          id: uuidv4(),
          startTime: beat.time + 0.1,
          duration: gapDuration - 0.05,
          text: 'آ',
          type: 'vowel',
          linkedPitch: null,
          confidence: 0.5,
          userEdited: false,
          barIndex,
        };
        cells.push(sustainCell);
      }
    });
  });

  return cells.sort((a, b) => a.startTime - b.startTime);
}

function getDefaultTextForBeat(beatType: string): string {
  switch (beatType) {
    case 'kick':
      return 'بُ';
    case 'snare':
      return 'تْ';
    case 'hihat':
      return 'تس';
    default:
      return 'ك';
  }
}
