import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assetService } from '../../services/assetService';
import { taxonomyService } from '../../services/taxonomyService';
import { locationService } from '../../services/locationService';
import { userService } from '../../services/userService';
import type { AssetInstance, AssetType, AssetGroup, Asset, Location, UserProfile } from '../../types';
import { AlertCircle, ArrowLeft, ArrowRight, Save } from 'lucide-react';

interface AssetWizardProps {
  mode: 'create' | 'edit';
  editAssetTarget?: AssetInstance | null;
  onBack: () => void;
  onComplete: () => void;
}

export const AssetWizard: React.FC<AssetWizardProps> = ({ 
  mode, 
  editAssetTarget, 
  onBack, 
  onComplete 
}) => {
  const { setGlobalLoading } = useAuth();
  const [error, setError] = useState('');
  const [wizardStep, setWizardStep] = useState(1);

  // Lookups
  const [types, setTypes] = useState<AssetType[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);
  const [categories, setCategories] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    domain: '',
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
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
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
  });

  // Load all lookups on mount
  useEffect(() => {
    const loadLookups = async () => {
      setGlobalLoading(true);
      try {
        const [tData, gData, cData, lData, uData] = await Promise.all([
          taxonomyService.getTypes(),
          taxonomyService.getGroups(),
          taxonomyService.getCategories(),
          locationService.list(),
          userService.list()
        ]);
        setTypes(tData);
        setGroups(gData);
        setCategories(cData);
        setLocations(lData);
        setUsers(uData);
      } catch (e) {
        console.error('Failed to load lookups', e);
      } finally {
        setGlobalLoading(false);
      }
    };
    loadLookups();
  }, []);

  // Pre-populate if editing
  useEffect(() => {
    if (mode === 'edit' && editAssetTarget) {
      setEditForm({
        description: editAssetTarget.description || '',
        manufacturer: editAssetTarget.manufacturer || '',
        modelNumber: editAssetTarget.model_number || '',
        serialNumber: editAssetTarget.serial_number || '',
        ownerId: editAssetTarget.owner_id ? editAssetTarget.owner_id.toString() : '',
        custodianId: editAssetTarget.custodian_id ? editAssetTarget.custodian_id.toString() : '',
        assignedUserId: editAssetTarget.assigned_user_id ? editAssetTarget.assigned_user_id.toString() : '',
        locationId: editAssetTarget.location_id ? editAssetTarget.location_id.toString() : '',
        securityClassification: editAssetTarget.security_classification || 'Internal',
        businessCriticality: editAssetTarget.business_criticality || 'Medium',
        purchaseDate: editAssetTarget.purchase_date || '',
        installationDate: editAssetTarget.installation_date || '',
        warrantyStartDate: editAssetTarget.warranty_start_date || '',
        warrantyEndDate: editAssetTarget.warranty_end_date || '',
        endOfLifeDate: editAssetTarget.end_of_life_date || '',
        endOfSupportDate: editAssetTarget.end_of_support_date || '',
        policyDeviations: editAssetTarget.policy_deviations || '',
        knownVulnerabilities: editAssetTarget.known_vulnerabilities || '',
        remarks: editAssetTarget.remarks || '',
        backupAvailable: editAssetTarget.backup_available || false,
        backupLocation: editAssetTarget.backup_location || '',
      });
    }
  }, [mode, editAssetTarget]);

  // Filtering for cascade select fields in Create mode
  const filteredTypes = useMemo(() => {
    if (!createForm.domain) return [];
    // Only return types that exist in categories belonging to this domain
    const filteredCats = categories.filter(c => c.asset_group?.domain === createForm.domain);
    const typeIds = new Set(filteredCats.map(c => c.asset_type_id));
    return types.filter(t => typeIds.has(t.id));
  }, [createForm.domain, types, categories]);

  const filteredGroups = useMemo(() => {
    if (!createForm.domain || !createForm.typeId) return [];
    const typeIdInt = parseInt(createForm.typeId);
    const filteredCats = categories.filter(c => c.asset_group?.domain === createForm.domain && c.asset_type_id === typeIdInt);
    const groupIds = new Set(filteredCats.map(c => c.asset_group_id));
    return groups.filter(g => g.domain === createForm.domain && groupIds.has(g.id));
  }, [createForm.domain, createForm.typeId, groups, categories]);

  const filteredCategories = useMemo(() => {
    if (!createForm.groupId || !createForm.typeId) return [];
    const groupIdInt = parseInt(createForm.groupId);
    const typeIdInt = parseInt(createForm.typeId);
    return categories.filter(c => c.asset_group_id === groupIdInt && c.asset_type_id === typeIdInt);
  }, [createForm.groupId, createForm.typeId, categories]);

  // Auto-generate identifier on category selection
  useEffect(() => {
    const fetchId = async () => {
      if (createForm.assetId && mode === 'create') {
        try {
          const identifier = await taxonomyService.getNextIdentifier(
            parseInt(createForm.assetId)
          );
          setCreateForm(prev => ({ ...prev, identifier }));
        } catch (e) {
          console.error('Failed to generate identifier', e);
        }
      }
    };
    fetchId();
  }, [createForm.assetId, mode]);

  // Handlers
  const handleCreateSubmit = async () => {
    setError('');
    setGlobalLoading(true);
    try {
      const payload = {
        asset_id: parseInt(createForm.assetId),
        identifier: createForm.identifier,
        description: createForm.description || null,
        manufacturer: createForm.manufacturer || null,
        model_number: createForm.modelNumber || null,
        serial_number: createForm.serialNumber || null,
        owner_id: createForm.ownerId ? parseInt(createForm.ownerId) : null,
        custodian_id: createForm.custodianId ? parseInt(createForm.custodianId) : null,
        assigned_user_id: createForm.assignedUserId ? parseInt(createForm.assignedUserId) : null,
        location_id: createForm.locationId ? parseInt(createForm.locationId) : null,
        security_classification: createForm.securityClassification,
        business_criticality: createForm.businessCriticality,
        purchase_date: createForm.purchaseDate || null,
        installation_date: createForm.installationDate || null,
        warranty_start_date: createForm.warrantyStartDate || null,
        warranty_end_date: createForm.warrantyEndDate || null,
        end_of_life_date: createForm.endOfLifeDate || null,
        end_of_support_date: createForm.endOfSupportDate || null,
        policy_deviations: createForm.policyDeviations || null,
        known_vulnerabilities: createForm.knownVulnerabilities || null,
        remarks: createForm.remarks || null,
        backup_available: createForm.backupAvailable,
        backup_location: createForm.backupAvailable ? createForm.backupLocation : null,
      };

      await assetService.create(payload);
      alert('Asset registered successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to register asset.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAssetTarget) return;
    setError('');
    setGlobalLoading(true);
    try {
      const payload = {
        description: editForm.description || null,
        manufacturer: editForm.manufacturer || null,
        model_number: editForm.modelNumber || null,
        serial_number: editForm.serialNumber || null,
        owner_id: editForm.ownerId ? parseInt(editForm.ownerId) : null,
        custodian_id: editForm.custodianId ? parseInt(editForm.custodianId) : null,
        assigned_user_id: editForm.assignedUserId ? parseInt(editForm.assignedUserId) : null,
        location_id: editForm.locationId ? parseInt(editForm.locationId) : null,
        security_classification: editForm.securityClassification,
        business_criticality: editForm.businessCriticality,
        purchase_date: editForm.purchaseDate || null,
        installation_date: editForm.installationDate || null,
        warranty_start_date: editForm.warrantyStartDate || null,
        warranty_end_date: editForm.warrantyEndDate || null,
        end_of_life_date: editForm.endOfLifeDate || null,
        end_of_support_date: editForm.endOfSupportDate || null,
        policy_deviations: editForm.policyDeviations || null,
        known_vulnerabilities: editForm.knownVulnerabilities || null,
        remarks: editForm.remarks || null,
        backup_available: editForm.backupAvailable,
        backup_location: editForm.backupAvailable ? editForm.backupLocation : null,
      };

      await assetService.update(editAssetTarget.id, payload);
      alert('Asset updated successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update asset.');
    } finally {
      setGlobalLoading(false);
    }
  };

  if (mode === 'edit') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Edit Asset: {editAssetTarget?.identifier}</h1>
            <p style={{ color: '#4B5563' }}>Update asset specifications, assignments, or locations.</p>
          </div>
        </div>

        {error && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEditSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Specs */}
            <div>
              <label className="form-label">Manufacturer</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.manufacturer} 
                onChange={e => setEditForm(p => ({ ...p, manufacturer: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Model Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.modelNumber} 
                onChange={e => setEditForm(p => ({ ...p, modelNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Serial Number</label>
              <input 
                type="text" 
                className="form-input" 
                value={editForm.serialNumber} 
                onChange={e => setEditForm(p => ({ ...p, serialNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Asset Owner *</label>
              <select 
                className="form-input" 
                value={editForm.ownerId} 
                onChange={e => setEditForm(p => ({ ...p, ownerId: e.target.value }))}
                required
              >
                <option value="">Select Owner...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Custodian *</label>
              <select 
                className="form-input" 
                value={editForm.custodianId} 
                onChange={e => setEditForm(p => ({ ...p, custodianId: e.target.value }))}
                required
              >
                <option value="">Select Custodian...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Assigned User</label>
              <select 
                className="form-input" 
                value={editForm.assignedUserId} 
                onChange={e => setEditForm(p => ({ ...p, assignedUserId: e.target.value }))}
              >
                <option value="">Unassigned (Shared Pool)</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Location *</label>
              <select 
                className="form-input" 
                value={editForm.locationId} 
                onChange={e => setEditForm(p => ({ ...p, locationId: e.target.value }))}
                required
              >
                <option value="">Select Location...</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Security Classification</label>
              <select 
                className="form-input" 
                value={editForm.securityClassification} 
                onChange={e => setEditForm(p => ({ ...p, securityClassification: e.target.value }))}
              >
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
              </select>
            </div>
            <div>
              <label className="form-label">Business Criticality</label>
              <select 
                className="form-input" 
                value={editForm.businessCriticality} 
                onChange={e => setEditForm(p => ({ ...p, businessCriticality: e.target.value }))}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Warranty Expiry Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={editForm.warrantyEndDate} 
                onChange={e => setEditForm(p => ({ ...p, warrantyEndDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">End of Support Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={editForm.endOfSupportDate} 
                onChange={e => setEditForm(p => ({ ...p, endOfSupportDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Backup Available</label>
              <select 
                className="form-input" 
                value={editForm.backupAvailable ? 'true' : 'false'} 
                onChange={e => setEditForm(p => ({ ...p, backupAvailable: e.target.value === 'true' }))}
              >
                <option value="false">No Backup</option>
                <option value="true">Yes, Configured</option>
              </select>
            </div>
            {editForm.backupAvailable && (
              <div>
                <label className="form-label">Backup Location / Server Path *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editForm.backupLocation} 
                  onChange={e => setEditForm(p => ({ ...p, backupLocation: e.target.value }))}
                  required
                />
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Description / Purpose</label>
            <textarea 
              className="form-input" 
              style={{ minHeight: '60px' }}
              value={editForm.description} 
              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Known Vulnerabilities</label>
            <input 
              type="text" 
              className="form-input" 
              value={editForm.knownVulnerabilities} 
              onChange={e => setEditForm(p => ({ ...p, knownVulnerabilities: e.target.value }))}
              placeholder="e.g. CVE-2023-XXXX or Outdated firmware"
            />
          </div>
          <div>
            <label className="form-label">Policy Deviations</label>
            <input 
              type="text" 
              className="form-input" 
              value={editForm.policyDeviations} 
              onChange={e => setEditForm(p => ({ ...p, policyDeviations: e.target.value }))}
              placeholder="e.g. Single power supply redundancy deviation"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onBack}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} />
              <span>Save Updates</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Create Mode: Multi-step Wizard
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Register New Digital Asset</h1>
          <p style={{ color: '#4B5563' }}>Create physical system registry mappings</p>
        </div>
      </div>

      <div className="card">
        {/* Wizard Steps progress bar */}
        <div className="wizard-steps" style={{ marginBottom: '24px' }}>
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
            <span className="step-label">Review & Confirm</span>
          </div>
        </div>

        {error && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CLASSIFICATION */}
        {wizardStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Step 1: Select Taxonomy Classification</h3>
            
            <div className="form-group">
              <label className="form-label">Domain</label>
              <select 
                className="form-input" 
                value={createForm.domain} 
                onChange={e => setCreateForm(p => ({ ...p, domain: e.target.value, typeId: '', groupId: '', assetId: '', identifier: '' }))}
              >
                <option value="">Select Domain...</option>
                <option value="IT">IT (Information Technology)</option>
                <option value="OT">OT (Operational Technology)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Asset Type</label>
              <select 
                className="form-input" 
                value={createForm.typeId} 
                onChange={e => setCreateForm(p => ({ ...p, typeId: e.target.value, groupId: '', assetId: '', identifier: '' }))}
                disabled={!createForm.domain}
              >
                <option value="">Select Asset Type...</option>
                {filteredTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Asset Group</label>
              <select 
                className="form-input" 
                value={createForm.groupId} 
                onChange={e => setCreateForm(p => ({ ...p, groupId: e.target.value, assetId: '', identifier: '' }))}
                disabled={!createForm.typeId}
              >
                <option value="">Select Asset Group...</option>
                {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Asset Category</label>
              <select 
                className="form-input" 
                value={createForm.assetId} 
                onChange={e => setCreateForm(p => ({ ...p, assetId: e.target.value, identifier: '' }))}
                disabled={!createForm.groupId}
              >
                <option value="">Select Category...</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Generated Asset Identifier</label>
              <input 
                type="text" 
                className="form-input" 
                value={createForm.identifier} 
                onChange={e => setCreateForm(p => ({ ...p, identifier: e.target.value }))}
                disabled={!createForm.assetId}
                placeholder="Prefix auto-computed based on taxonomy selection"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={!createForm.identifier}
                onClick={() => setWizardStep(2)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SPECIFICATION */}
        {wizardStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Step 2: Technical Specifications</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Manufacturer</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createForm.manufacturer} 
                  onChange={e => setCreateForm(p => ({ ...p, manufacturer: e.target.value }))}
                  placeholder="e.g. Cisco, Schneider Electric"
                />
              </div>
              <div>
                <label className="form-label">Model Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createForm.modelNumber} 
                  onChange={e => setCreateForm(p => ({ ...p, modelNumber: e.target.value }))}
                  placeholder="e.g. Nexus 9000, PLC-M580"
                />
              </div>
              <div>
                <label className="form-label">Serial Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={createForm.serialNumber} 
                  onChange={e => setCreateForm(p => ({ ...p, serialNumber: e.target.value }))}
                  placeholder="Enter unique manufacturer serial ID"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Functional Purpose</label>
              <textarea 
                className="form-input" 
                style={{ minHeight: '80px' }}
                value={createForm.description} 
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                placeholder="State details on role in system topologies..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setWizardStep(1)}>Back</button>
              <button type="button" className="btn btn-primary" onClick={() => setWizardStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PLACEMENT & LIFECYCLE */}
        {wizardStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Step 3: Ownership, Governance & Location</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Asset Owner *</label>
                <select 
                  className="form-input" 
                  value={createForm.ownerId} 
                  onChange={e => setCreateForm(p => ({ ...p, ownerId: e.target.value }))}
                  required
                >
                  <option value="">Select Owner...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Custodian *</label>
                <select 
                  className="form-input" 
                  value={createForm.custodianId} 
                  onChange={e => setCreateForm(p => ({ ...p, custodianId: e.target.value }))}
                  required
                >
                  <option value="">Select Custodian...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.name})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Assigned User</label>
                <select 
                  className="form-input" 
                  value={createForm.assignedUserId} 
                  onChange={e => setCreateForm(p => ({ ...p, assignedUserId: e.target.value }))}
                >
                  <option value="">Unassigned (Shared Pool)</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Location *</label>
                <select 
                  className="form-input" 
                  value={createForm.locationId} 
                  onChange={e => setCreateForm(p => ({ ...p, locationId: e.target.value }))}
                  required
                >
                  <option value="">Select Location...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.plant_office} - {l.building} (Floor {l.floor || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Security Classification</label>
                <select 
                  className="form-input" 
                  value={createForm.securityClassification} 
                  onChange={e => setCreateForm(p => ({ ...p, securityClassification: e.target.value }))}
                >
                  <option value="Public">Public</option>
                  <option value="Internal">Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
              <div>
                <label className="form-label">Business Criticality</label>
                <select 
                  className="form-input" 
                  value={createForm.businessCriticality} 
                  onChange={e => setCreateForm(p => ({ ...p, businessCriticality: e.target.value }))}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="form-label">Purchase Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={createForm.purchaseDate} 
                  onChange={e => setCreateForm(p => ({ ...p, purchaseDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Warranty Expiry Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={createForm.warrantyEndDate} 
                  onChange={e => setCreateForm(p => ({ ...p, warrantyEndDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">End of Support Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={createForm.endOfSupportDate} 
                  onChange={e => setCreateForm(p => ({ ...p, endOfSupportDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Backup Status</label>
                <select 
                  className="form-input" 
                  value={createForm.backupAvailable ? 'true' : 'false'} 
                  onChange={e => setCreateForm(p => ({ ...p, backupAvailable: e.target.value === 'true' }))}
                >
                  <option value="false">No Backup</option>
                  <option value="true">Yes, Configured</option>
                </select>
              </div>
              {createForm.backupAvailable && (
                <div>
                  <label className="form-label">Backup Location / Server Path *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={createForm.backupLocation} 
                    onChange={e => setCreateForm(p => ({ ...p, backupLocation: e.target.value }))}
                    required
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setWizardStep(2)}>Back</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={!createForm.ownerId || !createForm.custodianId || !createForm.locationId}
                onClick={() => setWizardStep(4)} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {wizardStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Step 4: Review Asset Configuration</h3>
            
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px 16px', fontSize: '14px' }}>
                <strong style={{ color: '#4B5563' }}>Identifier:</strong>
                <span>{createForm.identifier}</span>

                <strong style={{ color: '#4B5563' }}>Domain / Class:</strong>
                <span>{createForm.domain} • {types.find(t => t.id === parseInt(createForm.typeId))?.name}</span>

                <strong style={{ color: '#4B5563' }}>Category:</strong>
                <span>{categories.find(c => c.id === parseInt(createForm.assetId))?.name}</span>

                <strong style={{ color: '#4B5563' }}>Manufacturer / Model:</strong>
                <span>{createForm.manufacturer || 'N/A'} (Model: {createForm.modelNumber || 'N/A'})</span>

                <strong style={{ color: '#4B5563' }}>Serial Number:</strong>
                <span>{createForm.serialNumber || 'N/A'}</span>

                <strong style={{ color: '#4B5563' }}>Owner Name:</strong>
                <span>{users.find(u => u.id === parseInt(createForm.ownerId))?.name}</span>

                <strong style={{ color: '#4B5563' }}>Custodian Name:</strong>
                <span>{users.find(u => u.id === parseInt(createForm.custodianId))?.name}</span>

                <strong style={{ color: '#4B5563' }}>Security Level:</strong>
                <span>{createForm.securityClassification} • Criticality: {createForm.businessCriticality}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setWizardStep(3)}>Back</button>
              <button type="button" className="btn btn-primary" onClick={handleCreateSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} />
                <span>Register Asset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AssetWizard;
