import React, { useRef, useEffect, useState } from 'react';
import { useFlowLabStore } from '../store/flowLabSlice';
import { Activity, Clock, Layers, Hash } from 'lucide-react';

export const BeatGridOverview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 48 });

  const analysisResult = useFlowLabStore((state) => state.analysisResult);
  const audioDuration = useFlowLabStore((state) => state.audioDuration);
  const canvasViewport = useFlowLabStore((state) => state.canvasViewport);
  const setViewport = useFlowLabStore((state) => state.setViewport);

  // Read viewport zoom
  const zoom = canvasViewport.zoom || 1;
  const viewDuration = 10 / zoom;
  const viewportStart = canvasViewport.startTime;
  const viewportEnd = viewportStart + viewDuration;

  // Track resizing dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.max(entry.contentRect.width, 300),
          height: 48
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Redraw canvas overview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analysisResult || audioDuration <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Draw Bars/Segments background blocks alternating
    const bars = analysisResult.bars || [];
    bars.forEach((bar, idx) => {
      const xStart = (bar.startTime / audioDuration) * width;
      const xEnd = (bar.endTime / audioDuration) * width;
      const barWidth = xEnd - xStart;

      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(xStart, 0, barWidth, height);

      // Simple small text for bar index
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '8px monospace';
      ctx.fillText(`${idx + 1}`, xStart + 4, 12);
    });

    // Draw Beats (Kicks, snares, etc) as short tick indicators
    const beats = analysisResult.beatGrid || [];
    beats.forEach((beat) => {
      const x = (beat.time / audioDuration) * width;
      
      let color = 'rgba(255, 255, 255, 0.2)';
      let thickness = 1;
      let heightRatio = 0.4;

      if (beat.type === 'kick') {
        color = '#D4A017'; // Gold
        thickness = 1.5;
        heightRatio = 0.7;
      } else if (beat.type === 'snare') {
        color = 'rgba(255, 255, 255, 0.4)';
        thickness = 1;
        heightRatio = 0.55;
      }

      ctx.fillStyle = color;
      ctx.fillRect(
        x - thickness / 2, 
        height - height * heightRatio, 
        thickness, 
        height * heightRatio
      );
    });

    // Highlight the active viewport window as a gold slider bounding box
    const viewStartRatio = viewportStart / audioDuration;
    const viewEndRatio = Math.min(viewportEnd / audioDuration, 1);

    const sliderX = viewStartRatio * width;
    const sliderWidth = (viewEndRatio - viewStartRatio) * width;

    // Semi-transparent overlay for visible region
    ctx.fillStyle = 'rgba(212, 160, 23, 0.08)';
    ctx.fillRect(sliderX, 0, sliderWidth, height);

    // Frame Borders
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sliderX, 0, sliderWidth, height);

  }, [analysisResult, audioDuration, dimensions, viewportStart, viewportEnd]);

  // Viewport navigation via clicking/dragging on mini-map canvas
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || audioDuration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickRatio = x / rect.width;
    const targetStartTime = clickRatio * audioDuration;

    // Centering the visible view duration window
    const newStartTime = Math.max(0, Math.min(targetStartTime - viewDuration / 2, audioDuration - viewDuration));
    setViewport({ startTime: newStartTime, endTime: newStartTime + viewDuration });
  };

  if (!analysisResult) return null;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* HUD Info Metrics bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 py-1 px-1 text-right">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <div>
              <span className="text-[10px] text-text-muted block">المدة الإجمالية للبيت</span>
              <span className="text-xs font-mono font-bold text-text-primary">
                {audioDuration.toFixed(2)} ثانية
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/5" />

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold-400" />
            <div>
              <span className="text-[10px] text-text-muted block">نبضات الإيقاع (BPM)</span>
              <span className="text-xs font-mono font-bold text-text-primary">
                {analysisResult.globalTempo.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/5" />

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold-400" />
            <div>
              <span className="text-[10px] text-text-muted block">حساب الموازير الكلي (Bars)</span>
              <span className="text-xs font-mono font-bold text-text-primary">
                {analysisResult.bars.length} موازير موسيقية
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/5" />

          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gold-400" />
            <div>
              <span className="text-[10px] text-text-muted block">الوزن العروضي</span>
              <span className="text-xs font-mono font-bold text-text-primary">
                {analysisResult.timeSignature}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-text-muted font-sans font-medium">
          تم ديسيماتور نبضات Offbeat ومطابقة أوتار الآلة القائدة
        </div>
      </div>

      {/* Mini-map Slider Canvas */}
      <div 
        ref={containerRef}
        onClick={handleTimelineClick}
        className="relative bg-[#0a0d14] rounded-xl border border-white/5 hover:border-gold-400/20 transition-all cursor-pointer h-12 overflow-hidden select-none"
        title="انقر للتنقل السريع عبر المسار الكامل للبيت الموسيقي"
      >
        <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
      </div>
    </div>
  );
};
