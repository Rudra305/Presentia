import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '@/core/ui/theme';
import type { ThemeColors } from '@/core/ui/tokens/colors';

/** Alias exported so features can type-check their icon prop safely. */
export type IconName = ComponentProps<typeof Feather>['name'];

export type IconTone = keyof ThemeColors | 'inherit';

export type IconProps = {
  name: IconName;
  size?: number;
  /** Semantic token name from ThemeColors, or 'inherit' to use the passed `color`. */
  tone?: IconTone;
  color?: string;
  testID?: string;
};

/**
 * Icon primitive. Wraps @expo/vector-icons (Feather set) so features never
 * import the vendor package directly — swap the icon library here once, in
 * one place, if needed.
 */
export function Icon({ name, size = 20, tone = 'fg', color, testID }: IconProps) {
  const { colors } = useTheme();
  const resolvedColor =
    tone === 'inherit' ? (color ?? colors.fg) : colors[tone as keyof ThemeColors];

  return <Feather name={name} size={size} color={resolvedColor} testID={testID} />;
}
