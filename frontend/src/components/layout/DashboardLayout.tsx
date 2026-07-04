import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  children
}) => {
  return (
    <div className="app-container">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <Header currentView={currentView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="app-content">
        {children}
      </main>
    </div>
  );
};
export default DashboardLayout;
