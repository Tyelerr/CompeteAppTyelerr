import { supabase } from './supabase';
import {
  ISupportMessage,
  ESupportMessageType,
  ESupportMessageStatus,
  ICAUserData,
} from '../hooks/InterfacesGlobal';

/**
 * Create a new support message
 */
export const CreateSupportMessage = async (
  user: ICAUserData,
  messageType: ESupportMessageType,
  messageContent: string,
  tournamentId?: string,
): Promise<{
  success: boolean;
  data?: ISupportMessage;
  error?: any;
}> => {
  try {
    console.log('CreateSupportMessage: Creating message', {
      user_id: user.id,
      message_type: messageType,
      content_length: messageContent.length,
      tournament_id: tournamentId,
    });

    const messageData = {
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_name,
      message_type: messageType,
      message_content: messageContent,
      tournament_id: tournamentId || null,
      status: ESupportMessageStatus.Pending,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('support_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('CreateSupportMessage: Database error', error);
      return { success: false, error };
    }

    console.log('CreateSupportMessage: Success', data);
    return { success: true, data: data as ISupportMessage };
  } catch (error) {
    console.error('CreateSupportMessage: Exception', error);
    return { success: false, error };
  }
};

/**
 * Fetch all support messages (admin only)
 */
export const FetchAllSupportMessages = async (filters?: {
  status?: ESupportMessageStatus;
  messageType?: ESupportMessageType;
  isRead?: boolean;
  search?: string;
}): Promise<{
  success: boolean;
  data?: ISupportMessage[];
  error?: any;
}> => {
  try {
    console.log(
      'FetchAllSupportMessages: Fetching messages with filters',
      filters,
    );

    let query = supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.messageType) {
      query = query.eq('message_type', filters.messageType);
    }
    if (filters?.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }
    if (filters?.search) {
      query = query.or(
        `message_content.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('FetchAllSupportMessages: Database error', error);
      return { success: false, error };
    }

    console.log('FetchAllSupportMessages: Success', data?.length, 'messages');
    return { success: true, data: data as ISupportMessage[] };
  } catch (error) {
    console.error('FetchAllSupportMessages: Exception', error);
    return { success: false, error };
  }
};

/**
 * Fetch support messages for a specific user
 */
export const FetchUserSupportMessages = async (
  userId: string,
): Promise<{
  success: boolean;
  data?: ISupportMessage[];
  error?: any;
}> => {
  try {
    console.log('FetchUserSupportMessages: Fetching messages for user', userId);

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('FetchUserSupportMessages: Database error', error);
      return { success: false, error };
    }

    console.log('FetchUserSupportMessages: Success', data?.length, 'messages');
    return { success: true, data: data as ISupportMessage[] };
  } catch (error) {
    console.error('FetchUserSupportMessages: Exception', error);
    return { success: false, error };
  }
};

/**
 * Update message status and mark as read (admin only)
 */
export const UpdateSupportMessage = async (
  messageId: number,
  updates: {
    status?: ESupportMessageStatus;
    is_read?: boolean;
    admin_response?: string;
    admin_user_id?: string;
  },
): Promise<{
  success: boolean;
  data?: ISupportMessage;
  error?: any;
}> => {
  try {
    console.log('UpdateSupportMessage: Updating message', messageId, updates);

    const updateData: any = { ...updates };

    // If adding admin response, set responded_at timestamp
    if (updates.admin_response) {
      updateData.responded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_messages')
      .update(updateData)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('UpdateSupportMessage: Database error', error);
      return { success: false, error };
    }

    console.log('UpdateSupportMessage: Success', data);
    return { success: true, data: data as ISupportMessage };
  } catch (error) {
    console.error('UpdateSupportMessage: Exception', error);
    return { success: false, error };
  }
};

/**
 * Mark message as read
 */
export const MarkMessageAsRead = async (
  messageId: number,
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    console.log('MarkMessageAsRead: Marking message as read', messageId);

    const { error } = await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) {
      console.error('MarkMessageAsRead: Database error', error);
      return { success: false, error };
    }

    console.log('MarkMessageAsRead: Success');
    return { success: true };
  } catch (error) {
    console.error('MarkMessageAsRead: Exception', error);
    return { success: false, error };
  }
};

/**
 * Get message statistics for admin dashboard
 */
export const GetMessageStatistics = async (): Promise<{
  success: boolean;
  data?: {
    total: number;
    unread: number;
    pending: number;
    in_progress: number;
    resolved: number;
  };
  error?: any;
}> => {
  try {
    console.log('GetMessageStatistics: Fetching statistics');

    const { data, error } = await supabase
      .from('support_messages')
      .select('status, is_read');

    if (error) {
      console.error('GetMessageStatistics: Database error', error);
      return { success: false, error };
    }

    const stats = {
      total: data.length,
      unread: data.filter((msg) => !msg.is_read).length,
      pending: data.filter(
        (msg) => msg.status === ESupportMessageStatus.Pending,
      ).length,
      in_progress: data.filter(
        (msg) => msg.status === ESupportMessageStatus.InProgress,
      ).length,
      resolved: data.filter(
        (msg) => msg.status === ESupportMessageStatus.Resolved,
      ).length,
    };

    console.log('GetMessageStatistics: Success', stats);
    return { success: true, data: stats };
  } catch (error) {
    console.error('GetMessageStatistics: Exception', error);
    return { success: false, error };
  }
};

/**
 * Delete a support message (admin only)
 */
export const DeleteSupportMessage = async (
  messageId: number,
): Promise<{
  success: boolean;
  error?: any;
}> => {
  try {
    console.log('DeleteSupportMessage: Deleting message', messageId);

    const { error } = await supabase
      .from('support_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('DeleteSupportMessage: Database error', error);
      return { success: false, error };
    }

    console.log('DeleteSupportMessage: Success');
    return { success: true };
  } catch (error) {
    console.error('DeleteSupportMessage: Exception', error);
    return { success: false, error };
  }
};
