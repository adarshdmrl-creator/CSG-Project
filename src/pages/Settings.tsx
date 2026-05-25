import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Shield, Bell, Network, 
  Database, Lock, Terminal, RefreshCw, Sliders, Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { settingsService } from '../services/api';
import { toast } from 'react-toastify';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'General' | 'Security' | 'Alerts' | 'Networking' | 'Database' | 'API Tokens'>('Security');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Load settings on boot from Firebase
  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await settingsService.getSettings();
        if (data) {
          setSettings(data);
        } else {
          // If no settings exist yet, set defaults
          const defaults = {
            id: 'system',
            systemName: "CSG-HIVE-01",
            maintenanceMode: false,
            operatorLevel: "LVL_2_TOP_SECRET",
            realtimeThreatNeutralization: true,
            macSpoofingPrevention: false,
            intrusionLoggingDepth: "90 Days",
            emailAlerts: true,
            telegramAlerts: false,
            alertSeverity: "CRITICAL",
            dhcpEnabled: true,
            customDns: "8.8.8.8",
            dnsOverHttps: true,
            autoBackup: true,
            backupInterval: "Daily",
            storageLimit: "50GB",
            apiToken: "csg_live_tok_a92842e1bc9d8f88a8f89",
          };
          setSettings(defaults);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to query central system settings.");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Generic fast-save updates to Firestore on toggle action
  const updateField = async (fieldName: string, value: any) => {
    if (!settings) return;
    
    // Update local state first for instant snappy response
    const previousSettings = { ...settings };
    const updated = { ...settings, [fieldName]: value };
    setSettings(updated);
    setSavingField(fieldName);

    try {
      await settingsService.updateSettings({ [fieldName]: value });
      toast.success(`SETTINGS SAVED: [${fieldName.replace(/([A-Z])/g, '_$1').toUpperCase()}] updated securely!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to commit setting change.`);
      setSettings(previousSettings); // revert on error
    } finally {
      setSavingField(null);
    }
  };

  // Generate cryptographic token
  const handleGenerateToken = async () => {
    const chars = 'abcdef0123456789';
    let randPart = '';
    for (let i = 0; i < 20; i++) {
      randPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const tokenVal = `csg_live_tok_${randPart}`;
    await updateField('apiToken', tokenVal);
  };

  if (loading) {
    return <div className="text-cyber-blue font-mono animate-pulse p-10">DECRYPTING SYSTEM CONFIGURATION...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      <div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight glitch-text">Central Governance Node</h2>
        <p className="text-cyber-text-muted font-mono text-[10px] tracking-wider mt-1">MODULE: SYSTEM_CONFIG_GRID // STATUS: NOMINAL</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
           {[
             { id: 'General', name: 'General config', icon: SettingsIcon },
             { id: 'Security', name: 'Security Policy', icon: Shield },
             { id: 'Alerts', name: 'Alert Dispatch', icon: Bell },
             { id: 'Networking', name: 'Network Stack', icon: Network },
             { id: 'Database', name: 'Data Storage', icon: Database },
             { id: 'API Tokens', name: 'API Credentials', icon: Lock },
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveTab(item.id as any)}
               className={cn(
                 "flex items-center gap-3 w-full px-4 py-3 rounded text-xs uppercase font-bold tracking-widest transition-all text-left cursor-pointer border",
                 activeTab === item.id 
                   ? "bg-cyber-blue/10 text-cyber-blue border-cyber-blue/40 shadow-[0_0_10px_rgba(56,189,248,0.1)]" 
                   : "text-gray-500 hover:text-white hover:bg-white/5 border-transparent"
               )}
             >
               <item.icon size={15} />
               {item.name}
             </button>
           ))}
        </div>

        {/* Configurations Forms Container */}
        <div className="md:col-span-3 space-y-6">
          <div className="cyber-panel">
            {/* General Settings Panel */}
            {activeTab === 'General' && (
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 border-b border-cyber-border pb-4 uppercase">
                  <SettingsIcon size={18} className="text-cyber-blue" />
                  General Node Parameters
                </h4>
                
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">System Core Identity Name</label>
                    <input 
                      type="text" 
                      value={settings.systemName || ''} 
                      onChange={(e) => updateField('systemName', e.target.value)}
                      className="cyber-input text-xs max-w-sm font-mono text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Maintenance Mode Active</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Forces all network telemetry log transmissions to queue locally without dispatching central webhooks.</p>
                    </div>
                    <button 
                      onClick={() => updateField('maintenanceMode', !settings.maintenanceMode)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.maintenanceMode ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.maintenanceMode ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Default Operator Clearance</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Establishes minimum authentication tiers for custom local configuration deployment.</p>
                    </div>
                    <select 
                      value={settings.operatorLevel || 'LVL_2_TOP_SECRET'}
                      onChange={(e) => updateField('operatorLevel', e.target.value)}
                      className="cyber-input py-1 text-xs font-mono"
                    >
                      <option value="LVL_1_SECRET">LVL_1_SECRET</option>
                      <option value="LVL_2_TOP_SECRET">LVL_2_TOP_SECRET</option>
                      <option value="LVL_3_COSMIC">LVL_3_COSMIC // MAXIMUM</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security Profile Panel */}
            {activeTab === 'Security' && (
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 border-b border-cyber-border pb-4 uppercase">
                  <Shield size={18} className="text-cyber-blue" />
                  Global Security Protocols
                </h4>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Real-time Threat Neutralization</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Automatically trigger deployed system isolating blocks when CRITICAL signals are matched.</p>
                    </div>
                    <button 
                      onClick={() => updateField('realtimeThreatNeutralization', !settings.realtimeThreatNeutralization)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.realtimeThreatNeutralization ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.realtimeThreatNeutralization ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">MAC Spoofing Prevention</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Auto-isolate local switches instantly if multiple nodes advertise the exact same physical HWID.</p>
                    </div>
                    <button 
                      onClick={() => updateField('macSpoofingPrevention', !settings.macSpoofingPrevention)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.macSpoofingPrevention ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.macSpoofingPrevention ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Intrusion Logging Retention</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Defines total history duration policies for cybersecurity network audit events.</p>
                    </div>
                    <select 
                      value={settings.intrusionLoggingDepth || '90 Days'} 
                      onChange={(e) => updateField('intrusionLoggingDepth', e.target.value)}
                      className="cyber-input py-1 text-xs font-mono"
                    >
                      <option value="30 Days">30 Days</option>
                      <option value="90 Days">90 Days</option>
                      <option value="1 Year">1 Year</option>
                      <option value="Forever">FOREVER_RETENTION</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts Dispatch Panel */}
            {activeTab === 'Alerts' && (
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 border-b border-cyber-border pb-4 uppercase">
                  <Bell size={18} className="text-cyber-blue" />
                  Alert Stream Webhooks
                </h4>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Email Notification Stream</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Dispatch alerts raw SMTP emails directly to system monitors.</p>
                    </div>
                    <button 
                      onClick={() => updateField('emailAlerts', !settings.emailAlerts)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.emailAlerts ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.emailAlerts ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Secure Telegram Bot Hook</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Relays active incident alerts instantly to secure Telegram admin channels.</p>
                    </div>
                    <button 
                      onClick={() => updateField('telegramAlerts', !settings.telegramAlerts)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.telegramAlerts ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.telegramAlerts ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Minimum Alert Severity Level</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Blocks stream dispatches for events carrying threats below this rating.</p>
                    </div>
                    <select 
                      value={settings.alertSeverity || 'CRITICAL'} 
                      onChange={(e) => updateField('alertSeverity', e.target.value)}
                      className="cyber-input py-1 text-xs font-mono"
                    >
                      <option value="INFO">INFO // LOWEST</option>
                      <option value="WARNING">WARNING</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL // HIGHEST</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Networking Panel */}
            {activeTab === 'Networking' && (
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 border-b border-cyber-border pb-4 uppercase">
                  <Network size={18} className="text-cyber-blue" />
                  DHCP & DNS Core Rules
                </h4>

                <div className="space-y-6">
                  <div className="flex items-center justify-between font-mono">
                    <div>
                      <p className="text-xs font-bold text-white">Automatic IP Leases (DHCP)</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Dynamically leases sequential local sub-network IPs to newly detected hosts.</p>
                    </div>
                    <button 
                      onClick={() => updateField('dhcpEnabled', !settings.dhcpEnabled)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.dhcpEnabled ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.dhcpEnabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Primary DNS Resolver IP</label>
                    <input 
                      type="text" 
                      value={settings.customDns || ''} 
                      onChange={(e) => updateField('customDns', e.target.value)}
                      className="cyber-input text-xs max-w-xs font-mono text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Enforce DNS over HTTPS (DoH)</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Encrypts outgoing domain lookup packets to prevent transit sniffing.</p>
                    </div>
                    <button 
                      onClick={() => updateField('dnsOverHttps', !settings.dnsOverHttps)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.dnsOverHttps ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.dnsOverHttps ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Database Panel */}
            {activeTab === 'Database' && (
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 border-b border-cyber-border pb-4 uppercase">
                  <Database size={18} className="text-cyber-blue" />
                  Local Database Offloading
                </h4>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Auto-generate Cron Backups</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Schedules automatic database snapshots compressed locally or uploaded offsite.</p>
                    </div>
                    <button 
                      onClick={() => updateField('autoBackup', !settings.autoBackup)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                        settings.autoBackup ? "bg-cyber-blue shadow-[0_0_10px_var(--color-cyber-blue)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        settings.autoBackup ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Cron Schedule Interval</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Determines the frequency of auto backup executions.</p>
                    </div>
                    <select 
                      value={settings.backupInterval || 'Daily'} 
                      onChange={(e) => updateField('backupInterval', e.target.value)}
                      className="cyber-input py-1 text-xs font-mono"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-white">Storage Threshold Hard-Limit</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-md">Triggers warning dispatches if the disk cluster allocated reaches this limit.</p>
                    </div>
                    <select 
                      value={settings.storageLimit || '50GB'} 
                      onChange={(e) => updateField('storageLimit', e.target.value)}
                      className="cyber-input py-1 text-xs font-mono"
                    >
                      <option value="10GB">10 GB</option>
                      <option value="50GB">50 GB</option>
                      <option value="500GB">500 GB</option>
                      <option value="Unlimited">Unlimited No hard-lock</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* API Toggles/Tokens Panel */}
            {activeTab === 'API Tokens' && (
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-2 border-b border-cyber-border pb-4 uppercase">
                  <Lock size={18} className="text-cyber-blue" />
                  API Tunnels & Access Tokens
                </h4>

                <div className="space-y-4 font-mono text-xs">
                  <p className="text-[10px] text-gray-500 leading-normal uppercase">
                    Use this system security token to authentications queries targeting external CSG node integrations. Guard this credential with the utmost safety.
                  </p>
                  
                  <div className="bg-black/60 border border-cyber-border p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                     <div className="font-mono text-xs text-cyber-green select-all tracking-wider break-all">
                       {settings.apiToken || "NO_ACTIVE_TOKEN"}
                     </div>
                     <button 
                       onClick={handleGenerateToken}
                       className="px-3 py-1.5 bg-cyber-blue/15 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black rounded text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 select-none"
                     >
                       <RefreshCw size={12} className="animate-spin-hover" />
                       Roll Token
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Diagnostics Access Console */}
          <div className="cyber-panel border-cyber-red/20">
             <h4 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-wide text-xs">
               <Terminal size={18} className="text-cyber-red animate-pulse" />
               Advanced Diagnostics Core
             </h4>
             <div className="p-4 bg-black/80 rounded-lg font-mono text-[9px] text-cyber-green leading-relaxed border border-cyber-border/40 select-text">
               <p>$ CSG_CORE_AUTH status</p>
               <p className="text-gray-500">{">>>"} Local ID identity: {settings.systemName || "CSG-HIVE-01"}</p>
               <p className="text-gray-500">{">>>"} Operating Core: v6.4.12-cyber-hardened</p>
               <p className="text-gray-500">{">>>"} Isolation Rules loaded: {settings.realtimeThreatNeutralization ? "ACTIVE_ISOLATE" : "PASSIVE_MONITOR"}</p>
               <p className="text-gray-500">{">>>"} Database Target ID: {settings.id || "system"}</p>
               <p className="mt-2 text-white">{">>>"} SECURITY CREDENTIAL TIER: Verified</p>
               <p className="animate-pulse">_</p>
             </div>
             <div className="mt-4 flex justify-between items-center">
                <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">SECURE GRID CONTROL v1.2</p>
                <button 
                  onClick={() => toast.warn("EMERGENCY SYSTEM SHUTDOWN PROTOCOL TRIPPED: Node access restricted.")}
                  className="text-cyber-red text-[10px] font-bold border border-cyber-red/30 px-3 py-1 rounded hover:bg-cyber-red hover:text-black transition-all cursor-pointer uppercase tracking-widest"
                >
                  EMERGENCY_SHUTDOWN
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
