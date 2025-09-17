import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { GroupService, GroupInvitationService } from '@/lib/services/groupService';
import { GroupWithMembers, GroupInvitationWithDetails } from '@/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/lib/contexts/AuthContext';
import { formatDate } from '@/lib/utils/dateUtils';
import { WebLayout } from '@/components/layout/WebLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';

type TabType = 'groups' | 'invitations';

export default function GroupsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const layout = useResponsiveLayout();

  const fetchData = useCallback(async () => {
    const [groupsResult, invitationsResult] = await Promise.all([
      GroupService.getGroups(),
      GroupInvitationService.getUserInvitations(),
    ]);

    if (groupsResult.data) setGroups(groupsResult.data);
    if (invitationsResult.data) setInvitations(invitationsResult.data);

    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleLeaveGroup = async (group: GroupWithMembers) => {
    if (group.owner_id === user?.id) {
      Alert.alert(
        'Cannot Leave Group',
        'You are the owner of this group. Transfer ownership to another member or delete the group.'
      );
      return;
    }

    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const { error } = await GroupService.leaveGroup(group.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await fetchData();
              Alert.alert('Success', 'You have left the group');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async (group: GroupWithMembers) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await GroupService.deleteGroup(group.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await fetchData();
              Alert.alert('Success', 'Group deleted successfully');
            }
          },
        },
      ]
    );
  };

  const handleAcceptInvitation = async (invitation: GroupInvitationWithDetails) => {
    const { data, error } = await GroupInvitationService.acceptInvitation(invitation.id);
    if (error) {
      Alert.alert('Error', error);
    } else {
      await fetchData();
      Alert.alert('Success', `You have joined "${data?.groupName || invitation.groups?.name || 'the group'}"`);
    }
  };

  const handleDeclineInvitation = async (invitation: GroupInvitationWithDetails) => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to join "${invitation.groups?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const { error } = await GroupInvitationService.declineInvitation(invitation.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await fetchData();
              Alert.alert('Success', 'Invitation declined');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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

  const GroupCard = ({ group }: { group: GroupWithMembers }) => {
    const isOwner = group.owner_id === user?.id;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => router.push(`/groups/${group.id}` as any)}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <IconSymbol name="person.3.fill" size={24} color="white" />
          </View>
          <View style={styles.groupInfo}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupName}>{group.name}</Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Owner</Text>
                </View>
              )}
            </View>
            {group.description && (
              <Text style={styles.groupDescription} numberOfLines={2}>
                {group.description}
              </Text>
            )}
            <Text style={styles.memberCount}>
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            </Text>
          </View>
          <View style={styles.groupActions}>
            {isOwner ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteGroup(group)}
              >
                <IconSymbol name="trash" size={18} color="#ff4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLeaveGroup(group)}
              >
                <IconSymbol name="arrow.right.square" size={18} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const InvitationCard = ({ invitation }: { invitation: GroupInvitationWithDetails }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.invitationIcon}>
          <IconSymbol name="envelope.fill" size={20} color={colors.tint} />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={styles.invitationTitle}>
            Invitation to join "{invitation.groups?.name}"
          </Text>
          <Text style={styles.invitationSubtitle}>
            Invited by {invitation.profiles?.full_name || invitation.profiles?.email || 'Unknown'}
          </Text>
          <Text style={styles.invitationDate}>
            {formatDate(invitation.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.invitationActions}>
        <TouchableOpacity
          style={[styles.invitationButton, styles.declineButton]}
          onPress={() => handleDeclineInvitation(invitation)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.invitationButton, styles.acceptButton]}
          onPress={() => handleAcceptInvitation(invitation)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.icon + '20',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    addButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
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
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.icon + '30',
      backgroundColor: colors.background,
      gap: 8,
    },
    tabButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
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
      marginBottom: 20,
    },
    emptyButton: {
      backgroundColor: colors.tint,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    emptyButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    groupCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.icon + '20',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    groupIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    groupInfo: {
      flex: 1,
    },
    groupTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    groupName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    ownerBadge: {
      backgroundColor: colors.tint + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    ownerBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.tint,
      textTransform: 'uppercase',
    },
    groupDescription: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 8,
      lineHeight: 18,
    },
    memberCount: {
      fontSize: 12,
      color: colors.icon,
      fontWeight: '500',
    },
    groupActions: {
      marginLeft: 8,
    },
    actionButton: {
      padding: 8,
    },
    invitationCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.tint + '30',
    },
    invitationHeader: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    invitationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    invitationInfo: {
      flex: 1,
    },
    invitationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    invitationSubtitle: {
      fontSize: 14,
      color: colors.icon,
      marginBottom: 4,
    },
    invitationDate: {
      fontSize: 12,
      color: colors.icon,
    },
    invitationActions: {
      flexDirection: 'row',
      gap: 12,
    },
    invitationButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    acceptButton: {
      backgroundColor: colors.tint,
    },
    declineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.icon,
    },
    acceptButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    declineButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
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
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/groups/create' as any)}
        >
          <IconSymbol name="plus" size={16} color="white" />
          <Text style={styles.addButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TabButton type="groups" label="My Groups" count={groups.length} />
        <TabButton type="invitations" label="Invitations" count={invitations.length} />
      </View>

      {activeTab === 'groups' ? (
        groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <IconSymbol name="person.3" size={32} color={colors.icon} />
            </View>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyDescription}>
              Create a group to share your vehicle information with family or friends.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/groups/create' as any)}
            >
              <IconSymbol name="plus" size={16} color="white" />
              <Text style={styles.emptyButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {groups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </ScrollView>
        )
      ) : (
        invitations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <IconSymbol name="envelope" size={32} color={colors.icon} />
            </View>
            <Text style={styles.emptyTitle}>No invitations</Text>
            <Text style={styles.emptyDescription}>
              You'll see group invitations from other users here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {invitations.map(invitation => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}