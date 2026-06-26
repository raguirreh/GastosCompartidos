import { getSupabase } from './client';
import type { Expense, Group, Split, User } from '../../shared/types';

/**
 * CRUD real contra Supabase (Postgres + RLS). Reemplaza los helpers de
 * Firestore: la app web opera directamente contra estas funciones (no hay
 * capa SQLite en el build web).
 */

interface ProfileRow {
  id: string;
  name: string;
  emoji: string;
  avatar_color: string;
  created_at: string;
}

function profileRowToUser(row: ProfileRow): User {
  return {
    uid: row.id,
    name: row.name,
    emoji: row.emoji,
    avatarColor: row.avatar_color,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function upsertProfile(user: User): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.uid, name: user.name, emoji: user.emoji, avatar_color: user.avatarColor });
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? profileRowToUser(data as ProfileRow) : null;
}

export async function fetchProfilesByIds(ids: string[]): Promise<User[]> {
  const supabase = getSupabase();
  if (!supabase || ids.length === 0) return [];

  const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
  if (error) throw error;
  return (data ?? []).map((row) => profileRowToUser(row as ProfileRow));
}

interface GroupRow {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  created_by: string;
  invite_token: string;
  created_at: string;
}

function groupRowToGroup(row: GroupRow, memberIds: string[]): Group {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    currency: row.currency,
    createdAt: new Date(row.created_at).getTime(),
    createdBy: row.created_by,
    memberIds,
    inviteToken: row.invite_token,
  };
}

/**
 * Crea un grupo en Supabase y devuelve el `Group` completo (incluyendo el
 * `inviteToken` real generado por el default de la tabla), para que el
 * caller pueda renderizar el link de invitación inmediatamente.
 */
export async function createGroup(group: Omit<Group, 'memberIds' | 'inviteToken'>): Promise<Group> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ...group, memberIds: [group.createdBy], inviteToken: '' };
  }

  const { data, error: groupError } = await supabase
    .from('groups')
    .insert({
      id: group.id,
      name: group.name,
      emoji: group.emoji,
      currency: group.currency,
      created_by: group.createdBy,
    })
    .select()
    .single();
  if (groupError) throw groupError;

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: group.createdBy });
  if (memberError) throw memberError;

  return groupRowToGroup(data as GroupRow, [group.createdBy]);
}

/** Upsert genérico usado por el outbox (sync last-write-wins). */
export async function upsertGroupDoc(group: Group): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('groups').upsert({
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    currency: group.currency,
    created_by: group.createdBy,
  });
  if (error) throw error;
}

/** Upsert genérico usado por el outbox (sync last-write-wins). */
export async function upsertExpenseDoc(expense: Expense): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('expenses').upsert({
    id: expense.id,
    group_id: expense.groupId,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    paid_by: expense.paidBy,
    category: expense.category,
    expense_date: new Date(expense.date).toISOString().slice(0, 10),
    notes: expense.notes,
    created_by: expense.createdBy,
  });
  if (error) throw error;

  if (expense.splits.length > 0) {
    const { error: splitsError } = await supabase.from('splits').upsert(
      expense.splits.map((s) => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: s.amount,
        percentage: s.percentage,
      }))
    );
    if (splitsError) throw splitsError;
  }
}

export async function joinGroup(groupId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('group_members')
    .upsert({ group_id: groupId, user_id: userId });
  if (error) throw error;
}

interface ResolveInviteTokenRow {
  id: string;
  name: string;
  emoji: string;
  currency: string;
}

/**
 * Resuelve un token de invitación a su grupo (preview), usable por
 * cualquier usuario autenticado aunque todavía no sea miembro. Usa la RPC
 * `resolve_invite_token` (SECURITY DEFINER). Devuelve null si no existe.
 */
export async function resolveInviteToken(
  token: string
): Promise<{ id: string; name: string; emoji: string; currency: string } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('resolve_invite_token', { token });
  if (error) throw error;

  const rows = (data ?? []) as ResolveInviteTokenRow[];
  if (rows.length === 0) return null;

  const row = rows[0];
  return { id: row.id, name: row.name, emoji: row.emoji, currency: row.currency };
}

/**
 * Resuelve el token y une al usuario autenticado actual al grupo
 * correspondiente, vía la RPC `join_group_by_invite_token` (SECURITY
 * DEFINER). Lanza `invalid_invite_token` si el token no es válido.
 */
export async function joinGroupByInviteToken(token: string): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase no configurado');

  const { data, error } = await supabase.rpc('join_group_by_invite_token', { token });
  if (error) throw error;

  return data as string;
}

export async function fetchGroupsForUser(userId: string): Promise<Group[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: memberships, error: membershipsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (membershipsError) throw membershipsError;

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);
  if (groupsError) throw groupsError;

  const { data: allMembers, error: allMembersError } = await supabase
    .from('group_members')
    .select('group_id, user_id')
    .in('group_id', groupIds);
  if (allMembersError) throw allMembersError;

  return (groups ?? []).map((row) => {
    const memberIds = (allMembers ?? [])
      .filter((m) => m.group_id === row.id)
      .map((m) => m.user_id);
    return groupRowToGroup(row as GroupRow, memberIds);
  });
}

interface ExpenseRow {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  category: string;
  expense_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface SplitRow {
  expense_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
}

function rowsToExpense(row: ExpenseRow, splitRows: SplitRow[]): Expense {
  const splits: Split[] = splitRows
    .filter((s) => s.expense_id === row.id)
    .map((s) => ({ expenseId: s.expense_id, userId: s.user_id, amount: s.amount, percentage: s.percentage }));

  return {
    id: row.id,
    groupId: row.group_id,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    paidBy: row.paid_by,
    category: row.category as Expense['category'],
    date: new Date(row.expense_date).getTime(),
    notes: row.notes ?? '',
    splits,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).getTime(),
    syncStatus: 'synced',
  };
}

export async function createExpense(expense: Expense): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: expenseError } = await supabase.from('expenses').insert({
    id: expense.id,
    group_id: expense.groupId,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    paid_by: expense.paidBy,
    category: expense.category,
    expense_date: new Date(expense.date).toISOString().slice(0, 10),
    notes: expense.notes,
    created_by: expense.createdBy,
  });
  if (expenseError) throw expenseError;

  if (expense.splits.length > 0) {
    const { error: splitsError } = await supabase.from('splits').insert(
      expense.splits.map((s) => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: s.amount,
        percentage: s.percentage,
      }))
    );
    if (splitsError) throw splitsError;
  }
}

export async function updateExpense(expense: Expense): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      paid_by: expense.paidBy,
      category: expense.category,
      expense_date: new Date(expense.date).toISOString().slice(0, 10),
      notes: expense.notes,
    })
    .eq('id', expense.id);
  if (expenseError) throw expenseError;

  const { error: deleteSplitsError } = await supabase.from('splits').delete().eq('expense_id', expense.id);
  if (deleteSplitsError) throw deleteSplitsError;

  if (expense.splits.length > 0) {
    const { error: splitsError } = await supabase.from('splits').insert(
      expense.splits.map((s) => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: s.amount,
        percentage: s.percentage,
      }))
    );
    if (splitsError) throw splitsError;
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: splitsError } = await supabase.from('splits').delete().eq('expense_id', expenseId);
  if (splitsError) throw splitsError;

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

export async function fetchExpensesForGroup(groupId: string): Promise<Expense[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: expenseRows, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('expense_date', { ascending: false });
  if (expensesError) throw expensesError;

  const expenseIds = (expenseRows ?? []).map((e) => e.id);
  let splitRows: SplitRow[] = [];
  if (expenseIds.length > 0) {
    const { data, error: splitsError } = await supabase
      .from('splits')
      .select('*')
      .in('expense_id', expenseIds);
    if (splitsError) throw splitsError;
    splitRows = (data ?? []) as SplitRow[];
  }

  return (expenseRows ?? []).map((row) => rowsToExpense(row as ExpenseRow, splitRows));
}
