import { LocalAudioAnalyzer } from './localAnalyzer';
import { CloudAudioAnalyzer } from './cloudAnalyzer';
import type { AnalysisResult } from '../../store/types';

export class HybridAnalysisPipeline {
  private localAnalyzer: LocalAudioAnalyzer;
  private cloudAnalyzer: CloudAudioAnalyzer;

  constructor() {
    this.localAnalyzer = new LocalAudioAnalyzer();
    this.cloudAnalyzer = new CloudAudioAnalyzer();
  }

  async analyze(
    audioFile: File,
    audioBuffer: AudioBuffer,
    useCloud: boolean,
    onProgress: (progress: number, stage: string) => void
  ): Promise<AnalysisResult> {
    if (useCloud) {
      onProgress(0, 'analyzing-cloud');
      try {
        return await this.cloudAnalyzer.analyze(audioFile, (p) => onProgress(p, 'analyzing-cloud'));
      } catch (err) {
        console.warn('Cloud analysis failed, falling back to local analysis:', err);
        onProgress(0, 'analyzing-local');
        return await this.localAnalyzer.analyze(audioBuffer, (p) => onProgress(p, 'analyzing-local'));
      }
    } else {
      onProgress(0, 'analyzing-local');
      return await this.localAnalyzer.analyze(audioBuffer, (p) => onProgress(p, 'analyzing-local'));
    }
  }
}
