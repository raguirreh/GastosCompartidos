import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

const DATABASE_NAME = 'gastos_compartidos.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Abre (o reutiliza) la conexión a la base de datos local y garantiza que
 * todas las tablas del schema existan.
 *
 * NOTA: aquí es donde se integraría SQLCipher en producción, pasando la
 * clave de cifrado (derivada del UID, guardada en expo-secure-store) como
 * pragma de apertura. Ver comentario en `schema.ts`.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(CREATE_TABLES_SQL);
      dbInstance = db;
      return db;
    })();
  }

  return initPromise;
}

/** Útil principalmente para tests o para "Limpiar datos locales" en Perfil. */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM outbox;
    DELETE FROM transactions;
    DELETE FROM balances;
    DELETE FROM splits;
    DELETE FROM expenses;
    DELETE FROM group_members;
    DELETE FROM groups;
    DELETE FROM users;
  `);
}
