import { Storage } from '@/utils/storage';
import axios from 'axios';
import responseErrorInterceptor from './interceptor';

const instance = axios.create({
  // Use relative path to leverage Vite proxy in development
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

instance.interceptors.request.use(
  function (config) {
    const token = Storage.get({ key: 'token', persist: false });

    if (!!token && config.headers)
      config.headers.Authorization = `Bearer ${token}`;

    const apiKey = import.meta.env.VITE_BACKEND_API_KEY;
    if (apiKey && config.headers) {
      config.headers['x-api-key'] = apiKey;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (response?.data?.data?.access_token) {
      Storage.set({
        key: 'token',
        persist: false,
        value: response.data.data.access_token,
      });
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use((response) => {
  return response;
}, responseErrorInterceptor);

export default instance;
