import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import type { Expense, Group } from '../../shared/types';
import { getFirestoreDb } from './firebaseConfig';

/**
 * Helpers básicos de lectura/escritura contra Firestore. No están
 * conectados a la UI en este scaffold (la app opera 100% sobre SQLite
 * local); quedan listos para que el servicio de sincronización (ver
 * services/sync) los invoque cuando se procese el outbox.
 */

export async function fetchGroupDoc(groupId: string): Promise<Group | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  const ref = doc(db, 'groups', groupId);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as Group) : null;
}

export async function upsertGroupDoc(group: Group): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const ref = doc(db, 'groups', group.id);
  await setDoc(ref, group, { merge: true });
}

export async function fetchExpensesForGroup(groupId: string): Promise<Expense[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  const expensesQuery = query(collection(db, 'expenses'), where('groupId', '==', groupId));
  const snapshot = await getDocs(expensesQuery);
  return snapshot.docs.map((d) => d.data() as Expense);
}

export async function upsertExpenseDoc(expense: Expense): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  const ref = doc(db, 'expenses', expense.id);
  await setDoc(ref, expense, { merge: true });
}
