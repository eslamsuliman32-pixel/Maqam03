import React, { useRef, useEffect, useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Play, ZoomIn, ZoomOut, Maximize2, Layers, Check, Edit2 } from 'lucide-react';

export const MelodicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  const textCells = useFlowLabStore((state) => state.textCells);
  const analysisResult = useFlowLabStore((state) => state.analysisResult);
  const activeLeadInstrument = useFlowLabStore((state) => state.activeLeadInstrument);
  const canvasViewport = useFlowLabStore((state) => state.canvasViewport);
  const editingCellId = useFlowLabStore((state) => state.editingCellId);
  
  const selectCell = useFlowLabStore((state) => state.selectCell);
  const startEditCell = useFlowLabStore((state) => state.startEditCell);
  const commitCellEdit = useFlowLabStore((state) => state.commitCellEdit);
  const updateCellText = useFlowLabStore((state) => state.updateCellText);
  const selectedCellIds = useFlowLabStore((state) => state.selectedCellIds);
  const zoomIn = useFlowLabStore((state) => state.zoomIn);
  const zoomOut = useFlowLabStore((state) => state.zoomOut);
  const resetZoom = useFlowLabStore((state) => state.resetZoom);

  // Resize listener using ResizeObserver to ensure fit
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.max(entry.contentRect.width, 300),
          height: 280
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate view duration based on viewport zoom
  const zoom = canvasViewport.zoom || 1;
  const viewDuration = 10 / zoom;
  const startTime = canvasViewport.startTime;
  const endTime = startTime + viewDuration;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Grid lines background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;

    // Horizontal grid lines representation
    const gridRows = 6;
    for (let i = 1; i < gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical beat lines representing transients
    if (analysisResult && analysisResult.beatGrid) {
      analysisResult.beatGrid.forEach((beat) => {
        if (beat.time < startTime || beat.time > endTime) return;

        const ratio = (beat.time - startTime) / viewDuration;
        const x = ratio * width;

        ctx.strokeStyle = beat.type === 'kick' ? 'rgba(212, 160, 23, 0.15)' : 'rgba(255, 255, 255, 0.04)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw lead pitch frequencies/curves
    if (analysisResult && analysisResult.leadCurves) {
      const activeCurve = analysisResult.leadCurves.find(
        (c) => c.instrument === activeLeadInstrument
      );

      if (activeCurve && activeCurve.dataPoints && activeCurve.dataPoints.length > 0) {
        ctx.strokeStyle = '#D4A017'; // Maqam Premium Gold Color
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(212, 160, 23, 0.5)';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        let pointsStarted = false;
        activeCurve.dataPoints.forEach((pt) => {
          if (pt.time < startTime || pt.time > endTime) return;

          const ratioX = (pt.time - startTime) / viewDuration;
          const x = ratioX * width;

          // frequency bounds mapping: 80Hz - 800Hz
          const freqMin = 80;
          const freqMax = 800;
          const clampedFreq = Math.max(freqMin, Math.min(pt.frequency, freqMax));
          const ratioY = 1 - (clampedFreq - freqMin) / (freqMax - freqMin);
          const y = ratioY * (height - 60) + 20;

          if (!pointsStarted) {
            ctx.moveTo(x, y);
            pointsStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      }
    }
  }, [analysisResult, activeLeadInstrument, dimensions, startTime, endTime, viewDuration]);

  // Handle cell click
  const handleCellClick = (cellId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectCell(cellId);
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4" dir="rtl" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
          <h3 className="text-xs font-bold text-text-primary">مخطط الترددات والمنحنى اللحني التفاعلي</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted font-mono bg-white/5 px-2.5 py-0.5 rounded-lg">
            ZOOM: {zoom.toFixed(1)}x
          </span>
          <span className="text-[10px] text-gold-400 font-mono bg-gold-400/10 border border-gold-400/20 px-2 py-0.5 rounded-lg font-bold">
            {activeLeadInstrument || "لا توجد آلة قائدة"}
          </span>
        </div>
      </div>

      {/* Canvas container with HTML overlay */}
      <div className="relative h-72 bg-bg-base/60 rounded-xl overflow-hidden border border-white/5 select-none">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

        {/* Absolute layer of text cells aligned to timespans */}
        <div className="absolute inset-0 pointer-events-auto">
          {textCells
            .filter((cell) => cell.startTime + cell.duration >= startTime && cell.startTime <= endTime)
            .map((cell) => {
              const leftPercent = ((cell.startTime - startTime) / viewDuration) * 100;
              const widthPercent = (cell.duration / viewDuration) * 100;

              const isSelected = selectedCellIds.includes(cell.id);
              const isEditing = editingCellId === cell.id;
              const isHovered = hoveredCellId === cell.id;

              return (
                <div
                  key={cell.id}
                  style={{
                    left: `${Math.max(0, Math.min(leftPercent, 98))}%`,
                    width: `${Math.max(1.5, widthPercent)}%`,
                  }}
                  onMouseEnter={() => setHoveredCellId(cell.id)}
                  onMouseLeave={() => setHoveredCellId(null)}
                  onClick={(e) => handleCellClick(cell.id, e)}
                  className={`absolute bottom-6 h-14 rounded-xl flex flex-col items-center justify-center transition-all px-2 border cursor-pointer ${
                    isEditing
                      ? 'bg-gold-400/20 border-gold-400 text-gold-200 ring-2 ring-gold-400/30'
                      : isSelected
                      ? 'bg-gold-500/15 border-gold-400/80 text-gold-200'
                      : isHovered
                      ? 'bg-white/10 border-white/20 text-text-primary'
                      : cell.type === 'vowel'
                      ? 'bg-gold-400/10 border-gold-400/20 text-gold-300'
                      : 'bg-white/[0.02] border-white/5 text-text-secondary'
                  }`}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={cell.text}
                      autoFocus
                      maxLength={12}
                      onChange={(e) => updateCellText(cell.id, e.target.value)}
                      onBlur={commitCellEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitCellEdit();
                      }}
                      className="w-full bg-[#0a0d14] text-xs font-bold text-center text-gold-400 rounded px-1.5 py-1 outline-none border border-gold-400"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm font-black tracking-wide font-sans">{cell.text || '—'}</span>
                      <span className="text-[8px] opacity-60 font-mono mt-0.5">{cell.startTime.toFixed(2)}s</span>
                    </div>
                  )}

                  {/* Tiny pencil/indicator icon on hover */}
                  {isHovered && !isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditCell(cell.id);
                      }}
                      className="absolute -top-2.5 -right-1 bg-gold-400 hover:bg-gold-500 text-[#0f172a] p-1 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Edit2 className="w-2.4 h-2.4" />
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-text-muted">
        <div>
          <span>النافذة المعروضة: </span>
          <span className="font-mono font-bold text-text-secondary">{startTime.toFixed(2)}s</span>
          <span> إلى </span>
          <span className="font-mono font-bold text-text-secondary">{endTime.toFixed(2)}s</span>
          <span className="mr-3">| المدة الإجمالية: {viewDuration.toFixed(1)} ثوانِ</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomIn}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-gold-400/10 hover:text-gold-300 border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="تكبير البعد الإجرائي لحجم الخطوات"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>تكبير</span>
          </button>
          <button
            onClick={zoomOut}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-gold-400/10 hover:text-gold-300 border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="تصغير البعد الإجرائي"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span>تصغير</span>
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 bg-[#0a0d14] text-text-muted hover:text-text-primary rounded-xl text-xs transition-all border border-white/5 cursor-pointer"
          >
            إعادة تعيين البعد
          </button>
        </div>
      </div>
    </div>
  );
};
