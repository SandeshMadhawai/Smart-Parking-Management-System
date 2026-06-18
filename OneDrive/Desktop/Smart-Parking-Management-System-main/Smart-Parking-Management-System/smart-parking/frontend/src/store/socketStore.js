import { create } from 'zustand';
import { io } from 'socket.io-client';

const useSocketStore = create((set, get) => ({
  socket: null,

  connect: (orgId) => {
    if (get().socket?.connected) return;

    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      if (orgId) socket.emit('joinOrg', orgId.toString());
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));

export default useSocketStore;
