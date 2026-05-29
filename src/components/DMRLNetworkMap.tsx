import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Server, Cpu, Monitor, Play, Search, Info, CheckCircle2,
  AlertOctagon, AlertCircle, RefreshCw, Radio, ServerCrash, Layers,
  Terminal
} from 'lucide-react';
import { authService } from '../services/api';

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
  const [nodes, setNodes] = useState<DMRLNode[]>(() => {
    const saved = localStorage.getItem('dmrl_network_nodes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DMRL_NODES;
      }
    }
    return DMRL_NODES;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('HIP');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubnet, setActiveSubnet] = useState<string>('all');
  const [themeMode, setThemeMode] = useState<'classic' | 'hologram'>('hologram');
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  
  // Terminal state
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [currentPath, setCurrentPath] = useState('C:\\DMRL');
  const [terminalTextColor, setTerminalTextColor] = useState('text-gray-300');
  const terminalScrollContainerRef = useRef<HTMLDivElement>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            node.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            node.ip.includes(searchQuery);
      const matchesSubnet = activeSubnet === 'all' || node.subnet === activeSubnet;
      return matchesSearch && matchesSubnet;
    });
  }, [searchQuery, activeSubnet, nodes]);

  const handleNodeSelect = (node: DMRLNode) => {
    setSelectedNodeId(node.id);
    setShowTerminal(true);
    // Standard prompt starter text
    setTerminalHistory([
      `Microsoft Windows [Version 10.0.19045.4170]`,
      `(c) Microsoft Corporation. All rights reserved.`,
      ``,
      `Connecting to node static socket at ${node.ip}...`,
      `[SSH-V2] Tunnel handshake completed.`,
      `[CORE-VALIDATE] Core-switch deployment rules loaded.`,
      `Establishing terminal environment on ${node.label}... SUCCESS`,
      `Type 'help' to see dynamic switch controller commands.`,
      ``
    ]);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    // Append current command to history
    const currentPrompt = `${currentPath}> ${cmd}`;

    // Helper to append output
    const appendOutput = (outputs: string[]) => {
      setTerminalHistory(prev => [...prev, currentPrompt, ...outputs, '']);
    };

    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (mainCmd === 'help' || mainCmd === '?' || cmd === '/?') {
      appendOutput([
        `HELP - SYSTEM DIRECTORY OF TERMINAL COMMANDS`,
        `============================================`,
        `HELP                  - Displays a list of available CLI commands`,
        `IPCONFIG [/ALL]       - Displays Windows IP protocol parameters and subnets`,
        `DIR [path]            - Lists directory files and directories on system drive`,
        `CD [path]             - Changes the current directory in virtual storage`,
        `TYPE [filename]       - Displays content of targeted system text files`,
        `TREE                  - Graphically displays folder structure of the drive`,
        `PING [ip/hostname]    - Pings live network substations and returns statistics`,
        `TRACERT [ip/hostname] - Traces dynamic route hops to network substations`,
        `ARP -A                - Displays Address Resolution Protocol dynamic cache`,
        `NETSTAT [-AN]         - Displays open listener sockets on selected switch`,
        `TASKLIST              - Lists active execution core service processes and memory`,
        `SYSTEMINFO            - Retrieves extensive machine and firmware parameters`,
        `VALIDATE              - Runs CoreSwitch compliance validation checks`,
        `GPUPDATE [/FORCE]     - Forces updates of local machine security policies`,
        `CHKDSK                - Checks system volume files allocation integrity`,
        `SET variable [value]  - Configures target switch properties in memory`,
        `  Variables: ip, label, status, custom/role`,
        `ECHO [message]        - Echoes custom text input on console output`,
        `DATE / TIME           - Outputs current GMT/local timestamp on system clock`,
        `WHOAMI                - Shows active console administration security role`,
        `COLOR [code]          - Sets console theme color (e.g., color 0a, color 0b, color 07)`,
        `CLS / CLEAR           - Empties Command Prompt stdout buffers`,
        `EXIT                  - Dismisses SSH shell session and returns to Specs`
      ]);
    } else if (mainCmd === 'cls' || mainCmd === 'clear') {
      setTerminalHistory([]);
    } else if (mainCmd === 'exit' || mainCmd === 'close') {
      setShowTerminal(false);
    } else if (mainCmd === 'ver' || mainCmd === 'version') {
      appendOutput([
        `Microsoft Windows [Version 10.0.19045.4170]`,
        `CSG CoreSecure Module System [Kernel Build v4.1.28-SecureRTOS]`
      ]);
    } else if (mainCmd === 'whoami') {
      const isViewerRole = authService.getCurrentUser()?.role === 'viewer';
      if (isViewerRole) {
        appendOutput([
          `DMRL-NETCORE\\viewer  (Privilege Access Level: L1_VIEWER_READONLY)`
        ]);
      } else {
        appendOutput([
          `DMRL-NETCORE\\administrator  (Privilege Access Level: L3_ADMIN_GATEWAY)`
        ]);
      }
    } else if (mainCmd === 'date') {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' });
      appendOutput([
        `The current date is: ${dateStr}`,
        `Enter the new date: (MM-DD-YYYY)`
      ]);
    } else if (mainCmd === 'time') {
      const today = new Date();
      const timeStr = today.toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 99);
      appendOutput([
        `The current time is: ${timeStr}`,
        `Enter the new time:`
      ]);
    } else if (mainCmd === 'systeminfo') {
      if (!selectedNode) {
        appendOutput([`ERROR: No active hardware target selected.`]);
      } else {
        appendOutput([
          `HOST SYSTEM CHARACTERISTICS:`,
          `---------------------------`,
          `OS Name:                   Microsoft Windows 10 Enterprise LTSC`,
          `OS Version:                10.0.19045 N/A Build 19045`,
          `OS Manufacturer:           Microsoft Corporation`,
          `Firmware Model:            CSG CoreSecure RTOS v4.1.28`,
          `Vlan Interface Gate:       VLAN-${selectedNode.subnet.toUpperCase()}`,
          `Processor(s):              1 Processor(s) Installed.`,
          `                           [01]: Intel Xeon Core Secure Secure-86 @ 3.40GHz`,
          `BIOS Version:              DMRL-AMI-SecureBoot Security Layer-V5`,
          `System Locale:             en-us;English (United States)`,
          `Total Physical Memory:     16,384 MB`,
          `Switch Node Hardware:      ${selectedNode.label} (${selectedNode.id})`,
          `Socket IP Connection:      ${selectedNode.ip}`,
          `Node Operating Status:     ${selectedNode.status.toUpperCase()}`,
          `Assigned Deployment Role:  ${selectedNode.role}`,
          `Core Traffic Integrity:    ${selectedNode.traffic}`,
          `Primary Core Uplink Port:  GigabitEthernet1/0/1`
        ]);
      }
    } else if (mainCmd === 'ipconfig') {
      const isAll = args.some(arg => arg.toLowerCase() === '/all' || arg.toLowerCase() === '-all');
      if (!selectedNode) {
        appendOutput([
          `Windows IP Configuration`,
          ``,
          `Ethernet adapter Gigabit Link:`,
          `   Media State . . . . . . . . . . . : Media disconnected`,
          `   Connection-specific DNS Suffix  . : `
        ]);
      } else {
        const lines = [
          `Windows IP Configuration`,
          ``,
          `Ethernet adapter Local Area Connection 10G:`,
          `   Connection-specific DNS Suffix  . : dmrl.internal`,
          `   IPv4 Address. . . . . . . . . . . : ${selectedNode.ip}`,
          `   Subnet Mask . . . . . . . . . . . : 255.255.0.0`,
          `   Default Gateway . . . . . . . . . : 10.20.0.1`
        ];
        if (isAll) {
          lines.push(
            `   Physical Address. . . . . . . . . : 00-15-5D-A8-1D-B2`,
            `   DHCP Enabled. . . . . . . . . . . : No (Static IP)`,
            `   Autoconfiguration Enabled . . . . : Yes`,
            `   DNS Servers . . . . . . . . . . . : 10.20.0.5`,
            `                                       8.8.8.8`,
            `   NetBIOS over Tcpip. . . . . . . . : Enabled`,
            ``,
            `Tunnel adapter Tunnelling Secure Handshake VPN:`,
            `   Connection-specific DNS Suffix  . : `,
            `   IPv4 Address. . . . . . . . . . . : 10.128.4.15`,
            `   Subnet Mask . . . . . . . . . . . : 255.255.255.255`,
            `   Default Gateway . . . . . . . . . : 0.0.0.0`
          );
        }
        appendOutput(lines);
      }
    } else if (mainCmd === 'tree') {
      appendOutput([
        `Folder PATH listing`,
        `Volume Serial Number is 4D1B-EF28`,
        `C:\\DMRL`,
        `├───diagnostics`,
        `└───subnets`
      ]);
    } else if (mainCmd === 'cd' || mainCmd === 'chdir' || cmd.toLowerCase() === 'cd..') {
      const isCdDotDot = cmd.toLowerCase() === 'cd..' || (args[0] && args[0].trim() === '..');
      
      if (isCdDotDot) {
        if (currentPath === 'C:\\DMRL') {
          appendOutput([`Already at root directory.`]);
        } else {
          setCurrentPath('C:\\DMRL');
          setTerminalHistory(prev => [...prev, currentPrompt, 'Returned to C:\\DMRL', '']);
        }
      } else {
        const pathArg = args.join(' ').trim().toLowerCase().replace(/\\/g, '/');
        if (!pathArg) {
          appendOutput([currentPath]);
        } else if (pathArg === 'subnets' || pathArg === 'c:/dmrl/subnets' || pathArg === './subnets') {
          setCurrentPath('C:\\DMRL\\subnets');
          setTerminalHistory(prev => [...prev, currentPrompt, 'Directory changed to C:\\DMRL\\subnets', '']);
        } else if (pathArg === 'diagnostics' || pathArg === 'c:/dmrl/diagnostics' || pathArg === './diagnostics') {
          setCurrentPath('C:\\DMRL\\diagnostics');
          setTerminalHistory(prev => [...prev, currentPrompt, 'Directory changed to C:\\DMRL\\diagnostics', '']);
        } else if (pathArg === '..' || pathArg === '../') {
          if (currentPath === 'C:\\DMRL') {
            appendOutput([`Already at root directory.`]);
          } else {
            setCurrentPath('C:\\DMRL');
            setTerminalHistory(prev => [...prev, currentPrompt, 'Returned to C:\\DMRL', '']);
          }
        } else {
          appendOutput([`The system cannot find the path specified: "${args.join(' ')}"`]);
        }
      }
    } else if (mainCmd === 'dir' || mainCmd === 'ls') {
      const listPath = args.join(' ').trim();
      const resolvedPath = listPath ? listPath.toUpperCase() : currentPath;
      
      if (resolvedPath === 'C:\\DMRL' || resolvedPath === 'C:/DMRL' || !listPath) {
        appendOutput([
          ` Volume in drive C has no label.`,
          ` Volume Serial Number is 4D1B-EF28`,
          ``,
          ` Directory of C:\\DMRL`,
          ``,
          `05/29/2026  05:02 AM    <DIR>          .`,
          `05/29/2026  05:02 AM    <DIR>          ..`,
          `05/29/2026  05:02 AM    <DIR>          subnets`,
          `05/29/2026  05:02 AM    <DIR>          diagnostics`,
          `05/29/2026  05:02 AM             1,420 system.conf`,
          `05/29/2026  05:02 AM               840 security.cfg`,
          `05/29/2026  05:02 AM            12,480 switchboot.log`,
          `               3 File(s)         14,740 bytes`,
          `               4 Dir(s)  248,150,425,600 bytes free`
        ]);
      } else if (resolvedPath === 'SUBNETS' || resolvedPath === 'C:\\DMRL\\SUBNETS' || resolvedPath === 'C:/DMRL/SUBNETS') {
        appendOutput([
          ` Volume in drive C has no label.`,
          ` Volume Serial Number is 4D1B-EF28`,
          ``,
          ` Directory of C:\\DMRL\\subnets`,
          ``,
          `05/29/2026  05:02 AM    <DIR>          .`,
          `05/29/2026  05:02 AM    <DIR>          ..`,
          `05/29/2026  05:02 AM             3,120 vlan_mapping.json`,
          `05/29/2026  05:02 AM               980 gateways.conf`,
          `               2 File(s)          4,100 bytes`,
          `               2 Dir(s)  248,150,425,600 bytes free`
        ]);
      } else if (resolvedPath === 'DIAGNOSTICS' || resolvedPath === 'C:\\DMRL\\DIAGNOSTICS' || resolvedPath === 'C:/DMRL/DIAGNOSTICS') {
        appendOutput([
          ` Volume in drive C has no label.`,
          ` Volume Serial Number is 4D1B-EF28`,
          ``,
          ` Directory of C:\\DMRL\\diagnostics`,
          ``,
          `05/29/2026  05:02 AM    <DIR>          .`,
          `05/29/2026  05:02 AM    <DIR>          ..`,
          `05/29/2026  05:02 AM         2,048,000 sw_sweep.exe`,
          `05/29/2026  05:02 AM            42,910 network_stats.log`,
          `               2 File(s)      2,090,910 bytes`,
          `               2 Dir(s)  248,150,425,600 bytes free`
        ]);
      } else {
        appendOutput([`The system cannot find the path specified.`]);
      }
    } else if (mainCmd === 'type' || mainCmd === 'cat') {
      const fileArg = args.join(' ').trim().toLowerCase();
      if (!fileArg) {
        appendOutput([`Usage: type [filename]`]);
      } else {
        const atRoot = currentPath === 'C:\\DMRL';
        const atSubnets = currentPath === 'C:\\DMRL\\subnets';
        const atDiag = currentPath === 'C:\\DMRL\\diagnostics';
        
        if (fileArg === 'system.conf' && atRoot) {
          appendOutput([
            `# DMRL Switch Gateway - System Configuration File`,
            `# Last Compiled: May 2026`,
            `SWITCH_INTERFACE=CSG_GIGABIT_CORE`,
            `MAX_DUPLEX_CHANNELS=128`,
            `DYNAMIC_ARP_PING_MS=1500`,
            `VLAN_ROUTE_AGGREGATION=TRUE`,
            `HARDWARE_ACCELERATION=ENABLED`,
            `SSL_HANDSHAKE_TIMEOUT=5000`
          ]);
        } else if (fileArg === 'security.cfg' && atRoot) {
          appendOutput([
            `# DMRL SECURE ELEMENT PROFILE Configuration`,
            `# SEC_PROV_ID=0x83E1A29D`,
            `ENFORCE_SSL_SSH_TUNNELLING=TRUE`,
            `ALLOW_UNAUTHORIZED_IP_BIND=FALSE`,
            `AUTHORIZED_VLAN_MASK=0xFFFE0000`,
            `SW_DEPLOY_INTEGRITY_SIGNATURE=0x9A4D3B2C1E`,
            `ENFORCE_STATIC_ROUTING_COMPLIANCE=TRUE`
          ]);
        } else if (fileArg === 'switchboot.log' && atRoot) {
          appendOutput([
            `[2026-05-29 00:01:12] [BOOT] CSG CoreSecure Kernel Initializing (v4.1.28)`,
            `[2026-05-29 00:01:13] [BOOT] CPU Core Initialization Complete. 16 threads verified.`,
            `[2026-05-29 00:01:14] [BOOT] Loading CMOS static lookup definitions...`,
            `[2026-05-29 00:01:14] [BOOT] [OK] VLAN structures built.`,
            `[2026-05-29 00:01:15] [BOOT] [OK] Duplex collision-free pipelines mapped.`,
            `[2026-05-29 00:01:15] [BOOT] SSH Server listening on port 22.`,
            `[2026-05-29 00:01:16] [BOOT] Static routing daemon listening.`,
            `[2026-05-29 00:01:17] [BOOT] Core Stack Gateway is fully ONLINE.`
          ]);
        } else if (fileArg === 'vlan_mapping.json' && atSubnets) {
          appendOutput([
            `{`,
            `  "vlans": [`,
            `    {"id": "VLAN-CORE", "subnet": "10.20.0.0/24", "priority": "CRITICAL"},`,
            `    {"id": "VLAN-CCG", "subnet": "10.20.1.0/24", "priority": "HIGH"},`,
            `    {"id": "VLAN-CAD", "subnet": "10.20.2.0/24", "priority": "MEDIUM"},`,
            `    {"id": "VLAN-FE", "subnet": "10.20.3.0/24", "priority": "MEDIUM"},`,
            `    {"id": "VLAN-DMZ", "subnet": "10.20.255.0/24", "priority": "LOW"}`,
            `  ]`,
            `}`
          ]);
        } else if (fileArg === 'gateways.conf' && atSubnets) {
          appendOutput([
            `Primary Gateway IP : 10.20.0.1 (CSG Master Root)`,
            `Fallback Gateway IP: 10.20.0.2 (CSG Master Redundant)`,
            `DNS Server Primary : 10.20.0.5`,
            `DNS Server Secondary: 8.8.8.8 (External internet DNS bridge)`
          ]);
        } else if (fileArg === 'network_stats.log' && atDiag) {
          appendOutput([
            `DMRL Network Status Dump:`,
            `Online status verification: 38 nodes active.`,
            `Core Gateway bandwidth utilization: 42.8 Gbps`,
            `Collision rate: 0.0001% (Within nominal limits)`,
            `Jitter: <0.2ms (Excellent fiber alignment)`
          ]);
        } else if (fileArg === 'sw_sweep.exe' && atDiag) {
          appendOutput([
            `ERROR: Cannot view binary files in text mode!`,
            `sw_sweep.exe is an executable binary file compiled for CoreSecure-v4.1.`
          ]);
        } else {
          appendOutput([`The system cannot find the file specified: "${args.join(' ')}"`]);
        }
      }
    } else if (mainCmd === 'mkdir' || mainCmd === 'md') {
      const isViewer = authService.getCurrentUser()?.role === 'viewer';
      if (isViewer) {
        appendOutput([
          `ERROR ACCESS DENIED:`,
          `  Viewer role is not authorized to create folders or write directories.`
        ]);
      } else {
        const folderName = args.join(' ').trim();
        if (!folderName) {
          appendOutput([`Usage: mkdir [folder_name]`]);
        } else {
          appendOutput([
            `Directory "${folderName}" created successfully on system drive.`,
            `Committed folder creation backplane mapping: [ OK ]`
          ]);
        }
      }
    } else if (mainCmd === 'gpupdate') {
      appendOutput([
        `Updating policy...`,
        `Computer Policy update has completed successfully.`,
        `User Policy update has completed successfully.`,
        `Core switch dynamic group policies refreshed securely.`
      ]);
    } else if (mainCmd === 'chkdsk') {
      appendOutput([
        `The type of the file system is NTFS.`,
        `WARNING!  /F parameter not specified.`,
        `Running CHKDSK in read-only mode.`,
        ``,
        `Stage 1: Examining basic file system structure ...`,
        `  256 file records processed.                                         `,
        `  File verification completed.`,
        `  0 large file records processed.                             `,
        `  0 bad file records processed.                               `,
        ``,
        `Stage 2: Examining file name linkage ...`,
        `  332 index entries processed.                                 `,
        `  Index verification completed.`,
        ``,
        `Windows has scanned the file system and found no problems.`,
        `No further action is required.`,
        ``,
        `  248,150,425,600 bytes total disk space.`,
        `           18,840 bytes in 11 files.`,
        `                0 bytes in 0 indexes.`,
        `          120,410 bytes in use by the system.`,
        `  248,150,305,190 bytes available on disk.`
      ]);
    } else if (mainCmd === 'color') {
      const colorArg = args.join(' ').trim().toLowerCase();
      if (!colorArg) {
        setTerminalTextColor('text-gray-300');
        appendOutput([
          `Console color reset to default white on black (07).`,
          `Provide standard color codes, e.g. color 0a (green), color 0b (blue), color 07 (white).`
        ]);
      } else if (colorArg === '0a' || colorArg === 'a') {
        setTerminalTextColor('text-green-400 font-semibold');
        appendOutput([`Terminal color set to Terminal Green.`]);
      } else if (colorArg === '0b' || colorArg === 'b') {
        setTerminalTextColor('text-cyan-400');
        appendOutput([`Terminal color set to Terminal Cyber Blue.`]);
      } else if (colorArg === '0e' || colorArg === 'e') {
        setTerminalTextColor('text-yellow-400 font-semibold');
        appendOutput([`Terminal color set to Terminal Console Amber/Yellow.`]);
      } else if (colorArg === '07' || colorArg === '7') {
        setTerminalTextColor('text-gray-300');
        appendOutput([`Terminal color reset to Standard Gray.`]);
      } else {
        appendOutput([
          `Invalid color attribute: "${colorArg}"`,
          `Supported formats:`,
          `  color 0a (Green), color 0b (Blue), color 0e (Amber/Yellow), color 07 (Standard White)`
        ]);
      }
    } else if (mainCmd === 'echo') {
      appendOutput([args.join(' ')]);
    } else if (mainCmd === 'shutdown' || mainCmd === 'reboot') {
      setTerminalHistory(prev => [
        ...prev,
        currentPrompt,
        `System shutdown/reboot process initiated.`,
        `[!] WARNING: Closing secure terminal connection pipeline to ${selectedNode ? selectedNode.ip : 'remote node'}.`,
        `[SSH] Closing channels...`,
        `Session terminated. Terminating connection in 2 seconds...`
      ]);
      setTerminalInput('');
      setTimeout(() => {
        setShowTerminal(false);
      }, 2000);
      return;
    } else if (mainCmd === 'ping') {
      const targetParam = parts[1];
      if (!targetParam) {
        appendOutput([`Usage: ping [IP_ADDRESS or NODE_NAME]`]);
      } else {
        const foundTarget = nodes.find(n => n.ip === targetParam || n.id.toLowerCase() === targetParam.toLowerCase() || n.label.toLowerCase() === targetParam.toLowerCase());
        const outputs = [
          `Pinging ${targetParam} with 32 bytes of diagnostic data:`,
        ];

        if (foundTarget) {
          if (foundTarget.status === 'offline') {
            outputs.push(
              `Request timed out.`,
              `Request timed out.`,
              `Request timed out.`,
              `Request timed out.`,
              `Ping statistics for ${targetParam}:`,
              `    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`
            );
          } else {
            const delay = foundTarget.status === 'warning' ? '82ms' : '4ms';
            outputs.push(
              `Reply from ${foundTarget.ip}: bytes=32 time=${delay} TTL=64`,
              `Reply from ${foundTarget.ip}: bytes=32 time=${delay} TTL=64`,
              `Reply from ${foundTarget.ip}: bytes=32 time=${delay} TTL=64`,
              `Reply from ${foundTarget.ip}: bytes=32 time=${delay} TTL=64`,
              `Ping statistics for ${foundTarget.ip}:`,
              `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`,
              `Approximate round trip times in milli-seconds:`,
              `    Minimum = ${delay}, Maximum = ${delay}, Average = ${delay}`
            );
          }
        } else {
          const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
          if (ipPattern.test(targetParam)) {
            outputs.push(
              `Reply from ${targetParam}: bytes=32 time=58ms TTL=128`,
              `Reply from ${targetParam}: bytes=32 time=61ms TTL=128`,
              `Reply from ${targetParam}: bytes=32 time=59ms TTL=128`,
              `Reply from ${targetParam}: bytes=32 time=60ms TTL=128`,
              `Ping statistics for ${targetParam}:`,
              `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`,
              `Approximate round trip times in milli-seconds:`,
              `    Minimum = 58ms, Maximum = 61ms, Average = 59ms`
            );
          } else {
            outputs.push(
              `Ping request could not find host ${targetParam}. Please check the target IP/name and try again.`
            );
          }
        }
        appendOutput(outputs);
      }
    } else if (mainCmd === 'tracert' || mainCmd === 'traceroute') {
      const targetParam = parts[1];
      if (!targetParam) {
        appendOutput([`Usage: tracert [IP_ADDRESS or NODE_NAME]`]);
      } else {
        const found = nodes.find(n => n.ip === targetParam || n.id.toLowerCase() === targetParam.toLowerCase() || n.label.toLowerCase() === targetParam.toLowerCase());
        const lines = [
          `Tracing route to ${targetParam} over a maximum of 30 hops:`,
          ``
        ];
        if (found) {
          lines.push(
            `  1    <1 ms    <1 ms    <1 ms  10.20.0.1 (DMRL Primary Core Gateway Router)`,
            `  2     1 ms    <1 ms     2 ms  ${found.ip} [${found.label}]`
          );
          if (found.status === 'offline') {
            lines.push(
              `  3     *        *        *     Request timed out.`,
              `  4     *        *        *     Request timed out.`,
              `Destination switch is currently administrative OFFLINE.`
            );
          } else {
            lines.push(`Trace complete.`);
          }
        } else {
          lines.push(
            `  1    <1 ms    <1 ms    <1 ms  10.20.0.1 (DMRL Primary Core Gateway Router)`,
            `  2     *        *        *     Request timed out.`,
            `  3     *        *        *     Request timed out.`,
            `Trace dynamic termination: Target host unreachable.`
          );
        }
        appendOutput(lines);
      }
    } else if (mainCmd === 'arp') {
      const arpArg = args.join(' ').toLowerCase();
      if (!arpArg || arpArg === '-a') {
        const arpLines = [
          `Interface: ${selectedNode ? selectedNode.ip : '10.20.5.15'} --- 0x1f`,
          `  Internet Address      Physical Address      Type`
        ];
        nodes.filter(n => n.id !== selectedNode?.id).forEach((n, idx) => {
          const hex = (idx + 15).toString(16).padEnd(2, '0');
          arpLines.push(`  ${n.ip.padEnd(21)}00-15-5D-${hex.toUpperCase()}-E3-A1   dynamic`);
        });
        appendOutput(arpLines);
      } else {
        appendOutput([
          `Displays and modifies the IP-to-Physical address translation tables.`,
          ``,
          `ARP -a            Displays current ARP entries by interrogating current protocol data.`
        ]);
      }
    } else if (mainCmd === 'netstat') {
      const opt = args.join(' ').toLowerCase();
      const ip = selectedNode ? selectedNode.ip : '10.20.0.100';
      const lines = [
        `Active Connections`,
        ``,
        `  Proto  Local Address          Foreign Address        State`
      ];
      lines.push(
        `  TCP    ${ip}:22               10.20.0.1:49911        ESTABLISHED`,
        `  TCP    ${ip}:135              0.0.0.0:0              LISTENING`,
        `  TCP    ${ip}:445              0.0.0.0:0              LISTENING`
      );
      nodes.filter(n => n.id !== selectedNode?.id && n.status === 'online').slice(0, 3).forEach(n => {
        lines.push(`  TCP    ${ip}:8080             ${n.ip}:8080           ESTABLISHED`);
      });
      appendOutput(lines);
    } else if (mainCmd === 'tasklist') {
      const lines = [
        `Image Name                     PID Session Name        Session#    Mem Usage`,
        `========================= ======== ================ =========== ============`,
        `System Idle Process              0 Services                   0          8 K`,
        `System                           4 Services                   0        156 K`,
        `smss.exe                       312 Services                   0        412 K`,
        `csrss.exe                      524 Services                   0      4,112 K`,
        `wininit.exe                    588 Services                   0      3,420 K`,
        `services.exe                   640 Services                   0      8,190 K`,
        `lsass.exe                      652 Services                   0     14,210 K`,
        `svchost.exe                    810 Services                   0     24,980 K`,
        `RoutingDaemon.exe             1140 Services                   0     18,440 K`,
        `DuplexCollisionMonitor.exe    2024 Services                   0     12,500 K`,
        `SecureTunnelSSH.exe           3150 Services                   0      9,880 K`,
        `VlanController.exe            4810 Services                   0     11,200 K`
      ];
      appendOutput(lines);
    } else if (mainCmd === 'set') {
      const isViewer = authService.getCurrentUser()?.role === 'viewer';
      const subfield = args[0] ? args[0].toLowerCase() : '';
      const val = args.slice(1).join(' ');

      if (isViewer) {
        appendOutput([
          `ERROR ACCESS DENIED:`,
          `  Viewer role is not authorized to edit or modify switch configurations.`
        ]);
      } else if (!selectedNode) {
        appendOutput([`ERROR: No active hardware target selected.`]);
      } else if (!subfield || !val) {
        appendOutput([
          `Usage:`,
          `  set ip [new_ip]`,
          `  set label [new_name]`,
          `  set status [online|offline|warning]`,
          `  set custom [new_role]`
        ]);
      } else {
        const updatedNodes = nodes.map(n => {
          if (n.id === selectedNode.id) {
            if (subfield === 'ip') {
              const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
              if (!ipPattern.test(val)) {
                return { ...n, _err: 'Invalid IP address pattern.' };
              }
              if (!val.startsWith('10.20.')) {
                return { ...n, _err: 'Deployment Warning: IP must belong to CSG core subnet 10.20.0.0/16.' };
              }
              return { ...n, ip: val, _err: undefined };
            }
            if (subfield === 'label' || subfield === 'hostname') {
              return { ...n, label: val };
            }
            if (subfield === 'status') {
              const lowerVal = val.toLowerCase();
              if (['online', 'offline', 'warning'].includes(lowerVal)) {
                return { ...n, status: lowerVal as any };
              } else {
                return { ...n, _err: 'Invalid status. Choose online, offline, or warning.' };
              }
            }
            if (subfield === 'custom' || subfield === 'role') {
              return { ...n, role: val };
            }
          }
          return n;
        });

        const updatedSelf = updatedNodes.find(n => n.id === selectedNode.id);
        if (updatedSelf && (updatedSelf as any)._err) {
          appendOutput([`ERROR CONFIGURATION FAILURE:`, `  ${(updatedSelf as any)._err}`]);
        } else {
          setNodes(updatedNodes as any);
          localStorage.setItem('dmrl_network_nodes', JSON.stringify(updatedNodes));
          
          let responseLines = [
            `Switch hardware modified locally in CMOS RAM.`,
            `Physical Layer re-vectoring: SUCCESS.`,
          ];

          responseLines.push(
            ``,
            `[CORE-SWITCH DEPLOYMENT COMPLIANCE CHECK]`,
            `-------------------------------------------`,
            `[+] Deploy Target: DMRL Core Stack Gateway`,
            `[+] Module: ${updatedSelf?.label} (${updatedSelf?.ip})`,
            `[+] Scanning Duplex collision... PASSED`,
            `[+] Check Static Host routing map... COMPLETE`,
            `[+] Integrity signature match... OK`,
            `[STATUS] Validation PASSED. Configuration successfully deployed & committed to network core switch.`
          );

          appendOutput(responseLines);
        }
      }
    } else if (mainCmd === 'validate') {
      if (!selectedNode) {
        appendOutput([`ERROR: No hardware node targeted.`]);
      } else {
        appendOutput([
          `CSG CORE NETWORK DEPLOYMENT VALIDATION ENGINE`,
          `=================================================`,
          `Target Node ID:     ${selectedNode.id}`,
          `Target IP Vector:   ${selectedNode.ip}`,
          `Deployment Path:    CORE-INJECT/VLAN-${selectedNode.subnet.toUpperCase()}`,
          `Checking Subnet Boundary (10.20.0.0/16):   [ OK ]`,
          `Verifying Routing Daemon handshake:         [ ACK ]`,
          `Testing Loopback Adapter echo:             [ OK ]`,
          `Validating Gateway Address ARP Bind:       [ SUCCESS ]`,
          `-------------------------------------------------`,
          `STATUS: All deployment verification tests PASSED.`,
          `Dashboard is fully certified for network core switch runtime operations.`
        ]);
      }
    } else {
      // General custom or unrecognized command prompt feedback
      appendOutput([
        `Executing search in remote DMRL switch directory for '${cmd}'...`,
        `[!] Intercepting custom command signal...`,
        `[+] Sending custom command buffer stream to: ${selectedNode ? selectedNode.label : 'CSG_CORE'}`,
        `[+] Status outcome committed: SUCCESS with Exit Status 0.`
      ]);
    }

    setTerminalInput('');
    
    // Scroll terminal custom ref container safely
    setTimeout(() => {
      if (terminalScrollContainerRef.current) {
        terminalScrollContainerRef.current.scrollTop = terminalScrollContainerRef.current.scrollHeight;
      }
    }, 40);
  };

  useEffect(() => {
    if (showTerminal && terminalScrollContainerRef.current) {
      terminalScrollContainerRef.current.scrollTop = terminalScrollContainerRef.current.scrollHeight;
    }
  }, [showTerminal, terminalHistory]);

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
              const srcNode = nodes.find(n => n.id === edge.from);
              const destNode = nodes.find(n => n.id === edge.to);
              
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
            {nodes.map((node) => {
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
                  onClick={() => handleNodeSelect(node)}
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
        <div className="w-[260px] border-l border-cyber-border bg-black/65 p-3 flex flex-col justify-between select-text overflow-hidden">
          
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header section with Specs / Prompt tabs */}
            <div className="pb-3 border-b border-cyber-border/50 flex justify-between items-center shrink-0">
              <div className="truncate pr-1 mr-1">
                <span className="text-[9px] font-bold text-cyber-text-muted uppercase tracking-widest block leading-3 mb-1">
                  Substation Analysis
                </span>
                <h4 className="text-sm font-bold text-white uppercase tracking-tighter flex items-center gap-1.5 truncate">
                  {selectedNode ? selectedNode.label : 'No Node Selected'}
                  {selectedNode && (
                    <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${
                      selectedNode.status === 'online' 
                        ? 'bg-cyber-green animate-pulse' 
                        : selectedNode.status === 'warning' 
                          ? 'bg-cyber-yellow' 
                          : 'bg-cyber-red'
                    }`} />
                  )}
                </h4>
              </div>
              
              {selectedNode && (
                <div className="flex gap-1 shrink-0">
                  <button 
                    onClick={() => setShowTerminal(false)}
                    aria-label="View node technical grid characteristics"
                    className={`px-1.5 py-0.5 text-[8px] font-mono border uppercase tracking-wider transition-all rounded-sm ${
                      !showTerminal 
                        ? 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30 font-bold' 
                        : 'bg-transparent text-gray-500 border-transparent hover:text-white'
                    }`}
                  >
                    SPECS
                  </button>
                  <button 
                    onClick={() => {
                      setShowTerminal(true);
                      if (terminalHistory.length === 0) {
                        handleNodeSelect(selectedNode);
                      }
                    }}
                    aria-label="Open command prompt terminal shell"
                    className={`px-1.5 py-0.5 text-[8px] font-mono border uppercase tracking-wider transition-all rounded-sm ${
                      showTerminal 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold' 
                        : 'bg-transparent text-gray-500 border-transparent hover:text-white'
                    }`}
                  >
                    PROMPT
                  </button>
                </div>
              )}
            </div>

            {/* Main Area: Specs or Interactive Command Prompt Terminal */}
            <div className="flex-1 min-h-0 mt-3 flex flex-col">
              {selectedNode ? (
                showTerminal ? (
                  /* CMD Terminal Box - fits perfectly inside substation analysis sidebar */
                  <div className="flex-1 flex flex-col min-h-0 bg-black border border-cyber-border/80 rounded overflow-hidden shadow-2xl">
                    {/* CMD Title bar */}
                    <div className="bg-[#1e1e1e] border-b border-cyber-border/40 px-2 py-1 flex justify-between items-center text-[7.5px] font-mono text-gray-400 select-none shrink-0">
                      <div className="flex items-center gap-1 truncate max-w-[80%]">
                        <Terminal className="w-2.5 h-2.5 text-cyber-blue animate-pulse" />
                        <span className="truncate">Administrator: cmd.exe ({selectedNode.ip})</span>
                      </div>
                      <div className="flex gap-1.5 text-[9px] font-bold shrink-0">
                        <span className="hover:text-white cursor-pointer" onClick={() => setShowTerminal(false)} title="Minimize to Specs">_</span>
                        <span className="text-red-500 hover:text-red-400 cursor-pointer ml-1" onClick={() => setShowTerminal(false)} title="Return to Specs Panel">X</span>
                      </div>
                    </div>
                         {/* Console screen buffer */}
                    <div 
                      ref={terminalScrollContainerRef} 
                      className={`flex-1 p-2 overflow-y-auto font-mono text-[8.5px] leading-normal bg-black selection:bg-gray-800 custom-scrollbar flex flex-col gap-1 ${terminalTextColor}`}
                    >
                      {terminalHistory.map((line, idx) => {
                        let lineStyle = '';
                        if (line.includes('[!]') || line.includes('WARNING') || line.includes('warning') || line.includes('unauthorized') || line.includes('intercepted')) {
                          lineStyle = 'text-yellow-400';
                        } else if (line.startsWith('ERROR') || line.includes('failure') || line.includes('unauthorized') || line.includes('intercepted')) {
                          lineStyle = 'text-red-500 font-semibold';
                        } else if (line.startsWith('[STATUS] Validation PASSED') || line.startsWith('STATUS:') || line.startsWith('Trace complete') || line.startsWith('Volume') || line.includes('successfully') || line.includes('PASSED') || line.includes('SUCCESS')) {
                          lineStyle = 'text-green-400 font-semibold';
                        } else if (line.startsWith('[SUCCESS]') || line.startsWith('Switch hardware') || line.includes('COMPLETE') || line.includes('Ok') || line.includes('OK')) {
                          lineStyle = 'text-green-400';
                        } else if (line.startsWith('HELP') || line.startsWith('AVAILABLE') || line.startsWith('Directory of') || line.startsWith('Folder PATH')) {
                          lineStyle = 'text-cyan-400 font-semibold';
                        } else if (line.startsWith('Pinging') || line.startsWith('Reply') || line.startsWith('Tracing')) {
                          lineStyle = 'text-blue-400 font-medium';
                        } else if (line.includes('cmd.exe') || line.startsWith('Microsoft')) {
                          lineStyle = 'text-gray-400';
                        }
                        
                        return (
                          <div key={idx} className={`whitespace-pre-wrap break-all ${lineStyle}`}>
                            {line}
                          </div>
                        );
                      })}
                    </div>
 
                    {/* Console input prompt bar */}
                    <form onSubmit={handleCommandSubmit} className="flex border-t border-cyber-border/40 bg-black p-1.5 font-mono text-[8.5px] select-none text-[#cccccc] items-center shrink-0">
                      <span className="text-cyber-blue whitespace-nowrap pl-0.5 shrink-0 select-none">
                        {currentPath}&gt;
                      </span>
                      <input 
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        className="flex-1 bg-transparent border-none text-[8.5px] text-white focus:outline-none focus:ring-0 p-0 pl-1 font-mono"
                        autoFocus
                        placeholder="Type 'help'..."
                      />
                    </form>
                  </div>
                ) : (
                  /* Standard Hardware Grid panel */
                  <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-1 flex flex-col justify-between">
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
                    
                    <button 
                      onClick={() => {
                        setShowTerminal(true);
                        handleNodeSelect(selectedNode);
                      }}
                      className="w-full mt-auto border border-cyber-blue/50 text-[10px] font-mono text-cyber-blue hover:bg-cyber-blue/15 transition-all py-1.5 uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue animate-ping shrink-0" />
                      Open CMD prompt Link
                    </button>
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-900/40 rounded border border-dashed border-cyber-border text-center text-cyber-text-muted font-mono text-[10px]">
                  Hover or click any network station to query dynamic hardware diagnostics
                </div>
              )}
            </div>
          </div>

          {/* Subnet Status Card - stays simple and neat at the bottom of sidebar if room permits, otherwise we keep it simple */}
          {!showTerminal && (
            <div className="mt-4 pt-4 border-t border-cyber-border/50 space-y-3 shrink-0">
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
          )}

        </div>

      </div>

    </div>
  );
}
