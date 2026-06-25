import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Hook simple para saber si el dispositivo tiene conectividad.
 * Se usa para el indicador visual online/offline (HomeScreen) y para
 * decidir cuándo el servicio de sync debe intentar drenar el outbox.
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
}
