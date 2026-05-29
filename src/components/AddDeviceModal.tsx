import { useState, useEffect } from 'react';
import { X, Save, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupService, deviceService } from '../services/api';
import { Group } from '../types';
import { toast } from 'react-toastify';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDeviceModal({ isOpen, onClose, onSuccess }: AddDeviceModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [formData, setFormData] = useState({
    hostname: '',
    ipAddress: '',
    macAddress: '',
    os: 'Windows 11 Pro',
    groupName: '',
    username: '',
    ram: '16GB',
    storage: '512GB',
    location: '',
    status: 'online',
    connectionType: 'LAN',
    notes: '',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200',
    configUrl: '#',
    switchType: '',
    escanVerified: false,
  });

  useEffect(() => {
    if (isOpen) {
      groupService.getGroups().then(setGroups);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await deviceService.createDevice(formData);
      toast.success('System node registered successfully.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to register node.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-cyber-card border border-cyber-border p-8 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyber-blue shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                   <PlusIcon size={18} className="text-black" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight uppercase">Add New Device</h3>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Hostname *</label>
                <input 
                  required
                  className="cyber-input w-full"
                  placeholder="CSG-0313"
                  value={formData.hostname}
                  onChange={e => setFormData({...formData, hostname: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">IP Address *</label>
                <input 
                  required
                  className="cyber-input w-full"
                  placeholder="192.168.1.100"
                  value={formData.ipAddress}
                  onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">MAC Address</label>
                <input 
                  className="cyber-input w-full"
                  placeholder="00:1A:2B:3C:4D:5E"
                  value={formData.macAddress}
                  onChange={e => setFormData({...formData, macAddress: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Operating System</label>
                <select 
                  className="cyber-input w-full appearance-none"
                  value={formData.os}
                  onChange={e => setFormData({...formData, os: e.target.value})}
                >
                  <option>Windows 10</option>
                  <option>Windows 11 Pro</option>
                  <option>Ubuntu 22.04 LTS</option>
                  <option>macOS Sonoma</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Group</label>
                <select 
                  className="cyber-input w-full appearance-none"
                  value={formData.groupName}
                  onChange={e => setFormData({...formData, groupName: e.target.value})}
                  required
                >
                  <option value="">Select Group</option>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Username</label>
                <input 
                  className="cyber-input w-full"
                  placeholder="user001"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">RAM</label>
                <select 
                  className="cyber-input w-full appearance-none"
                  value={formData.ram}
                  onChange={e => setFormData({...formData, ram: e.target.value})}
                >
                  <option>8GB</option>
                  <option>16GB</option>
                  <option>32GB</option>
                  <option>64GB</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Storage</label>
                <select 
                  className="cyber-input w-full appearance-none"
                  value={formData.storage}
                  onChange={e => setFormData({...formData, storage: e.target.value})}
                >
                  <option>256GB</option>
                  <option>512GB</option>
                  <option>1TB</option>
                  <option>2TB</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Location</label>
                <input 
                  className="cyber-input w-full"
                  placeholder="Building A - Floor 1"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Status</label>
                <select 
                  className="cyber-input w-full appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="online">ONLINE</option>
                  <option value="offline">OFFLINE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Connection Type</label>
                <select 
                  className="cyber-input w-full appearance-none"
                  value={formData.connectionType}
                  onChange={e => setFormData({...formData, connectionType: e.target.value as any})}
                >
                  <option value="LAN">LAN SYSTEM</option>
                  <option value="Standalone">STANDALONE SYSTEM</option>
                  <option value="Internet">INTERNET SYSTEM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Port number</label>
                <input 
                  className="cyber-input w-full"
                  placeholder="Port number (e.g. Port 24)"
                  value={formData.switchType}
                  onChange={e => setFormData({...formData, switchType: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input 
                  type="checkbox"
                  id="escanVerified_add"
                  checked={formData.escanVerified}
                  onChange={e => setFormData({...formData, escanVerified: e.target.checked})}
                  className="w-4 h-4 rounded-sm bg-black border border-cyber-border text-cyber-blue focus:ring-0 cursor-pointer"
                />
                <label htmlFor="escanVerified_add" className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest cursor-pointer select-none">E-Scan Verified</label>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Notes</label>
                <textarea 
                  className="cyber-input w-full h-24 resize-none"
                  placeholder="Optional notes..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-4 pt-6 border-t border-cyber-border">
                <button type="button" onClick={onClose} className="px-6 py-2 border border-cyber-border text-gray-400 font-bold text-xs uppercase hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" className="cyber-button-primary">
                  <Save size={16} />
                  Save Device
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PlusIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
