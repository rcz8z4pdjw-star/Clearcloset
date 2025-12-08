import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState,
  ClothingItem,
  WearLog,
  Outfit,
  PackingList,
  User,
  SubscriptionTier
} from '../types';
import { v4 as uuidv4 } from 'uuid';

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: SubscriptionTier }
  | { type: 'ADD_ITEM'; payload: ClothingItem }
  | { type: 'UPDATE_ITEM'; payload: ClothingItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'LOG_WEAR'; payload: WearLog }
  | { type: 'ADD_OUTFIT'; payload: Outfit }
  | { type: 'UPDATE_OUTFIT'; payload: Outfit }
  | { type: 'DELETE_OUTFIT'; payload: string }
  | { type: 'ADD_PACKING_LIST'; payload: PackingList }
  | { type: 'UPDATE_PACKING_LIST'; payload: PackingList }
  | { type: 'DELETE_PACKING_LIST'; payload: string }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'TOGGLE_FAVORITE'; payload: string };

const initialState: AppState = {
  user: null,
  items: [],
  wearLogs: [],
  outfits: [],
  packingLists: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'UPDATE_SUBSCRIPTION':
      if (!state.user) return state;
      return { ...state, user: { ...state.user, subscription: action.payload } };

    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };

    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        wearLogs: state.wearLogs.filter(log => log.itemId !== action.payload),
        outfits: state.outfits.map(outfit => ({
          ...outfit,
          itemIds: outfit.itemIds.filter(id => id !== action.payload),
        })),
      };

    case 'LOG_WEAR': {
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.itemId) {
          return {
            ...item,
            wearCount: item.wearCount + 1,
            lastWorn: action.payload.date,
          };
        }
        return item;
      });
      return {
        ...state,
        items: updatedItems,
        wearLogs: [...state.wearLogs, action.payload],
      };
    }

    case 'ADD_OUTFIT':
      return { ...state, outfits: [...state.outfits, action.payload] };

    case 'UPDATE_OUTFIT':
      return {
        ...state,
        outfits: state.outfits.map(outfit =>
          outfit.id === action.payload.id ? action.payload : outfit
        ),
      };

    case 'DELETE_OUTFIT':
      return {
        ...state,
        outfits: state.outfits.filter(outfit => outfit.id !== action.payload),
      };

    case 'ADD_PACKING_LIST':
      return { ...state, packingLists: [...state.packingLists, action.payload] };

    case 'UPDATE_PACKING_LIST':
      return {
        ...state,
        packingLists: state.packingLists.map(list =>
          list.id === action.payload.id ? action.payload : list
        ),
      };

    case 'DELETE_PACKING_LIST':
      return {
        ...state,
        packingLists: state.packingLists.filter(list => list.id !== action.payload),
      };

    case 'LOAD_STATE':
      return action.payload;

    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload ? { ...item, favorite: !item.favorite } : item
        ),
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  actions: {
    addItem: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>) => void;
    updateItem: (item: ClothingItem) => void;
    deleteItem: (id: string) => void;
    logWear: (itemId: string, occasion?: string, rating?: number) => void;
    addOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt' | 'wearCount'>) => void;
    deleteOutfit: (id: string) => void;
    toggleFavorite: (id: string) => void;
    setUser: (user: User) => void;
    updateSubscription: (tier: SubscriptionTier) => void;
  };
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'closetclear_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    } else {
      // Create default user
      const defaultUser: User = {
        id: uuidv4(),
        name: 'User',
        email: '',
        subscription: 'free',
        preferences: {
          favoriteColors: [],
          preferredStyle: [],
          lifestyle: ['casual', 'work'],
        },
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'SET_USER', payload: defaultUser });
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (state.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const actions = {
    addItem: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>) => {
      const newItem: ClothingItem = {
        ...item,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        wearCount: 0,
      };
      dispatch({ type: 'ADD_ITEM', payload: newItem });
    },

    updateItem: (item: ClothingItem) => {
      dispatch({ type: 'UPDATE_ITEM', payload: item });
    },

    deleteItem: (id: string) => {
      dispatch({ type: 'DELETE_ITEM', payload: id });
    },

    logWear: (itemId: string, occasion?: string, rating?: number) => {
      const log: WearLog = {
        id: uuidv4(),
        itemId,
        date: new Date().toISOString(),
        occasion: occasion as WearLog['occasion'],
        rating: rating as WearLog['rating'],
      };
      dispatch({ type: 'LOG_WEAR', payload: log });
    },

    addOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt' | 'wearCount'>) => {
      const newOutfit: Outfit = {
        ...outfit,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        wearCount: 0,
      };
      dispatch({ type: 'ADD_OUTFIT', payload: newOutfit });
    },

    deleteOutfit: (id: string) => {
      dispatch({ type: 'DELETE_OUTFIT', payload: id });
    },

    toggleFavorite: (id: string) => {
      dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
    },

    setUser: (user: User) => {
      dispatch({ type: 'SET_USER', payload: user });
    },

    updateSubscription: (tier: SubscriptionTier) => {
      dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: tier });
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
