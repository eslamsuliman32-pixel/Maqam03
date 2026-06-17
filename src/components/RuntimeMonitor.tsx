import React from 'react';
import { useShallow } from 'zustand/shallow';
import { useMaqamAnalysisStore } from '../maqam/store/maqamAnalysis.store';
import { Activity, Gauge, Cpu } from 'lucide-react';

export const RuntimeMonitor = () => {
  const { recomputeCount, lastTierExecuted, executionDurationMs, systemHealth } = useMaqamAnalysisStore(
    useShallow((state) => ({
      recomputeCount: state.recomputeCount,
      lastTierExecuted: state.lastTierExecuted,
      executionDurationMs: state.executionDurationMs,
      systemHealth: state.systemHealth
    }))
  );

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-xl bg-black/80 p-4 text-xs font-mono text-white backdrop-blur border border-white/10">
      <div className="mb-2 font-bold flex items-center gap-2">
        <Cpu size={14} /> MAQAM Runtime
      </div>
      <div className="space-y-1">
        <div>Status: <span className={systemHealth === 'healthy' ? 'text-green-500' : 'text-red-500'}>{systemHealth}</span></div>
        <div>Last Tier: {lastTierExecuted}</div>
        <div>Duration: {executionDurationMs.toFixed(2)}ms</div>
        <div>Recomputes: {recomputeCount}</div>
      </div>
    </div>
  );
};
