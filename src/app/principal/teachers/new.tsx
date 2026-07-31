import { router } from 'expo-router';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/core/ui/atoms/Text';
import { TeacherForm } from '@/features/teachers/TeacherForm';
import { ensureSeedTenant, getTeacherRepo } from '@/features/teachers';

export default function NewTeacherScreen() {
    return (
        <SafeAreaView
            className="flex-1 bg-bg"
            edges={['left', 'right', 'bottom']}
            testID="teacher-new"
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 16 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text variant="h2">Add teacher</Text>
                <Text variant="bodySm" tone="muted">
                    Create a teacher account. They&apos;ll set their PIN and biometric on first
                    sign-in.
                </Text>

                <TeacherForm
                    submitLabel="Save teacher"
                    onCancel={() => router.back()}
                    onSubmit={async (values) => {
                        try {
                            const tenantId = await ensureSeedTenant();
                            const repo = await getTeacherRepo();
                            await repo.insert({
                                tenantId,
                                fullName: values.fullName.trim(),
                                email:
                                    values.email && values.email.length > 0
                                        ? values.email.trim()
                                        : null,
                                status: values.status,
                                biometricEnrolled: false,
                            });
                            router.back();
                        } catch (err) {
                            Alert.alert(
                                'Could not save teacher',
                                err instanceof Error ? err.message : 'Unknown error',
                            );
                        }
                    }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
