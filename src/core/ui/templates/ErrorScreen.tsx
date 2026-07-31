import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';

export type ErrorScreenProps = {
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    testID?: string;
};

/**
 * Reusable error state. Consumed by:
 *  - Root ErrorBoundary (crashes)
 *  - Guards that fail to load required data
 *  - Feature screens for fatal fetch errors
 */
export function ErrorScreen({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    actionLabel = 'Try again',
    onAction,
    testID = 'error-screen',
}: ErrorScreenProps) {
    return (
        <SafeAreaView className="flex-1 bg-bg" testID={testID}>
            <View className="flex-1 items-center justify-center gap-4 px-6">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-danger/10">
                    <Icon name="alert-triangle" size={32} tone="danger" />
                </View>
                <Text variant="h2" className="text-center" testID={`${testID}-title`}>
                    {title}
                </Text>
                <Text
                    variant="body"
                    tone="muted"
                    className="text-center"
                    testID={`${testID}-message`}
                >
                    {message}
                </Text>
                {onAction ? (
                    <Button
                        label={actionLabel}
                        leftIcon="refresh-cw"
                        onPress={onAction}
                        testID={`${testID}-action`}
                    />
                ) : null}
            </View>
        </SafeAreaView>
    );
}
