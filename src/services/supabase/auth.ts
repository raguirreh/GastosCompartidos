import { getSupabase } from './client';

/**
 * Inicia sesión anónima vía Supabase Auth. Equivalente al Anonymous Auth de
 * Firebase: el usuario obtiene un UID real (auth.uid()) sin registrarse,
 * y ese UID es el que validan las políticas RLS (ver migración inicial).
 */
export async function signInAnonymouslyIfNeeded(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return sessionData.session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  return data.user?.id ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
