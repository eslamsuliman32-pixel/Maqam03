"use client";
import React, { createContext, useContext } from 'react';
import type { ObservatoryContextValue } from './observatoryTypes';

const ObservatoryContext = createContext<ObservatoryContextValue | null>(null);

export const ObservatoryProvider: React.FC<{
  value: ObservatoryContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <ObservatoryContext.Provider value={value}>
    {children}
  </ObservatoryContext.Provider>
);

export function useObservatory(): ObservatoryContextValue {
  const ctx = useContext(ObservatoryContext);
  if (!ctx) throw new Error('useObservatory يجب أن يُستخدم داخل <ObservatoryProvider>');
  return ctx;
}
