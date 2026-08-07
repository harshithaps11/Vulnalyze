import axios from 'axios';

const backendRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

const getStoredToken = () => localStorage.getItem('vulnalyze_token');

export const apiClient = axios.create({
  baseURL: `${backendRoot}/api/v1`,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const aiClient = axios.create({
  baseURL: `${backendRoot}/api`,
});

export const authApi = {
  async login(email: string, password: string) {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);

    const response = await apiClient.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const token = response.data?.access_token;
    if (token) {
      localStorage.setItem('vulnalyze_token', token);
    }

    return response;
  },

  async logout() {
    localStorage.removeItem('vulnalyze_token');
  },

  isAuthenticated() {
    return Boolean(getStoredToken());
  },
};
