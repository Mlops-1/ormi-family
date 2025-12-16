import instance from './instance';

export const UserAPI = {
  getUserInfo: (userId: number) =>
    instance.post('/user/info', { user_id: userId }),
};
