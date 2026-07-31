import { type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Input } from '@/core/ui/atoms/Input';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import type { Teacher } from '@/features/teachers';
import { classFormSchema, type ClassFormValues } from './schemas';

export type ClassFormProps = {
    initialValues?: Partial<ClassFormValues>;
    teachers: Teacher[];
    submitLabel: string;
    onSubmit: (values: ClassFormValues) => Promise<void>;
    onCancel?: () => void;
    extraActions?: ReactNode;
};

const DEFAULTS: ClassFormValues = {
    name: '',
    grade: '',
    section: '',
    teacherId: '',
};

export function ClassForm({
    initialValues,
    teachers,
    submitLabel,
    onSubmit,
    onCancel,
    extraActions,
}: ClassFormProps) {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ClassFormValues>({
        resolver: zodResolver(classFormSchema),
        defaultValues: { ...DEFAULTS, ...initialValues },
        mode: 'onBlur',
    });

    return (
        <View className="gap-4">
            <Controller
                control={control}
                name="name"
                render={({ field }) => (
                    <Input
                        label="Class name"
                        placeholder="e.g. Grade 10 - Science"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        autoCapitalize="words"
                        errorText={errors.name?.message}
                        testID="class-form-name"
                    />
                )}
            />

            <View className="flex-row gap-3">
                <View className="flex-1">
                    <Controller
                        control={control}
                        name="grade"
                        render={({ field }) => (
                            <Input
                                label="Grade (optional)"
                                placeholder="e.g. 10"
                                value={field.value ?? ''}
                                onChangeText={field.onChange}
                                onBlur={field.onBlur}
                                autoCapitalize="none"
                                errorText={errors.grade?.message}
                                testID="class-form-grade"
                            />
                        )}
                    />
                </View>
                <View className="flex-1">
                    <Controller
                        control={control}
                        name="section"
                        render={({ field }) => (
                            <Input
                                label="Section (optional)"
                                placeholder="e.g. A"
                                value={field.value ?? ''}
                                onChangeText={field.onChange}
                                onBlur={field.onBlur}
                                autoCapitalize="characters"
                                errorText={errors.section?.message}
                                testID="class-form-section"
                            />
                        )}
                    />
                </View>
            </View>

            <Controller
                control={control}
                name="teacherId"
                render={({ field }) => (
                    <View className="gap-2">
                        <Text variant="label" tone="muted">
                            Assigned Teacher (optional)
                        </Text>
                        {teachers.length === 0 ? (
                            <Card padding="sm">
                                <Text variant="bodySm" tone="muted">
                                    No active teachers found. You can assign a teacher later.
                                </Text>
                            </Card>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8 }}
                            >
                                <TeacherSelectTile
                                    name="Unassigned"
                                    selected={!field.value}
                                    onPress={() => field.onChange('')}
                                    testID="class-form-teacher-none"
                                />
                                {teachers.map((t) => (
                                    <TeacherSelectTile
                                        key={t.id}
                                        name={t.fullName}
                                        email={t.email}
                                        selected={field.value === t.id}
                                        onPress={() => field.onChange(t.id)}
                                        testID={`class-form-teacher-${t.id}`}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}
            />

            <View className="flex-row gap-3 mt-2">
                {onCancel ? (
                    <Button
                        label="Cancel"
                        variant="secondary"
                        fullWidth
                        onPress={onCancel}
                        testID="class-form-cancel"
                    />
                ) : null}
                <Button
                    label={submitLabel}
                    leftIcon="check"
                    fullWidth
                    loading={isSubmitting}
                    onPress={handleSubmit(onSubmit)}
                    testID="class-form-submit"
                />
            </View>

            {extraActions}
        </View>
    );
}

function TeacherSelectTile({
    name,
    email,
    selected,
    onPress,
    testID,
}: {
    name: string;
    email?: string | null;
    selected: boolean;
    onPress: () => void;
    testID: string;
}) {
    return (
        <Pressable onPress={onPress} testID={testID} style={{ width: 130, height: 76 }}>
            <Card
                padding="sm"
                className={`w-full h-full items-center justify-center border ${
                    selected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
            >
                <View className="items-center justify-center gap-0.5 w-full">
                    <Icon name="user" size={16} tone={selected ? 'primary' : 'fgMuted'} />
                    <Text
                        variant="label"
                        tone={selected ? 'primary' : 'default'}
                        numberOfLines={1}
                        className="text-center"
                    >
                        {name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1} className="text-center">
                        {email ?? 'No email'}
                    </Text>
                </View>
            </Card>
        </Pressable>
    );
}
