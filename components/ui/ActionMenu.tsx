import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
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
}

export function ActionMenu({ items, disabled = false }: ActionMenuProps) {
  const { theme } = useStyles();
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleOpen = (event: any) => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Get the position of the button for positioning the menu
    event.target.measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => {
        setMenuPosition({ x: pageX, y: pageY + height });
        setVisible(true);
      },
    );
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
        onPress={handleOpen}
        disabled={disabled}
        style={{
          padding: theme.spacing.sm,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <IconSymbol
          name="ellipsis"
          size={20}
          color={theme.colors.textSecondary}
        />
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onPress={handleClose}
        >
          <View
            style={{
              position: "absolute",
              right: theme.spacing.xl,
              top: menuPosition.y,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              minWidth: 160,
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
