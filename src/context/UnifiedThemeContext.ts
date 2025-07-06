import { createContext } from 'react';

export interface UnifiedThemeContextType {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

export const UnifiedThemeContext = createContext<UnifiedThemeContextType | undefined>(undefined); 