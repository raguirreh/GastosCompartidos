import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import type { RootStackParamList } from '../../../app/navigation/types';
import { signUp } from '../../../services/supabase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({ navigation }: Props) {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const isValid = EMAIL_REGEX.test(email.trim()) && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValid) return;
    setError('');
    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(email.trim(), password);
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true);
      }
      // Si hay sesión inmediata, el listener de onAuthStateChange en App.tsx
      // se encarga de navegar a ProfileSetup automáticamente.
    } catch (err) {
      setError('No pudimos crear tu cuenta. Intenta con otro correo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (needsConfirmation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Revisa tu correo
          </Text>
          <Text variant="bodyMedium" style={styles.confirmText}>
            Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.submitButton}>
            Ir a iniciar sesión
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={styles.title}>
            Crea tu cuenta
          </Text>

          <TextInput
            label="Correo"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <HelperText type="info">Mínimo 6 caracteres.</HelperText>

          {error.length > 0 && <HelperText type="error">{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Crear cuenta
          </Button>

          <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
            ¿Ya tienes cuenta? Inicia sesión
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 24,
    fontWeight: '700',
  },
  confirmText: {
    marginBottom: 24,
    opacity: 0.8,
  },
  input: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  submitButtonContent: {
    height: 48,
  },
  linkButton: {
    marginTop: 8,
  },
});
