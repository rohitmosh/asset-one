import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auditService } from '../../services/auditService';
import type { AuditLog } from '../../types';
import { formatToIST } from '../../utils/time';
import { Shield, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { currentUser, setGlobalLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchLogs = async () => {
    setGlobalLoading(true);
    try {
      const data = await auditService.list();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await auditService.verifyIntegrity();
      setIntegrityStatus(res);
    } catch (e: any) {
      alert(e.message || 'Verification execution failed.');
    } finally {
      setVerifying(false);
    }
  };

  const isL1Admin = currentUser?.role.name === 'L1_ADMIN';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Audit Ledger & Integrity</h1>
        <p style={{ color: '#4B5563' }}>Immutable digital chain recording system transactions and asset transitions.</p>
      </div>

      {/* INTEGRITY CHECKER CARD FOR L1 ADMIN */}
      {isL1Admin && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Cryptographic Blockchain-Style Verification</span>
            <button 
              className="btn btn-primary" 
              onClick={handleVerifyIntegrity} 
              disabled={verifying}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {verifying ? (
                <RefreshCw size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Shield size={16} />
              )}
              <span>{verifying ? 'Verifying...' : 'Verify Hash Chain Integrity'}</span>
            </button>
          </div>
          <p style={{ color: '#4B5563', marginBottom: '16px', fontSize: '13px' }}>
            Iterates through the entire audit database sequentially, verifying row hash connections (`row_hash` computed over previous record's `row_hash` + fields) to detect direct SQL modifications or deletions.
          </p>

          {integrityStatus && (
            <div className={`alert-box ${integrityStatus.status === 'healthy' ? 'success' : 'danger'}`}>
              {integrityStatus.status === 'healthy' ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle size={24} style={{ color: '#10B981', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#065F46' }}>Verification Passed Successfully!</h4>
                    <p style={{ fontSize: '13px', marginTop: '4px', color: '#047857' }}>
                      Verified <strong>{integrityStatus.total_records}</strong> audit block entries. Cryptographic link integrity checks are healthy. No tampering detected.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, color: '#991B1B' }}>Ledger Tampering Detected!</h4>
                    <p style={{ fontSize: '13px', marginTop: '4px', color: '#B91C1C' }}>
                      <strong>Reason:</strong> {integrityStatus.reason}<br />
                      <strong>Failing Entry:</strong> Log ID #{integrityStatus.failed_at_log_id} at {formatToIST(integrityStatus.timestamp)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOGS LIST */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>System Activity Ledger</h2>
          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={fetchLogs}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Asset ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Changes Log</th>
                <th>Block Hash Link</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const diffs = JSON.parse(log.field_diffs || '{}');
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatToIST(log.changed_at)}</td>
                    <td>
                      {log.asset_instance_id ? (
                        <strong>Asset #{log.asset_instance_id}</strong>
                      ) : (
                        <span style={{ color: '#6B7280', fontStyle: 'italic' }}>Registry-level</span>
                      )}
                    </td>
                    <td>
                      <div>{log.changed_by_name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{log.changed_by_role}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action === 'CREATE' ? 'badge-active'
                        : log.action === 'TRANSFER' ? 'badge-warning-60'
                        : log.action === 'SNAPSHOT' ? 'badge-info'
                        : 'badge-expired'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', maxWidth: '350px' }}>
                        {Object.keys(diffs).map((key) => {
                          const [oldVal, newVal] = diffs[key];
                          return (
                            <div key={key}>
                              • <strong>{key}</strong>: {oldVal === null ? 'None' : String(oldVal)} → {String(newVal)}
                            </div>
                          );
                        })}
                        {Object.keys(diffs).length === 0 && 'Metadata updated'}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: '#9CA3AF' }} title={log.row_hash}>
                        {log.row_hash.substring(0, 16)}...
                      </code>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>
                    No audit records loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditLogs;
