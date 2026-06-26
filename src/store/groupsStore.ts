import { create } from 'zustand';
import {
  createGroup as createGroupRemote,
  deleteGroup as deleteGroupRemote,
  fetchGroupsForUser,
  leaveGroup as leaveGroupRemote,
  setGroupArchived as setGroupArchivedRemote,
  updateGroup as updateGroupRemote,
} from '../services/supabase/api';
import type { Group } from '../shared/types';
import { generateUUID } from '../shared/utils/uuid';

interface CreateGroupInput {
  name: string;
  emoji: string;
  currency: string;
  createdBy: string;
  isDirect?: boolean;
}

interface GroupsState {
  groups: Group[];
  isLoading: boolean;
  setGroups: (groups: Group[]) => void;
  fetchGroups: (userId: string) => Promise<void>;
  createGroup: (input: CreateGroupInput) => Promise<Group>;
  updateGroup: (groupId: string, fields: { name: string; emoji: string; currency: string }) => Promise<void>;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  setGroupArchived: (groupId: string, archived: boolean) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
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
      isDirect: input.isDirect ?? false,
    });

    set((state) => ({ groups: [newGroup, ...state.groups] }));
    return newGroup;
  },

  updateGroup: async (groupId, fields) => {
    await updateGroupRemote(groupId, fields);
    set((state) => ({
      groups: state.groups.map((group) => (group.id === groupId ? { ...group, ...fields } : group)),
    }));
  },

  leaveGroup: async (groupId, userId) => {
    await leaveGroupRemote(groupId, userId);
    set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) }));
  },

  setGroupArchived: async (groupId, archived) => {
    await setGroupArchivedRemote(groupId, archived);
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, archived } : g)),
    }));
  },

  deleteGroup: async (groupId) => {
    await deleteGroupRemote(groupId);
    set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) }));
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
