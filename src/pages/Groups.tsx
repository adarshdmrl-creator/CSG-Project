import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Monitor, ShieldAlert, 
  ArrowRight, Search, Plus, Filter,
  Activity, Globe, Lock, MoreVertical, Edit, Trash,
  Save, X
} from 'lucide-react';
import { groupService, deviceService } from '../services/api';
import { Group, Device } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal';
import EditGroupModal from '../components/EditGroupModal';
import { toast } from 'react-toastify';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDropdownGroupId, setActiveDropdownGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Inspected Group Details states
  const [inspectedGroup, setInspectedGroup] = useState<Group | null>(null);
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
  const [editedLastCaseRaised, setEditedLastCaseRaised] = useState('');
  const [editedLastCaseComment, setEditedLastCaseComment] = useState('');
  const [isSavingGroupMeta, setIsSavingGroupMeta] = useState(false);

  const fetchData = async () => {
    try {
      const [g, d] = await Promise.all([
        groupService.getGroups(),
        deviceService.getDevices()
      ]);
      setGroups(g);
      setDevices(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditingGroup = (gObj: Group) => {
    const groupDevices = devices.filter(d => (d.groupName || '').toLowerCase() === gObj.name.toLowerCase());
    const dynamicTotalDetail = groupDevices.length;
    const dynamicLanDetail = groupDevices.filter(d => d.connectionType === 'LAN').length;
    const dynamicInternetDetail = groupDevices.filter(d => d.connectionType === 'Internet').length;
    const dynamicStandaloneDetail = groupDevices.filter(d => d.connectionType === 'Standalone').length;

    setEditedGroupHeadName(gObj.groupHeadName || '');
    setEditedNodalOfficer(gObj.nodalOfficer || '');
    setEditedNodalContact(gObj.nodalContact || '');
    setEditedSwitchName(gObj.switchName || '');
    setEditedExistingPorts(String(gObj.existingPorts === undefined ? 24 : gObj.existingPorts));
    setEditedConnectedPorts(String(gObj.connectedPorts === undefined ? dynamicTotalDetail : gObj.connectedPorts));
    setEditedUnconnectedPorts(String(gObj.unconnectedPorts === undefined ? Math.max(0, 24 - dynamicTotalDetail) : gObj.unconnectedPorts));
    setEditedLanCount(String(gObj.lanCount === undefined ? dynamicLanDetail : gObj.lanCount));
    setEditedInternetCount(String(gObj.internetCount === undefined ? dynamicInternetDetail : gObj.internetCount));
    setEditedStandaloneCount(String(gObj.standaloneCount === undefined ? dynamicStandaloneDetail : gObj.standaloneCount));
    setEditedTotalSystems(String(gObj.deviceCount === undefined ? dynamicTotalDetail : gObj.deviceCount));
    setEditedLastCaseRaised(gObj.lastCaseRaised || '');
    setEditedLastCaseComment(gObj.lastCaseComment || '');
    setIsEditingGroupMeta(true);
  };

  const saveGroupMeta = async () => {
    if (!inspectedGroup) return;
    setIsSavingGroupMeta(true);
    try {
      await groupService.updateGroup(inspectedGroup.id, {
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
        lastCaseRaised: editedLastCaseRaised,
        lastCaseComment: editedLastCaseComment,
      });
      toast.success("Group configuration synchronized securely.");
      setIsEditingGroupMeta(false);
      
      const [updatedGroups, updatedDevices] = await Promise.all([
        groupService.getGroups(),
        deviceService.getDevices()
      ]);
      setGroups(updatedGroups);
      setDevices(updatedDevices);
      
      const updatedInspected = updatedGroups.find(g => g.id === inspectedGroup.id);
      if (updatedInspected) {
        setInspectedGroup(updatedInspected);
      }
    } catch (err) {
      toast.error("Failed to commit and replicate group configuration.");
    } finally {
      setIsSavingGroupMeta(false);
    }
  };

  const groupDevices = inspectedGroup 
    ? devices.filter(d => (d.groupName || '').toLowerCase() === inspectedGroup.name.toLowerCase())
    : [];

  const dynamicTotal = groupDevices.length;
  const dynamicLan = groupDevices.filter(d => d.connectionType === 'LAN').length;
  const dynamicInternet = groupDevices.filter(d => d.connectionType === 'Internet').length;
  const dynamicStandalone = groupDevices.filter(d => d.connectionType === 'Standalone').length;

  useEffect(() => {
    fetchData();
  }, []);

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggleGroupSelection = (id: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredGroups.map(g => g.id);
    const allVisibleSelected = visibleIds.every(id => selectedGroupIds.includes(id));
    
    if (allVisibleSelected) {
      // Deselect visible
      setSelectedGroupIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedGroupIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const executeDeleteGroup = async (id: string, name: string) => {
    try {
      await groupService.deleteGroup(id);
      toast.success(`Cluster "${name}" and its associated hosts eliminated.`);
      setSelectedGroupIds(prev => prev.filter(gid => gid !== id));
      fetchData();
    } catch (err) {
      toast.error('Failed to eliminate cluster.');
    } finally {
      setDeletingGroup(null);
    }
  };

  const executeBulkDelete = async () => {
    const selectedCount = selectedGroupIds.length;
    setIsDeletingBulk(true);
    try {
      for (const id of selectedGroupIds) {
        const group = groups.find(g => g.id === id);
        if (group) {
          await groupService.deleteGroup(id);
        }
      }
      toast.success(`Decommissioned ${selectedCount} clusters successfully.`);
      setSelectedGroupIds([]);
      fetchData();
    } catch (err) {
      toast.error('Partial failure occurred during bulk cluster deletion.');
    } finally {
      setIsDeletingBulk(false);
      setIsBulkDeleteOpen(false);
    }
  };

  if (loading) return <div className="text-cyber-blue font-mono animate-pulse font-bold p-8">SYNCHRONIZING GROUP CLUSTERS...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Network Groups</h2>
          <p className="text-gray-400 text-sm">Managing {groups.length} organizational clusters.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="cyber-button-primary"
        >
          <Plus size={18} />
          Create Group
        </button>
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchData} 
      />

      <EditGroupModal 
        isOpen={editingGroup !== null} 
        onClose={() => setEditingGroup(null)} 
        onSuccess={fetchData} 
        group={editingGroup}
      />

      {/* Filter and Bulk Selection Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-black/30 p-4 border border-cyber-border/40 rounded-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Filter clusters by name or sector..." 
            className="cyber-input w-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {filteredGroups.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-sm transition-all border border-cyber-border/65 font-mono"
            >
              {filteredGroups.map(g => g.id).every(id => selectedGroupIds.includes(id)) ? 'Deselect All' : 'Select All'}
            </button>
            {selectedGroupIds.length > 0 && (
              <button
                disabled={isDeletingBulk}
                onClick={() => setIsBulkDeleteOpen(true)}
                className="px-4 py-1.5 bg-red-950/60 hover:bg-red-800 border border-red-700/50 hover:border-red-500 text-red-200 hover:text-white font-bold text-xs uppercase rounded-sm transition-all flex items-center gap-1.5 font-mono"
              >
                <Trash size={12} className="animate-pulse" />
                {isDeletingBulk ? 'TERMINATING...' : `Decommission [${selectedGroupIds.length}]`}
              </button>
            )}
          </div>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-gray-500 font-mono text-center py-12 border border-dashed border-cyber-border">
          NO MATCHING CLUSTER GROUPS FOUND
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGroups.map((group, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              key={group.id} 
              className={cn(
                "cyber-panel p-0 flex flex-col group h-64 border-t-2 relative transition-all",
                selectedGroupIds.includes(group.id) 
                  ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/10" 
                  : "border-cyber-blue"
              )}
            >
              <div className="cyber-panel-header flex justify-between items-center relative pr-2">
                 <div className="flex items-center gap-2">
                   <input 
                     type="checkbox"
                     checked={selectedGroupIds.includes(group.id)}
                     onChange={() => toggleGroupSelection(group.id)}
                     className="w-3.5 h-3.5 rounded-sm bg-black border border-cyber-border text-cyber-blue focus:ring-0 cursor-pointer"
                   />
                   <span>CLUSTER_GRP_{100 + i}</span>
                 </div>

                 <div className="relative">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setActiveDropdownGroupId(activeDropdownGroupId === group.id ? null : group.id);
                     }}
                     className="p-1 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded"
                     id={`dropdown-btn-${group.id}`}
                   >
                     <MoreVertical size={14} />
                   </button>
                   {activeDropdownGroupId === group.id && (
                     <>
                       <div 
                         className="fixed inset-0 z-10" 
                         onClick={(e) => {
                           e.stopPropagation();
                           setActiveDropdownGroupId(null);
                         }}
                       />
                       <div className="absolute right-0 mt-1 w-32 bg-cyber-card border border-cyber-border shadow-2xl rounded-sm py-1 z-20 text-left font-mono">
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             setEditingGroup(group);
                             setActiveDropdownGroupId(null);
                           }}
                           className="w-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-gray-300 hover:text-white hover:bg-white/10 transition-colors uppercase font-bold"
                         >
                           <Edit size={11} className="text-cyber-blue" />
                           Edit Group
                         </button>

                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             setActiveDropdownGroupId(null);
                             setDeletingGroup(group);
                           }}
                           className="w-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors uppercase font-bold border-t border-cyber-border/30"
                         >
                           <Trash size={11} className="text-red-500" />
                           Delete Group
                         </button>
                       </div>
                     </>
                   )}
                 </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyber-blue transition-colors uppercase tracking-tight">{group.name}</h3>
                  <p className="text-[11px] text-cyber-text-muted mt-1 line-clamp-3">{group.description}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-cyber-border/50">
                   <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-cyber-text-muted uppercase">NODES_SYNCED</span>
                      <span className="text-white">{group.deviceCount}</span>
                   </div>

                   <button 
                    type="button"
                    onClick={() => {
                      setInspectedGroup(group);
                      setIsEditingGroupMeta(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-cyber-blue hover:text-black rounded-sm transition-all text-[10px] font-bold uppercase tracking-widest text-cyber-blue cursor-pointer"
                   >
                     Inspect Cluster
                     <ArrowRight size={12} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal for Single Group Deletion */}
      <AnimatePresence>
        {deletingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setDeletingGroup(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-cyber-card border border-red-900/60 p-6 shadow-2xl z-10 font-mono"
            >
              <div className="flex items-center gap-3 text-red-500 mb-4 pb-3 border-b border-cyber-border/40">
                <Trash size={18} className="animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">CONFIRM DECOMMISSION</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mb-6 font-sans">
                Are you sure you want to delete cluster <span className="text-red-400 font-bold">"{deletingGroup.name}"</span>? 
                All associated systems in this cluster will be permanently deleted from the inventory.
              </p>
              <div className="flex justify-end gap-3 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDeletingGroup(null)}
                  className="px-4 py-2 border border-cyber-border/60 hover:border-white text-gray-400 hover:text-white transition-all uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteGroup(deletingGroup.id, deletingGroup.name)}
                  className="px-4 py-2 bg-red-950 hover:bg-red-800 border border-red-700 text-red-200 hover:text-white transition-all uppercase"
                >
                  DECODE & PURGE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal for Bulk Deletion */}
      <AnimatePresence>
        {isBulkDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkDeleteOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-cyber-card border border-red-900/60 p-6 shadow-2xl z-10 font-mono"
            >
              <div className="flex items-center gap-3 text-red-500 mb-4 pb-3 border-b border-cyber-border/40">
                <ShieldAlert size={18} className="animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">CRITICAL SYSTEM DECOMMISSION</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mb-6 font-sans">
                CRITICAL WARNING: You have selected <span className="text-red-400 font-bold">{selectedGroupIds.length} cluster(s)</span> for decommissioning. 
                This will permanently delete all these clusters and ALL their associated hosts. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteOpen(false)}
                  className="px-4 py-2 border border-cyber-border/60 hover:border-white text-gray-400 hover:text-white transition-all uppercase"
                >
                  Abort
                </button>
                <button
                  type="button"
                  onClick={executeBulkDelete}
                  className="px-4 py-2 bg-red-950 hover:bg-red-800 border border-red-700 text-red-200 hover:text-white transition-all uppercase"
                >
                  TERMINATE ALL UNITS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cluster Network Inspector Modal (Group Details + Live Metrics) */}
      <AnimatePresence>
        {inspectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isEditingGroupMeta) {
                  setInspectedGroup(null);
                }
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl bg-cyber-card border border-cyber-blue/40 p-6 shadow-[0_0_50px_rgba(56,189,248,0.15)] z-10 font-mono max-h-[90vh] overflow-y-auto rounded-sm"
            >
              {/* Top Bar / Header Buttons */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {isEditingGroupMeta ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingGroupMeta(false)}
                      disabled={isSavingGroupMeta}
                      className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 border border-cyber-border text-[10px] text-gray-300 font-mono uppercase font-bold flex items-center gap-1 cursor-pointer transition-all rounded-sm"
                    >
                      <X size={10} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveGroupMeta}
                      disabled={isSavingGroupMeta}
                      className="px-2.5 py-1 bg-cyber-green text-black border border-cyber-green font-mono text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer hover:bg-green-400 hover:shadow-[0_0_10px_rgba(74,222,128,0.3)] transition-all rounded-sm"
                    >
                      <Save size={10} className={isSavingGroupMeta ? "animate-spin" : ""} />
                      {isSavingGroupMeta ? "Saving..." : "Save Config"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEditingGroup(inspectedGroup)}
                      className="px-2.5 py-1 bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue/30 text-[10px] text-cyber-blue font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-all rounded-sm"
                    >
                      <Edit size={10} />
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedGroup(null)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-cyber-border text-[10px] text-gray-400 font-mono uppercase font-bold flex items-center gap-1 cursor-pointer transition-all rounded-sm"
                    >
                      <X size={10} />
                      Close
                    </button>
                  </>
                )}
              </div>

              <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
                {/* Title and ID */}
                <div className="text-[10px] text-cyber-blue font-extrabold tracking-widest uppercase flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyber-blue rounded-full animate-ping" />
                  Cluster Segment // Node ID: {inspectedGroup.id}
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-widest uppercase glitch-text">
                  {inspectedGroup.name}
                </h2>

                {/* Subtext Grid: Group Head Name, IT Nodal Officer Name, Contact in bold */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs border-b border-cyber-border/40 pb-6 pt-2 w-full max-w-5xl mx-auto">
                  {/* Card 1: Group Head */}
                  <div className="relative p-3 bg-black/40 border border-cyber-border hover:border-cyber-blue/40 rounded-sm text-left flex flex-col justify-between transition-all duration-300 group shadow-md select-none border-l-2 border-l-cyber-blue">
                    <div>
                      <div className="text-[10px] text-cyber-blue font-extrabold tracking-wider uppercase mb-1 flex items-center gap-1.5 bg-cyber-blue/5 px-2 py-1 rounded-sm border border-cyber-blue/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue animate-pulse" />
                        Group Head
                      </div>
                      <div className="px-1 py-1.5 min-h-[36px] flex items-center">
                        {isEditingGroupMeta ? (
                          <input
                            type="text"
                            required
                            className="cyber-input py-1 px-2 text-xs text-white w-full bg-black/50 border-cyber-blue/30 focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue"
                            value={editedGroupHeadName}
                            onChange={e => setEditedGroupHeadName(e.target.value)}
                          />
                        ) : (
                          <span className="text-white font-bold text-sm tracking-wide break-words">{inspectedGroup.groupHeadName || "ADMIN-IN-CHARGE"}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: IT Nodal Officer */}
                  <div className="relative p-3 bg-black/40 border border-cyber-border hover:border-cyber-green/40 rounded-sm text-left flex flex-col justify-between transition-all duration-300 group shadow-md select-none border-l-2 border-l-cyber-green">
                    <div>
                      <div className="text-[10px] text-cyber-green font-extrabold tracking-wider uppercase mb-1 flex items-center gap-1.5 bg-cyber-green/5 px-2 py-1 rounded-sm border border-cyber-green/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                        IT Nodal Officer
                      </div>
                      <div className="px-1 py-1.5 min-h-[36px] flex items-center">
                        {isEditingGroupMeta ? (
                          <input
                            type="text"
                            required
                            className="cyber-input py-1 px-2 text-xs text-white w-full bg-black/50 border-cyber-green/30 focus:border-cyber-green focus:ring-1 focus:ring-cyber-green"
                            value={editedNodalOfficer}
                            onChange={e => setEditedNodalOfficer(e.target.value)}
                          />
                        ) : (
                          <span className="text-white font-bold text-sm tracking-wide break-words">{inspectedGroup.nodalOfficer || "SECURE-GATEKEEPER"}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Contact Info */}
                  <div className="relative p-3 bg-black/40 border border-cyber-border hover:border-cyber-yellow/40 rounded-sm text-left flex flex-col justify-between transition-all duration-300 group shadow-md select-none border-l-2 border-l-cyber-yellow">
                    <div>
                      <div className="text-[10px] text-cyber-yellow font-extrabold tracking-wider uppercase mb-1 flex items-center gap-1.5 bg-cyber-yellow/5 px-2 py-1 rounded-sm border border-cyber-yellow/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-yellow animate-pulse" />
                        Contact Info
                      </div>
                      <div className="px-1 py-1.5 min-h-[36px] flex items-center">
                        {isEditingGroupMeta ? (
                          <input
                            type="text"
                            required
                            className="cyber-input py-1 px-2 text-xs text-white w-full bg-black/50 border-cyber-yellow/30 focus:border-cyber-yellow focus:ring-1 focus:ring-cyber-yellow"
                            value={editedNodalContact}
                            onChange={e => setEditedNodalContact(e.target.value)}
                          />
                        ) : (
                          <span className="text-white font-bold text-sm tracking-wide break-all">{inspectedGroup.nodalContact || "+91-XXXXXXXXXX"}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Last Case Raised */}
                  <div className="relative p-3 bg-black/40 border border-cyber-border hover:border-cyber-red/40 rounded-sm text-left flex flex-col justify-between transition-all duration-300 group shadow-md select-none border-l-2 border-l-cyber-red">
                    <div>
                      <div className="text-[10px] text-cyber-red font-extrabold tracking-wider uppercase mb-1 flex items-center gap-1.5 bg-cyber-red/5 px-2 py-1 rounded-sm border border-cyber-red/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-red animate-pulse" />
                        Last Case Raised
                      </div>
                      <div className="px-1 py-1 min-h-[36px] flex items-center flex-wrap font-mono">
                        {isEditingGroupMeta ? (
                          <input
                            type="text"
                            className="cyber-input py-1 px-2 text-xs text-white w-full bg-black/50 border-cyber-red/30 focus:border-cyber-red focus:ring-1 focus:ring-cyber-red"
                            placeholder="Case reference No."
                            value={editedLastCaseRaised}
                            onChange={e => setEditedLastCaseRaised(e.target.value)}
                          />
                        ) : (
                          <span className="text-white font-bold text-sm tracking-wide truncate block font-mono" title={inspectedGroup.lastCaseRaised || "N/A"}>
                            {inspectedGroup.lastCaseRaised || "N/A"}
                          </span>
                        )}
                      </div>
                      <div className="px-1 mt-1 border-t border-cyber-border/40 pt-1.5">
                        {isEditingGroupMeta ? (
                          <input
                            type="text"
                            className="cyber-input py-0.5 px-2 text-[10px] text-gray-300 w-full bg-black/50 border-cyber-border focus:border-cyber-red/30 focus:ring-1 focus:ring-cyber-red placeholder:text-gray-600 inline-block font-mono"
                            placeholder="Case comments/logs..."
                            value={editedLastCaseComment}
                            onChange={e => setEditedLastCaseComment(e.target.value)}
                          />
                        ) : (
                          <div className="text-[11px] text-cyber-text-muted italic truncate w-full" title={inspectedGroup.lastCaseComment}>
                            {inspectedGroup.lastCaseComment ? `Comment: ${inspectedGroup.lastCaseComment}` : "(No comment added)"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table list of rows and cols */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full max-w-4xl mx-auto border-collapse border border-cyber-border bg-black/40 text-xs text-left font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border bg-white/5 text-[10px] font-bold text-cyber-text-muted uppercase tracking-wider">
                      <th className="px-4 py-2 border-r border-cyber-border w-1/4">Metric Name</th>
                      <th className="px-4 py-2 border-r border-cyber-border text-center w-1/4 font-mono">Inventory Metric Value</th>
                      <th className="px-4 py-2 border-r border-cyber-border w-1/4 font-mono">Infrastructure Metric</th>
                      <th className="px-4 py-2 text-center w-1/4 font-mono">Resource Definition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40 font-mono">
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
                          inspectedGroup.deviceCount || dynamicTotal
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
                          inspectedGroup.switchName || "N/A"
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
                          inspectedGroup.lanCount || dynamicLan
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
                          inspectedGroup.existingPorts || 0
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
                          inspectedGroup.internetCount || dynamicInternet
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
                          inspectedGroup.connectedPorts || 0
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
                          inspectedGroup.standaloneCount || dynamicStandalone
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
                          inspectedGroup.unconnectedPorts || 0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons at the bottom */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-cyber-border/40">
                <div className="text-[10px] text-cyber-text-muted italic">
                  * ALL SECURE GROUP REPLICATIONS COMPLY WITH PROTOCOL SECURE-V2
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/devices?group=${encodeURIComponent(inspectedGroup.name)}`}
                    onClick={() => setInspectedGroup(null)}
                    className="cyber-button-primary px-4 py-2 hover:bg-cyber-blue/10 flex items-center gap-2"
                  >
                    <span>Inspect Cluster Hosts</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setInspectedGroup(null)}
                    className="px-4 py-2 border border-cyber-border text-gray-400 hover:text-white hover:border-white transition-all text-xs font-mono uppercase font-bold cursor-pointer"
                  >
                    Dismiss Segment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
