import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, FAB, IconButton, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import type { GroupsStackParamList } from '../../../app/navigation/types';
import { Avatar } from '../../../shared/components/Avatar';
import { InviteModal } from '../../../shared/components/InviteModal';
import { mockCategories } from '../../../shared/constants/categories';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatDate, formatMoney } from '../../../shared/utils/format';
import { useExpensesStore, useGroupsStore, useProfilesStore } from '../../../store';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupDetail'>;

type TabKey = 'expenses' | 'balances' | 'members';

export function GroupDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { groupId } = route.params;
  const [tab, setTab] = useState<TabKey>('expenses');
  const [inviteVisible, setInviteVisible] = useState(false);

  const getGroupById = useGroupsStore((s) => s.getGroupById);
  const group = getGroupById(groupId);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  useEffect(() => {
    fetchExpenses(groupId).catch(() => {
      // Si falla, la lista de gastos queda vacía.
    });
  }, [groupId, fetchExpenses]);

  useEffect(() => {
    if (group) {
      ensureProfiles(group.memberIds).catch(() => {
        // Si falla, los avatares simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const groupExpenses = useMemo(() => expensesByGroup[groupId] ?? [], [expensesByGroup, groupId]);

  const settlements = useMemo(
    () =>
      computeGroupSettlements(
        groupExpenses.map((expense) => ({
          paidBy: expense.paidBy,
          amount: expense.amount,
          splits: expense.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }))
      ),
    [groupExpenses]
  );

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Text style={styles.emptyText}>No pudimos encontrar este grupo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header} role="banner">
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} accessibilityLabel="Volver" />
        <View style={styles.headerTitleWrapper}>
          <Text variant="titleLarge" numberOfLines={1} accessibilityRole="header" aria-level={1} accessibilityLabel={group.name}>
            {group.emoji} {group.name}
          </Text>
        </View>
        <IconButton icon="account-plus" onPress={() => setInviteVisible(true)} accessibilityLabel="Invitar miembro" />
      </View>

      <SegmentedButtons
        value={tab}
        onValueChange={(value) => setTab(value as TabKey)}
        style={styles.segmented}
        buttons={[
          { value: 'expenses', label: 'Gastos' },
          { value: 'balances', label: 'Saldos' },
          { value: 'members', label: 'Miembros' },
        ]}
      />

      {tab === 'expenses' && (
        <ScrollView contentContainerStyle={styles.tabContent} role="main">
          {groupExpenses.length === 0 && (
            <Text style={styles.emptyText}>Todavía no hay gastos en este grupo.</Text>
          )}
          {groupExpenses.map((expense) => {
            const payer = profiles[expense.paidBy];
            const category = mockCategories.find((c) => c.value === expense.category);
            return (
              <Card key={expense.id} style={styles.expenseCard} mode="outlined">
                <Card.Content style={styles.expenseRow}>
                  {payer && <Avatar emoji={payer.emoji} color={payer.avatarColor} size={40} />}
                  <View style={styles.expenseInfo}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {expense.description}
                    </Text>
                    <Text variant="bodySmall" style={styles.expenseSubtext}>
                      {payer?.name ?? 'Alguien'} pagó · {category?.label} · {formatDate(expense.date)}
                    </Text>
                  </View>
                  <Text variant="titleSmall">{formatMoney(expense.amount, expense.currency)}</Text>
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {tab === 'balances' && (
        <ScrollView contentContainerStyle={styles.tabContent} role="main">
          <Text variant="labelLarge" style={styles.sectionLabel} accessibilityRole="header" aria-level={2}>
            Pagos sugeridos (mínimo de transacciones)
          </Text>
          {settlements.length === 0 && (
            <Text style={styles.emptyText}>Este grupo está saldado. ¡Buen trabajo!</Text>
          )}
          {settlements.map((settlement, index) => {
            const from = profiles[settlement.fromUserId];
            const to = profiles[settlement.toUserId];
            return (
              <Card key={index} style={styles.settlementCard} mode="outlined">
                <Card.Content style={styles.settlementRow}>
                  {from && <Avatar emoji={from.emoji} color={from.avatarColor} size={32} />}
                  <Text variant="bodyMedium" style={styles.settlementText}>
                    <Text style={{ fontWeight: '700' }}>{from?.name}</Text> le debe a{' '}
                    <Text style={{ fontWeight: '700' }}>{to?.name}</Text>
                  </Text>
                  {to && <Avatar emoji={to.emoji} color={to.avatarColor} size={32} />}
                </Card.Content>
                <Card.Content>
                  <Text variant="titleMedium" style={{ color: theme.colors.error }}>
                    <Text aria-hidden importantForAccessibility="no">↓ </Text>
                    {formatMoney(settlement.amount, group.currency)} (deuda pendiente)
                  </Text>
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {tab === 'members' && (
        <ScrollView contentContainerStyle={styles.tabContent} role="main">
          {group.memberIds.map((memberId) => {
            const member = profiles[memberId];
            if (!member) return null;
            return (
              <Card key={memberId} style={styles.memberCard} mode="outlined">
                <Card.Content style={styles.memberRow}>
                  <Avatar emoji={member.emoji} color={member.avatarColor} size={40} />
                  <Text variant="bodyMedium">{member.name}</Text>
                  {memberId === group.createdBy && (
                    <Text variant="labelSmall" style={styles.adminTag}>
                      Admin
                    </Text>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        label="Gasto"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate('AddExpense', { groupId })}
      />

      <InviteModal
        visible={inviteVisible}
        onDismiss={() => setInviteVisible(false)}
        inviteToken={group.inviteToken}
        groupName={group.name}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitleWrapper: {
    flex: 1,
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 96,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 24,
  },
  expenseCard: {
    marginBottom: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseSubtext: {
    opacity: 0.6,
  },
  sectionLabel: {
    marginBottom: 12,
    opacity: 0.7,
  },
  settlementCard: {
    marginBottom: 8,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settlementText: {
    flex: 1,
  },
  memberCard: {
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminTag: {
    marginLeft: 'auto',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
