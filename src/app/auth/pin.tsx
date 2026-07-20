import { PlaceholderScreen } from '@/core/ui/templates/PlaceholderScreen';

export default function PinScreen() {
  return (
    <PlaceholderScreen
      icon="hash"
      title="PIN sign-in"
      subtitle="6-digit fallback (Milestone 4)"
      testID="auth-pin"
    />
  );
}
