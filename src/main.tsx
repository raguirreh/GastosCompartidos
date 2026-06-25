import { ConfigProvider } from 'antd';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router/AppRouter';
import { getTheme } from './app/theme/theme';
import { fetchProfile } from './services/supabase/api';
import { getSupabase } from './services/supabase/client';
import { useAuthStore } from './store/authStore';
import { useUserStore } from './store/userStore';

function App() {
  const themePreference = useUserStore((s) => s.themePreference);
  const theme = getTheme(themePreference);
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const setProfileLoading = useUserStore((s) => s.setProfileLoading);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) {
          setProfileLoading(true);
          try {
            const profile = await fetchProfile(data.session.user.id);
            if (profile) setCurrentUser(profile);
          } catch {
            // Si falla la carga del perfil, ProfileSetup lo pedirá de nuevo.
          } finally {
            setProfileLoading(false);
          }
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setProfileLoading(true);
        fetchProfile(session.user.id)
          .then((profile) => {
            if (profile) setCurrentUser(profile);
          })
          .catch(() => {
            // El perfil podría no existir todavía (cuenta recién creada).
          })
          .finally(() => {
            setProfileLoading(false);
          });
      } else {
        clearUser();
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
