import { create } from 'zustand';
import { fetchProfilesByIds } from '../services/supabase/api';
import type { User } from '../shared/types';

interface ProfilesState {
  profiles: Record<string, User>;
  ensureProfiles: (ids: string[]) => Promise<void>;
}

/** Cache simple de perfiles por uid, usado para resolver nombres/avatares de miembros sin repetir fetches. */
export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: {},

  ensureProfiles: async (ids) => {
    const { profiles } = get();
    const missing = Array.from(new Set(ids)).filter((id) => !profiles[id]);
    if (missing.length === 0) return;

    const fetched = await fetchProfilesByIds(missing);
    if (fetched.length === 0) return;

    set((state) => {
      const next = { ...state.profiles };
      for (const user of fetched) {
        next[user.uid] = user;
      }
      return { profiles: next };
    });
  },
}));
