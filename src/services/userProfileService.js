import { supabase } from '../lib/supabaseClient';

export const userProfileService = {
  async getPublicProfile(username) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        is_public,
        show_stats,
        show_achievements,
        show_history,
        created_at
      `)
      .eq('username', username)
      .single();

    if (error) throw error;
    if (!data.is_public) {
      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        isPublic: false,
        createdAt: data.created_at
      };
    }

    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', data.id)
      .single();

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', data.id);

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      isPublic: true,
      privacy: {
        showStats: data.show_stats,
        showAchievements: data.show_achievements,
        showHistory: data.show_history
      },
      createdAt: data.created_at,
      stats: data.show_stats ? stats : null,
      achievements: data.show_achievements ? achievements : null
    };
  },

  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const allowedUpdates = {
      display_name: updates.displayName,
      bio: updates.bio,
      avatar_url: updates.avatarUrl,
      is_public: updates.isPublic,
      show_stats: updates.showStats,
      show_achievements: updates.showAchievements,
      show_history: updates.showHistory
    };

    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) delete allowedUpdates[key];
    });

    const { data, error } = await supabase
      .from('user_profiles')
      .update(allowedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setUsername(username) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existing && existing.id !== user.id) {
      throw new Error('Username already taken');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: user.user_metadata?.display_name || username,
        email: user.email,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkUsernameAvailable(username) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') {
      return { available: true };
    }

    return { available: !data };
  },

  async getUserActivityHistory(userId, limit = 30) {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getSharedProfileUrl(username) {
    return `${window.location.origin}/u/${username}`;
  },

  generateShareText(profile, stats) {
    const lines = [
      `${profile.displayName || profile.username} on Podomodro`,
      ''
    ];

    if (stats) {
      lines.push(`${stats.total_pomodoros || 0} Pomodoros completed`);
      lines.push(`${stats.current_streak || 0} day streak`);
      lines.push(`${Math.floor((stats.total_focus_time || 0) / 60)} hours focused`);
    }

    lines.push('');
    lines.push(`Check out my profile: ${window.location.origin}/u/${profile.username}`);

    return lines.join('\n');
  }
};

export default userProfileService;
