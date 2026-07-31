import { View } from 'react-native';

import { Icon, type IconName } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { ScreenShell } from './ScreenShell';

export type PlaceholderScreenProps = {
    icon: IconName;
    title: string;
    subtitle?: string;
    hint?: string;
    testID?: string;
};

/**
 * Route placeholder — used during Milestone 3 (navigation) so every route
 * compiles and renders something meaningful before feature code arrives.
 * Feature milestones (M5+) replace these one at a time.
 */
export function PlaceholderScreen({
    icon,
    title,
    subtitle,
    hint = 'This screen is a navigation placeholder.',
    testID = 'placeholder-screen',
}: PlaceholderScreenProps) {
    return (
        <ScreenShell testID={testID}>
            <View className="flex-1 items-center justify-center gap-4">
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon name={icon} size={40} tone="primary" />
                </View>
                <Text variant="h1" className="text-center" testID={`${testID}-title`}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text variant="body" tone="muted" className="text-center">
                        {subtitle}
                    </Text>
                ) : null}
                <View className="mt-4 rounded-lg border border-border bg-bg-elevated px-4 py-2">
                    <Text variant="caption" tone="subtle">
                        {hint}
                    </Text>
                </View>
            </View>
        </ScreenShell>
    );
}
