import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, FAB, Text, useTheme } from 'react-native-paper';
import type { GroupsStackParamList } from '../../../app/navigation/types';
import { StackedAvatars } from '../../../shared/components/StackedAvatars';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatMoney } from '../../../shared/utils/format';
import { useExpensesStore, useGroupsStore, useProfilesStore, useUserStore } from '../../../store';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupsList'>;

export function GroupsListScreen({ navigation }: Props) {
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
        // Si falla la carga, la lista queda vacía y el usuario puede reintentar.
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

  const groupBalances = useMemo(() => {
    const result: Record<string, number> = {};
    if (!currentUser) return result;
    for (const group of groups) {
      const expenses = expensesByGroup[group.id] ?? [];
      const settlements = computeGroupSettlements(
        expenses.map((expense) => ({
          paidBy: expense.paidBy,
          amount: expense.amount,
          splits: expense.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }))
      );
      let net = 0;
      for (const settlement of settlements) {
        if (settlement.toUserId === currentUser.uid) net += settlement.amount;
        if (settlement.fromUserId === currentUser.uid) net -= settlement.amount;
      }
      result[group.id] = net;
    }
    return result;
  }, [groups, expensesByGroup, currentUser]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Grupos
        </Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Todavía no tienes grupos. Crea uno para empezar.</Text>
        }
        renderItem={({ item }) => {
          const balance = groupBalances[item.id] ?? 0;
          const members = item.memberIds
            .map((id) => profiles[id])
            .filter((u): u is NonNullable<typeof u> => Boolean(u))
            .map((u) => ({ emoji: u.emoji, color: u.avatarColor }));

          return (
            <Card
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
            >
              <Card.Content style={styles.groupCardContent}>
                <Text style={styles.groupEmoji}>{item.emoji}</Text>
                <View style={styles.groupInfo}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <StackedAvatars members={members} />
                </View>
                <View style={styles.groupBalance}>
                  <Text
                    variant="titleSmall"
                    style={{
                      color:
                        balance === 0
                          ? theme.colors.onSurfaceVariant
                          : balance > 0
                            ? theme.colors.tertiary
                            : theme.colors.error,
                    }}
                  >
                    {balance === 0 ? 'Saldado' : formatMoney(balance, item.currency)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate('CreateGroup')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 48,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupEmoji: {
    fontSize: 32,
  },
  groupInfo: {
    flex: 1,
    gap: 6,
  },
  groupBalance: {
    alignItems: 'flex-end',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
