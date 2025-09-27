import React from 'react';
import { AlertModal, ConfirmModal } from './Modal';
import { useWebAlert, WebAlertState, WebConfirmState } from '@/hooks/use-web-alert';

interface WebAlertProviderProps {
  children: React.ReactNode;
  alertState: WebAlertState;
  confirmState: WebConfirmState;
  hideAlert: () => void;
  hideConfirm: () => void;
}

export function WebAlertProvider({
  children,
  alertState,
  confirmState,
  hideAlert,
  hideConfirm,
}: WebAlertProviderProps) {
  return (
    <>
      {children}

      {/* Simple Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        onClose={alertState.onClose}
        title={alertState.title}
        message={alertState.message}
        buttonText={alertState.buttonText}
        variant={alertState.variant}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmState.visible}
        onClose={confirmState.onClose}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        loading={confirmState.loading}
      />
    </>
  );
}

// Hook to use within components that need to show alerts
export function useAlert() {
  const webAlert = useWebAlert();

  return {
    alert: webAlert.alert,
    showSuccess: webAlert.showSuccess,
    showError: webAlert.showError,
    showConfirm: webAlert.showConfirm,
    hideConfirm: webAlert.hideConfirm, // Expose this for manual control after async operations
  };
}

// Component wrapper that provides alert functionality
export function withWebAlert<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const webAlert = useWebAlert();

    return (
      <WebAlertProvider
        alertState={webAlert.alertState}
        confirmState={webAlert.confirmState}
        hideAlert={webAlert.hideAlert}
        hideConfirm={webAlert.hideConfirm}
      >
        <Component {...props} />
      </WebAlertProvider>
    );
  };
}