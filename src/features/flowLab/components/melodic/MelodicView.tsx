import React from 'react';
import { BeatWriterStudio } from '../../../../components/beatWriter/BeatWriterStudio';

export const MelodicView: React.FC = () => {
  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-white/5 bg-[#060810] shadow-2xl">
      <BeatWriterStudio />
    </div>
  );
};
