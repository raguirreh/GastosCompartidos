import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { buildWhatsAppInviteUrl, generateGroupInvite } from '../utils/invite';

interface InviteModalProps {
  visible: boolean;
  onDismiss: () => void;
  groupId: string;
  groupName: string;
}

/** Modal de invitación a un grupo: link, copiar, compartir por WhatsApp, compartir nativo y QR. */
export function InviteModal({ visible, onDismiss, groupId, groupName }: InviteModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const invite = useMemo(() => generateGroupInvite(groupId), [groupId]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(invite.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    const url = buildWhatsAppInviteUrl(groupName, invite.link);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Sharing.shareAsync(invite.link);
    }
  };

  const handleNativeShare = async () => {
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(invite.link);
    }
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
          <QRCode value={invite.link} size={180} color={theme.colors.onSurface} backgroundColor={theme.colors.surface} />
        </View>

        <Text variant="bodyMedium" style={styles.link} numberOfLines={2}>
          {invite.link}
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
