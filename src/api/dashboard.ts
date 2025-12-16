import instance from './instance';

export const DashboardAPI = {
  getDashboard: () => instance.get('/dashboard', { responseType: 'text' }),
};
