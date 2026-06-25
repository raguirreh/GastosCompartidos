import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { Avatar } from '../../../shared/components/Avatar';
import { buildWhatsAppPaymentRequestUrl } from '../../../shared/utils/invite';
import { formatMoney, getCurrencySymbol } from '../../../shared/utils/format';
import { getMockUserById, mockGroups } from '../../../shared/utils/mockData';
import { useUserStore } from '../../../store';

interface MockSettlementEntry {
  groupId: string;
  otherUserId: string;
  amount: number; // positivo: te deben, negativo: debes
}

const mockSettlements: MockSettlementEntry[] = [
  { groupId: 'g1', otherUserId: 'u2', amount: 36 },
  { groupId: 'g1', otherUserId: 'u3', amount: 25 },
  { groupId: 'g2', otherUserId: 'u2', amount: -100 },
  { groupId: 'g3', otherUserId: 'u4', amount: 18 },
];

export function BalancesScreen() {
  const theme = useTheme();
  const currentUser = useUserStore((s) => s.currentUser);
  const [dialogEntry, setDialogEntry] = useState<MockSettlementEntry | null>(null);
  const [dialogAction, setDialogAction] = useState<'request' | 'register' | null>(null);

  const owedToMe = useMemo(() => mockSettlements.filter((s) => s.amount > 0), []);
  const owedByMe = useMemo(() => mockSettlements.filter((s) => s.amount < 0), []);
  const netTotal = useMemo(
    () => mockSettlements.reduce((sum, s) => sum + s.amount, 0),
    []
  );

  const closeDialog = () => {
    setDialogEntry(null);
    setDialogAction(null);
  };

  const handleRequestPayment = (entry: MockSettlementEntry) => {
    const debtor = getMockUserById(entry.otherUserId);
    const group = mockGroups.find((g) => g.id === entry.groupId);
    if (!debtor || !group) return;

    const url = buildWhatsAppPaymentRequestUrl(
      debtor.name,
      Math.abs(entry.amount),
      getCurrencySymbol(group.currency),
      group.name
    );
    Linking.openURL(url).catch(() => {
      // Si WhatsApp no está instalado, no hacemos nada más: esto es un mock honesto.
    });
    closeDialog();
  };

  const handleRegisterPayment = (entry: MockSettlementEntry) => {
    // Mock: en una implementación completa esto crearía una `Transaction`
    // con status 'pending' y la encolaría en el outbox para confirmación.
    closeDialog();
  };

  const renderEntry = (entry: MockSettlementEntry, type: 'owed' | 'owe') => {
    const other = getMockUserById(entry.otherUserId);
    const group = mockGroups.find((g) => g.id === entry.groupId);
    if (!other || !group) return null;

    return (
      <Card key={`${entry.groupId}-${entry.otherUserId}`} style={styles.entryCard} mode="outlined">
        <Card.Content style={styles.entryRow}>
          <Avatar emoji={other.emoji} color={other.avatarColor} size={40} />
          <View style={styles.entryInfo}>
            <Text variant="bodyMedium">{other.name}</Text>
            <Text variant="bodySmall" style={styles.entrySubtext}>
              {group.name}
            </Text>
          </View>
          <Text
            variant="titleSmall"
            style={{ color: type === 'owed' ? theme.colors.tertiary : theme.colors.error }}
          >
            {formatMoney(Math.abs(entry.amount), group.currency)}
          </Text>
        </Card.Content>
        <Card.Actions>
          {type === 'owed' ? (
            <Button
              mode="text"
              onPress={() => {
                setDialogEntry(entry);
                setDialogAction('request');
              }}
            >
              Solicitar pago
            </Button>
          ) : (
            <Button
              mode="text"
              onPress={() => {
                setDialogEntry(entry);
                setDialogAction('register');
              }}
            >
              Registrar pago
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Saldos
        </Text>

        <Card style={styles.totalCard} mode="contained">
          <Card.Content>
            <Text variant="labelLarge" style={styles.totalLabel}>
              Saldo neto total
            </Text>
            <Text
              variant="displaySmall"
              style={{
                color: netTotal >= 0 ? theme.colors.tertiary : theme.colors.error,
                fontWeight: '700',
              }}
            >
              {formatMoney(netTotal, 'PEN')}
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Te deben
        </Text>
        {owedToMe.length === 0 && <Text style={styles.emptyText}>Nadie te debe dinero ahora.</Text>}
        {owedToMe.map((entry) => renderEntry(entry, 'owed'))}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Debes
        </Text>
        {owedByMe.length === 0 && <Text style={styles.emptyText}>No le debes dinero a nadie ahora.</Text>}
        {owedByMe.map((entry) => renderEntry(entry, 'owe'))}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogEntry !== null} onDismiss={closeDialog}>
          <Dialog.Title>
            {dialogAction === 'request' ? 'Solicitar pago' : 'Registrar pago'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {dialogAction === 'request'
                ? `Se abrirá WhatsApp para recordarle a ${getMockUserById(dialogEntry?.otherUserId ?? '')?.name} que te debe dinero.`
                : `Esto marcará la deuda con ${getMockUserById(dialogEntry?.otherUserId ?? '')?.name} como pagada (demo).`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancelar</Button>
            <Button
              onPress={() => {
                if (!dialogEntry) return;
                if (dialogAction === 'request') {
                  handleRequestPayment(dialogEntry);
                } else {
                  handleRegisterPayment(dialogEntry);
                }
              }}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 16,
    fontWeight: '700',
  },
  totalCard: {
    marginBottom: 24,
  },
  totalLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '700',
  },
  emptyText: {
    opacity: 0.6,
    marginBottom: 16,
  },
  entryCard: {
    marginBottom: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entrySubtext: {
    opacity: 0.6,
  },
});
