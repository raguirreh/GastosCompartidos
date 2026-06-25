import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, FAB, Text, useTheme } from 'react-native-paper';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../../app/navigation/types';
import type { GroupsStackParamList } from '../../../app/navigation/types';
import { Avatar } from '../../../shared/components/Avatar';
import { OnlineIndicator } from '../../../shared/components/OnlineIndicator';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatMoney, formatRelativeDate, getCurrencySymbol } from '../../../shared/utils/format';
import { useExpensesStore, useGroupsStore, useProfilesStore, useUserStore } from '../../../store';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<GroupsStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const currentUser = useUserStore((s) => s.currentUser);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla, la pantalla simplemente queda vacía.
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

  const allExpenses = useMemo(() => Object.values(expensesByGroup).flat(), [expensesByGroup]);

  const { owed, owe, net } = useMemo(() => {
    if (!currentUser) return { owed: 0, owe: 0, net: 0 };
    let totalOwed = 0;
    let totalOwe = 0;
    for (const group of groups) {
      const expenses = expensesByGroup[group.id] ?? [];
      const settlements = computeGroupSettlements(
        expenses.map((expense) => ({
          paidBy: expense.paidBy,
          amount: expense.amount,
          splits: expense.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }))
      );
      for (const settlement of settlements) {
        if (settlement.toUserId === currentUser.uid) totalOwed += settlement.amount;
        if (settlement.fromUserId === currentUser.uid) totalOwe += settlement.amount;
      }
    }
    return { owed: totalOwed, owe: totalOwe, net: totalOwed - totalOwe };
  }, [groups, expensesByGroup, currentUser]);

  const recentActivity = useMemo(
    () => [...allExpenses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [allExpenses]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium">Hola, {currentUser?.name ?? 'Usuario'} {currentUser?.emoji}</Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              Esto es lo que pasa con tu dinero
            </Text>
          </View>
          <OnlineIndicator />
        </View>

        <Card style={styles.balanceCard} mode="contained">
          <Card.Content>
            <Text variant="labelLarge" style={styles.balanceLabel}>
              Tu balance neto
            </Text>
            <Text
              variant="displaySmall"
              style={{ color: net >= 0 ? theme.colors.tertiary : theme.colors.error, fontWeight: '700' }}
            >
              {formatMoney(net, 'PEN')}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text variant="bodySmall" style={styles.balanceItemLabel}>Te deben</Text>
                <Text variant="titleMedium" style={{ color: theme.colors.tertiary }}>
                  {formatMoney(owed, 'PEN')}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text variant="bodySmall" style={styles.balanceItemLabel}>Debes</Text>
                <Text variant="titleMedium" style={{ color: theme.colors.error }}>
                  {formatMoney(owe, 'PEN')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Tus grupos
        </Text>
        {groups.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no tienes grupos. Crea uno para empezar.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsRow}>
            {groups.map((group) => (
              <Card
                key={group.id}
                style={styles.groupCard}
                onPress={() => navigation.navigate('Groups', { screen: 'GroupDetail', params: { groupId: group.id } } as never)}
              >
                <Card.Content>
                  <Text style={styles.groupEmoji}>{group.emoji}</Text>
                  <Text variant="titleSmall" numberOfLines={1}>
                    {group.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.groupMembers}>
                    {group.memberIds.length} miembros
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Actividad reciente
        </Text>
        {recentActivity.length === 0 && (
          <Text style={styles.emptyText}>Todavía no hay actividad.</Text>
        )}
        {recentActivity.map((expense) => {
          const payer = profiles[expense.paidBy];
          const group = groups.find((g) => g.id === expense.groupId);
          return (
            <Card key={expense.id} style={styles.activityCard} mode="outlined">
              <Card.Content style={styles.activityContent}>
                {payer && <Avatar emoji={payer.emoji} color={payer.avatarColor} size={36} />}
                <View style={styles.activityTextWrapper}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {payer?.name ?? 'Alguien'} pagó <Text style={{ fontWeight: '700' }}>{expense.description}</Text>
                  </Text>
                  <Text variant="bodySmall" style={styles.activitySubtext}>
                    {group?.name} · {formatRelativeDate(expense.createdAt)}
                  </Text>
                </View>
                <Text variant="titleSmall">{getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}</Text>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>

      {groups.length > 0 && (
        <FAB
          icon="plus"
          label="Gasto"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="#FFFFFF"
          onPress={() =>
            navigation.navigate('Groups', { screen: 'AddExpense', params: { groupId: groups[0].id } } as never)
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSubtitle: {
    opacity: 0.6,
  },
  balanceCard: {
    marginBottom: 24,
  },
  balanceLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '700',
  },
  emptyText: {
    opacity: 0.6,
    marginBottom: 16,
  },
  groupsRow: {
    marginBottom: 24,
  },
  groupCard: {
    width: 140,
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  groupMembers: {
    opacity: 0.6,
    marginTop: 2,
  },
  activityCard: {
    marginBottom: 8,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityTextWrapper: {
    flex: 1,
  },
  activitySubtext: {
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
