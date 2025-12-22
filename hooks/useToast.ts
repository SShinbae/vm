import Toast from "react-native-toast-message";

interface ToastOptions {
  message?: string;
  duration?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const DEFAULT_DURATION = 4000;

export function useToast() {
  const showSuccess = (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "success",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
    });
  };

  const showError = (title: string, options?: ToastOptions) => {
    console.log("[Toast] showError called with:", title);
    Toast.show({
      type: "error",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
      props: {
        onRetry: options?.onRetry,
      },
    });
  };

  const showWarning = (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "warning",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
    });
  };

  const showInfo = (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "info",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
    });
  };

  const hideToast = () => {
    Toast.hide();
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };
}

// Static methods for use outside of React components
export const toast = {
  success: (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "success",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
    });
  },
  error: (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "error",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
      props: {
        onRetry: options?.onRetry,
      },
    });
  },
  warning: (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "warning",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
    });
  },
  info: (title: string, options?: ToastOptions) => {
    Toast.show({
      type: "info",
      text1: title,
      text2: options?.message,
      visibilityTime: options?.duration ?? DEFAULT_DURATION,
      onHide: options?.onDismiss,
    });
  },
  hide: () => {
    Toast.hide();
  },
};
