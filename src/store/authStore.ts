import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  session: Session | null;
  isAuthLoading: boolean;
  pendingInviteToken: string | null;
  setSession: (session: Session | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setPendingInviteToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthLoading: true,
  pendingInviteToken: null,

  setSession: (session) => set({ session }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setPendingInviteToken: (token) => set({ pendingInviteToken: token }),
}));
