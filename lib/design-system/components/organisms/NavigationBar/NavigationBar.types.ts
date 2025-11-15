import { allIcons } from "@/lib/design-system/icons";

export interface NavigationTab {
  id: string;
  label: string;
  icon?: keyof typeof allIcons;
  badge?: number;
  disabled?: boolean;
}

export interface NavigationBarProps {
  /**
   * Navigation tabs
   */
  tabs: NavigationTab[];

  /**
   * Active tab ID
   */
  activeTab: string;

  /**
   * Tab change callback
   */
  onTabChange: (tabId: string) => void;

  /**
   * Show labels
   * @default true
   */
  showLabels?: boolean;

  /**
   * Variant
   * @default "default"
   */
  variant?: "default" | "filled";

  /**
   * Position
   * @default "bottom"
   */
  position?: "top" | "bottom";
}
