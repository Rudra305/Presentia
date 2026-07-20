import { PlaceholderScreen } from '@/core/ui/templates/PlaceholderScreen';

export default function BiometricScreen() {
  return (
    <PlaceholderScreen
      icon="unlock"
      title="Biometric sign-in"
      subtitle="Face ID / Fingerprint (Milestone 4)"
      testID="auth-biometric"
    />
  );
}
