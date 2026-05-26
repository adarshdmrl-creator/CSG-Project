import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Monitor, Info, Shield, 
  Network, Cpu, HardDrive, Cpu as Memory,
  History, Settings, ShieldAlert, CheckCircle2,
  AlertTriangle, Clock, MapPin, User,
  FileText, Image as ImageIcon, ExternalLink,
  Lock, Unlock, X, Check
} from 'lucide-react';
import { deviceService } from '../services/api';
import { Device } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom states
  const [isLocking, setIsLocking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Form states for config edit
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [os, setOs] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [connectionType, setConnectionType] = useState<'LAN' | 'Standalone' | 'Internet'>('LAN');

  async function fetchDeviceDetails() {
    if (!id) return;
    try {
      const d = await deviceService.getDevice(id);
      if (d) {
        setDevice(d);
        setNotesText(d.notes || '');
        // Set form copy
        setHostname(d.hostname || '');
        setIpAddress(d.ipAddress || '');
        setMacAddress(d.macAddress || '');
        setOs(d.os || '');
        setUsername(d.username || '');
        setLocation(d.location || '');
        setConnectionType(d.connectionType || 'LAN');
      }
    } catch (err) {
      console.error("Error reading device data:", err);
      toast.error("Failed to query node data from central database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeviceDetails();
  }, [id]);

  // Lock/Unlock system handler
  const handleToggleLock = async () => {
    if (!device) return;
    setIsLocking(true);
    const newLockState = !device.isLocked;
    try {
      await deviceService.updateDevice(device.id, { isLocked: newLockState });
      toast.success(newLockState ? `NODE ISOLATED: system connection locked!` : `NODE RESTORED: security lock removed!`);
      await fetchDeviceDetails();
    } catch (err) {
      console.error(err);
      toast.error("Defense protocol failed to commit.");
    } finally {
      setIsLocking(false);
    }
  };

  // Save config handler
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;
    try {
      await deviceService.updateDevice(device.id, {
        hostname,
        ipAddress,
        macAddress,
        os,
        username,
        location,
        connectionType,
      });
      toast.success("SYSTEM HEADER CONFIGURATION SECURELY RECONFIGURED!");
      setIsEditing(false);
      await fetchDeviceDetails();
    } catch (err) {
      console.error(err);
      toast.error("Config parameters validation failed to store.");
    }
  };

  // Commit dynamic notes handler
  const handleCommitNotes = async () => {
    if (!device) return;
    try {
      await deviceService.updateDevice(device.id, { notes: notesText });
      toast.success("MAINTENANCE LOG ENTRY PERSISTED TO DATA CORE.");
      await fetchDeviceDetails();
    } catch (err) {
      console.error(err);
      toast.error("Logs update transaction rejected.");
    }
  };

  if (loading) return <div className="text-cyber-blue font-mono animate-pulse p-10">ACCESSING ENCRYPTED NODE DATA...</div>;
  if (!device) return <div className="text-cyber-red font-mono p-10">NODE RECOVERY FAILURE: NOT FOUND</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/devices" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors border border-transparent hover:border-cyber-border/30">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-white tracking-tight leading-none">{device.hostname}</h2>
               <span className={cn(
                 "px-2 py-0.5 rounded text-[10px] font-bold border font-mono tracking-widest",
                 device.status === 'online' ? "border-cyber-green text-cyber-green bg-cyber-green/5" : "border-gray-500 text-gray-500 bg-gray-500/5"
               )}>
                 {device.status.toUpperCase()}
               </span>
               {device.isLocked && (
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-cyber-red text-cyber-red bg-cyber-red/10 animate-pulse font-mono tracking-widest">
                   SEC_LOCKED
                 </span>
               )}
            </div>
            <p className="text-cyber-blue font-mono text-[10px] mt-2 tracking-wider">ID: {device.id} // HWID: {device.macAddress.replace(/:/g, '-')}</p>
          </div>
        </div>
        
        {/* Actions Controls (Functional Lock & Editor trigger) */}
        <div className="flex items-center gap-3">
             <button 
               onClick={handleToggleLock}
               disabled={isLocking}
               className={cn(
                 "cyber-button-primary flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold tracking-widest transition-all",
                 device.isLocked 
                   ? "bg-cyber-green/10 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/20" 
                   : "bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
               )}
             >
               {device.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
               {isLocking ? "processing..." : device.isLocked ? "Unlock System" : "Lock System"}
             </button>
             <button 
               onClick={() => setIsEditing(true)}
               className="cyber-button-primary flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold tracking-widest"
             >
               <Settings size={14} />
               Edit Config
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="cyber-panel xl:col-span-1 space-y-6">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-cyber-border bg-black/50 group">
             <img src={device.imageUrl} alt={device.hostname} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
             <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-cyber-blue flex items-center justify-center">
                  <Monitor size={18} className="text-black" />
                 </div>
                 <p className="text-xs font-bold text-white">SYSTEM_VISUAL_01</p>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-cyber-border pb-2">Physical Context</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin size={14} className="text-cyber-blue" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Location</span>
                </div>
                <p className="text-xs text-white font-mono">{device.location}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <User size={14} className="text-cyber-blue" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Assigned User</span>
                </div>
                <p className="text-xs text-white font-mono">{device.username}</p>
              </div>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield size={14} className="text-cyber-blue" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Defense Cluster</span>
                </div>
                <p className="text-xs text-white font-mono">{device.groupName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-cyber-border pb-2">Resource Status</h4>
            <div className="space-y-3">
               {[
                 { icon: Cpu, label: 'Processor', value: device.processor },
                 { icon: Memory, label: 'Memory', value: device.ram },
                 { icon: HardDrive, label: 'Storage', value: device.storage },
               ].map(item => (
                 <div key={item.label} className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded border border-white/5">
                     <item.icon size={16} className="text-cyber-blue" />
                   </div>
                   <div>
                     <p className="text-[9px] text-gray-500 font-bold uppercase leading-none">{item.label}</p>
                     <p className="text-xs text-white mt-1">{item.value}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Dynamic Data */}
        <div className="xl:col-span-2 space-y-6">
           {/* Security Alert Header Banner */}
           <div className={cn(
             "cyber-panel border-l-4 transition-colors",
             device.isLocked 
               ? "border-l-cyber-red bg-cyber-red/5" 
               : "border-l-cyber-blue bg-cyber-blue/5"
           )}>
             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    device.isLocked ? "bg-cyber-red text-black animate-pulse" : "bg-cyber-blue/10 text-cyber-blue"
                  )}>
                    {device.isLocked ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {device.isLocked ? "SECURITY POLICY: ACCESS ISOLATION" : "SYSTEM STATE: GENERAL PARAMETERS"}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1 max-w-lg">
                      {device.isLocked 
                        ? 'CRITICAL DEFENSE RULE: This terminal is strictly quarantined from internal sub-networks. MAC packet redirection protocol active.' 
                        : 'System is within normal parameters. Realtime network packets are securely synchronized with the central hive monitoring grid.'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                   <p className="text-[10px] font-mono text-gray-500">LAST HEARTBEAT</p>
                   <p className="text-xs font-mono text-white mt-1">
                     {device.lastActive ? new Date(device.lastActive).toLocaleTimeString() : 'N/A'}
                   </p>
                </div>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Network Config */}
              <div className="cyber-panel">
                <h4 className="text-sm font-bold mb-4 font-mono text-white flex gap-2 items-center">
                  <Network size={16} className="text-cyber-blue" />
                  NETWORK INTERFACES // [{device.connectionType}]
                </h4>
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-500">IPv4 ADDR</span>
                      <span className="text-xs font-mono text-cyber-blue">{device.ipAddress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-500">SUBNET MASK</span>
                      <span className="text-xs font-mono text-white">255.255.255.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-500">GATEWAY</span>
                      <span className="text-xs font-mono text-white">10.20.1.1</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-gray-500">MAC HWID</span>
                      <span className="text-xs font-mono text-white uppercase">{device.macAddress}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 bg-transparent border border-cyber-border rounded text-[10px] font-mono text-gray-400 hover:text-white transition-all cursor-pointer">
                      Download Config
                    </button>
                    <button className="flex-1 py-1.5 bg-transparent border border-cyber-border rounded text-[10px] font-mono text-gray-400 hover:text-white transition-all cursor-pointer">
                      Run Diagnostic
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs / History */}
              <div className="cyber-panel">
                <h4 className="text-sm font-bold mb-4 font-mono text-white flex gap-2 items-center">
                  <History size={16} className="text-cyber-blue" />
                  AUDIT_LOG_STRM
                </h4>
                <div className="space-y-3 h-52 overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { time: '10:42:01', event: device.isLocked ? 'Hardware Isolated' : 'Authentication Success', user: 'admin@csg', status: device.isLocked ? 'error' : 'success' },
                    { time: '09:12:45', event: 'Config File Uploaded', user: 'system', status: 'info' },
                    { time: '08:55:12', event: 'Remote Session Initiated', user: 'user_x', status: 'warning' },
                    { time: '07:20:33', event: 'System Boot Sequence', user: 'os_kernel', status: 'info' },
                    { time: '06:14:55', event: 'Unauthorized Access Attempt', user: 'unknown', status: 'error' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-3 text-[10px] font-mono border-b border-white/5 pb-2">
                      <span className="text-gray-500">{log.time}</span>
                      <div className="flex-1">
                        <p className={cn(
                          "font-bold",
                          log.status === 'success' ? "text-cyber-green" :
                          log.status === 'error' ? "text-cyber-red" :
                          log.status === 'warning' ? "text-cyber-yellow" : "text-cyber-blue"
                        )}>{log.event}</p>
                        <p className="text-gray-600 mt-0.5">SOURCE: {log.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           {/* Notes & Documentation (Fully functional Firestore notes update) */}
           <div className="cyber-panel">
             <h4 className="text-sm font-bold mb-4 font-mono text-white flex gap-2 items-center">
               <FileText size={16} className="text-cyber-blue" />
               SYSTEM_MAINTENANCE_NOTES
             </h4>
             <textarea 
               className="w-full bg-black/40 border border-cyber-border rounded-lg p-4 text-xs text-gray-300 h-24 outline-none focus:border-cyber-blue/50 transition-all resize-none"
               value={notesText}
               onChange={(e) => setNotesText(e.target.value)}
             />
             <div className="flex justify-end mt-4">
                <button 
                  onClick={handleCommitNotes}
                  className="text-[10px] font-bold text-cyber-blue hover:underline uppercase tracking-widest cursor-pointer"
                >
                  Commit Changes
                </button>
             </div>
           </div>
        </div>
      </div>

      {/* Edit Config Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-cyber-bg border border-cyber-border/80 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.15)]"
            >
              <div className="flex items-center justify-between border-b border-cyber-border px-6 py-4 bg-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings size={16} className="text-cyber-blue" />
                  RECONFIGURE_NODE_PARAMETERS
                </h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Hostname</label>
                    <input 
                      type="text" 
                      required
                      value={hostname} 
                      onChange={(e) => setHostname(e.target.value)}
                      className="cyber-input w-full text-xs font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">IPv4 Address</label>
                    <input 
                      type="text" 
                      required
                      value={ipAddress} 
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="cyber-input w-full text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">MAC Address</label>
                    <input 
                      type="text" 
                      required
                      value={macAddress} 
                      onChange={(e) => setMacAddress(e.target.value)}
                      className="cyber-input w-full text-xs font-mono uppercase" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Operating System</label>
                    <select 
                      value={os} 
                      onChange={(e) => setOs(e.target.value)}
                      className="cyber-input w-full text-xs font-mono bg-[#030712] border-cyber-border focus:border-cyber-blue"
                    >
                      {["Windows 11 Pro", "Ubuntu 22.04 LTS", "macOS Sonoma", "Windows Server 2022", "CentOS Stream 9", "Debian 12"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Assigned User</label>
                    <input 
                      type="text" 
                      required
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="cyber-input w-full text-xs font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Physical Location</label>
                    <input 
                      type="text" 
                      required
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="cyber-input w-full text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Connection Protocol</label>
                  <select 
                    value={connectionType} 
                    onChange={(e) => setConnectionType(e.target.value as any)}
                    className="cyber-input w-full text-xs font-mono"
                  >
                    <option value="LAN">LAN Connection</option>
                    <option value="Standalone">Standalone Mode</option>
                    <option value="Internet">Internet Facing Gateway</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-transparent border border-cyber-border text-gray-400 hover:text-white rounded text-xs uppercase font-mono tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue-hover text-black rounded text-xs uppercase font-bold tracking-widest cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
