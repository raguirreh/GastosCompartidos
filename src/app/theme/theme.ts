import type { ThemeConfig } from 'antd';
import { darkColors, lightColors } from './colors';

function buildTheme(colors: typeof lightColors): ThemeConfig {
  return {
    token: {
      colorPrimary: colors.primary,
      colorSuccess: colors.tertiary,
      colorError: colors.error,
      colorBgContainer: colors.surface,
      colorBgLayout: colors.background,
      colorText: colors.onBackground,
      colorTextSecondary: colors.onSurfaceVariant,
      colorBorder: colors.outlineVariant,
      borderRadius: 12,
    },
  };
}

export const lightTheme = buildTheme(lightColors);
export const darkTheme = buildTheme(darkColors);

/** Colores semánticos para saldos, independientes del tema actual. */
export const balanceColors = {
  positive: lightColors.tertiary,
  negative: lightColors.error,
  neutral: '#9AA5B1',
};

export function getTheme(scheme: 'light' | 'dark'): ThemeConfig {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
