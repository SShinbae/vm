/**
 * Design System - Main Export
 *
 * Centralized export for the entire design system.
 * Import design tokens, theme, utilities, and components from here.
 *
 * Usage:
 * ```typescript
 * // Import everything you need
 * import { tokens, theme, getSpacing, responsive } from '@/lib/design-system';
 *
 * // Or import specific modules
 * import { tokens } from '@/lib/design-system';
 * import { getTypography } from '@/lib/design-system/utils';
 * ```
 */

// ============================================================================
// TOKENS
// ============================================================================
export { tokens } from "./tokens";
export type {
  Animation,
  BorderWidth,
  Breakpoint,
  Easing,
  FontSize,
  FontWeight,
  IconSize,
  LineHeight,
  Opacity,
  Radius,
  Shadow,
  Spacing,
  ZIndex,
} from "./tokens";

// ============================================================================
// THEME
// ============================================================================
export {
  componentTokens,
  getThemeColors,
  resolveSemanticColor,
  semanticTokens,
  spacingPresets,
  theme,
  typography,
} from "./theme";
export type {
  ColorScheme,
  ComponentToken,
  SemanticToken,
  TypographyVariant,
} from "./theme";

// ============================================================================
// ICONS
// ============================================================================
export { allIcons, getIcon, getIconSize, iconMap, iconSizes } from "./icons";
export type {
  IconCategory,
  IconName,
  IconProps,
  IconSize as IconSizeType,
} from "./icons";

// ============================================================================
// UTILITIES
// ============================================================================
export {
  body,
  gap,
  getBreakpoint,
  getContainerMaxWidth,

  // Typography utilities
  getFontSize,
  getFontWeight,
  getGridColumns,
  getLineHeight,
  getScreenDimensions,
  getScreenHeight,
  getScreenWidth,
  // Spacing utilities
  getSpacing,
  getTypography,
  hasSafeArea,
  headings,
  inset,
  isAndroid,
  isBreakpoint,
  // Responsive utilities
  isIOS,
  isLandscape,
  isMobile,
  isPortrait,
  isWeb,
  label,
  letterSpacing,
  margin,
  maxWidth,
  minWidth,
  moderateScale,
  monospace,
  padding,
  platform,
  platformSelect,
  responsive,
  responsiveByBreakpoint,
  scale,
  spacing,
  spacingHelpers,
  textShadow,
  textStyle,
  truncate,
} from "./utils";

// ============================================================================
// COMPONENTS
// ============================================================================
// Atomic Components (Phase 2)
export {
  Avatar,
  Badge,
  // Re-export Text component with clear naming to avoid conflicts
  Text as DSText,
  Divider,
  Icon,
  Spacer,
} from "./components/atoms";

export type {
  AvatarProps,
  AvatarSize,
  AvatarStatus,
  BadgeProps,
  BadgeSize,
  BadgeType,
  BadgeVariant,
  IconProps as DSIconProps,
  IconSize as DSIconSize,
  TextComponentProps as DSTextProps,
  DividerColor,
  DividerLabelPosition,
  DividerOrientation,
  DividerProps,
  DividerThickness,
  IconColor,
  IconVariant,
  IconWeight,
  SpacerProps,
  SpacerSize,
  TextAlign,
  TextColor,
  TextSize,
  TextVariant,
  TextWeight,
} from "./components/atoms";

// Molecule Components (Phase 3)
export {
  Alert,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  ListItem,
  TabBar,
} from "./components/molecules";

export type {
  AlertProps,
  AlertSeverity,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  CardContentProps,
  CardHeaderProps,
  CardProps,
  CardVariant,
  ChipProps,
  InputProps,
  ListItemProps,
  Tab,
  TabBarProps,
} from "./components/molecules";

// Template Components (Phase 5)
export {
  DashboardLayout,
  DetailLayout,
  FormLayout,
  ListLayout,
  PageLayout,
} from "./components/templates";

export type {
  DashboardLayoutProps,
  DetailLayoutProps,
  DetailTab,
  FormLayoutProps,
  FormStep,
  ListLayoutProps,
  PageLayoutProps,
} from "./components/templates";

// ============================================================================
// VERSION
// ============================================================================
export const DESIGN_SYSTEM_VERSION = "1.0.0";

/**
 * Design System Config
 *
 * Configuration and metadata for the design system
 */
export const designSystemConfig = {
  version: DESIGN_SYSTEM_VERSION,
  name: "Vehicle Management Design System",

  // Feature flags for progressive rollout
  features: {
    atomicComponents: true, // Phase 2 - COMPLETE
    moleculeComponents: true, // Phase 3 - COMPLETE
    organismComponents: true, // Phase 4 - COMPLETE
    templates: true, // Phase 5 - COMPLETE
  },

  // Theme configuration
  theme: {
    defaultColorScheme: "light" as "light" | "dark",
    supportsDarkMode: true,
    supportsSystemPreference: true,
  },

  // Accessibility configuration
  accessibility: {
    minimumTouchTarget: 44,
    focusVisible: true,
    screenReaderSupport: true,
  },
} as const;
