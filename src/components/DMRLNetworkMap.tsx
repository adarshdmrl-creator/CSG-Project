import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Server, Cpu, Monitor, Play, Search, Info, CheckCircle2,
  AlertOctagon, AlertCircle, RefreshCw, Radio, ServerCrash, Layers
} from 'lucide-react';

export interface DMRLNode {
  id: string;
  label: string;
  type: 'core' | 'server' | 'switch' | 'terminal';
  subnet: 'core' | 'admin' | 'cad' | 'fe' | 'main' | 'other';
  x: number;
  y: number;
  status: 'online' | 'offline' | 'warning';
  ip: string;
  traffic: string;
  role: string;
}

interface DMRLEdge {
  from: string;
  to: string;
  speed: 'fast' | 'medium' | 'slow';
  active: boolean;
}

const DMRL_NODES: DMRLNode[] = [
  // --- CORE SYSTEM (HIP) ---
  { id: 'HIP', label: 'HIP', type: 'core', subnet: 'core', x: 500, y: 260, status: 'online', ip: '10.20.0.1', traffic: '450 Mbps', role: 'Main Central Router Switch Core' },
  { id: 'HIP_central_server', label: 'HIP central server', type: 'server', subnet: 'core', x: 500, y: 395, status: 'online', ip: '10.20.0.2', traffic: '1.2 Gbps', role: 'Central Admin Mainframe' },
  { id: 'HIP_48L2', label: 'HIP - 48L2', type: 'switch', subnet: 'core', x: 440, y: 300, status: 'online', ip: '10.20.0.3', traffic: '85 Mbps', role: 'Core Distribution Switch' },
  { id: 'CvlCvd', label: 'CviCvd', type: 'switch', subnet: 'core', x: 380, y: 320, status: 'online', ip: '10.20.0.4', traffic: '40 Mbps', role: 'Security Edge Gateway' },
  { id: 'PMG', label: 'PMG', type: 'switch', subnet: 'core', x: 330, y: 295, status: 'online', ip: '10.20.0.5', traffic: '12 Mbps', role: 'Subsystem Relay Controller' },
  { id: 'ERG', label: 'ERG', type: 'switch', subnet: 'core', x: 630, y: 300, status: 'online', ip: '10.20.0.6', traffic: '150 Mbps', role: 'Research Sub-Network Bridge' },
  { id: 'TEF', label: 'TEF', type: 'switch', subnet: 'core', x: 620, y: 345, status: 'online', ip: '10.20.0.7', traffic: '95 Mbps', role: 'Fabrication Ext Switch' },

  // --- CCG SUB-NETWORK (TOP LEFT) ---
  { id: 'CCG', label: 'CCG', type: 'core', subnet: 'core', x: 380, y: 150, status: 'online', ip: '10.20.1.1', traffic: '280 Mbps', role: 'Computing Center Gateway' },
  { id: 'MSG', label: 'MSG', type: 'switch', subnet: 'core', x: 280, y: 70, status: 'online', ip: '10.20.1.10', traffic: '32 Mbps', role: 'Material Science Gateway' },
  { id: 'ACG', label: 'ACG', type: 'switch', subnet: 'core', x: 340, y: 70, status: 'online', ip: '10.20.1.11', traffic: '15 Mbps', role: 'Advanced Chemistry Gateway' },
  { id: 'AMG', label: 'AMG', type: 'switch', subnet: 'core', x: 400, y: 70, status: 'online', ip: '10.20.1.12', traffic: '42 Mbps', role: 'Additive Manufacturing Gateway' },
  { id: 'CSD', label: 'CSD', type: 'switch', subnet: 'core', x: 290, y: 135, status: 'online', ip: '10.20.1.13', traffic: '65 Mbps', role: 'Computational Science Div' },
  { id: 'PAPU', label: 'PAPU', type: 'switch', subnet: 'core', x: 220, y: 180, status: 'online', ip: '10.20.1.14', traffic: '120 Mbps', role: 'Physics & Analysis Processing Unit' },
  { id: 'DYSL_SM', label: 'DYSL-SM', type: 'switch', subnet: 'core', x: 460, y: 110, status: 'online', ip: '10.20.1.15', traffic: '8 Mbps', role: 'Defense Young Scientist Lab Switch' },
  { id: 'PPG2', label: 'PPG2', type: 'switch', subnet: 'core', x: 510, y: 110, status: 'online', ip: '10.20.1.16', traffic: '22 Mbps', role: 'Propulsion Project Gateway' },
  { id: 'RTG', label: 'RTG', type: 'switch', subnet: 'core', x: 380, y: 215, status: 'online', ip: '10.20.1.17', traffic: '45 Mbps', role: 'Real-Time Telemetry Gateway' },
  { id: 'CCG_48L2', label: 'CCG-48L2', type: 'switch', subnet: 'core', x: 300, y: 235, status: 'online', ip: '10.20.1.18', traffic: '70 Mbps', role: 'CCG 48-Port L2 Switch' },

  // --- CAD SUB-NETWORK (BOTTOM LEFT) ---
  { id: 'CAD', label: 'CAD', type: 'core', subnet: 'cad', x: 380, y: 395, status: 'online', ip: '10.20.2.1', traffic: '320 Mbps', role: 'Computer Aided Design Core Router' },
  { id: 'ETC', label: 'ETC', type: 'switch', subnet: 'cad', x: 300, y: 345, status: 'online', ip: '10.20.2.10', traffic: '45 Mbps', role: 'Engineering Tech Center Switch' },
  { id: 'SAMG', label: 'SAMG', type: 'switch', subnet: 'cad', x: 195, y: 345, status: 'online', ip: '10.20.2.11', traffic: '28 Mbps', role: 'Specialized Alloys Metallurgical Group' },
  { id: 'METAL_PROC', label: 'METAL PROC', type: 'switch', subnet: 'cad', x: 195, y: 395, status: 'online', ip: '10.20.2.12', traffic: '55 Mbps', role: 'Metal Processing Research Unit' },
  { id: 'TRIBOLOGY', label: 'TRIBOLOGY', type: 'switch', subnet: 'cad', x: 195, y: 445, status: 'online', ip: '10.20.2.13', traffic: '18 Mbps', role: 'Tribology & Surface Eng Division' },
  { id: 'WORKSHOP', label: 'WORKSHOP', type: 'switch', subnet: 'cad', x: 195, y: 495, status: 'online', ip: '10.20.2.14', traffic: '92 Mbps', role: 'Experimental Workshop Switch' },

  // --- MAIN BLDG SUB-NETWORK (TOP RIGHT) ---
  { id: 'Main_Bldg', label: 'Main Bldg', type: 'core', subnet: 'main', x: 680, y: 155, status: 'online', ip: '10.20.3.1', traffic: '540 Mbps', role: 'Main Headquarters Gateway Core' },
  { id: 'Foundry', label: 'Foundry', type: 'switch', subnet: 'main', x: 720, y: 220, status: 'online', ip: '10.20.3.10', traffic: '18 Mbps', role: 'High-Temperature Foundry Control' },
  { id: 'Drona_HQr', label: 'Drona HQr', type: 'server', subnet: 'main', x: 680, y: 55, status: 'online', ip: '10.20.3.11', traffic: '680 Mbps', role: 'Drona Cluster Command Node' },
  { id: 'DMRL_MAIL_server', label: 'DMRL MAIL server', type: 'server', subnet: 'main', x: 780, y: 55, status: 'online', ip: '10.20.3.12', traffic: '210 Mbps', role: 'DMRL Official Exchange Mail Server' },
  { id: 'XRD', label: 'XRD', type: 'switch', subnet: 'main', x: 910, y: 55, status: 'online', ip: '10.20.3.13', traffic: '45 Mbps', role: 'X-Ray Diffraction Lab Terminal' },
  { id: 'floor_1st_R', label: '1st floor(R)', type: 'switch', subnet: 'main', x: 910, y: 95, status: 'online', ip: '10.20.3.14', traffic: '30 Mbps', role: 'Main Block 1st Floor East Wing' },
  { id: 'C_SIPE', label: 'C-SIPE', type: 'switch', subnet: 'main', x: 910, y: 135, status: 'online', ip: '10.20.3.15', traffic: '12 Mbps', role: 'Silicon Processing Laboratory' },
  { id: 'SFAG', label: 'SFAG', type: 'switch', subnet: 'main', x: 910, y: 180, status: 'online', ip: '10.20.3.16', traffic: '55 Mbps', role: 'Specialized Foil Alloys Group' },
  { id: 'Exchange', label: 'Exchange', type: 'switch', subnet: 'main', x: 910, y: 220, status: 'online', ip: '10.20.3.17', traffic: '240 Mbps', role: 'Unified Comm Gateway' },
  { id: 'Security', label: 'Security', type: 'switch', subnet: 'main', x: 910, y: 260, status: 'online', ip: '10.20.3.18', traffic: '88 Mbps', role: 'Front Gate Security Hub' },
  { id: 'ADD', label: 'ADD', type: 'switch', subnet: 'main', x: 910, y: 300, status: 'online', ip: '10.20.3.19', traffic: '40 Mbps', role: 'Advanced Design Division Switch' },
  { id: 'TIC', label: 'TIC', type: 'switch', subnet: 'main', x: 910, y: 345, status: 'online', ip: '10.20.3.20', traffic: '110 Mbps', role: 'Technology Information Center' },
  { id: 'SSG', label: 'SSG', type: 'switch', subnet: 'main', x: 910, y: 385, status: 'warning', ip: '10.20.3.21', traffic: '15 Mbps', role: 'Special Steel Group Node' },

  // --- FE SUB-NETWORK (BOTTOM RIGHT) ---
  { id: 'FE', label: 'FE', type: 'core', subnet: 'fe', x: 680, y: 395, status: 'online', ip: '10.20.4.1', traffic: '180 Mbps', role: 'Foundry Engineering Core Gateway' },
  { id: 'TAG', label: 'TAG', type: 'switch', subnet: 'fe', x: 780, y: 345, status: 'online', ip: '10.20.4.10', traffic: '24 Mbps', role: 'Titanium Alloys Group' },
  { id: 'PLASMA', label: 'PLASMA', type: 'switch', subnet: 'fe', x: 780, y: 385, status: 'warning', ip: '10.20.4.11', traffic: '98 Mbps', role: 'Plasma Processing Laser Wing' },
  { id: 'PEG', label: 'PEG', type: 'switch', subnet: 'fe', x: 780, y: 430, status: 'online', ip: '10.20.4.12', traffic: '52 Mbps', role: 'Precision Engineering Group Switch' },
  { id: 'WELDING', label: 'WELDING', type: 'switch', subnet: 'fe', x: 780, y: 475, status: 'online', ip: '10.20.4.13', traffic: '38 Mbps', role: 'Welding & Joining Tech Dept' },
  { id: 'HTC', label: 'HTC', type: 'switch', subnet: 'fe', x: 730, y: 475, status: 'online', ip: '10.20.4.14', traffic: '14 Mbps', role: 'High Temperature Testing Center' },

  // --- ADMIN / LEFT NETWORK EDGE ---
  { id: 'IMMS', label: 'IMMS', type: 'server', subnet: 'admin', x: 115, y: 55, status: 'online', ip: '10.20.5.10', traffic: '180 Mbps', role: 'Integrated Material Mgmt System Server' },
  { id: 'Leave_visitor_gate_TA', label: 'Leave & Gate Pass Info', type: 'server', subnet: 'admin', x: 115, y: 110, status: 'online', ip: '10.20.5.11', traffic: '95 Mbps', role: 'Security Portal & Entry Management' },
  { id: 'NEW_ADMIN_ground', label: 'NEW-ADMIN ground floor', type: 'switch', subnet: 'admin', x: 195, y: 215, status: 'online', ip: '10.20.5.1', traffic: '120 Mbps', role: 'New Admin Central Hub' },
  { id: 'Admin_1st', label: 'Admin building 1st Floor', type: 'terminal', subnet: 'admin', x: 90, y: 180, status: 'online', ip: '10.20.5.12', traffic: '15 Mbps', role: 'Finance & Secretariat Terminals' },
  { id: 'Admin_2nd_left', label: 'Admin building 2nd floor left', type: 'terminal', subnet: 'admin', x: 90, y: 235, status: 'online', ip: '10.20.5.13', traffic: '8 Mbps', role: 'Admin Block West Wing PCs' },
  { id: 'Admin_2nd_right', label: 'Admin building 2nd floor right', type: 'terminal', subnet: 'admin', x: 90, y: 285, status: 'online', ip: '10.20.5.14', traffic: '11 Mbps', role: 'Admin Block East Wing PCs' },
  { id: 'Admin_3rd_left', label: 'Admin building 3rd floor left', type: 'terminal', subnet: 'admin', x: 90, y: 340, status: 'offline', ip: '10.20.5.15', traffic: '0 Mbps', role: 'Auditorium Network Switch' },
  { id: 'Admin_3rd_right', label: 'Admin building 3rd floor Right', type: 'terminal', subnet: 'admin', x: 90, y: 395, status: 'online', ip: '10.20.5.16', traffic: '5 Mbps', role: 'Planning and HR Terminals' },
  { id: 'HRD', label: 'HRD', type: 'switch', subnet: 'admin', x: 195, y: 275, status: 'online', ip: '10.20.5.17', traffic: '28 Mbps', role: 'Human Resource Dev Gateway' },

  // --- ISOLATED COMP / EXTERNAL ---
  { id: 'DMRL_DMZ', label: 'DMRL DMZ', type: 'server', subnet: 'other', x: 550, y: 55, status: 'online', ip: '10.20.9.10', traffic: '320 Mbps', role: 'External Facing De-Militarized Zone Server' }
];

const DMRL_EDGES: DMRLEdge[] = [
  // CORES inter-connections
  { from: 'HIP', to: 'CCG', speed: 'fast', active: true },
  { from: 'HIP', to: 'Main_Bldg', speed: 'fast', active: true },
  { from: 'HIP', to: 'CAD', speed: 'fast', active: true },
  { from: 'HIP', to: 'FE', speed: 'fast', active: true },
  { from: 'CCG', to: 'CAD', speed: 'fast', active: true },

  // HIP server and switches
  { from: 'HIP', to: 'HIP_central_server', speed: 'fast', active: true },
  { from: 'HIP', to: 'HIP_48L2', speed: 'medium', active: true },
  { from: 'HIP_48L2', to: 'CvlCvd', speed: 'medium', active: true },
  { from: 'HIP_48L2', to: 'PMG', speed: 'medium', active: true },
  { from: 'HIP', to: 'CvlCvd', speed: 'medium', active: true },
  { from: 'HIP', to: 'ERG', speed: 'medium', active: true },
  { from: 'HIP', to: 'TEF', speed: 'medium', active: true },

  // CCG connections
  { from: 'CCG', to: 'MSG', speed: 'medium', active: true },
  { from: 'CCG', to: 'ACG', speed: 'slow', active: true },
  { from: 'CCG', to: 'AMG', speed: 'medium', active: true },
  { from: 'CCG', to: 'CSD', speed: 'medium', active: true },
  { from: 'CCG', to: 'PAPU', speed: 'fast', active: true },
  { from: 'CCG', to: 'DYSL_SM', speed: 'slow', active: true },
  { from: 'CCG', to: 'PPG2', speed: 'slow', active: true },
  { from: 'CCG', to: 'RTG', speed: 'medium', active: true },
  { from: 'CCG', to: 'CCG_48L2', speed: 'medium', active: true },

  // CAD connections
  { from: 'CAD', to: 'ETC', speed: 'medium', active: true },
  { from: 'ETC', to: 'SAMG', speed: 'slow', active: true },
  { from: 'ETC', to: 'METAL_PROC', speed: 'medium', active: true },
  { from: 'ETC', to: 'TRIBOLOGY', speed: 'slow', active: true },
  { from: 'ETC', to: 'WORKSHOP', speed: 'medium', active: true },
  { from: 'CAD', to: 'SAMG', speed: 'slow', active: true },
  { from: 'CAD', to: 'METAL_PROC', speed: 'medium', active: true },
  { from: 'CAD', to: 'TRIBOLOGY', speed: 'slow', active: true },
  { from: 'CAD', to: 'WORKSHOP', speed: 'medium', active: true },

  // Main Bldg connections
  { from: 'Main_Bldg', to: 'Foundry', speed: 'slow', active: true },
  { from: 'Main_Bldg', to: 'Drona_HQr', speed: 'fast', active: true },
  { from: 'Main_Bldg', to: 'DMRL_MAIL_server', speed: 'fast', active: true },
  { from: 'Main_Bldg', to: 'XRD', speed: 'medium', active: true },
  { from: 'Main_Bldg', to: 'floor_1st_R', speed: 'medium', active: true },
  { from: 'Main_Bldg', to: 'C_SIPE', speed: 'slow', active: true },
  { from: 'Main_Bldg', to: 'SFAG', speed: 'medium', active: true },
  { from: 'Main_Bldg', to: 'Exchange', speed: 'fast', active: true },
  { from: 'Main_Bldg', to: 'Security', speed: 'medium', active: true },
  { from: 'Main_Bldg', to: 'ADD', speed: 'medium', active: true },
  { from: 'Main_Bldg', to: 'TIC', speed: 'medium', active: true },
  { from: 'Main_Bldg', to: 'SSG', speed: 'slow', active: true },

  // FE connections
  { from: 'FE', to: 'TAG', speed: 'medium', active: true },
  { from: 'FE', to: 'PLASMA', speed: 'medium', active: true },
  { from: 'FE', to: 'PEG', speed: 'medium', active: true },
  { from: 'FE', to: 'WELDING', speed: 'slow', active: true },
  { from: 'FE', to: 'HTC', speed: 'slow', active: true },

  // Admin and Left network edge
  { from: 'NEW_ADMIN_ground', to: 'IMMS', speed: 'fast', active: true },
  { from: 'NEW_ADMIN_ground', to: 'Leave_visitor_gate_TA', speed: 'medium', active: true },
  { from: 'NEW_ADMIN_ground', to: 'Admin_1st', speed: 'slow', active: true },
  { from: 'NEW_ADMIN_ground', to: 'Admin_2nd_left', speed: 'slow', active: true },
  { from: 'NEW_ADMIN_ground', to: 'Admin_2nd_right', speed: 'slow', active: true },
  { from: 'NEW_ADMIN_ground', to: 'Admin_3rd_left', speed: 'slow', active: false },
  { from: 'NEW_ADMIN_ground', to: 'Admin_3rd_right', speed: 'slow', active: true },
  { from: 'NEW_ADMIN_ground', to: 'HRD', speed: 'medium', active: true },
  { from: 'NEW_ADMIN_ground', to: 'CCG', speed: 'medium', active: true },
  { from: 'NEW_ADMIN_ground', to: 'ETC', speed: 'medium', active: true },

  // Special connections
  { from: 'IMMS', to: 'CCG', speed: 'slow', active: true },
  { from: 'DMRL_DMZ', to: 'MSG', speed: 'slow', active: true },
  { from: 'DMRL_DMZ', to: 'CCG', speed: 'slow', active: true }
];

export default function DMRLNetworkMap() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('HIP');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubnet, setActiveSubnet] = useState<string>('all');
  const [themeMode, setThemeMode] = useState<'classic' | 'hologram'>('hologram');
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNode = useMemo(() => {
    return DMRL_NODES.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  const filteredNodes = useMemo(() => {
    return DMRL_NODES.filter(node => {
      const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            node.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            node.ip.includes(searchQuery);
      const matchesSubnet = activeSubnet === 'all' || node.subnet === activeSubnet;
      return matchesSearch && matchesSubnet;
    });
  }, [searchQuery, activeSubnet]);

  // Run a network diagnostics scan animation
  const handleRunDiagnostics = () => {
    if (isDiagnosticRunning) return;
    setIsDiagnosticRunning(true);
    setDiagnosticProgress(0);
    setDiagnosticLogs([`[0.0s] initializing DMRL network diagnostic probe...`]);

    const steps = [
      { p: 15, msg: `[1.2s] testing central core 'HIP' connection health... [ACK received, RTT: 2.1ms]` },
      { p: 35, msg: `[2.8s] probing Computing Center Gateway CCG subnet: 10.20.1.*` },
      { p: 55, msg: `[4.1s] checking CAD mechanical design and FE fabrication gateways...` },
      { p: 75, msg: `[5.5s] warning flagged on switch 'PLASMA' & switch 'SSG' [abnormal routing overhead]` },
      { p: 90, msg: `[6.8s] offline state verified for switch: Admin building 3rd floor left [TIMEOUT_ERR]` },
      { p: 100, msg: `[8.0s] check complete. DMRL physical & logical paths fully verified.` }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setDiagnosticProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDiagnosticRunning(false);
          return 100;
        }
        
        const nextProgress = prev + 4;
        
        // Add log triggers matched on progress approximation
        if (currentStep < steps.length && nextProgress >= steps[currentStep].p) {
          setDiagnosticLogs(prevLogs => [...prevLogs, steps[currentStep].msg]);
          currentStep++;
        }
        
        return nextProgress;
      });
    }, 300);
  };

  return (
    <div className="cyber-panel flex flex-col h-[640px] relative overflow-hidden select-none border border-cyber-border bg-black/60 shadow-lg">
      
      {/* Panel Header */}
      <div className="cyber-panel-header flex items-center justify-between px-4 py-2 border-b border-cyber-border bg-black/40">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-cyber-blue animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest text-white uppercase font-sans">DMRL_NETWORK_MAP</span>
        </div>
        
        {/* Subnet selector & search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search node..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-black/80 border border-cyber-border rounded px-2 py-0.5 text-[10px] text-cyber-blue placeholder-cyber-blue/40 font-mono focus:outline-none focus:border-cyber-blue/80 w-[110px]"
            />
            <Search className="w-3 h-3 text-cyber-blue/60 absolute right-2 top-1.5" />
          </div>

          <select
            value={activeSubnet}
            onChange={e => setActiveSubnet(e.target.value)}
            className="bg-black/80 border border-cyber-border rounded px-2 py-0.5 text-[10px] text-cyber-blue font-mono focus:outline-none focus:border-cyber-blue/80"
          >
            <option value="all">ALL SUBSETS</option>
            <option value="core">HIP/CCG CORES</option>
            <option value="admin">ADMIN SECTOR</option>
            <option value="cad">CAD SECTION</option>
            <option value="fe">FE DIV</option>
            <option value="main">MAIN BLDG</option>
          </select>

          {/* Theme Switcher Toggle */}
          <button 
            onClick={() => setThemeMode(prev => prev === 'classic' ? 'hologram' : 'classic')}
            className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all ${
              themeMode === 'hologram' 
                ? 'bg-cyber-blue/10 text-cyber-blue border-cyber-blue/40 hover:bg-cyber-blue/20' 
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
            }`}
            title="Switch Aesthetic Theme"
          >
            {themeMode === 'hologram' ? 'HOLOS' : 'CLASSIC'}
          </button>
        </div>
      </div>

      {/* Main Content Split Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-neutral-950/20">
        
        {/* SVG Topology Viewport */}
        <div ref={containerRef} className="flex-1 relative overflow-auto custom-scrollbar p-2 bg-gradient-to-b from-black/40 via-neutral-900/10 to-black/60 flex items-center justify-center">
          
          <svg 
            viewBox="50 35 900 500" 
            className="w-full h-full max-h-[580px] select-none scale-100 origin-center transition-all"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              {/* Halftone / Grid styling overlays */}
              <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(56,189,248,0.02)" strokeWidth="0.5" />
              </pattern>
              
              {/* Glow filters for awesome retro hologram neon styles */}
              <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid Pattern Background */}
            <rect width="1000" height="600" fill="url(#grid-pattern)" />

            {/* Topology Subnet Shading Circles (only in hologram mode) */}
            {themeMode === 'hologram' && (
              <>
                {/* Admin Subnetwork Area */}
                <circle cx="140" cy="240" r="140" fill="rgba(56,189,248,0.015)" stroke="rgba(56,189,248,0.04)" strokeDasharray="3 3" />
                <text x="70" y="375" className="text-[9px] font-mono font-bold tracking-widest fill-cyber-blue/30 uppercase">ADMIN_SUBNET</text>

                {/* CAD Section */}
                <circle cx="300" cy="450" r="110" fill="rgba(168,85,247,0.01)" stroke="rgba(168,85,247,0.03)" strokeDasharray="4 4" />
                <text x="240" y="530" className="text-[9px] font-mono font-bold tracking-widest fill-purple-400/30 uppercase">CAD_ZONE</text>

                {/* Metallurgy & FE Fabrication Section */}
                <circle cx="760" cy="430" r="110" fill="rgba(245,158,11,0.01)" stroke="rgba(245,158,11,0.03)" strokeDasharray="4 4" />
                <text x="750" y="525" className="text-[9px] font-mono font-bold tracking-widest fill-amber-400/30 uppercase">FE_ZONE</text>

                {/* Main Building Subnet */}
                <circle cx="850" cy="210" r="160" fill="rgba(16,185,129,0.01)" stroke="rgba(16,185,129,0.03)" strokeDasharray="3 3" />
                <text x="825" y="360" className="text-[9px] font-mono font-bold tracking-widest fill-emerald-400/35 uppercase">HQ_WING</text>
              </>
            )}

            {/* Link Connection Paths (Edges) */}
            {DMRL_EDGES.map((edge, i) => {
              const srcNode = DMRL_NODES.find(n => n.id === edge.from);
              const destNode = DMRL_NODES.find(n => n.id === edge.to);
              
              if (!srcNode || !destNode) return null;

              const isEdgeHighlighted = searchQuery !== '' 
                ? (srcNode.label.toLowerCase().includes(searchQuery.toLowerCase()) || destNode.label.toLowerCase().includes(searchQuery.toLowerCase()))
                : activeSubnet === 'all' || (srcNode.subnet === activeSubnet && destNode.subnet === activeSubnet);

              // Decide edge color based on theme settings
              let edgeColor = 'rgba(255,255,255,0.08)';
              if (edge.active && themeMode === 'classic') {
                edgeColor = 'rgba(59,130,246,0.7)'; // Classic blue link lines
              } else if (edge.active) {
                edgeColor = isEdgeHighlighted ? 'rgba(56,189,248,0.35)' : 'rgba(56,189,248,0.12)';
              } else {
                edgeColor = 'rgba(239,68,68,0.25)'; // Offline warning line
              }

              return (
                <g key={`edge-${i}`}>
                  <line 
                    x1={srcNode.x} 
                    y1={srcNode.y} 
                    x2={destNode.x} 
                    y2={destNode.y} 
                    stroke={edgeColor}
                    strokeWidth={edge.active ? (isEdgeHighlighted ? "1.8" : "1.2") : "1"}
                    className="transition-all"
                  />
                  
                  {/* Dynamic Shimmer/Data stream animation bubbles traveling along active roads */}
                  {edge.active && themeMode === 'hologram' && isEdgeHighlighted && (
                    <circle r="2" fill="#38bdf8" filter="url(#glow-blue)">
                      <animateMotion 
                        dur={edge.speed === 'fast' ? "2.5s" : edge.speed === 'medium' ? "4.5s" : "7s"} 
                        repeatCount="indefinite"
                        path={`M ${srcNode.x} ${srcNode.y} L ${destNode.x} ${destNode.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Interconnecting Core Gateways Bold Blue/Green Ring Indicators */}
            {themeMode === 'hologram' && !searchQuery && (
              <g opacity="0.35">
                {/* Visual grouping of 5 cores */}
                <path 
                  d="M 500 260 L 380 150 L 380 395 L 680 395 L 680 155 Z" 
                  fill="none" 
                  stroke="rgba(16,185,129,0.15)" 
                  strokeWidth="1.5" 
                  strokeDasharray="6 3" 
                  className="animate-[spin_120s_linear_infinite] origin-[500px_260px]"
                />
              </g>
            )}

            {/* Nodes group */}
            {DMRL_NODES.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const matchesSearch = searchQuery === '' || 
                node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
                node.ip.includes(searchQuery);
              const matchesSubnet = activeSubnet === 'all' || node.subnet === activeSubnet;
              const isHighlighted = matchesSearch && matchesSubnet;

              // Node dimensions
              let nodeWidth = node.type === 'core' ? 50 : 25;
              let nodeHeight = node.type === 'core' ? 50 : 25;
              
              const nodeGlow = node.status === 'online' 
                ? (themeMode === 'classic' ? '' : 'filter: drop-shadow(0px 0px 5px rgba(16,185,129,0.5))')
                : node.status === 'warning' 
                  ? 'filter: drop-shadow(0px 0px 5px rgba(245,158,11,0.6))'
                  : 'filter: drop-shadow(0px 0px 5px rgba(239,68,68,0.5))';

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x - nodeWidth/2}, ${node.y - nodeHeight/2})`}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => setSelectedNodeId(node.id)}
                  opacity={isHighlighted ? (isSelected ? 1 : 0.85) : 0.25}
                >
                  
                  {/* Outer selection beacon ring */}
                  {isSelected && (
                    <rect 
                      x={-4} 
                      y={-4} 
                      width={nodeWidth + 8} 
                      height={nodeHeight + 8} 
                      rx={2}
                      fill="none" 
                      stroke={themeMode === 'classic' ? 'rgba(59,130,246,0.9)' : '#38bdf8'} 
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Visual Shape */}
                  {node.type === 'core' ? (
                    // Core Gateway - Green Core Panel matching the original green squares with arrows
                    <g>
                      <rect 
                        width={nodeWidth} 
                        height={nodeHeight} 
                        rx={3}
                        fill={themeMode === 'classic' ? '#39a935' : 'rgba(16,185,129,0.25)'}
                        stroke={themeMode === 'classic' ? '#ffffff' : '#10b981'}
                        strokeWidth={themeMode === 'classic' ? "2" : "1.5"}
                        style={{ filter: themeMode === 'classic' ? 'none' : 'url(#glow-green)' }}
                      />
                      
                      {/* Black cross arrow insignia (Core symbol inside the green node) */}
                      <path 
                        d="M 25 8 L 25 42 M 8 25 L 42 25 M 25 8 L 21 14 M 25 8 L 29 14 M 25 42 L 21 36 M 25 42 L 29 36 M 8 25 L 14 21 M 8 25 L 14 29 M 42 25 L 36 21 M 42 25 L 36 29" 
                        fill="none" 
                        stroke={themeMode === 'classic' ? '#000000' : 'rgba(255,255,255,0.9)'} 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Active green pilot status indicator */}
                      <circle cx="43" cy="7" r="3" fill="#10b981" />
                    </g>
                  ) : node.type === 'server' ? (
                    // Server node: Computer tower/Chassis container style
                    <g>
                      <rect 
                        width={nodeWidth} 
                        height={nodeHeight} 
                        rx={2}
                        fill={themeMode === 'classic' ? '#39a935' : (node.status === 'online' ? 'rgba(56,189,248,0.2)' : 'rgba(239,68,68,0.25)')}
                        stroke={themeMode === 'classic' ? '#ffffff' : (node.status === 'online' ? '#38bdf8' : '#ef4444')}
                        strokeWidth={themeMode === 'classic' ? "1.5" : "1"}
                      />
                      {/* Desktop tower representation */}
                      <path 
                        d="M 6 5 L 19 5 L 19 20 L 6 20 Z" 
                        fill="rgba(0,0,0,0.5)" 
                        stroke={node.status === 'online' ? '#38bdf8' : '#ef4444'} 
                        strokeWidth="1" 
                      />
                      {/* Server core line slits */}
                      <line x1="9" y1="8" x2="16" y2="8" stroke={node.status === 'online' ? '#38bdf8' : '#ef4444'} strokeWidth="1" />
                      <line x1="9" y1="12" x2="16" y2="12" stroke={node.status === 'online' ? '#38bdf8' : '#ef4444'} strokeWidth="1" />
                      <circle cx="15" cy="16" r="1" fill="#10b981" />
                    </g>
                  ) : (
                    // Standard Switch / Terminal Node (Square icon with cable bundle stream on classic)
                    <g>
                      <rect 
                        width={nodeWidth} 
                        height={nodeHeight} 
                        rx={2}
                        fill={
                          themeMode === 'classic' 
                            ? '#39a935' 
                            : node.status === 'online' 
                              ? 'rgba(56,189,248,0.1)' 
                              : node.status === 'warning' 
                                ? 'rgba(245,158,11,0.2)' 
                                : 'rgba(239,68,68,0.25)'
                        }
                        stroke={
                          themeMode === 'classic' 
                            ? '#ffffff' 
                            : node.status === 'online' 
                              ? '#38bdf8' 
                              : node.status === 'warning' 
                                ? '#f59e0b' 
                                : '#ef4444'
                        }
                        strokeWidth="1"
                      />
                      
                      {/* Fiber stream fanning out on the bottom left (matching the classic image stream style) */}
                      {themeMode === 'classic' && (
                        <path 
                          d="M 3 22 Q -3 27 -6 32 M 12 22 Q 10 27 7 32 M 22 22 Q 28 27 31 32" 
                          fill="none" 
                          stroke="rgba(59,130,246,0.85)" 
                          strokeWidth="1.2" 
                        />
                      )}

                      {/* Ports in switches */}
                      <g opacity="0.7">
                        <rect x="5" y="8" width="4" height="4" fill="none" stroke="#ffffff" strokeWidth="0.5" />
                        <rect x="11" y="8" width="4" height="4" fill="none" stroke="#ffffff" strokeWidth="0.5" />
                        <rect x="17" y="8" width="4" height="4" fill="none" stroke="#ffffff" strokeWidth="0.5" />
                        
                        {/* Flashing green active network led indicator */}
                        <circle 
                          cx="13" 
                          cy="15" 
                          r="1.5" 
                          fill={node.status === 'online' ? '#10b981' : node.status === 'warning' ? '#f59e0b' : '#ef4444'} 
                          className="animate-ping"
                        />
                      </g>
                    </g>
                  )}

                  {/* Label Text aligned based on coordinate spacing limits */}
                  <text 
                    x={nodeWidth/2} 
                    y={nodeHeight + 11} 
                    textAnchor="middle" 
                    fill={
                      isSelected 
                        ? '#38bdf8' 
                        : (themeMode === 'classic' ? '#333333' : 'rgba(255,255,255,0.75)')
                    }
                    className="font-mono text-[7px] font-bold tracking-tight uppercase"
                    style={{ textShadow: themeMode === 'hologram' ? '0 1px 3px rgba(0,0,0,0.9)' : 'none' }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Diagnostic Overlay HUD */}
          {isDiagnosticRunning && (
            <div className="absolute top-4 left-4 bg-black/95 border border-cyber-blue px-3 py-2 rounded shadow-2xl shadow-blue-500/20 max-w-[280px]">
              <div className="flex items-center gap-2 mb-1.5 justify-between">
                <span className="text-[9px] font-mono font-bold text-cyber-blue uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyber-blue animate-ping" />
                  DIAGNOSTIC_RADAR_SWEEP
                </span>
                <span className="text-[10px] font-mono text-cyber-blue font-bold">{diagnosticProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 border border-cyber-border h-2 rounded-sm overflow-hidden mb-2.5">
                <div 
                  className="bg-cyber-blue h-full shadow-[0_0_10px_#38bdf8] transition-all"
                  style={{ width: `${diagnosticProgress}%` }}
                />
              </div>
              <div className="bg-black border border-cyber-border/60 p-2 font-mono text-[8px] text-cyber-green leading-relaxed h-[85px] overflow-y-auto flex flex-col gap-1 custom-scrollbar scroll-smooth">
                {diagnosticLogs.map((log, i) => (
                  <div key={i} className="truncate select-text">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Technical Sidebar Controls Deck */}
        <div className="w-[260px] border-l border-cyber-border bg-black/60 p-4 flex flex-col justify-between select-text overflow-y-auto">
          
          {/* Top Panel - Selected Node details */}
          <div className="space-y-4">
            <div className="pb-3 border-b border-cyber-border/50">
              <span className="text-[9px] font-bold text-cyber-text-muted uppercase tracking-widest block leading-3 mb-1">
                Substation Analysis
              </span>
              <h4 className="text-sm font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                {selectedNode ? selectedNode.label : 'No Node Selected'}
                {selectedNode && (
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                    selectedNode.status === 'online' 
                      ? 'bg-cyber-green animate-pulse' 
                      : selectedNode.status === 'warning' 
                        ? 'bg-cyber-yellow' 
                        : 'bg-cyber-red'
                  }`} />
                )}
              </h4>
            </div>

            {selectedNode ? (
              <div className="space-y-3 font-mono text-[10px]">
                <div className="grid grid-cols-3 gap-1 py-1 border-b border-cyber-border/30">
                  <span className="text-cyber-text-muted">IP ADDRESS</span>
                  <span className="col-span-2 text-white font-bold">{selectedNode.ip}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1 border-b border-cyber-border/30">
                  <span className="text-cyber-text-muted">HARDWARE</span>
                  <span className="col-span-2 text-cyber-blue font-bold uppercase">{selectedNode.type} MODULE</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1 border-b border-cyber-border/30">
                  <span className="text-cyber-text-muted">SUBNET_ID</span>
                  <span className="col-span-2 text-amber-500 font-bold uppercase">{selectedNode.subnet} DEPARTMENT</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1 border-b border-cyber-border/30">
                  <span className="text-cyber-text-muted">TRAFFIC LOG</span>
                  <span className="col-span-2 text-cyber-green font-bold">{selectedNode.traffic}</span>
                </div>
                <div className="py-1">
                  <span className="text-cyber-text-muted block mb-1">DESIGNATED ROLE</span>
                  <p className="text-[9px] leading-relaxed text-slate-300 italic">{selectedNode.role}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 rounded border border-dashed border-cyber-border text-center text-cyber-text-muted font-mono text-[10px]">
                Hover or click any network station to query dynamic hardware diagnostics
              </div>
            )}
          </div>

          {/* Diagnostics Activation & Live metrics */}
          <div className="mt-6 pt-4 border-t border-cyber-border/50 space-y-3">
            <div className="rounded bg-black/80 border border-cyber-border p-2 space-y-2">
              <div className="flex justify-between items-center text-[8px] font-bold font-mono text-cyber-text-muted">
                <span>SUBNET STATUS CARD</span>
                <span className="text-cyber-green flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> SCANNING_PASS
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">ONLINE STATIONS:</span>
                <span className="font-bold text-white">38 / 41</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">NETWORK EFFICIENCY:</span>
                <span className="font-bold text-cyber-green">98.3%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
