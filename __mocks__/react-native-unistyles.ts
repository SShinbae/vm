// Mock react-native-unistyles for Jest tests
export const useStyles = (stylesheet?: any) => {
  const styles = stylesheet ? stylesheet.create({}) : {};
  const theme = {
    colors: {
      primary: "#007AFF",
      background: "#FFFFFF",
      card: "#F8F8F8",
      text: "#000000",
      border: "#E0E0E0",
      notification: "#FF3B30",
      error: "#FF3B30",
      success: "#34C759",
      warning: "#FF9500",
      info: "#007AFF",
      textSecondary: "#666666",
      cardBackground: "#FFFFFF",
      divider: "#E0E0E0",
      errorText: "#FFFFFF",
      successText: "#FFFFFF",
      warningText: "#FFFFFF",
      infoText: "#FFFFFF",
    },
  };

  return { styles, theme };
};

export const UnistylesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => children;

export const createStyleSheet = (styles: any) => ({
  create: () => styles,
});
