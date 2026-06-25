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
import { useUserStore } from '../../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  const currentUser = useUserStore((s) => s.currentUser);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, { duration: 600 });

    const timeout = setTimeout(() => {
      if (currentUser) {
        navigation.replace('Main');
      } else if (hasCompletedOnboarding) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('Onboarding');
      }
    }, 1100);

    return () => clearTimeout(timeout);
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
