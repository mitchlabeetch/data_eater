import { create } from 'zustand';
import { MascotState, MASCOT_STATES } from '../lib/constants';

interface MascotStore {
  state: MascotState;
  message: string;
  setMascot: (state: MascotState, message?: string) => void;
  resetMascot: () => void;
}

const DEFAULT_MESSAGE = "Prêt à digérer vos données !";

export const useMascotStore = create<MascotStore>((set: any) => ({
  state: MASCOT_STATES.SLEEPING,
  message: DEFAULT_MESSAGE,
  setMascot: (state: MascotState, message?: string) => set({ 
    state, 
    message: message || getDefaultMessage(state) 
  }),
  resetMascot: () => set({ 
    state: MASCOT_STATES.SLEEPING, 
    message: DEFAULT_MESSAGE 
  }),
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
