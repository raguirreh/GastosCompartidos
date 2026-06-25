import type { Expense, Group, User } from '../types';

/**
 * Datos de muestra (mock) usados para poblar la UI mientras no hay un
 * backend real conectado. Esto es intencional para este scaffold: las
 * pantallas son completamente navegables y muestran layouts reales,
 * pero los datos no provienen de SQLite/Firestore todavía.
 */

export const mockUsers: User[] = [
  { uid: 'u1', name: 'Rodrigo', emoji: '🧑', avatarColor: '#D3E6F5', createdAt: Date.now() },
  { uid: 'u2', name: 'Valentina', emoji: '👩', avatarColor: '#FCE4EC', createdAt: Date.now() },
  { uid: 'u3', name: 'Marco', emoji: '🧔', avatarColor: '#E1F5E5', createdAt: Date.now() },
  { uid: 'u4', name: 'Camila', emoji: '👩‍🦱', avatarColor: '#FFF3E0', createdAt: Date.now() },
];

export const mockGroups: Group[] = [
  {
    id: 'g1',
    name: 'Viaje a Cusco',
    emoji: '🏔️',
    currency: 'PEN',
    createdAt: Date.now() - 86400000 * 10,
    createdBy: 'u1',
    memberIds: ['u1', 'u2', 'u3', 'u4'],
  },
  {
    id: 'g2',
    name: 'Depa Miraflores',
    emoji: '🏠',
    currency: 'PEN',
    createdAt: Date.now() - 86400000 * 60,
    createdBy: 'u1',
    memberIds: ['u1', 'u2'],
  },
  {
    id: 'g3',
    name: 'Asado del sábado',
    emoji: '🍖',
    currency: 'PEN',
    createdAt: Date.now() - 86400000 * 2,
    createdBy: 'u3',
    memberIds: ['u1', 'u3', 'u4'],
  },
];

export const mockExpenses: Expense[] = [
  {
    id: 'e1',
    groupId: 'g1',
    description: 'Hotel 2 noches',
    amount: 480,
    currency: 'PEN',
    paidBy: 'u1',
    category: 'travel',
    date: Date.now() - 86400000 * 9,
    notes: '',
    splits: [
      { expenseId: 'e1', userId: 'u1', amount: 120, percentage: 25 },
      { expenseId: 'e1', userId: 'u2', amount: 120, percentage: 25 },
      { expenseId: 'e1', userId: 'u3', amount: 120, percentage: 25 },
      { expenseId: 'e1', userId: 'u4', amount: 120, percentage: 25 },
    ],
    createdBy: 'u1',
    createdAt: Date.now() - 86400000 * 9,
    syncStatus: 'synced',
  },
  {
    id: 'e2',
    groupId: 'g1',
    description: 'Cena Plaza de Armas',
    amount: 160,
    currency: 'PEN',
    paidBy: 'u2',
    category: 'food',
    date: Date.now() - 86400000 * 8,
    notes: '',
    splits: [
      { expenseId: 'e2', userId: 'u1', amount: 40, percentage: 25 },
      { expenseId: 'e2', userId: 'u2', amount: 40, percentage: 25 },
      { expenseId: 'e2', userId: 'u3', amount: 40, percentage: 25 },
      { expenseId: 'e2', userId: 'u4', amount: 40, percentage: 25 },
    ],
    createdBy: 'u2',
    createdAt: Date.now() - 86400000 * 8,
    syncStatus: 'synced',
  },
  {
    id: 'e3',
    groupId: 'g2',
    description: 'Alquiler junio',
    amount: 1200,
    currency: 'PEN',
    paidBy: 'u2',
    category: 'housing',
    date: Date.now() - 86400000 * 5,
    notes: 'Depósito mensual',
    splits: [
      { expenseId: 'e3', userId: 'u1', amount: 600, percentage: 50 },
      { expenseId: 'e3', userId: 'u2', amount: 600, percentage: 50 },
    ],
    createdBy: 'u2',
    createdAt: Date.now() - 86400000 * 5,
    syncStatus: 'pending',
  },
  {
    id: 'e4',
    groupId: 'g3',
    description: 'Carbón y carne',
    amount: 150,
    currency: 'PEN',
    paidBy: 'u3',
    category: 'food',
    date: Date.now() - 86400000,
    notes: '',
    splits: [
      { expenseId: 'e4', userId: 'u1', amount: 50, percentage: 33.33 },
      { expenseId: 'e4', userId: 'u3', amount: 50, percentage: 33.33 },
      { expenseId: 'e4', userId: 'u4', amount: 50, percentage: 33.33 },
    ],
    createdBy: 'u3',
    createdAt: Date.now() - 86400000,
    syncStatus: 'pending',
  },
];

export const mockCategories: Array<{ value: Expense['category']; label: string; icon: string }> = [
  { value: 'food', label: 'Comida', icon: 'food' },
  { value: 'transport', label: 'Transporte', icon: 'bus' },
  { value: 'housing', label: 'Vivienda', icon: 'home' },
  { value: 'entertainment', label: 'Entretenimiento', icon: 'movie-open' },
  { value: 'shopping', label: 'Compras', icon: 'cart' },
  { value: 'health', label: 'Salud', icon: 'medical-bag' },
  { value: 'travel', label: 'Viaje', icon: 'airplane' },
  { value: 'other', label: 'Otro', icon: 'dots-horizontal' },
];

export function getMockUserById(uid: string): User | undefined {
  return mockUsers.find((u) => u.uid === uid);
}
