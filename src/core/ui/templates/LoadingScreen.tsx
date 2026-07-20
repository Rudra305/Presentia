import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/core/ui/atoms/Loader';
import { Text } from '@/core/ui/atoms/Text';

export type LoadingScreenProps = {
  label?: string;
  testID?: string;
};

/**
 * Full-viewport loading state. Used by:
 *  - Boot redirect (app/index.tsx) while auth hydrates
 *  - Stack layouts while resolving guards
 *  - Any feature screen fetching required data
 */
export function LoadingScreen({
  label = 'Loading…',
  testID = 'loading-screen',
}: LoadingScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" testID={testID}>
      <View className="flex-1 items-center justify-center gap-4">
        <Loader size="lg" tone="primary" />
        <Text variant="bodySm" tone="muted">
          {label}
        </Text>
      </View>
    </SafeAreaView>
  );
}
