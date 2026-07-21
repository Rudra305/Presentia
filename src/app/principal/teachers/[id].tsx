import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/core/ui/atoms/Loader';
import { Text } from '@/core/ui/atoms/Text';
import { getTeacherRepo, type Teacher } from '@/features/teachers';
import { TeacherForm } from '@/features/teachers/TeacherForm';

export default function EditTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [teacher, setTeacher] = useState<Teacher | null | 'not-found'>(null);

  useEffect(() => {
    void (async () => {
      const repo = await getTeacherRepo();
      const t = await repo.findById(String(id));
      setTeacher(t ?? 'not-found');
    })();
  }, [id]);

  if (teacher === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <Loader size="lg" />
      </SafeAreaView>
    );
  }

  if (teacher === 'not-found') {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6 gap-2">
        <Text variant="h3">Teacher not found</Text>
        <Text variant="bodySm" tone="muted">
          This record may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-bg"
      edges={['left', 'right', 'bottom']}
      testID="teacher-edit"
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1">
          <Text variant="h2">Edit teacher</Text>
          <Text variant="caption" tone="subtle">
            v{teacher.version} · last updated {new Date(teacher.updatedAt).toLocaleString()}
          </Text>
        </View>

        <TeacherForm
          submitLabel="Save changes"
          onCancel={() => router.back()}
          initialValues={{
            fullName: teacher.fullName,
            email: teacher.email ?? '',
            status: teacher.status,
          }}
          onSubmit={async (values) => {
            try {
              const repo = await getTeacherRepo();
              await repo.update(teacher.id, {
                fullName: values.fullName.trim(),
                email: values.email && values.email.length > 0 ? values.email.trim() : null,
                status: values.status,
              });
              router.back();
            } catch (err) {
              Alert.alert('Could not save', err instanceof Error ? err.message : 'Unknown error');
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
