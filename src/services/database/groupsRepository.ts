import type { Group } from '../../shared/types';
import { getDatabase } from './client';

interface GroupRow {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  createdAt: number;
  createdBy: string;
  memberIds: string;
}

function rowToGroup(row: GroupRow): Group {
  return {
    ...row,
    memberIds: JSON.parse(row.memberIds) as string[],
  };
}

export async function insertGroup(group: Group): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO groups (id, name, emoji, currency, createdAt, createdBy, memberIds)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      group.id,
      group.name,
      group.emoji,
      group.currency,
      group.createdAt,
      group.createdBy,
      JSON.stringify(group.memberIds),
    ]
  );
}

export async function getAllGroups(): Promise<Group[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<GroupRow>('SELECT * FROM groups ORDER BY createdAt DESC;');
  return rows.map(rowToGroup);
}

export async function getGroupById(id: string): Promise<Group | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<GroupRow>('SELECT * FROM groups WHERE id = ?;', [id]);
  return row ? rowToGroup(row) : null;
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM groups WHERE id = ?;', [id]);
}
