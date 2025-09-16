import { supabase } from '../../services/supabaseClient';
import {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupMember,
  GroupMemberInsert,
  GroupInvitation,
  GroupInvitationInsert,
  GroupInvitationUpdate,
  GroupWithMembers,
  GroupInvitationWithDetails,
  ApiResponse,
} from '../../types';

export class GroupService {
  static async getGroups(): Promise<ApiResponse<GroupWithMembers[]>> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            *,
            profiles(id, email, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
        return { data: null, error: error.message, loading: false };
      }

      // Transform data to include member count
      const groupsWithMembers = (data || []).map(group => ({
        ...group,
        member_count: group.group_members?.length || 0,
      }));

      return { data: groupsWithMembers, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching groups:', error);
      return { data: null, error: 'Failed to fetch groups', loading: false };
    }
  }

  static async getGroupById(id: string): Promise<ApiResponse<GroupWithMembers>> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            *,
            profiles(id, email, full_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching group:', error);
        return { data: null, error: error.message, loading: false };
      }

      const groupWithMembers = {
        ...data,
        member_count: data.group_members?.length || 0,
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

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (!existingMember || existingMember.length === 0) {
        return { data: null, error: 'You must be a member of the group to send invitations', loading: false };
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

      // TODO: Send email notification (would need Supabase Edge Function)
      console.log(`Invitation sent to ${email} for group ${groupId}`);

      return { data, error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error sending invitation:', error);
      return { data: null, error: 'Failed to send invitation', loading: false };
    }
  }

  static async getInvitations(groupId?: string): Promise<ApiResponse<GroupInvitationWithDetails[]>> {
    try {
      let query = supabase
        .from('group_invitations')
        .select(`
          *,
          groups(name, description),
          invited_by_profile:profiles!group_invitations_invited_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching invitations:', error);
        return { data: null, error: error.message, loading: false };
      }

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

      const { data, error } = await supabase
        .from('group_invitations')
        .select(`
          *,
          groups(name, description),
          invited_by_profile:profiles!group_invitations_invited_by_fkey(full_name, email)
        `)
        .eq('email', user.email?.toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user invitations:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
    } catch (error) {
      console.error('Unexpected error fetching user invitations:', error);
      return { data: null, error: 'Failed to fetch invitations', loading: false };
    }
  }

  static async acceptInvitation(invitationId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('email', user.email?.toLowerCase())
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
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
      }

      return { data: true, error: null, loading: false };
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

      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId)
        .eq('email', user.email?.toLowerCase());

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
}