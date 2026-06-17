import React, { useState } from "react";
import { FlowLab } from "../features/flowLab/components/FlowLab";
import { MelodicFlowWorkspace } from "./melodicFlow/MelodicFlowWorkspace";
import { TechnicalReportTab } from "./TechnicalReportTab";
import { UpcomingDevLab } from "./upcoming/UpcomingDevLab";
import { Sparkles, AudioLines, FileText, Settings } from "lucide-react";

export function FlowMethodologyHub() {
  const [activeSubTab, setActiveSubTab] = useState<'flowlab' | 'melodic-flow' | 'tech-report' | 'upcoming'>('flowlab');

  return (
    <div className="w-full flex flex-col h-full bg-[#05070d]">
      {/* Sub-navigation for Flow Methodology Tab */}
      <div className="flex items-center justify-center gap-4 p-4 border-b border-white/5 bg-[#0a0d14] flex-wrap">
        <button
          onClick={() => setActiveSubTab('flowlab')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeSubTab === 'flowlab'
              ? 'bg-gold-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          مستودع FlowLab (النطاق الرئيسي)
        </button>
        <button
          onClick={() => setActiveSubTab('melodic-flow')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeSubTab === 'melodic-flow'
              ? 'bg-sky-400 text-black shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <AudioLines className="w-4 h-4" />
          وحدة التدفق اللحني (Melodic Flow)
        </button>
        <button
          onClick={() => setActiveSubTab('tech-report')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeSubTab === 'tech-report'
              ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          التقرير الفني ومستند الأدوات (16 عنصر)
        </button>
        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeSubTab === 'upcoming'
              ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <Settings className="w-4 h-4" />
          بوابة الربط والتطوير المستقبلي (Dev Lab)
        </button>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-hidden ${activeSubTab === 'melodic-flow' ? 'p-0' : 'p-6'}`}>
        {activeSubTab === 'flowlab' && <FlowLab />}
        {activeSubTab === 'melodic-flow' && <MelodicFlowWorkspace />}
        {activeSubTab === 'tech-report' && <TechnicalReportTab />}
        {activeSubTab === 'upcoming' && <UpcomingDevLab />}
      </div>
    </div>
  );
}
