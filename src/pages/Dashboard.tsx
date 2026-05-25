import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Monitor, ShieldAlert, Layers, Activity, 
  AlertTriangle, CheckCircle,  Smartphone, Server,
  Globe, TrendingUp, TrendingDown, Users
} from 'lucide-react';
import { deviceService, groupService } from '../services/api';
import { DashboardStats, Group } from '../types';
import { cn } from '../lib/utils';
import NetworkTopology from '../components/NetworkTopology';
import AddDeviceModal from '../components/AddDeviceModal';

const COLORS = ['#38bdf8', '#4ade80', '#f43f5e', '#f59e0b', '#A855F7'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [s, g] = await Promise.all([
        deviceService.getStats(),
        groupService.getGroups()
      ]);
      setStats(s);
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

  const systemDistribution = [
    { name: 'LAN Systems', value: stats?.lanSystems || 0 },
    { name: 'Standalone Systems', value: stats?.standaloneSystems || 0 },
    { name: 'Internet Systems', value: stats?.internetSystems || 0 },
  ];

  const totalSystems = systemDistribution.reduce((acc, curr) => acc + curr.value, 0);

  const activityData = [
    { name: 'JAN', scans: 400, blocks: 240, errors: 200 },
    { name: 'FEB', scans: 300, blocks: 139, errors: 210 },
    { name: 'MAR', scans: 200, blocks: 980, errors: 229 },
    { name: 'APR', scans: 278, blocks: 310, errors: 200 },
    { name: 'MAY', scans: 189, blocks: 480, errors: 218 },
    { name: 'JUN', scans: 239, blocks: 380, errors: 250 },
    { name: 'JUL', scans: 349, blocks: 430, errors: 210 },
    { name: 'AUG', scans: 400, blocks: 210, errors: 300 },
  ];

  if (loading) return <div className="text-cyber-blue font-mono animate-pulse uppercase tracking-[0.2em] font-bold">SYNCHRONIZING_WITH_CSG_CORE...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-white uppercase glitch-text">CSG_Operations_Center</h2>
          <p className="text-cyber-text-muted text-[10px] font-mono tracking-widest mt-1">SECURITY_PROTOCOL: ACTIVE // ENCRYPTION: HL-7/NET</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="cyber-button-primary"
           >
             <span className="text-xl">+</span> Add Device
           </button>
        </div>
      </div>

      {/* Stats Grid - Gradient Cards from Image 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'LAN Systems', value: stats?.lanSystems || 0, trend: '+12%', color: 'from-blue-600/20 to-indigo-600/10', icon: Monitor },
          { label: 'Standalone Systems', value: stats?.standaloneSystems || 0, trend: '+8%', color: 'from-orange-500/20 to-orange-600/10', icon: Smartphone },
          { label: 'Internet Systems', value: stats?.internetSystems || 0, trend: '+5%', color: 'from-emerald-500/20 to-teal-500/10', icon: Globe },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-sm p-8 bg-gradient-to-br border border-white/10 group shadow-lg shadow-black/40",
              stat.color
            )}
          >
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all text-white">
              <stat.icon size={120} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{stat.label}</p>
              <stat.icon size={18} className="text-white/40" />
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tighter">{stat.value}</h3>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
               <span className="text-[10px] font-bold text-white/50 uppercase">Increased by {stat.trend.slice(1)}</span>
               <TrendingUp size={14} className="text-cyber-green opacity-50" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Topology Map */}
        <NetworkTopology groups={groups} />

        {/* Activity Statistics bar chart from images */}
        <div className="cyber-panel flex flex-col h-[500px]">
           <div className="cyber-panel-header">
              <span>SCAN_STATISTICS</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyber-blue" />
                  <span className="text-[8px]">SCANS</span>
                </div>
              </div>
           </div>
           <div className="flex-1 p-6">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={activityData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                 <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px' }}
                 />
                 <Bar dataKey="scans" fill="#38bdf8" radius={[2, 2, 0, 0]} barSize={16} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Connection Matrix Donut */}
        <div className="cyber-panel lg:col-span-1 flex flex-col">
           <div className="cyber-panel-header">
              <span>SYSTEM_CONNECTION_MATRIX</span>
           </div>
           <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="relative h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={systemDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {systemDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{totalSystems}</span>
                  <span className="text-[8px] text-cyber-text-muted uppercase font-bold tracking-widest">Total Nodes</span>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                 {systemDistribution.map((source, i) => (
                   <div key={source.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[11px] font-bold text-cyber-text-muted uppercase tracking-tighter">{source.name}</span>
                     </div>
                     <span className="text-[11px] font-mono text-white/50">{source.value}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Real-time Data Grid */}
        <div className="cyber-panel lg:col-span-2 flex flex-col">
          <div className="cyber-panel-header">
            <span>REAL-TIME_DATA_STREAM</span>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
               <span className="text-cyber-green">LIVE</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
             <div className="grid grid-cols-4 px-6 py-3 bg-white/5 text-[9px] font-bold text-cyber-text-muted uppercase tracking-widest border-b border-cyber-border">
                <div>SYSTEM_NODE</div>
                <div>ADDRESS</div>
                <div>VECTOR_ACTIVITY</div>
                <div className="text-right">STATUS</div>
             </div>
             <div className="divide-y divide-cyber-border/30">
                {[
                  { host: 'CSG-SRV-04', ip: '192.168.1.12', activity: 'CPU_HIGH_LOAD [88%]', status: 'SECURE' },
                  { host: 'CSG-WK-24', ip: '10.0.4.112', activity: 'ENCRYPTED_TUNNEL_OPEN', status: 'SECURE' },
                  { host: 'CSG-IOT-09', ip: '172.16.8.21', activity: 'HEARTBEAT_ACK_TIMEOUT', status: 'CAUTION' },
                  { host: 'CSG-NAS-02', ip: '10.0.8.45', activity: 'VOLUME_MIRROR_SYNC', status: 'SECURE' },
                  { host: 'CSG-DB-CORE', ip: '192.168.2.1', activity: 'SQL_CLEANUP_DAEMON', status: 'SECURE' },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 px-6 py-4 text-[12px] hover:bg-white/2 transition-colors items-center">
                    <div className="font-bold text-white">{row.host}</div>
                    <div className="font-mono text-cyber-text-muted text-[10px]">{row.ip}</div>
                    <div className="text-cyber-text-muted text-[11px] italic">{row.activity}</div>
                    <div className="text-right">
                       <span className={cn(
                         "px-2 py-0.5 rounded-sm text-[9px] font-bold border uppercase",
                         row.status === 'SECURE' ? "tag-online" : "bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow/20"
                       )}>
                         {row.status}
                       </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
