import { useState, useCallback } from "react";
import { Alert, Platform } from "react-native";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export interface AlertOptions {
  cancelable?: boolean;
  userInterfaceStyle?: "light" | "dark";
}

export interface WebAlertState {
  visible: boolean;
  title: string;
  message: string;
  variant: "info" | "success" | "warning" | "error";
  buttonText: string;
  onClose: () => void;
}

export interface WebConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "danger";
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function useWebAlert() {
  const [alertState, setAlertState] = useState<WebAlertState>({
    visible: false,
    title: "",
    message: "",
    variant: "info",
    buttonText: "OK",
    onClose: () => {},
  });

  const [confirmState, setConfirmState] = useState<WebConfirmState>({
    visible: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
    loading: false,
    onConfirm: () => {},
    onClose: () => {},
  });

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, visible: false, loading: false }));
  }, []);

  const alert = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions,
    ) => {
      // On mobile platforms, use native Alert
      if (Platform.OS !== "web") {
        Alert.alert(title, message, buttons, options);
        return;
      }

      // On web platform, use our custom modals
      if (!buttons || buttons.length === 0 || buttons.length === 1) {
        // Simple alert with single button
        const button = buttons?.[0];
        const variant = getVariantFromTitle(title);

        setAlertState({
          visible: true,
          title,
          message: message || "",
          variant,
          buttonText: button?.text || "OK",
          onClose: () => {
            hideAlert();
            button?.onPress?.();
          },
        });
      } else if (buttons.length === 2) {
        // Confirmation dialog with two buttons
        const cancelButton =
          buttons.find((b) => b.style === "cancel") || buttons[0];
        const confirmButton =
          buttons.find((b) => b.style !== "cancel") || buttons[1];
        const isDestructive = confirmButton.style === "destructive";

        setConfirmState({
          visible: true,
          title,
          message: message || "",
          confirmText: confirmButton.text,
          cancelText: cancelButton.text,
          variant: isDestructive ? "danger" : "default",
          loading: false,
          onConfirm: () => {
            setConfirmState((prev) => ({ ...prev, loading: true }));
            confirmButton.onPress?.();
            // Note: The component calling this should call hideConfirm() after the action completes
          },
          onClose: () => {
            hideConfirm();
            cancelButton.onPress?.();
          },
        });
      } else {
        // Fallback for more than 2 buttons - use native alert
        Alert.alert(title, message, buttons, options);
      }
    },
    [hideAlert, hideConfirm],
  );

  // Helper function to determine alert variant from title
  const getVariantFromTitle = (
    title: string,
  ): "info" | "success" | "warning" | "error" => {
    const lowerTitle = title.toLowerCase();
    if (
      lowerTitle.includes("success") ||
      lowerTitle.includes("created") ||
      lowerTitle.includes("updated")
    ) {
      return "success";
    }
    if (
      lowerTitle.includes("error") ||
      lowerTitle.includes("failed") ||
      lowerTitle.includes("delete")
    ) {
      return "error";
    }
    if (lowerTitle.includes("warning") || lowerTitle.includes("caution")) {
      return "warning";
    }
    return "info";
  };

  // Convenience methods for common alert types
  const showSuccess = useCallback(
    (title: string, message?: string, onPress?: () => void) => {
      alert(title, message, [{ text: "OK", onPress }]);
    },
    [alert],
  );

  const showError = useCallback(
    (title: string, message?: string, onPress?: () => void) => {
      alert(title, message, [{ text: "OK", onPress }]);
    },
    [alert],
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = "Confirm",
      cancelText = "Cancel",
      destructive = false,
    ) => {
      alert(title, message, [
        { text: cancelText, style: "cancel", onPress: onCancel },
        {
          text: confirmText,
          style: destructive ? "destructive" : "default",
          onPress: onConfirm,
        },
      ]);
    },
    [alert],
  );

  return {
    alert,
    showSuccess,
    showError,
    showConfirm,
    alertState,
    confirmState,
    hideAlert,
    hideConfirm,
  };
}
