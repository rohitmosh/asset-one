import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { snapshotService } from '../../services/snapshotService';
import type { RegistrySnapshot } from '../../types';
import { formatToIST } from '../../utils/time';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  CheckCircle, 
  Plus, 
  RefreshCw, 
  Lock,
  AlertCircle 
} from 'lucide-react';

export const Snapshots: React.FC = () => {
  const { setGlobalLoading } = useAuth();
  const [snapshots, setSnapshots] = useState<RegistrySnapshot[]>([]);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signForm, setSignForm] = useState({ remarks: '', password: '' });
  const [signError, setSignError] = useState('');

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const fetchSnapshots = async () => {
    setGlobalLoading(true);
    try {
      const data = await snapshotService.list();
      setSnapshots(data);
    } catch (e) {
      console.error('Failed to load snapshots', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signForm.password) {
      setSignError('Password confirmation is required.');
      return;
    }
    setSignError('');
    setGlobalLoading(true);
    try {
      await snapshotService.create({
        remarks: signForm.remarks || undefined,
        password_confirm: signForm.password
      });
      alert('Registry snapshot generated and signed successfully.');
      setSignModalOpen(false);
      setSignForm({ remarks: '', password: '' });
      fetchSnapshots();
    } catch (err: any) {
      setSignError(err.message || 'Failed to sign registry snapshot.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleVerifySnapshot = async (id: string) => {
    setGlobalLoading(true);
    try {
      const res = await snapshotService.verify(id);
      setVerificationResult(res);
      setVerifyModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to verify snapshot signature.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDownload = (id: string) => {
    const url = snapshotService.getDownloadUrl(id);
    window.open(url, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Registry Snapshots</h1>
          <p style={{ color: '#4B5563' }}>Cryptographically signed states of the asset registry for non-repudiation auditing.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setSignError('');
            setSignForm({ remarks: '', password: '' });
            setSignModalOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Generate Signed Snapshot</span>
        </button>
      </div>

      {/* SNAPSHOTS TABLE */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Signed Snapshots Manifests</h2>
          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={fetchSnapshots}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>Snapshot ID</th>
                <th>Signer</th>
                <th>Asset Count</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap) => (
                <tr key={snap.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatToIST(snap.timestamp_ist)}</td>
                  <td>
                    <code>{snap.snapshot_id.substring(0, 16)}...</code>
                  </td>
                  <td>
                    <div>{snap.signer_name}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{snap.signer_role} • {snap.signer_department}</div>
                  </td>
                  <td>
                    <strong>{snap.asset_count} assets</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>{snap.remarks || <em style={{ color: '#9CA3AF' }}>No remarks</em>}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '12px', color: '#7c3aed', borderColor: '#ddd' }}
                        onClick={() => handleVerifySnapshot(snap.snapshot_id)}
                      >
                        <ShieldCheck size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        <span>Verify</span>
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => handleDownload(snap.snapshot_id)}
                      >
                        <Download size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {snapshots.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px' }}>
                    No signed snapshots generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIGN SNAPSHOT MODAL */}
      {signModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Sign Registry Snapshot</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSignModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSignSubmit}>
              <p style={{ marginBottom: '16px', color: '#4B5563', fontSize: '13px' }}>
                Generates a cryptographically signed snapshot of the entire active asset registry list. The snapshot includes an HMAC-SHA256 signature calculated using your credentials, confirming registry completeness and preventing future alteration.
              </p>

              {signError && (
                <div className="alert-box danger" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{signError}</span>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Remarks / Snapshot Purpose</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px' }}
                  value={signForm.remarks} 
                  onChange={e => setSignForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="e.g. End of Q2 System Inventory audit"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Verify password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={signForm.password} 
                  onChange={e => setSignForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="Enter your login password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSignModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} />
                  <span>Sign & Publish Manifest</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY SIGNATURE MODAL */}
      {verifyModalOpen && verificationResult && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Signature Verification Result</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setVerifyModalOpen(false)}>✕</button>
            </div>
            <div>
              {verificationResult.status === 'valid' ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '6px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <CheckCircle size={24} style={{ color: '#059669', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ fontWeight: 600, color: '#065f46', fontSize: '15px' }}>Signature Integrity Validated</h3>
                    <p style={{ color: '#047857', fontSize: '13px', marginTop: '4px' }}>
                      The HMAC-SHA256 signature is fully valid. This matches the exact database-state manifest generated on the timestamp below. Non-repudiation is confirmed.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '6px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <ShieldAlert size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ fontWeight: 600, color: '#991b1b', fontSize: '15px' }}>Signature Invalid / Altered</h3>
                    <p style={{ color: '#b91c1c', fontSize: '13px', marginTop: '4px' }}>
                      <strong>Warning:</strong> The reconstructed manifest hash does not match the signed HMAC key! Reason: {verificationResult.reason}.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Snapshot ID:</span>
                  <code>{verificationResult.snapshot_id}</code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Signer Profile:</span>
                  <strong>{verificationResult.signer_name} ({verificationResult.signer_role})</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Signer Department:</span>
                  <span>{verificationResult.signer_department} (Emp ID: {verificationResult.signer_employee_id})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Date Signed:</span>
                  <span>{formatToIST(verificationResult.timestamp_ist)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Registry Asset Count:</span>
                  <strong>{verificationResult.asset_count} assets</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Data Fingerprint:</span>
                  <code style={{ fontSize: '11px' }}>{verificationResult.data_hash}</code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                  <span style={{ color: '#6B7280' }}>Chain Anchor Hash:</span>
                  <code style={{ fontSize: '11px' }}>{verificationResult.chain_anchor}</code>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={() => setVerifyModalOpen(false)}>Close Results</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Snapshots;
