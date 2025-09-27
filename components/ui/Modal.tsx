import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from './icon-symbol';
import { Button } from './Button';

// Import createPortal for web platform
let createPortal: any = null;
if (Platform.OS === 'web') {
  try {
    const ReactDOM = require('react-dom');
    createPortal = ReactDOM.createPortal;
  } catch (e) {
    // Fallback if react-dom is not available
  }
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'fullscreen' | 'bottom-sheet';
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

// Web-specific Modal Component
function WebModal({
  visible,
  onClose,
  title,
  children,
  variant = 'default',
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  containerStyle,
  contentStyle,
  titleStyle,
}: ModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (visible) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }

      return () => {
        document.body.classList.remove('modal-open');
      };
    }
  }, [visible]);

  const getContentStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.background,
      borderColor: colors.icon + '20',
      borderRadius: 12,
      borderWidth: 1,
      overflow: 'hidden',
      minWidth: 280,
      maxWidth: '100%',
      position: 'relative',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    };

    if (variant === 'fullscreen') {
      Object.assign(baseStyle, {
        width: '100%',
        height: '100%',
        borderRadius: 0,
        borderWidth: 0,
      });
    } else if (variant === 'bottom-sheet') {
      Object.assign(baseStyle, {
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        maxHeight: '90vh',
      });
    } else {
      // Default modal sizing
      switch (size) {
        case 'small':
          Object.assign(baseStyle, { maxWidth: '80vw', maxHeight: '40vh' });
          break;
        case 'large':
          Object.assign(baseStyle, { maxWidth: '95vw', maxHeight: '80vh' });
          break;
        default:
          Object.assign(baseStyle, { maxWidth: '90vw', maxHeight: '60vh' });
      }
    }

    if (contentStyle) {
      Object.assign(baseStyle, contentStyle);
    }

    return baseStyle;
  };

  const getTitleStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    };

    if (titleStyle) {
      Object.assign(baseStyle, titleStyle);
    }

    return baseStyle;
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  if (!visible) return null;

  const modalContent = (
    <div
      className={`web-modal-overlay ${variant === 'bottom-sheet' ? 'bottom-sheet' : ''}`}
      style={{
        padding: variant === 'fullscreen' ? 0 : 20,
        ...containerStyle,
      }}
    >
      {/* Backdrop */}
      <div
        className="web-modal-backdrop"
        onClick={handleBackdropPress}
      />

      {/* Modal Content */}
      <div
        className={`web-modal-content ${variant === 'bottom-sheet' ? 'bottom-sheet' : ''}`}
      >
        <View style={getContentStyle()}>
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && <Text style={getTitleStyle()}>{title}</Text>}
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <IconSymbol name="xmark" size={20} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.body}>{children}</View>
        </View>
      </div>
    </div>
  );

  // Use portal if available, otherwise render normally
  if (createPortal && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

export function Modal(props: ModalProps) {
  // Use web-specific modal for web platform
  if (Platform.OS === 'web') {
    return <WebModal {...props} />;
  }

  // Use React Native modal for mobile platforms
  const {
    visible,
    onClose,
    title,
    children,
    variant = 'default',
    size = 'medium',
    showCloseButton = true,
    closeOnBackdrop = true,
    animationType = 'slide',
    presentationStyle = 'overFullScreen',
    containerStyle,
    contentStyle,
    titleStyle,
  } = props;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle = [styles.container];

    if (variant === 'fullscreen') {
      baseStyle.push(styles.fullscreenContainer);
    } else if (variant === 'bottom-sheet') {
      baseStyle.push(styles.bottomSheetContainer);
    }

    if (containerStyle) {
      baseStyle.push(containerStyle);
    }

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle[] => {
    const baseStyle = [
      styles.content,
      {
        backgroundColor: colors.background,
        borderColor: colors.icon + '20',
      },
    ];

    if (variant === 'fullscreen') {
      baseStyle.push(styles.fullscreenContent);
    } else if (variant === 'bottom-sheet') {
      baseStyle.push(styles.bottomSheetContent);
    } else {
      // Default modal sizing
      switch (size) {
        case 'small':
          baseStyle.push({ maxWidth: screenWidth * 0.8, maxHeight: screenHeight * 0.4 });
          break;
        case 'large':
          baseStyle.push({ maxWidth: screenWidth * 0.95, maxHeight: screenHeight * 0.8 });
          break;
        default:
          baseStyle.push({ maxWidth: screenWidth * 0.9, maxHeight: screenHeight * 0.6 });
      }
    }

    if (contentStyle) {
      baseStyle.push(contentStyle);
    }

    return baseStyle;
  };

  const getTitleStyle = (): TextStyle[] => {
    const baseStyle = [styles.title, { color: colors.text }];

    if (titleStyle) {
      baseStyle.push(titleStyle);
    }

    return baseStyle;
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const ModalContent = () => (
    <View style={getContainerStyle()}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={getContentStyle()}>
        {(title || showCloseButton) && (
          <View style={styles.header}>
            {title && <Text style={getTitleStyle()}>{title}</Text>}
            {showCloseButton && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <IconSymbol name="xmark" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );

  if (variant === 'fullscreen') {
    return (
      <RNModal
        visible={visible}
        animationType={animationType}
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={[styles.fullscreenWrapper, { backgroundColor: colors.background }]}>
          <View style={styles.fullscreenHeader}>
            {title && <Text style={getTitleStyle()}>{title}</Text>}
            {showCloseButton && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.fullscreenBody}>{children}</View>
        </SafeAreaView>
      </RNModal>
    );
  }

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <ModalContent />
    </RNModal>
  );
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={title} size="small" closeOnBackdrop={!loading}>
      <View style={styles.confirmContent}>
        <Text style={[styles.confirmMessage, { color: colors.text }]}>{message}</Text>

        <View style={styles.confirmButtons}>
          <Button
            title={cancelText}
            onPress={onClose}
            variant="outline"
            style={styles.confirmButton}
            disabled={loading}
          />
          <Button
            title={confirmText}
            onPress={handleConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            style={styles.confirmButton}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>
    </Modal>
  );
}

export function AlertModal({
  visible,
  onClose,
  title,
  message,
  buttonText = 'OK',
  variant = 'info',
}: AlertModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIconName = () => {
    switch (variant) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'error':
        return 'xmark.circle.fill';
      default:
        return 'info.circle.fill';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#ff4444';
      default:
        return colors.tint;
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={title} size="small">
      <View style={styles.alertContent}>
        <View style={styles.alertIcon}>
          <IconSymbol name={getIconName()} size={48} color={getIconColor()} />
        </View>

        <Text style={[styles.alertMessage, { color: colors.text }]}>{message}</Text>

        <Button
          title={buttonText}
          onPress={onClose}
          variant="primary"
          style={styles.alertButton}
          fullWidth
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenContainer: {
    padding: 0,
  },
  bottomSheetContainer: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 280,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  fullscreenContent: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  bottomSheetContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: screenHeight * 0.9,
  },
  fullscreenWrapper: {
    flex: 1,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  fullscreenBody: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  body: {
    padding: 20,
  },
  confirmContent: {
    alignItems: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
  },
  alertContent: {
    alignItems: 'center',
  },
  alertIcon: {
    marginBottom: 16,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButton: {
    minWidth: 120,
  },
});