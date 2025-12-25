import { ActivityItem } from "@/hooks/useDashboardData"; // Or from your types file
import { UnistylesTheme } from "react-native-unistyles";

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getActivityColor = (
  type: ActivityItem["type"],
  theme: UnistylesTheme,
): string => {
  switch (type) {
    case "fuel":
      return theme.colors.warning;
    case "service":
      return theme.colors.error;
    case "mileage":
      return theme.colors.primary;
    default:
      return theme.colors.primary;
  }
};
