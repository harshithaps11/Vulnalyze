import axios from 'axios';

const backendRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: `${backendRoot}/api/v1`,
});

export const aiClient = axios.create({
  baseURL: `${backendRoot}/api`,
});
