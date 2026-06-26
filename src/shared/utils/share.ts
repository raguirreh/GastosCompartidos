/**
 * Comparte texto/link usando el mecanismo disponible en el navegador:
 * Web Share API si existe, si no copia al portapapeles.
 */
export async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'unavailable'> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // El usuario canceló el share nativo del navegador: no es un error.
    }
  }

  await navigator.clipboard.writeText(text);
  return 'copied';
}

/** Abre WhatsApp Web con el mensaje dado. */
export async function openWhatsApp(_nativeUrl: string, webUrl: string): Promise<boolean> {
  window.open(webUrl, '_blank', 'noopener,noreferrer');
  return true;
}
