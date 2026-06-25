import { create } from 'zustand';
import type { User } from '../shared/types';

export type ThemePreference = 'light' | 'dark';

interface UserState {
  currentUser: User | null;
  themePreference: ThemePreference;
  hasCompletedOnboarding: boolean;
  setCurrentUser: (user: User) => void;
  updateProfile: (partial: Partial<Pick<User, 'name' | 'emoji' | 'avatarColor'>>) => void;
  setThemePreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  completeOnboarding: () => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  themePreference: 'light',
  hasCompletedOnboarding: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  updateProfile: (partial) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...partial } : state.currentUser,
    })),

  setThemePreference: (theme) => set({ themePreference: theme }),

  toggleTheme: () =>
    set((state) => ({
      themePreference: state.themePreference === 'light' ? 'dark' : 'light',
    })),

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

  clearUser: () => set({ currentUser: null, hasCompletedOnboarding: false }),
}));
