import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import type { UserProfile } from '../../types';
import { Plus, Trash2, Eye } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { currentUser, setGlobalLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Create state
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    roleId: '3', // Default to User
    department: '',
    employeeId: '',
  });

  // Selected detail overlay
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    setGlobalLoading(true);
    try {
      const data = await userService.list();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users list', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.password || !newUserForm.name || !newUserForm.email || !newUserForm.department || !newUserForm.employeeId) {
      alert('Please fill out all required fields.');
      return;
    }
    setGlobalLoading(true);
    try {
      await userService.create({
        username: newUserForm.username,
        password: newUserForm.password,
        name: newUserForm.name,
        email: newUserForm.email,
        role_id: parseInt(newUserForm.roleId),
        department: newUserForm.department,
        employee_id: newUserForm.employeeId,
      });
      alert(`User "${newUserForm.name}" registered successfully.`);
      setNewUserForm({
        username: '',
        password: '',
        name: '',
        email: '',
        roleId: '3',
        department: '',
        employeeId: '',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to register employee');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    setGlobalLoading(true);
    try {
      await userService.delete(userId);
      alert('User deleted successfully.');
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>User Management</h1>
        <p style={{ color: '#4B5563' }}>Admin control panel for managing employee portal users and access controls.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* USERS LIST */}
        <div className="card" style={{ padding: 0, flex: '2 1 500px' }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Active Portal Users</span>
            <span className="badge" style={{ backgroundColor: '#7c3aed', color: 'white' }}>{users.length} Total</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.employee_id}</strong></td>
                    <td>{u.name}</td>
                    <td><code>{u.username}</code></td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge" style={{ 
                        backgroundColor: u.role.name === 'L1_ADMIN' ? 'rgba(124,58,237,0.1)' : u.role.name === 'L2_ADMIN' ? 'rgba(56,189,248,0.1)' : 'rgba(74,222,128,0.1)',
                        color: u.role.name === 'L1_ADMIN' ? '#7c3aed' : u.role.name === 'L2_ADMIN' ? '#0284c7' : '#16a34a',
                        fontWeight: 600
                      }}>
                        {u.role.name}
                      </span>
                    </td>
                    <td>{u.department}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setSelectedUser(u)}>
                          <Eye size={14} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }} 
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REGISTRATION FORM */}
        <div className="card" style={{ flex: '1 1 300px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Register Employee / User</h2>
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label">Username *</label>
              <input type="text" className="form-input" required value={newUserForm.username} onChange={e => setNewUserForm(prev => ({ ...prev, username: e.target.value }))} placeholder="e.g. a.patel" />
            </div>
            <div>
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" required value={newUserForm.password} onChange={e => setNewUserForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Password" />
            </div>
            <div>
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" required value={newUserForm.name} onChange={e => setNewUserForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Anand Patel" />
            </div>
            <div>
              <label className="form-label">Email Contact *</label>
              <input type="email" className="form-input" required value={newUserForm.email} onChange={e => setNewUserForm(prev => ({ ...prev, email: e.target.value }))} placeholder="e.g. a.patel@ohpc.in" />
            </div>
            <div>
              <label className="form-label">Access Role *</label>
              <select className="form-input" value={newUserForm.roleId} onChange={e => setNewUserForm(prev => ({ ...prev, roleId: e.target.value }))}>
                <option value="1">L1 Admin (Settings & Audit Logs)</option>
                <option value="2">L2 Admin (Asset Custodian)</option>
                <option value="3">User (Read-only Assigned)</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label">Department *</label>
                <input type="text" className="form-input" required value={newUserForm.department} onChange={e => setNewUserForm(prev => ({ ...prev, department: e.target.value }))} placeholder="e.g. IT" />
              </div>
              <div>
                <label className="form-label">Employee ID *</label>
                <input type="text" className="form-input" required value={newUserForm.employeeId} onChange={e => setNewUserForm(prev => ({ ...prev, employeeId: e.target.value }))} placeholder="e.g. EMP443" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
              <Plus size={16} />
              <span>Register Employee</span>
            </button>
          </form>
        </div>
      </div>

      {/* SELECTED USER DETAIL OVERLAY */}
      {selectedUser && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Employee Details</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 }}>
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{selectedUser.name}</h3>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '2px 6px' }}>{selectedUser.role.name}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: '#6B7280' }}>Employee ID:</span>
                <strong>{selectedUser.employee_id}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: '#6B7280' }}>Username:</span>
                <code>{selectedUser.username}</code>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: '#6B7280' }}>Email Contact:</span>
                <span>{selectedUser.email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: '#6B7280' }}>Department:</span>
                <span>{selectedUser.department}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagement;
