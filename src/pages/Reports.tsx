import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, PieChart as PieChartIcon, 
  BarChart2, Activity, Check, Search, ShieldAlert,
  Server, Laptop, List, ArrowDown, Eye, FileSpreadsheet,
  Grid, CheckSquare, Square, RefreshCcw
} from 'lucide-react';
import { deviceService } from '../services/api';
import { Device } from '../types';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from 'recharts';

const CHART_COLORS = ['#38bdf8', '#4ade80', '#f43f5e', '#f59e0b', '#a855f7', '#06b6d4'];

export default function Reports() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportMode, setReportMode] = useState<'all' | 'selected'>('all');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [reportTemplate, setReportTemplate] = useState<'audit' | 'traffic' | 'threat'>('audit');
  
  // Columns to include in custom report
  const [selectedColumns, setSelectedColumns] = useState({
    hostname: true,
    ipAddress: true,
    macAddress: true,
    os: true,
    status: true,
    groupName: true,
    connectionType: true,
    processor: false,
    ram: false,
    storage: false,
  });

  // Preview / Visualizer Modal State
  const [previewData, setPreviewData] = useState<{
    visible: boolean;
    title: string;
    description: string;
    devices: Device[];
  } | null>(null);

  // Available Archives Static Data
  const [archives, setArchives] = useState([
    { title: 'Weekly Security Audit', date: '2024-05-18', type: 'PDF', size: '2.4 MB' },
    { title: 'Network Resource Utilization', date: '2024-05-15', type: 'XLSX', size: '1.1 MB' },
    { title: 'Threat Intelligence Monthly', date: '2024-05-01', type: 'PDF', size: '5.8 MB' },
    { title: 'Compliance Checkup - Q2', date: '2024-04-28', type: 'DOCX', size: '0.9 MB' },
    { title: 'Shadow IT Discovery Report', date: '2024-04-20', type: 'PDF', size: '3.2 MB' },
  ]);

  useEffect(() => {
    async function loadDevices() {
      try {
        const d = await deviceService.getDevices();
        setDevices(d);
        // Initially select all devices
        setSelectedDeviceIds(new Set(d.map(item => item.id)));
      } catch (err) {
        console.error(err);
        toast.error("Failed to sync database node specifications.");
      } finally {
        setLoading(false);
      }
    }
    loadDevices();
  }, []);

  // Filtered devices list for selection grid
  const filteredSelectionDevices = devices.filter(d => 
    d.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ipAddress.includes(searchQuery) ||
    d.os.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActiveSelection = (): Device[] => {
    if (reportMode === 'all') return devices;
    return devices.filter(d => selectedDeviceIds.has(d.id));
  };

  const toggleSelectDevice = (id: string) => {
    const updated = new Set(selectedDeviceIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedDeviceIds(updated);
  };

  const toggleSelectAll = () => {
    if (selectedDeviceIds.size === devices.length) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(devices.map(d => d.id)));
    }
  };

  const toggleColumn = (col: keyof typeof selectedColumns) => {
    setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Archive Downloader
  const handleDownloadArchive = (archive: typeof archives[0]) => {
    if (archive.type === 'XLSX') {
      const data = [
        ["Report Title", archive.title],
        ["Status Code", "ARCHIVED_SECURE_HASHED"],
        ["Publication Date", archive.date],
        ["Archive Footprint Size", archive.size],
        [],
        ["Registry Node Hostname", "Default Address", "Security Tier", "Risk Metrics"],
        ["CSG-WS-1002", "10.20.0.12", "Level 4 Sec", "0 Alerts"],
        ["CSG-WS-1005", "10.20.1.34", "Level 3 General", "1 Dynamic Watch Alert"],
        ["CSG-WS-1009", "10.20.2.221", "System Core Secure", "Enforced Core Guard"]
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Archive Records");
      XLSX.writeFile(wb, `${archive.title.toLowerCase().replace(/\s+/g, '_')}_archive.xlsx`);
      toast.success(`Success: HIVE spreadsheet registry generated and downloaded: ${archive.title}`);
    } else {
      // PDF/DOCX simulated report download
      const content = `==========================================================
              CENTRAL SECURITY SYSTEM ARCHIVED DEFENSE SUMMARY
==========================================================
ARCHIVE NAME   : ${archive.title}
RECORD DATE   : ${archive.date}
SIGNATURE HASH: SHA256-${Math.random().toString(16).substring(2, 10).toUpperCase()}
FILE SIZE      : ${archive.size}
VERIFIED BY    : CSG SECTOR INTEGRITY BLOCK
==========================================================

SUMMARY DIGEST:
- Global firewall policies synchronized correctly.
- Detected offline endpoints are quarantine-verified.
- All outbound routing maps marked compliant.

AUDITING PARAMETERS:
- LAN Systems Audited: 28 Nodes
- Rogue Gateway Attempts: 0 Detected
- Active Threats Neutralized: 4 Incident Blocks

[END OF AUTOMATED REPORT SYSTEM]`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${archive.title.toLowerCase().replace(/\s+/g, '_')}_archive.${archive.type.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded simulated ${archive.type} artifact: ${archive.title}`);
    }
  };

  // Compile active report data list
  const compileReportData = (targetDevices: Device[]) => {
    return targetDevices.map(d => {
      const row: any = {};
      if (selectedColumns.hostname) row["Hostname"] = d.hostname;
      if (selectedColumns.ipAddress) row["IP Address"] = d.ipAddress;
      if (selectedColumns.macAddress) row["MAC Address"] = d.macAddress;
      if (selectedColumns.os) row["Operating System"] = d.os;
      if (selectedColumns.status) row["Status"] = d.status.toUpperCase();
      if (selectedColumns.groupName) row["Cluster Group"] = d.groupName;
      if (selectedColumns.connectionType) row["Network Profile"] = d.connectionType;
      if (selectedColumns.processor) row["Processor Unit"] = d.processor;
      if (selectedColumns.ram) row["Memory Allocation"] = d.ram;
      if (selectedColumns.storage) row["Solid State Memory"] = d.storage;
      return row;
    });
  };

  // Download Report
  const handleDownloadCustomReport = (templateType: 'audit' | 'traffic' | 'threat') => {
    const list = getActiveSelection();
    if (list.length === 0) {
      toast.error("No systems selected to generate reports.");
      return;
    }

    const reportRows = compileReportData(list);
    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();

    let sheetName = "Network Inventory";
    let fileName = "all_systems_report.xlsx";
    if (templateType === 'traffic') {
      sheetName = "Traffic Analysis";
      fileName = "network_traffic_report.xlsx";
    } else if (templateType === 'threat') {
      sheetName = "Threat Assessments";
      fileName = "threat_matrix_report.xlsx";
    }

    if (reportMode === 'selected') {
      fileName = "selected_systems_" + fileName;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    toast.success(`Report compiled successfully! Downloaded: ${fileName}`);
  };

  // View Report
  const handleViewCustomReport = (templateType: 'audit' | 'traffic' | 'threat') => {
    const list = getActiveSelection();
    if (list.length === 0) {
      toast.error("No database network nodes selected to preview reports.");
      return;
    }

    let title = "Systems Spec Audit Overview";
    let description = "Direct inspection of infrastructure specs, status logs, and physical rack placements.";
    if (templateType === 'traffic') {
      title = "Traffic Pipeline & Node Link Profiling";
      description = "Profiling outbound access structures, hardware segmentation, and device profile maps.";
    } else if (templateType === 'threat') {
      title = "Terminal Threat & System Enclosure Matrix";
      description = "Analysis of quarantine locks, status discrepancies, and system vulnerabilities.";
    }

    setPreviewData({
      visible: true,
      title,
      description,
      devices: list
    });
    toast.info(`Generated live preview of system registry.`);
  };

  // Analytical View helper state counts
  const getHelperSpecs = (targetList: Device[]) => {
    const online = targetList.filter(d => d.status === 'online').length;
    const offline = targetList.length - online;
    const locked = targetList.filter(d => d.isLocked).length;
    
    // Group distribution
    const groupMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};
    const connMap: Record<string, number> = {};

    targetList.forEach(d => {
      groupMap[d.groupName] = (groupMap[d.groupName] || 0) + 1;
      osMap[d.os] = (osMap[d.os] || 0) + 1;
      connMap[d.connectionType] = (connMap[d.connectionType] || 0) + 1;
    });

    const groupData = Object.entries(groupMap).map(([name, count]) => ({ name, count }));
    const osData = Object.entries(osMap).map(([name, count]) => ({ name, count }));
    const connData = Object.entries(connMap).map(([name, count]) => ({ name, count }));

    return {
      online,
      offline,
      locked,
      groupData,
      osData,
      connData
    };
  };

  const specs = getHelperSpecs(devices);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tighter text-white uppercase glitch-text">Network Analytics & Reports</h2>
        <p className="text-cyber-text-muted text-xs font-mono uppercase tracking-widest mt-1">CSG Central Cyber Defense System Reporting Hub</p>
      </div>

      {/* Division Buttons (Now fully interactive and functional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => {
            setReportTemplate('audit');
            handleViewCustomReport('audit');
          }}
          className="cyber-panel flex items-center gap-4 p-5 group cursor-pointer hover:border-cyber-blue hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all bg-cyber-card/50"
        >
          <div className="p-3 bg-cyber-blue/10 rounded-lg text-cyber-blue group-hover:scale-110 transition-transform">
            <PieChartIcon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm group-hover:text-cyber-blue transition-colors">Visual Summary</h4>
              <Eye size={12} className="text-cyber-blue opacity-50 group-hover:opacity-100" />
            </div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">Asset Spec Metrics</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">View operating systems distribution and status charts.</p>
          </div>
        </div>

        <div 
          onClick={() => {
            setReportTemplate('traffic');
            handleViewCustomReport('traffic');
          }}
          className="cyber-panel flex items-center gap-4 p-5 group cursor-pointer hover:border-cyber-green hover:shadow-[0_0_15px_rgba(74,222,128,0.15)] transition-all bg-cyber-card/50"
        >
          <div className="p-3 bg-cyber-green/10 rounded-lg text-cyber-green group-hover:scale-110 transition-transform">
            <Activity size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm group-hover:text-cyber-green transition-colors">Traffic Analysis</h4>
              <Eye size={12} className="text-cyber-green opacity-50 group-hover:opacity-100" />
            </div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">Segment Projections</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">Inspect connection types, standalone and local hubs.</p>
          </div>
        </div>

        <div 
          onClick={() => {
            setReportTemplate('threat');
            handleViewCustomReport('threat');
          }}
          className="cyber-panel flex items-center gap-4 p-5 group cursor-pointer hover:border-cyber-red hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all bg-cyber-card/50"
        >
          <div className="p-3 bg-cyber-red/10 rounded-lg text-cyber-red group-hover:scale-110 transition-transform">
            <BarChart2 size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm group-hover:text-cyber-red transition-colors">Threat Matrix</h4>
              <Eye size={12} className="text-cyber-red opacity-50 group-hover:opacity-100" />
            </div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">Vulnerability Audit</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">Review locked cluster nodes and compromised assets.</p>
          </div>
        </div>
      </div>

      {/* Main Dynamic Report Builder (Includes selection choices and download/view options) */}
      <div className="cyber-panel p-6">
        <div className="border-b border-cyber-border pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-cyber-blue" size={20} />
            <h3 className="text-sm font-bold text-white font-mono tracking-widest uppercase">Custom System Report Engine</h3>
          </div>
          
          <div className="flex items-center gap-2 bg-cyber-bg border border-cyber-border rounded px-1 py-1">
            <button
              onClick={() => setReportMode('all')}
              className={cn(
                "px-3 py-1 text-[10px] uppercase font-mono font-bold rounded-sm transition-all",
                reportMode === 'all' 
                  ? "bg-cyber-blue text-black" 
                  : "text-cyber-text-muted hover:text-white"
              )}
            >
              All Systems ({devices.length})
            </button>
            <button
              onClick={() => setReportMode('selected')}
              className={cn(
                "px-3 py-1 text-[10px] uppercase font-mono font-bold rounded-sm transition-all",
                reportMode === 'selected' 
                  ? "bg-cyber-blue text-black" 
                  : "text-cyber-text-muted hover:text-white"
              )}
            >
              Selected Systems ({selectedDeviceIds.size})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings / Checklist Choices */}
          <div className="lg:col-span-1 space-y-6">
            {/* Columns and Template Parameters */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-cyber-blue uppercase font-mono tracking-wider mb-2">1. Choose Report Template</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'audit', title: 'Asset Specifications Audit', desc: 'Standard details of local hardware components and os.' },
                  { id: 'traffic', title: 'Segment and Network Profile', desc: 'Connectivity parameters and gateway profiles.' },
                  { id: 'threat', title: 'Security Clearance Diagnostic', desc: 'Vulnerability risks, lock status, and active alerts.' }
                ].map(item => (
                  <label 
                    key={item.id}
                    onClick={() => setReportTemplate(item.id as any)}
                    className={cn(
                      "flex flex-col p-3 border rounded-sm cursor-pointer transition-all bg-white/5",
                      reportTemplate === item.id 
                        ? "border-cyber-blue bg-cyber-blue/5" 
                        : "border-cyber-border hover:border-cyber-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{item.title}</span>
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all",
                        reportTemplate === item.id ? "border-cyber-blue bg-cyber-blue text-black" : "border-cyber-border"
                      )}>
                        {reportTemplate === item.id && <Check size={10} />}
                      </div>
                    </div>
                    <span className="text-[10px] text-cyber-text-muted mt-1 leading-snug">{item.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-cyber-blue uppercase font-mono tracking-wider mb-2">2. Selective Report Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedColumns).map(([key, enabled]) => (
                  <button
                    key={key}
                    onClick={() => toggleColumn(key as any)}
                    className={cn(
                      "flex items-center gap-2 p-2 border text-left rounded-sm transition-all text-[10px] font-mono",
                      enabled 
                        ? "bg-cyber-blue/15 border-cyber-blue text-cyber-blue" 
                        : "bg-white/5 border-cyber-border text-cyber-text-muted hover:border-cyber-blue/50"
                    )}
                  >
                    {enabled ? <CheckSquare size={13} /> : <Square size={13} />}
                    <span className="uppercase tracking-tight leading-none">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* View and Download Triggers */}
            <div className="space-y-2 pt-4 border-t border-cyber-border">
              <button 
                onClick={() => handleViewCustomReport(reportTemplate)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-cyber-blue/30 hover:border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10 transition-all rounded-sm text-xs font-bold uppercase tracking-widest font-mono"
              >
                <Eye size={14} />
                Preview & Render report
              </button>
              
              <button 
                onClick={() => handleDownloadCustomReport(reportTemplate)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyber-blue text-black hover:bg-cyber-blue/80 transition-all rounded-sm text-xs font-bold uppercase tracking-widest font-mono shadow-[0_0_15px_rgba(56,189,248,0.2)]"
              >
                <Download size={14} />
                Download Spreadsheet (.xlsx)
              </button>
            </div>
          </div>

          {/* Interactive Selection Interface */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <h4 className="text-xs font-bold text-cyber-blue uppercase font-mono tracking-wider flex justify-between items-center">
              <span>3. Active Systems Registry</span>
              {reportMode === 'selected' && (
                <button 
                  onClick={toggleSelectAll}
                  className="text-[10px] text-cyber-blue/80 hover:text-cyber-blue font-mono uppercase bg-white/5 px-2 py-1 rounded border border-cyber-border"
                >
                  {selectedDeviceIds.size === devices.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </h4>

            {reportMode === 'all' ? (
              <div className="cyber-panel p-5 bg-white/5 border-dashed border-cyber-border flex flex-col items-center justify-center text-center flex-1 h-[250px] min-h-[250px]">
                <Server size={32} className="text-cyber-blue/40 animate-pulse mb-3" />
                <h5 className="font-bold text-white text-sm uppercase">"ALL SYSTEMS" SELECTION MODE IS ACTIVE</h5>
                <p className="text-xs text-cyber-text-muted mt-1 max-w-sm">
                  Reporting engine is configured to retrieve and include specifications for all {devices.length} network nodes on execution.
                </p>
                <button
                  onClick={() => setReportMode('selected')}
                  className="mt-4 px-3 py-1.5 bg-cyber-blue/10 border border-cyber-blue text-cyber-blue rounded hover:bg-cyber-blue text-xs font-bold font-mono uppercase"
                >
                  Deploy Manual Selection Mode
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 border border-cyber-border bg-cyber-bg p-4 rounded-sm">
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search hostname, IP, OS to mark systems..."
                    className="cyber-input w-full pl-8 py-1.5 text-xs font-mono"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="overflow-y-auto max-h-[300px] custom-scrollbar space-y-1 pr-1">
                  {loading ? (
                    <div className="text-center py-8 font-mono text-xs text-cyber-blue animate-pulse">
                      RETRIEVING NETWORK DIRECTORY CLUSTERS...
                    </div>
                  ) : filteredSelectionDevices.length === 0 ? (
                    <div className="text-center py-8 text-cyber-text-muted font-mono text-xs">
                      No matching systems found.
                    </div>
                  ) : (
                    filteredSelectionDevices.map(d => {
                      const isSelected = selectedDeviceIds.has(d.id);
                      return (
                        <div 
                          key={d.id}
                          onClick={() => toggleSelectDevice(d.id)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-sm border cursor-pointer hover:bg-white/5 transition-all",
                            isSelected ? "border-cyber-blue/60 bg-cyber-blue/5" : "border-cyber-border/40 bg-cyber-card/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-all",
                              isSelected ? "border-cyber-blue bg-cyber-blue text-black" : "border-cyber-border bg-transparent"
                            )}>
                              {isSelected && <Check size={11} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-white leading-none">{d.hostname}</span>
                                <span className={cn(
                                  "text-[9px] px-1 font-mono leading-none border",
                                  d.status === 'online' ? "text-cyber-green border-cyber-green/30 bg-cyber-green/5" : "text-gray-500 border-cyber-border"
                                )}>
                                  {d.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-cyber-text-muted mt-1">
                                IP: {d.ipAddress} // GROUP: {d.groupName}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">{d.os}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Archives Collection (With fully interactive downloads) */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-cyber-blue" />
            <span>AVAILABLE_REPORTS_ARCHIVE_REGISTRY</span>
          </div>
          <span className="text-[9px] font-mono text-cyber-text-muted uppercase">Signature Verified</span>
        </div>
        
        <div className="p-4 space-y-1">
          {archives.map((archive, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-lg border border-transparent hover:border-cyber-border transition-all group">
              <div className="flex items-center gap-4">
                <FileText className="text-gray-500 group-hover:text-cyber-blue" size={20} />
                <div>
                  <h5 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{archive.title}</h5>
                  <p className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter mt-0.5">
                    GEN_DATE: {archive.date} // SIZE: {archive.size} // FORMAT: {archive.type}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDownloadArchive(archive)}
                className="text-cyber-blue bg-cyber-blue/5 border border-cyber-blue/20 hover:border-cyber-blue hover:bg-cyber-blue/15 px-3 py-1.5 transition-all flex items-center gap-2 text-[10px] font-bold font-mono rounded"
              >
                DOWNLOAD
                <Download size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview / Render Report Section (Framer Motion slide up) */}
      <AnimatePresence>
        {previewData?.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="cyber-panel p-6 border-cyber-blue bg-cyber-card/90 backdrop-blur"
          >
            <div className="flex justify-between items-start border-b border-cyber-border pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-cyber-blue animate-pulse" />
                  <h4 className="text-sm font-bold text-white uppercase font-mono tracking-widest">{previewData.title}</h4>
                </div>
                <p className="text-xs text-cyber-text-muted mt-0.5">{previewData.description}</p>
              </div>
              <button 
                onClick={() => setPreviewData(null)}
                className="text-xs font-mono font-bold text-cyber-red/80 hover:text-cyber-red border border-cyber-red/20 hover:border-cyber-red bg-cyber-red/5 px-2.5 py-1.5 transition-all rounded uppercase"
              >
                Close Preview
              </button>
            </div>

            {/* Generated Metrics Grid Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Report Tally Card */}
              <div className="cyber-panel p-5 bg-cyber-bg flex flex-col justify-between h-[180px]">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-cyber-text-muted">
                  <span>METRICS SUMMARY</span>
                  <Server size={14} className="text-cyber-blue" />
                </div>
                <div className="my-auto">
                  <div className="text-3xl font-extrabold font-mono text-white leading-none">
                    {previewData.devices.length}
                  </div>
                  <p className="text-[10px] text-cyber-text-muted tracking-wide mt-1 uppercase font-mono">REGISTRY SYSTEMS LOADED</p>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-3 border-t border-cyber-border/40 text-center">
                  <div>
                    <div className="text-xs font-bold font-mono text-cyber-green">
                      {previewData.devices.filter(d => d.status === 'online').length}
                    </div>
                    <p className="text-[8px] font-mono uppercase text-gray-500">Online</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-cyber-yellow">
                      {previewData.devices.filter(d => d.isLocked).length}
                    </div>
                    <p className="text-[8px] font-mono uppercase text-gray-500">Locked</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-cyber-red">
                      {previewData.devices.filter(d => d.status === 'offline').length}
                    </div>
                    <p className="text-[8px] font-mono uppercase text-gray-500">Offline</p>
                  </div>
                </div>
              </div>

              {/* Chart A: OS Distribution */}
              <div className="cyber-panel p-5 bg-cyber-bg h-[180px] flex flex-col">
                <span className="text-[10px] font-mono uppercase text-cyber-text-muted mb-2 tracking-wide">OPERATING_SYSTEM_FOOTPRINT</span>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getHelperSpecs(previewData.devices).osData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={8} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '9px' }} />
                      <Bar dataKey="count" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B: Profile / Network Distribution */}
              <div className="cyber-panel p-5 bg-cyber-bg h-[180px] flex flex-col">
                <span className="text-[10px] font-mono uppercase text-cyber-text-muted mb-2 tracking-wide">CONNECTIVITY_MAP</span>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getHelperSpecs(previewData.devices).connData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {getHelperSpecs(previewData.devices).connData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Simulated Printed Rendered Row Sheet Table */}
            <div className="cyber-panel overflow-hidden">
              <div className="cyber-panel-header py-3">
                <span className="font-mono">COMPILED_REGISTRY_LOGS</span>
                <span className="text-[9px] font-mono bg-cyber-blue/10 border border-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded uppercase leading-none">Draft Render Mode</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-cyber-border">
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase text-cyber-text-muted tracking-widest font-bold">NODE_NAME</th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase text-cyber-text-muted tracking-widest font-bold">IP_ADDR</th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase text-cyber-text-muted tracking-widest font-bold">NET_GROUP</th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase text-cyber-text-muted tracking-widest font-bold">SYSTEM_OS</th>
                      <th className="px-5 py-2.5 text-[10px] font-mono uppercase text-cyber-text-muted tracking-widest font-bold">SEC_STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.devices.slice(0, 10).map((d, index) => (
                      <tr key={index} className="border-b border-cyber-border/30 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-2.5 text-xs text-white font-mono font-bold">{d.hostname}</td>
                        <td className="px-5 py-2.5 text-xs text-cyber-text-muted font-mono">{d.ipAddress}</td>
                        <td className="px-5 py-2.5 text-xs text-cyber-text-muted font-mono font-semibold">{d.groupName}</td>
                        <td className="px-5 py-2.5 text-xs text-gray-400 font-mono">{d.os}</td>
                        <td className="px-5 py-2.5 text-xs">
                          <span className={cn(
                            "status-tag text-[9px] px-2 py-0.5 rounded border font-mono font-bold leading-none uppercase",
                            d.isLocked 
                              ? "text-cyber-red border-cyber-red/30 bg-cyber-red/5" 
                              : d.status === 'online'
                              ? "text-cyber-green border-cyber-green/30 bg-cyber-green/5"
                              : "text-gray-500 border-cyber-border bg-white/5"
                          )}>
                            {d.isLocked ? "QUARANTINE" : d.status === 'online' ? "ACTIVE_OK" : "STANDBY"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.devices.length > 10 && (
                <div className="p-3 bg-cyber-bg border-t border-cyber-border text-center text-[10px] text-cyber-text-muted font-mono">
                  + {previewData.devices.length - 10} additional systems not rendered in preview mode limit.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 bg-transparent text-sm font-mono text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
              >
                Close Preview
              </button>
              <button 
                onClick={() => handleDownloadCustomReport(reportTemplate)}
                className="px-5 py-2 bg-cyber-blue text-black font-mono font-bold uppercase hover:bg-cyber-blue/80 transition-all rounded text-xs tracking-widest flex items-center gap-2"
              >
                <Download size={14} />
                Export Generated Excel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
