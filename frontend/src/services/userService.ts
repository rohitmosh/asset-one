import { request } from './api';
import type { UserProfile } from '../types';

export const userService = {
  list: async (): Promise<UserProfile[]> => {
    const res = await request('/api/users');
    return res.json();
  },

  create: async (userData: any): Promise<UserProfile> => {
    const res = await request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  delete: async (userId: number): Promise<any> => {
    const res = await request(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};
