import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Layers, 
  MapPin, 
  Calendar, 
  BarChart3, 
  History, 
  Settings, 
  LogOut, 
  Search, 
  Download, 
  Plus, 
  Eye, 
  Edit3, 
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  User,
  Users,
  AlertCircle,
  BookOpen,
  Lock,
  Unlock
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// Interfaces for structured data
interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  role: { name: string; permissions?: string };
  department: string;
  employee_id: string;
}

export default function App() {
  // Authentication & Routing State
  const [token, setToken] = useState<string | null>(localStorage.getItem('eams_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Routing State: "assets" | "asset-details" | "asset-add" | "directories" | "reports" | "audit" | "settings" | "profile"
  const [currentView, setCurrentView] = useState<string>('assets');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  // Custom states for directories, sidebar collapsing, and user switcher dropdown
  const [directoryTab, setDirectoryTab] = useState<'ownership' | 'locations'>('ownership');
  const [sidebarLocked, setSidebarLocked] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Global Lookups / Cache
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [assetGroups, setAssetGroups] = useState<any[]>([]);
  const [assetsTaxonomy, setAssetsTaxonomy] = useState<any[]>([]);

  // Asset Registry List State
  const [assets, setAssets] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    typeId: '',
    groupId: '',
    assetId: '',
    criticality: '',
    classification: '',
    status: '',
    search: ''
  });

  // Loading States
  const [globalLoading, setGlobalLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);

  // E-Signature / Transfer Modals State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transferForm, setTransferForm] = useState({
    newUser: '',
    newLocation: '',
    reason: '',
    password: ''
  });
  const [transferError, setTransferError] = useState('');

  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [retireReason, setRetireReason] = useState('');
  const [retirePassword, setRetirePassword] = useState('');
  const [retireError, setRetireError] = useState('');

  // Add Asset Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    typeId: '',
    groupId: '',
    assetId: '',
    identifier: '',
    description: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    ownerId: '',
    custodianId: '',
    assignedUserId: '',
    locationId: '',
    securityClassification: 'Internal',
    businessCriticality: 'Medium',
    purchaseDate: '',
    installationDate: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
    endOfLifeDate: '',
    endOfSupportDate: '',
    policyDeviations: '',
    knownVulnerabilities: '',
    remarks: '',
    backupAvailable: false,
    backupLocation: '',
    backupOwnerId: ''
  });
  const [wizardError, setWizardError] = useState('');

  // Settings Panel Add-Taxonomy State
  const [newGroupType, setNewGroupType] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newAssetGroup, setNewAssetGroup] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newLocationForm, setNewLocationForm] = useState({
    plant: '',
    building: '',
    floor: '',
    room: '',
    rack: ''
  });
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    roleId: '3', // Default USER
    department: '',
    employeeId: ''
  });

  // Verify token on initial load
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    }
  }, [token]);

  // Fetch contextual lookups when authenticated
  useEffect(() => {
    if (currentUser) {
      fetchLookups();
      fetchDashboardStats();
      fetchAssetRegistry();
    }
  }, [currentUser]);

  // Handle auto-identifier retrieval in wizard step transitions
  useEffect(() => {
    if (wizardStep === 2 && wizardForm.assetId) {
      fetchNextIdentifier(wizardForm.assetId);
    }
  }, [wizardStep, wizardForm.assetId]);

  // Refresh asset listing when filters change
  useEffect(() => {
    if (currentUser) {
      fetchAssetRegistry();
    }
  }, [filters]);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser(userData);
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('eams_token', data.access_token);
        setToken(data.access_token);
      } else {
        const err = await res.json();
        setLoginError(err.detail || 'Authentication failed');
      }
    } catch (e) {
      setLoginError('Unable to connect to EAMS server.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eams_token');
    setToken(null);
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setCurrentView('assets');
  };

  const handleSwitchUser = async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('eams_token', data.access_token);
        setToken(data.access_token);
        await fetchCurrentUser(data.access_token);
        setCurrentView('assets');
      }
    } catch (e) {
      console.error('Failed to switch user', e);
    }
  };

  const updateAssetClassification = async (assetId: number, newClassification: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ security_classification: newClassification })
      });
      if (res.ok) {
        fetchAssetRegistry();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to update security classification');
      }
    } catch (e) {
      console.error('Failed to update security classification', e);
    }
  };

  const fetchLookups = async () => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [uRes, lRes, tRes, gRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/api/users`, { headers }),
        fetch(`${API_BASE}/api/locations`, { headers }),
        fetch(`${API_BASE}/api/taxonomy/types`, { headers }),
        fetch(`${API_BASE}/api/taxonomy/groups`, { headers }),
        fetch(`${API_BASE}/api/taxonomy/assets`, { headers })
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (lRes.ok) setLocations(await lRes.json());
      if (tRes.ok) setAssetTypes(await tRes.json());
      if (gRes.ok) setAssetGroups(await gRes.json());
      if (aRes.ok) setAssetsTaxonomy(await aRes.json());
    } catch (e) {
      console.error('Failed to load global lookups', e);
    }
  };

  const fetchDashboardStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/reports/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDashboardStats(await res.json());
      }
    } catch (e) {
      console.error('Failed to load dashboard statistics', e);
    }
  };

  const fetchAssetRegistry = async () => {
    if (!token) return;
    setGlobalLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.typeId) queryParams.append('type_id', filters.typeId);
      if (filters.groupId) queryParams.append('group_id', filters.groupId);
      if (filters.assetId) queryParams.append('asset_id', filters.assetId);
      if (filters.criticality) queryParams.append('criticality', filters.criticality);
      if (filters.classification) queryParams.append('classification', filters.classification);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const res = await fetch(`${API_BASE}/api/assets?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAssets(await res.json());
      }
    } catch (e) {
      console.error('Failed to load assets', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  const fetchNextIdentifier = async (assetId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/taxonomy/next-identifier?asset_id=${assetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWizardForm(prev => ({ ...prev, identifier: data.identifier }));
      }
    } catch (e) {
      console.error('Failed to generate next asset identifier', e);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/audit/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    }
  };

  const checkIntegrity = async () => {
    if (!token) return;
    setIntegrityStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/audit/integrity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIntegrityStatus(await res.json());
      }
    } catch (e) {
      setIntegrityStatus({ status: 'compromised', reason: 'Failed to establish connection to cryptographic validation engine.' });
    }
  };

  // Submit asset creation wizard
  const handleCreateAsset = async () => {
    if (!token) return;
    setWizardError('');
    try {
      const body = {
        asset_id: parseInt(wizardForm.assetId),
        identifier: wizardForm.identifier,
        description: wizardForm.description,
        manufacturer: wizardForm.manufacturer,
        model_number: wizardForm.modelNumber,
        serial_number: wizardForm.serialNumber,
        owner_id: parseInt(wizardForm.ownerId),
        custodian_id: parseInt(wizardForm.custodianId),
        assigned_user_id: wizardForm.assignedUserId ? parseInt(wizardForm.assignedUserId) : null,
        location_id: parseInt(wizardForm.locationId),
        security_classification: wizardForm.securityClassification,
        business_criticality: wizardForm.businessCriticality,
        purchase_date: wizardForm.purchaseDate || null,
        installation_date: wizardForm.installationDate || null,
        warranty_start_date: wizardForm.warrantyStartDate || null,
        warranty_end_date: wizardForm.warrantyEndDate || null,
        end_of_life_date: wizardForm.endOfLifeDate || null,
        end_of_support_date: wizardForm.endOfSupportDate || null,
        policy_deviations: wizardForm.policyDeviations || null,
        known_vulnerabilities: wizardForm.knownVulnerabilities || null,
        remarks: wizardForm.remarks || null,
        backup_available: wizardForm.backupAvailable,
        backup_location: wizardForm.backupAvailable ? wizardForm.backupLocation : null,
        backup_owner_id: wizardForm.backupAvailable && wizardForm.backupOwnerId ? parseInt(wizardForm.backupOwnerId) : null,
        status: 'Active'
      };

      const res = await fetch(`${API_BASE}/api/assets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        // Reset wizard and return to listing
        setWizardStep(1);
        setWizardForm({
          typeId: '',
          groupId: '',
          assetId: '',
          identifier: '',
          description: '',
          manufacturer: '',
          modelNumber: '',
          serialNumber: '',
          ownerId: '',
          custodianId: '',
          assignedUserId: '',
          locationId: '',
          securityClassification: 'Internal',
          businessCriticality: 'Medium',
          purchaseDate: '',
          installationDate: '',
          warrantyStartDate: '',
          warrantyEndDate: '',
          endOfLifeDate: '',
          endOfSupportDate: '',
          policyDeviations: '',
          knownVulnerabilities: '',
          remarks: '',
          backupAvailable: false,
          backupLocation: '',
          backupOwnerId: ''
        });
        fetchDashboardStats();
        fetchAssetRegistry();
        setCurrentView('assets');
      } else {
        const err = await res.json();
        setWizardError(err.detail || 'Failed to register new asset');
      }
    } catch (e) {
      setWizardError('Failed to establish API handshake.');
    }
  };

  // Submit asset transfer
  const handleTransferSubmit = async () => {
    if (!token || !transferTarget) return;
    setTransferError('');
    try {
      const res = await fetch(`${API_BASE}/api/assets/${transferTarget.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_user_id: parseInt(transferForm.newUser),
          new_location_id: parseInt(transferForm.newLocation),
          reason: transferForm.reason,
          password_confirm: transferForm.password
        })
      });

      if (res.ok) {
        setTransferModalOpen(false);
        setTransferForm({ newUser: '', newLocation: '', reason: '', password: '' });
        fetchDashboardStats();
        fetchAssetRegistry();
        // View details to see updated activity logs
        viewAssetDetails(transferTarget.id);
      } else {
        const err = await res.json();
        setTransferError(err.detail || 'Transfer authorization failed.');
      }
    } catch (e) {
      setTransferError('Server connection failure.');
    }
  };

  // Submit asset retirement
  const handleRetireSubmit = async () => {
    if (!token || !selectedAssetId) return;
    setRetireError('');
    try {
      const res = await fetch(`${API_BASE}/api/assets/${selectedAssetId}/retire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_user_id: currentUser?.id || 0, // unused for retirement but matches transfer schema
          new_location_id: locations[0]?.id || 0, // unused but matches schema
          reason: retireReason,
          password_confirm: retirePassword
        })
      });

      if (res.ok) {
        setRetireModalOpen(false);
        setRetireReason('');
        setRetirePassword('');
        fetchDashboardStats();
        fetchAssetRegistry();
        viewAssetDetails(selectedAssetId);
      } else {
        const err = await res.json();
        setRetireError(err.detail || 'Retirement authorization failed.');
      }
    } catch (e) {
      setRetireError('Server connection failure.');
    }
  };

  // Settings Configuration updates
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupType || !newGroupName) return;
    try {
      const res = await fetch(`${API_BASE}/api/taxonomy/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ asset_type_id: parseInt(newGroupType), name: newGroupName })
      });
      if (res.ok) {
        setNewGroupType('');
        setNewGroupName('');
        fetchLookups();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error creating group');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetGroup || !newAssetName) return;
    try {
      const res = await fetch(`${API_BASE}/api/taxonomy/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ asset_group_id: parseInt(newAssetGroup), name: newAssetName })
      });
      if (res.ok) {
        setNewAssetGroup('');
        setNewAssetName('');
        fetchLookups();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error creating category');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plant_office: newLocationForm.plant,
          building: newLocationForm.building,
          floor: newLocationForm.floor || null,
          room: newLocationForm.room || null,
          rack: newLocationForm.rack || null
        })
      });
      if (res.ok) {
        setNewLocationForm({ plant: '', building: '', floor: '', room: '', rack: '' });
        fetchLookups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUserForm.username,
          password: newUserForm.password,
          name: newUserForm.name,
          email: newUserForm.email,
          role_id: parseInt(newUserForm.roleId),
          department: newUserForm.department,
          employee_id: newUserForm.employeeId
        })
      });
      if (res.ok) {
        setNewUserForm({ username: '', password: '', name: '', email: '', roleId: '3', department: '', employeeId: '' });
        fetchLookups();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error registering user');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper selectors
  const viewAssetDetails = (id: number) => {
    setSelectedAssetId(id);
    setCurrentView('asset-details');
  };

  const getActiveAsset = () => {
    return assets.find(a => a.id === selectedAssetId);
  };

  const triggerExport = () => {
    const queryParams = new URLSearchParams();
    if (filters.typeId) queryParams.append('type_id', filters.typeId);
    if (filters.groupId) queryParams.append('group_id', filters.groupId);
    if (filters.criticality) queryParams.append('criticality', filters.criticality);
    if (filters.classification) queryParams.append('classification', filters.classification);
    
    window.open(`${API_BASE}/api/reports/export?${queryParams.toString()}&jwt=${token || ''}`);
  };

  // Render auth view if token missing
  if (!token || !currentUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="user-avatar" style={{ margin: '0 auto 12px', width: '48px', height: '48px', fontSize: '20px' }}>⚡</div>
            <h1 className="login-title">OHPC Asset Portal</h1>
            <p className="login-subtitle">Secure access to Corporate Asset Governance</p>
          </div>
          <form onSubmit={handleLogin}>
            {loginError && (
              <div className="alert-box danger" style={{ fontSize: '12px', padding: '8px 12px' }}>
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                placeholder="e.g. custodian.it"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', height: '40px' }}>
              Secure Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active navigation checker
  const isNavActive = (view: string) => {
    if (view === currentView) return 'sidebar-nav-item active';
    return 'sidebar-nav-item';
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside 
        className={`app-sidebar ${(!sidebarLocked && !sidebarHovered) ? 'collapsed' : ''}`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="sidebar-logo">
          <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '14px', background: '#166534', color: 'white' }}>A1</div>
          <div className="sidebar-logo-text-container">
            <div className="sidebar-logo-text">AssetOne</div>
            <div className="sidebar-logo-sub">Enterprise Governance</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className={isNavActive('assets')} onClick={() => { setCurrentView('assets'); fetchAssetRegistry(); }}>
            <Layers size={18} />
            <span>Asset Registry</span>
          </div>
          <div className={isNavActive('directories')} onClick={() => { setCurrentView('directories'); }}>
            <BookOpen size={18} />
            <span>Directories</span>
          </div>
          
          {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
            <div className={isNavActive('audit')} onClick={() => { setCurrentView('audit'); fetchAuditLogs(); }}>
              <History size={18} />
              <span>Audit Logs</span>
            </div>
          )}

          {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
            <div className={isNavActive('settings')} onClick={() => { setCurrentView('settings'); setIntegrityStatus(null); }}>
              <Settings size={18} />
              <span>Settings & Security</span>
            </div>
          )}

          <div className={isNavActive('profile')} onClick={() => { setCurrentView('profile'); }}>
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
          <div className="sidebar-nav-item" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log Out</span>
          </div>
        </div>
      </aside>

      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="header-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search identifier, serial, manufacturer..." 
            value={filters.search}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, search: e.target.value }));
              if (currentView !== 'assets') setCurrentView('assets');
            }}
          />
        </div>
        <div className="header-user" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
          <div className="user-info" style={{ textAlign: 'right' }}>
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.department} • <strong style={{ color: '#22C55E' }}>{currentUser.role.name}</strong></span>
          </div>
          <div className="user-avatar" style={{ background: '#166534', color: 'white', fontWeight: 600 }}>{currentUser.name.charAt(0)}</div>
          {userDropdownOpen && (
            <div className="user-dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <div className="user-dropdown-header">Switch User (Demo Mode)</div>
              {users.map(u => (
                <div 
                  key={u.id} 
                  className={`user-dropdown-item ${u.username === currentUser.username ? 'active' : ''}`}
                  onClick={() => {
                    handleSwitchUser(u.username);
                    setUserDropdownOpen(false);
                  }}
                >
                  <div className="item-name">{u.name}</div>
                  <div className="item-role">{u.department} • {u.role.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* CORE VIEW LAYOUT */}
      <main className="app-content">
        


        {/* ==================== VIEW 2: ASSET REGISTRY ==================== */}
        {currentView === 'assets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Corporate Asset Registry</h1>
                <p style={{ color: '#4B5563' }}>Manage physical infrastructure and software deployment</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={triggerExport}>
                  <Download size={16} />
                  <span>Legacy Sheet Export</span>
                </button>
                {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
                  <button className="btn btn-primary" onClick={() => { setWizardStep(1); setCurrentView('asset-add'); }}>
                    <Plus size={16} />
                    <span>Register New Asset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Registry Search Filters (Cascading & Custom Badges) */}
            <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
              <div className="toolbar">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Asset Type</label>
                  <select 
                    className="form-select"
                    value={filters.typeId}
                    onChange={(e) => setFilters(prev => ({ ...prev, typeId: e.target.value, groupId: '', assetId: '' }))}
                  >
                    <option value="">All Types</option>
                    {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Asset Group</label>
                  <select 
                    className="form-select"
                    value={filters.groupId}
                    onChange={(e) => setFilters(prev => ({ ...prev, groupId: e.target.value, assetId: '' }))}
                    disabled={!filters.typeId}
                  >
                    <option value="">All Groups</option>
                    {assetGroups.filter(g => g.asset_type_id === parseInt(filters.typeId)).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Classification</label>
                  <select 
                    className="form-select"
                    value={filters.classification}
                    onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
                  >
                    <option value="">All Classes</option>
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Business Criticality</label>
                  <select 
                    className="form-select"
                    value={filters.criticality}
                    onChange={(e) => setFilters(prev => ({ ...prev, criticality: e.target.value }))}
                  >
                    <option value="">All Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <button 
                  className="btn btn-secondary" 
                  style={{ height: '38px' }}
                  onClick={() => setFilters({ typeId: '', groupId: '', assetId: '', criticality: '', classification: '', status: '', search: '' })}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Identifier</th>
                      <th>Asset Class / Type</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>Custodian</th>
                      <th>Criticality</th>
                      <th>Classification</th>
                      <th>AMC/Warranty End</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => {
                      const isExpired = asset.warranty_end_date && new Date(asset.warranty_end_date) < new Date();
                      return (
                        <tr key={asset.id}>
                          <td><strong>{asset.identifier}</strong></td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{asset.asset.name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>{asset.asset.asset_group.name}</div>
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {asset.description || 'No description provided'}
                            </div>
                          </td>
                          <td>{asset.location.plant_office}</td>
                          <td>{asset.custodian.name}</td>
                          <td>
                            <span style={{ 
                              color: asset.business_criticality === 'High' ? '#DC2626' : asset.business_criticality === 'Medium' ? '#D97706' : '#6B7280',
                              fontWeight: 600
                            }}>
                              {asset.business_criticality}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${asset.security_classification.toLowerCase()}`}>
                              {asset.security_classification}
                            </span>
                          </td>
                          <td>
                            <div style={{ color: isExpired ? '#DC2626' : '#111827', fontWeight: isExpired ? 600 : 400 }}>
                              {asset.warranty_end_date || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${asset.status === 'Active' ? 'badge-active' : 'badge-retired'}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => viewAssetDetails(asset.id)}>
                                <Eye size={14} />
                              </button>
                              {(currentUser.role.name === 'L1_ADMIN' || (currentUser.role.name === 'L2_ADMIN' && asset.custodian_id === currentUser.id)) && asset.status === 'Active' && (
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '12px', color: '#166534', borderColor: '#A7F3D0' }} 
                                  onClick={() => {
                                    setTransferTarget(asset);
                                    setTransferForm(prev => ({ ...prev, newLocation: asset.location_id.toString(), newUser: asset.assigned_user_id?.toString() || '' }));
                                    setTransferError('');
                                    setTransferModalOpen(true);
                                  }}
                                >
                                  Transfer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {assets.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                          No assets match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW 3: ADD ASSET WIZARD ==================== */}
        {currentView === 'asset-add' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Register New Digital Asset</h1>
              <p style={{ color: '#4B5563' }}>Create physical system registry mappings</p>
            </div>

            {/* Wizard Steps progress bar */}
            <div className="card">
              <div className="wizard-steps">
                <div className={`wizard-step ${wizardStep === 1 ? 'active' : wizardStep > 1 ? 'completed' : ''}`}>
                  <div className="step-indicator">1</div>
                  <span className="step-label">Classification</span>
                </div>
                <div className={`wizard-step ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : ''}`}>
                  <div className="step-indicator">2</div>
                  <span className="step-label">Specification</span>
                </div>
                <div className={`wizard-step ${wizardStep === 3 ? 'active' : wizardStep > 3 ? 'completed' : ''}`}>
                  <div className="step-indicator">3</div>
                  <span className="step-label">Ownership</span>
                </div>
                <div className={`wizard-step ${wizardStep === 4 ? 'active' : ''}`}>
                  <div className="step-indicator">4</div>
                  <span className="step-label">Lifecycle</span>
                </div>
              </div>

              {wizardError && (
                <div className="alert-box danger">
                  <AlertCircle size={20} />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* STEP 1: CLASSIFICATION */}
              {wizardStep === 1 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 1: Select Taxonomy Classification</h3>
                  <div className="form-group">
                    <label className="form-label">Asset Type</label>
                    <select 
                      className="form-select"
                      value={wizardForm.typeId}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, typeId: e.target.value, groupId: '', assetId: '' }))}
                    >
                      <option value="">Select Asset Type</option>
                      {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Asset Group</label>
                    <select 
                      className="form-select"
                      value={wizardForm.groupId}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, groupId: e.target.value, assetId: '' }))}
                      disabled={!wizardForm.typeId}
                    >
                      <option value="">Select Asset Group</option>
                      {assetGroups.filter(g => g.asset_type_id === parseInt(wizardForm.typeId)).map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Asset Category Name</label>
                    <select 
                      className="form-select"
                      value={wizardForm.assetId}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, assetId: e.target.value }))}
                      disabled={!wizardForm.groupId}
                    >
                      <option value="">Select Asset Category</option>
                      {assetsTaxonomy.filter(a => a.asset_group_id === parseInt(wizardForm.groupId)).map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={() => setCurrentView('assets')}>
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      disabled={!wizardForm.assetId}
                      onClick={() => setWizardStep(2)}
                    >
                      Next Step
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: TECHNICAL DETAILS */}
              {wizardStep === 2 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 2: Technical Specifications & Description</h3>
                  
                  <div className="form-group">
                    <label className="form-label">System Generated Asset ID (Assigned)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={wizardForm.identifier} 
                      disabled 
                      style={{ background: '#F3F4F6', fontWeight: 600 }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Asset Description / Metadata Details</label>
                    <textarea 
                      className="form-textarea" 
                      rows={3}
                      value={wizardForm.description}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Primary database server instance deployed at corporate HQ"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Manufacturer Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={wizardForm.manufacturer}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                        placeholder="e.g. Dell, Cisco, Hewlett Packard"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={wizardForm.modelNumber}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, modelNumber: e.target.value }))}
                        placeholder="e.g. ProLiant ML110 Gen10"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={wizardForm.serialNumber}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="e.g. SN-88324-X99"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>
                      Back
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setWizardStep(3)}
                    >
                      Next Step
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: OWNERSHIP & LOCATION */}
              {wizardStep === 3 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 3: Ownership Allocations & Locations</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Asset Owner (Department Head)</label>
                      <select 
                        className="form-select"
                        value={wizardForm.ownerId}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, ownerId: e.target.value }))}
                      >
                        <option value="">Select Owner</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Asset Custodian (Manager)</label>
                      <select 
                        className="form-select"
                        value={wizardForm.custodianId}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, custodianId: e.target.value }))}
                      >
                        <option value="">Select Custodian</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Assigned End User</label>
                      <select 
                        className="form-select"
                        value={wizardForm.assignedUserId}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, assignedUserId: e.target.value }))}
                      >
                        <option value="">None / Pool Asset</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Physical Location</label>
                      <select 
                        className="form-select"
                        value={wizardForm.locationId}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, locationId: e.target.value }))}
                      >
                        <option value="">Select Location</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'}, Room {l.room || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(2)}>
                      Back
                    </button>
                    <button 
                      className="btn btn-primary" 
                      disabled={!wizardForm.ownerId || !wizardForm.custodianId || !wizardForm.locationId}
                      onClick={() => setWizardStep(4)}
                    >
                      Next Step
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: GOVERNANCE & LIFECYCLE */}
              {wizardStep === 4 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 4: Security Classification & Lifecycles</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Security Classification</label>
                      <select 
                        className="form-select"
                        value={wizardForm.securityClassification}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, securityClassification: e.target.value }))}
                      >
                        <option value="Public">Public</option>
                        <option value="Internal">Internal</option>
                        <option value="Confidential">Confidential</option>
                        <option value="Restricted">Restricted</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Business Criticality Impact</label>
                      <select 
                        className="form-select"
                        value={wizardForm.businessCriticality}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, businessCriticality: e.target.value }))}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Purchase Date</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={wizardForm.purchaseDate}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">AMC / Warranty End Date</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={wizardForm.warrantyEndDate}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, warrantyEndDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">End-of-Life Date</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={wizardForm.endOfLifeDate}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, endOfLifeDate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End-of-Support Date</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={wizardForm.endOfSupportDate}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, endOfSupportDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Backup Info toggle */}
                  <div style={{ padding: '16px', background: '#FAFAFA', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', margin: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="backup_check"
                        checked={wizardForm.backupAvailable}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, backupAvailable: e.target.checked }))}
                      />
                      <label htmlFor="backup_check" style={{ fontWeight: 500 }}>System Backup Configuration Available</label>
                    </div>

                    {wizardForm.backupAvailable && (
                      <div className="form-row" style={{ marginTop: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Backup Target Location</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={wizardForm.backupLocation}
                            onChange={(e) => setWizardForm(prev => ({ ...prev, backupLocation: e.target.value }))}
                            placeholder="e.g. NAS server IP or offline vault code"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Backup Owner / Signee</label>
                          <select 
                            className="form-select"
                            value={wizardForm.backupOwnerId}
                            onChange={(e) => setWizardForm(prev => ({ ...prev, backupOwnerId: e.target.value }))}
                          >
                            <option value="">Select Backup Owner</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={() => setWizardStep(3)}>
                      Back
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleCreateAsset}
                    >
                      Save Asset Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== VIEW 4: ASSET DETAILS & HISTORY ==================== */}
        {currentView === 'asset-details' && getActiveAsset() && (() => {
          const asset = getActiveAsset();
          const isExpired = asset.warranty_end_date && new Date(asset.warranty_end_date) < new Date();
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setCurrentView('assets')}>
                    ←
                  </button>
                  <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                      Asset: {asset.identifier}
                      <span className={`badge ${asset.status === 'Active' ? 'badge-active' : 'badge-retired'}`} style={{ marginLeft: '12px', verticalAlign: 'middle' }}>
                        {asset.status}
                      </span>
                    </h1>
                    <p style={{ color: '#4B5563' }}>{asset.asset.name} • Serial: {asset.serial_number || 'N/A'}</p>
                  </div>
                </div>
                
                {asset.status === 'Active' && (currentUser.role.name === 'L1_ADMIN' || (currentUser.role.name === 'L2_ADMIN' && asset.custodian_id === currentUser.id)) && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => {
                      setTransferTarget(asset);
                      setTransferForm({ newUser: asset.assigned_user_id?.toString() || '', newLocation: asset.location_id.toString(), reason: '', password: '' });
                      setTransferError('');
                      setTransferModalOpen(true);
                    }}>
                      <RefreshCw size={16} />
                      <span>Transfer Asset</span>
                    </button>
                    <button className="btn btn-danger" onClick={() => {
                      setRetireError('');
                      setRetireReason('');
                      setRetirePassword('');
                      setRetireModalOpen(true);
                    }}>
                      <Trash2 size={16} />
                      <span>Retire Asset</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Classification Info grid */}
              <div className="card">
                <div className="card-title">Specification Overview</div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Asset Type</span>
                    <span className="info-value">{asset.asset.asset_group.asset_type.name}</span>
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
                  <div className="info-value" style={{ marginTop: '4px', background: '#F8FAFC', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    {asset.description || 'No description added.'}
                  </div>
                </div>
              </div>

              {/* Ownership & Location Grid */}
              <div className="card">
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

              {/* Governance & Lifecycle Grid */}
              <div className="card">
                <div className="card-title">Governance & Lifecycle Dates</div>
                <div className="info-grid" style={{ marginBottom: '20px' }}>
                  <div className="info-item">
                    <span className="info-label">Security Classification</span>
                    <span className="info-value">
                      <select 
                        className="form-select" 
                        value={asset.security_classification}
                        style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', display: 'inline-block', fontWeight: 600 }}
                        onChange={async (e) => {
                          const newClass = e.target.value;
                          await updateAssetClassification(asset.id, newClass);
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
                    <span className="info-value" style={{ fontWeight: 600, color: asset.business_criticality === 'High' ? '#DC2626' : '#111827' }}>
                      {asset.business_criticality}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Backup Status</span>
                    <span className="info-value">
                      {asset.backup_available ? (
                        <span style={{ color: '#15803D', fontWeight: 500 }}>Available ({asset.backup_location})</span>
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
                      {asset.warranty_end_date || 'N/A'} {isExpired && '⚠️'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End-of-Support / EOL</span>
                    <span className="info-value">{asset.end_of_support_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Change History Timeline (Chained logs) */}
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
                      {asset.audit_logs && asset.audit_logs.map((log: any, idx: number) => {
                        const diffs = JSON.parse(log.field_diffs || '{}');
                        return (
                          <tr key={log.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.changed_at).toLocaleString()}</td>
                            <td>{log.changed_by_name}</td>
                            <td><span className="badge badge-public">{log.changed_by_role}</span></td>
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
                      {(!asset.audit_logs || asset.audit_logs.length === 0) && (
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
            </div>
          );
        })()}

        {/* ==================== VIEW 5 & 6: COMBINED DIRECTORY ==================== */}
        {currentView === 'directories' && (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Directories</h1>
                <p style={{ color: '#4B5563' }}>
                  {directoryTab === 'ownership' 
                    ? 'Organizational hierarchy directory & custodians' 
                    : 'Physical plants, control rooms, and server racks'}
                </p>
              </div>
              <div className="segmented-control" style={{ display: 'inline-flex', background: '#E2E8F0', padding: '4px', borderRadius: '8px' }}>
                <button 
                  className={`btn ${directoryTab === 'ownership' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '13px', border: 'none', boxShadow: directoryTab === 'ownership' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  onClick={() => setDirectoryTab('ownership')}
                >
                  <Users size={16} style={{ marginRight: '6px' }} />
                  Ownership
                </button>
                <button 
                  className={`btn ${directoryTab === 'locations' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '13px', border: 'none', boxShadow: directoryTab === 'locations' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', marginLeft: '4px' }}
                  onClick={() => setDirectoryTab('locations')}
                >
                  <MapPin size={16} style={{ marginRight: '6px' }} />
                  Locations
                </button>
              </div>
            </div>

            {directoryTab === 'ownership' ? (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Email Contact</th>
                        <th>Department</th>
                        <th>Access Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.employee_id}</strong></td>
                          <td>{u.name}</td>
                          <td><code>{u.username}</code></td>
                          <td>{u.email}</td>
                          <td>{u.department}</td>
                          <td>
                            <span className={`badge ${u.role.name === 'L1_ADMIN' ? 'badge-restricted' : u.role.name === 'L2_ADMIN' ? 'badge-confidential' : 'badge-internal'}`}>
                              {u.role.name}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Plant / Office</th>
                        <th>Building Name</th>
                        <th>Floor Level</th>
                        <th>Room ID</th>
                        <th>Rack Placement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map(l => (
                        <tr key={l.id}>
                          <td><strong>{l.plant_office}</strong></td>
                          <td>{l.building}</td>
                          <td>{l.floor || 'N/A'}</td>
                          <td>{l.room || 'N/A'}</td>
                          <td><code>{l.rack || 'N/A'}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW 7: AUDIT LOGS HISTORY ==================== */}
        {currentView === 'audit' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Audit Logs History</h1>
              <p style={{ color: '#4B5563' }}>System ledger recording all asset lifecycle writes</p>
            </div>

            <div className="card" style={{ padding: 0 }}>
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
                    {auditLogs.map((log) => {
                      const diffs = JSON.parse(log.field_diffs || '{}');
                      return (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.changed_at).toLocaleString()}</td>
                          <td><strong>Asset #{log.asset_instance_id}</strong></td>
                          <td>
                            <div>{log.changed_by_name}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>{log.changed_by_role}</div>
                          </td>
                          <td>
                            <span className={`badge ${log.action === 'CREATE' ? 'badge-active' : log.action === 'TRANSFER' ? 'badge-warning-60' : 'badge-expired'}`}>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW 8: SETTINGS & SECURITY (L1 & L2 Admin) ==================== */}
        {currentView === 'settings' && (currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Settings & Cryptographic Security</h1>
              <p style={{ color: '#4B5563' }}>Manage taxonomies, user privileges, and audit log chain integrity</p>
            </div>

            {/* Cryptographic chain checker */}
            <div className="card">
              <div className="card-title">
                <span>Cryptographic Ledger Verification</span>
                <button className="btn btn-primary" onClick={checkIntegrity}>
                  <Shield size={16} />
                  <span>Verify Hash Chain Integrity</span>
                </button>
              </div>
              <p style={{ color: '#4B5563', marginBottom: '16px' }}>
                Walks the entire audit log database row by row, recalculating the SHA-256 block hash chains to guarantee data rows have not been altered or deleted externally.
              </p>

              {integrityStatus && (
                <div className={`alert-box ${integrityStatus.status === 'healthy' ? 'success' : 'danger'}`}>
                  {integrityStatus.status === 'healthy' ? (
                    <>
                      <CheckCircle size={24} style={{ color: '#15803D' }} />
                      <div>
                        <h4 style={{ fontWeight: 600 }}>Verification Passed Successfully!</h4>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>
                          Verified <strong>{integrityStatus.total_records}</strong> audit block entries. Cryptographic link integrity checks are healthy. No tampering detected.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={24} style={{ color: '#DC2626' }} />
                      <div>
                        <h4 style={{ fontWeight: 600 }}>Ledger Tampering Detected!</h4>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>
                          <strong>Reason:</strong> {integrityStatus.reason}<br />
                          <strong>Failing Entry:</strong> Log ID #{integrityStatus.failed_at_log_id} at {new Date(integrityStatus.timestamp || '').toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Add Taxonomy controls (L1 Admin only) */}
            {currentUser.role.name === 'L1_ADMIN' && (
              <div className="form-row">
              {/* Add group */}
              <div className="card" style={{ flex: 1 }}>
                <div className="card-title">Add Asset Group</div>
                <form onSubmit={handleAddGroup}>
                  <div className="form-group">
                    <label className="form-label">Asset Type</label>
                    <select className="form-select" required value={newGroupType} onChange={e => setNewGroupType(e.target.value)}>
                      <option value="">Select Type</option>
                      {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Asset Group Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={newGroupName} 
                      onChange={e => setNewGroupName(e.target.value)} 
                      placeholder="e.g. Environmental Monitoring Assets"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Save Group
                  </button>
                </form>
              </div>

              {/* Add asset name category */}
              <div className="card" style={{ flex: 1 }}>
                <div className="card-title">Add Asset Category Name</div>
                <form onSubmit={handleAddAsset}>
                  <div className="form-group">
                    <label className="form-label">Asset Group</label>
                    <select className="form-select" required value={newAssetGroup} onChange={e => setNewAssetGroup(e.target.value)}>
                      <option value="">Select Group</option>
                      {assetGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.asset_type.name})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Asset Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={newAssetName} 
                      onChange={e => setNewAssetName(e.target.value)} 
                      placeholder="e.g. SCADA Temperature Sensor"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Save Category Name
                  </button>
                </form>
              </div>
            </div>
            )}

            {/* Quick config directories additions */}
            <div className="form-row">
              {/* Add location */}
              <div className="card" style={{ flex: 1 }}>
                <div className="card-title">Add Physical Location</div>
                <form onSubmit={handleAddLocation}>
                  <div className="form-group">
                    <label className="form-label">Plant / Corporate Office</label>
                    <input type="text" className="form-input" required value={newLocationForm.plant} onChange={e => setNewLocationForm(prev => ({ ...prev, plant: e.target.value }))} placeholder="e.g. Balimela Hydro Project" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Building Name</label>
                    <input type="text" className="form-input" required value={newLocationForm.building} onChange={e => setNewLocationForm(prev => ({ ...prev, building: e.target.value }))} placeholder="e.g. Switchyard Block" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Floor</label>
                      <input type="text" className="form-input" value={newLocationForm.floor} onChange={e => setNewLocationForm(prev => ({ ...prev, floor: e.target.value }))} placeholder="e.g. Ground" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Room</label>
                      <input type="text" className="form-input" value={newLocationForm.room} onChange={e => setNewLocationForm(prev => ({ ...prev, room: e.target.value }))} placeholder="e.g. Control Room B" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Add Location
                  </button>
                </form>
              </div>

              {/* Register employee (L1 Admin only) */}
              {currentUser.role.name === 'L1_ADMIN' && (
                <div className="card" style={{ flex: 1 }}>
                  <div className="card-title">Register Employee / User</div>
                <form onSubmit={handleAddUser}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <input type="text" className="form-input" required value={newUserForm.username} onChange={e => setNewUserForm(prev => ({ ...prev, username: e.target.value }))} placeholder="e.g. a.patel" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-input" required value={newUserForm.password} onChange={e => setNewUserForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Password" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" required value={newUserForm.name} onChange={e => setNewUserForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Anand Patel" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Contact</label>
                    <input type="email" className="form-input" required value={newUserForm.email} onChange={e => setNewUserForm(prev => ({ ...prev, email: e.target.value }))} placeholder="e.g. a.patel@ohpc.in" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input type="text" className="form-input" required value={newUserForm.department} onChange={e => setNewUserForm(prev => ({ ...prev, department: e.target.value }))} placeholder="e.g. IT, Operations" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input type="text" className="form-input" required value={newUserForm.employeeId} onChange={e => setNewUserForm(prev => ({ ...prev, employeeId: e.target.value }))} placeholder="e.g. EMP443" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                    Register Employee
                  </button>
                </form>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== VIEW 9: USER PROFILE ==================== */}
        {currentView === 'profile' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Profile</h1>
              <p style={{ color: '#4B5563' }}>Your personal employee details and EAMS access level</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700 }}>
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{currentUser.name}</h2>
                  <p style={{ color: '#4B5563', fontSize: '13px' }}>{currentUser.department} Department</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>Employee ID:</span>
                  <strong>{currentUser.employee_id}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>Username:</span>
                  <code>{currentUser.username}</code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>Email Address:</span>
                  <span>{currentUser.email}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                  <span style={{ color: '#6B7280', fontWeight: 500 }}>Access Group / Role:</span>
                  <div>
                    <span className={`badge ${currentUser.role.name === 'L1_ADMIN' ? 'badge-restricted' : currentUser.role.name === 'L2_ADMIN' ? 'badge-confidential' : 'badge-active'}`}>
                      {currentUser.role.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODAL 1: TRANSFER ASSET (E-Signature) ==================== */}
      {transferModalOpen && transferTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Authorize Asset Transfer</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setTransferModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {transferError && (
                <div className="alert-box danger" style={{ padding: '8px 12px', fontSize: '12px' }}>
                  <AlertCircle size={16} />
                  <span>{transferError}</span>
                </div>
              )}
              <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                You are transferring asset: <strong>{transferTarget.identifier}</strong> ({transferTarget.asset.name})
              </div>
              <div className="form-group">
                <label className="form-label">New Owner / Custodian User</label>
                <select 
                  className="form-select"
                  value={transferForm.newUser}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, newUser: e.target.value }))}
                >
                  <option value="">Select Employee</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">New Location Target</label>
                <select 
                  className="form-select"
                  value={transferForm.newLocation}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, newLocation: e.target.value }))}
                >
                  <option value="">Select Location</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'}, Room {l.room || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Transfer</label>
                <textarea 
                  className="form-textarea" 
                  rows={2} 
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Allocation to Developer and server room rack movement"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Authenticate Identity (Confirm Password)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={transferForm.password}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTransferModalOpen(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={!transferForm.newUser || !transferForm.newLocation || !transferForm.reason || !transferForm.password}
                onClick={handleTransferSubmit}
              >
                Confirm Signature Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: RETIRE ASSET (E-Signature) ==================== */}
      {retireModalOpen && selectedAssetId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderColor: '#FCA5A5' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#DC2626' }}>Confirm Asset Retirement</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setRetireModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {retireError && (
                <div className="alert-box danger" style={{ padding: '8px 12px', fontSize: '12px' }}>
                  <AlertCircle size={16} />
                  <span>{retireError}</span>
                </div>
              )}
              <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                ⚠️ Warning: Retiring this asset removes it from active operations and marks it permanently as Retired. This action will be cryptographically logged.
              </p>
              <div className="form-group">
                <label className="form-label">Reason for Retirement</label>
                <textarea 
                  className="form-textarea" 
                  rows={2} 
                  required
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  placeholder="e.g. Hardware Failure, EOL support reached"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Authenticate Identity (Confirm Password)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required
                  value={retirePassword}
                  onChange={(e) => setRetirePassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRetireModalOpen(false)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                disabled={!retireReason || !retirePassword}
                onClick={handleRetireSubmit}
              >
                Confirm Signature Retirement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
