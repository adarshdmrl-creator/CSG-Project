import { useState, useEffect } from 'react';
import { X, Save, Edit, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupService } from '../services/api';
import { Group } from '../types';
import { toast } from 'react-toastify';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group: Group | null;
}

export default function EditGroupModal({ isOpen, onClose, onSuccess, group }: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    }
  }, [isOpen, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    if (!formData.name.trim()) {
      toast.error('Cluster name is required.');
      return;
    }

    setLoading(true);
    try {
      await groupService.updateGroup(group.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      toast.success(`Cluster updated to "${formData.name}" successfully.`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to update cluster group.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && group && (
        <div id="edit-group-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-cyber-card border border-cyber-border p-6 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyber-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyber-blue shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <Edit size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Modify Cluster Group</h3>
                  <p className="text-[10px] text-cyber-text-muted font-mono uppercase tracking-wide">Update Sector Specifications</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest block">Group/Cluster Name *</label>
                <input 
                  type="text"
                  required
                  maxLength={100}
                  className="cyber-input w-full font-mono text-sm uppercase"
                  placeholder="e.g. CSG-ALPHA-120"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                />
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-tight">Modifying this will auto-migrate and synchronize matching registry nodes.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest block">Sector Cluster Description</label>
                <textarea 
                  className="cyber-input w-full h-32 resize-none text-xs"
                  maxLength={500}
                  placeholder="Enter detailed system configuration description or region specs..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/40 mt-6">
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={onClose} 
                  className="px-4 py-2 border border-cyber-border text-gray-400 font-bold text-xs uppercase hover:bg-white/5 transition-all rounded-sm"
                >
                  Cancel Close
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="cyber-button-primary"
                >
                  <Save size={14} />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
