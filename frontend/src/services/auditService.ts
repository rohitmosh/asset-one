import { request } from './api';
import type { AuditLog } from '../types';

export const auditService = {
  list: async (assetId?: number): Promise<AuditLog[]> => {
    const url = assetId ? `/api/audit/logs?asset_id=${assetId}` : '/api/audit/logs';
    const res = await request(url);
    return res.json();
  },

  verifyIntegrity: async (): Promise<any> => {
    const res = await request('/api/audit/integrity');
    return res.json();
  }
};
