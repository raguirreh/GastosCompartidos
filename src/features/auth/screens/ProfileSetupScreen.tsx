import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import type { RootStackParamList } from '../../../app/navigation/types';
import { Avatar } from '../../../shared/components/Avatar';
import { joinGroupByInviteToken, upsertProfile } from '../../../services/supabase/api';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const EMOJI_OPTIONS = ['🧑', '👩', '🧔', '👩‍🦱', '🧑‍🦰', '👨‍🦲', '🧓', '🐱'];
const COLOR_OPTIONS = ['#D3E6F5', '#FCE4EC', '#E1F5E5', '#FFF3E0', '#E8E1F5', '#D9F0F5'];

export function ProfileSetupScreen({ navigation }: Props) {
  const theme = useTheme();
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const session = useAuthStore((s) => s.session);
  const pendingInviteToken = useAuthStore((s) => s.pendingInviteToken);
  const setPendingInviteToken = useAuthStore((s) => s.setPendingInviteToken);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !session?.user.id) return;

    setError('');
    setIsSubmitting(true);
    try {
      const user = {
        uid: session.user.id,
        name: name.trim(),
        emoji,
        avatarColor: color,
        createdAt: Date.now(),
      };

      await upsertProfile(user);
      setCurrentUser(user);

      if (pendingInviteToken) {
        try {
          await joinGroupByInviteToken(pendingInviteToken);
        } catch {
          // El token podría haber expirado o ya estar usado: no bloqueamos el flujo.
        } finally {
          setPendingInviteToken(null);
        }
      }

      navigation.replace('Main');
    } catch (err) {
      setError('No pudimos guardar tu perfil. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={styles.title}>
            Cuéntanos sobre ti
          </Text>

          <View style={styles.avatarPreview}>
            <Avatar emoji={emoji} color={color} size={88} />
          </View>

          <TextInput
            label="¿Cómo te llamas?"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Elige un avatar
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
            Elige un color
          </Text>
          <View style={styles.optionsRow}>
            {COLOR_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setColor(option)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: option },
                  option === color && { borderWidth: 3, borderColor: theme.colors.primary },
                ]}
              />
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Entrar a la app
          </Button>
          {error.length > 0 && <HelperText type="error">{error}</HelperText>}
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
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
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
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  submitButtonContent: {
    height: 48,
  },
});
