import { supabase } from '../lib/supabaseClient';

export const roomsService = {
  async createRoom({ name, description, isPrivate = false, password = null, maxParticipants = 10 }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        description,
        is_private: isPrivate,
        password_hash: password,
        max_participants: maxParticipants,
        created_by: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('room_participants')
      .insert({
        room_id: data.id,
        user_id: user.id,
        role: 'host',
        status: 'online',
        joined_at: new Date().toISOString()
      });

    return data;
  },

  async getPublicRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        creator:created_by (id, username, display_name, avatar_url),
        participant_count:room_participants(count)
      `)
      .eq('is_private', false)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getMyRooms() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('room_participants')
      .select(`
        room:room_id (*),
        role,
        joined_at
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data.map(d => ({ ...d.room, role: d.role, joinedAt: d.joined_at }));
  },

  async getRoom(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        creator:created_by (id, username, display_name, avatar_url)
      `)
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  },

  async joinRoom(roomId, password = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: room } = await supabase
      .from('rooms')
      .select('is_private, password_hash, max_participants, status')
      .eq('id', roomId)
      .single();

    if (!room) throw new Error('Room not found');
    if (room.status !== 'active') throw new Error('Room is not active');

    const { count } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('status', 'online');

    if (count >= room.max_participants) {
      throw new Error('Room is full');
    }

    if (room.is_private && room.password_hash && room.password_hash !== password) {
      throw new Error('Invalid password');
    }

    const { data: existingParticipant } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      const { data, error } = await supabase
        .from('room_participants')
        .update({ status: 'online', last_seen_at: new Date().toISOString() })
        .eq('id', existingParticipant.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: user.id,
        role: 'participant',
        status: 'online',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async leaveRoom(roomId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('room_participants')
      .update({ status: 'offline', left_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  },

  async getRoomParticipants(roomId) {
    const { data, error } = await supabase
      .from('room_participants')
      .select(`
        id,
        role,
        status,
        focus_status,
        joined_at,
        last_seen_at,
        user:user_id (id, username, display_name, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data.map(p => ({
      id: p.id,
      userId: p.user.id,
      username: p.user.username,
      displayName: p.user.display_name,
      avatarUrl: p.user.avatar_url,
      role: p.role,
      status: p.status,
      focusStatus: p.focus_status,
      joinedAt: p.joined_at,
      lastSeenAt: p.last_seen_at
    }));
  },

  async updateParticipantStatus(roomId, status) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('room_participants')
      .update({
        focus_status: status,
        last_seen_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async sendMessage(roomId, content) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:user_id (id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      user: {
        id: data.user.id,
        username: data.user.username,
        displayName: data.user.display_name,
        avatarUrl: data.user.avatar_url
      }
    };
  },

  async getMessages(roomId, limit = 50) {
    const { data, error } = await supabase
      .from('room_messages')
      .select(`
        id,
        content,
        created_at,
        user:user_id (id, username, display_name, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: m.created_at,
      user: {
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.display_name,
        avatarUrl: m.user.avatar_url
      }
    }));
  },

  async deleteRoom(roomId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: room } = await supabase
      .from('rooms')
      .select('created_by')
      .eq('id', roomId)
      .single();

    if (!room || room.created_by !== user.id) {
      throw new Error('Not authorized');
    }

    await supabase
      .from('rooms')
      .update({ status: 'closed' })
      .eq('id', roomId);
  },

  async kickParticipant(roomId, participantId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: myRole } = await supabase
      .from('room_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (!myRole || myRole.role !== 'host') {
      throw new Error('Not authorized');
    }

    await supabase
      .from('room_participants')
      .delete()
      .eq('id', participantId);
  },

  subscribeToRoom(roomId, callbacks) {
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (callbacks.onParticipantChange) {
            callbacks.onParticipantChange(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (callbacks.onNewMessage) {
            callbacks.onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    return () => roomChannel.unsubscribe();
  },

  subscribeToRoomsList(callback) {
    const channel = supabase
      .channel('rooms_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  },

  async startRoomTimer(roomId, duration, type = 'focus') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: myRole } = await supabase
      .from('room_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (!myRole || myRole.role !== 'host') {
      throw new Error('Only host can start timer');
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({
        timer_started_at: new Date().toISOString(),
        timer_duration: duration,
        timer_type: type
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async stopRoomTimer(roomId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: myRole } = await supabase
      .from('room_participants')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (!myRole || myRole.role !== 'host') {
      throw new Error('Only host can stop timer');
    }

    const { error } = await supabase
      .from('rooms')
      .update({
        timer_started_at: null,
        timer_duration: null,
        timer_type: null
      })
      .eq('id', roomId);

    if (error) throw error;
  }
};

export default roomsService;
