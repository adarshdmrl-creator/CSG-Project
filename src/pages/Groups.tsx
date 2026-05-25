import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Monitor, ShieldAlert, 
  ArrowRight, Search, Plus, Filter,
  Activity, Globe, Lock, MoreVertical, Edit, Trash
} from 'lucide-react';
import { groupService } from '../services/api';
import { Group } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal';
import EditGroupModal from '../components/EditGroupModal';
import { toast } from 'react-toastify';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDropdownGroupId, setActiveDropdownGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const fetchData = async () => {
    try {
      const g = await groupService.getGroups();
      setGroups(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

                   <Link 
                    to={`/devices?group=${encodeURIComponent(group.name)}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-cyber-blue hover:text-black rounded-sm transition-all text-[10px] font-bold uppercase tracking-widest text-cyber-blue"
                   >
                     Inspect Cluster
                     <ArrowRight size={12} />
                   </Link>
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
    </div>
  );
}
