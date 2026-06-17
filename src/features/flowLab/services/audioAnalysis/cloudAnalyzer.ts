import type { AnalysisResult } from '../../store/types';

export class CloudAudioAnalyzer {
  private apiEndpoint: string;

  constructor(endpoint: string = '/api/analyze') {
    this.apiEndpoint = endpoint;
  }

  async analyze(
    audioFile: File,
    onProgress: (progress: number) => void
  ): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloud analysis failed with status ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textSample = await response.text();
      console.error('Invalid cloud response (expected JSON):', textSample.slice(0, 300));
      throw new Error('Received invalid non-JSON response from cloud analyzer.');
    }

    const result = await response.json();
    onProgress(100);

    return result;
  }
}
