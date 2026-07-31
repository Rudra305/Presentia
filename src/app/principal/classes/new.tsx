import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/core/ui/atoms/Loader';
import { ScreenShell } from '@/core/ui/templates/ScreenShell';
import { ClassForm, getClassRepo, type ClassFormValues } from '@/features/classes';
import { ensureSeedTenant, getTeacherRepo, type Teacher } from '@/features/teachers';

export default function NewClassScreen() {
    const [teachers, setTeachers] = useState<Teacher[] | null>(null);

    useEffect(() => {
        async function loadTeachers() {
            const tenantId = await ensureSeedTenant();
            const repo = await getTeacherRepo();
            const list = await repo.listByTenant(tenantId);
            setTeachers(list);
        }
        void loadTeachers();
    }, []);

    const handleSubmit = async (values: ClassFormValues) => {
        try {
            const tenantId = await ensureSeedTenant();
            const repo = await getClassRepo();
            await repo.insert({
                tenantId,
                name: values.name.trim(),
                grade: values.grade?.trim() || null,
                section: values.section?.trim() || null,
                teacherId: values.teacherId?.trim() || null,
            });
            router.back();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Could not create class.';
            Alert.alert('Error', message);
        }
    };

    if (teachers == null) {
        return (
            <SafeAreaView className="flex-1 bg-bg items-center justify-center">
                <Loader size="lg" />
            </SafeAreaView>
        );
    }

    return (
        <ScreenShell
            title="Create new class"
            subtitle="Define class details and assign a lead teacher"
            testID="new-class-screen"
        >
            <View className="pt-2">
                <ClassForm
                    teachers={teachers}
                    submitLabel="Save class"
                    onSubmit={handleSubmit}
                    onCancel={() => router.back()}
                />
            </View>
        </ScreenShell>
    );
}
