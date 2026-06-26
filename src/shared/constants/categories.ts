import type { Expense } from '../types';

/** Metadata estática (no es data de usuario) de categorías de gasto. */
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

/** Pseudo-categoría usada para registrar pagos (settle up), no aparece en el selector de gastos. */
export const paymentCategory = { value: 'payment' as const, label: 'Pago', icon: 'cash' };
