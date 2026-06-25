import { create } from 'zustand';
import type { Expense } from '../shared/types';
import { computeGroupSettlements, type Settlement } from '../shared/utils/debtSimplification';

interface BalancesState {
  settlementsByGroup: Record<string, Settlement[]>;
  recalculateForGroup: (groupId: string, expenses: Expense[]) => Settlement[];
  getSettlementsForGroup: (groupId: string) => Settlement[];
}

export const useBalancesStore = create<BalancesState>((set, get) => ({
  settlementsByGroup: {},

  recalculateForGroup: (groupId, expenses) => {
    const settlements = computeGroupSettlements(
      expenses.map((expense) => ({
        paidBy: expense.paidBy,
        amount: expense.amount,
        splits: expense.splits.map((split) => ({ userId: split.userId, amount: split.amount })),
      }))
    );

    set((state) => ({
      settlementsByGroup: { ...state.settlementsByGroup, [groupId]: settlements },
    }));

    return settlements;
  },

  getSettlementsForGroup: (groupId) => get().settlementsByGroup[groupId] ?? [],
}));
