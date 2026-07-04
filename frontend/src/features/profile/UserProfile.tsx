import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Award, Landmark } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'L1_ADMIN':
        return 'badge-restricted';
      case 'L2_ADMIN':
        return 'badge-confidential';
      default:
        return 'badge-active';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Profile</h1>
        <p style={{ color: '#4B5563' }}>Your personal employee details and EAMS access level</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700 }}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#111827' }}>{currentUser.name}</h2>
            <p style={{ color: '#4B5563', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Landmark size={14} />
              <span>{currentUser.department} Department</span>
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500 }}>Employee ID:</span>
            <strong style={{ color: '#111827' }}>{currentUser.employee_id}</strong>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500 }}>Username:</span>
            <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>{currentUser.username}</code>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500 }}>Email Address:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} style={{ color: '#6B7280' }} />
              <span>{currentUser.email}</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', fontSize: '14px' }}>
            <span style={{ color: '#6B7280', fontWeight: 500 }}>Access Group / Role:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} style={{ color: '#7c3aed' }} />
              <span className={`badge ${getRoleBadge(currentUser.role.name)}`}>
                {currentUser.role.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default UserProfile;
