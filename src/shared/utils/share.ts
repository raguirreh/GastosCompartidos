import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

/**
 * Comparte texto/link usando el mecanismo disponible en la plataforma:
 * Web Share API si existe, si no copia al portapapeles. expo-sharing no
 * está disponible en web, por lo que nunca se llama ahí.
 */
export async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'unavailable'> {
  if (Platform.OS === 'web') {
    const nav = (globalThis as { navigator?: Navigator & { share?: (data: ShareData) => Promise<void> } }).navigator;
    if (nav?.share) {
      try {
        await nav.share({ text });
        return 'shared';
      } catch {
        // El usuario canceló el share nativo del navegador: no es un error.
      }
    }
    await Clipboard.setStringAsync(text);
    return 'copied';
  }

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(text);
    return 'shared';
  }

  await Clipboard.setStringAsync(text);
  return 'copied';
}

/** Abre WhatsApp con el mensaje dado, usando wa.me en web y el esquema nativo en mobile. */
export async function openWhatsApp(nativeUrl: string, webUrl: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    await Linking.openURL(webUrl);
    return true;
  }

  const canOpen = await Linking.canOpenURL(nativeUrl);
  if (canOpen) {
    await Linking.openURL(nativeUrl);
    return true;
  }

  return false;
}
