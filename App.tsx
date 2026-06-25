import './src/styles/global';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGate, RootNavigator } from './src/app/navigation/RootNavigator';
import type { RootStackParamList } from './src/app/navigation/types';
import { getTheme } from './src/app/theme/theme';
import { getDatabase } from './src/services/database/client';
import { fetchProfile } from './src/services/supabase/api';
import { getSupabase } from './src/services/supabase/client';
import { processOutbox } from './src/services/sync/syncService';
import { useNetworkStatus } from './src/shared/hooks/useNetworkStatus';
import { useAuthStore } from './src/store/authStore';
import { useUserStore } from './src/store';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://gastoscompartidos.raguirre-contact.workers.dev'],
  config: {
    screens: {
      Join: 'join/:token',
    },
  },
};

export default function App() {
  const themePreference = useUserStore((s) => s.themePreference);
  const theme = getTheme(themePreference);
  const { isOnline } = useNetworkStatus();
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const setProfileLoading = useUserStore((s) => s.setProfileLoading);

  // Inicialización de la base de datos local (fuente de verdad offline-first
  // en mobile, no disponible en web) y suscripción al estado de auth real de
  // Supabase (signup/login con cuenta real, sin sesiones anónimas).
  useEffect(() => {
    if (Platform.OS !== 'web') {
      getDatabase().catch((error) => {
        console.warn('Error inicializando la base de datos local', error);
      });
    }

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
            // Si falla la carga del perfil, la pantalla de ProfileSetup se
            // encargará de pedirlo de nuevo.
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

  // Cuando recuperamos conectividad, intentamos drenar el outbox pendiente.
  useEffect(() => {
    if (isOnline) {
      processOutbox().catch(() => {
        // Los reintentos se gestionan dentro de processOutbox vía retries.
      });
    }
  }, [isOnline]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={themePreference === 'dark' ? 'light' : 'dark'} />
          <NavigationContainer linking={linking}>
            <AuthGate />
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
