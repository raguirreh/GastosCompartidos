import * as ExpoCrypto from 'expo-crypto';

/**
 * Genera un UUID v4. Usa `globalThis.crypto.randomUUID` si está disponible
 * (Hermes moderno lo expone), y cae a `expo-crypto` como fallback para
 * versiones de Hermes/JSI que todavía no lo implementan.
 */
export function generateUUID(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;

  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }

  return ExpoCrypto.randomUUID();
}
