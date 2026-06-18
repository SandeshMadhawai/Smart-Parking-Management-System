import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      userType: null, // 'organization' | 'user'

      setAuth: (token, user, userType) => {
        localStorage.setItem('token', token);
        set({ token, user, userType });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, userType: null });
      },

      loginOrg: async (email, password) => {
        const res = await api.post('/auth/org/login', { email, password });
        const { token, data } = res.data;
        get().setAuth(token, data, 'organization');
        return res.data;
      },

      loginGuard: async (email, password) => {
        const res = await api.post('/auth/guard/login', { email, password });
        const { token, data } = res.data;
        get().setAuth(token, data, 'user');
        return res.data;
      },

      refreshMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data, userType: res.data.userType });
        } catch {
          get().logout();
        }
      },

      isAdmin: () => {
        const { userType, user } = get();
        return userType === 'organization' || user?.role === 'admin';
      },

      isGuard: () => {
        const { userType } = get();
        return userType === 'user';
      },

      orgId: () => {
        const { user, userType } = get();
        if (userType === 'organization') return user?._id;
        return user?.organizationId;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, userType: state.userType }),
    }
  )
);

export default useAuthStore;
