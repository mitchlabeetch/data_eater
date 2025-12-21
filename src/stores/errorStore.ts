import { create } from 'zustand';
import { useMascotStore } from './mascotStore';
import { MASCOT_STATES } from '../lib/constants';
import ERROR_DB from '../lib/errors.json';

interface ErrorEntry {
  code: string;
  title: string;
  message: string;
  suggestion: string;
  originalError?: any;
  timestamp: number;
}

interface ErrorStore {
  lastError: ErrorEntry | null;
  history: ErrorEntry[];
  reportError: (code: keyof typeof ERROR_DB | string, originalError?: any) => void;
  clearError: () => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  lastError: null,
  history: [],

  reportError: (code, originalError) => {
    // 1. Resolve Error from DB or Fallback
    const dbEntry = ERROR_DB[code as keyof typeof ERROR_DB] || ERROR_DB['UNKNOWN'];
    
    // 2. Construct Entry
    const entry: ErrorEntry = {
      code: String(code),
      title: dbEntry.title,
      message: dbEntry.message,
      suggestion: dbEntry.suggestion,
      originalError: originalError ? String(originalError) : undefined,
      timestamp: Date.now()
    };

    console.error(`[DataEater Error ${code}]`, originalError);

    // 3. Trigger Mascot Indigestion with SPECIFIC message if available, else DB title
    const mascot = useMascotStore.getState();
    const specificMsg = originalError instanceof Error ? originalError.message : entry.message;
    
    mascot.setMascot(
      MASCOT_STATES.INDIGESTION, 
      `${entry.title} : ${specificMsg}`
    );

    // 4. Update Store
    set(state => ({
      lastError: entry,
      history: [entry, ...state.history].slice(0, 50) // Keep last 50
    }));
  },

  clearError: () => set({ lastError: null })
}));
