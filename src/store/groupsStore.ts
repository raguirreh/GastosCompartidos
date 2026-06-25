import { create } from 'zustand';
import { createGroup as createGroupRemote, fetchGroupsForUser } from '../services/supabase/api';
import type { Group } from '../shared/types';
import { generateUUID } from '../shared/utils/uuid';

interface CreateGroupInput {
  name: string;
  emoji: string;
  currency: string;
  createdBy: string;
}

interface GroupsState {
  groups: Group[];
  isLoading: boolean;
  setGroups: (groups: Group[]) => void;
  fetchGroups: (userId: string) => Promise<void>;
  createGroup: (input: CreateGroupInput) => Promise<Group>;
  addMember: (groupId: string, userId: string) => void;
  getGroupById: (groupId: string) => Group | undefined;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  isLoading: false,

  setGroups: (groups) => set({ groups }),

  fetchGroups: async (userId) => {
    set({ isLoading: true });
    try {
      const groups = await fetchGroupsForUser(userId);
      set({ groups });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (input) => {
    const newGroup = await createGroupRemote({
      id: generateUUID(),
      name: input.name,
      emoji: input.emoji,
      currency: input.currency,
      createdAt: Date.now(),
      createdBy: input.createdBy,
    });

    set((state) => ({ groups: [newGroup, ...state.groups] }));
    return newGroup;
  },

  addMember: (groupId, userId) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId && !group.memberIds.includes(userId)
          ? { ...group, memberIds: [...group.memberIds, userId] }
          : group
      ),
    })),

  getGroupById: (groupId) => get().groups.find((g) => g.id === groupId),
}));
