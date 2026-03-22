// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Tab Icons
  "house.fill": "home",
  "car.fill": "directions-car",
  "doc.text.fill": "description",
  "person.3.fill": "group",
  "person.fill": "person",

  // Navigation & Action Icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  plus: "add",
  checkmark: "check",
  xmark: "close",
  trash: "delete",

  // Content Icons
  "info.circle": "info",
  envelope: "email",
  "envelope.fill": "email",
  "circle.fill": "circle",
  calendar: "event",
  number: "tag",
  barcode: "qr-code",
  "exclamationmark.triangle": "warning",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "info.circle.fill": "info",

  // Vehicle Detail Icons
  speedometer: "speed",
  "fuelpump.fill": "local-gas-station",
  "wrench.and.screwdriver.fill": "build",
  "list.bullet.clipboard.fill": "assignment",

  // Additional common icons
  pencil: "edit",
  fuelpump: "local-gas-station",
  wrench: "build",
  "chart.line.uptrend.xyaxis": "trending-up",

  // Financial & Action Icons
  "dollarsign.circle.fill": "attach-money",
  "plus.circle.fill": "add-circle",
  "plus.circle": "add-circle-outline",
  "minus.circle.fill": "remove-circle",
  "minus.circle": "remove-circle-outline",
  "wrench.fill": "build",

  // Trend Icons
  minus: "remove",
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",

  // Logout Icons
  "arrow.right.square.fill": "logout",
  "arrow.right.square": "logout",

  // Menu Icons
  ellipsis: "more-vert",

  // Profile Quick Action Icons
  "person.2": "people",
  "person.2.fill": "people",
  "lock.shield": "security",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
