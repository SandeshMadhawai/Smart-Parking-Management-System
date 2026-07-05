import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    // For vehicle user routes, use userToken
    const isUserRoute = config.url?.includes('/vehicle-users') ||
                        config.url?.includes('/bookings');

    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('token');

    // Pick right token based on route
    if (isUserRoute && userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (url.includes('/vehicle-users') || url.includes('/bookings')) {
        localStorage.removeItem('userToken');
        if (!window.location.pathname.includes('/user/login')) {
          window.location.href = '/user/login';
        }
      } else {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;