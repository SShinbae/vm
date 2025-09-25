import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Modal } from '@/components/ui/Modal';

export default function ProfileScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [username, setUsername] = useState(user?.profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';

  // Update avatar state when user profile changes
  useEffect(() => {
    setAvatarUrl(user?.profile?.avatar_url || null);
  }, [user?.profile?.avatar_url]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      username: username.trim() || null
    });
    setLoading(false);

    if (error) {
      Alert.alert('Update Failed', error);
    } else {
      if (isWeb) {
        setIsEditing(false);
      } else {
        setShowEditModal(false);
      }
      Alert.alert('Success', 'Profile updated successfully');
    }
  };

  const handleAvatarUpload = (imageUrl: string) => {
    setAvatarUrl(imageUrl);
    // Avatar is automatically saved to the database by ImageUpload component
  };

  const handleAvatarError = (error: string) => {
    Alert.alert('Avatar Upload Error', error);
  };

  const handleEditPress = () => {
    if (isWeb) {
      setIsEditing(true);
    } else {
      setShowEditModal(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFullName(user?.profile?.full_name || '');
    setUsername(user?.profile?.username || '');
    setAvatarUrl(user?.profile?.avatar_url || null);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface || colors.background,
      margin: 16,
      borderRadius: 16,
      shadowColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: colorScheme === 'dark' ? 0.05 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },
    headerBackground: {
      height: 120,
      backgroundColor: colors.tint,
      position: 'relative',
      overflow: 'hidden',
    },
    circlePattern: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    logoutButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 10,
      zIndex: 1000,
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.3)',
    },
    circle: {
      position: 'absolute',
      borderRadius: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    circle1: {
      width: 80,
      height: 80,
      top: -20,
      left: 50,
    },
    circle2: {
      width: 120,
      height: 120,
      top: -30,
      right: -20,
    },
    circle3: {
      width: 60,
      height: 60,
      bottom: -10,
      left: 30,
    },
    avatarContainer: {
      alignItems: 'center',
      marginTop: -40,
      marginBottom: 16,
    },
    profileAvatarUpload: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      borderColor: 'white',
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: 'white',
    },
    profileInfo: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    username: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    joinDate: {
      fontSize: 14,
      color: colors.icon,
    },
    actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      justifyContent: 'space-between',
    },
    editButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      flex: 1,
      marginRight: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    editButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      flex: 1,
      marginHorizontal: 4,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 14,
    },
    saveButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      marginLeft: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },
    informationSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.icon,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      flex: 2,
      textAlign: 'right',
    },
    input: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      flex: 2,
      textAlign: 'right',
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.tint,
    },
    themeOptions: {
      flex: 2,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    themeOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    themeOptionActive: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    themeOptionText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    themeOptionTextActive: {
      color: 'white',
    },
    avatarUpload: {
      marginTop: -40,
      marginBottom: 16,
    },
    avatarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modal styles
    modalContent: {
      // No additional styling needed as Modal component handles the container
    },
    modalAvatarContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    modalAvatarUpload: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    modalAvatarText: {
      fontSize: 14,
      color: colors.icon || colors.text,
      marginTop: 8,
      textAlign: 'center',
    },
    modalForm: {
      marginBottom: 24,
    },
    modalField: {
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    modalEmailText: {
      fontSize: 16,
      color: colors.text,
      paddingVertical: 12,
    },
    modalEmailSubtext: {
      fontSize: 12,
      color: colors.icon || colors.text,
      marginTop: 4,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    modalCancelButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    modalSaveButton: {
      flex: 1,
      backgroundColor: colors.tint,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    modalSaveButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  if (!user) return null;

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Header Background */}
          <View style={styles.headerBackground}>
            <View style={styles.circlePattern}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
            </View>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <IconSymbol name="arrow.right.square.fill" size={18} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <ImageUpload
              type="avatar"
              currentImageUrl={avatarUrl}
              onUploadComplete={handleAvatarUpload}
              onUploadError={handleAvatarError}
              style={styles.profileAvatarUpload}
            />
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {user.profile?.full_name || 'Name not provided'}
            </Text>
            <Text style={styles.username}>
              @{user.profile?.username || 'username'}
            </Text>
            <View style={styles.locationRow}>
              <Text style={styles.joinDate}>
                Joined {formatJoinDate(user.profile?.created_at || '')}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isWeb && isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={loading}
                >
                  <IconSymbol name="xmark" size={16} color={colors.text} />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <IconSymbol name="checkmark" size={16} color="white" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditPress}
              >
                <IconSymbol name="pencil" size={16} color="white" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Information Section */}
          <View style={styles.informationSection}>
            <Text style={styles.sectionTitle}>Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username</Text>
              {isWeb && isEditing ? (
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={colors.icon}
                />
              ) : (
                <Text style={styles.infoValue}>
                  @{user.profile?.username || 'Not set'}
                </Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isWeb && isEditing ? (
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholderTextColor={colors.icon}
                />
              ) : (
                <Text style={styles.infoValue}>
                  {user.profile?.full_name || 'Not provided'}
                </Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {formatJoinDate(user.profile?.created_at || '')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Theme</Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'system' && styles.themeOptionActive,
                  ]}
                  onPress={() => setThemeMode('system')}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      themeMode === 'system' && styles.themeOptionTextActive,
                    ]}
                  >
                    System
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'light' && styles.themeOptionActive,
                  ]}
                  onPress={() => setThemeMode('light')}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      themeMode === 'light' && styles.themeOptionTextActive,
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'dark' && styles.themeOptionActive,
                  ]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      themeMode === 'dark' && styles.themeOptionTextActive,
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Edit Profile Modal - Only show on mobile */}
      {!isWeb && (
        <Modal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFullName(user.profile?.full_name || '');
          setUsername(user.profile?.username || '');
          setAvatarUrl(user.profile?.avatar_url || null);
        }}
        title="Edit Profile"
        size="medium"
        closeOnBackdrop={!loading}
      >
        <View style={styles.modalContent}>
          {/* Avatar Upload */}
          <View style={styles.modalAvatarContainer}>
            <ImageUpload
              type="avatar"
              currentImageUrl={avatarUrl}
              onUploadComplete={handleAvatarUpload}
              onUploadError={handleAvatarError}
              style={styles.modalAvatarUpload}
            />
            <Text style={styles.modalAvatarText}>Tap to change profile picture</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.modalForm}>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoCorrect={false}
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Username</Text>
              <TextInput
                style={styles.modalInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Email</Text>
              <Text style={styles.modalEmailText}>{user.email}</Text>
              <Text style={styles.modalEmailSubtext}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowEditModal(false);
                setFullName(user.profile?.full_name || '');
                setUsername(user.profile?.username || '');
                setAvatarUrl(user.profile?.avatar_url || null);
              }}
              disabled={loading}
            >
              <IconSymbol name="xmark" size={16} color={colors.text} />
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <IconSymbol name="checkmark" size={16} color="white" />
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      )}
    </SafeAreaView>
  );
}