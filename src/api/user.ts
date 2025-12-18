import instance from './instance';

export interface UserResponse {
  user_name: string;
  email: string;
  profile: string; // URL
  is_disabled: number; // 0 or 1
  with_child: number; // 0 or 1
  with_pet: number; // 0 or 1
  has_stroller: number; // 0 or 1
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface UserUpdatePayload {
  user_name: string;
  email: string;
  profile: string;
  is_disabled: number;
  with_child: number;
  with_pet: number;
  has_stroller: number;
}

export const UserAPI = {
  getUserInfo: (userId: number) =>
    instance.post<UserResponse[]>('/user/info', { user_id: userId }),

  updateUser: (userId: number, data: UserUpdatePayload) =>
    instance.put<UserResponse>(`/user/update/${userId}`, data),
};
