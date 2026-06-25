import { create } from 'zustand';
import type { User } from '../shared/types';

export type ThemePreference = 'light' | 'dark';

interface UserState {
  currentUser: User | null;
  themePreference: ThemePreference;
  hasCompletedOnboarding: boolean;
  isProfileLoading: boolean;
  setCurrentUser: (user: User) => void;
  updateProfile: (partial: Partial<Pick<User, 'name' | 'emoji' | 'avatarColor'>>) => void;
  setThemePreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  completeOnboarding: () => void;
  setProfileLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  themePreference: 'light',
  hasCompletedOnboarding: false,
  isProfileLoading: false,

  setCurrentUser: (user) => set({ currentUser: user }),

  setProfileLoading: (loading) => set({ isProfileLoading: loading }),

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

  clearUser: () => set({ currentUser: null }),
}));
