import { create } from 'zustand';
import { useDataStore } from './dataStore';

export type Operator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'greater_than' 
  | 'less_than' 
  | 'starts_with' 
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty';

export interface Rule {
  id: string;
  column: string;
  operator: Operator;
  value: string;
  active: boolean;
  priority: number;
}

export interface Favorite {
  id: string;
  name: string;
  rules: Omit<Rule, 'id'>[];
}

interface ViewStore {
  isFilterOpen: boolean;
  isNormalizationOpen: boolean;
  rules: Rule[];
  favorites: Favorite[];
  
  openFilter: () => void;
  closeFilter: () => void;
  openNormalization: () => void;
  closeNormalization: () => void;
  
  addRule: () => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  duplicateRule: (id: string) => void;
  toggleRule: (id: string) => void;
  clearRules: () => void;
  
  saveFavorite: (name: string) => void;
  loadFavorite: (id: string) => void;
  deleteFavorite: (id: string) => void;
  
  applyRules: () => Promise<void>; // Triggers DataStore fetch
}

export const useViewStore = create<ViewStore>((set, get) => ({
  isFilterOpen: false,
  isNormalizationOpen: false,
  rules: [],
  favorites: JSON.parse(localStorage.getItem('data_eater_favs') || '[]'),

  openFilter: () => set({ isFilterOpen: true }),
  closeFilter: () => set({ isFilterOpen: false }),
  openNormalization: () => set({ isNormalizationOpen: true }),
  closeNormalization: () => set({ isNormalizationOpen: false }),

  addRule: () => {
    const { rules } = get();
    const newRule: Rule = {
      id: crypto.randomUUID(),
      column: '',
      operator: 'contains',
      value: '',
      active: true,
      priority: rules.length + 1
    };
    set({ rules: [...rules, newRule] });
  },

  updateRule: (id, updates) => {
    set(state => ({
      rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  },

  deleteRule: (id) => {
    set(state => {
      const filtered = state.rules.filter(r => r.id !== id);
      // Re-index priorities
      const reindexed = filtered.map((r, idx) => ({ ...r, priority: idx + 1 }));
      return { rules: reindexed };
    });
  },

  duplicateRule: (id) => {
    const { rules } = get();
    const source = rules.find(r => r.id === id);
    if (!source) return;

    const newRule: Rule = {
      ...source,
      id: crypto.randomUUID(),
      priority: rules.length + 1
    };
    set({ rules: [...rules, newRule] });
  },

  toggleRule: (id) => {
    set(state => ({
      rules: state.rules.map(r => r.id === id ? { ...r, active: !r.active } : r)
    }));
  },

  clearRules: () => set({ rules: [] }),

  saveFavorite: (name) => {
    const { rules, favorites } = get();
    // Strip IDs for template
    const cleanRules = rules.map(({ id, ...r }) => r);
    const newFav: Favorite = {
      id: crypto.randomUUID(),
      name,
      rules: cleanRules
    };
    const updatedFavs = [...favorites, newFav];
    set({ favorites: updatedFavs });
    localStorage.setItem('data_eater_favs', JSON.stringify(updatedFavs));
  },

  loadFavorite: (id) => {
    const { favorites } = get();
    const fav = favorites.find(f => f.id === id);
    if (!fav) return;

    // Hydrate with new IDs
    const hydratedRules = fav.rules.map((r, idx) => ({
      ...r,
      id: crypto.randomUUID(),
      column: '', // Clear column as requested for safety
      priority: idx + 1
    }));
    set({ rules: hydratedRules });
  },

  deleteFavorite: (id) => {
    set(state => {
      const updated = state.favorites.filter(f => f.id !== id);
      localStorage.setItem('data_eater_favs', JSON.stringify(updated));
      return { favorites: updated };
    });
  },

  applyRules: async () => {
    // This just triggers the fetch in DataStore
    // The DataStore will read 'useViewStore.getState().rules' inside fetchCurrentView
    await useDataStore.getState().fetchCurrentView();
    get().closeFilter();
  }
}));
