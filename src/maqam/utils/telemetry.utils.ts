
export type TelemetryLog = {
  timestamp: string;
  source: string;
  data: Record<string, any>;
};

export const logExecution = (
  source: string,
  executed: string[],
  skipped: string[],
  reason: string,
  durationMs: number
) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'EXECUTION_TRACE',
    source,
    data: {
      executed,
      skipped,
      reason,
      durationMs
    }
  }, null, 2));
};

export const logEngineFingerprint = (
  engine: string,
  fingerprintChanged: boolean,
  action: 'recompute' | 'skip'
) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'FINGERPRINT_VERIFICATION',
    engine,
    data: {
      fingerprintChanged,
      action
    }
  }, null, 2));
};

export const logZustandDiff = (
  updatedSlices: string[],
  untouchedSlices: string[]
) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'ZUSTAND_DIFF',
    data: {
      updatedSlices,
      untouchedSlices
    }
  }, null, 2));
};
