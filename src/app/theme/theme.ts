import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { darkColors, lightColors } from './colors';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
};

/** Colores semánticos para saldos, independientes del tema actual. */
export const balanceColors = {
  positive: lightColors.tertiary,
  negative: lightColors.error,
  neutral: '#9AA5B1',
};

export function getTheme(scheme: 'light' | 'dark'): MD3Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
