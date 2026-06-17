"use client";

import React, {
  useRef, useEffect, useCallback, useState, useMemo,
} from "react";
import { useBeatWriterStore, InstrumentId } from "../../store/beatWriterStore";

const INST_COLORS: Record<InstrumentId, string> = {
  kick: "#EF4444", snare: "#F59E0B", hihat: "#10B981",
  bass: "#8B5CF6", melody: "#06B6D4", pad: "#EC4899", vocal: "#F97316",
};

const TRACK_HEIGHT = 65;
const HEADER_HEIGHT = 44;  // رأس الوقت
const SECTION_HEIGHT = 28; // شريط الأقسام

export const BeatTimeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const {
    beatGrid, instruments, waveformCache, currentTime,
    lyricBars, timelineZoom, timelineScrollRTL, actions,
  } = useBeatWriterStore();

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 320 });
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // حساب نافذة العرض (RTL)
  const viewParams = useMemo(() => {
    if (!beatGrid) return { viewStart: 0, viewEnd: 16, viewDuration: 16 };
    const viewDuration = beatGrid.totalDuration / timelineZoom;
    // RTL: scroll=1 يعني البداية (اليمين)، scroll=0 يعني النهاية (اليسار)
    const maxScroll = beatGrid.totalDuration - viewDuration;
    const viewStart = (1 - timelineScrollRTL) * maxScroll;
    const viewEnd = viewStart + viewDuration;
    return { viewStart, viewEnd, viewDuration };
  }, [beatGrid, timelineZoom, timelineScrollRTL]);

  // تحويل الزمن ← X (RTL: الوقت الأكبر = يسار)
  const timeToX = useCallback(
    (t: number, W: number): number => {
      const { viewStart, viewEnd } = viewParams;
      // في RTL: اليمين = viewStart, اليسار = viewEnd
      return W - ((t - viewStart) / (viewEnd - viewStart)) * W;
    },
    [viewParams]
  );

  // تحويل X → الزمن (RTL)
  const xToTime = useCallback(
    (x: number, W: number): number => {
      const { viewStart, viewEnd } = viewParams;
      return viewEnd - (x / W) * (viewEnd - viewStart);
    },
    [viewParams]
  );

  // ════════════════════════════════════════
  //  دالة الرسم الرئيسية
  // ════════════════════════════════════════
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !beatGrid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const W = canvas.width / DPR;
    const H = canvas.height / DPR;

    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    // خلفية
    ctx.fillStyle = "#050709";
    ctx.fillRect(0, 0, W, H);

    const { viewStart, viewEnd, viewDuration } = viewParams;

    // ─────────────────────────────────────
    // 1. شريط الأقسام (أعلى)
    // ─────────────────────────────────────
    beatGrid.sections.forEach((section) => {
      const x1 = timeToX(section.endTime, W);   // RTL: نهاية القسم = يسار
      const x2 = timeToX(section.startTime, W); // RTL: بداية القسم = يمين
      const sW = x2 - x1;
      if (sW <= 0) return;

      // خلفية القسم
      ctx.fillStyle = section.color + "18";
      ctx.fillRect(x1, 0, sW, SECTION_HEIGHT);

      // حد القسم
      ctx.strokeStyle = section.color + "60";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, SECTION_HEIGHT);
      ctx.stroke();

      // نص القسم
      if (sW > 40) {
        ctx.fillStyle = section.color;
        ctx.font = `bold 12px Tajawal, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(section.label, x1 + sW / 2, SECTION_HEIGHT / 2);
      }
    });

    // ─────────────────────────────────────
    // 2. شريط الوقت والمقاييس
    // ─────────────────────────────────────
    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, SECTION_HEIGHT, W, HEADER_HEIGHT);

    // خطوط الأشرطة والبيتات
    const barStep = beatGrid.barDuration;
    const beatStep = beatGrid.beatDuration;

    // تحديد كثافة الشبكة
    const pixelsPerSecond = W / viewDuration;
    const showBeats = pixelsPerSecond > 30;

    // خطوط الأشرطة (الموسيقية)
    const firstBar = Math.floor(viewStart / barStep);
    const lastBar = Math.ceil(viewEnd / barStep);

    for (let bar = firstBar; bar <= lastBar; bar++) {
      const barTime = bar * barStep;
      if (barTime < viewStart || barTime > viewEnd) continue;
      const x = timeToX(barTime, W);

      // خط الشريط
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, SECTION_HEIGHT);
      ctx.lineTo(x, H);
      ctx.stroke();

      // رقم الشريط
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${bar + 1}`, x, SECTION_HEIGHT + 4);

      // الوقت بالثانية
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`${barTime.toFixed(1)}s`, x, SECTION_HEIGHT + 18);

      // بيتات داخل الشريط
      if (showBeats) {
        for (let beat = 1; beat < beatGrid.timeSignatureNum; beat++) {
          const beatTime = barTime + beat * beatStep;
          if (beatTime > viewEnd) break;
          const bx = timeToX(beatTime, W);
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(bx, SECTION_HEIGHT + HEADER_HEIGHT);
          ctx.lineTo(bx, H);
          ctx.stroke();
        }
      }
    }

    // ─────────────────────────────────────
    // 3. مسارات الآلات
    // ─────────────────────────────────────
    const tracksStartY = SECTION_HEIGHT + HEADER_HEIGHT;

    instruments.forEach((inst, idx) => {
      const trackY = tracksStartY + idx * (TRACK_HEIGHT + 2);
      const color = INST_COLORS[inst.id];
      const cache = waveformCache.get(inst.id);

      // خلفية المسار: توضيح المسارات بالكامل عبر تدرجات الألوان الحقيقية للآلات
      ctx.fillStyle = inst.isPlaying 
        ? `${color}13` // لون مضيء تفاعلي هادئ عند التشغيل
        : `${color}06`; // تدرج ملون هادئ عند الاستعداد
      ctx.fillRect(0, trackY, W, TRACK_HEIGHT);

      // رسم مسارات بخطوط جانيبية ملونة لتحديد ممرات الآلات بدقة هندسية عالية
      ctx.strokeStyle = `${color}25`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, trackY);
      ctx.lineTo(W, trackY);
      ctx.moveTo(0, trackY + TRACK_HEIGHT);
      ctx.lineTo(W, trackY + TRACK_HEIGHT);
      ctx.stroke();

      if (inst.isMuted) {
        // إشارة الكتم
        ctx.fillStyle = `${color}25`;
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("MUTED / مكتومة", W / 2, trackY + TRACK_HEIGHT / 2);
        return;
      }

      if (!cache || cache.peaks.length === 0) return;

      // رسم الموجة الصوتية
      const midY = trackY + TRACK_HEIGHT / 2;
      const maxAmp = (TRACK_HEIGHT / 2) * 0.88;
      const totalPeaks = cache.peaks.length;
      const resolution = cache.resolution;

      // حساب العينات المرئية
      const startIdx = Math.max(0, Math.floor(viewStart * resolution));
      const endIdx = Math.min(totalPeaks - 1, Math.ceil(viewEnd * resolution));

      // رسم أعمدة الموجة الاحترافية المتباعدة لتعكس طاقة الآلة المعزولة كأنها في DAW حقيقي
      const barWidth = 2;
      const barGap = 1;
      const stepWidth = barWidth + barGap;
      const numSteps = Math.ceil(W / stepWidth);

      for (let stepIdx = 0; stepIdx < numSteps; stepIdx++) {
        const px = stepIdx * stepWidth;
        const drawX = W - 1 - px;
        
        // جلب مقدار الطاقة المقابل لهذا الجزء من الزمن
        const ratio = px / W;
        const sampleIdx = Math.floor(startIdx + ratio * (endIdx - startIdx));
        if (sampleIdx >= totalPeaks) continue;
        
        const max = cache.peaks[sampleIdx];
        const t = viewStart + ratio * (viewEnd - viewStart);
        const isPast = t < currentTime;

        // لون ديناميكي ساطع للموجة يعكس طاقة الأداء
        let barColor = `${color}40`; // مظهر خافت للأجزاء الماضية أو الاحتياطية
        if (inst.isPlaying) {
          barColor = isPast ? `${color}75` : `${color}FF`; // ساطع ونابض ومتحرك للأمام
        } else {
          barColor = `${color}90`;
        }

        ctx.fillStyle = barColor;

        const barH = Math.max(2, max * maxAmp * 2);
        const topY = midY - (barH / 2);
        
        // رسم خط الموجة ثنائي الأبعاد
        ctx.fillRect(drawX - barWidth, topY, barWidth, barH);

        // لمسة إضاءة عليا وسفلى حليبية (White Energy Peak) على القمم الحية للتعبير عن التفجير الصوتي المثير
        if (inst.isPlaying && max > 0.4 && !isPast && stepIdx % 3 === 0) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(drawX - barWidth, topY, barWidth, 1.5);
          ctx.fillRect(drawX - barWidth, topY + barH - 1.5, barWidth, 1.5);
          ctx.fillStyle = barColor; // استرجاع اللون
        }
      }

      // تحديد ناصع ووهج للمسار الفعال النشط حالياً
      if (inst.isPlaying) {
        ctx.strokeStyle = `${color}55`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, trackY, W, TRACK_HEIGHT);
      }
    });

    // ─────────────────────────────────────
    // 4. أسطر الكلمات على المسارات
    // ─────────────────────────────────────
    lyricBars.forEach((bar) => {
      if (bar.endTime < viewStart || bar.startTime > viewEnd) return;

      const instIdx = instruments.findIndex((i) => i.id === bar.instrumentId);
      if (instIdx < 0) return;

            const trackY = tracksStartY + instIdx * (TRACK_HEIGHT + 2);
      // RTL: الوقت الأكبر = يسار
      const x1 = timeToX(bar.endTime, W);
      const x2 = timeToX(bar.startTime, W);
      const barW = Math.max(32, x2 - x1);
      const barH = TRACK_HEIGHT - 10;
      const barY = trackY + 5;

      const isHovered = hoveredBar === bar.id;
      const isSelected = bar.isSelected;

      // مستطيل الكلمة
      ctx.save();
      ctx.fillStyle = bar.isSelected ? bar.color + "E0" : bar.color + "A0";
      ctx.shadowColor = bar.color;
      ctx.shadowBlur = isHovered || isSelected ? 10 : 0;

      ctx.beginPath();
      ctx.roundRect(x1, barY, barW, barH, 6);
      ctx.fill();

      // حد
      ctx.strokeStyle = bar.color;
      ctx.lineWidth = isSelected ? 2.0 : 0.8;
      ctx.stroke();
      ctx.restore();

      // نص مقصوص
      if (barW > 20) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x1 + 2, barY, barW - 4, barH);
        ctx.clip();
        ctx.fillStyle = "#000000";
        ctx.font = `bold 13px Tajawal, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(bar.text, x2 - 8, barY + barH / 2);
        ctx.restore();
      }

      // مؤشر جودة الفلو
      const scoreColor =
        bar.flowScore >= 75 ? "#10B981" :
        bar.flowScore >= 50 ? "#F59E0B" : "#EF4444";
      ctx.fillStyle = scoreColor;
      ctx.beginPath();
      ctx.arc(x1 + 6, barY + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // ─────────────────────────────────────
    // 5. رأس التشغيل (Playhead) - RTL
    // ─────────────────────────────────────
    const playX = timeToX(currentTime, W);
    if (playX >= 0 && playX <= W) {
      // ظل ملون
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.0;
      ctx.shadowColor = "rgba(255,255,255,0.6)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, H);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // مثلث الرأس (يشير للأسفل)
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(playX - 6, SECTION_HEIGHT);
      ctx.lineTo(playX + 6, SECTION_HEIGHT);
      ctx.lineTo(playX, SECTION_HEIGHT + 9);
      ctx.fill();

      // الوقت الحالي
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = playX > W / 2 ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${currentTime.toFixed(2)}s`,
        playX > W / 2 ? playX - 6 : playX + 6,
        SECTION_HEIGHT + 3
      );
    }

    ctx.restore();
  }, [
    beatGrid, instruments, waveformCache, currentTime, lyricBars,
    viewParams, timeToX, hoveredBar,
  ]);

  // حلقة الرسم
  useEffect(() => {
    const loop = () => {
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // ضبط حجم الكانفاس مع ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const DPR = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // التحكم بالماوس
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = useBeatWriterStore.getState().timelineScrollRTL;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !beatGrid) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = xToTime(x, rect.width);

    // تحريك بالسحب
    if (isDragging.current) {
      const deltaX = e.clientX - dragStartX.current;
      // RTL: السحب لليمين = تمرير للأمام
      const deltaFrac = -deltaX / rect.width / timelineZoom;
      const newScroll = Math.max(0, Math.min(1, dragStartScroll.current + deltaFrac));
      actions.scrollTimeline(newScroll - useBeatWriterStore.getState().timelineScrollRTL);
      return;
    }

    // تحديث tooltip
    const hovered = useBeatWriterStore.getState().lyricBars.find(
      (b) => t >= b.startTime && t <= b.endTime
    );
    setHoveredBar(hovered?.id ?? null);
    if (hovered) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 40,
        text: `${hovered.text} | فلو: ${hovered.flowScore}% | ${hovered.syllableCount} مقطع`,
      });
    } else {
      setTooltip(null);
    }
  }, [beatGrid, xToTime, timelineZoom, actions]);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);
  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    setHoveredBar(null);
    setTooltip(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!beatGrid) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const t = xToTime(x, rect.width);

    // النقر على كلمة موجودة
    const clicked = useBeatWriterStore.getState().lyricBars.find(
      (b) => t >= b.startTime && t <= b.endTime
    );
    if (clicked) {
      actions.selectBar(clicked.id);
      return;
    }

    // الانتقال للوقت
    actions.seekTo(t);
  }, [beatGrid, xToTime, actions]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // تكبير/تصغير
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      actions.setTimelineZoom(timelineZoom + delta);
    } else {
      // تمرير RTL
      const delta = (e.deltaX + e.deltaY) / (canvasSize.w * timelineZoom * 3);
      actions.scrollTimeline(delta);
    }
  }, [timelineZoom, canvasSize.w, actions]);

  // حساب ارتفاع الكانفاس = الأقسام + الرأس + المسارات
  const totalTracksH = instruments.length * (TRACK_HEIGHT + 2);
  const requiredH = SECTION_HEIGHT + HEADER_HEIGHT + totalTracksH + 8;

  return (
    <div className="flex flex-col h-full bg-[#050709]" ref={containerRef} dir="rtl">
      {/* شريط تحكم خط الوقت */}
      <TimelineControls />

      {/* الكانفاس الرئيسي */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ minHeight: `${requiredH}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: isDragging.current ? "grabbing" : "crosshair", display: "block" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onWheel={handleWheel}
        />

        {/* أسماء الآلات على يمين الكانفاس (RTL) */}
        <InstrumentLabels instruments={instruments} />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-black/90 text-white text-[9px]
              px-2.5 py-1.5 rounded-lg border border-white/10 whitespace-nowrap z-20
              shadow-xl"
            style={{ left: tooltip.x + 8, top: Math.max(0, tooltip.y) }}
          >
            {tooltip.text}
          </div>
        )}

        {/* حالة فارغة */}
        {!beatGrid && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[10px] text-white/20">اضغط "إعادة البناء" لتهيئة البيت</p>
          </div>
        )}
      </div>

      {/* شريط التمرير RTL */}
      <RTLScrollbar />
    </div>
  );
};

// ════════════════════════════════════════
//  شريط تحكم خط الوقت
// ════════════════════════════════════════

const TimelineControls: React.FC = () => {
  const { timelineZoom, beatGrid, actions } = useBeatWriterStore();

  return (
    <div
      className="flex-shrink-0 flex items-center gap-4 px-4 border-b border-white/[0.05]
        bg-[#060810]"
      style={{ height: "44px" }}
      dir="rtl"
    >
      {/* معلومات الوقت */}
      <div className="flex items-center gap-4 text-[11px] text-white/50 font-mono">
        {beatGrid && (
          <>
            <span>
              المدة الكلية:{" "}
              <span className="text-amber-400 font-extrabold">
                {beatGrid.totalDuration.toFixed(2)}s
              </span>
            </span>
            <span>
              الأشرطة:{" "}
              <span className="text-amber-400 font-extrabold">{beatGrid.totalBars}</span>
            </span>
            <span>
              BPM:{" "}
              <span className="text-amber-400 font-extrabold">{beatGrid.bpm}</span>
            </span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* التكبير */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-white/30">تكبير:</span>
        <button
          onClick={() => actions.setTimelineZoom(1)}
          className="px-2.5 h-7 rounded-lg text-[10px] font-bold bg-white/5 text-white/40
            hover:bg-white/10 cursor-pointer"
        >
          1:1
        </button>
        {[1, 2, 4, 8, 16].map((z) => (
          <button
            key={z}
            onClick={() => actions.setTimelineZoom(z)}
            className={`w-9 h-7 rounded-lg text-[10px] font-black cursor-pointer transition-all
              ${timelineZoom === z
                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
          >
            {z}x
          </button>
        ))}
      </div>

      {/* أسطر الاتجاه RTL */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/30 border-r border-white/10 pr-3">
        <span>← أحدث</span>
        <span className="mx-1 text-white/10">|</span>
        <span>أقدم →</span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════
//  أسماء الآلات على يمين الكانفاس
// ════════════════════════════════════════

const InstrumentLabels: React.FC<{ instruments: { id: InstrumentId; nameAr: string; icon: string; isPlaying: boolean; isMuted: boolean }[] }> = ({
  instruments,
}) => {
  const topOffset = SECTION_HEIGHT + HEADER_HEIGHT;

  return (
    <div
      className="absolute top-0 right-0 pointer-events-none"
      style={{ paddingTop: `${topOffset}px` }}
    >
      {instruments.map((inst) => {
        const color = INST_COLORS[inst.id];
        return (
          <div
            key={inst.id}
            className="flex items-center justify-end gap-1.5 pr-3"
            style={{
              height: `${TRACK_HEIGHT + 2}px`,
              opacity: inst.isMuted ? 0.3 : 1,
            }}
          >
            <span
              className="text-[12px] font-black"
              style={{ color: inst.isPlaying ? color : "rgba(255,255,255,0.35)" }}
            >
              {inst.icon}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: inst.isPlaying ? color : "rgba(255,255,255,0.25)" }}
            >
              {inst.nameAr}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════
//  شريط التمرير RTL
// ════════════════════════════════════════

const RTLScrollbar: React.FC = () => {
  const { timelineScrollRTL, timelineZoom, actions } = useBeatWriterStore();
  const thumbWidth = Math.max(10, 100 / timelineZoom);
  // RTL: scroll=1 → thumb في أقصى اليمين، scroll=0 → في أقصى اليسار
  const thumbRight = timelineScrollRTL * (100 - thumbWidth);

  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-4 border-t border-white/[0.05]
        bg-[#040608]"
      style={{ height: "28px" }}
      dir="rtl"
    >
      {/* تسمية RTL */}
      <span className="text-[10px] font-bold text-white/20 flex-shrink-0">← الأقدم</span>

      {/* : شريط التمرير */}
      <div
        className="flex-1 relative h-3 bg-white/[0.05] rounded-full cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          // RTL: النقر في اليمين = بداية
          const ratio = 1 - (e.clientX - rect.left) / rect.width;
          actions.scrollTimeline(ratio - timelineScrollRTL);
        }}
      >
        <div
          className="absolute inset-y-0 bg-white/25 hover:bg-white/40 rounded-full
            transition-colors cursor-grab active:cursor-grabbing"
          style={{
            right: `${thumbRight}%`,
            width: `${thumbWidth}%`,
          }}
        />
      </div>

      <span className="text-[10px] font-bold text-white/20 flex-shrink-0">الأحدث →</span>
    </div>
  );
};
