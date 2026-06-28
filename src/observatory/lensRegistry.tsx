"use client";
import React, { lazy } from 'react';
import type { LensId, LensMeta } from './observatoryTypes';
import { ComingSoonLens } from './ComingSoonLens';

export const LENSES: LensMeta[] = [
  { id: 'table',         label: 'الجدول',          icon: 'Table2',   hint: 'إدارة وتصفية البارات',        ready: true  },
  { id: 'constellation', label: 'سماء البارات',    icon: 'Sparkles', hint: 'خريطة التشابه السوني',        ready: true  },
  { id: 'heatmap',       label: 'بصمة المخارج',    icon: 'Flame',    hint: 'حرارة مخارج النطق',           ready: true  },
  { id: 'trajectory',    label: 'نبض الكوبليه',    icon: 'Activity', hint: 'موجة طاقة التتابع',           ready: false },
  { id: 'stats',         label: 'الأرقام الصادقة', icon: 'Target',   hint: 'إحصاءٌ وعلاقاتٌ صادقة',      ready: false },
  { id: 'style',         label: 'مرآة الأساطير',   icon: 'Drama',    hint: 'مقارنةٌ بالأساليب المرجعية',  ready: false },
];

export const LENS_BY_ID: Record<LensId, LensMeta> = LENSES.reduce(
  (acc, lens) => { acc[lens.id] = lens; return acc; },
  {} as Record<LensId, LensMeta>
);

export const LENS_COMPONENTS: Partial<Record<LensId, React.LazyExoticComponent<React.ComponentType>>> = {
  constellation: lazy(() => import('./lenses/ConstellationLens').then(m => ({ default: m.ConstellationLens }))),
  heatmap:       lazy(() => import('./lenses/HeatmapLens').then(m => ({ default: m.HeatmapLens }))),
};

export function resolveLensComponent(id: LensId): React.ComponentType {
  const Comp = LENS_COMPONENTS[id];
  if (Comp) return Comp;
  const meta = LENS_BY_ID[id];
  const Placeholder: React.FC = () => <ComingSoonLens label={meta.label} hint={meta.hint} />;
  Placeholder.displayName = `ComingSoon(${id})`;
  return Placeholder;
}
