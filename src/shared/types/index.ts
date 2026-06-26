/**
 * Tipos centrales de dominio para Gastos Compartidos.
 * Estos tipos reflejan el schema de datos tanto en SQLite (local, fuente de verdad)
 * como en Firestore (sincronización remota).
 */

export type SyncStatus = 'synced' | 'pending' | 'error';

export type SplitMode = 'equal' | 'percentage' | 'exact' | 'shares';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'shopping'
  | 'health'
  | 'travel'
  | 'other'
  | 'payment';

export interface User {
  uid: string;
  name: string;
  emoji: string;
  avatarColor: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  createdAt: number;
  createdBy: string;
  memberIds: string[];
  inviteToken: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  joinedAt: number;
}

export interface Split {
  expenseId: string;
  userId: string;
  amount: number;
  percentage: number | null;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: ExpenseCategory;
  date: number;
  notes: string;
  splits: Split[];
  createdBy: string;
  createdAt: number;
  syncStatus: SyncStatus;
}

export interface Comment {
  id: string;
  expenseId: string;
  userId: string;
  body: string;
  createdAt: number;
}

export interface BalanceRecord {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  updatedAt: number;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';

export interface Transaction {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: TransactionStatus;
  requestedAt: number;
  confirmedAt: number | null;
  syncStatus: SyncStatus;
}

export type OutboxOperationType =
  | 'create_group'
  | 'update_group'
  | 'create_expense'
  | 'update_expense'
  | 'delete_expense'
  | 'create_transaction'
  | 'update_transaction';

export interface OutboxItem {
  id: string;
  type: OutboxOperationType;
  payload: string; // JSON serializado
  createdAt: number;
  retries: number;
}
