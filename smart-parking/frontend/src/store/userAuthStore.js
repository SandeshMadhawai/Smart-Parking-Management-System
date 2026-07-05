import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useUserAuthStore = create(
  persist(
    (set, get) => ({
      userToken: null,
      vehicleUser: null,

      setUserAuth: (token, user) => {
        set({ userToken: token, vehicleUser: user });
      },

      userLogout: () => {
        set({ userToken: null, vehicleUser: null });
      },

      loginUser: async (email, password) => {
        const res = await api.post('/vehicle-users/login', { email, password });
        const { token, data } = res.data;
        // Store separately from guard/admin token
        localStorage.setItem('userToken', token);
        set({ userToken: token, vehicleUser: data });
        return res.data;
      },

      registerUser: async (form) => {
        const res = await api.post('/vehicle-users/register', form);
        const { token, data } = res.data;
        localStorage.setItem('userToken', token);
        set({ userToken: token, vehicleUser: data });
        return res.data;
      },
    }),
    {
      name: 'vehicle-user-storage',
      partialize: (state) => ({ userToken: state.userToken, vehicleUser: state.vehicleUser }),
    }
  )
);

export default useUserAuthStore;