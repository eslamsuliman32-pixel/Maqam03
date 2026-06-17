import React from 'react';
import { PercussiveCanvas } from './PercussiveCanvas';
import { VocalKitPalette } from './VocalKitPalette';
import { RhymeLocker } from './RhymeLocker';
import { IntensificationTool } from './IntensificationTool';

export const PercussiveView: React.FC = () => {
  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h2 className="text-sm font-black text-text-primary">مسار العمل الإيقاعي والصوتي (Percussive Action Board)</h2>
        <p className="text-[11px] text-text-muted mt-0.5">
          مُعايرة نبض الإيقاع، وإضافة اللمسات اللفظية الإيقاعية ومزامنة القوافي.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PercussiveCanvas />
          <VocalKitPalette />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <RhymeLocker />
          <IntensificationTool />
        </div>
      </div>
    </div>
  );
};
