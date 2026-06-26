import { create } from 'zustand';
import {
  advanceRecurrence,
  createExpense as createExpenseRemote,
  deleteExpense as deleteExpenseRemote,
  fetchExpensesForGroup,
  updateExpense as updateExpenseRemote,
} from '../services/supabase/api';
import type { Expense, ExpenseCategory, RecurrenceRule, Split, SplitMode } from '../shared/types';
import { roundCurrency } from '../shared/utils/debtSimplification';
import { nextOccurrence } from '../shared/utils/recurrence';
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
  /** Si se define, este gasto se convierte en plantilla que genera nuevas instancias periódicamente. */
  recurrenceRule?: RecurrenceRule | null;
}

interface UpdateExpenseInput extends CreateExpenseInput {
  id: string;
}

interface RecordPaymentInput {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
}

interface ExpensesState {
  expensesByGroup: Record<string, Expense[]>;
  setExpensesForGroup: (groupId: string, expenses: Expense[]) => void;
  fetchExpenses: (groupId: string) => Promise<void>;
  generateDueOccurrences: (groupId: string) => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<Expense>;
  updateExpense: (input: UpdateExpenseInput) => Promise<Expense>;
  deleteExpense: (groupId: string, expenseId: string) => Promise<void>;
  recordPayment: (input: RecordPaymentInput) => Promise<Expense>;
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
    await get().generateDueOccurrences(groupId);
  },

  generateDueOccurrences: async (groupId) => {
    const templates = (get().expensesByGroup[groupId] ?? []).filter(
      (e) => e.recurrenceRule && e.nextOccurrenceDate !== null && e.nextOccurrenceDate <= Date.now()
    );

    for (const template of templates) {
      let nextDate = template.nextOccurrenceDate as number;
      const generated: Expense[] = [];
      let iterations = 0;

      while (nextDate <= Date.now() && iterations < 24) {
        const id = generateUUID();
        const occurrence: Expense = {
          ...template,
          id,
          date: nextDate,
          createdAt: Date.now(),
          splits: template.splits.map((s) => ({ ...s, expenseId: id })),
          recurrenceRule: null,
          nextOccurrenceDate: null,
        };
        await createExpenseRemote(occurrence);
        generated.push(occurrence);
        nextDate = nextOccurrence(nextDate, template.recurrenceRule as RecurrenceRule);
        iterations += 1;
      }

      if (generated.length > 0) {
        await advanceRecurrence(template.id, nextDate);
        set((state) => ({
          expensesByGroup: {
            ...state.expensesByGroup,
            [groupId]: (state.expensesByGroup[groupId] ?? []).map((e) =>
              e.id === template.id ? { ...e, nextOccurrenceDate: nextDate } : e
            ).concat(generated),
          },
        }));
      }
    }
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
    const recurrenceRule = input.recurrenceRule ?? null;

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
      recurrenceRule,
      nextOccurrenceDate: recurrenceRule ? nextOccurrence(input.date, recurrenceRule) : null,
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

  updateExpense: async (input) => {
    const splits = calculateSplits(input.amount, input.participantIds, input.splitMode, input.id, input.customValues);

    const existing = (get().expensesByGroup[input.groupId] ?? []).find((e) => e.id === input.id);
    const recurrenceRule = input.recurrenceRule ?? null;
    const nextOccurrenceDate = recurrenceRule
      ? existing?.recurrenceRule === recurrenceRule && existing?.nextOccurrenceDate
        ? existing.nextOccurrenceDate
        : nextOccurrence(input.date, recurrenceRule)
      : null;

    const expense: Expense = {
      id: input.id,
      groupId: input.groupId,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      paidBy: input.paidBy,
      category: input.category,
      date: input.date,
      notes: input.notes,
      splits,
      createdBy: existing?.createdBy ?? input.createdBy,
      createdAt: existing?.createdAt ?? Date.now(),
      syncStatus: 'synced',
      recurrenceRule,
      nextOccurrenceDate,
    };

    await updateExpenseRemote(expense);

    set((state) => ({
      expensesByGroup: {
        ...state.expensesByGroup,
        [input.groupId]: (state.expensesByGroup[input.groupId] ?? []).map((e) =>
          e.id === input.id ? expense : e
        ),
      },
    }));

    return expense;
  },

  deleteExpense: async (groupId, expenseId) => {
    await deleteExpenseRemote(expenseId);
    set((state) => ({
      expensesByGroup: {
        ...state.expensesByGroup,
        [groupId]: (state.expensesByGroup[groupId] ?? []).filter((e) => e.id !== expenseId),
      },
    }));
  },

  recordPayment: async (input) => {
    const id = generateUUID();
    // Un pago se modela como un gasto especial: quien paga (fromUserId) cubre el
    // monto completo y la única "porción" se asigna a quien recibe (toUserId).
    // Esto cancela exactamente la deuda existente sin tocar el cálculo de balances.
    const expense: Expense = {
      id,
      groupId: input.groupId,
      description: 'Pago',
      amount: input.amount,
      currency: input.currency,
      paidBy: input.fromUserId,
      category: 'payment',
      date: Date.now(),
      notes: '',
      splits: [{ expenseId: id, userId: input.toUserId, amount: input.amount, percentage: null }],
      createdBy: input.fromUserId,
      createdAt: Date.now(),
      syncStatus: 'synced',
      recurrenceRule: null,
      nextOccurrenceDate: null,
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
