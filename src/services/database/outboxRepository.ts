import type { OutboxItem, OutboxOperationType } from '../../shared/types';
import { generateUUID } from '../../shared/utils/uuid';
import { getDatabase } from './client';

/**
 * Encola una operación pendiente de sincronización con Firestore.
 * El `sync` service (ver services/sync) procesará este outbox cuando
 * detecte conectividad, aplicando "last-write-wins" por timestamp en
 * caso de conflicto remoto.
 */
export async function enqueueOutboxItem(
  type: OutboxOperationType,
  payload: unknown
): Promise<OutboxItem> {
  const db = await getDatabase();
  const item: OutboxItem = {
    id: generateUUID(),
    type,
    payload: JSON.stringify(payload),
    createdAt: Date.now(),
    retries: 0,
  };

  await db.runAsync(
    'INSERT INTO outbox (id, type, payload, createdAt, retries) VALUES (?, ?, ?, ?, ?);',
    [item.id, item.type, item.payload, item.createdAt, item.retries]
  );

  return item;
}

export async function getPendingOutboxItems(): Promise<OutboxItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<OutboxItem>('SELECT * FROM outbox ORDER BY createdAt ASC;');
}

export async function removeOutboxItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM outbox WHERE id = ?;', [id]);
}

export async function incrementOutboxRetries(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE outbox SET retries = retries + 1 WHERE id = ?;', [id]);
}
