import { request, API_BASE } from './api';
import type { RegistrySnapshot } from '../types';

export const snapshotService = {
  list: async (): Promise<RegistrySnapshot[]> => {
    const res = await request('/api/snapshots');
    return res.json();
  },

  create: async (signData: { remarks?: string; password_confirm: string }): Promise<RegistrySnapshot> => {
    const res = await request('/api/snapshots', {
      method: 'POST',
      body: JSON.stringify(signData),
    });
    return res.json();
  },

  verify: async (snapshotId: string): Promise<any> => {
    const res = await request(`/api/snapshots/${snapshotId}/verify`);
    return res.json();
  },

  getDownloadUrl: (snapshotId: string): string => {
    const token = localStorage.getItem('eams_token') || '';
    return `${API_BASE}/api/snapshots/${snapshotId}?jwt=${token}`;
  }
};
