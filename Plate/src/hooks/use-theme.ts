import { useAppTheme } from '@/ctx/theme';
import type { ThemeColors } from '@/constants/theme';

/** Colour tokens for the active appearance. See ctx/theme for how it is resolved. */
export function useTheme(): ThemeColors {
  return useAppTheme().colors;
}

export function useColorSchemeName() {
  return useAppTheme().scheme;
}
