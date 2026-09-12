/**
 * Plate design tokens.
 *
 * Components read colours from `useTheme()` and never hardcode a hex value, so
 * light and dark stay in step and a token change lands everywhere at once.
 * https://www.figma.com/design/sG5eS1iNJZ3YMhK9orGaut/Plate-UI
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Brand colours shared by both schemes. */
export const Plate: Record<
  'primary' | 'primaryPressed' | 'herbWash' | 'spiceWash' | 'sage' | 'sageDark',
  string
> = {
  primary: '#e85d3f',
  primaryPressed: '#d24f33',
  herbWash: '#DDE8D8',
  spiceWash: '#F7D5BC',
  sage: '#78927b',
  sageDark: '#66866d',
};

const light = {
  // Surfaces
  background: '#fff8ef',
  surface: '#fffdf9',
  surfaceElevated: '#ffffff',
  surfaceSunken: '#f7f0e6',
  card: '#fffdf9',
  backgroundElement: '#fffdf9',
  backgroundSelected: '#f3ebe3',

  // Text
  text: '#25221e',
  textSecondary: '#776f66',
  textTertiary: '#9c948a',
  onPrimary: '#ffffff',
  onAccent: '#ffffff',

  // Lines
  border: '#e8ded2',
  borderStrong: '#d9ccbc',
  divider: '#e8ded2',
  inputBorder: '#e8ded2',
  filterBorder: '#ebe3d5',

  // Accents
  primary: Plate.primary,
  primaryPressed: Plate.primaryPressed,
  primaryWash: '#fbe6df',
  accent: Plate.sage,
  sage: Plate.sage,
  accentWash: '#e6ece3',
  heart: '#E8927C',
  recipeAccent: '#a67c52',

  // Status
  success: '#3f7d52',
  successWash: '#e4efe6',
  warning: '#a8712a',
  warningWash: '#f8ecdb',
  error: '#b4402f',
  errorWash: '#fae4e0',

  // Controls
  input: '#ffffff',
  chip: '#f4ede2',
  chipText: '#504d48',
  navigation: '#fffdf9',
  navigationBorder: '#ebe3d5',
  skeleton: '#f0e7db',
  scrim: 'rgba(37,34,30,0.45)',
  overlay: 'rgba(37,34,30,0.55)',
};

/** Every token in `light` must exist in `dark`, so neither scheme can drift. */
export type ThemeColors = typeof light;
export type ThemeColor = keyof ThemeColors;

const dark: ThemeColors = {
  background: '#191815',
  surface: '#24221e',
  surfaceElevated: '#2c2925',
  surfaceSunken: '#141310',
  card: '#24221e',
  backgroundElement: '#24221e',
  backgroundSelected: '#2c2925',

  text: '#f7f4ef',
  textSecondary: '#b8b1a8',
  textTertiary: '#8d867d',
  onPrimary: '#ffffff',
  onAccent: '#ffffff',

  border: '#3b3832',
  borderStrong: '#4b473f',
  divider: '#3b3832',
  inputBorder: '#3b3832',
  filterBorder: '#3d3a34',

  primary: Plate.primary,
  primaryPressed: Plate.primaryPressed,
  primaryWash: '#3a251f',
  accent: Plate.sageDark,
  sage: Plate.sageDark,
  accentWash: '#26302a',
  heart: '#E8927C',
  recipeAccent: '#d4c79f',

  success: '#7fb08d',
  successWash: '#24302a',
  warning: '#d6a05c',
  warningWash: '#33291c',
  error: '#e08272',
  errorWash: '#3a2320',

  input: '#2c2925',
  chip: '#2c2a25',
  chipText: '#a19e97',
  navigation: '#1f1e1a',
  navigationBorder: '#332f29',
  skeleton: '#2c2925',
  scrim: 'rgba(0,0,0,0.6)',
  overlay: 'rgba(0,0,0,0.62)',
};

export const Colors = { light, dark } as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

/** Type ramp. Kept small on purpose so hierarchy stays readable. */
export const Type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '600' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '600' },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.5 },
} as const;

export const Elevation = {
  card: {
    shadowColor: '#3a2a1c',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#3a2a1c',
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480;

/** Spreadable equivalent of the old StyleSheet.absoluteFillObject. */
export const Fill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;
