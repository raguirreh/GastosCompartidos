import type { RecurrenceRule } from '../types';

export function nextOccurrence(fromDate: number, rule: RecurrenceRule): number {
  const date = new Date(fromDate);
  if (rule === 'weekly') date.setDate(date.getDate() + 7);
  if (rule === 'monthly') date.setMonth(date.getMonth() + 1);
  if (rule === 'yearly') date.setFullYear(date.getFullYear() + 1);
  return date.getTime();
}
