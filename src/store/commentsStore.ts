import { create } from 'zustand';
import {
  createComment as createCommentRemote,
  deleteComment as deleteCommentRemote,
  fetchCommentsForExpense,
} from '../services/supabase/api';
import type { Comment } from '../shared/types';
import { generateUUID } from '../shared/utils/uuid';

interface AddCommentInput {
  expenseId: string;
  userId: string;
  body: string;
}

interface CommentsState {
  commentsByExpense: Record<string, Comment[]>;
  fetchComments: (expenseId: string) => Promise<void>;
  addComment: (input: AddCommentInput) => Promise<Comment>;
  deleteComment: (expenseId: string, commentId: string) => Promise<void>;
  getCommentsForExpense: (expenseId: string) => Comment[];
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  commentsByExpense: {},

  fetchComments: async (expenseId) => {
    const comments = await fetchCommentsForExpense(expenseId);
    set((state) => ({
      commentsByExpense: { ...state.commentsByExpense, [expenseId]: comments },
    }));
  },

  addComment: async (input) => {
    const comment: Comment = {
      id: generateUUID(),
      expenseId: input.expenseId,
      userId: input.userId,
      body: input.body,
      createdAt: Date.now(),
    };

    await createCommentRemote(comment);

    set((state) => {
      const current = state.commentsByExpense[input.expenseId] ?? [];
      return {
        commentsByExpense: {
          ...state.commentsByExpense,
          [input.expenseId]: [...current, comment],
        },
      };
    });

    return comment;
  },

  deleteComment: async (expenseId, commentId) => {
    await deleteCommentRemote(commentId);
    set((state) => ({
      commentsByExpense: {
        ...state.commentsByExpense,
        [expenseId]: (state.commentsByExpense[expenseId] ?? []).filter((c) => c.id !== commentId),
      },
    }));
  },

  getCommentsForExpense: (expenseId) => get().commentsByExpense[expenseId] ?? [],
}));
