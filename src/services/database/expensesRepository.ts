import type { Expense, Split } from '../../shared/types';
import { getDatabase } from './client';

interface ExpenseRow {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: string;
  date: number;
  notes: string;
  createdBy: string;
  createdAt: number;
  syncStatus: string;
}

interface SplitRow {
  expenseId: string;
  userId: string;
  amount: number;
  percentage: number | null;
}

export async function insertExpense(expense: Expense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO expenses
      (id, groupId, description, amount, currency, paidBy, category, date, notes, createdBy, createdAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      expense.id,
      expense.groupId,
      expense.description,
      expense.amount,
      expense.currency,
      expense.paidBy,
      expense.category,
      expense.date,
      expense.notes,
      expense.createdBy,
      expense.createdAt,
      expense.syncStatus,
    ]
  );

  await db.runAsync('DELETE FROM splits WHERE expenseId = ?;', [expense.id]);
  for (const split of expense.splits) {
    await db.runAsync(
      'INSERT INTO splits (expenseId, userId, amount, percentage) VALUES (?, ?, ?, ?);',
      [split.expenseId, split.userId, split.amount, split.percentage]
    );
  }
}

export async function getExpensesByGroup(groupId: string): Promise<Expense[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseRow>(
    'SELECT * FROM expenses WHERE groupId = ? ORDER BY date DESC;',
    [groupId]
  );

  const expenses: Expense[] = [];
  for (const row of rows) {
    const splitRows = await db.getAllAsync<SplitRow>(
      'SELECT * FROM splits WHERE expenseId = ?;',
      [row.id]
    );
    const splits: Split[] = splitRows.map((s) => ({
      expenseId: s.expenseId,
      userId: s.userId,
      amount: s.amount,
      percentage: s.percentage,
    }));

    expenses.push({
      ...row,
      category: row.category as Expense['category'],
      syncStatus: row.syncStatus as Expense['syncStatus'],
      splits,
    });
  }

  return expenses;
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM splits WHERE expenseId = ?;', [id]);
  await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
}
