import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

/**
 * Milestone 1 — Bootstrap shell.
 * Verifies that Expo Router, NativeWind and TypeScript are all wired.
 * No business logic lives here; feature routes land in Milestone 4+.
 */
export default function BootstrapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50"
          testID="bootstrap-title"
        >
          Attendance App
        </Text>
        <Text
          className="mt-2 text-sm text-neutral-500 dark:text-neutral-400"
          testID="bootstrap-subtitle"
        >
          Milestone 1 · Project bootstrap ready
        </Text>
      </View>
    </SafeAreaView>
  );
}
