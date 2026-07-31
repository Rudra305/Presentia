import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/core/ui/theme';
import { Text } from './Text';

export type LoaderSize = 'sm' | 'md' | 'lg';
export type LoaderTone = 'primary' | 'default' | 'inverse';

const RN_SIZE: Record<LoaderSize, 'small' | 'large'> = {
    sm: 'small',
    md: 'small',
    lg: 'large',
};

export type LoaderProps = {
    size?: LoaderSize;
    tone?: LoaderTone;
    label?: string;
    fullscreen?: boolean;
    testID?: string;
};

/**
 * Loader primitive. Two modes:
 *  - inline (default): renders as a small spinner + optional label
 *  - fullscreen: fills its parent with a centered spinner (use inside a
 *    positioned wrapper, e.g. Modal body or a screen shell — never at the
 *    root of the app to avoid overlaying the whole tree accidentally).
 */
export function Loader({
    size = 'md',
    tone = 'primary',
    label,
    fullscreen = false,
    testID,
}: LoaderProps) {
    const { colors } = useTheme();
    const color =
        tone === 'primary' ? colors.primary : tone === 'inverse' ? colors.primaryFg : colors.fg;

    const content = (
        <View className="flex-row items-center gap-2" testID={testID}>
            <ActivityIndicator size={RN_SIZE[size]} color={color} />
            {label ? (
                <Text variant="bodySm" tone={tone === 'inverse' ? 'inverse' : 'muted'}>
                    {label}
                </Text>
            ) : null}
        </View>
    );

    if (!fullscreen) return content;

    return (
        <View className="flex-1 items-center justify-center" testID={testID ?? 'loader-fullscreen'}>
            {content}
        </View>
    );
}
