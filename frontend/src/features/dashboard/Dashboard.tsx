import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { AlertCircle, ShieldAlert, Calendar, Layout, Database, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await reportService.getSummary();
        setStats(data);
      } catch (e) {
        console.error('Failed to load dashboard statistics', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!stats) {
    return <div className="card text-center" style={{ padding: '24px' }}>Failed to retrieve registry statistics.</div>;
  }

  const totalWarranties = stats.warranty_healthy + stats.warranty_30_days + stats.warranty_60_days + stats.warranty_expired;
  const healthyPct = totalWarranties > 0 ? Math.round((stats.warranty_healthy / totalWarranties) * 100) : 100;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>OHPC Asset Dashboard</h1>
        <p style={{ color: '#4B5563' }}>Real-time overview of digital IT and OT infrastructure health and security governance.</p>
      </div>

      {/* METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124,58,237,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#7c3aed' }}>
            <Layout size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Total Assets</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{stats.total}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6' }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Hardware Count</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{stats.hardware}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Software Licenses</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{stats.software}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderLeft: stats.governance_issues > 0 ? '4px solid #EF4444' : '1px solid #E5E7EB' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stats.governance_issues > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(243,244,246,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: stats.governance_issues > 0 ? '#EF4444' : '#6B7280' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Governance Gaps</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: stats.governance_issues > 0 ? '#EF4444' : '#111827' }}>{stats.governance_issues}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* WARRANTY STATUS CARD */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: '#7c3aed' }} />
            <span>Warranty & AMC Expiry Status</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '8px solid #f3f3f3', borderTop: `8px solid ${healthyPct > 70 ? '#10b981' : '#f59e0b'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              {healthyPct}%
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Active Coverage</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Percent of assets currently covered under supplier warranty or service SLA contracts.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></span>
                Expired
              </span>
              <strong style={{ fontSize: '14px' }}>{stats.warranty_expired}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F97316' }}></span>
                Expiring in ≤30 Days
              </span>
              <strong style={{ fontSize: '14px' }}>{stats.warranty_30_days}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span>
                Expiring in ≤60 Days
              </span>
              <strong style={{ fontSize: '14px' }}>{stats.warranty_60_days}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></span>
                Healthy / Covered
              </span>
              <strong style={{ fontSize: '14px' }}>{stats.warranty_healthy}</strong>
            </div>
          </div>
        </div>

        {/* GOVERNANCE SUMMARY CARD */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: '#F59E0B' }} />
            <span>Support & Policy Compliance</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                <span>End-of-Support (EOS) Expired</span>
                <span style={{ color: stats.eos_expired > 0 ? '#EF4444' : '#10B981' }}>{stats.eos_expired} Assets</span>
              </div>
              <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', marginTop: '6px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#EF4444', width: `${stats.total > 0 ? Math.min((stats.eos_expired / stats.total) * 100, 100) : 0}%` }}></div>
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Assets running with no manufacturer security patches or firmware updates.</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                <span>EOS Impending (≤60 Days)</span>
                <span style={{ color: stats.eos_warning > 0 ? '#F97316' : '#10B981' }}>{stats.eos_warning} Assets</span>
              </div>
              <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', marginTop: '6px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#F97316', width: `${stats.total > 0 ? Math.min((stats.eos_warning / stats.total) * 100, 100) : 0}%` }}></div>
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Assets scheduled for support decommission soon. Replacements should be ordered.</div>
            </div>
          </div>
        </div>
      </div>

      {/* DISTRIBUTION DETAIL GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* GROUP DISTRIBUTION */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Assets by Category Group</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
            {stats.group_distribution.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '20px' }}>No category data available</div>
            ) : (
              stats.group_distribution.map((item: any, idx: number) => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: '#374151' }}>{item.group}</span>
                      <span style={{ color: '#6B7280' }}>{item.value} ({pct}%)</span>
                    </div>
                    <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px' }}>
                      <div style={{ height: '100%', background: '#7c3aed', borderRadius: '2px', width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LOCATION DISTRIBUTION */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Assets by Operational Location</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
            {stats.location_distribution.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '20px' }}>No location data available</div>
            ) : (
              stats.location_distribution.map((item: any, idx: number) => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: '#374151' }}>{item.location}</span>
                      <span style={{ color: '#6B7280' }}>{item.value} ({pct}%)</span>
                    </div>
                    <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px' }}>
                      <div style={{ height: '100%', background: '#10b981', borderRadius: '2px', width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
