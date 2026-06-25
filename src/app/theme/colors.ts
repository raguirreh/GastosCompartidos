/**
 * Paleta de colores Material Design 3 para Gastos Compartidos.
 * Los valores base (light) son los especificados por diseño.
 * Los valores dark son derivados manualmente manteniendo el mismo
 * matiz (hue) pero con tonos coherentes con un esquema MD3 oscuro.
 */

export const palette = {
  primary: '#1B6CA8',
  secondary: '#5B9ECF',
  tertiary: '#2ECC71', // saldo positivo (te deben)
  error: '#E53935', // saldo negativo (debes)
  surface: '#F8FAFE',
  background: '#FFFFFF',
};

export const lightColors = {
  primary: palette.primary,
  onPrimary: '#FFFFFF',
  primaryContainer: '#D3E6F5',
  onPrimaryContainer: '#0A2C42',

  secondary: palette.secondary,
  onSecondary: '#FFFFFF',
  secondaryContainer: '#DCEBF7',
  onSecondaryContainer: '#16324A',

  tertiary: palette.tertiary,
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#D4F4E2',
  onTertiaryContainer: '#0E3D22',

  error: palette.error,
  onError: '#FFFFFF',
  errorContainer: '#FCDADA',
  onErrorContainer: '#5F1311',

  background: palette.background,
  onBackground: '#1A1C1E',

  surface: palette.surface,
  onSurface: '#1A1C1E',
  surfaceVariant: '#E1E7EF',
  onSurfaceVariant: '#444B53',

  outline: '#74777F',
  outlineVariant: '#C4C7CF',

  inverseSurface: '#2F3033',
  inverseOnSurface: '#F1F0F4',
  inversePrimary: '#9ECBEC',

  elevation: {
    level0: 'transparent',
    level1: '#EFF5FC',
    level2: '#E8F1FA',
    level3: '#E1EDF8',
    level4: '#DFEBF7',
    level5: '#D9E8F5',
  },
};

export const darkColors = {
  primary: '#9ECBEC',
  onPrimary: '#00344F',
  primaryContainer: '#0A4D71',
  onPrimaryContainer: '#D3E6F5',

  secondary: '#A9CBE8',
  onSecondary: '#19374D',
  secondaryContainer: '#2E4F69',
  onSecondaryContainer: '#DCEBF7',

  tertiary: '#8FDBAE',
  onTertiary: '#0A3D21',
  tertiaryContainer: '#155A32',
  onTertiaryContainer: '#D4F4E2',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  background: '#111418',
  onBackground: '#E2E2E6',

  surface: '#15191E',
  onSurface: '#E2E2E6',
  surfaceVariant: '#2C313A',
  onSurfaceVariant: '#C4C7CF',

  outline: '#8E9099',
  outlineVariant: '#444A52',

  inverseSurface: '#E2E2E6',
  inverseOnSurface: '#2F3033',
  inversePrimary: '#1B6CA8',

  elevation: {
    level0: 'transparent',
    level1: '#1A1F25',
    level2: '#1D232A',
    level3: '#20262F',
    level4: '#212833',
    level5: '#242C37',
  },
};
