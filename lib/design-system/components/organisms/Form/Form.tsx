import { Spacer } from '@/lib/design-system/components/atoms/Spacer';
import { Button } from '@/lib/design-system/components/molecules/Button';
import { Input } from '@/lib/design-system/components/molecules/Input';
import { tokens } from '@/lib/design-system/tokens';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FormField, FormProps } from './Form.types';

export const Form: React.FC<FormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = 'Submit',
  showCancel = false,
  cancelLabel = 'Cancel',
  onCancel,
  loading = false,
  disabled = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { min, max, pattern, message } = field.validation;

      if (min !== undefined && value.length < min) {
        return message || `${field.label} must be at least ${min} characters`;
      }

      if (max !== undefined && value.length > max) {
        return message || `${field.label} must not exceed ${max} characters`;
      }

      if (pattern && !pattern.test(value)) {
        return message || `${field.label} format is invalid`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, values[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(values);
  };

  const renderField = (field: FormField) => {
    const value = values[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <Input
            key={field.name}
            label={field.label}
            value={value}
            onChangeText={(text) => handleChange(field.name, text)}
            placeholder={field.placeholder}
            errorText={error}
            helperText={!error ? field.placeholder : undefined}
            disabled={disabled || field.disabled}
            leftIcon={field.leftIcon}
            multiline
            numberOfLines={4}
            fullWidth
          />
        );

      case 'email':
        return (
          <Input
            key={field.name}
            label={field.label}
            value={value}
            onChangeText={(text) => handleChange(field.name, text)}
            placeholder={field.placeholder}
            errorText={error}
            disabled={disabled || field.disabled}
            leftIcon={field.leftIcon || 'email'}
            keyboardType="email-address"
            autoCapitalize="none"
            fullWidth
          />
        );

      case 'password':
        return (
          <Input
            key={field.name}
            label={field.label}
            value={value}
            onChangeText={(text) => handleChange(field.name, text)}
            placeholder={field.placeholder}
            errorText={error}
            disabled={disabled || field.disabled}
            leftIcon={field.leftIcon}
            secureTextEntry
            fullWidth
          />
        );

      case 'number':
        return (
          <Input
            key={field.name}
            label={field.label}
            value={value}
            onChangeText={(text) => handleChange(field.name, text)}
            placeholder={field.placeholder}
            errorText={error}
            disabled={disabled || field.disabled}
            leftIcon={field.leftIcon}
            keyboardType="numeric"
            fullWidth
          />
        );

      default:
        return (
          <Input
            key={field.name}
            label={field.label}
            value={value}
            onChangeText={(text) => handleChange(field.name, text)}
            placeholder={field.placeholder}
            errorText={error}
            disabled={disabled || field.disabled}
            leftIcon={field.leftIcon}
            fullWidth
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {fields.map((field, index) => (
          <View key={field.name}>
            {renderField(field)}
            {index < fields.length - 1 && <Spacer size="md" />}
          </View>
        ))}
      </ScrollView>

      <Spacer size="xl" />

      <View style={styles.buttonContainer}>
        {showCancel && onCancel && (
          <>
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={loading || disabled}
              style={styles.button}
            >
              {cancelLabel}
            </Button>
            <Spacer size="sm" horizontal />
          </>
        )}
        <Button
          onPress={handleSubmit}
          loading={loading}
          disabled={disabled}
          style={styles.button}
          fullWidth={!showCancel}
        >
          {submitLabel}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  button: {
    flex: 1,
  },
});
