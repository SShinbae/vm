import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { PageHeaderProps } from "../../organisms/PageHeader/PageHeader.types";

export interface FormStep {
  /**
   * Unique step identifier
   */
  id: string;

  /**
   * Step title
   */
  title: string;

  /**
   * Step description
   */
  description?: string;

  /**
   * Step content
   */
  content: ReactNode;

  /**
   * Whether this step is optional
   */
  optional?: boolean;
}

export interface FormLayoutProps extends Omit<ViewProps, "style"> {
  /**
   * Page header configuration
   */
  header?: PageHeaderProps;

  /**
   * Form title
   */
  title?: string;

  /**
   * Form description
   */
  description?: string;

  /**
   * Form steps (for multi-step forms)
   */
  steps?: FormStep[];

  /**
   * Current step index
   */
  currentStep?: number;

  /**
   * Step change handler
   */
  onStepChange?: (stepIndex: number) => void;

  /**
   * Single-step form content
   */
  children?: ReactNode;

  /**
   * Submit button label
   * @default 'Submit'
   */
  submitLabel?: string;

  /**
   * Cancel button label
   * @default 'Cancel'
   */
  cancelLabel?: string;

  /**
   * Previous button label
   * @default 'Previous'
   */
  previousLabel?: string;

  /**
   * Next button label
   * @default 'Next'
   */
  nextLabel?: string;

  /**
   * Submit handler
   */
  onSubmit: () => void;

  /**
   * Cancel handler
   */
  onCancel?: () => void;

  /**
   * Loading/submitting state
   * @default false
   */
  loading?: boolean;

  /**
   * Whether to show progress indicator
   * @default true (for multi-step forms)
   */
  showProgress?: boolean;

  /**
   * Validation errors
   */
  errors?: Record<string, string>;
}
