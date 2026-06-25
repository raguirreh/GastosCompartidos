const APP_BASE_URL = 'https://gastoscompartidos.raguirre-contact.workers.dev';

/**
 * Arma el link de invitación a un grupo a partir de su `inviteToken` real
 * (columna `invite_token` en la tabla `groups`, generada por Postgres).
 */
export function buildGroupInviteLink(inviteToken: string): string {
  return `${APP_BASE_URL}/join/${inviteToken}`;
}

/**
 * Arma el mensaje de invitación a un grupo, listo para compartir por
 * WhatsApp u otro canal.
 */
export function buildInviteMessage(groupName: string, inviteLink: string): string {
  return `¡Únete a nuestro grupo "${groupName}" en Split! Registra tus gastos y salda cuentas fácilmente 👉 ${inviteLink}`;
}

/**
 * Arma la URL de WhatsApp (esquema `whatsapp://`) para compartir la
 * invitación a un grupo. Debe abrirse con `Linking.openURL`.
 */
export function buildWhatsAppInviteUrl(groupName: string, inviteLink: string): string {
  const message = buildInviteMessage(groupName, inviteLink);
  return `whatsapp://send?text=${encodeURIComponent(message)}`;
}

/**
 * Igual que `buildWhatsAppInviteUrl` pero usando el esquema `https://wa.me`,
 * que sí abre WhatsApp Web/desktop en navegador (el esquema `whatsapp://`
 * no es resoluble desde la web).
 */
export function buildWhatsAppWebInviteUrl(groupName: string, inviteLink: string): string {
  const message = buildInviteMessage(groupName, inviteLink);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Arma el mensaje de "solicitud de pago" a un usuario que debe dinero
 * dentro de un grupo, listo para compartir por WhatsApp.
 */
export function buildPaymentRequestMessage(
  debtorName: string,
  amount: number,
  currencySymbol: string,
  groupName: string,
  link?: string
): string {
  const amountText = `${currencySymbol}${amount.toFixed(2)}`;
  const linkSuffix = link ? ` 👉 ${link}` : '';
  return `Hey ${debtorName}, me debes ${amountText} en ${groupName}${linkSuffix}`;
}

/**
 * Arma la URL de WhatsApp para enviar una solicitud de pago.
 */
export function buildWhatsAppPaymentRequestUrl(
  debtorName: string,
  amount: number,
  currencySymbol: string,
  groupName: string,
  link?: string
): string {
  const message = buildPaymentRequestMessage(debtorName, amount, currencySymbol, groupName, link);
  return `whatsapp://send?text=${encodeURIComponent(message)}`;
}

/** Igual que `buildWhatsAppPaymentRequestUrl` pero usando `https://wa.me` para web. */
export function buildWhatsAppWebPaymentRequestUrl(
  debtorName: string,
  amount: number,
  currencySymbol: string,
  groupName: string,
  link?: string
): string {
  const message = buildPaymentRequestMessage(debtorName, amount, currencySymbol, groupName, link);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
