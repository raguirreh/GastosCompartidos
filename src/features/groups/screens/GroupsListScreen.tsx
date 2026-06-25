import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, FAB, Text, useTheme } from 'react-native-paper';
import type { GroupsStackParamList } from '../../../app/navigation/types';
import { StackedAvatars } from '../../../shared/components/StackedAvatars';
import { formatMoney } from '../../../shared/utils/format';
import { getMockUserById, mockGroups } from '../../../shared/utils/mockData';

type Props = NativeStackScreenProps<GroupsStackParamList, 'GroupsList'>;

// Saldo mock por grupo, solo para mostrar la UI (se calcularía con debtSimplification real en GroupDetail).
const mockGroupBalances: Record<string, number> = {
  g1: 36,
  g2: -100,
  g3: 0,
};

export function GroupsListScreen({ navigation }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Grupos
        </Text>
      </View>

      <FlatList
        data={mockGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const balance = mockGroupBalances[item.id] ?? 0;
          const members = item.memberIds
            .map((id) => getMockUserById(id))
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
