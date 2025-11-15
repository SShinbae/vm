/**
 * Icon System
 *
 * Centralized icon configuration with standardized sizes and mappings.
 * Provides a consistent interface for using icons throughout the app.
 *
 * Usage:
 * ```typescript
 * import { iconMap, iconSizes } from '@/lib/design-system/icons';
 * import { IconSymbol } from '@/components/ui/icon-symbol';
 *
 * <IconSymbol name={iconMap.navigation.home} size={iconSizes.md} />
 * ```
 */

import type { SFSymbols6_0 } from "sf-symbols-typescript";
import { tokens } from "./tokens";

/**
 * Icon Sizes
 * Standardized sizes for all icons in the app
 */
export const iconSizes = tokens.iconSize;

/**
 * Centralized Icon Mapping
 * Maps semantic icon names to SF Symbols (iOS) and Material Icons (Android)
 */
export const iconMap = {
  // Navigation Icons
  navigation: {
    home: "house.fill",
    back: "chevron.left",
    forward: "chevron.right",
    close: "xmark",
    menu: "line.horizontal.3",
    more: "ellipsis",
    up: "chevron.up",
    down: "chevron.down",
  },

  // Action Icons
  actions: {
    add: "plus",
    edit: "pencil",
    delete: "trash",
    save: "checkmark",
    cancel: "xmark",
    search: "magnifyingglass",
    filter: "line.3.horizontal.decrease",
    sort: "arrow.up.arrow.down",
    refresh: "arrow.clockwise",
    share: "square.and.arrow.up",
    download: "arrow.down.circle",
    upload: "arrow.up.circle",
    copy: "doc.on.doc",
    settings: "gearshape",
  },

  // Content Icons
  content: {
    info: "info.circle",
    warning: "exclamationmark.triangle.fill",
    error: "xmark.circle.fill",
    success: "checkmark.circle.fill",
    help: "questionmark.circle",
    notification: "bell.fill",
    message: "message.fill",
    email: "envelope",
    calendar: "calendar",
    clock: "clock",
    location: "location.fill",
    map: "map.fill",
  },

  // Vehicle & App Specific Icons
  vehicle: {
    car: "car.fill",
    truck: "car.fill", // Using car as fallback
    motorcycle: "car.fill", // Using car as fallback
    speedometer: "speedometer",
    fuel: "fuelpump.fill",
    service: "wrench.and.screwdriver.fill",
    maintenance: "wrench.fill",
    log: "list.bullet.clipboard.fill",
    receipt: "doc.text.fill",
    camera: "camera.fill",
    photo: "photo.fill",
  },

  // User & Account Icons
  user: {
    profile: "person.fill",
    group: "person.2.fill",
    logout: "rectangle.portrait.and.arrow.right",
    login: "rectangle.portrait.and.arrow.forward",
  },

  // File & Document Icons
  file: {
    document: "doc.fill",
    pdf: "doc.text.fill",
    image: "photo.fill",
    folder: "folder.fill",
    attachment: "paperclip",
  },

  // Status Icons
  status: {
    online: "circle.fill",
    offline: "circle",
    pending: "clock.fill",
    approved: "checkmark.circle.fill",
    rejected: "xmark.circle.fill",
  },

  // Analytics & Charts Icons
  analytics: {
    chart: "chart.bar.fill",
    trending_up: "chart.line.uptrend.xyaxis",
    trending_down: "chart.line.downtrend.xyaxis",
    pie_chart: "chart.pie.fill",
    stats: "chart.bar.xaxis",
  },
} as const;

/**
 * Flattened Icon Map
 * For easier access to all icons
 */
export const allIcons = {
  // Navigation
  home: iconMap.navigation.home,
  back: iconMap.navigation.back,
  forward: iconMap.navigation.forward,
  close: iconMap.navigation.close,
  menu: iconMap.navigation.menu,
  more: iconMap.navigation.more,
  up: iconMap.navigation.up,
  down: iconMap.navigation.down,

  // Actions
  add: iconMap.actions.add,
  edit: iconMap.actions.edit,
  delete: iconMap.actions.delete,
  save: iconMap.actions.save,
  cancel: iconMap.actions.cancel,
  search: iconMap.actions.search,
  filter: iconMap.actions.filter,
  sort: iconMap.actions.sort,
  refresh: iconMap.actions.refresh,
  share: iconMap.actions.share,
  download: iconMap.actions.download,
  upload: iconMap.actions.upload,
  copy: iconMap.actions.copy,
  settings: iconMap.actions.settings,

  // Content
  info: iconMap.content.info,
  warning: iconMap.content.warning,
  error: iconMap.content.error,
  success: iconMap.content.success,
  help: iconMap.content.help,
  notification: iconMap.content.notification,
  message: iconMap.content.message,
  email: iconMap.content.email,
  calendar: iconMap.content.calendar,
  clock: iconMap.content.clock,
  location: iconMap.content.location,
  map: iconMap.content.map,

  // Vehicle
  car: iconMap.vehicle.car,
  truck: iconMap.vehicle.truck,
  motorcycle: iconMap.vehicle.motorcycle,
  speedometer: iconMap.vehicle.speedometer,
  fuel: iconMap.vehicle.fuel,
  service: iconMap.vehicle.service,
  maintenance: iconMap.vehicle.maintenance,
  log: iconMap.vehicle.log,
  receipt: iconMap.vehicle.receipt,
  camera: iconMap.vehicle.camera,
  photo: iconMap.vehicle.photo,

  // User
  profile: iconMap.user.profile,
  group: iconMap.user.group,
  logout: iconMap.user.logout,
  login: iconMap.user.login,

  // File
  document: iconMap.file.document,
  pdf: iconMap.file.pdf,
  image: iconMap.file.image,
  folder: iconMap.file.folder,
  attachment: iconMap.file.attachment,

  // Status
  online: iconMap.status.online,
  offline: iconMap.status.offline,
  pending: iconMap.status.pending,
  approved: iconMap.status.approved,
  rejected: iconMap.status.rejected,

  // Analytics
  chart: iconMap.analytics.chart,
  trending_up: iconMap.analytics.trending_up,
  trending_down: iconMap.analytics.trending_down,
  pie_chart: iconMap.analytics.pie_chart,
  stats: iconMap.analytics.stats,
} as const;

/**
 * Icon Helper Functions
 */

/**
 * Get icon size by semantic name
 */
export function getIconSize(size: keyof typeof iconSizes): number {
  return iconSizes[size];
}

/**
 * Get icon name by category and key
 */
export function getIcon(
  category: keyof typeof iconMap,
  key: string,
): SFSymbols6_0 | undefined {
  const categoryIcons = iconMap[category];
  if (categoryIcons && key in categoryIcons) {
    return (categoryIcons as any)[key];
  }
  return undefined;
}

/**
 * Type Exports
 */
export type IconSize = keyof typeof iconSizes;
export type IconCategory = keyof typeof iconMap;
export type IconName = keyof typeof allIcons;

/**
 * Icon Props Interface
 * Standard props for icon components
 */
export interface IconProps {
  name: SFSymbols6_0 | IconName;
  size?: IconSize | number;
  color?: string;
  style?: any;
}
