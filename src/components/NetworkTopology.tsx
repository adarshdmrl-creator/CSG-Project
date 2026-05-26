import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '../types';
import { Network, Activity, Shield, Cpu, Zap, Info, Radio, Settings, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface NetworkTopologyProps {
  groups: Group[];
}

type TopologyType = 'STAR' | 'MESH' | 'BRANCH';

// Intermediate Distribution Hub definition for Branch Topology
interface BranchHub {
  id: string;
  name: string;
  zone: string;
  status: 'active' | 'normal';
  x: number;
  y: number;
}

const BRANCH_HUBS: BranchHub[] = [
  { id: 'hub-0', name: 'Alpha LAN Hub', zone: 'Sector A', status: 'normal', x: -160, y: -40 },
  { id: 'hub-1', name: 'Secure Vault Hub', zone: 'Sector B', status: 'active', x: 0, y: -40 },
  { id: 'hub-2', name: 'Gateway Edge Hub', zone: 'Sector C', status: 'normal', x: 160, y: -40 },
];

export default function NetworkTopology({ groups }: NetworkTopologyProps) {
  const visualGroups = groups.slice(0, 12);
  const totalNodes = visualGroups.length;

  // States
  const [topology, setTopology] = useState<TopologyType>('STAR');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [pingSpeed, setPingSpeed] = useState<number>(14);

  // Dynamic dimension observer
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 440 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // set dimensions ensuring reasonable minimums
        setDimensions({ width: width || 600, height: height || 440 });
      }
    });
    observer.observe(containerRef.current);
    
    // Initial core-start feed logs
    setSystemLogs([
      `[SYS_INIT] Loading network topological scanner...`,
      `[SYS_INFO] 12 security clusters mapped to central telemetry grid.`,
      `[SYS_INFO] Default TOPOLOGY_STAR online. Core router running on 0.0.0.0.`
    ]);

    return () => observer.disconnect();
  }, []);

  // Center points
  const cx = dimensions.width / 2;
  const cy = dimensions.height / 2;

  // Topology metrics
  const topologyMetrics = {
    STAR: {
      name: 'Star (Centrally Routed)',
      latency: 12,
      resilience: 'Low (Single-point of failure)',
      loadBalance: 'Centralized',
      notes: 'Every node connects to central CORE SWITCH. High single-point-of-failure vulnerability.',
      efficiency: '94% throughput',
      hops: 'Avg 2 Hops'
    },
    MESH: {
      name: 'Full Mesh (Ad-Hoc Redundant)',
      latency: 8,
      resilience: 'Extreme (Fully autonomous backup vectors)',
      loadBalance: 'Decentralized Peer-to-Peer',
      notes: 'Lattice interconnected networks. Data packets traverse ad-hoc neighbor bridges.',
      efficiency: '99% throughput',
      hops: 'Avg 1.2 Hops'
    },
    BRANCH: {
      name: 'Branch / Tree (Hierarchical Tree)',
      latency: 18,
      resilience: 'Medium (Segment isolated failure zones)',
      loadBalance: 'Multi-tiered distribution',
      notes: 'Hierarchical campus layout. Secondary hub dropouts isolate small sub-branches.',
      efficiency: '88% throughput',
      hops: 'Avg 3.4 Hops'
    }
  };

  // Add system log entry
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 5)]);
  };

  // Change topology with animation and logging
  const handleTopologyChange = (type: TopologyType) => {
    setTopology(type);
    setSelectedNodeId(null);
    let tempPing = 14;
    if (type === 'STAR') tempPing = 12;
    if (type === 'MESH') tempPing = 8;
    if (type === 'BRANCH') tempPing = 18;
    setPingSpeed(tempPing);

    addLog(`Switched telemetry to TOPOLOGY_${type}`);
    addLog(`Recalculating network vectors... Latency optimal at ${tempPing}ms.`);
  };

  // Calculate coordinates for any group node
  const getNodeCoordinates = (index: number) => {
    if (topology === 'STAR') {
      const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
      const radius = 170;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    } else if (topology === 'MESH') {
      // Offset concentric nested ring structure for complex mesh feel
      const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
      const radius = index % 2 === 0 ? 115 : 185;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    } else {
      // BRANCH / TREE topology
      // 3 hubs, each controls 4 of our 12 nodes
      const hubIndex = Math.floor(index / 4) % 3; // 0, 1, 2
      const subIndex = index % 4; // Index 0, 1, 2, 3 under parent hub

      // Parent sub-hub coordinates
      const hub = BRANCH_HUBS[hubIndex];
      // Distribute nodes horizotally underneath parent hub
      const offsetMultiplier = (subIndex - 1.5); // Spans -1.5, -0.5, 0.5, 1.5
      const x = hub.x + offsetMultiplier * 42;
      const y = 130 + (subIndex % 2 === 0 ? 0 : 35); // pleasant staggered leaf-node fan
      return { x, y };
    }
  };

  // Node position helper by ID
  const getNodePosById = (id: string) => {
    if (id === 'core') return { x: 0, y: topology === 'BRANCH' ? -150 : 0 };
    if (id.startsWith('hub-')) {
      const hub = BRANCH_HUBS.find(h => h.id === id);
      return hub ? { x: hub.x, y: hub.y } : { x: 0, y: 0 };
    }
    const idx = visualGroups.findIndex(g => g.id === id);
    return idx !== -1 ? getNodeCoordinates(idx) : { x: 0, y: 0 };
  };

  // Assemble connectivity lines array based on selected topology
  const getConnections = () => {
    const list: { from: string; to: string; active?: boolean }[] = [];

    if (topology === 'STAR') {
      visualGroups.forEach(g => {
        list.push({ from: 'core', to: g.id });
      });
    } else if (topology === 'MESH') {
      // In Mesh, everyone is interconnected plus some core connections
      visualGroups.forEach((g, i) => {
        // Core link for some backbone hubs
        if (i % 2 === 0) {
          list.push({ from: 'core', to: g.id });
        }
        // Adjacent link (circular mesh)
        list.push({ from: g.id, to: visualGroups[(i + 1) % totalNodes].id });
        // Redundant cross link
        list.push({ from: g.id, to: visualGroups[(i + 3) % totalNodes].id });
        // Inter-segment links
        if (i < totalNodes / 2) {
          list.push({ from: g.id, to: visualGroups[i + Math.floor(totalNodes / 2)].id });
        }
      });
    } else if (topology === 'BRANCH') {
      // Core connects to the 3 Sub-Hubs
      BRANCH_HUBS.forEach(hub => {
        list.push({ from: 'core', to: hub.id });
      });
      // Sub-hubs feed children leafnodes (4 groups per hub)
      visualGroups.forEach((g, i) => {
        const hubId = `hub-${Math.floor(i / 4) % 3}`;
        list.push({ from: hubId, to: g.id });
      });
    }

    // Flag lines as active if they are associated with the hovered/selected node
    if (selectedNodeId) {
      list.forEach(conn => {
        if (conn.from === selectedNodeId || conn.to === selectedNodeId) {
          conn.active = true;
        } else if (topology === 'BRANCH' && selectedNodeId.startsWith('dev') === false) {
          // If a branch hub is selected, activate its core line and downstream leaves active lines
          if (conn.from === 'core' && conn.to === selectedNodeId) conn.active = true;
          if (conn.from === selectedNodeId) conn.active = true;
        }
      });
    }

    return list;
  };

  const connections = getConnections();

  // Handle clicking node
  const handleNodeClick = (id: string, name: string) => {
    setSelectedNodeId(id === selectedNodeId ? null : id);
    if (id !== selectedNodeId) {
      addLog(`Querying diagnostics for cluster component [${name}]`);
      addLog(`Latency to host verified successfully: ${Math.floor(Math.random() * 8) + 2}ms`);
    } else {
      addLog(`Cleared cluster focal view`);
    }
  };

  // Detailed selected node attributes
  const getSelectedNodeInfo = () => {
    if (!selectedNodeId) return null;
    if (selectedNodeId === 'core') {
      return {
        name: 'Central Core Switch Matrix',
        ip: '10.20.0.1 (Gateway)',
        role: 'Primary Core System Router',
        status: 'SECURE / ONLINE',
        throughput: '1.2 Tbps traffic capacity',
        metrics: 'Packet loss: 0.00% | Uptime: 99.999%'
      };
    }
    if (selectedNodeId.startsWith('hub-')) {
      const hub = BRANCH_HUBS.find(h => h.id === selectedNodeId);
      return {
        name: hub?.name || 'Secondary Branch Hub',
        ip: `10.20.${selectedNodeId.slice(-1)}.1`,
        role: 'Sub-Distribution Segment Hub',
        status: hub?.status === 'active' ? 'HEAVY TRAFFIC' : 'NOMINAL / ONLINE',
        throughput: '400 Gbps network trunk',
        metrics: `Direct segment feeding 4 subnet groups.`
      };
    }
    const idx = visualGroups.findIndex(g => g.id === selectedNodeId);
    if (idx !== -1) {
      const g = visualGroups[idx];
      return {
        name: g.name,
        ip: `10.20.${idx + 10}.128`,
        role: g.description || 'Active cluster node',
        status: `ACTIVE - ${g.deviceCount} Systems linked`,
        throughput: '10 Gbps endpoint relay',
        metrics: `Segment severity profile: ${idx % 3 === 0 ? 'CAUTION' : 'NOMINAL'}`
      };
    }
    return null;
  };

  const activeNodeDetails = getSelectedNodeInfo();

  return (
    <div className="cyber-panel min-h-[580px] flex flex-col w-full h-full" id="network-topology-panel">
      {/* 1. Header Division */}
      <div className="cyber-panel-header flex-wrap gap-4 py-3" id="network-topology-header">
        <div className="flex items-center gap-2">
          <Network className="text-cyber-blue w-4 h-4" />
          <span className="font-extrabold tracking-wider">TOPOLOGICAL_ANALYZER_MATRIX</span>
        </div>
        
        {/* Topology Selector Buttons */}
        <div className="flex bg-black/45 border border-cyber-border rounded-sm p-0.5 pointer-events-auto">
          {(['STAR', 'MESH', 'BRANCH'] as TopologyType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleTopologyChange(type)}
              className={`px-3 py-1 text-[9px] font-extrabold tracking-widest uppercase rounded-sm transition-all duration-300 ${
                topology === type
                  ? 'bg-cyber-blue text-black shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                  : 'text-cyber-text-muted hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Outer wrapper dividing map canvas and analytical sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-cyber-border/40 bg-black/25">
        
        {/* Left Interactive Canvas Area (75% width on lg) */}
        {/* Note: This is the critical selector 2 targeting 'div:nth-of-type(2)' of NetworkTopology */}
        <div 
          ref={containerRef}
          className="lg:col-span-3 min-h-[460px] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-black/60 to-slate-950/40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.01) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.01) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        >
          {/* Cybernetic Targeting Screen brackets */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-cyber-blue/30" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-cyber-blue/30" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-cyber-blue/30" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-cyber-blue/30" />

          {/* 3. Radar Background Circle (CRITICAL: First element inside the Canvas container, matches user CSS focus selector 2) */}
          <div className="absolute w-[440px] h-[440px] border border-cyber-blue/20 rounded-full animate-[spin_50s_linear_infinite] flex items-center justify-center opacity-30 pointer-events-none">
            <div className="absolute w-[425px] h-[425px] border border-dashed border-cyber-blue/10 rounded-full" />
            <div className="absolute w-[290px] h-[290px] border border-cyber-blue/10 rounded-full" />
            <div className="absolute w-[150px] h-[150px] border border-cyber-blue/5 rounded-full" />
            <div className="absolute w-[2px] h-[440px] bg-cyber-blue/[0.03]" />
            <div className="absolute h-[2px] w-[440px] bg-cyber-blue/[0.03]" />
          </div>

          {/* SVG Overlay for Connection Lines & Interactive packets */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Draw connections with motion coordinates to slide smooth */}
            <AnimatePresence>
              {connections.map((conn, idx) => {
                const fromNode = getNodePosById(conn.from);
                const toNode = getNodePosById(conn.to);
                
                // Real coordinate mapping inside canvas
                const x1 = cx + fromNode.x;
                const y1 = cy + fromNode.y;
                const x2 = cx + toNode.x;
                const y2 = cy + toNode.y;

                return (
                  <g key={`${conn.from}-${conn.to}-${idx}`}>
                    {/* Shadow Back-Glow line */}
                    {conn.active && (
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#00f0ff"
                        strokeWidth={3}
                        className="opacity-40 filter blur-sm"
                      />
                    )}
                    
                    {/* Main topological link line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={conn.active ? '#00f0ff' : '#1e293b'}
                      strokeWidth={conn.active ? 1.5 : 1}
                      strokeDasharray={topology === 'MESH' ? '3,4' : 'none'}
                      className="transition-all duration-300 opacity-60"
                    />

                    {/* Simulating active vector transmission packets on links */}
                    {(idx % 3 === 0 || conn.active) && (
                      <motion.circle
                        r={conn.active ? 2.5 : 1.5}
                        fill={conn.active ? '#00f0ff' : '#38bdf8'}
                        filter={conn.active ? 'drop-shadow(0 0 4px #00f0ff)' : 'none'}
                        animate={{
                          cx: [x1, x2],
                          cy: [y1, y2],
                        }}
                        transition={{
                          duration: conn.active ? 1.8 : 3.5 + (idx % 4) * 0.8,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </AnimatePresence>
          </svg>

          {/* Core Switch Node */}
          <div
            style={{
              position: 'absolute',
              left: `calc(50% + ${topology === 'BRANCH' ? 0 : 0}px - 40px)`,
              top: `calc(50% + ${topology === 'BRANCH' ? -150 : 0}px - 40px)`,
            }}
            onClick={() => handleNodeClick('core', 'CORE SWITCH')}
            className={`w-20 h-20 border-2 rounded-sm flex flex-col items-center justify-center p-1 z-10 bg-slate-950 transition-all duration-500 cursor-pointer shadow-lg select-none ${
              selectedNodeId === 'core'
                ? 'border-cyber-blue bg-slate-900 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-105'
                : 'border-cyber-blue/50 hover:border-cyber-blue shadow-[0_0_8px_rgba(0,0,0,0.6)]'
            }`}
          >
            <Cpu className={`w-5 h-5 mb-1 ${selectedNodeId === 'core' ? 'text-cyber-blue animate-pulse' : 'text-cyber-blue/80'}`} />
            <span className="text-[9px] font-extrabold text-white uppercase tracking-tighter leading-none text-center">CORE MATRIX</span>
            <span className="text-[7px] font-mono text-cyber-blue uppercase font-bold tracking-widest mt-0.5">GATEWAY</span>
          </div>

          {/* SECONDARY BRANCH HUBS (Rendered in Branch Topology only) */}
          <AnimatePresence>
            {topology === 'BRANCH' &&
              BRANCH_HUBS.map((hub) => (
                <motion.div
                  key={hub.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleNodeClick(hub.id, hub.name)}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${hub.x}px - 32px)`,
                    top: `calc(50% + ${hub.y}px - 32px)`,
                  }}
                  className={`w-16 h-16 border rounded-sm flex flex-col items-center justify-center p-1 z-10 bg-slate-950 hover:scale-105 transition-all cursor-pointer shadow-md select-none ${
                    selectedNodeId === hub.id
                      ? 'border-cyber-yellow bg-slate-900 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105'
                      : 'border-cyber-yellow/40 hover:border-cyber-yellow'
                  }`}
                >
                  <Radio className={`w-4 h-4 mb-0.5 ${hub.status === 'active' ? 'text-cyber-yellow animate-pulse' : 'text-cyber-yellow/70'}`} />
                  <span className="text-[7px] font-extrabold font-mono text-white tracking-tighter leading-none text-center uppercase">{hub.name.split(' ')[0]} HUB</span>
                  <span className="text-[6px] text-cyber-yellow uppercase font-bold tracking-wide mt-0.5">{hub.zone}</span>
                </motion.div>
              ))}
          </AnimatePresence>

          {/* PRIMARY CLUSTER ENDPOINT NODES */}
          {visualGroups.map((group, i) => {
            const coords = getNodeCoordinates(i);
            const isSelected = selectedNodeId === group.id;
            
            // Stagger styling
            const colorClass = (i % 3 === 0 
              ? (isSelected ? "border-cyber-red shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "border-cyber-red/30 hover:border-cyber-red text-cyber-red") 
              : (isSelected ? "border-cyber-green shadow-[0_0_10px_rgba(74,222,128,0.4)]" : "border-cyber-green/30 hover:border-cyber-green text-cyber-green")
            );

            return (
              <motion.div
                key={group.id}
                layoutId={`topology-node-${group.id}`}
                transition={{ type: 'spring', damping: 20, stiffness: 85 }}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${coords.x}px - 28px)`,
                  top: `calc(50% + ${coords.y}px - 28px)`,
                }}
                className="z-10 flex flex-col items-center"
              >
                <div 
                  onClick={() => handleNodeClick(group.id, group.name)}
                  className={`w-14 h-14 rounded-full border bg-slate-950/90 flex flex-col items-center justify-center text-center p-1 cursor-pointer transition-all duration-300 hover:scale-110 select-none ${colorClass}`}
                >
                  <span className="text-[8px] font-black uppercase text-white truncate w-full tracking-tighter leading-none">
                    {group.name.split('-')[1] || group.name.split(' ')[0]}
                  </span>
                  <span className="text-[7px] font-mono mt-0.5 font-bold uppercase tracking-tight opacity-75">
                    {group.deviceCount} UNITs
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Floating UI Badges within Canvas Removed */}
          
          <div className="absolute bottom-4 left-4 flex gap-4 text-[9px] font-extrabold tracking-wider bg-black/60 border border-cyber-border/80 px-3 py-1.5 rounded-sm select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyber-green" />
              <span className="text-cyber-green uppercase leading-none">SECURE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyber-yellow" />
              <span className="text-cyber-yellow uppercase leading-none">ROUTED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
              <span className="text-cyber-red uppercase leading-none">CAUTION</span>
            </div>
          </div>
        </div>

        {/* Right Topology Study & Metrics Inspection Sidebar (25% width on lg) */}
        <div className="lg:col-span-1 p-5 flex flex-col gap-4 bg-slate-950/60 max-h-[580px] overflow-y-auto custom-scrollbar border-t lg:border-t-0 border-cyber-border/40">
          
          {/* Active Topology Details */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-cyber-blue uppercase tracking-wider mb-2">
              <Info className="w-3.5 h-3.5" />
              <span>TOPOLOGY TYPE STUDY</span>
            </div>
            <div className="bg-black/40 border border-cyber-border rounded-sm p-3">
              <h4 className="text-[11px] font-extrabold text-white tracking-wide uppercase">{topologyMetrics[topology].name}</h4>
              <p className="text-[10px] text-cyber-text-muted mt-1.5 leading-relaxed italic border-l-2 border-cyber-blue/30 pl-2">
                "{topologyMetrics[topology].notes}"
              </p>
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-[9px] font-bold font-mono">
                <div className="bg-slate-900/60 border border-white/5 p-1.5 rounded-sm">
                  <span className="block text-cyber-text-muted uppercase text-[7px] tracking-wider mb-0.5">RESILIENCE</span>
                  <span className="text-[9px] text-white uppercase truncate">{topology === 'MESH' ? 'HIGH_ERR_TOL' : topology === 'BRANCH' ? 'SEGMENT' : 'SINGLE_FAIL'}</span>
                </div>
                <div className="bg-slate-900/60 border border-white/5 p-1.5 rounded-sm">
                  <span className="block text-cyber-text-muted uppercase text-[7px] tracking-wider mb-0.5">EST. HOPS</span>
                  <span className="text-[9px] text-cyber-blue">{topologyMetrics[topology].hops}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Focal Subject Unit Inspection HUD */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-cyber-yellow uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>FOCAL INSPECTOR</span>
            </div>
            
            {activeNodeDetails ? (
              <div className="bg-slate-900/80 border border-cyber-blue/30 rounded-sm p-3.5 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-tight break-all leading-tight">{activeNodeDetails.name}</h4>
                  <span className="text-[8px] px-1 py-0.5 bg-cyber-blue/10 text-cyber-blue font-bold rounded-sm border border-cyber-blue/20">SELECTED</span>
                </div>
                
                <div className="space-y-1.5 text-[10px] text-cyber-text-muted font-mono leading-tight">
                  <div>
                    <span className="text-[8px] font-extrabold text-white/50 block">ADDRESS VALUE:</span>
                    <span className="text-white text-[10px]">{activeNodeDetails.ip}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-white/50 block">FUNCTIONAL PROFILE:</span>
                    <span className="text-[10px]">{activeNodeDetails.role}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-white/50 block">VIRTUAL BANDWIDTH:</span>
                    <span className="text-[10px] text-cyber-blue">{activeNodeDetails.throughput}</span>
                  </div>
                  <div className="border-t border-cyber-border/40 pt-1.5 mt-1.5">
                    <span className="text-[8px] font-extrabold text-cyber-yellow block">TELEMETRY STATE:</span>
                    <span className="text-[9px] text-white font-bold">{activeNodeDetails.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black/35 border border-dashed border-cyber-border rounded-sm p-4 text-center">
                <p className="text-[9px] font-bold text-cyber-text-muted uppercase tracking-wider">
                  No active node selected. Click any cluster or gateway core node above to analyze real-time vectors.
                </p>
              </div>
            )}
          </div>



        </div>
      </div>
    </div>
  );
}

