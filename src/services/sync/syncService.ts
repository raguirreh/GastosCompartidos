import type { Expense, Group, OutboxItem } from '../../shared/types';
import {
  getPendingOutboxItems,
  incrementOutboxRetries,
  removeOutboxItem,
} from '../database/outboxRepository';
import { upsertExpenseDoc, upsertGroupDoc } from '../supabase/api';

const MAX_RETRIES = 5;

/**
 * Procesa el outbox local intentando sincronizar cada item pendiente con
 * Supabase (Postgres). Implementa "last-write-wins": cada upsert reemplaza
 * la fila remota por la versión local más reciente. Si Supabase no está
 * configurado (ver services/supabase/client.ts), esta función es un no-op
 * seguro.
 *
 * Se invoca cuando `useNetworkStatus` detecta que volvimos a tener
 * conectividad.
 */
export async function processOutbox(): Promise<{ processed: number; failed: number }> {
  const items = await getPendingOutboxItems();
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await syncOutboxItem(item);
      await removeOutboxItem(item.id);
      processed += 1;
    } catch (error) {
      failed += 1;
      if (item.retries + 1 >= MAX_RETRIES) {
        // Tras demasiados intentos, removemos el item para no bloquear
        // indefinidamente la cola. En una implementación completa esto
        // se movería a una tabla de "dead letters" para revisión manual.
        await removeOutboxItem(item.id);
      } else {
        await incrementOutboxRetries(item.id);
      }
    }
  }

  return { processed, failed };
}

async function syncOutboxItem(item: OutboxItem): Promise<void> {
  const payload = JSON.parse(item.payload);

  switch (item.type) {
    case 'create_group':
    case 'update_group':
      await upsertGroupDoc(payload as Group);
      return;
    case 'create_expense':
    case 'update_expense':
      await upsertExpenseDoc(payload as Expense);
      return;
    case 'delete_expense':
    case 'create_transaction':
    case 'update_transaction':
      // No implementado en este scaffold: requeriría helpers adicionales
      // de borrado/transacciones en firestoreHelpers.ts.
      return;
    default:
      return;
  }
}
