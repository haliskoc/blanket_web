import { supabase } from '../lib/supabaseClient';

export const leaderboardService = {
  async getGlobalLeaderboard(period = 'weekly', category = 'pomodoros', limit = 50) {
    let query = supabase
      .from('user_stats')
      .select(`
        user_id,
        total_pomodoros,
        total_focus_time,
        current_streak,
        longest_streak,
        weekly_pomodoros,
        monthly_pomodoros,
        user_profile:user_id (id, username, display_name, avatar_url)
      `)
      .order(getCategoryColumn(category, period), { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return data.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      username: entry.user_profile?.username || 'Anonymous',
      displayName: entry.user_profile?.display_name,
      avatarUrl: entry.user_profile?.avatar_url,
      totalPomodoros: entry.total_pomodoros,
      totalFocusTime: entry.total_focus_time,
      currentStreak: entry.current_streak,
      longestStreak: entry.longest_streak,
      weeklyPomodoros: entry.weekly_pomodoros,
      monthlyPomodoros: entry.monthly_pomodoros,
      value: getValueByCategory(entry, category, period)
    }));
  },

  async getFriendsLeaderboard(period = 'weekly', category = 'pomodoros', limit = 50) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: friends, error: friendsError } = await supabase
      .from('friendships')
      .select('friend_id, user_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (friendsError) throw friendsError;

    const friendIds = friends.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    );
    friendIds.push(user.id);

    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        total_pomodoros,
        total_focus_time,
        current_streak,
        longest_streak,
        weekly_pomodoros,
        monthly_pomodoros,
        user_profile:user_id (id, username, display_name, avatar_url)
      `)
      .in('user_id', friendIds)
      .order(getCategoryColumn(category, period), { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      username: entry.user_profile?.username || 'Anonymous',
      displayName: entry.user_profile?.display_name,
      avatarUrl: entry.user_profile?.avatar_url,
      totalPomodoros: entry.total_pomodoros,
      totalFocusTime: entry.total_focus_time,
      currentStreak: entry.current_streak,
      longestStreak: entry.longest_streak,
      weeklyPomodoros: entry.weekly_pomodoros,
      monthlyPomodoros: entry.monthly_pomodoros,
      value: getValueByCategory(entry, category, period),
      isCurrentUser: entry.user_id === user.id
    }));
  },

  async getUserRank(userId, period = 'weekly', category = 'pomodoros') {
    const { data, error } = await supabase
      .rpc('get_user_rank', {
        p_user_id: userId,
        p_period: period,
        p_category: category
      });

    if (error) {
      const { data: stats } = await supabase
        .from('user_stats')
        .select('total_pomodoros, total_focus_time, current_streak, weekly_pomodoros, monthly_pomodoros')
        .eq('user_id', userId)
        .single();

      if (!stats) return { rank: null, totalUsers: 0 };

      const { count } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gt(getCategoryColumn(category, period), getValueByCategory(stats, category, period));

      return { rank: (count || 0) + 1, totalUsers: count };
    }

    return data;
  },

  async getUserStats(userId) {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || getDefaultStats();
  },

  async updateUserStats(stats) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        ...stats,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTopUsersByStreak(limit = 10) {
    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        current_streak,
        longest_streak,
        user_profile:user_id (username, display_name, avatar_url)
      `)
      .order('current_streak', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getTopUsersByFocusTime(limit = 10) {
    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        total_focus_time,
        user_profile:user_id (username, display_name, avatar_url)
      `)
      .order('total_focus_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};

function getCategoryColumn(category, period) {
  const columns = {
    pomodoros: period === 'weekly' ? 'weekly_pomodoros' : period === 'monthly' ? 'monthly_pomodoros' : 'total_pomodoros',
    focusTime: 'total_focus_time',
    streak: 'current_streak'
  };
  return columns[category] || 'total_pomodoros';
}

function getValueByCategory(entry, category, period) {
  switch (category) {
    case 'pomodoros':
      if (period === 'weekly') return entry.weekly_pomodoros || 0;
      if (period === 'monthly') return entry.monthly_pomodoros || 0;
      return entry.total_pomodoros || 0;
    case 'focusTime':
      return entry.total_focus_time || 0;
    case 'streak':
      return entry.current_streak || 0;
    default:
      return entry.total_pomodoros || 0;
  }
}

function getDefaultStats() {
  return {
    total_pomodoros: 0,
    total_focus_time: 0,
    current_streak: 0,
    longest_streak: 0,
    weekly_pomodoros: 0,
    monthly_pomodoros: 0
  };
}

export default leaderboardService;
