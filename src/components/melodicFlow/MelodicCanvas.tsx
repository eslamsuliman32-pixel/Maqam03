"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useMaqamFlowStore,
  InstrumentId,
  FlowCell,
  FrequencyPoint,
} from "../../store/maqamFlowLabStore";

// ════════════════════════════════════════════════════
//              CANVAS CONSTANTS
// ════════════════════════════════════════════════════

const FREQ_MIN = 80;
const FREQ_MAX = 800;
const GRID_COLOR = "rgba(255,255,255,0.04)";
const BEAT_COLOR = "rgba(212,160,23,0.15)";
const CROWDING_COLOR = "rgba(239,68,68,0.12)";

const INSTRUMENT_COLORS: Record<InstrumentId, string> = {
  "synth-lead": "#D4A017",
  strings: "#7C3AED",
  brass: "#DC2626",
  "vocal-lead": "#059669",
  oud: "#B45309",
  percussion: "#0891B2",
};

// ════════════════════════════════════════════════════
//              MELODIC CANVAS COMPONENT
// ════════════════════════════════════════════════════

export const MelodicCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const {
    analysisResult,
    canvasViewport,
    activeLeadInstrument,
    flowCells,
    isAnalyzing,
    actions,
  } = useMaqamFlowStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverFreq, setHoverFreq] = useState<number | null>(null);

  // ── حساب النافذة الزمنية ──
  const { startTime, zoom } = canvasViewport;
  const viewDuration = useMemo(() => 10 / zoom, [zoom]);
  const endTime = useMemo(() => startTime + viewDuration, [startTime, viewDuration]);

  // ════════════════════════════════════════════════════
  //              DRAW ENGINE
  // ════════════════════════════════════════════════════

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // ── مسح القماش ──
    ctx.clearRect(0, 0, W, H);

    // ── خلفية متدرجة ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "rgba(8,8,16,1)");
    bgGrad.addColorStop(1, "rgba(12,10,24,1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const timeToX = (t: number) =>
      ((t - startTime) / viewDuration) * (W / devicePixelRatio);

    const freqToY = (f: number) => {
      const clamped = Math.max(FREQ_MIN, Math.min(f, FREQ_MAX));
      return (H / devicePixelRatio) * (1 - (clamped - FREQ_MIN) / (FREQ_MAX - FREQ_MIN));
    };

    // ── شبكة الإيقاع ──
    drawGrid(ctx, W / devicePixelRatio, H / devicePixelRatio, startTime, endTime, viewDuration);

    // ── مناطق الازدحام ──
    if (analysisResult?.crowdingZones) {
      drawCrowdingZones(ctx, analysisResult.crowdingZones, timeToX, H / devicePixelRatio);
    }

    // ── منحنيات الآلات الثانوية (خافتة) ──
    if (analysisResult?.leadCurves) {
      analysisResult.leadCurves
        .filter((c) => c.instrument !== activeLeadInstrument)
        .forEach((curve) => {
          drawCurve(ctx, curve.dataPoints, timeToX, freqToY, {
            color: INSTRUMENT_COLORS[curve.instrument],
            alpha: 0.12,
            lineWidth: 1,
            glow: false,
          }, W / devicePixelRatio);
        });

      // ── المنحنى النشط (ذهبي بارز) ──
      const activeCurve = analysisResult.leadCurves.find(
        (c) => c.instrument === activeLeadInstrument
      );
      if (activeCurve && activeCurve.dataPoints.length > 0) {
        drawCurve(ctx, activeCurve.dataPoints, timeToX, freqToY, {
          color: INSTRUMENT_COLORS[activeLeadInstrument],
          alpha: 1,
          lineWidth: 2.5,
          glow: true,
        }, W / devicePixelRatio);

        // ── تظليل تحت المنحنى ──
        drawCurveFill(ctx, activeCurve.dataPoints, timeToX, freqToY, W / devicePixelRatio, H / devicePixelRatio, {
          color: INSTRUMENT_COLORS[activeLeadInstrument],
        });
      }
    }

    // ── خلايا الفلو المرصوفة ──
    flowCells.forEach((cell) => {
      drawFlowCell(ctx, cell, timeToX, H / devicePixelRatio);
    });

    // ── خط مؤشر الوقت الحالي ──
    drawPlayhead(ctx, timeToX(startTime + viewDuration / 2), H / devicePixelRatio);

    // ── خط مؤشر الحوم (Hover) ──
    if (hoverTime !== null) {
      drawHoverLine(ctx, timeToX(hoverTime), hoverFreq, H / devicePixelRatio, FREQ_MIN, FREQ_MAX, W / devicePixelRatio);
    }

    // ── مؤشرات الترددات على المحور Y ──
    drawFrequencyAxis(ctx, H / devicePixelRatio);

  }, [
    analysisResult,
    activeLeadInstrument,
    startTime,
    viewDuration,
    endTime,
    flowCells,
    hoverTime,
    hoverFreq,
  ]);

  // ── حلقة الرسم ──
  useEffect(() => {
    const loop = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // ── تكييف حجم القماش ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      canvas.width = entry.contentRect.width * devicePixelRatio;
      canvas.height = entry.contentRect.height * devicePixelRatio;
      canvas.style.width = `${entry.contentRect.width}px`;
      canvas.style.height = `${entry.contentRect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.scale(devicePixelRatio, devicePixelRatio);
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  // ════════════════════════════════════════════════════
  //              EVENT HANDLERS
  // ════════════════════════════════════════════════════

  const getTimeFromX = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return 0;
      const rect = canvas.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return startTime + ratio * viewDuration;
    },
    [startTime, viewDuration]
  );

  const getFreqFromY = useCallback(
    (clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return 0;
      const rect = canvas.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      return FREQ_MIN + ratio * (FREQ_MAX - FREQ_MIN);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const time = getTimeFromX(e.clientX);
      setHoverTime(time);
      setHoverFreq(getFreqFromY(e.clientY));
      if (isDragging) {
        const delta = dragStart - time;
        actions.panViewport(delta * 0.3);
      }
    },
    [isDragging, dragStart, getTimeFromX, getFreqFromY, actions]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      actions.setZoom(canvasViewport.zoom + delta);
    },
    [canvasViewport.zoom, actions]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const t = getTimeFromX(e.clientX);
      actions.addCell({
        startTime: t,
        duration: 0.4,
        text: "دندنة",
        type: "word",
        intensity: "medium",
        isAnchored: true,
      });
    },
    [getTimeFromX, actions]
  );

  // ════════════════════════════════════════════════════
  //              RENDER
  // ════════════════════════════════════════════════════

  return (
    <div className="relative flex flex-col h-full bg-[#080810] rounded-2xl overflow-hidden border border-white/5">
      {/* ── رأس القماش ── */}
      <CanvasHeader
        startTime={startTime}
        endTime={endTime}
        viewDuration={viewDuration}
        zoom={canvasViewport.zoom}
        onZoomIn={() => actions.setZoom(canvasViewport.zoom + 1)}
        onZoomOut={() => actions.setZoom(canvasViewport.zoom - 1)}
        onZoomReset={() => actions.setZoom(1)}
        hoverTime={hoverTime}
        hoverFreq={hoverFreq}
      />

      {/* ── القماش الرئيسي ── */}
      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={(e) => {
            setIsDragging(true);
            setDragStart(getTimeFromX(e.clientX));
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoverTime(null);
            setHoverFreq(null);
          }}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          title="اسحب للتحريك • عجلة الماوس للتكبير • انقر مزدوجاً لإضافة خلية"
        />

        {/* ── حالة التحليل ── */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="
                absolute inset-0 flex flex-col items-center justify-center
                bg-[#080810]/90 backdrop-blur-sm
              "
            >
              <AnalyzingOverlay />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── حالة الفراغ ── */}
        {!analysisResult && !isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <EmptyCanvasState />
          </div>
        )}
      </div>

      {/* ── شريط التحكم السفلي ── */}
      <CanvasControls />
    </div>
  );
};

// ════════════════════════════════════════════════════
//              DRAWING HELPERS
// ════════════════════════════════════════════════════

function drawGrid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  startTime: number,
  endTime: number,
  viewDuration: number
) {
  // خطوط عمودية (ثواني)
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  const step = viewDuration <= 5 ? 0.5 : viewDuration <= 10 ? 1 : 2;
  const firstLine = Math.ceil(startTime / step) * step;

  for (let t = firstLine; t <= endTime; t += step) {
    const x = ((t - startTime) / viewDuration) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();

    // تسمية الوقت
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText(`${t.toFixed(1)}s`, x + 3, 12);
  }

  // خطوط أفقية (ترددات)
  const freqSteps = [100, 200, 300, 400, 500, 600, 700];
  freqSteps.forEach((freq) => {
    const y = H * (1 - (freq - 80) / (800 - 80));
    ctx.strokeStyle = GRID_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });
}

function drawCrowdingZones(
  ctx: CanvasRenderingContext2D,
  zones: { start: number; end: number; severity: number }[],
  timeToX: (t: number) => number,
  H: number
) {
  zones.forEach((zone) => {
    const x1 = timeToX(zone.start);
    const x2 = timeToX(zone.end);
    if (x2 < 0 || x1 > ctx.canvas.width / devicePixelRatio) return;

    ctx.fillStyle = `rgba(239,68,68,${zone.severity * 0.2})`;
    ctx.fillRect(x1, 0, x2 - x1, H);

    // خط تحذير علوي
    ctx.strokeStyle = `rgba(239,68,68,${zone.severity * 0.6})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x2, 0);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

interface CurveStyle {
  color: string;
  alpha: number;
  lineWidth: number;
  glow: boolean;
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  dataPoints: FrequencyPoint[],
  timeToX: (t: number) => number,
  freqToY: (f: number) => number,
  style: CurveStyle,
  W: number
) {
  const { color, alpha, lineWidth, glow } = style;
  const visible = dataPoints.filter((pt) => {
    const x = timeToX(pt.time);
    return x >= -10 && x <= W + 10;
  });

  if (visible.length < 2) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }

  ctx.beginPath();
  visible.forEach((pt, i) => {
    const x = timeToX(pt.time);
    const y = freqToY(pt.frequency);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawCurveFill(
  ctx: CanvasRenderingContext2D,
  dataPoints: FrequencyPoint[],
  timeToX: (t: number) => number,
  freqToY: (f: number) => number,
  W: number,
  H: number,
  style: { color: string }
) {
  const visible = dataPoints.filter((pt) => {
    const x = timeToX(pt.time);
    return x >= -10 && x <= W + 10;
  });
  if (visible.length < 2) return;

  ctx.save();
  ctx.globalAlpha = 0.08;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, style.color);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(timeToX(visible[0].time), H);
  visible.forEach((pt) => ctx.lineTo(timeToX(pt.time), freqToY(pt.frequency)));
  ctx.lineTo(timeToX(visible[visible.length - 1].time), H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFlowCell(
  ctx: CanvasRenderingContext2D,
  cell: FlowCell,
  timeToX: (t: number) => number,
  H: number
) {
  const x = timeToX(cell.startTime);
  const w = Math.max(45, (cell.duration / 0.4) * 55);

  if (x + w < 0 || x > ctx.canvas.width / devicePixelRatio) return;

  const cellColors: Record<string, string> = {
    word: "rgba(212,160,23,0.85)",
    scat: "rgba(124,58,237,0.85)",
    pause: "rgba(255,255,255,0.2)",
    combo: "rgba(5,150,105,0.85)",
  };

  const y = H * 0.75;
  const cellH = 28;

  // ظل
  ctx.save();
  ctx.shadowColor = cellColors[cell.type] || "rgba(212,160,23,0.8)";
  ctx.shadowBlur = 8;

  // مستطيل الخلية
  ctx.fillStyle = cellColors[cell.type] || "rgba(212,160,23,0.8)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, cellH, 4);
  ctx.fill();

  // نص الخلية
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.font = `bold 11px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cell.text || "...", x + w / 2, y + cellH / 2);
  ctx.restore();
}

function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  H: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // رأس مثلث
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.moveTo(x - 6, 0);
  ctx.lineTo(x + 6, 0);
  ctx.lineTo(x, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHoverLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  freq: number | null,
  H: number,
  freqMin: number,
  freqMax: number,
  W: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(212,160,23,0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, H);
  ctx.stroke();

  if (freq !== null) {
    const y = H * (1 - (freq - freqMin) / (freqMax - freqMin));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();

    // تسمية التردد
    ctx.fillStyle = "rgba(212,160,23,0.9)";
    ctx.font = "10px monospace";
    ctx.fillText(`${Math.round(freq)}Hz`, x + 4, y - 4);
  }

  ctx.setLineDash([]);
  ctx.restore();
}

function drawFrequencyAxis(ctx: CanvasRenderingContext2D, H: number) {
  const labels = [
    { freq: 100, label: "100Hz" },
    { freq: 200, label: "200Hz" },
    { freq: 400, label: "400Hz" },
    { freq: 600, label: "600Hz" },
    { freq: 800, label: "800Hz" },
  ];

  labels.forEach(({ freq, label }) => {
    const y = H * (1 - (freq - 80) / 720);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, 4, y - 2);
  });
}

// ════════════════════════════════════════════════════
//              SUB-COMPONENTS
// ════════════════════════════════════════════════════

const CanvasHeader: React.FC<{
  startTime: number;
  endTime: number;
  viewDuration: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  hoverTime: number | null;
  hoverFreq: number | null;
}> = ({
  startTime, endTime, viewDuration, zoom,
  onZoomIn, onZoomOut, onZoomReset,
  hoverTime, hoverFreq,
}) => (
  <div className="
    flex items-center justify-between gap-3
    px-4 py-2.5 border-b border-white/5
    bg-white/[0.02]
  ">
    {/* معلومات النافذة */}
    <div className="flex items-center gap-4 text-[10px] font-mono">
      <div className="flex items-center gap-1.5">
        <span className="text-white/30">النافذة:</span>
        <span className="text-amber-400 font-bold">{startTime.toFixed(2)}s</span>
        <span className="text-white/20">→</span>
        <span className="text-amber-400 font-bold">{endTime.toFixed(2)}s</span>
      </div>
      <div className="text-white/20">|</div>
      <div className="flex items-center gap-1.5">
        <span className="text-white/30">المدة:</span>
        <span className="text-white/60">{viewDuration.toFixed(1)}ث</span>
      </div>
      {hoverTime !== null && (
        <>
          <div className="text-white/20">|</div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400/60 font-bold">⊹</span>
            <span className="text-white/50">{hoverTime.toFixed(2)}s</span>
            {hoverFreq !== null && (
              <span className="text-purple-400 font-bold">
                {Math.round(hoverFreq)}Hz
              </span>
            )}
          </div>
        </>
      )}
    </div>

    {/* أدوات التكبير */}
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/30 mr-1">
        {zoom.toFixed(1)}x
      </span>
      <ZoomButton onClick={onZoomOut} label="−" title="تصغير" />
      <ZoomButton onClick={onZoomReset} label="↺" title="إعادة ضبط" />
      <ZoomButton onClick={onZoomIn} label="+" title="تكبير" />
    </div>
  </div>
);

const ZoomButton: React.FC<{
  onClick: () => void;
  label: string;
  title: string;
}> = ({ onClick, label, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="
      w-7 h-7 rounded-lg flex items-center justify-center
      bg-white/[0.04] hover:bg-white/[0.08]
      border border-white/5 hover:border-white/10
      text-white/50 hover:text-white/80
      text-sm font-bold transition-all duration-150
      cursor-pointer
    "
  >
    {label}
  </button>
);

const CanvasControls: React.FC = () => {
  const { canvasViewport, actions } = useMaqamFlowStore();

  return (
    <div className="
      flex items-center justify-between gap-3
      px-4 py-2.5 border-t border-white/5
      bg-white/[0.01]
    ">
      {/* شريط التحريك */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[9px] text-white/20">←</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, canvasViewport.totalDuration - 10 / canvasViewport.zoom)}
          step={0.1}
          value={canvasViewport.startTime}
          onChange={(e) => actions.setStartTime(Number(e.target.value))}
          className="flex-1 h-1 accent-amber-500 cursor-pointer"
        />
        <span className="text-[9px] text-white/20">→</span>
      </div>

      {/* تعليمة */}
      <p className="text-[9px] text-white/20 whitespace-nowrap">
        عجلة الماوس للتكبير • انقر مزدوجاً لإضافة خلية
      </p>
    </div>
  );
};

const AnalyzingOverlay: React.FC = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
      <div className="
        absolute inset-0 rounded-full
        border-2 border-t-amber-400 border-r-transparent border-b-transparent border-l-transparent
        animate-spin
      " />
      <div className="absolute inset-2 rounded-full bg-amber-500/10 flex items-center justify-center">
        <span className="text-xl">🎵</span>
      </div>
    </div>
    <div className="text-center">
      <p className="text-sm font-bold text-amber-400">يجري تحليل القمامات والمسارات الصوتية...</p>
      <p className="text-xs text-white/30 mt-1">عزل القناة وجدولة الكاش المقطعي</p>
    </div>
    <div className="flex gap-1 justify-center items-end h-6">
      {[0, 0.15, 0.3].map((delay) => (
        <motion.div
          key={delay}
          animate={{ scaleY: [1, 2.5, 1] }}
          transition={{ duration: 0.8, delay, repeat: Infinity }}
          className="w-1 h-4 bg-amber-400/50 rounded-full origin-bottom"
        />
      ))}
    </div>
  </div>
);

const EmptyCanvasState: React.FC = () => (
  <div className="text-center select-none pointer-events-none">
    <div className="text-5xl mb-3 opacity-20">🎼</div>
    <p className="text-sm text-white/40 font-medium">
      شغّل التحليل اللحني لرؤية منحنى الترددات والخيارات
    </p>
    <p className="text-xs text-white/20 mt-1">
      أو انقر مزدوجاً لإضافة خلية يدوية
    </p>
  </div>
);
