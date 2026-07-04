import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, LogOut, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, searchQuery, setSearchQuery }) => {
  const { currentUser, logout, globalLoading } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  if (!currentUser) return null;

  return (
    <header className="app-header">
      {currentView === 'assets' ? (
        <div className="header-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search identifier, serial, manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {globalLoading && (
            <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={12} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              Loading...
            </span>
          )}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div 
        className="header-user" 
        style={{ position: 'relative', cursor: 'pointer' }} 
        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
      >
        <div className="user-info" style={{ textAlign: 'right' }}>
          <span className="user-name">{currentUser.name}</span>
          <span className="user-role">{currentUser.department} • <strong style={{ color: '#7c3aed' }}>{currentUser.role.name}</strong></span>
        </div>
        <div className="user-avatar" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', fontWeight: 700 }}>
          {currentUser.name.charAt(0)}
        </div>
        {userDropdownOpen && (
          <div className="user-dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <div className="user-dropdown-header">Account Options</div>
            <div 
              className="user-dropdown-item" 
              onClick={() => {
                logout();
                setUserDropdownOpen(false);
              }}
              style={{ color: '#EF4444' }}
            >
              <div className="item-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={14} />
                <span>Sign Out</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
export default Header;
