import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, ChevronRight, 
  Monitor, Smartphone, Laptop, 
  ExternalLink, Download, Trash, Trash2, Check,
  Edit, Save, X
} from 'lucide-react';
import { deviceService, groupService } from '../services/api';
import { Device, Group } from '../types';
import { cn } from '../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';
import AddDeviceModal from '../components/AddDeviceModal';
import { toast } from 'react-toastify';

export default function Devices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(() => searchParams.get('group') || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editedDevices, setEditedDevices] = useState<Record<string, Device>>({});
  const [isSavingTable, setIsSavingTable] = useState(false);

  // Custom Group-level metadata states
  const [isEditingGroupMeta, setIsEditingGroupMeta] = useState(false);
  const [editedGroupHeadName, setEditedGroupHeadName] = useState('');
  const [editedNodalOfficer, setEditedNodalOfficer] = useState('');
  const [editedNodalContact, setEditedNodalContact] = useState('');
  const [editedSwitchName, setEditedSwitchName] = useState('');
  const [editedExistingPorts, setEditedExistingPorts] = useState('');
  const [editedConnectedPorts, setEditedConnectedPorts] = useState('');
  const [editedUnconnectedPorts, setEditedUnconnectedPorts] = useState('');
  const [editedLanCount, setEditedLanCount] = useState('');
  const [editedInternetCount, setEditedInternetCount] = useState('');
  const [editedStandaloneCount, setEditedStandaloneCount] = useState('');
  const [editedTotalSystems, setEditedTotalSystems] = useState('');
  const [isSavingGroupMeta, setIsSavingGroupMeta] = useState(false);

  const activeGroupObj = groups.find(g => g.name.toLowerCase() === selectedGroup.toLowerCase()) || groups[0];

  const groupDevices = activeGroupObj 
    ? devices.filter(d => (d.groupName || '').toLowerCase() === activeGroupObj.name.toLowerCase())
    : [];

  const dynamicTotal = groupDevices.length;
  const dynamicLan = groupDevices.filter(d => d.connectionType === 'LAN').length;
  const dynamicInternet = groupDevices.filter(d => d.connectionType === 'Internet').length;
  const dynamicStandalone = groupDevices.filter(d => d.connectionType === 'Standalone').length;

  const startEditingGroup = () => {
    if (!activeGroupObj) return;
    setEditedGroupHeadName(activeGroupObj.groupHeadName || '');
    setEditedNodalOfficer(activeGroupObj.nodalOfficer || '');
    setEditedNodalContact(activeGroupObj.nodalContact || '');
    setEditedSwitchName(activeGroupObj.switchName || '');
    setEditedExistingPorts(String(activeGroupObj.existingPorts === undefined ? 24 : activeGroupObj.existingPorts));
    setEditedConnectedPorts(String(activeGroupObj.connectedPorts === undefined ? dynamicTotal : activeGroupObj.connectedPorts));
    setEditedUnconnectedPorts(String(activeGroupObj.unconnectedPorts === undefined ? Math.max(0, 24 - dynamicTotal) : activeGroupObj.unconnectedPorts));
    setEditedLanCount(String(activeGroupObj.lanCount === undefined ? dynamicLan : activeGroupObj.lanCount));
    setEditedInternetCount(String(activeGroupObj.internetCount === undefined ? dynamicInternet : activeGroupObj.internetCount));
    setEditedStandaloneCount(String(activeGroupObj.standaloneCount === undefined ? dynamicStandalone : activeGroupObj.standaloneCount));
    setEditedTotalSystems(String(activeGroupObj.deviceCount === undefined ? dynamicTotal : activeGroupObj.deviceCount));
    setIsEditingGroupMeta(true);
  };

  const saveGroupMeta = async () => {
    if (!activeGroupObj) return;
    setIsSavingGroupMeta(true);
    try {
      await groupService.updateGroup(activeGroupObj.id, {
        groupHeadName: editedGroupHeadName,
        nodalOfficer: editedNodalOfficer,
        nodalContact: editedNodalContact,
        switchName: editedSwitchName,
        existingPorts: Number(editedExistingPorts) || 0,
        connectedPorts: Number(editedConnectedPorts) || 0,
        unconnectedPorts: Number(editedUnconnectedPorts) || 0,
        lanCount: Number(editedLanCount) || 0,
        internetCount: Number(editedInternetCount) || 0,
        standaloneCount: Number(editedStandaloneCount) || 0,
        deviceCount: Number(editedTotalSystems) || 0,
      });
      toast.success("Group configuration synchronized securely.");
      setIsEditingGroupMeta(false);
      await fetchData();
    } catch (err) {
      toast.error("Failed to commit and replicate group configuration.");
    } finally {
      setIsSavingGroupMeta(false);
    }
  };

  const handleFieldChange = (id: string, field: keyof Device, value: any) => {
    setEditedDevices(prev => {
      const current = prev[id] || devices.find(d => d.id === id);
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const handleSaveTable = async () => {
    setIsSavingTable(true);
    try {
      const updatePromises = Object.entries(editedDevices).map(([id, updatedNode]) => {
        const updates: Partial<Device> = {
          hostname: updatedNode.hostname ?? '',
          username: updatedNode.username ?? '',
          ipAddress: updatedNode.ipAddress ?? '',
          connectionType: updatedNode.connectionType ?? 'LAN',
          os: updatedNode.os ?? '',
          groupName: updatedNode.groupName ?? '',
          status: updatedNode.status ?? 'online',
          switchType: updatedNode.switchType ?? '',
          macAddress: updatedNode.macAddress ?? '',
          escanVerified: updatedNode.escanVerified ?? false,
        };
        return deviceService.updateDevice(id, updates);
      });

      await Promise.all(updatePromises);
      toast.success('Successfully updated all networked inventory records.');
      setIsEditingTable(false);
      setEditedDevices({});
      await fetchData();
    } catch (err) {
      toast.error('Failed to commit inline database edits.');
      console.error(err);
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleCancelTable = () => {
    setIsEditingTable(false);
    setEditedDevices({});
  };

  useEffect(() => {
    const groupParam = searchParams.get('group') || '';
    setSelectedGroup(groupParam);
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [d, g] = await Promise.all([
        deviceService.getDevices(),
        groupService.getGroups()
      ]);
      setDevices(d);
      setGroups(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleOpenModal = () => setIsAddModalOpen(true);
    window.addEventListener('open-add-device-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-device-modal', handleOpenModal);
  }, []);

  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.hostname.toLowerCase().includes(search.toLowerCase()) ||
      d.ipAddress.includes(search) ||
      d.macAddress.toLowerCase().includes(search.toLowerCase()) ||
      d.username.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup ? (d.groupName || '').toLowerCase() === selectedGroup.toLowerCase() : true;
    return matchesSearch && matchesGroup;
  });

  const toggleDeviceSelection = (id: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredDevices.map(d => d.id);
    const allVisibleSelected = visibleIds.every(id => selectedDeviceIds.includes(id));

    if (allVisibleSelected) {
      setSelectedDeviceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedDeviceIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleDeleteDevice = async (id: string, hostname: string) => {
    if (confirm(`Are you sure you want to permanently delete system node "${hostname}" from inventory?`)) {
      try {
        await deviceService.deleteDevice(id);
        toast.success(`System node "${hostname}" successfully removed.`);
        setSelectedDeviceIds(prev => prev.filter(dId => dId !== id));
        fetchData();
      } catch (err) {
        toast.error('Failed to delete system node.');
      }
    }
  };

  const handleBulkDeleteDevices = async () => {
    const totalCount = selectedDeviceIds.length;
    if (confirm(`CRITICAL WARNING: You are about to permanently decommission ${totalCount} system nodes. This cannot be undone. Confirm network deletion?`)) {
      setIsDeletingBulk(true);
      try {
        for (const id of selectedDeviceIds) {
          await deviceService.deleteDevice(id);
        }
        toast.success(`Successfully decommissioned ${totalCount} systems.`);
        setSelectedDeviceIds([]);
        fetchData();
      } catch (err) {
        toast.error('An error occurred during bulk decommissioning.');
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  if (loading) return <div className="text-cyber-blue font-mono animate-pulse p-8">EXTRACTING NODE INVENTORY...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System Inventory</h2>
          <p className="text-gray-400 text-sm">Managing {devices.length} verified network systems.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => {
              const headers = ['hostname', 'ipAddress', 'macAddress', 'connectionType', 'os', 'groupName', 'status', 'username'];
              const rows = devices.map(d => [d.hostname, d.ipAddress, d.macAddress, d.connectionType, d.os, d.groupName, d.status, d.username]);
              const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([content], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `csg_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              toast.success('Inventory exported to CSV successfully.');
            }}
            className="cyber-button-primary bg-white/10 text-white border border-white/20 hover:bg-white/20"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="cyber-button-primary"
          >
            <Plus size={18} />
            Add System
          </button>
        </div>
      </div>

      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchData} 
      />

      {/* Center aligned Group Information Card with custom mutable configuration fields */}
      {activeGroupObj && (
        <div className="cyber-panel p-6 border-cyber-blue/30 bg-cyber-card/85 shadow-[0_0_15px_rgba(56,189,248,0.05)] rounded-sm font-mono relative">
          {/* Edit Button in Corner */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {isEditingGroupMeta ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingGroupMeta(false)}
                  disabled={isSavingGroupMeta}
                  className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-cyber-border text-[10px] text-gray-300 font-mono uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <X size={10} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveGroupMeta}
                  disabled={isSavingGroupMeta}
                  className="px-2.5 py-1 bg-cyber-green text-black border border-cyber-green font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer hover:bg-green-400 hover:shadow-[0_0_10px_rgba(74,222,128,0.3)] transition-all"
                >
                  <Save size={10} className={isSavingGroupMeta ? "animate-spin" : ""} />
                  {isSavingGroupMeta ? "Saving..." : "Save Config"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditingGroup}
                className="px-2.5 py-1 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 text-[10px] text-cyber-blue font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Edit size={10} />
                Edit Group Details
              </button>
            )}
          </div>

          <div className="text-center max-w-3xl mx-auto space-y-3">
            {/* Group Name centered & bold */}
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase glitch-text">
              {activeGroupObj.name}
            </h1>

            {/* Subtext: Group Head Name & IT Nodal Officer Name & Contact in bold, good color */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs border-b border-cyber-border/40 pb-4">
              <div>
                <span className="text-cyber-blue font-extrabold tracking-wider bg-cyber-blue/5 border border-cyber-blue/20 px-2 py-0.5 rounded-sm">GROUP HEAD: </span>
                {isEditingGroupMeta ? (
                  <input
                    type="text"
                    required
                    className="cyber-input py-0.5 px-2 text-xs text-white max-w-48 ml-1 bg-black/40 border-cyber-blue/30 inline-block"
                    value={editedGroupHeadName}
                    onChange={e => setEditedGroupHeadName(e.target.value)}
                  />
                ) : (
                  <span className="text-white font-bold ml-1">{activeGroupObj.groupHeadName || "ADMIN-IN-CHARGE"}</span>
                )}
              </div>
              <div className="hidden sm:inline text-cyber-border">|</div>
              <div>
                <span className="text-cyber-green font-extrabold tracking-wider bg-cyber-green/5 border border-cyber-green/20 px-2 py-0.5 rounded-sm">IT NODAL OFFICER: </span>
                {isEditingGroupMeta ? (
                  <input
                    type="text"
                    required
                    className="cyber-input py-0.5 px-2 text-xs text-white max-w-44 ml-1 bg-black/40 border-cyber-green/30 inline-block"
                    value={editedNodalOfficer}
                    onChange={e => setEditedNodalOfficer(e.target.value)}
                  />
                ) : (
                  <span className="text-white font-bold ml-1">{activeGroupObj.nodalOfficer || "SECURE-GATEKEEPER"}</span>
                )}
              </div>
              <div className="hidden sm:inline text-cyber-border">|</div>
              <div>
                <span className="text-cyber-yellow font-extrabold tracking-wider bg-cyber-yellow/5 border border-cyber-yellow/20 px-2 py-0.5 rounded-sm">CONTACT: </span>
                {isEditingGroupMeta ? (
                  <input
                    type="text"
                    required
                    className="cyber-input py-0.5 px-2 text-xs text-white max-w-44 ml-1 bg-black/40 border-cyber-yellow/30 inline-block"
                    value={editedNodalContact}
                    onChange={e => setEditedNodalContact(e.target.value)}
                  />
                ) : (
                  <span className="text-white font-bold ml-1">{activeGroupObj.nodalContact || "+91-XXXXXXXXXX"}</span>
                )}
              </div>
            </div>
          </div>

          {/* Table list of rows and cols to arrange systems, switch name, and ports */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto border-collapse border border-cyber-border bg-black/30 text-xs text-left">
              <thead>
                <tr className="border-b border-cyber-border bg-white/5 text-[10px] font-bold text-cyber-text-muted uppercase tracking-wider">
                  <th className="px-4 py-2 border-r border-cyber-border w-1/4">Metric Name</th>
                  <th className="px-4 py-2 border-r border-cyber-border text-center w-1/4">Inventory Metric Value</th>
                  <th className="px-4 py-2 border-r border-cyber-border w-1/4">Infrastructure Metric</th>
                  <th className="px-4 py-2 text-center w-1/4">Resource Definition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40">
                <tr>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    Total No. of Systems
                  </td>
                  <td className="px-4 py-3 border-r border-cyber-border/40 text-center font-bold text-white">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedTotalSystems}
                        onChange={e => setEditedTotalSystems(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.deviceCount || dynamicTotal
                    )}
                  </td>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    Network Switch Name/No.
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-cyber-blue">
                    {isEditingGroupMeta ? (
                      <input
                        type="text"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-36 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedSwitchName}
                        onChange={e => setEditedSwitchName(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.switchName || "N/A"
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    No. of LAN Systems
                  </td>
                  <td className="px-4 py-3 border-r border-cyber-border/40 text-center font-bold text-cyber-blue">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedLanCount}
                        onChange={e => setEditedLanCount(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.lanCount || dynamicLan
                    )}
                  </td>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    No. of Existing Ports
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedExistingPorts}
                        onChange={e => setEditedExistingPorts(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.existingPorts || 0
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    No. of Internet Systems
                  </td>
                  <td className="px-4 py-3 border-r border-cyber-border/40 text-center font-bold text-cyber-green">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedInternetCount}
                        onChange={e => setEditedInternetCount(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.internetCount || dynamicInternet
                    )}
                  </td>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    No. of Connected Ports
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-cyber-green">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedConnectedPorts}
                        onChange={e => setEditedConnectedPorts(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.connectedPorts || 0
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    No. of Standalone Systems
                  </td>
                  <td className="px-4 py-3 border-r border-cyber-border/40 text-center font-bold text-cyber-yellow">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedStandaloneCount}
                        onChange={e => setEditedStandaloneCount(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.standaloneCount || dynamicStandalone
                    )}
                  </td>
                  <td className="px-4 py-3 bg-white/5 font-bold text-cyber-text-muted border-r border-cyber-border/40">
                    No. of Unconnected Ports
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-cyber-red">
                    {isEditingGroupMeta ? (
                      <input
                        type="number"
                        className="cyber-input py-0.5 px-2 text-xs text-white w-24 text-center bg-black/50 border-cyber-border focus:border-cyber-blue/30 inline-block"
                        value={editedUnconnectedPorts}
                        onChange={e => setEditedUnconnectedPorts(e.target.value)}
                      />
                    ) : (
                      activeGroupObj.unconnectedPorts || 0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters and Bulk Action Warning */}
      <div className="space-y-4">
        {selectedDeviceIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between bg-red-950/40 border border-red-500/30 p-4 rounded-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 text-red-400 animate-pulse rounded-sm">
                <Trash2 size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  System Decommission Control Gate
                </p>
                <p className="text-[10px] text-red-300">
                  {selectedDeviceIds.length} node(s) selected for deletion across your local deployment segment.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDeviceIds([])}
                className="px-3 py-1 text-[10px] hover:text-white text-gray-400 uppercase font-bold border border-transparent hover:border-gray-700 transition-all font-mono"
              >
                Clear
              </button>
              <button
                disabled={isDeletingBulk}
                onClick={handleBulkDeleteDevices}
                className="px-4 py-1.5 bg-red-800 hover:bg-red-700 border border-red-500/30 text-white font-bold text-xs uppercase rounded-sm transition-all font-mono"
              >
                {isDeletingBulk ? 'DELETING...' : 'DECOMMISSION SELECTED'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by hostname, IP, MAC, or user..." 
              className="cyber-input w-full pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select 
              className="cyber-input min-w-48 appearance-none"
              value={selectedGroup}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGroup(val);
                if (val) {
                  setSearchParams({ group: val });
                } else {
                  setSearchParams({});
                }
              }}
            >
              <option value="">All Regions</option>
              {groups.map(g => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
            <button className="cyber-panel p-2 flex items-center justify-center hover:bg-white/5">
              <Filter size={18} className="text-cyber-blue" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cyber-panel">
        <div className="cyber-panel-header flex justify-between items-center gap-4">
           <span>NETWORKED_NODES_INVENTORY</span>
           <div className="flex items-center gap-2">
             {isEditingTable ? (
               <>
                 <button
                   type="button"
                   onClick={handleCancelTable}
                   disabled={isSavingTable}
                   className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-cyber-border text-gray-300 font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
                 >
                   <X size={10} />
                   Cancel
                 </button>
                 <button
                   type="button"
                   onClick={handleSaveTable}
                   disabled={isSavingTable}
                   className="px-2.5 py-1 bg-cyber-green text-black border border-cyber-green font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer hover:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all animate-pulse"
                 >
                   <Save size={10} />
                   {isSavingTable ? 'Saving...' : 'Save Changes'}
                 </button>
               </>
             ) : (
               <button
                 type="button"
                 onClick={() => {
                   setIsEditingTable(true);
                   const initialEdits: Record<string, Device> = {};
                   filteredDevices.forEach(d => {
                     initialEdits[d.id] = { ...d };
                   });
                   setEditedDevices(initialEdits);
                 }}
                 className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-cyber-border text-[9px] text-cyber-blue font-mono uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
               >
                 <Edit size={10} />
                 Edit Inventory
               </button>
             )}
             <span className="text-cyber-green font-mono text-[10px] hidden sm:inline ml-2">STATUS: [STABLE]</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyber-border bg-white/5 text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredDevices.length > 0 && filteredDevices.every(d => selectedDeviceIds.includes(d.id))}
                    onChange={toggleSelectAllVisible}
                    className="w-3.5 h-3.5 rounded-sm bg-black border border-cyber-border text-cyber-blue focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 min-w-[140px]">Node Identity</th>
                <th className="px-4 py-4 min-w-[120px]">Network Vector</th>
                <th className="px-4 py-4 min-w-[150px]">MAC Address</th>
                <th className="px-4 py-4 min-w-[140px]">Switch Type</th>
                <th className="px-4 py-4 min-w-[110px]">Connection</th>
                <th className="px-4 py-4 min-w-[125px]">Platform</th>
                <th className="px-4 py-4 min-w-[110px]">Access Group</th>
                <th className="px-4 py-4 min-w-[90px]">Status</th>
                <th className="px-4 py-4 min-w-[120px] text-center">E-Scan Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {filteredDevices.map((device) => {
                const isSelected = selectedDeviceIds.includes(device.id);
                const currentNode = editedDevices[device.id] || device;
                return (
                  <tr 
                    key={device.id} 
                    className={cn(
                      "hover:bg-white/5 transition-colors group text-[12px]",
                      isSelected && "bg-red-950/10 hover:bg-red-950/20"
                    )}
                  >
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDeviceSelection(device.id)}
                        className="w-3.5 h-3.5 rounded-sm bg-black border border-cyber-border text-cyber-blue focus:ring-0 cursor-pointer"
                      />
                    </td>
                    
                    {/* Node Identity */}
                    <td className="px-4 py-4">
                      {isEditingTable ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            type="text"
                            required
                            placeholder="Hostname"
                            className="cyber-input w-full py-1 px-2 text-xs text-white"
                            value={currentNode.hostname}
                            onChange={e => handleFieldChange(device.id, 'hostname', e.target.value)}
                          />
                          <input 
                            type="text"
                            placeholder="Username"
                            className="cyber-input w-full py-0.5 px-2 text-[10px] text-cyber-text-muted font-mono"
                            value={currentNode.username}
                            onChange={e => handleFieldChange(device.id, 'username', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-7 h-7 rounded-sm flex items-center justify-center border shrink-0",
                            device.status === 'online' ? "bg-cyber-blue/10 border-cyber-blue/30 text-cyber-blue" : "bg-gray-800/50 border-gray-700 text-gray-500"
                          )}>
                            <Monitor size={12} />
                          </div>
                          <div className="truncate">
                            <Link to={`/devices/${device.id}`} className="font-bold text-white hover:text-cyber-blue transition-colors line-clamp-1">{device.hostname}</Link>
                            <p className="text-[10px] text-cyber-text-muted font-mono tracking-tighter truncate">{device.username}</p>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Network Vector (IP Address) */}
                    <td className="px-4 py-4 font-mono text-cyber-text-muted">
                      {isEditingTable ? (
                        <input 
                          type="text"
                          required
                          placeholder="IP Address"
                          className="cyber-input w-full py-1 px-2 text-xs text-white font-mono"
                          value={currentNode.ipAddress}
                          onChange={e => handleFieldChange(device.id, 'ipAddress', e.target.value)}
                        />
                      ) : (
                        device.ipAddress
                      )}
                    </td>

                    {/* MAC Address */}
                    <td className="px-4 py-4 font-mono text-cyber-text-muted">
                      {isEditingTable ? (
                        <input 
                          type="text"
                          placeholder="MAC Address"
                          className="cyber-input w-full py-1 px-2 text-xs text-white font-mono"
                          value={currentNode.macAddress || ''}
                          onChange={e => handleFieldChange(device.id, 'macAddress', e.target.value)}
                        />
                      ) : (
                        device.macAddress || 'N/A'
                      )}
                    </td>

                    {/* Switch Type */}
                    <td className="px-4 py-4 text-cyber-text-muted">
                      {isEditingTable ? (
                        <input 
                          type="text"
                          placeholder="Switch Type"
                          className="cyber-input w-full py-1 px-2 text-xs text-white"
                          value={currentNode.switchType || ''}
                          onChange={e => handleFieldChange(device.id, 'switchType', e.target.value)}
                        />
                      ) : (
                        device.switchType || 'N/A'
                      )}
                    </td>

                    {/* Connection */}
                    <td className="px-4 py-4">
                      {isEditingTable ? (
                        <select 
                          className="cyber-input w-full py-1 px-2 text-xs appearance-none"
                          value={currentNode.connectionType}
                          onChange={e => handleFieldChange(device.id, 'connectionType', e.target.value)}
                        >
                          <option value="LAN">LAN</option>
                          <option value="Standalone">Standalone</option>
                          <option value="Internet">Internet</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          device.connectionType === 'LAN' ? "text-cyber-blue" :
                          device.connectionType === 'Standalone' ? "text-cyber-yellow" :
                          "text-cyber-green"
                        )}>
                          {device.connectionType}
                        </span>
                      )}
                    </td>

                    {/* Platform */}
                    <td className="px-4 py-4 text-cyber-text-muted">
                      {isEditingTable ? (
                        <input 
                          type="text"
                          placeholder="Platform OS"
                          className="cyber-input w-full py-1 px-2 text-xs text-white"
                          value={currentNode.os}
                          onChange={e => handleFieldChange(device.id, 'os', e.target.value)}
                        />
                      ) : (
                        device.os
                      )}
                    </td>

                    {/* Access Group */}
                    <td className="px-4 py-4">
                      {isEditingTable ? (
                        <select 
                          className="cyber-input w-full py-1 px-2 text-xs appearance-none"
                          value={currentNode.groupName}
                          onChange={e => handleFieldChange(device.id, 'groupName', e.target.value)}
                        >
                          <option value="">Select Group</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-cyber-text-muted border border-cyber-border px-2 py-0.5 rounded-sm uppercase bg-cyber-bg font-mono">
                          {device.groupName}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {isEditingTable ? (
                        <select 
                          className="cyber-input w-full py-1 px-2 text-xs appearance-none"
                          value={currentNode.status}
                          onChange={e => handleFieldChange(device.id, 'status', e.target.value)}
                        >
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                      ) : (
                        <span className={cn("status-tag", device.status === 'online' ? "tag-online" : "opacity-30 border-gray-600")}>
                          {device.status}
                        </span>
                      )}
                    </td>

                    {/* E-Scan Verified */}
                    <td className="px-4 py-4 text-center">
                      {isEditingTable ? (
                        <input 
                          type="checkbox"
                          checked={!!currentNode.escanVerified}
                          onChange={e => handleFieldChange(device.id, 'escanVerified', e.target.checked)}
                          className="w-4 h-4 rounded bg-black border border-cyber-border text-cyber-blue focus:ring-0 cursor-pointer mx-auto"
                        />
                      ) : (
                        <div className="flex items-center justify-center">
                          {device.escanVerified ? (
                            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-[9px] uppercase tracking-wider rounded-sm font-mono flex items-center gap-1">
                              <Check size={8} strokeWidth={4} />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500/80 font-bold text-[9px] uppercase tracking-wider rounded-sm font-mono">
                              UNVERIFIED
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Shadow Footer */}
        <div className="px-6 py-3 border-t border-cyber-border bg-black/20 flex items-center justify-between">
          <p className="text-[10px] font-mono text-gray-500">DISPLAYING {filteredDevices.length} ENTRIES</p>
          <div className="flex gap-2">
             <button className="px-2 py-1 rounded border border-cyber-border text-[10px] text-gray-400">PREV</button>
             <button className="px-2 py-1 rounded border border-cyber-blue text-[10px] text-cyber-blue">1</button>
             <button className="px-2 py-1 rounded border border-cyber-border text-[10px] text-gray-400">2</button>
             <button className="px-2 py-1 rounded border border-cyber-border text-[10px] text-gray-400">NEXT</button>
          </div>
        </div>
      </div>
    </div>
  );
}
