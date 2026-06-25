import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { getTheme } from './src/app/theme/theme';
import { getDatabase } from './src/services/database/client';
import { signInAnonymouslyIfNeeded } from './src/services/firebase/firebaseConfig';
import { processOutbox } from './src/services/sync/syncService';
import { useNetworkStatus } from './src/shared/hooks/useNetworkStatus';
import { useUserStore } from './src/store';

export default function App() {
  const themePreference = useUserStore((s) => s.themePreference);
  const theme = getTheme(themePreference);
  const { isOnline } = useNetworkStatus();

  // Inicialización de la base de datos local (fuente de verdad offline-first)
  // y, si hay conectividad y Firebase está configurado, autenticación anónima.
  useEffect(() => {
    getDatabase().catch((error) => {
      console.warn('Error inicializando la base de datos local', error);
    });
    signInAnonymouslyIfNeeded().catch(() => {
      // Firebase no configurado o sin conexión: la app sigue funcionando
      // 100% offline contra SQLite, que es la fuente de verdad.
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
