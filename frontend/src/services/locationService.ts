import { request } from './api';
import type { Location } from '../types';

export const locationService = {
  list: async (): Promise<Location[]> => {
    const res = await request('/api/locations');
    return res.json();
  },

  create: async (locationData: {
    plant_office: string;
    building: string;
    floor?: string;
    room?: string;
    rack?: string;
  }): Promise<Location> => {
    const res = await request('/api/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
    return res.json();
  }
};
