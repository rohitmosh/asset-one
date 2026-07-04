import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assetService } from '../../services/assetService';
import { taxonomyService } from '../../services/taxonomyService';
import { locationService } from '../../services/locationService';
import { userService } from '../../services/userService';
import type { AssetInstance, AssetType, AssetGroup, Location, UserProfile } from '../../types';
import { HighlightText } from '../../components/common/HighlightText';
import { 
  Search, 
  Download, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  Edit, 
  FileSpreadsheet, 
  FileText 
} from 'lucide-react';

interface AssetRegistryProps {
  onViewDetails: (id: number) => void;
  onAddAsset: () => void;
  onEditAsset: (asset: AssetInstance) => void;
}

export const AssetRegistry: React.FC<AssetRegistryProps> = ({ 
  onViewDetails, 
  onAddAsset, 
  onEditAsset 
}) => {
  const { currentUser, setGlobalLoading } = useAuth();
  
  // Data lists
  const [assets, setAssets] = useState<AssetInstance[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Filtering states
  const [filters, setFilters] = useState({
    typeId: '',
    groupId: '',
    criticality: '',
    classification: '',
    status: 'Active',
    search: '',
    custodianId: '',
    domain: '',
  });

  // Sorting states
  const [sortField, setSortField] = useState<string>('identifier');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Selection states
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  
  // Modal / overlays states
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [bulkTransferError, setBulkTransferError] = useState('');
  const [bulkTransferForm, setBulkTransferForm] = useState({
    newUser: '',
    newLocation: '',
    reason: '',
    password: '',
  });

  const [bulkClassification, setBulkClassification] = useState('');

  // Single transfer states
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<AssetInstance | null>(null);
  const [transferError, setTransferError] = useState('');
  const [transferForm, setTransferForm] = useState({
    newUser: '',
    newLocation: '',
    reason: '',
    password: '',
  });

  // Column widths
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    checkbox: 40,
    slNo: 50,
    itOt: 60,
    type: 110,
    group: 130,
    asset: 120,
    identifier: 180,
    description: 200,
    manufacturer: 110,
    model: 100,
    serial: 100,
    owner: 120,
    contact: 160,
    custodian: 120,
    user: 120,
    locationName: 140,
    floorLocation: 160,
    classification: 140,
    warranty: 140,
    criticality: 150,
    backup: 140,
    vulnerability: 140,
    deviation: 140,
    actions: 100,
  });

  const isL2Admin = currentUser?.role.name === 'L2_ADMIN';
  const hasCheckbox = isL2Admin;
  const checkboxWidth = hasCheckbox ? (colWidths.checkbox || 40) : 0;

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [typesData, groupsData, locsData, usersData] = await Promise.all([
          taxonomyService.getTypes(),
          taxonomyService.getGroups(),
          locationService.list(),
          userService.list()
        ]);
        setTypes(typesData);
        setGroups(groupsData);
        setLocations(locsData);
        setUsers(usersData);
      } catch (e) {
        console.error('Failed to load filters options', e);
      }
    };
    loadOptions();
  }, []);

  // Fetch asset list
  const fetchAssets = async () => {
    setGlobalLoading(true);
    try {
      const data = await assetService.list(filters);
      setAssets(data);
    } catch (e) {
      console.error('Failed to retrieve assets', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    setSelectedAssetIds([]);
  }, [filters]);

  // Column resizer mouse handler
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

  // Sorting logic
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAssets = useMemo(() => {
    const sorted = [...assets];
    sorted.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'itOt':
          valA = a.asset.asset_group.domain;
          valB = b.asset.asset_group.domain;
          break;
        case 'type':
          valA = a.asset.asset_type.name;
          valB = b.asset.asset_type.name;
          break;
        case 'group':
          valA = a.asset.asset_group.name;
          valB = b.asset.asset_group.name;
          break;
        case 'asset':
          valA = a.asset.name;
          valB = b.asset.name;
          break;
        case 'identifier':
          valA = a.identifier;
          valB = b.identifier;
          break;
        case 'description':
          valA = a.description || '';
          valB = b.description || '';
          break;
        case 'manufacturer':
          valA = a.manufacturer || '';
          valB = b.manufacturer || '';
          break;
        case 'model':
          valA = a.model_number || '';
          valB = b.model_number || '';
          break;
        case 'serial':
          valA = a.serial_number || '';
          valB = b.serial_number || '';
          break;
        case 'owner':
          valA = a.owner.name;
          valB = b.owner.name;
          break;
        case 'contact':
          valA = a.owner.email;
          valB = b.owner.email;
          break;
        case 'custodian':
          valA = a.custodian.name;
          valB = b.custodian.name;
          break;
        case 'user':
          valA = a.assigned_user?.name || '';
          valB = b.assigned_user?.name || '';
          break;
        case 'locationName':
          valA = a.location.plant_office;
          valB = b.location.plant_office;
          break;
        case 'classification':
          valA = a.security_classification;
          valB = b.security_classification;
          break;
        case 'warranty':
          valA = a.warranty_end_date || '';
          valB = b.warranty_end_date || '';
          break;
        case 'criticality':
          valA = a.business_criticality;
          valB = b.business_criticality;
          break;
        case 'vulnerability':
          valA = a.known_vulnerabilities || '';
          valB = b.known_vulnerabilities || '';
          break;
        case 'deviation':
          valA = a.policy_deviations || '';
          valB = b.policy_deviations || '';
          break;
        default:
          valA = a.id;
          valB = b.id;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [assets, sortField, sortDirection]);

  // Selection helpers
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
          if (!newSelection.includes(id)) newSelection.push(id);
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

  // Bulk Actions
  const handleBulkClassificationUpdate = async (classification: string) => {
    if (!classification || selectedAssetIds.length === 0) return;
    setGlobalLoading(true);
    try {
      await assetService.bulkUpdateClassification(selectedAssetIds, classification);
      alert(`Successfully updated security classification to ${classification} for ${selectedAssetIds.length} assets`);
      setSelectedAssetIds([]);
      setBulkClassification('');
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to perform bulk classification update');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTransferForm.newUser || !bulkTransferForm.newLocation || !bulkTransferForm.password) {
      setBulkTransferError('New User, New Location, and Password confirmation are required.');
      return;
    }
    setBulkTransferError('');
    setGlobalLoading(true);
    try {
      await assetService.bulkTransfer({
        asset_ids: selectedAssetIds,
        new_user_id: parseInt(bulkTransferForm.newUser),
        new_location_id: parseInt(bulkTransferForm.newLocation),
        reason: bulkTransferForm.reason,
        password_confirm: bulkTransferForm.password
      });
      alert(`Successfully transferred ${selectedAssetIds.length} assets`);
      setSelectedAssetIds([]);
      setBulkTransferOpen(false);
      setBulkTransferForm({ newUser: '', newLocation: '', reason: '', password: '' });
      fetchAssets();
    } catch (err: any) {
      setBulkTransferError(err.message || 'Server error occurred during bulk transfer');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Single Transfer
  const handleSingleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget) return;
    if (!transferForm.newUser || !transferForm.newLocation || !transferForm.password) {
      setTransferError('New User, Location, and Password confirmation are required.');
      return;
    }
    setTransferError('');
    setGlobalLoading(true);
    try {
      await assetService.transfer(transferTarget.id, {
        new_user_id: parseInt(transferForm.newUser),
        new_location_id: parseInt(transferForm.newLocation),
        reason: transferForm.reason,
        password_confirm: transferForm.password
      });
      alert(`Successfully transferred asset ${transferTarget.identifier}`);
      setTransferModalOpen(false);
      setTransferTarget(null);
      setTransferForm({ newUser: '', newLocation: '', reason: '', password: '' });
      fetchAssets();
    } catch (err: any) {
      setTransferError(err.message || 'Server error occurred during transfer');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Exports
  const triggerExcelExport = () => {
    const url = assetService.getExcelExportUrl(filters);
    window.open(url, '_blank');
  };

  const triggerPdfExport = () => {
    const url = assetService.getPdfExportUrl(filters);
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* FILTER BAR AND HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Asset Register</h1>
          <p style={{ color: '#4B5563' }}>View, track, and transfer IT/OT digital asset inventories.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={triggerExcelExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
          <button className="btn btn-secondary" onClick={triggerPdfExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} />
            <span>Export PDF</span>
          </button>
          {isL2Admin && (
            <button className="btn btn-primary" onClick={onAddAsset} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              <span>Register Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Domain</label>
            <select className="form-input" value={filters.domain} onChange={e => setFilters(prev => ({ ...prev, domain: e.target.value }))}>
              <option value="">All Domains</option>
              <option value="IT">IT</option>
              <option value="OT">OT</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Asset Type</label>
            <select className="form-input" value={filters.typeId} onChange={e => setFilters(prev => ({ ...prev, typeId: e.target.value }))}>
              <option value="">All Types</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Asset Group</label>
            <select className="form-input" value={filters.groupId} onChange={e => setFilters(prev => ({ ...prev, groupId: e.target.value }))}>
              <option value="">All Groups</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.domain})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Security Classification</label>
            <select className="form-input" value={filters.classification} onChange={e => setFilters(prev => ({ ...prev, classification: e.target.value }))}>
              <option value="">All Classifications</option>
              <option value="Public">Public</option>
              <option value="Internal">Internal</option>
              <option value="Confidential">Confidential</option>
              <option value="Restricted">Restricted</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Criticality</label>
            <select className="form-input" value={filters.criticality} onChange={e => setFilters(prev => ({ ...prev, criticality: e.target.value }))}>
              <option value="">All Criticalities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>Status</label>
            <select className="form-input" value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
              <option value="Active">Active Only</option>
              <option value="Retired">Retired Only</option>
              <option value="">All Statuses</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '32px' }}
              placeholder="Search by serial number, manufacturer, or identifier..." 
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          </div>
          <button className="btn btn-secondary" onClick={() => setFilters({ typeId: '', groupId: '', criticality: '', classification: '', status: 'Active', search: '', custodianId: '', domain: '' })}>Reset Filters</button>
        </div>
      </div>

      {/* EXCEL SHEET GRID */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="excel-table-container">
          <table className="excel-table">
            <thead>
              <tr>
                {hasCheckbox && (
                  <th 
                    rowSpan={2} 
                    style={{ left: 0, width: colWidths.checkbox, minWidth: colWidths.checkbox, maxWidth: colWidths.checkbox }} 
                    className="sticky-col"
                  >
                    <div className="th-inner">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                      <div className="resize-handle" onMouseDown={(e) => handleResizeStart('checkbox', e)} onClick={e => e.stopPropagation()} />
                    </div>
                  </th>
                )}
                <th 
                  rowSpan={2} 
                  style={{ left: checkboxWidth, width: colWidths.slNo, minWidth: colWidths.slNo, maxWidth: colWidths.slNo }} 
                  className="sticky-col"
                >
                  <div className="th-inner">
                    <span>Sl No</span>
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('slNo', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th 
                  colSpan={5} 
                  style={{ 
                    left: checkboxWidth + colWidths.slNo, 
                    width: colWidths.itOt + colWidths.type + colWidths.group + colWidths.asset + colWidths.identifier,
                    minWidth: colWidths.itOt + colWidths.type + colWidths.group + colWidths.asset + colWidths.identifier
                  }} 
                  className="sticky-col sticky-boundary"
                >
                  Asset Description
                </th>
                <th colSpan={4}>Asset Details</th>
                <th colSpan={4}>Ownership and Usage</th>
                <th colSpan={2}>Location</th>
                <th rowSpan={2} style={{ width: colWidths.classification, minWidth: colWidths.classification, maxWidth: colWidths.classification }}>
                  <div className="th-inner" onClick={() => toggleSort('classification')} style={{ cursor: 'pointer' }}>
                    <span>Security Classification</span>
                    {sortField === 'classification' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('classification', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th rowSpan={2} style={{ width: colWidths.warranty, minWidth: colWidths.warranty, maxWidth: colWidths.warranty }}>
                  <div className="th-inner" onClick={() => toggleSort('warranty')} style={{ cursor: 'pointer' }}>
                    <span>AMC/Warranty End Date</span>
                    {sortField === 'warranty' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('warranty', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th rowSpan={2} style={{ width: colWidths.criticality, minWidth: colWidths.criticality, maxWidth: colWidths.criticality }}>
                  <div className="th-inner" onClick={() => toggleSort('criticality')} style={{ cursor: 'pointer' }}>
                    <span>Business Criticality</span>
                    {sortField === 'criticality' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('criticality', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th rowSpan={2} style={{ width: colWidths.backup, minWidth: colWidths.backup, maxWidth: colWidths.backup }}>
                  <div className="th-inner">
                    <span>Backup Location</span>
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('backup', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th rowSpan={2} style={{ width: colWidths.vulnerability, minWidth: colWidths.vulnerability, maxWidth: colWidths.vulnerability }}>
                  <div className="th-inner" onClick={() => toggleSort('vulnerability')} style={{ cursor: 'pointer' }}>
                    <span>Known Vulnerabilities</span>
                    {sortField === 'vulnerability' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('vulnerability', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th rowSpan={2} style={{ width: colWidths.deviation, minWidth: colWidths.deviation, maxWidth: colWidths.deviation }}>
                  <div className="th-inner" onClick={() => toggleSort('deviation')} style={{ cursor: 'pointer' }}>
                    <span>Policy Deviations</span>
                    {sortField === 'deviation' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('deviation', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th rowSpan={2} style={{ width: colWidths.actions, minWidth: colWidths.actions, maxWidth: colWidths.actions }}>
                  <div className="th-inner">
                    <span>Actions</span>
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('actions', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
              </tr>
              <tr>
                {/* Secondary row header values for merged group headings */}
                <th className="sticky-col" style={{ left: checkboxWidth + colWidths.slNo, width: colWidths.itOt, minWidth: colWidths.itOt, maxWidth: colWidths.itOt }}>
                  <div className="th-inner" onClick={() => toggleSort('itOt')} style={{ cursor: 'pointer' }}>
                    <span>IT/OT</span>
                    {sortField === 'itOt' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('itOt', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th className="sticky-col" style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt, width: colWidths.type, minWidth: colWidths.type, maxWidth: colWidths.type }}>
                  <div className="th-inner" onClick={() => toggleSort('type')} style={{ cursor: 'pointer' }}>
                    <span>Asset Type</span>
                    {sortField === 'type' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('type', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th className="sticky-col" style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt + colWidths.type, width: colWidths.group, minWidth: colWidths.group, maxWidth: colWidths.group }}>
                  <div className="th-inner" onClick={() => toggleSort('group')} style={{ cursor: 'pointer' }}>
                    <span>Asset Group</span>
                    {sortField === 'group' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('group', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th className="sticky-col" style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt + colWidths.type + colWidths.group, width: colWidths.asset, minWidth: colWidths.asset, maxWidth: colWidths.asset }}>
                  <div className="th-inner" onClick={() => toggleSort('asset')} style={{ cursor: 'pointer' }}>
                    <span>Category</span>
                    {sortField === 'asset' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('asset', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th className="sticky-col sticky-boundary" style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt + colWidths.type + colWidths.group + colWidths.asset, width: colWidths.identifier, minWidth: colWidths.identifier, maxWidth: colWidths.identifier }}>
                  <div className="th-inner" onClick={() => toggleSort('identifier')} style={{ cursor: 'pointer' }}>
                    <span>Asset Identifier</span>
                    {sortField === 'identifier' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('identifier', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.description, minWidth: colWidths.description, maxWidth: colWidths.description }}>
                  <div className="th-inner" onClick={() => toggleSort('description')} style={{ cursor: 'pointer' }}>
                    <span>Description</span>
                    {sortField === 'description' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('description', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.manufacturer, minWidth: colWidths.manufacturer, maxWidth: colWidths.manufacturer }}>
                  <div className="th-inner" onClick={() => toggleSort('manufacturer')} style={{ cursor: 'pointer' }}>
                    <span>Manufacturer</span>
                    {sortField === 'manufacturer' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('manufacturer', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.model, minWidth: colWidths.model, maxWidth: colWidths.model }}>
                  <div className="th-inner" onClick={() => toggleSort('model')} style={{ cursor: 'pointer' }}>
                    <span>Model No.</span>
                    {sortField === 'model' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('model', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.serial, minWidth: colWidths.serial, maxWidth: colWidths.serial }}>
                  <div className="th-inner" onClick={() => toggleSort('serial')} style={{ cursor: 'pointer' }}>
                    <span>Serial No.</span>
                    {sortField === 'serial' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('serial', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.owner, minWidth: colWidths.owner, maxWidth: colWidths.owner }}>
                  <div className="th-inner" onClick={() => toggleSort('owner')} style={{ cursor: 'pointer' }}>
                    <span>Owner Name</span>
                    {sortField === 'owner' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('owner', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.contact, minWidth: colWidths.contact, maxWidth: colWidths.contact }}>
                  <div className="th-inner" onClick={() => toggleSort('contact')} style={{ cursor: 'pointer' }}>
                    <span>Email/Contact</span>
                    {sortField === 'contact' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('contact', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.custodian, minWidth: colWidths.custodian, maxWidth: colWidths.custodian }}>
                  <div className="th-inner" onClick={() => toggleSort('custodian')} style={{ cursor: 'pointer' }}>
                    <span>Custodian</span>
                    {sortField === 'custodian' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('custodian', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.user, minWidth: colWidths.user, maxWidth: colWidths.user }}>
                  <div className="th-inner" onClick={() => toggleSort('user')} style={{ cursor: 'pointer' }}>
                    <span>User Assigned</span>
                    {sortField === 'user' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('user', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.locationName, minWidth: colWidths.locationName, maxWidth: colWidths.locationName }}>
                  <div className="th-inner" onClick={() => toggleSort('locationName')} style={{ cursor: 'pointer' }}>
                    <span>Plant/Office</span>
                    {sortField === 'locationName' && <span className="sort-indicator">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>}
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('locationName', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
                <th style={{ width: colWidths.floorLocation, minWidth: colWidths.floorLocation, maxWidth: colWidths.floorLocation }}>
                  <div className="th-inner">
                    <span>Floor/Room/Rack</span>
                    <div className="resize-handle" onMouseDown={(e) => handleResizeStart('floorLocation', e)} onClick={e => e.stopPropagation()} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset, index) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const warrantyDate = asset.warranty_end_date ? new Date(asset.warranty_end_date) : null;
                if (warrantyDate) warrantyDate.setHours(0, 0, 0, 0);
                const daysRemaining = warrantyDate 
                  ? Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                let warrantyColor = 'inherit';
                let warrantyWeight = 'normal';
                if (daysRemaining !== null) {
                  if (daysRemaining < 0) {
                    warrantyColor = '#DC2626';
                    warrantyWeight = '600';
                  } else if (daysRemaining <= 30) {
                    warrantyColor = '#D97706';
                    warrantyWeight = '600';
                  } else if (daysRemaining <= 60) {
                    warrantyColor = '#B45309';
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
                    {hasCheckbox && (
                      <td style={{ left: 0, width: colWidths.checkbox, minWidth: colWidths.checkbox, maxWidth: colWidths.checkbox, textAlign: 'center' }} className="sticky-col">
                        <input type="checkbox" checked={isRowSelected} onChange={() => toggleSelectAsset(asset.id)} style={{ cursor: 'pointer' }} />
                      </td>
                    )}
                    <td style={{ left: checkboxWidth, width: colWidths.slNo, minWidth: colWidths.slNo, maxWidth: colWidths.slNo, textAlign: 'center' }} className="sticky-col">
                      {index + 1}
                    </td>
                    <td style={{ left: checkboxWidth + colWidths.slNo, width: colWidths.itOt, minWidth: colWidths.itOt, maxWidth: colWidths.itOt, textAlign: 'center' }} className="sticky-col">
                      <span className={`badge ${asset.asset.asset_group.domain.toUpperCase() === 'IT' ? 'badge-public' : 'badge-restricted'}`}>
                        {asset.asset.asset_group.domain.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt, width: colWidths.type, minWidth: colWidths.type, maxWidth: colWidths.type }} className="sticky-col">
                      <HighlightText text={asset.asset.asset_type.name} search={filters.search} />
                    </td>
                    <td style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt + colWidths.type, width: colWidths.group, minWidth: colWidths.group, maxWidth: colWidths.group }} className="sticky-col">
                      <HighlightText text={asset.asset.asset_group.name} search={filters.search} />
                    </td>
                    <td style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt + colWidths.type + colWidths.group, width: colWidths.asset, minWidth: colWidths.asset, maxWidth: colWidths.asset }} className="sticky-col">
                      <HighlightText text={asset.asset.name} search={filters.search} />
                    </td>
                    <td style={{ left: checkboxWidth + colWidths.slNo + colWidths.itOt + colWidths.type + colWidths.group + colWidths.asset, width: colWidths.identifier, minWidth: colWidths.identifier, maxWidth: colWidths.identifier }} className="sticky-col sticky-boundary">
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
                    <td style={{ width: colWidths.user, minWidth: colWidths.user, maxWidth: colWidths.user }}>
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
                        <button className="btn btn-secondary" style={{ padding: '2px 4px' }} onClick={() => onViewDetails(asset.id)} title="View Details">
                          <Eye size={12} />
                        </button>
                        {isL2Admin && asset.status === 'Active' && (
                          <>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '2px 4px', color: '#1d4ed8', borderColor: '#bfdbfe' }} 
                              onClick={() => onEditAsset(asset)}
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
                  <td colSpan={24} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
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
            {isL2Admin && (
              <>
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
              </>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px', color: '#fff', backgroundColor: '#334155', borderColor: '#475569' }}
              onClick={triggerExcelExport}
            >
              <Download size={12} />
              <span>Export Excel</span>
            </button>
            
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px', color: '#fff', backgroundColor: '#334155', borderColor: '#475569' }}
              onClick={triggerPdfExport}
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

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Custodian/Assigned User *</label>
                <select 
                  className="form-input" 
                  value={bulkTransferForm.newUser} 
                  onChange={e => setBulkTransferForm(p => ({ ...p, newUser: e.target.value }))}
                  required
                >
                  <option value="">Select Target User...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Installation Location *</label>
                <select 
                  className="form-input" 
                  value={bulkTransferForm.newLocation} 
                  onChange={e => setBulkTransferForm(p => ({ ...p, newLocation: e.target.value }))}
                  required
                >
                  <option value="">Select Installation Location...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'}, Room {l.room || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Transfer Justification/Remarks *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px' }}
                  value={bulkTransferForm.reason} 
                  onChange={e => setBulkTransferForm(p => ({ ...p, reason: e.target.value }))}
                  required
                  placeholder="State the regulatory justification or maintenance purpose..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Confirm password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={bulkTransferForm.password} 
                  onChange={e => setBulkTransferForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="Enter your login password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkTransferOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Authorize & Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Transfer Modal Overlay */}
      {transferModalOpen && transferTarget && (
        <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Transfer Asset: {transferTarget.identifier}</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setTransferModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSingleTransferSubmit}>
              <p style={{ marginBottom: '16px', color: '#4B5563', fontSize: '13px' }}>
                You are transferring asset <strong>{transferTarget.asset.name} ({transferTarget.identifier})</strong>. This logs a cryptographic audit record signed with your credentials.
              </p>

              {transferError && (
                <div className="alert-box danger" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{transferError}</span>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Custodian/Assigned User *</label>
                <select 
                  className="form-input" 
                  value={transferForm.newUser} 
                  onChange={e => setTransferForm(p => ({ ...p, newUser: e.target.value }))}
                  required
                >
                  <option value="">Select Target User...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">New Installation Location *</label>
                <select 
                  className="form-input" 
                  value={transferForm.newLocation} 
                  onChange={e => setTransferForm(p => ({ ...p, newLocation: e.target.value }))}
                  required
                >
                  <option value="">Select Installation Location...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'}, Room {l.room || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label">Transfer Justification/Remarks *</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px' }}
                  value={transferForm.reason} 
                  onChange={e => setTransferForm(p => ({ ...p, reason: e.target.value }))}
                  required
                  placeholder="State the regulatory justification or maintenance purpose..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Confirm password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={transferForm.password} 
                  onChange={e => setTransferForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="Enter your login password"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTransferModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Authorize & Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssetRegistry;
