import { PlaceholderScreen } from '@/core/ui/templates/PlaceholderScreen';

export default function LockedScreen() {
  return (
    <PlaceholderScreen
      icon="lock"
      title="Temporarily locked"
      subtitle="Too many failed attempts. Try again shortly."
      testID="auth-locked"
    />
  );
}
