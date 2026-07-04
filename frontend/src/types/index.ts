export interface Role {
  id: number;
  name: string;
  permissions?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  employee_id: string;
}

export interface Location {
  id: number;
  plant_office: string;
  building: string;
  floor?: string;
  room?: string;
  rack?: string;
}

export interface AssetType {
  id: number;
  name: string;
}

export interface AssetGroup {
  id: number;
  domain: string;
  name: string;
}

export interface Asset {
  id: number;
  asset_group_id: number;
  asset_type_id: number;
  name: string;
  asset_group?: AssetGroup;
  asset_type?: AssetType;
}

export interface AssetInstance {
  id: number;
  identifier: string;
  description?: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  security_classification: string;
  business_criticality: string;
  purchase_date?: string;
  installation_date?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  end_of_life_date?: string;
  end_of_support_date?: string;
  policy_deviations?: string;
  known_vulnerabilities?: string;
  remarks?: string;
  backup_available: boolean;
  backup_location?: string;
  backup_owner_id?: number;
  backup_owner?: UserProfile;
  status: string;
  owner_id: number;
  owner: UserProfile;
  custodian_id: number;
  custodian: UserProfile;
  assigned_user_id?: number;
  assigned_user?: UserProfile;
  location_id: number;
  location: Location;
  asset: {
    id: number;
    name: string;
    asset_group: AssetGroup;
    asset_type: AssetType;
  };
  prev_asset_instance_id?: number;
  prev_asset_identifier?: string;
  next_asset_instance_id?: number;
  next_asset_identifier?: string;
}

export interface AuditLog {
  id: number;
  asset_instance_id?: number;
  action: string;
  changed_by_user_id: number;
  changed_by_name: string;
  changed_by_role: string;
  changed_at: string;
  ip_address?: string;
  field_diffs?: string;
  prev_hash?: string;
  row_hash: string;
}

export interface RegistrySnapshot {
  id: number;
  snapshot_id: string;
  signer_user_id: number;
  signer_name: string;
  signer_role: string;
  signer_employee_id: string;
  signer_department: string;
  signer_email: string;
  timestamp_ist: string;
  asset_count: number;
  data_hash: string;
  chain_anchor: string;
  hmac_signature: string;
  remarks?: string;
}
