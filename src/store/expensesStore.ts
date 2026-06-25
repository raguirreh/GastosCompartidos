import { create } from 'zustand';
import { createExpense as createExpenseRemote, fetchExpensesForGroup } from '../services/supabase/api';
import type { Expense, ExpenseCategory, Split, SplitMode } from '../shared/types';
import { roundCurrency } from '../shared/utils/debtSimplification';
import { generateUUID } from '../shared/utils/uuid';

interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: ExpenseCategory;
  date: number;
  notes: string;
  createdBy: string;
  splitMode: SplitMode;
  participantIds: string[];
  /** Para modo 'percentage': % por usuario. Para modo 'exact': monto por usuario. Para 'shares': número de shares por usuario. */
  customValues?: Record<string, number>;
}

interface ExpensesState {
  expensesByGroup: Record<string, Expense[]>;
  setExpensesForGroup: (groupId: string, expenses: Expense[]) => void;
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<Expense>;
  getExpensesForGroup: (groupId: string) => Expense[];
}

export function calculateSplits(
  amount: number,
  participantIds: string[],
  mode: SplitMode,
  expenseId: string,
  customValues?: Record<string, number>
): Split[] {
  if (participantIds.length === 0) return [];

  if (mode === 'equal') {
    const baseAmount = roundCurrency(amount / participantIds.length);
    const splits = participantIds.map((userId) => ({
      expenseId,
      userId,
      amount: baseAmount,
      percentage: roundCurrency(100 / participantIds.length),
    }));
    // Ajustar el residuo de redondeo en el primer participante.
    const total = roundCurrency(baseAmount * participantIds.length);
    const diff = roundCurrency(amount - total);
    if (diff !== 0 && splits.length > 0) {
      splits[0].amount = roundCurrency(splits[0].amount + diff);
    }
    return splits;
  }

  if (mode === 'percentage') {
    return participantIds.map((userId) => {
      const percentage = customValues?.[userId] ?? 0;
      return {
        expenseId,
        userId,
        amount: roundCurrency((amount * percentage) / 100),
        percentage,
      };
    });
  }

  if (mode === 'exact') {
    return participantIds.map((userId) => ({
      expenseId,
      userId,
      amount: roundCurrency(customValues?.[userId] ?? 0),
      percentage: null,
    }));
  }

  // mode === 'shares'
  const totalShares = participantIds.reduce(
    (sum, userId) => sum + (customValues?.[userId] ?? 1),
    0
  );
  return participantIds.map((userId) => {
    const shares = customValues?.[userId] ?? 1;
    const proportion = totalShares > 0 ? shares / totalShares : 0;
    return {
      expenseId,
      userId,
      amount: roundCurrency(amount * proportion),
      percentage: roundCurrency(proportion * 100),
    };
  });
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expensesByGroup: {},

  setExpensesForGroup: (groupId, expenses) =>
    set((state) => ({
      expensesByGroup: { ...state.expensesByGroup, [groupId]: expenses },
    })),

  fetchExpenses: async (groupId) => {
    const expenses = await fetchExpensesForGroup(groupId);
    set((state) => ({
      expensesByGroup: { ...state.expensesByGroup, [groupId]: expenses },
    }));
  },

  addExpense: async (input) => {
    const id = generateUUID();
    const splits = calculateSplits(
      input.amount,
      input.participantIds,
      input.splitMode,
      id,
      input.customValues
    );

    const expense: Expense = {
      id,
      groupId: input.groupId,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      paidBy: input.paidBy,
      category: input.category,
      date: input.date,
      notes: input.notes,
      splits,
      createdBy: input.createdBy,
      createdAt: Date.now(),
      syncStatus: 'synced',
    };

    set((state) => {
      const current = state.expensesByGroup[input.groupId] ?? [];
      return {
        expensesByGroup: {
          ...state.expensesByGroup,
          [input.groupId]: [expense, ...current],
        },
      };
    });

    await createExpenseRemote(expense);

    return expense;
  },

  getExpensesForGroup: (groupId) => get().expensesByGroup[groupId] ?? [],
}));
