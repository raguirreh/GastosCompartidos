import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import type { RootStackParamList } from '../../../app/navigation/types';
import { joinGroupByInviteToken, resolveInviteToken } from '../../../services/supabase/api';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Join'>;

interface InvitePreview {
  id: string;
  name: string;
  emoji: string;
  currency: string;
}

export function JoinGroupScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { token } = route.params;
  const session = useAuthStore((s) => s.session);
  const setPendingInviteToken = useAuthStore((s) => s.setPendingInviteToken);

  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    resolveInviteToken(token)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError('Esta invitación ya no es válida.');
        } else {
          setPreview(result);
        }
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar esta invitación.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCreateAccountToJoin = () => {
    setPendingInviteToken(token);
    navigation.navigate('SignUp');
  };

  const handleJoin = async () => {
    setIsJoining(true);
    setError('');
    try {
      await joinGroupByInviteToken(token);
      navigation.navigate('Main');
    } catch (err) {
      setError('No pudimos unirte al grupo. Intenta de nuevo.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading && <ActivityIndicator style={styles.spinner} />}

        {!isLoading && error.length > 0 && (
          <Text variant="bodyMedium" style={{ color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        {!isLoading && preview && (
          <>
            <Text style={styles.emoji}>{preview.emoji}</Text>
            <Text variant="headlineSmall" style={styles.title}>
              Te han invitado a unirte a {preview.emoji} {preview.name}
            </Text>

            {session ? (
              <Button
                mode="contained"
                onPress={handleJoin}
                loading={isJoining}
                disabled={isJoining}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Unirme al grupo
              </Button>
            ) : (
              <>
                <Text variant="bodyMedium" style={styles.helperText}>
                  Para unirte necesitas crear una cuenta primero.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleCreateAccountToJoin}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Crear cuenta para unirme
                </Button>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  spinner: {
    marginTop: 48,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  helperText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    height: 48,
  },
});
