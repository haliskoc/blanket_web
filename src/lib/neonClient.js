const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class NeonAPIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      this.setToken(null);
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(email, password, username, displayName) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, displayName }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  // Sync
  async syncData(data) {
    return this.request('/api/sync/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSyncData() {
    return this.request('/api/sync/data');
  }

  // Leaderboard
  async getLeaderboard(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/api/leaderboard?${params}`);
  }

  // Rooms
  async getRooms(options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/api/rooms?${params}`);
  }

  async createRoom(roomData) {
    return this.request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async getRoom(roomId) {
    return this.request(`/api/rooms/${roomId}`);
  }

  async joinRoom(roomId, password) {
    return this.request(`/api/rooms/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async leaveRoom(roomId) {
    return this.request(`/api/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  // Friends
  async getFriends(status = 'accepted') {
    return this.request(`/api/friends?status=${status}`);
  }

  async addFriend(username) {
    return this.request('/api/friends', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async respondToFriendRequest(friendshipId, action) {
    return this.request('/api/friends', {
      method: 'PUT',
      body: JSON.stringify({ friendshipId, action }),
    });
  }

  async removeFriend(userId) {
    return this.request(`/api/friends?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  // Profile
  async getPublicProfile(username) {
    return this.request(`/api/profile/${username}`);
  }
}

export const neonClient = new NeonAPIClient();
export default neonClient;
