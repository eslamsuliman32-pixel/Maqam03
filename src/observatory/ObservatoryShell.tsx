"use client";
import React, { Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PanelRightOpen, Filter, X, Loader2 } from 'lucide-react';

import type { Bar } from '../types';
import type { TableFilters, ObservatoryContextValue } from './observatoryTypes';
import { buildDerivedBars, applyCrossFilter } from './observatoryFilters';
import { useObservatoryStore } from './useObservatoryStore';
import { ObservatoryProvider } from './ObservatoryContext';
import { LensSwitcher } from './LensSwitcher';
import { CompanionPanel } from './CompanionPanel';
import { resolveLensComponent } from './lensRegistry';
import { BarRepositoryDisplay } from '../components/BarRepositoryDisplay';

type RepoProps = React.ComponentProps<typeof BarRepositoryDisplay>;

interface ObservatoryShellProps {
  bars: Bar[];
  filters: TableFilters;
  repositoryProps: Omit<RepoProps, 'bars'>;
}

export const ObservatoryShell: React.FC<ObservatoryShellProps> = ({
  bars, filters, repositoryProps,
}) => {
  const activeLens     = useObservatoryStore((s) => s.activeLens);
  const companionOpen  = useObservatoryStore((s) => s.companionOpen);
  const vizSelection   = useObservatoryStore((s) => s.vizSelection);
  const setLens        = useObservatoryStore((s) => s.setLens);
  const toggleCompanion = useObservatoryStore((s) => s.toggleCompanion);
  const brush          = useObservatoryStore((s) => s.brush);
  const clearBrush     = useObservatoryStore((s) => s.clearBrush);

  const crossFilteredBars = useMemo(
    () => applyCrossFilter(bars, vizSelection),
    [bars, vizSelection]
  );

  const derivedBars = useMemo(
    () => buildDerivedBars(bars, filters, vizSelection),
    [bars, filters, vizSelection]
  );

  const ctxValue: ObservatoryContextValue = useMemo(
    () => ({ derivedBars, vizSelection, brush, clearBrush, activeLens }),
    [derivedBars, vizSelection, brush, clearBrush, activeLens]
  );

  const isTable = activeLens === 'table';
  const LensComponent = useMemo(() => resolveLensComponent(activeLens), [activeLens]);

  // groupMode: Observatory adds 'sonic' which BarRepositoryDisplay doesn't know; map it to 'none'
  const safeGroupMode = (filters.groupMode === 'sonic' ? 'none' : filters.groupMode) as RepoProps['groupMode'];

  return (
    <ObservatoryProvider value={ctxValue}>
      <div dir="rtl" className="w-full h-full flex flex-col gap-4">

        {/* شريط مبدّل العدسات + breadcrumb + زر اللوحة */}
        <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <LensSwitcher activeLens={activeLens} onChange={setLens} />

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {vizSelection && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20"
                >
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-amber-300 font-bold font-arabic">
                    مُصفّى من: {vizSelection.source.label}
                  </span>
                  <button onClick={clearBrush} className="p-0.5 rounded-md text-amber-400 hover:bg-amber-400/20 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!companionOpen && (
              <button
                onClick={() => toggleCompanion(true)}
                className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-white/30 hover:text-amber-400 transition-colors"
                title="إظهار النظرة الحيّة"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* المنطقة الرئيسية: العدسة + اللوحة الرفيقة */}
        <div className="flex-1 min-h-0 flex gap-4">
          <div className="flex-1 min-w-0 overflow-hidden">
            {isTable ? (
              <BarRepositoryDisplay
                {...repositoryProps}
                bars={crossFilteredBars}
                groupMode={safeGroupMode}
              />
            ) : (
              <Suspense fallback={
                <div className="w-full h-full min-h-[420px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
              }>
                <LensComponent />
              </Suspense>
            )}
          </div>

          <AnimatePresence>
            {companionOpen && (
              <CompanionPanel
                derivedBars={derivedBars}
                vizSelection={vizSelection}
                onClearBrush={clearBrush}
                onClose={() => toggleCompanion(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </ObservatoryProvider>
  );
};
