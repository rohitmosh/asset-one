import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Layers, 
  History, 
  Settings, 
  Users, 
  User, 
  Lock, 
  Unlock, 
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { currentUser, logout } = useAuth();
  const [sidebarLocked, setSidebarLocked] = useState<boolean>(true);
  const [sidebarHovered, setSidebarHovered] = useState<boolean>(false);

  if (!currentUser) return null;

  const isNavActive = (view: string) => {
    if (view === currentView) return 'sidebar-nav-item active';
    return 'sidebar-nav-item';
  };

  const isAdmin = currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN';

  return (
    <aside 
      className={`app-sidebar ${(!sidebarLocked && !sidebarHovered) ? 'collapsed' : ''}`}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      <div className="sidebar-logo">
        <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '14px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}>A1</div>
        <div className="sidebar-logo-text-container">
          <div className="sidebar-logo-text">AssetOne</div>
          <div className="sidebar-logo-sub">Enterprise Governance</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className={isNavActive('assets')} onClick={() => setCurrentView('assets')}>
          <Layers size={18} />
          <span>Asset Registry</span>
        </div>

        {isAdmin && (
          <div className={isNavActive('snapshots')} onClick={() => setCurrentView('snapshots')}>
            <Shield size={18} />
            <span>Registry Snapshots</span>
          </div>
        )}


        {isAdmin && (
          <div className={isNavActive('audit')} onClick={() => setCurrentView('audit')}>
            <History size={18} />
            <span>Audit Logs</span>
          </div>
        )}

        {isAdmin && (
          <div className={isNavActive('settings')} onClick={() => setCurrentView('settings')}>
            <Settings size={18} />
            <span>Settings & Security</span>
          </div>
        )}

        {isAdmin && (
          <div className={isNavActive('users')} onClick={() => setCurrentView('users')}>
            <Users size={18} />
            <span>User Management</span>
          </div>
        )}

        <div className={isNavActive('profile')} onClick={() => setCurrentView('profile')}>
          <User size={18} />
          <span>My Profile</span>
        </div>
      </nav>
      <div className="sidebar-toggle">
        <div className="sidebar-nav-item" onClick={() => setSidebarLocked(!sidebarLocked)}>
          {sidebarLocked ? <Lock size={18} /> : <Unlock size={18} />}
          <span>{sidebarLocked ? 'Lock Sidebar' : 'Auto-Collapse'}</span>
        </div>
      </div>
      <div className="sidebar-logout">
        <div className="sidebar-nav-item" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }} onClick={logout}>
          <LogOut size={18} />
          <span>Log Out</span>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
