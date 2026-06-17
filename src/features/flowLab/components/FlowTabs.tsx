import React from 'react';
import { Music, Layers, Zap, Sparkles } from 'lucide-react';
import { useFlowLabStore } from '../store/flowLabSlice';
import type { FlowLabTab } from '../store/types';

export const FlowTabs: React.FC = () => {
  const activeTab = useFlowLabStore((state) => state.activeTab);
  const setActiveTab = useFlowLabStore((state) => state.setActiveTab);

  const tabs: { id: FlowLabTab; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'melodic',
      label: 'التدفق اللحني (Melodic Flow)',
      desc: 'محاكاة الآلة القائدة الفردية ومخارج النبر',
      icon: <Music className="w-4 h-4" />
    },
    {
      id: 'layered',
      label: 'التدفق العروضي الطبقي (Layered Prosody)',
      desc: 'دعامة المسامير والنبرات والمقاطع الطويلة',
      icon: <Layers className="w-4 h-4" />
    },
    {
      id: 'percussive',
      label: 'نبض الإيقاف (Percussive Lock)',
      desc: 'قاعدة الإيقاع ومطابقة القافية على الترانزيت',
      icon: <Zap className="w-4 h-4" />
    },
    {
      id: 'elite',
      label: 'نبض النخبة المطور (Elite Flow)',
      desc: 'مستودع تدفق النخبة المطور ديسيماتور v2.0',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />
    }
  ];

  return (
    <div className="flex border-b border-white/5 text-right w-full" dir="rtl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center gap-3 p-4 transition-all border-b-2 outline-none cursor-pointer ${
              isActive
                ? 'border-gold-400 bg-gold-400/5 text-gold-300'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-white/[0.02]'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-gold-400/20 text-gold-400' : 'bg-transparent text-text-muted'}`}>
              {tab.icon}
            </div>
            <div>
              <div className="text-xs font-bold font-sans">{tab.label}</div>
              <div className="text-[10px] text-text-muted mt-0.5">{tab.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
