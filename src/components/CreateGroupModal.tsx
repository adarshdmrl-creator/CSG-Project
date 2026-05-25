import { useState, useEffect } from 'react';
import { X, Save, Layers, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupService } from '../services/api';
import { toast } from 'react-toastify';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATES = [
  {
    category: "Secured Alpha Gateways",
    suffix: "Alpha",
    description: "High-security network segment optimized for external and internal gatekeeping firewalls."
  },
  {
    category: "Operations Grid Center",
    suffix: "Ops",
    description: "Dynamic workload cluster for managing daily client logins, scans, and system tasks."
  },
  {
    category: "Hardware Segment Core",
    suffix: "Core",
    description: "Enclosure cluster dedicated to high-bandwidth ethernet ports and local physical nodes."
  },
  {
    category: "System Integrity Node",
    suffix: "Shield",
    description: "Quarantine-ready cluster designed for threat isolation and deep auditing diagnostics."
  }
];

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Auto-generate name based on template and sequential ID when template changes or is initialized
  useEffect(() => {
    if (isOpen) {
      // Set name prefill with template suffix
      const temp = TEMPLATES[selectedTemplate];
      groupService.getGroups().then(existingGroups => {
        const nextNum = 100 + existingGroups.length;
        setFormData({
          name: `CSG-${temp.suffix}-${nextNum}`,
          description: temp.description
        });
      }).catch(() => {
        setFormData({
          name: `CSG-${temp.suffix}-115`,
          description: temp.description
        });
      });
    }
  }, [isOpen, selectedTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    try {
      await groupService.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || 'Custom cluster network segment.',
      });
      toast.success(`Cluster "${formData.name}" created successfully.`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to create cluster.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="create-group-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Model Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-cyber-card border border-cyber-border p-6 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyber-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyber-blue shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <Layers size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Deploy Cluster Group</h3>
                  <p className="text-[10px] text-cyber-text-muted font-mono uppercase tracking-wide">SYSTEM INTEGRATION BLOCK LAYER</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Template Chooser ("Like already existing clusters") */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-cyber-blue uppercase font-mono tracking-widest flex items-center gap-1.5 mb-2">
                <HelpCircle size={12} />
                Similar Cluster Template Selector
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedTemplate(i)}
                    className={`p-2.5 text-left border rounded transition-all flex flex-col ${
                      selectedTemplate === i 
                        ? "border-cyber-blue bg-cyber-blue/5 text-white" 
                        : "border-cyber-border/40 bg-white/5 text-gray-400 hover:border-cyber-border hover:bg-white/10"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase font-mono">{tpl.category}</span>
                    <span className="text-[9px] text-cyber-text-muted mt-0.5 line-clamp-1">{tpl.description}</span>
                  </button>
                ))}
              </div>
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
                  placeholder="CSG-ALPHA-120"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                />
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-tight">Avoid duplicating existing unique network IDs.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest block">Sector Cluster Description</label>
                <textarea 
                  className="cyber-input w-full h-24 resize-none text-xs"
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
                  onClick={onClose} 
                  className="px-4 py-2 border border-cyber-border text-gray-400 font-bold text-xs uppercase hover:bg-white/5 transition-all rounded-sm"
                >
                  Cancel Close
                </button>
                <button 
                  type="submit" 
                  className="cyber-button-primary"
                >
                  <Save size={14} />
                  Deploy Group
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
