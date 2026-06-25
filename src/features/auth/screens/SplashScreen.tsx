import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, useTheme } from 'react-native-paper';
import type { RootStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, { duration: 600 });

    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 1100));

    let cancelled = false;
    const waitForAuth = () =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (!useAuthStore.getState().isAuthLoading && !useUserStore.getState().isProfileLoading) {
            resolve();
            return;
          }
          setTimeout(check, 50);
        };
        check();
      });

    Promise.all([minDelay, waitForAuth()]).then(() => {
      if (cancelled) return;
      const currentSession = useAuthStore.getState().session;
      if (!currentSession) {
        navigation.replace('Login');
        return;
      }
      if (!useUserStore.getState().hasCompletedOnboarding) {
        navigation.replace('Onboarding');
        return;
      }
      if (!useUserStore.getState().currentUser) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('Main');
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.emoji}>💸</Text>
        <Text variant="headlineMedium" style={styles.title}>
          Gastos Compartidos
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Divide gastos, no amistades
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
  },
});
