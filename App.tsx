import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { getTheme } from './src/app/theme/theme';
import { getDatabase } from './src/services/database/client';
import { signInAnonymouslyIfNeeded } from './src/services/supabase/auth';
import { processOutbox } from './src/services/sync/syncService';
import { useNetworkStatus } from './src/shared/hooks/useNetworkStatus';
import { useUserStore } from './src/store';

export default function App() {
  const themePreference = useUserStore((s) => s.themePreference);
  const theme = getTheme(themePreference);
  const { isOnline } = useNetworkStatus();

  // Inicialización de la base de datos local (fuente de verdad offline-first
  // en mobile, no disponible en web) y autenticación anónima contra Supabase.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      getDatabase().catch((error) => {
        console.warn('Error inicializando la base de datos local', error);
      });
    }
    signInAnonymouslyIfNeeded().catch(() => {
      // Supabase no configurado o sin conexión: la app sigue funcionando
      // con los datos de ejemplo locales.
    });
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
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
