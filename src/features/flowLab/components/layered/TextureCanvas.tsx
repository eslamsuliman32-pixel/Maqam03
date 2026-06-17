import React, { useRef, useEffect, useState } from 'react';
import { useFlowLabStore } from '../../store/flowLabSlice';
import { Layers, Volume2, Activity, Play, Plus, Trash2, Edit2 } from 'lucide-react';

interface EditingState {
  cellId: string;
  type: 'attack' | 'sustain';
}

export const TextureCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  // Selector pattern for maximum stability
  const textCells = useFlowLabStore((state) => state.textCells);
  const analysisResult = useFlowLabStore((state) => state.analysisResult);
  const activeLeadInstrument = useFlowLabStore((state) => state.activeLeadInstrument);
  const canvasViewport = useFlowLabStore((state) => state.canvasViewport);
  
  const updateCellText = useFlowLabStore((state) => state.updateCellText);
  const selectCell = useFlowLabStore((state) => state.selectCell);
  const addSpike = useFlowLabStore((state) => state.addSpike);
  const removeSpike = useFlowLabStore((state) => state.removeSpike);
  const selectedCellIds = useFlowLabStore((state) => state.selectedCellIds);

  const leadCurves = analysisResult?.leadCurves || [];
  const beatGrid = analysisResult?.beatGrid || [];

  // Resize listener for fluid responsive canvas width inside Maqam Applet
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.max(entry.contentRect.width, 300),
          height: 400
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const zoom = canvasViewport.zoom || 1;
  const viewDuration = 10 / zoom;
  const startTime = canvasViewport.startTime;
  const endTime = startTime + viewDuration;

  // Redraw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    const halfHeight = height / 2;

    // Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0d14'; // Dark luxury bg
    ctx.fillRect(0, 0, width, height);

    // Center divider line with Arabic artistic touch
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.15)'; // Slate/Gold
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(width, halfHeight);
    ctx.stroke();

    // Top gridlines for melodic pitch scale
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (halfHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Bottom gridlines for amplitude/intensity scale
    for (let i = 1; i < 4; i++) {
      const y = halfHeight + (halfHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw active lead curve in upper half (Melody / Vowels layer)
    const activeCurve = leadCurves.find(c => c.instrument === activeLeadInstrument);
    if (activeCurve && activeCurve.dataPoints && activeCurve.dataPoints.length > 0) {
      // Area Fill Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, halfHeight);
      gradient.addColorStop(0, 'rgba(212, 160, 23, 0.06)');
      gradient.addColorStop(1, 'rgba(212, 160, 23, 0.00)');

      ctx.fillStyle = gradient;
      ctx.beginPath();

      let pointsStarted = false;
      activeCurve.dataPoints.forEach((point) => {
        if (point.time < startTime || point.time > endTime) return;
        const x = ((point.time - startTime) / viewDuration) * width;
        
        const minFreq = 80;
        const maxFreq = 800;
        const clampedFreq = Math.max(minFreq, Math.min(point.frequency, maxFreq));
        const ratioY = 1 - (clampedFreq - minFreq) / (maxFreq - minFreq);
        const y = ratioY * (halfHeight - 30) + 15; // padding top and bottom

        if (!pointsStarted) {
          ctx.moveTo(x, halfHeight);
          ctx.lineTo(x, y);
          pointsStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      });

      if (pointsStarted) {
        ctx.lineTo(width, halfHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Stroke Line
      ctx.strokeStyle = '#D4A017'; // Maqam gold
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(212, 160, 23, 0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      pointsStarted = false;
      activeCurve.dataPoints.forEach((point) => {
        if (point.time < startTime || point.time > endTime) return;
        const x = ((point.time - startTime) / viewDuration) * width;
        const minFreq = 80;
        const maxFreq = 800;
        const clampedFreq = Math.max(minFreq, Math.min(point.frequency, maxFreq));
        const ratioY = 1 - (clampedFreq - minFreq) / (maxFreq - minFreq);
        const y = ratioY * (halfHeight - 30) + 15;

        if (!pointsStarted) {
          ctx.moveTo(x, y);
          pointsStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      });

      if (pointsStarted) {
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // Reset
    }

    // Draw active rhythm beats (Kicks, Snares, Hats) in the lower half (Attacks / Consonants layer)
    beatGrid.forEach((beat) => {
      if (beat.time < startTime || beat.time > endTime) return;
      const x = ((beat.time - startTime) / viewDuration) * width;

      // Draw thin vertical alignment path lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, halfHeight);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      const colors = {
        kick: '#cc3333',     // Crimson
        snare: '#3b82f6',    // Electro blue
        hihat: '#eab308',    // Vibrant yellow
        other: '#64748b',    // Slate
      };

      const intensityHeight = beat.intensity * (halfHeight - 40);
      const barY = height - intensityHeight - 15;

      ctx.fillStyle = colors[beat.type] || colors.other;
      ctx.fillRect(x - 3, barY, 6, intensityHeight);

      // Draw dot header
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, barY, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw background blocks for active text cells
    textCells.forEach((cell) => {
      if (cell.startTime + cell.duration < startTime || cell.startTime > endTime) return;

      const x = ((cell.startTime - startTime) / viewDuration) * width;
      const cellWidth = (cell.duration / viewDuration) * width;

      let bgColor = 'rgba(255, 255, 255, 0.01)';
      let borderClr = 'rgba(255, 255, 255, 0.05)';

      if (cell.spike?.active) {
        bgColor = 'rgba(212, 160, 23, 0.08)'; // Golden glow
        borderClr = 'rgba(212, 160, 23, 0.25)';
      } else if (cell.type === 'vowel') {
        bgColor = 'rgba(212, 160, 23, 0.03)';
        borderClr = 'rgba(212, 160, 23, 0.1)';
      } else if (cell.type === 'combo') {
        bgColor = 'rgba(168, 85, 247, 0.04)';
        borderClr = 'rgba(168, 85, 247, 0.15)';
      }

      ctx.fillStyle = bgColor;
      ctx.fillRect(Math.max(0, x), 0, cellWidth, height);

      ctx.strokeStyle = borderClr;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.max(0, x), 0, cellWidth, height);
    });

  }, [leadCurves, activeLeadInstrument, beatGrid, textCells, canvasViewport, dimensions]);

  // Handle double click to inject/remove pitch spikes dynamically
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickTime = startTime + (x / canvas.width) * viewDuration;

    // Search for matching cell under mouse coordinates
    const cell = textCells.find(
      c => clickTime >= c.startTime && clickTime <= c.startTime + c.duration
    );

    if (cell) {
      if (cell.spike?.active) {
        removeSpike(cell.id);
      } else {
        // Upper half vowel cell spike
        const intensity = Math.max(0.3, Math.min(1, 1 - (y / (dimensions.height / 2))));
        addSpike(cell.id, intensity);
      }
    }
  };

  return (
    <div className="bg-bg-surface/50 border border-white/5 rounded-2xl p-5 space-y-4" dir="rtl" ref={containerRef}>
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Layers className="w-4 h-4 text-gold-400 animate-pulse" />
          <span>المخطط المساحي لتعدد التصويت ونبر الطبول (Layered Texture Chart)</span>
        </h3>
        <span className="text-[10px] text-text-muted font-sans font-bold bg-[#0a0d14] px-2.5 py-1 rounded-lg border border-white/5">
          الطبقة النشطة: {activeLeadInstrument || 'Synth'}
        </span>
      </div>

      <div className="relative h-[400px] bg-bg-base/60 rounded-xl overflow-hidden border border-white/5 select-none">
        {/* Draw Canvas */}
        <canvas
          ref={canvasRef}
          onDoubleClick={handleDoubleClick}
          className="absolute inset-0 block w-full h-full cursor-crosshair text-right"
        />

        {/* Floating HTML overlay to edit attack/sustain syllables */}
        <div className="absolute inset-0 pointer-events-none">
          {textCells
            .filter((cell) => cell.startTime + cell.duration >= startTime && cell.startTime <= endTime)
            .map((cell) => {
              const leftPercent = ((cell.startTime - startTime) / viewDuration) * 100;
              const widthPercent = (cell.duration / viewDuration) * 100;

              // Split into attack Syllable and sustain modulation (separated by | )
              const parts = cell.text.split('|');
              const attackText = parts[0] || '';
              const sustainText = parts[1] || parts[0] || '';

              const isSelected = selectedCellIds.includes(cell.id);
              const isHovered = hoveredCellId === cell.id;

              return (
                <div
                  key={cell.id}
                  style={{
                    left: `${Math.max(0, Math.min(leftPercent, 98.5))}%`,
                    width: `${Math.max(2, widthPercent)}%`,
                  }}
                  onMouseEnter={() => setHoveredCellId(cell.id)}
                  onMouseLeave={() => setHoveredCellId(null)}
                  className={`absolute top-0 bottom-0 pointer-events-auto border-r border-dashed border-white/5 transition-all flex flex-col justify-between p-2 select-none ${
                    isHovered ? 'bg-white/[0.04]' : ''
                  }`}
                >
                  {/* UPPER HALF: SUSTAIN PITCH / DEEP VOWEL MODULATION */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      selectCell(cell.id);
                      setEditing({ cellId: cell.id, type: 'sustain' });
                    }}
                    className={`h-[48%] rounded-lg flex flex-col items-center justify-center border cursor-pointer select-none transition-all ${
                      editing?.cellId === cell.id && editing.type === 'sustain'
                        ? 'bg-[#0a0d14] border-gold-400 text-gold-300 ring-2 ring-gold-400/20'
                        : isSelected
                        ? 'bg-gold-400/10 border-gold-400/50 text-gold-200'
                        : 'bg-white/[0.01] hover:bg-white/5 border-white/5 text-text-primary'
                    }`}
                  >
                    {editing?.cellId === cell.id && editing.type === 'sustain' ? (
                      <input
                        type="text"
                        autoFocus
                        defaultValue={sustainText}
                        maxLength={8}
                        onBlur={(e) => {
                          const newText = attackText ? `${attackText}|${e.target.value}` : e.target.value;
                          updateCellText(cell.id, newText);
                          setEditing(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full bg-[#0a0d14] text-xs font-bold text-center text-gold-400 outline-none p-1 border border-white/5 rounded"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-xs font-black text-gold-400 font-sans tracking-wide">
                          {sustainText || '—'}
                        </span>
                        {cell.spike?.active && (
                          <span className="block text-[8px] text-red-400 font-sans font-bold bg-red-400/10 rounded-full px-1.5 py-0.5 mt-0.5">
                            نبر: {Math.round(cell.spike.intensity * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* LOWER HALF: TRANSIENT ATTACK / RHYTHMIC CONSONANT */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      selectCell(cell.id);
                      setEditing({ cellId: cell.id, type: 'attack' });
                    }}
                    className={`h-[48%] rounded-lg flex flex-col items-center justify-center border cursor-pointer select-none transition-all ${
                      editing?.cellId === cell.id && editing.type === 'attack'
                        ? 'bg-[#0a0d14] border-purple-400 text-purple-300'
                        : isSelected
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                        : 'bg-white/[0.01] hover:bg-white/5 border-white/5 text-text-primary'
                    }`}
                  >
                    {editing?.cellId === cell.id && editing.type === 'attack' ? (
                      <input
                        type="text"
                        autoFocus
                        defaultValue={attackText}
                        maxLength={6}
                        onBlur={(e) => {
                          const newText = `${e.target.value}|${sustainText}`;
                          updateCellText(cell.id, newText);
                          setEditing(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-full bg-[#0a0d14] text-xs font-bold text-center text-purple-400 outline-none p-1 border border-white/10 rounded"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-xs font-black text-purple-400 font-sans">
                          {attackText || '—'}
                        </span>
                        {cell.linkedBeat && (
                          <span className="block text-[7px] text-text-muted mt-0.5 font-mono">
                            {cell.linkedBeat.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-text-muted gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-gold-400" />
            <span>النصف العلوي: طبقة المد والمتحركات (Syllable Sustain)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-purple-500" />
            <span>النصف السفلي: طبقة النبر والسواكن (Transient Attack)</span>
          </div>
        </div>
        <div className="text-[10px]">
          <span>تلميح: انقر نقراً مزدوجاً على الخلية لمغنطة مسمار نبري نغامي 🚀</span>
        </div>
      </div>
    </div>
  );
};
