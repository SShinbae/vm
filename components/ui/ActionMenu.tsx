import { baseColors, withOpacity } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useStyles } from "react-native-unistyles";

export interface ActionMenuItem {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  disabled?: boolean;
  vertical?: boolean;
  label?: string;
}

export function ActionMenu({
  items,
  disabled = false,
  vertical = false,
  label,
}: ActionMenuProps) {
  const { theme } = useStyles();
  const { width: windowWidth } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, width: 160 });

  const handleOpen = (event: any) => {
    if (disabled) return;

    // Stop event from bubbling to parent TouchableOpacity
    event.stopPropagation();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Get the position of the button for positioning the menu
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ x, y: y + height, width });
      setVisible(true);
    });
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleItemPress = (item: ActionMenuItem) => {
    if (item.disabled) return;

    handleClose();
    // Small delay to ensure modal closes before action executes
    setTimeout(() => {
      item.onPress();
    }, 100);
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={label || "More actions"}
        onPress={handleOpen}
        disabled={disabled}
        style={{
          padding: theme.spacing.sm,
          opacity: disabled ? 0.5 : 1,
          ...(label && {
            minHeight: 44,
            paddingHorizontal: theme.spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
            backgroundColor: theme.colors.surface,
          }),
        }}
      >
        {label && (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
            }}
          >
            {label}
          </Text>
        )}
        <View
          style={vertical ? { transform: [{ rotate: "90deg" }] } : undefined}
        >
          <IconSymbol
            name={label ? "chevron.down" : "ellipsis"}
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: withOpacity(baseColors.black, 0.5),
          }}
          onPress={handleClose}
        >
          <View
            style={{
              position: "absolute",
              right: theme.spacing.xl,
              top: menuPosition.y + (label ? theme.spacing.xs : 0),
              ...(label && {
                right: undefined,
                left: Math.max(
                  theme.spacing.xl,
                  Math.min(
                    menuPosition.x,
                    windowWidth -
                      theme.spacing.xl -
                      Math.max(160, menuPosition.width),
                  ),
                ),
                width: Math.max(160, menuPosition.width),
              }),
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              minWidth: 160,
              // Keep long labels on screen; they wrap instead.
              maxWidth: windowWidth - 2 * theme.spacing.xl,
              shadowColor: theme.colors.black,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
              overflow: "hidden",
            }}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleItemPress(item)}
                disabled={item.disabled}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.md,
                  gap: theme.spacing.md,
                  backgroundColor: theme.colors.surface,
                  opacity: item.disabled ? 0.5 : 1,
                  ...(index > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }),
                }}
              >
                <IconSymbol
                  name={item.icon as any}
                  size={18}
                  color={
                    item.variant === "danger"
                      ? theme.colors.error
                      : theme.colors.text
                  }
                />
                <Text
                  style={{
                    flexShrink: 1,
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.fontWeight.medium,
                    color:
                      item.variant === "danger"
                        ? theme.colors.error
                        : theme.colors.text,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
