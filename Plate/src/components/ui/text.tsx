import { Text, type TextProps, type TextStyle } from 'react-native';

import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColor } from '@/constants/theme';

export type TypeVariant = keyof typeof Type;

type AppTextProps = TextProps & {
  variant?: TypeVariant;
  color?: ThemeColor;
  /** Overrides the token colour with an explicit value from a theme lookup. */
  tint?: string;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
};

/** Every piece of copy goes through the type ramp and the colour tokens. */
export function AppText({
  variant = 'body',
  color = 'text',
  tint,
  align,
  uppercase,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        Type[variant],
        { color: tint ?? theme[color] },
        align ? { textAlign: align } : null,
        uppercase ? { textTransform: 'uppercase' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
