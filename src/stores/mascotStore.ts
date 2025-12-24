import { create } from 'zustand';
import { MascotState, MASCOT_STATES } from '../lib/constants';

interface MascotStore {
  state: MascotState;
  message: string;
  timeoutId: any | null;
  setMascot: (state: MascotState, message?: string) => void;
  resetMascot: (delay?: number) => void;
}

const DEFAULT_MESSAGE = "Prêt à digérer vos données !";
const COOLDOWN_DURATION = 5000; // 5 seconds AFTER action ends

const MESSAGES: Record<MascotState, string[]> = {
  [MASCOT_STATES.SLEEPING]: [
    "Prêt à digérer vos données !",
    "Zzz... (Mode économie d'énergieRoberté)",
    "Le Glouton attend sa collation locale.",
    "Systèmes parés. En attente de CSV."
  ],
  [MASCOT_STATES.EATING]: [
    "Miam ! Je traite ces lignes une par une...",
    "Digestion locale en cours. Pas de cloud ici !",
    "Crunch crunch... C'est riche en colonnes tout ça.",
    "Le moteur DuckDB tourne à plein régime."
  ],
  [MASCOT_STATES.COOKING]: [
    "Chef Glouton aux fourneaux ! (Calcul en cours)",
    "Je mijote une transformation aux petits oignons.",
    "Recette de nettoyage Robertet appliquée.",
    "Ça va être propre, promis."
  ],
  [MASCOT_STATES.DETECTIVE]: [
    "J'analyse les données... Quelque chose a bougé.",
    "Mode Détective activé. Inspection en cours.",
    "Je vérifie la structure du fichier...",
    "Rapport d'enquête en cours de rédaction."
  ],
  [MASCOT_STATES.INDIGESTION]: [
    "Ouch ! Ce format est trop indigeste.",
    "Attention : données corrompues détectées !",
    "Beurk ! Des caractères invalides dans le flux.",
    "Indigestion système. Vérifiez l'encodage."
  ]
};

export const useMascotStore = create<MascotStore>((set: any, get: any) => ({
  state: MASCOT_STATES.SLEEPING,
  message: DEFAULT_MESSAGE,
  timeoutId: null,
  
  setMascot: (state: MascotState, message?: string) => {
    // Clear any pending reset
    const currentTimeout = get().timeoutId;
    if (currentTimeout) clearTimeout(currentTimeout);

    const available = MESSAGES[state] || [DEFAULT_MESSAGE];
    const randomMsg = available[Math.floor(Math.random() * available.length)];

    set({ 
      state, 
      message: message || randomMsg,
      timeoutId: null
    });
  },

  resetMascot: (delay = COOLDOWN_DURATION) => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) clearTimeout(currentTimeout);

    const id = setTimeout(() => {
      const available = MESSAGES[MASCOT_STATES.SLEEPING];
      set({ 
        state: MASCOT_STATES.SLEEPING, 
        message: available[Math.floor(Math.random() * available.length)],
        timeoutId: null
      });
    }, delay);

    set({ timeoutId: id });
  },
}));