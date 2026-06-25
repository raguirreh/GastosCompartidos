/**
 * Definición de esquema SQLite (fuente de verdad offline-first).
 *
 * NOTA DE SEGURIDAD (no implementado en este scaffold):
 * En producción, esta base de datos debería abrirse con SQLCipher en lugar
 * de SQLite plano, usando una clave de cifrado derivada del UID del usuario
 * (por ejemplo vía HKDF) y almacenada en `expo-secure-store` (Keychain en
 * iOS / Keystore en Android). `expo-sqlite` no trae SQLCipher integrado por
 * defecto, por lo que esto requeriría un módulo nativo adicional
 * (ej. op-sqlite con soporte SQLCipher, o react-native-sqlcipher-storage).
 * El punto de integración sería `openDatabase()` en `client.ts`, pasando
 * la clave recuperada de SecureStore como pragma `key` antes de cualquier
 * lectura/escritura.
 */
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  avatarColor TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  currency TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  createdBy TEXT NOT NULL,
  memberIds TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS group_members (
  groupId TEXT NOT NULL,
  userId TEXT NOT NULL,
  joinedAt INTEGER NOT NULL,
  PRIMARY KEY (groupId, userId)
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  groupId TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  paidBy TEXT NOT NULL,
  category TEXT NOT NULL,
  date INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdBy TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  syncStatus TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS splits (
  expenseId TEXT NOT NULL,
  userId TEXT NOT NULL,
  amount REAL NOT NULL,
  percentage REAL,
  PRIMARY KEY (expenseId, userId)
);

CREATE TABLE IF NOT EXISTS balances (
  groupId TEXT NOT NULL,
  fromUserId TEXT NOT NULL,
  toUserId TEXT NOT NULL,
  amount REAL NOT NULL,
  updatedAt INTEGER NOT NULL,
  PRIMARY KEY (groupId, fromUserId, toUserId)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  groupId TEXT NOT NULL,
  fromUserId TEXT NOT NULL,
  toUserId TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requestedAt INTEGER NOT NULL,
  confirmedAt INTEGER,
  syncStatus TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0
);
`;
