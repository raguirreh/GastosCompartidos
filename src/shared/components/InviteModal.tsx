import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { buildGroupInviteLink, buildWhatsAppInviteUrl, buildWhatsAppWebInviteUrl } from '../utils/invite';
import { openWhatsApp, shareOrCopy } from '../utils/share';

interface InviteModalProps {
  visible: boolean;
  onDismiss: () => void;
  inviteToken: string;
  groupName: string;
}

/** Modal de invitación a un grupo: link, copiar, compartir por WhatsApp, compartir nativo y QR. */
export function InviteModal({ visible, onDismiss, inviteToken, groupName }: InviteModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => buildGroupInviteLink(inviteToken), [inviteToken]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    const nativeUrl = buildWhatsAppInviteUrl(groupName, link);
    const webUrl = buildWhatsAppWebInviteUrl(groupName, link);
    const opened = await openWhatsApp(nativeUrl, webUrl);
    if (!opened) {
      await shareOrCopy(link);
    }
  };

  const handleNativeShare = async () => {
    await shareOrCopy(link);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={styles.title}>
          Invitar a "{groupName}"
        </Text>

        <View style={styles.qrWrapper}>
          <QRCode value={link} size={180} color={theme.colors.onSurface} backgroundColor={theme.colors.surface} />
        </View>

        <Text variant="bodyMedium" style={styles.link} numberOfLines={2}>
          {link}
        </Text>

        <Button mode="outlined" onPress={handleCopy} style={styles.button} icon="content-copy">
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>

        <Button mode="contained" onPress={handleWhatsApp} style={styles.button} icon="whatsapp">
          Compartir por WhatsApp
        </Button>

        <Button mode="text" onPress={handleNativeShare} style={styles.button} icon="share-variant">
          Compartir...
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  link: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
});
