import { allIcons } from '@/lib/design-system/icons';
import { ImageSourcePropType } from 'react-native';

export interface VehicleMetric {
  label: string;
  value: string | number;
  icon?: keyof typeof allIcons;
}

export interface VehicleAction {
  icon: keyof typeof allIcons;
  label: string;
  onPress: () => void;
}

export interface VehicleCardProps {
  /**
   * Vehicle name/title
   */
  name: string;

  /**
   * Vehicle subtitle (e.g., year, model)
   */
  subtitle?: string;

  /**
   * Vehicle image
   */
  image?: ImageSourcePropType | string;

  /**
   * Status badge text
   */
  status?: string;

  /**
   * Status badge variant
   */
  statusVariant?: 'success' | 'warning' | 'error' | 'info';

  /**
   * Key metrics to display
   */
  metrics?: VehicleMetric[];

  /**
   * Quick action buttons
   */
  actions?: VehicleAction[];

  /**
   * Callback when card is pressed
   */
  onPress?: () => void;

  /**
   * Show loading skeleton
   * @default false
   */
  loading?: boolean;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
}
