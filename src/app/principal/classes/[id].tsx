import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/core/ui/atoms/Loader';
import { ErrorScreen } from '@/core/ui/templates/ErrorScreen';
import { ScreenShell } from '@/core/ui/templates/ScreenShell';
import {
    ClassForm,
    getClassRepo,
    type ClassFormValues,
    type ClassWithDetails,
} from '@/features/classes';
import { ensureSeedTenant, getTeacherRepo, type Teacher } from '@/features/teachers';

export default function EditClassScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [classItem, setClassItem] = useState<ClassWithDetails | null | undefined>(undefined);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    useEffect(() => {
        async function load() {
            if (!id) {
                setClassItem(null);
                return;
            }
            const tenantId = await ensureSeedTenant();
            const teacherRepo = await getTeacherRepo();
            const teacherList = await teacherRepo.listByTenant(tenantId);
            setTeachers(teacherList);

            const classRepo = await getClassRepo();
            const found = await classRepo.findByIdWithDetails(id);
            setClassItem(found);
        }
        void load();
    }, [id]);

    if (classItem === undefined) {
        return (
            <SafeAreaView className="flex-1 bg-bg items-center justify-center">
                <Loader size="lg" />
            </SafeAreaView>
        );
    }

    if (classItem === null) {
        return (
            <ErrorScreen
                title="Class not found"
                message="The requested class record could not be found."
                onAction={() => router.back()}
                actionLabel="Go back"
                testID="edit-class-not-found"
            />
        );
    }

    const handleSubmit = async (values: ClassFormValues) => {
        try {
            const repo = await getClassRepo();
            await repo.update(classItem.id, {
                name: values.name.trim(),
                grade: values.grade?.trim() || null,
                section: values.section?.trim() || null,
                teacherId: values.teacherId?.trim() || null,
            });
            router.back();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Could not update class.';
            Alert.alert('Error', message);
        }
    };

    return (
        <ScreenShell
            title={`Edit ${classItem.name}`}
            subtitle={`Enrolled students: ${classItem.studentCount}`}
            testID="edit-class-screen"
        >
            <View className="pt-2">
                <ClassForm
                    initialValues={{
                        name: classItem.name,
                        grade: classItem.grade ?? '',
                        section: classItem.section ?? '',
                        teacherId: classItem.teacherId ?? '',
                    }}
                    teachers={teachers}
                    submitLabel="Save changes"
                    onSubmit={handleSubmit}
                    onCancel={() => router.back()}
                />
            </View>
        </ScreenShell>
    );
}
