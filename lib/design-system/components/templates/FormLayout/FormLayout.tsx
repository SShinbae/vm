import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { theme } from '../../../theme';
import { tokens } from '../../../tokens';
import { Spacer } from '../../atoms/Spacer';
import { Text } from '../../atoms/Text';
import { Button } from '../../molecules/Button';
import { PageHeader } from '../../organisms/PageHeader';
import type { FormLayoutProps } from './FormLayout.types';

export const FormLayout: React.FC<FormLayoutProps> = ({
  header,
  title,
  description,
  steps = [],
  currentStep: controlledStep,
  onStepChange,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  onSubmit,
  onCancel,
  loading = false,
  showProgress,
  errors = {},
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  const isMultiStep = steps.length > 0;
  const [internalStep, setInternalStep] = useState(0);
  const currentStepIndex = controlledStep !== undefined ? controlledStep : internalStep;

  const showProgressIndicator = showProgress !== undefined ? showProgress : isMultiStep;

  const handleStepChange = (newStep: number) => {
    if (onStepChange) {
      onStepChange(newStep);
    } else {
      setInternalStep(newStep);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      handleStepChange(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      handleStepChange(currentStepIndex + 1);
    }
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const currentStepData = steps[currentStepIndex];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      {...props}
    >
      {header && <PageHeader {...header} />}

      {/* Progress Indicator */}
      {showProgressIndicator && isMultiStep && (
        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index <= currentStepIndex ? colors.tint : colors.border,
                    },
                  ]}
                />
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      {
                        backgroundColor:
                          index < currentStepIndex ? colors.tint : colors.border,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          <Spacer size="sm" />
          <Text size="sm" color="secondary" align="center">
            Step {currentStepIndex + 1} of {steps.length}
            {currentStepData?.optional && ' (Optional)'}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Form Title */}
        {(title || currentStepData?.title) && (
          <>
            <Text variant="heading" size="xl">
              {currentStepData?.title || title}
            </Text>
            <Spacer size="sm" />
          </>
        )}

        {/* Form Description */}
        {(description || currentStepData?.description) && (
          <>
            <Text color="secondary">{currentStepData?.description || description}</Text>
            <Spacer size="lg" />
          </>
        )}

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <>
            <View style={[styles.errorContainer, { backgroundColor: colors.card, borderColor: colors.error }]}>
              <Text color="error" weight="semibold">
                Please fix the following errors:
              </Text>
              <Spacer size="xs" />
              {Object.values(errors).map((error, index) => (
                <Text key={index} color="error" size="sm">
                  • {error}
                </Text>
              ))}
            </View>
            <Spacer size="lg" />
          </>
        )}

        {/* Form Content */}
        {isMultiStep ? currentStepData?.content : children}

        <Spacer size="xl" />
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionsContainer,
          { borderTopColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.actionButtons}>
          {onCancel && (
            <Button
              variant="ghost"
              onPress={onCancel}
              disabled={loading}
              style={styles.button}
            >
              {cancelLabel}
            </Button>
          )}

          {isMultiStep && !isFirstStep && (
            <Button
              variant="outline"
              onPress={handlePrevious}
              disabled={loading}
              style={styles.button}
            >
              {previousLabel}
            </Button>
          )}

          {isMultiStep && !isLastStep ? (
            <Button
              variant="primary"
              onPress={handleNext}
              disabled={loading}
              style={styles.button}
            >
              {nextLabel}
            </Button>
          ) : (
            <Button
              variant="primary"
              onPress={onSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {submitLabel}
            </Button>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: tokens.spacing.md,
  },
  progressContainer: {
    padding: tokens.spacing.md,
    paddingBottom: 0,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 40,
    height: 2,
  },
  errorContainer: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
  actionsContainer: {
    padding: tokens.spacing.md,
    borderTopWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    justifyContent: 'flex-end',
  },
  button: {
    minWidth: 100,
  },
});
