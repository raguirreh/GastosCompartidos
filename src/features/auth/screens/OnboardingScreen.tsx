import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from 'react-native-paper';
import type { RootStackParamList } from '../../../app/navigation/types';
import { useUserStore } from '../../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    emoji: '🧾',
    title: 'Registra gastos al instante',
    description: 'Anota lo que gastas con tus amigos, familia o roomies en segundos.',
  },
  {
    emoji: '⚖️',
    title: 'Divide de forma justa',
    description: 'Reparte gastos en partes iguales, por porcentaje, montos exactos o shares.',
  },
  {
    emoji: '✅',
    title: 'Salda cuentas fácil',
    description: 'Te decimos quién le debe a quién con el mínimo número de pagos.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const [pageIndex, setPageIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setPageIndex(index);
  };

  const handleNext = () => {
    if (pageIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: pageIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    navigation.replace('ProfileSetup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, index) => `slide-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text variant="headlineSmall" style={styles.slideTitle}>
              {item.title}
            </Text>
            <Text variant="bodyLarge" style={styles.slideDescription}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.indicatorRow}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === pageIndex ? theme.colors.primary : theme.colors.outlineVariant,
                width: index === pageIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button mode="text" onPress={handleFinish}>
          Saltar
        </Button>
        <Button mode="contained" onPress={handleNext}>
          {pageIndex === slides.length - 1 ? 'Empezar' : 'Siguiente'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 96,
    marginBottom: 24,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },
  slideDescription: {
    textAlign: 'center',
    opacity: 0.7,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
