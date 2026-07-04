import { request } from './api';

export const reportService = {
  getSummary: async (): Promise<any> => {
    const res = await request('/api/reports/summary');
    return res.json();
  }
};
