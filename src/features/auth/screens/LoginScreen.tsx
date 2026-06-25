import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import type { RootStackParamList } from '../../../app/navigation/types';
import { signInWithPassword } from '../../../services/supabase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid = EMAIL_REGEX.test(email.trim()) && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValid) return;
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      // El listener de onAuthStateChange en App.tsx se encarga del resto.
    } catch (err) {
      setError('No pudimos iniciar tu sesión. Revisa tu correo y contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={styles.title}>
            Inicia sesión
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

          {error.length > 0 && <HelperText type="error">{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Entrar
          </Button>

          <Button mode="text" onPress={() => navigation.navigate('SignUp')} style={styles.linkButton}>
            ¿No tienes cuenta? Crea una
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
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    height: 48,
  },
  linkButton: {
    marginTop: 8,
  },
});
