import { create } from 'zustand';
import { insertGroup } from '../services/database/groupsRepository';
import { enqueueOutboxItem } from '../services/database/outboxRepository';
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
  createGroup: (input: CreateGroupInput) => Promise<Group>;
  addMember: (groupId: string, userId: string) => void;
  getGroupById: (groupId: string) => Group | undefined;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  isLoading: false,

  setGroups: (groups) => set({ groups }),

  createGroup: async (input) => {
    const newGroup: Group = {
      id: generateUUID(),
      name: input.name,
      emoji: input.emoji,
      currency: input.currency,
      createdAt: Date.now(),
      createdBy: input.createdBy,
      memberIds: [input.createdBy],
    };

    set((state) => ({ groups: [newGroup, ...state.groups] }));

    // Persistimos en SQLite (fuente de verdad) y encolamos para Firestore.
    await insertGroup(newGroup);
    await enqueueOutboxItem('create_group', newGroup);

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
