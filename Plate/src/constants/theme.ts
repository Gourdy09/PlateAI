/**
 * Plate design tokens from Figma (Plate UI).
 * https://www.figma.com/design/sG5eS1iNJZ3YMhK9orGaut/Plate-UI
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Plate = {
  primary: '#e85d3f',
  herbWash: '#DDE8D8',
  spiceWash: '#F7D5BC',
} as const;

export const Colors = {
  light: {
    text: '#25221e',
    textSecondary: '#776f66',
    background: '#fff8ef',
    backgroundElement: '#fffdf9',
    backgroundSelected: '#f3ebe3',
    card: '#fffdf9',
    input: '#ffffff',
    inputBorder: '#e8ded2',
    divider: '#e8ded2',
    primary: Plate.primary,
    onPrimary: '#ffffff',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#b8b1a8',
    background: '#191815',
    backgroundElement: '#24221e',
    backgroundSelected: '#2c2925',
    card: '#24221e',
    input: '#2c2925',
    inputBorder: '#3b3832',
    divider: '#3b3832',
    primary: Plate.primary,
    onPrimary: '#ffffff',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
