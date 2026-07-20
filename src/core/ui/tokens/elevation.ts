import { Platform, type ViewStyle } from 'react-native';

/**
 * Elevation presets that resolve to platform-appropriate shadows.
 *
 * On iOS this maps to shadow* properties; on Android to elevation.
 * Consumers should spread the return value into a `style` prop.
 */

function build(config: {
  ios: { opacity: number; radius: number; offsetY: number };
  android: number;
}): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: config.ios.opacity,
      shadowRadius: config.ios.radius,
      shadowOffset: { width: 0, height: config.ios.offsetY },
    },
    android: {
      elevation: config.android,
    },
    default: {},
  }) as ViewStyle;
}

export const elevation = {
  none: {} as ViewStyle,
  sm: build({ ios: { opacity: 0.06, radius: 6, offsetY: 2 }, android: 2 }),
  md: build({ ios: { opacity: 0.1, radius: 12, offsetY: 4 }, android: 6 }),
  lg: build({ ios: { opacity: 0.14, radius: 20, offsetY: 8 }, android: 12 }),
} as const;

export type ElevationKey = keyof typeof elevation;
