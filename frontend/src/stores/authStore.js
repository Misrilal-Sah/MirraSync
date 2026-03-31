import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('mirrasync_user') || 'null'),
  token: localStorage.getItem('mirrasync_token') || null,
  isLoading: false,
  error: null,

  setAuth: (token, user) => {
    localStorage.setItem('mirrasync_token', token);
    localStorage.setItem('mirrasync_user', JSON.stringify(user));
    set({ token, user, error: null });
  },

  logout: () => {
    localStorage.removeItem('mirrasync_token');
    localStorage.removeItem('mirrasync_user');
    set({ token: null, user: null });
  },

  updateUser: (updates) => {
    const newUser = { ...get().user, ...updates };
    localStorage.setItem('mirrasync_user', JSON.stringify(newUser));
    set({ user: newUser });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/user/me');
      const user = res.data.user;
      localStorage.setItem('mirrasync_user', JSON.stringify(user));
      set({ user });
      return user;
    } catch (err) {
      return null;
    }
  },

  isAuthenticated: () => !!get().token && !!get().user,
}));

export default useAuthStore;
