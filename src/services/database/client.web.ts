/**
 * Stub web: no hay SQLite local en la build de navegador (el backend WASM de
 * expo-sqlite no es compatible con este pipeline de export estático). En web
 * la app habla directamente con Supabase; estas funciones quedan como no-ops
 * para que el resto del código (pensado para mobile) no falle al importar
 * este módulo.
 */
export type SQLiteDatabaseLike = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>;
  getAllAsync: (sql: string, ...params: unknown[]) => Promise<unknown[]>;
  getFirstAsync: (sql: string, ...params: unknown[]) => Promise<unknown | null>;
};

const noopDb: SQLiteDatabaseLike = {
  execAsync: async () => {},
  runAsync: async () => ({}),
  getAllAsync: async () => [],
  getFirstAsync: async () => null,
};

export async function getDatabase(): Promise<SQLiteDatabaseLike> {
  return noopDb;
}

export async function resetDatabase(): Promise<void> {
  // No-op en web.
}
