import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Menu, Text, TextInput, useTheme } from 'react-native-paper';
import type { GroupsStackParamList } from '../../../app/navigation/types';
import { useGroupsStore, useUserStore } from '../../../store';

type Props = NativeStackScreenProps<GroupsStackParamList, 'CreateGroup'>;

const EMOJI_OPTIONS = ['🏠', '🏔️', '🍖', '✈️', '🎉', '🚗', '💼', '🎓'];
const CURRENCIES = ['PEN', 'USD', 'EUR', 'MXN', 'ARS', 'COP'];

export function CreateGroupScreen({ navigation }: Props) {
  const theme = useTheme();
  const currentUser = useUserStore((s) => s.currentUser);
  const createGroup = useGroupsStore((s) => s.createGroup);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [currency, setCurrency] = useState('PEN');
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        emoji,
        currency,
        createdBy: currentUser.uid,
      });
      navigation.replace('GroupDetail', { groupId: group.id });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={styles.title}>
            Crear grupo
          </Text>

          <TextInput
            label="Nombre del grupo"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="Ej. Viaje a la playa"
          />

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Emoji
          </Text>
          <View style={styles.optionsRow}>
            {EMOJI_OPTIONS.map((option) => (
              <Button
                key={option}
                mode={option === emoji ? 'contained' : 'outlined'}
                onPress={() => setEmoji(option)}
                style={styles.emojiButton}
                compact
              >
                {option}
              </Button>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Moneda
          </Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.currencyButton}>
                {currency}
              </Button>
            }
          >
            {CURRENCIES.map((option) => (
              <Menu.Item
                key={option}
                title={option}
                onPress={() => {
                  setCurrency(option);
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>

          <Button
            mode="contained"
            onPress={handleCreate}
            disabled={!name.trim() || isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Crear grupo
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  emojiButton: {
    minWidth: 48,
  },
  currencyButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  submitButtonContent: {
    height: 48,
  },
});
