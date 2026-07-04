import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assetService } from '../../services/assetService';
import { locationService } from '../../services/locationService';
import { userService } from '../../services/userService';
import type { AssetInstance, Location, UserProfile } from '../../types';
import { formatToIST } from '../../utils/time';
import { 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  ArrowLeft 
} from 'lucide-react';

interface AssetDetailsProps {
  assetId: number;
  onBack: () => void;
  onViewDetails: (id: number) => void;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({ 
  assetId, 
  onBack,
  onViewDetails
}) => {
  const { currentUser, setGlobalLoading } = useAuth();
  const [asset, setAsset] = useState<AssetInstance | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Transfer state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferForm, setTransferForm] = useState({
    newUser: '',
    newLocation: '',
    reason: '',
    password: '',
  });

  // Retire state
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [retireError, setRetireError] = useState('');
  const [retireForm, setRetireForm] = useState({
    reason: '',
    password: '',
  });

  const fetchAssetDetail = async () => {
    setGlobalLoading(true);
    try {
      const data = await assetService.get(assetId);
      setAsset(data);
    } catch (e: any) {
      console.error('Failed to load asset details', e);
      alert(e.message || 'Failed to retrieve asset details.');
      onBack();
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetail();
  }, [assetId]);

  // Load locations and users on demand for modals
  useEffect(() => {
    if (transferModalOpen) {
      const loadOptions = async () => {
        try {
          const [locsData, usersData] = await Promise.all([
            locationService.list(),
            userService.list()
          ]);
          setLocations(locsData);
          setUsers(usersData);
        } catch (e) {
          console.error('Failed to load options', e);
        }
      };
      loadOptions();
    }
  }, [transferModalOpen]);

  if (!asset) return null;

  const isExpired = asset.warranty_end_date && new Date(asset.warranty_end_date) < new Date();
  const isL2Admin = currentUser?.role.name === 'L2_ADMIN';

  // Handlers
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.newUser || !transferForm.newLocation || !transferForm.password) {
      setTransferError('New User, Location, and password are required.');
      return;
    }
    setTransferError('');
    setGlobalLoading(true);
    try {
      await assetService.transfer(asset.id, {
        new_user_id: parseInt(transferForm.newUser),
        new_location_id: parseInt(transferForm.newLocation),
        reason: transferForm.reason,
        password_confirm: transferForm.password
      });
      alert(`Asset transferred successfully.`);
      setTransferModalOpen(false);
      setTransferForm({ newUser: '', newLocation: '', reason: '', password: '' });
      fetchAssetDetail();
    } catch (err: any) {
      setTransferError(err.message || 'Failed to transfer asset.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRetireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retireForm.reason || !retireForm.password) {
      setRetireError('Justification and password are required.');
      return;
    }
    setRetireError('');
    setGlobalLoading(true);
    try {
      await assetService.retire(asset.id, {
        reason: retireForm.reason,
        password_confirm: retireForm.password
      });
      alert(`Asset retired successfully.`);
      setRetireModalOpen(false);
      setRetireForm({ reason: '', password: '' });
      fetchAssetDetail();
    } catch (err: any) {
      setRetireError(err.message || 'Failed to retire asset.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const updateAssetClassification = async (newClass: string) => {
    setGlobalLoading(true);
    try {
      await assetService.bulkUpdateClassification([asset.id], newClass);
      alert(`Security classification updated successfully.`);
      fetchAssetDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update security classification.');
    } finally {
      setGlobalLoading(false);
    }
  };



  // Fetch audit log from asset history field
  // Wait, does backend/src/services/asset_service.py's get_by_id return audit_logs?
  // Let's check: yes, in models.py the AssetInstance has `audit_logs` relationship!
  // Therefore, audit logs are pre-loaded in the model serialized response!
  const auditLogsList = (asset as any).audit_logs || [];

  return (
    <div>
      {/* HEADER AND ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Asset: {asset.identifier}</span>
              <span className={`badge ${asset.status === 'Active' ? 'badge-active' : 'badge-retired'}`}>
                {asset.status}
              </span>
            </h1>
            <p style={{ color: '#4B5563' }}>{asset.asset.name} • Serial: {asset.serial_number || 'N/A'}</p>
          </div>
        </div>
        
        {asset.status === 'Active' && isL2Admin && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => {
              setTransferForm({ newUser: asset.assigned_user_id?.toString() || '', newLocation: asset.location_id.toString(), reason: '', password: '' });
              setTransferError('');
              setTransferModalOpen(true);
            }}>
              <RefreshCw size={16} />
              <span>Transfer Asset</span>
            </button>
            <button className="btn btn-danger" onClick={() => {
              setRetireError('');
              setRetireForm({ reason: '', password: '' });
              setRetireModalOpen(true);
            }}>
              <Trash2 size={16} />
              <span>Retire Asset</span>
            </button>
          </div>
        )}
      </div>

      {/* SPECIFICATION OVERVIEW */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Specification Overview</div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Asset Type</span>
            <span className="info-value">{asset.asset.asset_type.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Asset Group</span>
            <span className="info-value">{asset.asset.asset_group.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Asset Category</span>
            <span className="info-value">{asset.asset.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Previous Asset Link</span>
            <span className="info-value">
              {asset.prev_asset_instance_id ? (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '2px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }} 
                  onClick={() => onViewDetails(asset.prev_asset_instance_id!)}
                >
                  {asset.prev_asset_identifier}
                </button>
              ) : (
                <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>None (Initial Entry)</span>
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Next Asset Reference</span>
            <span className="info-value">
              {asset.next_asset_instance_id ? (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '2px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }} 
                  onClick={() => onViewDetails(asset.next_asset_instance_id!)}
                >
                  {asset.next_asset_identifier}
                </button>
              ) : (
                <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>None (Latest Entry)</span>
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Manufacturer</span>
            <span className="info-value">{asset.manufacturer || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Model Number</span>
            <span className="info-value">{asset.model_number || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Serial Number</span>
            <span className="info-value">{asset.serial_number || 'N/A'}</span>
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <div className="info-label">Asset Description</div>
          <div className="info-value" style={{ marginTop: '4px', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            {asset.description || 'No description added.'}
          </div>
        </div>
      </div>

      {/* OWNERSHIP & LOCATION */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Ownership & Location</div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Asset Owner</span>
            <span className="info-value"><strong>{asset.owner.name}</strong> ({asset.owner.department})</span>
          </div>
          <div className="info-item">
            <span className="info-label">Asset Custodian</span>
            <span className="info-value"><strong>{asset.custodian.name}</strong> ({asset.custodian.department})</span>
          </div>
          <div className="info-item">
            <span className="info-label">Assigned User</span>
            <span className="info-value">{asset.assigned_user?.name ? <strong>{asset.assigned_user.name}</strong> : <em style={{ color: '#9CA3AF' }}>Unassigned / Shared Pool</em>}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Plant / Office</span>
            <span className="info-value">{asset.location.plant_office}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Building / Room</span>
            <span className="info-value">{asset.location.building} (Room {asset.location.room || 'N/A'})</span>
          </div>
          <div className="info-item">
            <span className="info-label">Floor / Rack Placement</span>
            <span className="info-value">Floor {asset.location.floor || 'N/A'} • Rack {asset.location.rack || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* GOVERNANCE & LIFECYCLE */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Governance & Lifecycle Dates</div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Security Classification</span>
            <span className="info-value">
              <select 
                className="form-input" 
                value={asset.security_classification}
                style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', display: 'inline-block', fontWeight: 600 }}
                disabled={!isL2Admin}
                onChange={async (e) => {
                  await updateAssetClassification(e.target.value);
                }}
              >
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
              </select>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Business Criticality</span>
            <span className="info-value" style={{ fontWeight: 600 }}>
              {asset.business_criticality}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Backup Status</span>
            <span className="info-value">
              {asset.backup_available ? (
                <span style={{ color: '#10B981', fontWeight: 500 }}>Available ({asset.backup_location})</span>
              ) : (
                <span style={{ color: '#DC2626' }}>No Backup Configured</span>
              )}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Purchase Date</span>
            <span className="info-value">{asset.purchase_date || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Warranty / AMC End Date</span>
            <span className="info-value" style={{ color: isExpired ? '#DC2626' : '#111827', fontWeight: isExpired ? 600 : 400 }}>
              {asset.warranty_end_date || 'N/A'} {isExpired && ' ⚠️'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">End-of-Support / EOL</span>
            <span className="info-value">{asset.end_of_support_date || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* RISK & COMPLIANCE */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title">Risk & Compliance</div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Vulnerability of Asset</span>
            <span className="info-value">{asset.known_vulnerabilities || 'None'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Any Deviation from Company Policy</span>
            <span className="info-value">{asset.policy_deviations || 'None'}</span>
          </div>
        </div>
      </div>

      {/* CRYPTOGRAPHIC TRANSACTION LEDGER TIMELINE */}
      <div className="card">
        <div className="card-title">Cryptographic History Timeline</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Changes Made</th>
                <th>Block Hash</th>
              </tr>
            </thead>
            <tbody>
              {auditLogsList.map((log: any) => {
                const diffs = JSON.parse(log.field_diffs || '{}');
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatToIST(log.changed_at)}</td>
                    <td>{log.changed_by_name}</td>
                    <td><span className="badge badge-public" style={{ padding: '2px 6px', fontSize: '10px' }}>{log.changed_by_role}</span></td>
                    <td>
                      <span className={`badge ${log.action === 'CREATE' ? 'badge-active' : log.action === 'TRANSFER' ? 'badge-warning-60' : 'badge-expired'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', maxWidth: '300px' }}>
                        {Object.keys(diffs).map((key) => {
                          const [oldVal, newVal] = diffs[key];
                          return (
                            <div key={key}>
                              • <strong style={{ color: '#4B5563' }}>{key}</strong>: {oldVal === null ? 'None' : String(oldVal)} → {String(newVal)}
                            </div>
                          );
                        })}
                        {Object.keys(diffs).length === 0 && 'No metadata changes recorded.'}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: '#9CA3AF' }} title={log.row_hash}>
                        {log.row_hash.substring(0, 12)}...
                      </code>
                    </td>
                  </tr>
                );
              })}
              {auditLogsList.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: '16px' }}>
                    No audit trails exist.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Transfer Modal Overlay */}
      {transferModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Transfer Asset: {asset.identifier}</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setTransferModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <p style={{ marginBottom: '16px', color: '#4B5563', fontSize: '13px' }}>
                You are transferring asset <strong>{asset.asset.name} ({asset.identifier})</strong>. This logs a cryptographic audit record signed with your credentials.
              </p>

              {transferError && (
                <div className="alert-box danger" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{transferError}</span>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Custodian/Assigned User *</label>
                <select 
                  className="form-input" 
                  value={transferForm.newUser} 
                  onChange={e => setTransferForm(p => ({ ...p, newUser: e.target.value }))}
                  required
                >
                  <option value="">Select Target User...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Installation Location *</label>
                <select 
                  className="form-input" 
                  value={transferForm.newLocation} 
                  onChange={e => setTransferForm(p => ({ ...p, newLocation: e.target.value }))}
                  required
                >
                  <option value="">Select Installation Location...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'}, Room {l.room || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Transfer Justification/Remarks *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px' }}
                  value={transferForm.reason} 
                  onChange={e => setTransferForm(p => ({ ...p, reason: e.target.value }))}
                  required
                  placeholder="State the regulatory justification or maintenance purpose..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Confirm password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={transferForm.password} 
                  onChange={e => setTransferForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="Enter your login password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTransferModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Authorize & Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Retire Modal Overlay */}
      {retireModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#DC2626' }}>Retire Asset: {asset.identifier}</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setRetireModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleRetireSubmit}>
              <p style={{ marginBottom: '16px', color: '#4B5563', fontSize: '13px' }}>
                <strong>WARNING:</strong> Retiring an asset is a permanent, non-reversible regulatory action. It indicates that the physical asset has been decommissioned, destroyed, or permanently taken offline.
              </p>

              {retireError && (
                <div className="alert-box danger" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{retireError}</span>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Decommission Remarks/Justification *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px' }}
                  value={retireForm.reason} 
                  onChange={e => setRetireForm(p => ({ ...p, reason: e.target.value }))}
                  required
                  placeholder="State decommissioning protocol followed..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Confirm password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={retireForm.password} 
                  onChange={e => setRetireForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="Enter your login password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRetireModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Permanent Retirement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssetDetails;
