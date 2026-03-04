import { supabase } from '../lib/supabaseClient';

export const friendsService = {
  async searchUsers(query) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', user.id)
      .limit(20);

    if (error) throw error;
    return data;
  },

  async getUserByUsername(username) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, avatar_url, bio, is_public')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  },

  async sendFriendRequest(friendId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(friendshipId) {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectFriendRequest(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  },

  async getFriends() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        user:user_id (id, username, display_name, avatar_url),
        friend:friend_id (id, username, display_name, avatar_url),
        created_at
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (error) throw error;

    return data.map(f => {
      const isRequester = f.user.id === user.id;
      return {
        friendshipId: f.id,
        id: isRequester ? f.friend.id : f.user.id,
        username: isRequester ? f.friend.username : f.user.username,
        displayName: isRequester ? f.friend.display_name : f.user.display_name,
        avatarUrl: isRequester ? f.friend.avatar_url : f.user.avatar_url,
        since: f.created_at
      };
    });
  },

  async getPendingRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user:user_id (id, username, display_name, avatar_url),
        created_at
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return data.map(r => ({
      requestId: r.id,
      id: r.user.id,
      username: r.user.username,
      displayName: r.user.display_name,
      avatarUrl: r.user.avatar_url,
      sentAt: r.created_at
    }));
  },

  async getSentRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        friend:friend_id (id, username, display_name, avatar_url),
        created_at
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
    return data.map(r => ({
      requestId: r.id,
      id: r.friend.id,
      username: r.friend.username,
      displayName: r.friend.display_name,
      avatarUrl: r.friend.avatar_url,
      sentAt: r.created_at
    }));
  },

  async removeFriend(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  },

  async cancelRequest(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  },

  async checkFriendshipStatus(userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: 'none' };

    const { data, error } = await supabase
      .from('friendships')
      .select('id, status, user_id, friend_id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (error) throw error;

    if (!data) return { status: 'none' };

    if (data.status === 'pending') {
      if (data.user_id === user.id) {
        return { status: 'sent', friendshipId: data.id };
      } else {
        return { status: 'received', friendshipId: data.id };
      }
    }

    return { status: data.status, friendshipId: data.id };
  },

  subscribeToFriendRequests(callback) {
    const subscription = supabase
      .channel('friend_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }
};

export default friendsService;
