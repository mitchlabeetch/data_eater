import { create } from 'zustand';
import { MascotState, MASCOT_STATES } from '../lib/constants';

interface MascotStore {
  state: MascotState;
  message: string;
  lastActiveAt: number;
  setMascot: (state: MascotState, message?: string) => void;
  resetMascot: (force?: boolean) => void;
}

const DEFAULT_MESSAGE = "Prêt à digérer vos données !";
const MIN_ACTIVE_DURATION = 5000; // 5 seconds

export const useMascotStore = create<MascotStore>((set: any, get: any) => ({
  state: MASCOT_STATES.SLEEPING,
  message: DEFAULT_MESSAGE,
  lastActiveAt: 0,
  
  setMascot: (state: MascotState, message?: string) => {
    const isActivating = state !== MASCOT_STATES.SLEEPING;
    set({ 
      state, 
      message: message || getDefaultMessage(state),
      lastActiveAt: isActivating ? Date.now() : get().lastActiveAt
    });
  },

  resetMascot: (force = false) => {
    const state = get();
    const now = Date.now();
    const elapsed = now - state.lastActiveAt;

    if (!force && state.state !== MASCOT_STATES.SLEEPING && elapsed < MIN_ACTIVE_DURATION) {
      // Set a timer to reset later if it's too soon
      setTimeout(() => {
        get().resetMascot();
      }, MIN_ACTIVE_DURATION - elapsed);
      return;
    }

    set({ 
      state: MASCOT_STATES.SLEEPING, 
      message: DEFAULT_MESSAGE 
    });
  },
}));

function getDefaultMessage(state: MascotState): string {
  switch (state) {
    case MASCOT_STATES.EATING: return "Miam... Je traite vos données...";
    case MASCOT_STATES.COOKING: return "Chef Glouton aux fourneaux (Calcul en cours)...";
    case MASCOT_STATES.DETECTIVE: return "J'analyse les différences entre les fichiers...";
    case MASCOT_STATES.INDIGESTION: return "Ouch ! Quelque chose ne passe pas...";
    case MASCOT_STATES.SLEEPING: return DEFAULT_MESSAGE;
    default: return DEFAULT_MESSAGE;
  }
}
