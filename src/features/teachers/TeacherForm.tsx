import { type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View } from 'react-native';

import { Button } from '@/core/ui/atoms/Button';
import { Input } from '@/core/ui/atoms/Input';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { teacherFormSchema, type TeacherFormValues } from '@/features/teachers';

export type TeacherFormProps = {
  initialValues?: Partial<TeacherFormValues>;
  submitLabel: string;
  onSubmit: (values: TeacherFormValues) => Promise<void>;
  onCancel?: () => void;
  extraActions?: ReactNode;
};

const DEFAULTS: TeacherFormValues = {
  fullName: '',
  email: '',
  status: 'active',
};

export function TeacherForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  extraActions,
}: TeacherFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: { ...DEFAULTS, ...initialValues },
    mode: 'onBlur',
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <Input
            label="Full name"
            placeholder="e.g. Ravi Menon"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoCapitalize="words"
            errorText={errors.fullName?.message}
            testID="teacher-form-full-name"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email (optional)"
            placeholder="teacher@school.example"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoCapitalize="none"
            keyboardType="email-address"
            errorText={errors.email?.message}
            testID="teacher-form-email"
          />
        )}
      />

      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <View className="gap-2">
            <Text variant="label" tone="muted">
              Status
            </Text>
            <Card padding="none">
              <View className="flex-row">
                {(['active', 'disabled'] as const).map((s) => (
                  <StatusPill
                    key={s}
                    label={s === 'active' ? 'Active' : 'Disabled'}
                    selected={field.value === s}
                    onPress={() => field.onChange(s)}
                    testID={`teacher-form-status-${s}`}
                  />
                ))}
              </View>
            </Card>
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
            testID="teacher-form-cancel"
          />
        ) : null}
        <Button
          label={submitLabel}
          leftIcon="check"
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          testID="teacher-form-submit"
        />
      </View>

      {extraActions}
    </View>
  );
}

function StatusPill({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Button
      label={label}
      variant={selected ? 'primary' : 'ghost'}
      size="sm"
      fullWidth
      onPress={onPress}
      testID={testID}
    />
  );
}
