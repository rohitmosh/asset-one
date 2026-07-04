import { request } from './api';
import type { AssetType, AssetGroup, Asset } from '../types';

export const taxonomyService = {
  getTypes: async (): Promise<AssetType[]> => {
    const res = await request('/api/taxonomy/types');
    return res.json();
  },

  getGroups: async (typeId?: number, domain?: string): Promise<AssetGroup[]> => {
    const queryParams = new URLSearchParams();
    if (typeId) queryParams.append('type_id', String(typeId));
    if (domain) queryParams.append('domain', domain);

    const res = await request(`/api/taxonomy/groups?${queryParams.toString()}`);
    return res.json();
  },

  createGroup: async (groupData: { domain: string; name: string }): Promise<AssetGroup> => {
    const res = await request('/api/taxonomy/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
    return res.json();
  },

  getCategories: async (groupId?: number): Promise<Asset[]> => {
    const queryParams = new URLSearchParams();
    if (groupId) queryParams.append('group_id', String(groupId));

    const res = await request(`/api/taxonomy/assets?${queryParams.toString()}`);
    return res.json();
  },

  createCategory: async (categoryData: { asset_group_id: number; asset_type_id: number; name: string }): Promise<Asset> => {
    const res = await request('/api/taxonomy/assets', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return res.json();
  },

  getNextIdentifier: async (assetId: number, plantName?: string, placeOfInstallation?: string): Promise<string> => {
    const queryParams = new URLSearchParams();
    queryParams.append('asset_id', String(assetId));
    if (plantName) queryParams.append('plant_name', plantName);
    if (placeOfInstallation) queryParams.append('place_of_installation', placeOfInstallation);

    const res = await request(`/api/taxonomy/next-identifier?${queryParams.toString()}`);
    const data = await res.json();
    return data.identifier;
  }
};
