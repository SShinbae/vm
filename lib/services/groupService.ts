import { supabase } from '../../services/supabaseClient';
import {
    ApiResponse,
    Group,
    GroupInsert,
    GroupInvitation,
    GroupInvitationWithDetails,
    GroupUpdate,
    GroupWithMembers
} from '../../types';

export class GroupService {
  static async getGroups(): Promise<ApiResponse<GroupWithMembers[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get groups owned by user
      const { data: ownedGroups, error: ownedError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            *,
            profiles(id, email, full_name)
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (ownedError) {
        console.error('Error fetching owned groups:', ownedError);
        return { data: null, error: ownedError.message, loading: false };
      }

      // Get groups where user is a member (simpler approach)
      const { data: membershipData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching member groups:', memberError);
        // Don't return error, just continue with owned groups
      }

      // Get detailed group data for member groups
      let memberGroups = [];
      if (membershipData && membershipData.length > 0) {
        const memberGroupIds = membershipData.map(m => m.group_id);
        console.log('Fetching member group details for IDs:', memberGroupIds);

        const { data: memberGroupDetails, error: memberGroupDetailsError } = await supabase
          .from('groups')
          .select(`
            *,
            group_members(
              *,
              profiles(id, email, full_name)
            )
          `)
          .in('id', memberGroupIds)
          .order('created_at', { ascending: false });

        console.log('Member group details result:', {
          data: memberGroupDetails,
          error: memberGroupDetailsError,
          count: memberGroupDetails?.length || 0
        });

        if (memberGroupDetailsError) {
          console.error('Error fetching member group details:', memberGroupDetailsError);
        } else {
          memberGroups = memberGroupDetails || [];
        }
      }

      // Combine and deduplicate groups
      const allGroups = [...(ownedGroups || [])];

      memberGroups.forEach(group => {
        if (!allGroups.find(g => g.id === group.id)) {
          allGroups.push(group);
        }
      });

      // Sort by created_at descending
      allGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Transform data to include member count
      const groupsWithMembers = allGroups.map(group => ({
        ...group,
        member_count: group.group_members?.length || 0,
      }));

      console.log('Fetched groups debug:', {
        currentUserId: user.id,
        ownedGroups: ownedGroups?.length || 0,
        ownedGroupIds: ownedGroups?.map(g => g.id) || [],
        membershipCount: membershipData?.length || 0,
        memberGroupIds: membershipData?.map(m => m.group_id) || [],
        memberGroupDetails: memberGroups?.length || 0,
        memberGroupNames: memberGroups?.map(g => g.name) || [],
        totalGroups: groupsWithMembers.length,
        finalGroupIds: groupsWithMembers.map(g => g.id),
        finalGroupNames: groupsWithMembers.map(g => g.name)
      });

      return { data: groupsWithMembers, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching groups:', error);
      return { data: null, error: 'Failed to fetch groups', loading: false };
    }
  }

  static async getGroupById(id: string): Promise<ApiResponse<GroupWithMembers>> {
    try {
      // First get the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        return { data: null, error: groupError.message, loading: false };
      }

      // Get group members with profile data
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id);

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        return { data: null, error: membersError.message, loading: false };
      }

      // Get profile data for all members
      let membersWithProfiles = [];
      if (members && members.length > 0) {
        const memberUserIds = members.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', memberUserIds);

        if (profilesError) {
          console.error('Error fetching member profiles:', profilesError);
        } else {
          // Combine member data with profile data
          membersWithProfiles = members.map(member => ({
            ...member,
            profiles: profiles?.find(p => p.id === member.user_id) || null
          }));
        }
      }

      console.log('Group details fetched:', {
        groupId: group.id,
        groupName: group.name,
        membersCount: membersWithProfiles.length,
        memberDetails: membersWithProfiles.map(m => ({
          userId: m.user_id,
          name: m.profiles?.full_name,
          email: m.profiles?.email
        }))
      });

      const groupWithMembers = {
        ...group,
        group_members: membersWithProfiles,
        member_count: membersWithProfiles.length,
      };

      return { data: groupWithMembers, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching group:', error);
      return { data: null, error: 'Failed to fetch group', loading: false };
    }
  }

  static async createGroup(group: Omit<GroupInsert, 'owner_id'>): Promise<ApiResponse<Group>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      const { data, error } = await supabase
        .from('groups')
        .insert({
          ...group,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        return { data: null, error: error.message, loading: false };
      }

      // Automatically add the creator as a member
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
        });

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error creating group:', error);
      return { data: null, error: 'Failed to create group', loading: false };
    }
  }

  static async updateGroup(id: string, updates: GroupUpdate): Promise<ApiResponse<Group>> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating group:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error updating group:', error);
      return { data: null, error: 'Failed to update group', loading: false };
    }
  }

  static async deleteGroup(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting group:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error deleting group:', error);
      return { data: null, error: 'Failed to delete group', loading: false };
    }
  }

  static async leaveGroup(groupId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Check if user is the owner
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (groupError) {
        return { data: null, error: 'Group not found', loading: false };
      }

      if (group.owner_id === user.id) {
        return { data: null, error: 'Group owners cannot leave their own groups. Transfer ownership first or delete the group.', loading: false };
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving group:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error leaving group:', error);
      return { data: null, error: 'Failed to leave group', loading: false };
    }
  }

  static async removeMember(groupId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error removing member:', error);
      return { data: null, error: 'Failed to remove member', loading: false };
    }
  }
}

export class GroupInvitationService {
  static async sendInvitation(groupId: string, email: string): Promise<ApiResponse<GroupInvitation>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Check if user is the owner or a member (allow both to send invitations)
      const { data: group } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (!group) {
        return { data: null, error: 'Group not found', loading: false };
      }

      // Allow group owners to send invitations without being a member
      const isOwner = group.owner_id === user.id;

      if (!isOwner) {
        // Check if user is a member
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        if (!existingMember || existingMember.length === 0) {
          return { data: null, error: 'You must be a member of the group to send invitations', loading: false };
        }
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('group_invitations')
        .select('id')
        .eq('group_id', groupId)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending');

      if (existingInvitation && existingInvitation.length > 0) {
        return { data: null, error: 'An invitation has already been sent to this email address', loading: false };
      }

      // Check if user is already a member by email
      const { data: existingUserMember } = await supabase
        .from('group_members')
        .select('profiles!inner(email)')
        .eq('group_id', groupId)
        .eq('profiles.email', email.toLowerCase());

      if (existingUserMember && existingUserMember.length > 0) {
        return { data: null, error: 'This user is already a member of the group', loading: false };
      }

      // Create invitation with 7-day expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      console.log('Sending invitation:', {
        group_id: groupId,
        email: email.toLowerCase(),
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      });

      const { data, error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          email: email.toLowerCase(),
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending invitation:', error);
        return { data: null, error: error.message, loading: false };
      }

      console.log('Invitation successfully created in database:', data);
      console.log(`Invitation sent to ${email} for group ${groupId}`);

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error sending invitation:', error);
      return { data: null, error: 'Failed to send invitation', loading: false };
    }
  }

  static async getInvitations(groupId?: string, status?: string): Promise<ApiResponse<GroupInvitationWithDetails[]>> {
    try {
      let query = supabase
        .from('group_invitations')
        .select(`
          *,
          groups!group_invitations_group_id_fkey(name, description),
          profiles!group_invitations_invited_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      // Filter by status (default to pending for group owners)
      if (status) {
        query = query.eq('status', status);
      } else if (groupId) {
        // For group detail view, only show pending invitations by default
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching invitations:', error);
        return { data: null, error: error.message, loading: false };
      }

      console.log('Group invitations fetched for owner:', data?.map(inv => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        groupId: inv.group_id,
        groupName: inv.groups?.name,
        invitedBy: inv.profiles?.full_name || inv.profiles?.email
      })));

      return { data: data || [], error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching invitations:', error);
      return { data: null, error: 'Failed to fetch invitations', loading: false };
    }
  }

  static async getUserInvitations(): Promise<ApiResponse<GroupInvitationWithDetails[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get user's email from their profile (more reliable than JWT)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const userEmail = userProfile?.email || user.email;
      console.log('Fetching user invitations for email:', userEmail?.toLowerCase());

      // Use the database function to get invitations with full details
      const { data: invitationData, error } = await supabase.rpc(
        'get_user_invitations_with_details',
        { user_email: userEmail?.toLowerCase() }
      );

      if (error) {
        console.error('Error fetching user invitations:', error);
        return { data: null, error: error.message, loading: false };
      }

      if (!invitationData || invitationData.length === 0) {
        return { data: [], error: null, loading: false };
      }

      // Filter for pending and non-expired invitations
      const validInvitations = invitationData.filter(inv => 
        inv.status === 'pending' && new Date(inv.expires_at) > new Date()
      );

      // Transform to match the expected GroupInvitationWithDetails format
      const transformedData: GroupInvitationWithDetails[] = validInvitations.map(inv => ({
        id: inv.invitation_id,
        group_id: inv.group_id,
        email: userEmail?.toLowerCase() || '',
        invited_by: inv.invited_by_id,
        status: inv.status,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        groups: {
          id: inv.group_id,
          name: inv.group_name,
          description: inv.group_description,
          owner_id: inv.invited_by_id, // This might not be accurate, but it's needed for the type
          created_at: inv.created_at,
          updated_at: inv.created_at
        },
        profiles: {
          id: inv.invited_by_id,
          email: inv.invited_by_email,
          full_name: inv.invited_by_name,
          avatar_url: null,
          phone: null,
          bio: null,
          created_at: inv.created_at,
          updated_at: inv.created_at
        },
        invited_by_profile: {
          id: inv.invited_by_id,
          email: inv.invited_by_email,
          full_name: inv.invited_by_name,
          avatar_url: null,
          phone: null,
          bio: null,
          created_at: inv.created_at,
          updated_at: inv.created_at
        }
      }));

      console.log('User invitations query result:', {
        invitationsCount: transformedData.length,
        groupsFound: transformedData.length,
        profilesFound: transformedData.length,
        userEmail: userEmail?.toLowerCase(),
        sampleData: transformedData[0] || null
      });

      console.log('Fetched invitations:', transformedData?.map(inv => ({
        id: inv.id,
        groupName: inv.groups?.name,
        invitedBy: inv.profiles?.full_name || inv.profiles?.email
      })));

      return { data: transformedData, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching user invitations:', error);
      return { data: null, error: 'Failed to fetch invitations', loading: false };
    }
  }

  static async acceptInvitation(invitationId: string): Promise<ApiResponse<{ groupName: string }>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get user's email from their profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const userEmail = userProfile?.email || user.email;

      // Get invitation details with group info
      const { data: invitation, error: invitationError } = await supabase
        .from('group_invitations')
        .select(`
          *,
          groups!group_invitations_group_id_fkey(name)
        `)
        .eq('id', invitationId)
        .eq('email', userEmail?.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (invitationError || !invitation) {
        return { data: null, error: 'Invitation not found or already processed', loading: false };
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('group_invitations')
          .update({ status: 'expired' })
          .eq('id', invitationId);

        return { data: null, error: 'This invitation has expired', loading: false };
      }

      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invitation.group_id,
          user_id: user.id,
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        return { data: null, error: 'Failed to join group', loading: false };
      }

      // Update invitation status
      const { data: updateData, error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
        .select();

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        return { data: null, error: 'Failed to update invitation status', loading: false };
      }

      if (!updateData || updateData.length === 0) {
        console.error('No invitation was updated - possible permission issue');
        return { data: null, error: 'Failed to update invitation status', loading: false };
      }

      console.log(`Successfully accepted invitation ${invitationId} and joined group ${invitation.groups?.name}`, updateData);

      return { data: { groupName: invitation.groups?.name || 'Unknown Group' }, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error accepting invitation:', error);
      return { data: null, error: 'Failed to accept invitation', loading: false };
    }
  }

  static async declineInvitation(invitationId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get user's email from their profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const userEmail = userProfile?.email || user.email;

      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId)
        .eq('email', userEmail?.toLowerCase());

      if (error) {
        console.error('Error declining invitation:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error declining invitation:', error);
      return { data: null, error: 'Failed to decline invitation', loading: false };
    }
  }

  static async cancelInvitation(invitationId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('group_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error canceling invitation:', error);
      return { data: null, error: 'Failed to cancel invitation', loading: false };
    }
  }

  static async leaveGroup(groupId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      console.log('🚪 User attempting to leave group:', { userId: user.id, groupId });

      // Check if user is the owner of the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id, name')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        return { data: null, error: 'Group not found', loading: false };
      }

      if (group.owner_id === user.id) {
        return { data: null, error: 'Group owners cannot leave their own group. Transfer ownership or delete the group instead.', loading: false };
      }

      // Check if user is actually a member of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (membershipError) {
        console.error('Error checking membership:', membershipError);
        return { data: null, error: 'You are not a member of this group', loading: false };
      }

      // Remove user from group
      const { error: leaveError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (leaveError) {
        console.error('Error leaving group:', leaveError);
        return { data: null, error: 'Failed to leave group', loading: false };
      }

      console.log('✅ User successfully left group:', { groupName: group.name, groupId });
      return { data: true, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error leaving group:', error);
      return { data: null, error: 'Failed to leave group', loading: false };
    }
  }

  static async transferOwnership(groupId: string, newOwnerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      console.log('👑 Transferring group ownership:', { groupId, fromUserId: user.id, toUserId: newOwnerId });

      // Verify current user is the owner
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id, name')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        return { data: null, error: 'Group not found', loading: false };
      }

      if (group.owner_id !== user.id) {
        return { data: null, error: 'Only the group owner can transfer ownership', loading: false };
      }

      // Verify new owner is a member of the group
      const { data: newOwnerMembership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', newOwnerId)
        .single();

      if (membershipError) {
        console.error('Error checking new owner membership:', membershipError);
        return { data: null, error: 'New owner must be a member of the group', loading: false };
      }

      // Transfer ownership
      const { error: transferError } = await supabase
        .from('groups')
        .update({
          owner_id: newOwnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (transferError) {
        console.error('Error transferring ownership:', transferError);
        return { data: null, error: 'Failed to transfer ownership', loading: false };
      }

      console.log('✅ Group ownership transferred successfully:', { groupName: group.name, newOwnerId });
      return { data: true, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error transferring ownership:', error);
      return { data: null, error: 'Failed to transfer ownership', loading: false };
    }
  }
}