import { Icon } from '@/lib/design-system/components/atoms/Icon';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from 'react-native-unistyles';
import { stylesheet } from './PageHeader.styles';
import { PageHeaderProps } from './PageHeader.types';

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions = [],
  bottom,
  backgroundColor,
  noBorder = false,
}) => {
  const { styles } = useStyles(stylesheet);
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        noBorder && styles.containerNoBorder,
        backgroundColor && { backgroundColor },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBack && (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="back" size={24} color="primary" />
            </Pressable>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                disabled={action.disabled}
                style={[
                  styles.actionButton,
                  action.disabled && styles.actionButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label || `Action ${index + 1}`}
                accessibilityState={{ disabled: action.disabled }}
              >
                <Icon
                  name={action.icon}
                  size={24}
                  color="primary"
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {bottom && <View style={styles.bottomContainer}>{bottom}</View>}
    </View>
  );
};
