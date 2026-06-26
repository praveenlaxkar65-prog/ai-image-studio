import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/admin',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ais_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ais_admin_token');
    }
    return Promise.reject(err);
  },
);

export default api;
