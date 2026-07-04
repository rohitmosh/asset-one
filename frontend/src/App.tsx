import React, { useState } from 'react';
import LandingPage from './LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AssetRegistry } from './features/registry/AssetRegistry';
import { AssetDetails } from './features/registry/AssetDetails';
import { AssetWizard } from './features/registry/AssetWizard';
import { Snapshots } from './features/snapshots/Snapshots';
import { AuditLogs } from './features/audit/AuditLogs';
import { Settings } from './features/settings/Settings';
import { UserProfile } from './features/profile/UserProfile';
import { UserManagement } from './features/users/UserManagement';

import './index.css';

const MainApp: React.FC = () => {
  const { token, currentUser, login } = useAuth();
  const [currentView, setCurrentView] = useState<string>('assets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [editAssetTarget, setEditAssetTarget] = useState<any | null>(null);

  if (!token || !currentUser) {
    return <LandingPage onLoginSuccess={login} />;
  }

  const navigateToView = (view: string) => {
    setCurrentView(view);
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'assets':
        return (
          <AssetRegistry 
            onViewDetails={(id) => {
              setSelectedAssetId(id);
              navigateToView('asset-details');
            }}
            onAddAsset={() => {
              navigateToView('add-asset');
            }}
            onEditAsset={(asset) => {
              setEditAssetTarget(asset);
              navigateToView('edit-asset');
            }}
          />
        );
      case 'asset-details':
        return selectedAssetId ? (
          <AssetDetails 
            assetId={selectedAssetId} 
            onBack={() => navigateToView('assets')}
            onViewDetails={(id) => {
              setSelectedAssetId(id);
            }}
          />
        ) : null;
      case 'add-asset':
        return (
          <AssetWizard 
            mode="create" 
            onBack={() => navigateToView('assets')}
            onComplete={() => navigateToView('assets')}
          />
        );
      case 'edit-asset':
        return editAssetTarget ? (
          <AssetWizard 
            mode="edit" 
            editAssetTarget={editAssetTarget}
            onBack={() => navigateToView('assets')}
            onComplete={() => navigateToView('assets')}
          />
        ) : null;
      case 'snapshots':
        return <Snapshots />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <UserManagement />;
      case 'profile':
        return <UserProfile />;
      default:
        return (
          <AssetRegistry 
            onViewDetails={(id) => {
              setSelectedAssetId(id);
              navigateToView('asset-details');
            }}
            onAddAsset={() => {
              navigateToView('add-asset');
            }}
            onEditAsset={(asset) => {
              setEditAssetTarget(asset);
              navigateToView('edit-asset');
            }}
          />
        );
    }
  };

  return (
    <DashboardLayout 
      currentView={currentView} 
      setCurrentView={setCurrentView} 
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
