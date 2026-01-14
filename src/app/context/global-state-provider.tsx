
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface GlobalState {
  personNumber: string;
  setPersonNumber: (num: string) => void;
  performanceCycleId: string;
  setPerformanceCycleId: (id: string) => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [personNumber, setPersonNumber] = useState('');
  const [performanceCycleId, setPerformanceCycleId] = useState('');

  const value = useMemo(() => ({
    personNumber,
    setPersonNumber,
    performanceCycleId,
    setPerformanceCycleId,
  }), [personNumber, performanceCycleId]);

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}
