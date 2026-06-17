import React from 'react';
import { TextureCanvas } from './TextureCanvas';
import { VocalAssignmentMatrix } from './VocalAssignmentMatrix';
import { SpikeMarkerPanel } from './SpikeMarkerPanel';
import { AutoSpikeSuggestion } from './AutoSpikeSuggestion';

export const LayeredView: React.FC = () => {
  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h2 className="text-sm font-black text-text-primary">مسار العمل العروضي والطبقي (Layered & Prosody Panel)</h2>
        <p className="text-[11px] text-text-muted mt-0.5">
          تحكّم في طبقات الصوت، ومواضع النبر الصائت والمتحرك، وتنسيق الأداء الصوتي.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TextureCanvas />
          <VocalAssignmentMatrix />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <SpikeMarkerPanel />
          <AutoSpikeSuggestion />
        </div>
      </div>
    </div>
  );
};
