import { Link } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';

/**
 * 404 route — Expo Router matches this for any unknown path.
 */
export default function NotFoundScreen() {
    return (
        <SafeAreaView className="flex-1 bg-bg" testID="not-found-screen">
            <View className="flex-1 items-center justify-center gap-4 px-6">
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-warning/10">
                    <Icon name="compass" size={40} tone="warning" />
                </View>
                <Text variant="display">404</Text>
                <Text variant="h3" className="text-center">
                    Page not found
                </Text>
                <Text variant="body" tone="muted" className="text-center">
                    The screen you&apos;re looking for doesn&apos;t exist.
                </Text>
                <Link href="/" replace className="mt-2">
                    <Text variant="label" tone="primary" testID="not-found-home-link">
                        Go home
                    </Text>
                </Link>
            </View>
        </SafeAreaView>
    );
}
