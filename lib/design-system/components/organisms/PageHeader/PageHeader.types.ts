import { allIcons } from "@/lib/design-system/icons";

export interface PageHeaderAction {
  icon: keyof typeof allIcons;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}

export interface PageHeaderProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Optional subtitle text
   */
  subtitle?: string;

  /**
   * Show back button
   * @default false
   */
  showBack?: boolean;

  /**
   * Callback when back button is pressed
   */
  onBack?: () => void;

  /**
   * Action buttons to display in the header
   */
  actions?: PageHeaderAction[];

  /**
   * Content to display below the header (e.g., tabs, filters)
   */
  bottom?: React.ReactNode;

  /**
   * Custom background color
   */
  backgroundColor?: string;

  /**
   * Hide border bottom
   * @default false
   */
  noBorder?: boolean;
}
