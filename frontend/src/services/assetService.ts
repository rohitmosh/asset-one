import { request, API_BASE } from './api';
import type { AssetInstance } from '../types';

export const assetService = {
  list: async (filters: any): Promise<AssetInstance[]> => {
    const queryParams = new URLSearchParams();
    if (filters.typeId) queryParams.append('type_id', filters.typeId);
    if (filters.groupId) queryParams.append('group_id', filters.groupId);
    if (filters.assetId) queryParams.append('asset_id', filters.assetId);
    if (filters.criticality) queryParams.append('criticality', filters.criticality);
    if (filters.classification) queryParams.append('classification', filters.classification);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.custodianId) queryParams.append('custodian_id', filters.custodianId);
    if (filters.domain) queryParams.append('domain', filters.domain);

    const res = await request(`/api/assets?${queryParams.toString()}`);
    return res.json();
  },

  get: async (id: number): Promise<AssetInstance> => {
    const res = await request(`/api/assets/${id}`);
    return res.json();
  },

  create: async (assetData: any): Promise<AssetInstance> => {
    const res = await request('/api/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
    return res.json();
  },

  update: async (id: number, assetData: any): Promise<AssetInstance> => {
    const res = await request(`/api/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
    return res.json();
  },

  transfer: async (id: number, transferData: any): Promise<AssetInstance> => {
    const res = await request(`/api/assets/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
    return res.json();
  },

  retire: async (id: number, retireData: any): Promise<AssetInstance> => {
    const res = await request(`/api/assets/${id}/retire`, {
      method: 'POST',
      body: JSON.stringify(retireData),
    });
    return res.json();
  },

  bulkUpdateClassification: async (assetIds: number[], securityClassification: string): Promise<any> => {
    const res = await request('/api/assets/bulk-classification', {
      method: 'POST',
      body: JSON.stringify({ asset_ids: assetIds, security_classification: securityClassification }),
    });
    return res.json();
  },

  bulkTransfer: async (transferData: any): Promise<any> => {
    const res = await request('/api/assets/bulk-transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
    return res.json();
  },
  
  getExcelExportUrl: (filters: any): string => {
    const token = localStorage.getItem('eams_token') || '';
    const queryParams = new URLSearchParams();
    if (filters.typeId) queryParams.append('type_id', filters.typeId);
    if (filters.groupId) queryParams.append('group_id', filters.groupId);
    if (filters.criticality) queryParams.append('criticality', filters.criticality);
    if (filters.classification) queryParams.append('classification', filters.classification);
    if (filters.custodianId) queryParams.append('custodian_id', filters.custodianId);
    if (filters.domain) queryParams.append('domain', filters.domain);
    queryParams.append('jwt', token);
    return `${API_BASE}/api/reports/export?${queryParams.toString()}`;
  },

  getPdfExportUrl: (filters: any): string => {
    const token = localStorage.getItem('eams_token') || '';
    const queryParams = new URLSearchParams();
    if (filters.typeId) queryParams.append('type_id', filters.typeId);
    if (filters.groupId) queryParams.append('group_id', filters.groupId);
    if (filters.criticality) queryParams.append('criticality', filters.criticality);
    if (filters.classification) queryParams.append('classification', filters.classification);
    if (filters.custodianId) queryParams.append('custodian_id', filters.custodianId);
    if (filters.domain) queryParams.append('domain', filters.domain);
    queryParams.append('jwt', token);
    return `${API_BASE}/api/reports/pdf?${queryParams.toString()}`;
  }
};
