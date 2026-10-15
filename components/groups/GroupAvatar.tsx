import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { profileInitials } from "@/lib/utils/profileInitials";
import { storageImageUrl } from "@/lib/utils/storagePath";
import { withOpacity } from "@/src/design-system";

export function GroupAvatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const { theme } = useStyles();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [avatarUrl]);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: withOpacity(theme.colors.primary, 0.12),
      }}
    >
      <Text
        style={{
          color: theme.colors.primary,
          fontWeight: "600",
          fontSize: size < 36 ? 10 : 14,
        }}
      >
        {profileInitials(name)}
      </Text>
      {avatarUrl && !failed && (
        <Image
          source={{ uri: storageImageUrl("profile-avatars", avatarUrl) }}
          style={{ position: "absolute", width: size, height: size }}
          contentFit="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`${name}'s avatar`}
        />
      )}
    </View>
  );
}
