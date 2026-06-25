import { getSupabase } from './client';

/**
 * Autenticación real de Supabase: registro y login con email/contraseña.
 * Ya no se usa autenticación anónima — cada usuario debe crear una cuenta
 * real, lo que permite validar identidad en invitaciones a grupos.
 */

export async function signUp(
  email: string,
  password: string
): Promise<{ userId: string | null; needsEmailConfirmation: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { userId: null, needsEmailConfirmation: false };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const needsEmailConfirmation = !data.session;
  return { userId: data.user?.id ?? null, needsEmailConfirmation };
}

export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  return data.user?.id ?? null;
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const redirectTo =
    typeof window !== 'undefined' ? window.location.origin : 'gastoscompartidos://login';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
