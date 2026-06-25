import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Menu, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import type { GroupsStackParamList } from '../../../app/navigation/types';
import { Avatar } from '../../../shared/components/Avatar';
import type { ExpenseCategory, SplitMode } from '../../../shared/types';
import { mockCategories } from '../../../shared/constants/categories';
import { formatDate } from '../../../shared/utils/format';
import { useExpensesStore, useGroupsStore, useProfilesStore, useUserStore } from '../../../store';

type Props = NativeStackScreenProps<GroupsStackParamList, 'AddExpense'>;

export function AddExpenseScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { groupId } = route.params;
  const currentUser = useUserStore((s) => s.currentUser);
  const addExpense = useExpensesStore((s) => s.addExpense);
  const getGroupById = useGroupsStore((s) => s.getGroupById);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const group = getGroupById(groupId);

  useEffect(() => {
    if (group) {
      ensureProfiles(group.memberIds).catch(() => {
        // Si falla, los miembros simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const members = useMemo(
    () =>
      (group?.memberIds ?? [])
        .map((id) => profiles[id])
        .filter((u): u is NonNullable<typeof u> => Boolean(u)),
    [group, profiles]
  );

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser?.uid ?? members[0]?.uid ?? '');
  const [payerMenuVisible, setPayerMenuVisible] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [notes, setNotes] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>(group?.memberIds ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (group) setParticipantIds(group.memberIds);
  }, [group]);

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

  const toggleParticipant = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!description.trim() || numericAmount <= 0 || !paidBy || participantIds.length === 0) return;
    if (!currentUser || !group) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        groupId,
        description: description.trim(),
        amount: numericAmount,
        currency: group.currency,
        paidBy,
        category,
        date: Date.now(),
        notes,
        createdBy: currentUser.uid,
        splitMode,
        participantIds,
      });
      navigation.goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  const payer = profiles[paidBy];
  const canSubmit = description.trim().length > 0 && numericAmount > 0 && participantIds.length > 0 && Boolean(group);

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <Text style={styles.helperText}>No pudimos encontrar este grupo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" role="main">
          <Text variant="headlineSmall" style={styles.title} accessibilityRole="header" aria-level={1}>
            Agregar gasto
          </Text>

          <TextInput
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            placeholder="Ej. Almuerzo en el centro"
          />

          <TextInput
            label={`Monto (${group.currency})`}
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            left={<TextInput.Affix text={group.currency} />}
          />

          <Text variant="labelLarge" style={styles.sectionLabel}>
            ¿Quién pagó?
          </Text>
          <Menu
            visible={payerMenuVisible}
            onDismiss={() => setPayerMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPayerMenuVisible(true)}
                style={styles.payerButton}
                icon={() => (payer ? <Avatar emoji={payer.emoji} color={payer.avatarColor} size={24} /> : undefined)}
              >
                {payer?.name ?? 'Selecciona'}
              </Button>
            }
          >
            {members.map((member) => (
              <Menu.Item
                key={member.uid}
                title={member.name}
                onPress={() => {
                  setPaidBy(member.uid);
                  setPayerMenuVisible(false);
                }}
              />
            ))}
          </Menu>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Dividir entre
          </Text>
          <View style={styles.chipRow}>
            {members.map((member) => (
              <Chip
                key={member.uid}
                selected={participantIds.includes(member.uid)}
                onPress={() => toggleParticipant(member.uid)}
                style={styles.chip}
              >
                {member.emoji} {member.name}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Modo de división
          </Text>
          <SegmentedButtons
            value={splitMode}
            onValueChange={(value) => setSplitMode(value as SplitMode)}
            style={styles.segmented}
            buttons={[
              { value: 'equal', label: 'Igual' },
              { value: 'percentage', label: '%' },
              { value: 'exact', label: 'Exacto' },
              { value: 'shares', label: 'Shares' },
            ]}
          />
          {splitMode !== 'equal' && (
            <Text variant="bodySmall" style={styles.helperText}>
              El detalle por persona para este modo se ajusta luego desde el detalle del gasto. Por ahora se aplica división igual como base.
            </Text>
          )}

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Categoría
          </Text>
          <View style={styles.chipRow}>
            {mockCategories.map((cat) => (
              <Chip
                key={cat.value}
                selected={category === cat.value}
                onPress={() => setCategory(cat.value)}
                style={styles.chip}
                icon={cat.icon}
              >
                {cat.label}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Fecha
          </Text>
          <Text variant="bodyMedium" style={styles.dateText}>
            {formatDate(Date.now())}
          </Text>

          <TextInput
            label="Notas (opcional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Agregar gasto
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    marginBottom: 24,
    fontWeight: '700',
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  payerButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginBottom: 4,
  },
  segmented: {
    marginBottom: 8,
  },
  helperText: {
    opacity: 0.6,
    marginBottom: 16,
  },
  dateText: {
    marginBottom: 16,
    opacity: 0.8,
  },
  submitButton: {
    marginTop: 16,
  },
  submitButtonContent: {
    height: 48,
  },
});
