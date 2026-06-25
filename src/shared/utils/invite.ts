import { generateUUID } from './uuid';

const APP_BASE_URL = 'https://splitapp.com';

export interface GroupInvite {
  token: string;
  link: string;
}

/**
 * Genera un token único y el link de invitación asociado a un grupo.
 * El token combina un UUID con el timestamp actual para reducir aún más
 * la probabilidad de colisión y facilitar trazabilidad/expiración futura.
 */
export function generateGroupInvite(groupId: string): GroupInvite {
  const groupToken = `${generateUUID()}-${Date.now()}`;
  const inviteLink = `${APP_BASE_URL}/join/${groupToken}`;

  return { token: groupToken, link: inviteLink };
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
