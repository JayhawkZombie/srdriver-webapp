import React, { useEffect } from 'react';
import { useAppStore } from './appStore';
import { getFakeAppState } from './mockAppState';

interface FakeAppStateStoryProviderProps {
  children: React.ReactNode;
  initialState?: Partial<ReturnType<typeof useAppStore.getState>>;
  mockType?: "sine" | "noise" | "randomBar" | "sineBar" | "beatBar" | "screenshotBar";
}

/**
 * FakeAppStateStoryProvider
 * - If initialState is provided, uses it to populate Zustand.
 * - If mockType is provided, uses getFakeAppState(mockType) to populate Zustand.
 * - If both are provided, initialState takes precedence.
 */
export const FakeAppStateStoryProvider: React.FC<FakeAppStateStoryProviderProps> = ({ children, initialState, mockType }) => {
  useEffect(() => {
    let stateToSet = initialState;
    if (!initialState && mockType) {
      stateToSet = getFakeAppState(mockType);
    }
    if (stateToSet) {
      for (const [key, value] of Object.entries(stateToSet)) {
        if (typeof useAppStore.getState()[key as keyof ReturnType<typeof useAppStore.getState>] === 'function') continue;
        useAppStore.setState({ [key]: value });
      }
    }
  }, [initialState, mockType]);
  return <>{children}</>;
}; 