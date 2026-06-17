/**
 * MAQAM Royal Neural Design Tokens (2026)
 * فلسفة: Glassmorphism + Neural Gradients + Aurora Lighting
 */
export const royalTokens = {
  // الألوان الجوهرية - طيف ملكي عصبي
  colors: {
    bg: {
      void: "#05060B",        // خلفية الفضاء العميق
      abyss: "#0A0D17",       // طبقة المحتوى الأساسية
      surface: "#11152230",   // زجاج شفاف
      elevated: "#1A2035CC",  // بطاقات مرتفعة
      glow: "#2B1B50",        // وهج بنفسجي ملكي
    },
    neural: {
      sapphire: "#3B82F6",    // أزرق عصبي
      amethyst: "#8B5CF6",    // بنفسجي ملكي
      rose: "#F472B6",        // وردي طيفي
      gold: "#FBBF24",        // ذهب ملكي
      emerald: "#10B981",     // أخضر رنين
      crimson: "#EF4444",     // أحمر حراري
    },
    text: {
      pristine: "#F8FAFC",
      muted: "#94A3B8",
      ghost: "#64748B",
    },
    border: {
      default: "rgba(139, 92, 246, 0.15)",
      hover: "rgba(139, 92, 246, 0.35)",
      active: "rgba(139, 92, 246, 0.55)",
    },
  },
  // تدرجات الأورورا
  gradients: {
    royalAurora: "linear-gradient(135deg, #2B1B50 0%, #3B82F6 35%, #8B5CF6 70%, #F472B6 100%)",
    thermalSpectrum: "linear-gradient(90deg, #3B82F6 0%, #10B981 25%, #FBBF24 60%, #EF4444 100%)",
    glassBorder: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.1))",
    neuralPulse: "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
  },
  // ظلال نيون
  shadows: {
    neural: "0 0 32px rgba(139, 92, 246, 0.25), 0 0 8px rgba(59, 130, 246, 0.15)",
    royal: "0 24px 60px -20px rgba(43, 27, 80, 0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
    thermal: "0 0 24px rgba(251, 191, 36, 0.4)",
  },
  // الحركة
  motion: {
    spring: { type: "spring", stiffness: 280, damping: 28 },
    smooth: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    glide: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

export type RoyalTokens = typeof royalTokens;
