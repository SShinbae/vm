import React, { createContext, useContext } from "react";
import { WebAlertProvider } from "@/components/ui/WebAlertProvider";
import { useWebAlert, AlertButton, AlertOptions } from "@/hooks/use-web-alert";

interface DialogContextValue {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => void;
  showSuccess: (title: string, message?: string, onPress?: () => void) => void;
  showError: (title: string, message?: string, onPress?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    destructive?: boolean,
  ) => void;
  hideConfirm: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const webAlert = useWebAlert();

  return (
    <DialogContext.Provider
      value={{
        alert: webAlert.alert,
        showSuccess: webAlert.showSuccess,
        showError: webAlert.showError,
        showConfirm: webAlert.showConfirm,
        hideConfirm: webAlert.hideConfirm,
      }}
    >
      <WebAlertProvider
        alertState={webAlert.alertState}
        confirmState={webAlert.confirmState}
        hideAlert={webAlert.hideAlert}
        hideConfirm={webAlert.hideConfirm}
      >
        {children}
      </WebAlertProvider>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
