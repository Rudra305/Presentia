import { cssInterop } from 'nativewind';
import { forwardRef, type ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { elevation, type ElevationKey } from '@/core/ui/tokens/elevation';

cssInterop(Pressable, { className: 'style' });
cssInterop(View, { className: 'style' });

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

type BaseProps = {
  children: ReactNode;
  padding?: CardPadding;
  elevated?: ElevationKey;
  bordered?: boolean;
  className?: string;
  testID?: string;
};

export type CardProps = BaseProps &
  (
    | ({ pressable?: false } & { onPress?: never })
    | ({ pressable: true } & Omit<PressableProps, 'style' | 'children'>)
  );

/**
 * Card container. Static by default; set `pressable` to get feedback + a11y
 * role. Combines NativeWind classes with platform-appropriate elevation.
 */
export const Card = forwardRef<View, CardProps>(function Card(
  {
    children,
    padding = 'md',
    elevated = 'sm',
    bordered = true,
    className,
    pressable,
    testID,
    ...rest
  },
  ref,
) {
  const composed = [
    'bg-card rounded-lg',
    bordered ? 'border border-border' : '',
    PADDING[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (pressable) {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        className={`${composed} active:opacity-80`}
        style={elevation[elevated]}
        testID={testID}
        {...(rest as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View ref={ref} className={composed} style={elevation[elevated]} testID={testID}>
      {children}
    </View>
  );
});
