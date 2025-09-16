import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { GroupService, GroupInvitationService } from '@/lib/services/groupService';
import { GroupWithMembers, GroupInvitationWithDetails } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/contexts/AuthContext';
import { SkeletonHeader, SkeletonStats, SkeletonList } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type TabType = 'members' | 'invitations';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [invitations, setInvitations] = useState<GroupInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchGroupData = useCallback(async () => {
    if (!id) return;

    const [groupResult, invitationsResult] = await Promise.all([
      GroupService.getGroupById(id),
      GroupInvitationService.getInvitations(id),
    ]);

    if (groupResult.error) {
      Alert.alert('Error', 'Failed to load group details');
      router.back();
    } else if (groupResult.data) {
      setGroup(groupResult.data);
    }

    if (invitationsResult.data) {
      setInvitations(invitationsResult.data);
    }

    setLoading(false);
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  }, [fetchGroupData]);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await GroupService.removeMember(group.id, memberId);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await fetchGroupData();
              Alert.alert('Success', 'Member removed successfully');
            }
          },
        },
      ]
    );
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    Alert.alert(
      'Cancel Invitation',
      `Are you sure you want to cancel the invitation to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Invitation',
          style: 'destructive',
          onPress: async () => {
            const { error } = await GroupInvitationService.cancelInvitation(invitationId);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await fetchGroupData();
              Alert.alert('Success', 'Invitation cancelled');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const TabButton = ({ type, label, count }: { type: TabType; label: string; count?: number }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === type && { backgroundColor: colors.tint, borderColor: colors.tint },
      ]}
      onPress={() => setActiveTab(type)}
    >
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === type ? 'white' : colors.text },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.badge, { backgroundColor: activeTab === type ? 'white' : colors.tint }]}>
          <Text style={[styles.badgeText, { color: activeTab === type ? colors.tint : 'white' }]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const MemberCard = ({ member }: { member: any }) => {
    const isOwner = member.user_id === group?.owner_id;
    const isCurrentUser = member.user_id === user?.id;

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberIcon}>
            <IconSymbol name="person.fill" size={20} color="white" />
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberTitleRow}>
              <Text style={styles.memberName}>
                {member.profiles?.full_name || member.profiles?.email}
                {isCurrentUser && ' (You)'}
              </Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Owner</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberEmail}>{member.profiles?.email}</Text>
            <Text style={styles.joinedDate}>
              Joined {new Date(member.joined_at).toLocaleDateString()}
            </Text>
          </View>
          {!isOwner && !isCurrentUser && group?.owner_id === user?.id && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMember(member.user_id, member.profiles?.full_name || member.profiles?.email)}
            >
              <IconSymbol name="trash" size={16} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const InvitationCard = ({ invitation }: { invitation: GroupInvitationWithDetails }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.invitationIcon}>
          <IconSymbol name="envelope.fill" size={18} color={colors.tint} />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={styles.invitationEmail}>{invitation.email}</Text>
          <Text style={styles.invitationStatus}>
            Status: {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
          </Text>
          <Text style={styles.invitationDate}>
            Sent {new Date(invitation.created_at).toLocaleDateString()}
          </Text>
        </View>
        {invitation.status === 'pending' && group?.owner_id === user?.id && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelInvitation(invitation.id, invitation.email)}
          >
            <IconSymbol name="xmark" size={16} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    groupInfo: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    groupDescription: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 12,
    },
    groupStats: {
      flexDirection: 'row',
      gap: 24,
    },
    stat: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.tint,
    },
    statLabel: {
      fontSize: 12,
      color: colors.icon,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      backgroundColor: colors.background,
      gap: 8,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    memberCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    memberHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    memberIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberInfo: {
      flex: 1,
    },
    memberTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    ownerBadge: {
      backgroundColor: colors.tint + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    ownerBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.tint,
      textTransform: 'uppercase',
    },
    memberEmail: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    joinedDate: {
      fontSize: 12,
      color: colors.icon,
    },
    removeButton: {
      padding: 8,
    },
    invitationCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.icon + '20',
    },
    invitationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    invitationIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    invitationInfo: {
      flex: 1,
    },
    invitationEmail: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    invitationStatus: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    invitationDate: {
      fontSize: 12,
      color: colors.icon,
    },
    cancelButton: {
      padding: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.icon + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.icon,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonHeader showBackButton showActions={false} />

        <View style={styles.groupInfo}>
          <SkeletonStats count={2} />
        </View>

        <View style={styles.tabs}>
          <View style={[styles.tabButton, { backgroundColor: colors.tint }]}>
            <Text style={[styles.tabButtonText, { color: 'white' }]}>Members</Text>
          </View>
          <View style={[styles.tabButton, { backgroundColor: colors.background }]}>
            <Text style={[styles.tabButtonText, { color: colors.text }]}>Invitations</Text>
          </View>
        </View>

        <SkeletonList itemCount={3} showAvatar lines={3} />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Group Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = group.owner_id === user?.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {group.name}
        </Text>
        {isOwner && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/groups/${group.id}/invite` as any)}
            >
              <IconSymbol name="plus" size={12} color="white" />
              <Text style={styles.headerButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {group.description && (
        <View style={styles.groupInfo}>
          <Text style={styles.groupDescription}>{group.description}</Text>
          <View style={styles.groupStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{group.member_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{invitations.filter(i => i.status === 'pending').length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TabButton type="members" label="Members" count={group.member_count} />
        {isOwner && (
          <TabButton type="invitations" label="Invitations" count={invitations.length} />
        )}
      </View>

      {activeTab === 'members' ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {group.group_members?.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </ScrollView>
      ) : (
        invitations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <IconSymbol name="envelope" size={24} color={colors.icon} />
            </View>
            <Text style={styles.emptyTitle}>No invitations</Text>
            <Text style={styles.emptyDescription}>
              Send invitations to add new members to this group
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {invitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}