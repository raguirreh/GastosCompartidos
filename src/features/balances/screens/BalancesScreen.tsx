import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { Avatar } from '../../../shared/components/Avatar';
import { buildWhatsAppPaymentRequestUrl, buildWhatsAppWebPaymentRequestUrl } from '../../../shared/utils/invite';
import { formatMoney, getCurrencySymbol } from '../../../shared/utils/format';
import { openWhatsApp } from '../../../shared/utils/share';
import { useBalancesStore, useExpensesStore, useGroupsStore, useProfilesStore, useUserStore } from '../../../store';
import type { Settlement } from '../../../shared/utils/debtSimplification';

interface SettlementEntry {
  groupId: string;
  otherUserId: string;
  amount: number; // positivo: te deben, negativo: debes
}

export function BalancesScreen() {
  const theme = useTheme();
  const currentUser = useUserStore((s) => s.currentUser);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const recalculateForGroup = useBalancesStore((s) => s.recalculateForGroup);
  const settlementsByGroup = useBalancesStore((s) => s.settlementsByGroup);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const [dialogEntry, setDialogEntry] = useState<SettlementEntry | null>(null);
  const [dialogAction, setDialogAction] = useState<'request' | 'register' | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla, la lista de saldos queda vacía.
      });
    }
  }, [currentUser, fetchGroups]);

  useEffect(() => {
    groups.forEach((group) => {
      fetchExpenses(group.id).catch(() => {
        // Ignoramos errores individuales por grupo.
      });
    });
    const allMemberIds = groups.flatMap((g) => g.memberIds);
    if (allMemberIds.length > 0) {
      ensureProfiles(allMemberIds).catch(() => {
        // Si falla, los avatares simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  useEffect(() => {
    for (const group of groups) {
      const expenses = expensesByGroup[group.id] ?? [];
      recalculateForGroup(group.id, expenses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, expensesByGroup]);

  const settlements: SettlementEntry[] = useMemo(() => {
    if (!currentUser) return [];
    const entries: SettlementEntry[] = [];
    for (const group of groups) {
      const groupSettlements: Settlement[] = settlementsByGroup[group.id] ?? [];
      for (const settlement of groupSettlements) {
        if (settlement.toUserId === currentUser.uid) {
          entries.push({ groupId: group.id, otherUserId: settlement.fromUserId, amount: settlement.amount });
        } else if (settlement.fromUserId === currentUser.uid) {
          entries.push({ groupId: group.id, otherUserId: settlement.toUserId, amount: -settlement.amount });
        }
      }
    }
    return entries;
  }, [groups, settlementsByGroup, currentUser]);

  const owedToMe = useMemo(() => settlements.filter((s) => s.amount > 0), [settlements]);
  const owedByMe = useMemo(() => settlements.filter((s) => s.amount < 0), [settlements]);
  const netTotal = useMemo(() => settlements.reduce((sum, s) => sum + s.amount, 0), [settlements]);

  const closeDialog = () => {
    setDialogEntry(null);
    setDialogAction(null);
  };

  const handleRequestPayment = (entry: SettlementEntry) => {
    const debtor = profiles[entry.otherUserId];
    const group = groups.find((g) => g.id === entry.groupId);
    if (!debtor || !group) return;

    const nativeUrl = buildWhatsAppPaymentRequestUrl(
      debtor.name,
      Math.abs(entry.amount),
      getCurrencySymbol(group.currency),
      group.name
    );
    const webUrl = buildWhatsAppWebPaymentRequestUrl(
      debtor.name,
      Math.abs(entry.amount),
      getCurrencySymbol(group.currency),
      group.name
    );
    openWhatsApp(nativeUrl, webUrl).catch(() => {
      // Si WhatsApp no está instalado, no hacemos nada más.
    });
    closeDialog();
  };

  const handleRegisterPayment = () => {
    // TODO: en una implementación completa esto crearía una `Transaction`
    // con status 'pending' y la encolaría para confirmación.
    closeDialog();
  };

  const renderEntry = (entry: SettlementEntry, type: 'owed' | 'owe') => {
    const other = profiles[entry.otherUserId];
    const group = groups.find((g) => g.id === entry.groupId);
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
            <Text aria-hidden importantForAccessibility="no">{type === 'owed' ? '↑ ' : '↓ '}</Text>
            {formatMoney(Math.abs(entry.amount), group.currency)} {type === 'owed' ? '(a tu favor)' : '(debes)'}
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
      <ScrollView contentContainerStyle={styles.scrollContent} role="main">
        <Text variant="headlineSmall" style={styles.title} accessibilityRole="header" aria-level={1}>
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
              <Text aria-hidden importantForAccessibility="no">{netTotal >= 0 ? '↑ ' : '↓ '}</Text>
              {formatMoney(netTotal, 'PEN')} {netTotal >= 0 ? '(a tu favor)' : '(debes)'}
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          Te deben
        </Text>
        {owedToMe.length === 0 && <Text style={styles.emptyText}>Nadie te debe dinero ahora.</Text>}
        {owedToMe.map((entry) => renderEntry(entry, 'owed'))}

        <Text variant="titleMedium" style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
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
                ? `Se abrirá WhatsApp para recordarle a ${profiles[dialogEntry?.otherUserId ?? '']?.name} que te debe dinero.`
                : `Esto marcará la deuda con ${profiles[dialogEntry?.otherUserId ?? '']?.name} como pagada.`}
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
                  handleRegisterPayment();
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
