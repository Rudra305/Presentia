import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/core/ui/atoms/Text';

export type ScreenShellProps = {
    title?: string;
    subtitle?: string;
    children?: ReactNode;
    scrollable?: boolean;
    testID?: string;
};

/**
 * Base screen container. Provides safe-area padding, optional title/subtitle
 * header, and a scrollable body. Feature screens should compose this — never
 * hand-roll their own SafeAreaView + scroll.
 */
export function ScreenShell({
    title,
    subtitle,
    children,
    scrollable = false,
    testID,
}: ScreenShellProps) {
    const Body = scrollable ? ScrollView : View;
    return (
        <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']} testID={testID}>
            {title || subtitle ? (
                <View className="px-6 pt-4 pb-2 gap-1">
                    {title ? (
                        <Text variant="h1" testID={testID ? `${testID}-title` : undefined}>
                            {title}
                        </Text>
                    ) : null}
                    {subtitle ? (
                        <Text
                            variant="body"
                            tone="muted"
                            testID={testID ? `${testID}-subtitle` : undefined}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>
            ) : null}
            <Body
                className="flex-1"
                contentContainerStyle={
                    scrollable ? { paddingHorizontal: 24, paddingBottom: 24 } : undefined
                }
                style={scrollable ? undefined : { paddingHorizontal: 24 }}
            >
                {children}
            </Body>
        </SafeAreaView>
    );
}
