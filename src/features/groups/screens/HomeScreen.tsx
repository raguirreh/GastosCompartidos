import React, { useMemo } from 'react';
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
import { formatMoney, formatRelativeDate, getCurrencySymbol } from '../../../shared/utils/format';
import { getMockUserById, mockExpenses, mockGroups } from '../../../shared/utils/mockData';
import { useUserStore } from '../../../store';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<GroupsStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const currentUser = useUserStore((s) => s.currentUser);

  // Saldo global mock: suma simple a partir de los gastos de ejemplo.
  const { owed, owe, net } = useMemo(() => {
    const totalOwed = 145;
    const totalOwe = 60;
    return { owed: totalOwed, owe: totalOwe, net: totalOwed - totalOwe };
  }, []);

  const recentActivity = useMemo(
    () => [...mockExpenses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    []
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsRow}>
          {mockGroups.map((group) => (
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

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Actividad reciente
        </Text>
        {recentActivity.map((expense) => {
          const payer = getMockUserById(expense.paidBy);
          const group = mockGroups.find((g) => g.id === expense.groupId);
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

      <FAB
        icon="plus"
        label="Gasto"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={() =>
          navigation.navigate('Groups', { screen: 'AddExpense', params: { groupId: mockGroups[0].id } } as never)
        }
      />
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
