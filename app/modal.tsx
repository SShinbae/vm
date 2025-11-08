import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useStyles } from 'react-native-unistyles';

export default function ModalScreen() {
  const { theme } = useStyles();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSize['2xl'],
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          marginBottom: theme.spacing.lg,
        }}
      >
        This is a modal
      </Text>
      <Link href="/" dismissTo style={{ marginTop: theme.spacing.md }}>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            color: theme.colors.primary,
            textDecorationLine: 'underline',
          }}
        >
          Go to home screen
        </Text>
      </Link>
    </View>
  );
}
