import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taxonomyService } from '../../services/taxonomyService';
import { locationService } from '../../services/locationService';
import type { AssetType, AssetGroup } from '../../types';
import { Plus, MapPin, Grid } from 'lucide-react';

export const Settings: React.FC = () => {
  const { setGlobalLoading } = useAuth();

  // Lookups
  const [types, setTypes] = useState<AssetType[]>([]);
  const [groups, setGroups] = useState<AssetGroup[]>([]);

  // Add Group State
  const [newGroupDomain, setNewGroupDomain] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  // Add Category State
  const [newCatGroupId, setNewCatGroupId] = useState('');
  const [newCatTypeId, setNewCatTypeId] = useState('');
  const [newCatName, setNewCatName] = useState('');

  // Add Location State
  const [locPlantOffice, setLocPlantOffice] = useState('');
  const [locBuilding, setLocBuilding] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [locRoom, setLocRoom] = useState('');
  const [locRack, setLocRack] = useState('');

  const loadLookups = async () => {
    setGlobalLoading(true);
    try {
      const [tData, gData] = await Promise.all([
        taxonomyService.getTypes(),
        taxonomyService.getGroups()
      ]);
      setTypes(tData);
      setGroups(gData);
    } catch (e) {
      console.error('Failed to load lookups', e);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupDomain || !newGroupName) return;
    setGlobalLoading(true);
    try {
      await taxonomyService.createGroup({ domain: newGroupDomain, name: newGroupName });
      alert(`Asset group "${newGroupName}" added successfully.`);
      setNewGroupName('');
      setNewGroupDomain('');
      loadLookups();
    } catch (err: any) {
      alert(err.message || 'Failed to add group');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatGroupId || !newCatTypeId || !newCatName) return;
    setGlobalLoading(true);
    try {
      await taxonomyService.createCategory({
        asset_group_id: parseInt(newCatGroupId),
        asset_type_id: parseInt(newCatTypeId),
        name: newCatName
      });
      alert(`Asset Category "${newCatName}" added successfully.`);
      setNewCatName('');
      loadLookups();
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locPlantOffice || !locBuilding) return;
    setGlobalLoading(true);
    try {
      await locationService.create({
        plant_office: locPlantOffice,
        building: locBuilding,
        floor: locFloor || undefined,
        room: locRoom || undefined,
        rack: locRack || undefined
      });
      alert('Location configured successfully.');
      setLocPlantOffice('');
      setLocBuilding('');
      setLocFloor('');
      setLocRoom('');
      setLocRack('');
    } catch (err: any) {
      alert(err.message || 'Failed to configure location');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>System Configuration & Parameters</h1>
        <p style={{ color: '#4B5563' }}>Manage system-wide taxonomies, asset groupings, and datacenter locations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* ADD GROUP */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid size={18} style={{ color: '#7c3aed' }} />
            <span>Create Asset Group</span>
          </h2>
          <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label">Domain Class *</label>
              <select className="form-input" required value={newGroupDomain} onChange={e => setNewGroupDomain(e.target.value)}>
                <option value="">Select Domain...</option>
                <option value="IT">IT (Information Technology)</option>
                <option value="OT (Operational Technology)">OT (Operational Technology)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Asset Group Name *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                placeholder="e.g. Environmental Monitoring, Mainframes"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
              <Plus size={16} />
              <span>Create Group</span>
            </button>
          </form>
        </div>

        {/* ADD CATEGORY */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid size={18} style={{ color: '#3b82f6' }} />
            <span>Create Asset Category</span>
          </h2>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label">Asset Group *</label>
              <select className="form-input" required value={newCatGroupId} onChange={e => setNewCatGroupId(e.target.value)}>
                <option value="">Select Group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.domain})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Asset Type *</label>
              <select className="form-input" required value={newCatTypeId} onChange={e => setNewCatTypeId(e.target.value)}>
                <option value="">Select Type...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Category Name *</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                placeholder="e.g. Temperature Sensor, SQL Server Core"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
              <Plus size={16} />
              <span>Create Category</span>
            </button>
          </form>
        </div>

        {/* ADD LOCATION */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: '#10b981' }} />
            <span>Configure Operational Location</span>
          </h2>
          <form onSubmit={handleAddLocation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label">Plant / Office Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={locPlantOffice} 
                  onChange={e => setLocPlantOffice(e.target.value)} 
                  placeholder="e.g. OHPC Corporate Head Office"
                />
              </div>
              <div>
                <label className="form-label">Building / Block *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={locBuilding} 
                  onChange={e => setLocBuilding(e.target.value)} 
                  placeholder="e.g. Block A, Switchyard Control Room"
                />
              </div>
              <div>
                <label className="form-label">Floor Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={locFloor} 
                  onChange={e => setLocFloor(e.target.value)} 
                  placeholder="e.g. 1st Floor, Basement"
                />
              </div>
              <div>
                <label className="form-label">Room Identifier</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={locRoom} 
                  onChange={e => setLocRoom(e.target.value)} 
                  placeholder="e.g. Server Room B, PLC Panel Room"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Rack Location</label>
              <input 
                type="text" 
                className="form-input" 
                value={locRack} 
                onChange={e => setLocRack(e.target.value)} 
                placeholder="e.g. Rack 03, Shelf 2"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
              <Plus size={16} />
              <span>Configure Location</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Settings;
