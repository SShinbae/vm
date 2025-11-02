import { allIcons } from '@/lib/design-system/icons';

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'date' | 'textarea';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof allIcons;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormProps {
  /**
   * Form fields configuration
   */
  fields: FormField[];

  /**
   * Initial form values
   */
  initialValues?: Record<string, any>;

  /**
   * Submit callback
   */
  onSubmit: (values: Record<string, any>) => void | Promise<void>;

  /**
   * Submit button label
   * @default "Submit"
   */
  submitLabel?: string;

  /**
   * Show cancel button
   * @default false
   */
  showCancel?: boolean;

  /**
   * Cancel button label
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Cancel callback
   */
  onCancel?: () => void;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
}
