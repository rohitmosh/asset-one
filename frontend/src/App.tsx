import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LandingPage from './LandingPage';
import { 
  Shield, 
  Layers, 
  MapPin, 
  History, 
  Settings, 
  LogOut, 
  Search, 
  Download, 
  Plus, 
  Eye, 
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Users,
  AlertCircle,
  BookOpen,
  Lock,
  Unlock,
  FileText,
  Edit
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

  // Grid enhancement states
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    checkbox: 40,
    slNo: 50,
    type: 100,
    group: 130,
    asset: 150,
    identifier: 150,
    description: 150,
    manufacturer: 100,
    model: 100,
    serial: 100,
    owner: 100,
    contact: 150,
    custodian: 100,
    users: 100,
    locationName: 150,
    floorLocation: 150,
    classification: 120,
    warranty: 120,
    criticality: 120,
    backup: 120,
    vulnerability: 120,
    deviation: 120,
    actions: 100
  });
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [bulkClassification, setBulkClassification] = useState<string>('');
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [bulkTransferForm, setBulkTransferForm] = useState({
    newUser: '',
    newLocation: '',
    reason: '',
    password: ''
  });
  const [bulkTransferError, setBulkTransferError] = useState('');

  // Loading States
  const [globalLoading, setGlobalLoading] = useState(false);

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

  // Edit Asset Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    owner_id: '',
    custodian_id: '',
    assigned_user_id: '',
    location_id: '',
    security_classification: 'Internal',
    business_criticality: 'Medium',
    purchase_date: '',
    installation_date: '',
    warranty_start_date: '',
    warranty_end_date: '',
    end_of_life_date: '',
    end_of_support_date: '',
    policy_deviations: '',
    known_vulnerabilities: '',
    remarks: '',
    backup_available: false,
    backup_location: '',
    backup_owner_id: ''
  });
  const [editError, setEditError] = useState('');

  // ── Registry Snapshot (Non-Repudiation) state ──────────────────────────────
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signForm, setSignForm] = useState({ password: '', remarks: '' });
  const [signError, setSignError] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotsTab, setSnapshotsTab] = useState<'logs' | 'snapshots'>('logs');
  const [verifyResult, setVerifyResult] = useState<Record<string, any>>({});
  const [verifyLoading, setVerifyLoading] = useState<Record<string, boolean>>({});

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
      setSelectedAssetIds([]);
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

  const handleLogout = () => {
    localStorage.removeItem('eams_token');
    setToken(null);
    setCurrentUser(null);
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

  const editAsset = (asset: any) => {
    setEditTarget(asset);
    setEditForm({
      description: asset.description || '',
      manufacturer: asset.manufacturer || '',
      model_number: asset.model_number || '',
      serial_number: asset.serial_number || '',
      owner_id: asset.owner_id ? asset.owner_id.toString() : '',
      custodian_id: asset.custodian_id ? asset.custodian_id.toString() : '',
      assigned_user_id: asset.assigned_user_id ? asset.assigned_user_id.toString() : '',
      location_id: asset.location_id ? asset.location_id.toString() : '',
      security_classification: asset.security_classification || 'Internal',
      business_criticality: asset.business_criticality || 'Medium',
      purchase_date: asset.purchase_date || '',
      installation_date: asset.installation_date || '',
      warranty_start_date: asset.warranty_start_date || '',
      warranty_end_date: asset.warranty_end_date || '',
      end_of_life_date: asset.end_of_life_date || '',
      end_of_support_date: asset.end_of_support_date || '',
      policy_deviations: asset.policy_deviations || '',
      known_vulnerabilities: asset.known_vulnerabilities || '',
      remarks: asset.remarks || '',
      backup_available: asset.backup_available || false,
      backup_location: asset.backup_location || '',
      backup_owner_id: asset.backup_owner_id ? asset.backup_owner_id.toString() : ''
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!token || !editTarget) return;
    setEditError('');
    try {
      const body = {
        description: editForm.description || null,
        manufacturer: editForm.manufacturer || null,
        model_number: editForm.model_number || null,
        serial_number: editForm.serial_number || null,
        owner_id: editForm.owner_id ? parseInt(editForm.owner_id) : null,
        custodian_id: editForm.custodian_id ? parseInt(editForm.custodian_id) : null,
        assigned_user_id: editForm.assigned_user_id ? parseInt(editForm.assigned_user_id) : null,
        location_id: editForm.location_id ? parseInt(editForm.location_id) : null,
        security_classification: editForm.security_classification,
        business_criticality: editForm.business_criticality,
        purchase_date: editForm.purchase_date || null,
        installation_date: editForm.installation_date || null,
        warranty_start_date: editForm.warranty_start_date || null,
        warranty_end_date: editForm.warranty_end_date || null,
        end_of_life_date: editForm.end_of_life_date || null,
        end_of_support_date: editForm.end_of_support_date || null,
        policy_deviations: editForm.policy_deviations || null,
        known_vulnerabilities: editForm.known_vulnerabilities || null,
        remarks: editForm.remarks || null,
        backup_available: editForm.backup_available,
        backup_location: editForm.backup_available ? editForm.backup_location : null,
        backup_owner_id: editForm.backup_available && editForm.backup_owner_id ? parseInt(editForm.backup_owner_id) : null
      };

      const res = await fetch(`${API_BASE}/api/assets/${editTarget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setEditModalOpen(false);
        setEditTarget(null);
        fetchAssetRegistry();
        fetchDashboardStats();
      } else {
        const err = await res.json();
        setEditError(err.detail || 'Failed to update asset');
      }
    } catch (e: any) {
      console.error(e);
      setEditError('An unexpected error occurred');
    }
  };

  // ── Registry Snapshot: sign handler ────────────────────────────────────────
  const handleSignRegistry = async () => {
    if (!token) return;
    setSignError('');
    setSignLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/snapshots/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password_confirm: signForm.password, remarks: signForm.remarks || null })
      });
      if (res.ok) {
        // Trigger PDF download
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename=(.+)/);
        const filename = match ? match[1] : 'Registry_Snapshot.pdf';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSignModalOpen(false);
        setSignForm({ password: '', remarks: '' });
        fetchSnapshots();
      } else {
        const err = await res.json();
        setSignError(err.detail || 'Signing failed. Please try again.');
      }
    } catch (e: any) {
      setSignError('Network error. Could not reach the server.');
    } finally {
      setSignLoading(false);
    }
  };

  // ── Registry Snapshot: fetch list ──────────────────────────────────────────
  const fetchSnapshots = async () => {
    if (!token || !currentUser) return;
    if (currentUser.role.name === 'USER') return;
    try {
      const res = await fetch(`${API_BASE}/api/snapshots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSnapshots(await res.json());
    } catch (e) { console.error('Failed to fetch snapshots', e); }
  };

  // ── Registry Snapshot: verify a single snapshot (L1 Admin only) ────────────
  const verifySnapshot = async (snapshotId: string) => {
    if (!token) return;
    setVerifyLoading(prev => ({ ...prev, [snapshotId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/snapshots/${snapshotId}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(prev => ({ ...prev, [snapshotId]: data }));
      }
    } catch (e) { console.error('Verify failed', e); }
    finally { setVerifyLoading(prev => ({ ...prev, [snapshotId]: false })); }
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
        await res.json();
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

  const triggerExcelExport = (exportIds?: number[]) => {
    const queryParams = new URLSearchParams();
    if (filters.typeId) queryParams.append('type_id', filters.typeId);
    if (filters.groupId) queryParams.append('group_id', filters.groupId);
    if (filters.criticality) queryParams.append('criticality', filters.criticality);
    if (filters.classification) queryParams.append('classification', filters.classification);
    
    const targetIds = exportIds || (selectedAssetIds.length > 0 ? selectedAssetIds : null);
    if (targetIds && targetIds.length > 0) {
      queryParams.append('ids', targetIds.join(','));
    }
    
    window.open(`${API_BASE}/api/reports/export?${queryParams.toString()}&jwt=${token || ''}`);
  };

  const triggerPdfExport = (exportIds?: number[]) => {
    const queryParams = new URLSearchParams();
    if (filters.typeId) queryParams.append('type_id', filters.typeId);
    if (filters.groupId) queryParams.append('group_id', filters.groupId);
    if (filters.criticality) queryParams.append('criticality', filters.criticality);
    if (filters.classification) queryParams.append('classification', filters.classification);
    
    const targetIds = exportIds || (selectedAssetIds.length > 0 ? selectedAssetIds : null);
    if (targetIds && targetIds.length > 0) {
      queryParams.append('ids', targetIds.join(','));
    }
    
    window.open(`${API_BASE}/api/reports/pdf?${queryParams.toString()}&jwt=${token || ''}`);
  };

  // Natural alphanumeric sort in-memory helper
  const sortedAssets = useMemo(() => {
    if (!sortField) return assets;
    
    const sorted = [...assets];
    sorted.sort((a, b) => {
      let valA: any = null;
      let valB: any = null;

      if (sortField === 'type') {
        valA = a.asset?.asset_group?.asset_type?.name;
        valB = b.asset?.asset_group?.asset_type?.name;
      } else if (sortField === 'group') {
        valA = a.asset?.asset_group?.name;
        valB = b.asset?.asset_group?.name;
      } else if (sortField === 'asset') {
        valA = a.asset?.name;
        valB = b.asset?.name;
      } else if (sortField === 'identifier') {
        valA = a.identifier;
        valB = b.identifier;
      } else if (sortField === 'description') {
        valA = a.description;
        valB = b.description;
      } else if (sortField === 'manufacturer') {
        valA = a.manufacturer;
        valB = b.manufacturer;
      } else if (sortField === 'model') {
        valA = a.model_number;
        valB = b.model_number;
      } else if (sortField === 'serial') {
        valA = a.serial_number;
        valB = b.serial_number;
      } else if (sortField === 'owner') {
        valA = a.owner?.name;
        valB = b.owner?.name;
      } else if (sortField === 'custodian') {
        valA = a.custodian?.name;
        valB = b.custodian?.name;
      } else if (sortField === 'user') {
        valA = a.assigned_user?.name;
        valB = b.assigned_user?.name;
      } else if (sortField === 'locationName') {
        valA = a.location?.plant_office;
        valB = b.location?.plant_office;
      } else if (sortField === 'classification') {
        valA = a.security_classification;
        valB = b.security_classification;
      } else if (sortField === 'warranty') {
        valA = a.warranty_end_date;
        valB = b.warranty_end_date;
      } else if (sortField === 'criticality') {
        valA = a.business_criticality;
        valB = b.business_criticality;
      } else if (sortField === 'vulnerability') {
        valA = a.known_vulnerabilities;
        valB = b.known_vulnerabilities;
      } else if (sortField === 'deviation') {
        valA = a.policy_deviations;
        valB = b.policy_deviations;
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * (sortDirection === 'asc' ? 1 : -1);
    });
    
    return sorted;
  }, [assets, sortField, sortDirection]);

  // Highlight matches inside table cells
  const HighlightText = useCallback(({ text, search }: { text: string; search: string }) => {
    if (!search || !text) return <>{text}</>;
    const cleanSearch = search.trim();
    if (!cleanSearch) return <>{text}</>;
    
    const parts = String(text).split(new RegExp(`(${cleanSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === cleanSearch.toLowerCase() 
            ? <mark key={index} className="search-highlight">{part}</mark> 
            : part
        )}
      </>
    );
  }, []);

  // Columns sorting toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Drag resizer column handler
  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = colWidths[colKey] || 100;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(30, startWidth + (moveEvent.pageX - startX));
      setColWidths(prev => ({
        ...prev,
        [colKey]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Row selection helpers
  const allSelected = useMemo(() => {
    return sortedAssets.length > 0 && sortedAssets.every(a => selectedAssetIds.includes(a.id));
  }, [sortedAssets, selectedAssetIds]);

  const toggleSelectAll = () => {
    if (allSelected) {
      const visibleIds = sortedAssets.map(a => a.id);
      setSelectedAssetIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = sortedAssets.map(a => a.id);
      setSelectedAssetIds(prev => {
        const newSelection = [...prev];
        visibleIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const toggleSelectAsset = (id: number) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const handleBulkClassificationUpdate = async (classification: string) => {
    if (!classification || selectedAssetIds.length === 0) return;
    setGlobalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/assets/bulk-update-classification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_ids: selectedAssetIds,
          security_classification: classification
        })
      });
      
      if (res.ok) {
        alert(`Successfully updated classification to ${classification} for ${selectedAssetIds.length} assets`);
        setSelectedAssetIds([]);
        setBulkClassification('');
        fetchAssetRegistry();
      } else {
        const data = await res.json();
        alert(`Error: ${data.detail || 'Failed to update classification'}`);
      }
    } catch (e) {
      console.error('Failed to perform bulk classification update', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0) return;
    setBulkTransferError('');
    try {
      const res = await fetch(`${API_BASE}/api/assets/bulk-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_ids: selectedAssetIds,
          new_user_id: parseInt(bulkTransferForm.newUser),
          new_location_id: parseInt(bulkTransferForm.newLocation),
          reason: bulkTransferForm.reason,
          password_confirm: bulkTransferForm.password
        })
      });
      
      if (res.ok) {
        alert(`Successfully transferred ${selectedAssetIds.length} assets`);
        setSelectedAssetIds([]);
        setBulkTransferOpen(false);
        setBulkTransferForm({ newUser: '', newLocation: '', reason: '', password: '' });
        fetchAssetRegistry();
      } else {
        const data = await res.json();
        setBulkTransferError(data.detail || 'Failed to transfer assets');
      }
    } catch (err: any) {
      setBulkTransferError(err.message || 'Server error occurred during bulk transfer');
    }
  };

  // Render landing page (with integrated login) when not authenticated
  if (!token || !currentUser) {
    return (
      <LandingPage
        onLoginSuccess={(newToken) => {
          setToken(newToken);
        }}
      />
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
          <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '14px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}>A1</div>
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
        {currentView === 'assets' ? (
          <div className="header-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search identifier, serial, manufacturer..."
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
              }}
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
        <div className="header-user" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
          <div className="user-info" style={{ textAlign: 'right' }}>
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.department} • <strong style={{ color: '#7c3aed' }}>{currentUser.role.name}</strong></span>
          </div>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', fontWeight: 700 }}>{currentUser.name.charAt(0)}</div>
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
                <button className="btn btn-secondary" onClick={() => triggerExcelExport()}>
                  <Download size={16} />
                  <span>Export as Excel</span>
                </button>
                <button className="btn btn-secondary" onClick={() => triggerPdfExport()}>
                  <FileText size={16} />
                  <span>Export as PDF</span>
                </button>
                {currentUser.role.name === 'L2_ADMIN' && (
                  <button
                    id="btn-finalize-sign"
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #1E3A5F 0%, #1e5f4e 100%)',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(30,58,95,0.25)'
                    }}
                    onClick={() => { setSignError(''); setSignForm({ password: '', remarks: '' }); setSignModalOpen(true); }}
                    title="Cryptographically sign and finalise the current asset registry state"
                  >
                    <Lock size={16} />
                    <span>Finalise &amp; Sign Registry</span>
                  </button>
                )}
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
              <div className="excel-table-container">
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          left: 0, 
                          width: colWidths.checkbox, 
                          minWidth: colWidths.checkbox, 
                          maxWidth: colWidths.checkbox 
                        }} 
                        className="sticky-col"
                      >
                        <div className="th-inner">
                          <input 
                            type="checkbox" 
                            checked={allSelected} 
                            onChange={toggleSelectAll} 
                            style={{ cursor: 'pointer' }}
                          />
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('checkbox', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          left: colWidths.checkbox, 
                          width: colWidths.slNo, 
                          minWidth: colWidths.slNo, 
                          maxWidth: colWidths.slNo 
                        }} 
                        className="sticky-col"
                      >
                        <div className="th-inner">
                          <span>Sl No</span>
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('slNo', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        colSpan={4} 
                        style={{ 
                          left: colWidths.checkbox + colWidths.slNo, 
                          width: colWidths.type + colWidths.group + colWidths.asset + colWidths.identifier,
                          minWidth: colWidths.type + colWidths.group + colWidths.asset + colWidths.identifier
                        }} 
                        className="sticky-col sticky-boundary"
                      >
                        Asset Description
                      </th>
                      <th colSpan={4}>Asset Details</th>
                      <th colSpan={4}>Ownership and usage details</th>
                      <th colSpan={2}>Location</th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.classification, 
                          minWidth: colWidths.classification, 
                          maxWidth: colWidths.classification 
                        }}
                      >
                        <div className="th-inner" onClick={() => toggleSort('classification')} style={{ cursor: 'pointer' }}>
                          <span>Security Classification</span>
                          {sortField === 'classification' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('classification', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.warranty, 
                          minWidth: colWidths.warranty, 
                          maxWidth: colWidths.warranty 
                        }}
                      >
                        <div className="th-inner" onClick={() => toggleSort('warranty')} style={{ cursor: 'pointer' }}>
                          <span>AMC/Warranty End Date</span>
                          {sortField === 'warranty' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('warranty', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.criticality, 
                          minWidth: colWidths.criticality, 
                          maxWidth: colWidths.criticality 
                        }}
                      >
                        <div className="th-inner" onClick={() => toggleSort('criticality')} style={{ cursor: 'pointer' }}>
                          <span>Impact on Business Continuity</span>
                          {sortField === 'criticality' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('criticality', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.backup, 
                          minWidth: colWidths.backup, 
                          maxWidth: colWidths.backup 
                        }}
                      >
                        <div className="th-inner">
                          <span>Backup Location</span>
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('backup', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.vulnerability, 
                          minWidth: colWidths.vulnerability, 
                          maxWidth: colWidths.vulnerability 
                        }}
                      >
                        <div className="th-inner" onClick={() => toggleSort('vulnerability')} style={{ cursor: 'pointer' }}>
                          <span>Vulnerability of Asset</span>
                          {sortField === 'vulnerability' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('vulnerability', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.deviation, 
                          minWidth: colWidths.deviation, 
                          maxWidth: colWidths.deviation 
                        }}
                      >
                        <div className="th-inner" onClick={() => toggleSort('deviation')} style={{ cursor: 'pointer' }}>
                          <span>Any deviation from company policy</span>
                          {sortField === 'deviation' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('deviation', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        rowSpan={2} 
                        style={{ 
                          width: colWidths.actions, 
                          minWidth: colWidths.actions, 
                          maxWidth: colWidths.actions 
                        }}
                      >
                        <div className="th-inner">
                          <span>Actions</span>
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('actions', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                    </tr>
                    <tr>
                      <th 
                        style={{ 
                          left: colWidths.checkbox + colWidths.slNo, 
                          width: colWidths.type, 
                          minWidth: colWidths.type, 
                          maxWidth: colWidths.type 
                        }} 
                        className="sticky-col"
                      >
                        <div className="th-inner" onClick={() => toggleSort('type')} style={{ cursor: 'pointer' }}>
                          <span>Asset Type</span>
                          {sortField === 'type' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('type', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        style={{ 
                          left: colWidths.checkbox + colWidths.slNo + colWidths.type, 
                          width: colWidths.group, 
                          minWidth: colWidths.group, 
                          maxWidth: colWidths.group 
                        }} 
                        className="sticky-col"
                      >
                        <div className="th-inner" onClick={() => toggleSort('group')} style={{ cursor: 'pointer' }}>
                          <span>Asset Group</span>
                          {sortField === 'group' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('group', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        style={{ 
                          left: colWidths.checkbox + colWidths.slNo + colWidths.type + colWidths.group, 
                          width: colWidths.asset, 
                          minWidth: colWidths.asset, 
                          maxWidth: colWidths.asset 
                        }} 
                        className="sticky-col"
                      >
                        <div className="th-inner" onClick={() => toggleSort('asset')} style={{ cursor: 'pointer' }}>
                          <span>Asset</span>
                          {sortField === 'asset' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('asset', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th 
                        style={{ 
                          left: colWidths.checkbox + colWidths.slNo + colWidths.type + colWidths.group + colWidths.asset, 
                          width: colWidths.identifier, 
                          minWidth: colWidths.identifier, 
                          maxWidth: colWidths.identifier 
                        }} 
                        className="sticky-col sticky-boundary"
                      >
                        <div className="th-inner" onClick={() => toggleSort('identifier')} style={{ cursor: 'pointer' }}>
                          <span>Asset Identifier</span>
                          {sortField === 'identifier' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('identifier', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.description, minWidth: colWidths.description, maxWidth: colWidths.description }}>
                        <div className="th-inner" onClick={() => toggleSort('description')} style={{ cursor: 'pointer' }}>
                          <span>Asset Description</span>
                          {sortField === 'description' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('description', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.manufacturer, minWidth: colWidths.manufacturer, maxWidth: colWidths.manufacturer }}>
                        <div className="th-inner" onClick={() => toggleSort('manufacturer')} style={{ cursor: 'pointer' }}>
                          <span>Manufacturer</span>
                          {sortField === 'manufacturer' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('manufacturer', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.model, minWidth: colWidths.model, maxWidth: colWidths.model }}>
                        <div className="th-inner" onClick={() => toggleSort('model')} style={{ cursor: 'pointer' }}>
                          <span>Model No.</span>
                          {sortField === 'model' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('model', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.serial, minWidth: colWidths.serial, maxWidth: colWidths.serial }}>
                        <div className="th-inner" onClick={() => toggleSort('serial')} style={{ cursor: 'pointer' }}>
                          <span>Serial No.</span>
                          {sortField === 'serial' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('serial', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.owner, minWidth: colWidths.owner, maxWidth: colWidths.owner }}>
                        <div className="th-inner" onClick={() => toggleSort('owner')} style={{ cursor: 'pointer' }}>
                          <span>Owner</span>
                          {sortField === 'owner' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('owner', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.contact, minWidth: colWidths.contact, maxWidth: colWidths.contact }}>
                        <div className="th-inner" onClick={() => toggleSort('contact')} style={{ cursor: 'pointer' }}>
                          <span>Contact Details</span>
                          {sortField === 'contact' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('contact', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.custodian, minWidth: colWidths.custodian, maxWidth: colWidths.custodian }}>
                        <div className="th-inner" onClick={() => toggleSort('custodian')} style={{ cursor: 'pointer' }}>
                          <span>Custodian</span>
                          {sortField === 'custodian' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('custodian', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.users, minWidth: colWidths.users, maxWidth: colWidths.users }}>
                        <div className="th-inner" onClick={() => toggleSort('user')} style={{ cursor: 'pointer' }}>
                          <span>User(s)</span>
                          {sortField === 'user' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('users', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.locationName, minWidth: colWidths.locationName, maxWidth: colWidths.locationName }}>
                        <div className="th-inner" onClick={() => toggleSort('locationName')} style={{ cursor: 'pointer' }}>
                          <span>Location Name</span>
                          {sortField === 'locationName' && (
                            <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                          )}
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('locationName', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                      <th style={{ width: colWidths.floorLocation, minWidth: colWidths.floorLocation, maxWidth: colWidths.floorLocation }}>
                        <div className="th-inner">
                          <span>Floor Location</span>
                          <div 
                            className="resize-handle" 
                            onMouseDown={(e) => handleResizeStart('floorLocation', e)} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssets.map((asset, index) => {
                      
                      // Calculate days remaining
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const warrantyDate = asset.warranty_end_date ? new Date(asset.warranty_end_date) : null;
                      if (warrantyDate) {
                        warrantyDate.setHours(0, 0, 0, 0);
                      }
                      const daysRemaining = warrantyDate 
                        ? Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      let warrantyColor = 'inherit';
                      let warrantyWeight = 'normal';
                      if (daysRemaining !== null) {
                        if (daysRemaining < 0) {
                          warrantyColor = '#DC2626'; // Red
                          warrantyWeight = '600';
                        } else if (daysRemaining <= 30) {
                          warrantyColor = '#D97706'; // Orange
                          warrantyWeight = '600';
                        } else if (daysRemaining <= 60) {
                          warrantyColor = '#B45309'; // Yellowish/Gold
                          warrantyWeight = '500';
                        }
                      }

                      const floorLoc = [
                        asset.location.building,
                        asset.location.floor ? `Floor ${asset.location.floor}` : null,
                        asset.location.room ? `Room ${asset.location.room}` : null,
                        asset.location.rack ? `Rack ${asset.location.rack}` : null
                      ].filter(Boolean).join(', ');

                      const isRowSelected = selectedAssetIds.includes(asset.id);

                      return (
                        <tr key={asset.id} className={isRowSelected ? 'selected' : ''}>
                          <td 
                            style={{ 
                              left: 0, 
                              width: colWidths.checkbox, 
                              minWidth: colWidths.checkbox, 
                              maxWidth: colWidths.checkbox, 
                              textAlign: 'center' 
                            }} 
                            className="sticky-col"
                          >
                            <input 
                              type="checkbox" 
                              checked={isRowSelected} 
                              onChange={() => toggleSelectAsset(asset.id)} 
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td 
                            style={{ 
                              left: colWidths.checkbox, 
                              width: colWidths.slNo, 
                              minWidth: colWidths.slNo, 
                              maxWidth: colWidths.slNo, 
                              textAlign: 'center' 
                            }} 
                            className="sticky-col"
                          >
                            {index + 1}
                          </td>
                          <td 
                            style={{ 
                              left: colWidths.checkbox + colWidths.slNo, 
                              width: colWidths.type, 
                              minWidth: colWidths.type, 
                              maxWidth: colWidths.type 
                            }} 
                            className="sticky-col"
                          >
                            <HighlightText text={asset.asset.asset_group.asset_type.name} search={filters.search} />
                          </td>
                          <td 
                            style={{ 
                              left: colWidths.checkbox + colWidths.slNo + colWidths.type, 
                              width: colWidths.group, 
                              minWidth: colWidths.group, 
                              maxWidth: colWidths.group 
                            }} 
                            className="sticky-col"
                          >
                            <HighlightText text={asset.asset.asset_group.name} search={filters.search} />
                          </td>
                          <td 
                            style={{ 
                              left: colWidths.checkbox + colWidths.slNo + colWidths.type + colWidths.group, 
                              width: colWidths.asset, 
                              minWidth: colWidths.asset, 
                              maxWidth: colWidths.asset 
                            }} 
                            className="sticky-col"
                          >
                            <HighlightText text={asset.asset.name} search={filters.search} />
                          </td>
                          <td 
                            style={{ 
                              left: colWidths.checkbox + colWidths.slNo + colWidths.type + colWidths.group + colWidths.asset, 
                              width: colWidths.identifier, 
                              minWidth: colWidths.identifier, 
                              maxWidth: colWidths.identifier 
                            }} 
                            className="sticky-col sticky-boundary"
                          >
                            <strong>
                              <HighlightText text={asset.identifier} search={filters.search} />
                            </strong>
                          </td>
                          <td style={{ width: colWidths.description, minWidth: colWidths.description, maxWidth: colWidths.description }}>
                            <div style={{ maxWidth: `${colWidths.description - 20}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={asset.description}>
                              <HighlightText text={asset.description || 'No description'} search={filters.search} />
                            </div>
                          </td>
                          <td style={{ width: colWidths.manufacturer, minWidth: colWidths.manufacturer, maxWidth: colWidths.manufacturer }}>
                            <HighlightText text={asset.manufacturer || 'N/A'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.model, minWidth: colWidths.model, maxWidth: colWidths.model }}>
                            <HighlightText text={asset.model_number || 'N/A'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.serial, minWidth: colWidths.serial, maxWidth: colWidths.serial }}>
                            <HighlightText text={asset.serial_number || 'N/A'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.owner, minWidth: colWidths.owner, maxWidth: colWidths.owner }}>
                            <HighlightText text={asset.owner.name} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.contact, minWidth: colWidths.contact, maxWidth: colWidths.contact }}>
                            <HighlightText text={asset.owner.email} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.custodian, minWidth: colWidths.custodian, maxWidth: colWidths.custodian }}>
                            <HighlightText text={asset.custodian.name} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.users, minWidth: colWidths.users, maxWidth: colWidths.users }}>
                            <HighlightText text={asset.assigned_user?.name || 'N/A'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.locationName, minWidth: colWidths.locationName, maxWidth: colWidths.locationName }}>
                            <HighlightText text={asset.location.plant_office} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.floorLocation, minWidth: colWidths.floorLocation, maxWidth: colWidths.floorLocation }}>
                            <HighlightText text={floorLoc} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.classification, minWidth: colWidths.classification, maxWidth: colWidths.classification, textAlign: 'center' }}>
                            <span className={`badge badge-${asset.security_classification.toLowerCase()}`}>
                              {asset.security_classification}
                            </span>
                          </td>
                          <td style={{ width: colWidths.warranty, minWidth: colWidths.warranty, maxWidth: colWidths.warranty, textAlign: 'center', color: warrantyColor, fontWeight: warrantyWeight as any }}>
                            {asset.warranty_end_date || 'N/A'}
                          </td>
                          <td style={{ width: colWidths.criticality, minWidth: colWidths.criticality, maxWidth: colWidths.criticality, textAlign: 'center' }}>
                            {asset.business_criticality}
                          </td>
                          <td style={{ width: colWidths.backup, minWidth: colWidths.backup, maxWidth: colWidths.backup }}>
                            <HighlightText text={asset.backup_available ? asset.backup_location || 'Yes' : 'No Backup'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.vulnerability, minWidth: colWidths.vulnerability, maxWidth: colWidths.vulnerability }}>
                            <HighlightText text={asset.known_vulnerabilities || 'None'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.deviation, minWidth: colWidths.deviation, maxWidth: colWidths.deviation }}>
                            <HighlightText text={asset.policy_deviations || 'None'} search={filters.search} />
                          </td>
                          <td style={{ width: colWidths.actions, minWidth: colWidths.actions, maxWidth: colWidths.actions }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button className="btn btn-secondary" style={{ padding: '2px 4px' }} onClick={() => viewAssetDetails(asset.id)} title="View Details">
                                <Eye size={12} />
                              </button>
                              {(currentUser.role.name === 'L1_ADMIN' || (currentUser.role.name === 'L2_ADMIN' && asset.custodian_id === currentUser.id)) && asset.status === 'Active' && (
                                <>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '2px 4px', color: '#1d4ed8', borderColor: '#bfdbfe' }} 
                                    onClick={() => editAsset(asset)}
                                    title="Edit Asset"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '2px 4px', color: '#065f46', borderColor: '#a7f3d0' }} 
                                    onClick={() => {
                                      setTransferTarget(asset);
                                      setTransferForm(prev => ({ ...prev, newLocation: asset.location_id.toString(), newUser: asset.assigned_user_id?.toString() || '' }));
                                      setTransferError('');
                                      setTransferModalOpen(true);
                                    }}
                                    title="Transfer Asset"
                                  >
                                    <RefreshCw size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedAssets.length === 0 && (
                      <tr>
                        <td colSpan={23} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                          No assets match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bulk Actions Floating Toolbar */}
            {selectedAssetIds.length > 0 && (
              <div className="bulk-actions-toolbar">
                <span className="selected-count">{selectedAssetIds.length} selected</span>
                <div className="actions-group">
                  <select 
                    value={bulkClassification} 
                    onChange={(e) => {
                      setBulkClassification(e.target.value);
                      handleBulkClassificationUpdate(e.target.value);
                    }}
                  >
                    <option value="">Update Classification...</option>
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                  
                  {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setBulkTransferError('');
                        setBulkTransferForm({ newUser: '', newLocation: '', reason: '', password: '' });
                        setBulkTransferOpen(true);
                      }}
                    >
                      <RefreshCw size={12} />
                      <span>Bulk Transfer</span>
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '12px', color: '#fff', backgroundColor: '#334155', borderColor: '#475569' }}
                    onClick={() => triggerExcelExport()}
                  >
                    <Download size={12} />
                    <span>Export Excel</span>
                  </button>
                  
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '12px', color: '#fff', backgroundColor: '#334155', borderColor: '#475569' }}
                    onClick={() => triggerPdfExport()}
                  >
                    <Download size={12} />
                    <span>Export PDF</span>
                  </button>
                  
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '12px', color: '#cbd5e1', backgroundColor: 'transparent', border: 'none' }}
                    onClick={() => setSelectedAssetIds([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Transfer Modal Overlay */}
            {bulkTransferOpen && (
              <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
                <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Bulk Asset Transfer</h2>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setBulkTransferOpen(false)}>✕</button>
                  </div>
                  <form onSubmit={handleBulkTransferSubmit}>
                    <p style={{ marginBottom: '16px', color: '#4B5563', fontSize: '13px' }}>
                      You are transferring <strong>{selectedAssetIds.length} assets</strong> to a new user and location. This action requires password authentication to authorize the digital signature.
                    </p>

                    {bulkTransferError && (
                      <div className="alert-box danger" style={{ marginBottom: '16px' }}>
                        <AlertCircle size={16} />
                        <span>{bulkTransferError}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">New Assignee / Custodian User</label>
                      <select 
                        className="form-select" 
                        required 
                        value={bulkTransferForm.newUser} 
                        onChange={(e) => setBulkTransferForm(prev => ({ ...prev, newUser: e.target.value }))}
                      >
                        <option value="">Select User...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">New Location</label>
                      <select 
                        className="form-select" 
                        required 
                        value={bulkTransferForm.newLocation} 
                        onChange={(e) => setBulkTransferForm(prev => ({ ...prev, newLocation: e.target.value }))}
                      >
                        <option value="">Select Location...</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.plant_office} - {l.building} {l.room || ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reason for Transfer</label>
                      <textarea 
                        className="form-textarea" 
                        required 
                        rows={3} 
                        value={bulkTransferForm.reason} 
                        onChange={(e) => setBulkTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Provide details on why these assets are being relocated/reassigned"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password (Digital E-Signature)</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        required 
                        value={bulkTransferForm.password} 
                        onChange={(e) => setBulkTransferForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your login password"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setBulkTransferOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Authorize Transfer</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
                      style={{ background: '#f3f4f6', color: '#4b5563', fontWeight: 600, border: '1px solid #e5e7eb' }}
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

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Vulnerability of Asset</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={wizardForm.knownVulnerabilities}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, knownVulnerabilities: e.target.value }))}
                        placeholder="e.g. CVE-2024-1234, outdated firmware"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Any Deviation from Company Policy</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={wizardForm.policyDeviations}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, policyDeviations: e.target.value }))}
                        placeholder="e.g. Missing security agent, unapproved software"
                      />
                    </div>
                  </div>

                  {/* Backup Info toggle */}
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', margin: '16px 0' }}>
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
                  <div className="info-value" style={{ marginTop: '4px', background: '#f9fafb', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
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

              {/* Risk & Compliance Card */}
              <div className="card">
                <div className="card-title">Risk & Compliance</div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Vulnerability of Asset</span>
                    <span className="info-value">{asset.known_vulnerabilities || 'None'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Any Deviation from Company Policy</span>
                    <span className="info-value">{asset.policy_deviations || 'None'}</span>
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
                      {asset.audit_logs && asset.audit_logs.map((log: any) => {
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
              <div className="segmented-control" style={{ display: 'inline-flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Audit &amp; Integrity</h1>
                <p style={{ color: '#4B5563' }}>
                  {snapshotsTab === 'logs' 
                    ? 'System ledger recording all asset lifecycle writes' 
                    : 'Cryptographically signed snapshots of the asset registry'}
                </p>
              </div>
              {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
                <div className="segmented-control" style={{ display: 'inline-flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <button 
                    className={`btn ${snapshotsTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '13px', border: 'none', boxShadow: snapshotsTab === 'logs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                    onClick={() => setSnapshotsTab('logs')}
                  >
                    <History size={16} style={{ marginRight: '6px' }} />
                    Audit Logs
                  </button>
                  <button 
                    className={`btn ${snapshotsTab === 'snapshots' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '13px', border: 'none', boxShadow: snapshotsTab === 'snapshots' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', marginLeft: '4px' }}
                    onClick={() => { setSnapshotsTab('snapshots'); fetchSnapshots(); }}
                  >
                    <Shield size={16} style={{ marginRight: '6px' }} />
                    Signed Snapshots
                  </button>
                </div>
              )}
            </div>

            {/* ── Tab: Audit Logs ── */}
            {snapshotsTab === 'logs' && (
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
                            <td>
                              {log.asset_instance_id
                                ? <strong>Asset #{log.asset_instance_id}</strong>
                                : <span style={{ color: '#6B7280', fontStyle: 'italic' }}>Registry-level</span>}
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
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: Signed Snapshots ── */}
            {snapshotsTab === 'snapshots' && (
              <div>
                {snapshots.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                    <Lock size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>No Signed Snapshots Yet</h3>
                    <p style={{ fontSize: '14px' }}>
                      {currentUser.role.name === 'L2_ADMIN'
                        ? 'Use the "Finalise & Sign Registry" button in the Asset Registry to create your first cryptographic snapshot.'
                        : 'No L2 Admins have signed their registry yet.'}
                    </p>
                  </div>
                ) : (
                  snapshots.map((snap) => {
                    const result = verifyResult[snap.snapshot_id];
                    const isLoading = verifyLoading[snap.snapshot_id];
                    return (
                      <div key={snap.snapshot_id} className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <Lock size={18} style={{ color: '#1E3A5F', flexShrink: 0 }} />
                              <span style={{ fontWeight: 700, fontSize: '15px' }}>Registry Snapshot</span>
                              <code style={{ fontSize: '11px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                {snap.snapshot_id}
                              </code>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', fontSize: '13px' }}>
                              <div><span style={{ color: '#6B7280' }}>Signed by:</span> <strong>{snap.signer_name}</strong> ({snap.signer_role})</div>
                              <div><span style={{ color: '#6B7280' }}>Employee ID:</span> {snap.signer_employee_id}</div>
                              <div><span style={{ color: '#6B7280' }}>Department:</span> {snap.signer_department}</div>
                              <div><span style={{ color: '#6B7280' }}>Timestamp (UTC):</span> {new Date(snap.timestamp_utc).toLocaleString()}</div>
                              <div><span style={{ color: '#6B7280' }}>Assets Signed:</span> <strong>{snap.asset_count}</strong></div>
                              {snap.remarks && <div><span style={{ color: '#6B7280' }}>Remarks:</span> {snap.remarks}</div>}
                            </div>
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', wordBreak: 'break-all' }}>
                                <span style={{ color: '#64748B', fontFamily: 'sans-serif' }}>data_hash: </span>sha256:{snap.data_hash}
                              </div>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', wordBreak: 'break-all' }}>
                                <span style={{ color: '#64748B', fontFamily: 'sans-serif' }}>chain_anchor: </span>sha256:{snap.chain_anchor}
                              </div>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', wordBreak: 'break-all' }}>
                                <span style={{ color: '#64748B', fontFamily: 'sans-serif' }}>hmac-sha256: </span>{snap.hmac_signature}
                              </div>
                            </div>
                          </div>

                          {/* Verify button (L1 Admin only) */}
                          {currentUser.role.name === 'L1_ADMIN' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '140px' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '13px' }}
                                disabled={isLoading}
                                onClick={() => verifySnapshot(snap.snapshot_id)}
                              >
                                <Shield size={14} />
                                <span>{isLoading ? 'Verifying…' : 'Verify Integrity'}</span>
                              </button>
                              {result && (
                                <div style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  background: result.status === 'valid' ? '#DCFCE7' : '#FEE2E2',
                                  border: `1px solid ${result.status === 'valid' ? '#86EFAC' : '#FCA5A5'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: result.status === 'valid' ? '#15803D' : '#DC2626'
                                }}>
                                  {result.status === 'valid'
                                    ? <><CheckCircle size={15} /> HMAC Valid</>  
                                    : <><AlertTriangle size={15} /> TAMPERED</>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
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
            {currentUser.role.name === 'L1_ADMIN' && (
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
            )}

            {/* Add Taxonomy controls (L1 & L2 Admins) */}
            {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
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

              {/* Register employee (L1 & L2 Admins) */}
              {(currentUser.role.name === 'L1_ADMIN' || currentUser.role.name === 'L2_ADMIN') && (
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
              <div style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
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

      {/* ==================== MODAL 3: EDIT ASSET ==================== */}
      {editModalOpen && editTarget && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--wide">
            <div className="modal-header">
              <h2 className="modal-title">Edit Asset: {editTarget.identifier}</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              {editError && (
                <div className="alert-box danger" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}
              
              <div style={{ padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Asset Category: <strong>{editTarget.asset.name}</strong> ({editTarget.asset.asset_group.name})
              </div>

              {/* Technical Specifications */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Technical Specifications</h3>
              
              <div className="form-group">
                <label className="form-label">Asset Description</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Asset description / metadata details"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Manufacturer</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.manufacturer}
                    onChange={(e) => setEditForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="e.g. Dell, Cisco"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.model_number}
                    onChange={(e) => setEditForm(prev => ({ ...prev, model_number: e.target.value }))}
                    placeholder="e.g. ProLiant"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editForm.serial_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="e.g. SN-88324"
                />
              </div>

              {/* Ownership & Location */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '20px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Ownership & Location</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Asset Owner (Department Head) *</label>
                  <select 
                    className="form-select"
                    value={editForm.owner_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, owner_id: e.target.value }))}
                    required
                  >
                    <option value="">Select Owner</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Custodian (Manager) *</label>
                  <select 
                    className="form-select"
                    value={editForm.custodian_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, custodian_id: e.target.value }))}
                    required
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
                    value={editForm.assigned_user_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, assigned_user_id: e.target.value }))}
                  >
                    <option value="">None / Pool Asset</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Location *</label>
                  <select 
                    className="form-select"
                    value={editForm.location_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location_id: e.target.value }))}
                    required
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

              {/* Security & Criticality */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '20px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Security & Criticality</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Security Classification *</label>
                  <select 
                    className="form-select"
                    value={editForm.security_classification}
                    onChange={(e) => setEditForm(prev => ({ ...prev, security_classification: e.target.value }))}
                    required
                  >
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Criticality Impact *</label>
                  <select 
                    className="form-select"
                    value={editForm.business_criticality}
                    onChange={(e) => setEditForm(prev => ({ ...prev, business_criticality: e.target.value }))}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Lifecycle Dates */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '20px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Lifecycle Dates</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={editForm.purchase_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, purchase_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Installation Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={editForm.installation_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, installation_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Warranty / AMC Start Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={editForm.warranty_start_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, warranty_start_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Warranty / AMC End Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={editForm.warranty_end_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, warranty_end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">End of Life Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={editForm.end_of_life_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, end_of_life_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End of Support Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={editForm.end_of_support_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, end_of_support_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Risk & Compliance */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '20px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Risk & Compliance</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Policy Deviations</label>
                  <textarea 
                    className="form-textarea" 
                    rows={2}
                    value={editForm.policy_deviations}
                    onChange={(e) => setEditForm(prev => ({ ...prev, policy_deviations: e.target.value }))}
                    placeholder="e.g. Missing security agent, unapproved software"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Known Vulnerabilities</label>
                  <textarea 
                    className="form-textarea" 
                    rows={2}
                    value={editForm.known_vulnerabilities}
                    onChange={(e) => setEditForm(prev => ({ ...prev, known_vulnerabilities: e.target.value }))}
                    placeholder="e.g. CVE-2023-XXXX"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Governance Remarks</label>
                <textarea 
                  className="form-textarea" 
                  rows={2}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional notes or remarks"
                />
              </div>

              {/* Backup Info toggle */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="edit_backup_check"
                    checked={editForm.backup_available}
                    onChange={(e) => setEditForm(prev => ({ ...prev, backup_available: e.target.checked }))}
                  />
                  <label htmlFor="edit_backup_check" style={{ fontWeight: 500 }}>System Backup Configuration Available</label>
                </div>

                {editForm.backup_available && (
                  <div className="form-row" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Backup Target Location</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editForm.backup_location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, backup_location: e.target.value }))}
                        placeholder="e.g. NAS server IP or offline vault code"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Backup Owner / Signee</label>
                      <select 
                        className="form-select"
                        value={editForm.backup_owner_id}
                        onChange={(e) => setEditForm(prev => ({ ...prev, backup_owner_id: e.target.value }))}
                      >
                        <option value="">Select Backup Owner</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={!editForm.owner_id || !editForm.custodian_id || !editForm.location_id || !editForm.security_classification || !editForm.business_criticality}
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SIGN REGISTRY MODAL ==================== */}
      {signModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSignModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: 0, overflow: 'hidden', backgroundColor: '#fff' }}>
            <div className="modal-header" style={{ 
              background: 'var(--grad)',
              padding: '24px 28px',
              margin: 0,
              borderBottom: 'none',
              borderRadius: '0'
            }}>
              <div>
                <h2 className="modal-title" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                  <Lock size={20} /> Finalise &amp; Sign Asset Registry
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>
                  This action creates a cryptographically signed, tamper-evident snapshot of your current registry state.
                </p>
              </div>
              <button 
                onClick={() => setSignModalOpen(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '20px', 
                  cursor: 'pointer', 
                  opacity: 0.8,
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '28px', margin: 0 }}>
              {/* What this does callout */}
              <div style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0369A1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} /> What happens when you sign:
                </div>
                <ul style={{ fontSize: '13px', color: '#0C4A6E', margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
                  <li>A <strong>SHA-256 hash</strong> of all your assets' current data is computed.</li>
                  <li>This is anchored to the current <strong>audit chain position</strong>.</li>
                  <li>A <strong>HMAC-SHA256 signature</strong> is generated, binding your identity to the data.</li>
                  <li>A signed <strong>PDF document</strong> is downloaded to your device — this is your non-repudiable record.</li>
                  <li>The manifest is stored in the system for <strong>L1 Admin verification</strong> at any time.</li>
                </ul>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Remarks / Submission Note <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  id="sign-remarks"
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. End-of-quarter registry finalisation, Q2 FY2026"
                  value={signForm.remarks}
                  onChange={(e) => setSignForm(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} />
                  Confirm Your Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  id="sign-password"
                  type="password"
                  className="form-input"
                  placeholder="Re-enter your login password to sign"
                  value={signForm.password}
                  onChange={(e) => setSignForm(prev => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && signForm.password) handleSignRegistry(); }}
                  autoComplete="current-password"
                />
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                  Your password re-entry is the cryptographic proof of your knowing, active consent at this moment.
                </p>
              </div>

              {signError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '13px',
                  marginTop: '12px'
                }}>
                  <AlertTriangle size={15} />
                  {signError}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '20px 28px', margin: 0, background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <button className="btn btn-secondary" onClick={() => setSignModalOpen(false)} disabled={signLoading}>
                Cancel
              </button>
              <button
                id="btn-confirm-sign"
                className="btn"
                style={{
                  background: signForm.password
                    ? 'linear-gradient(135deg, #1E3A5F 0%, #1e5f4e 100%)'
                    : '#D1D5DB',
                  color: '#fff',
                  border: 'none',
                  cursor: signForm.password ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  minWidth: '180px',
                  justifyContent: 'center'
                }}
                disabled={!signForm.password || signLoading}
                onClick={handleSignRegistry}
              >
                {signLoading ? (
                  <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing…</>
                ) : (
                  <><Lock size={15} /> Sign &amp; Download PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
