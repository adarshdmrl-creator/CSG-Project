import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Trash2, Filter, Download, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { cn } from '../lib/utils';
import { toast } from 'react-toastify';

const COLORS = ['#38bdf8', '#4ade80', '#f43f5e', '#f59e0b', '#A855F7', '#ec4899', '#06b6d4'];

interface ExcelData {
  headers: string[];
  rows: any[];
}

export default function Analytics() {
  const [data, setData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie'>('bar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (jsonData.length === 0) {
          toast.error("The selected file is empty.");
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];

        setData({ headers, rows });
        setXAxis(headers[0] || '');
        setYAxis(headers[1] || headers[0] || '');
        toast.success("File processed successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse Excel file. Ensure it's a valid .xlsx or .xls file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const clearData = () => {
    setData(null);
    setXAxis('');
    setYAxis('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Prepare data for chart
  const chartData = data?.rows.map(row => ({
    name: row[xAxis],
    value: parseFloat(row[yAxis]) || 0
  })).slice(0, 50) || []; // Limit to 50 for performance and visibility

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-white uppercase glitch-text">DATA_ANALYSIS_ENGINE</h2>
          <p className="text-cyber-text-muted text-[10px] font-mono tracking-widest mt-1">MODULE: EXCEL_VIZ_PRO // STATUS: READY</p>
        </div>
        {data && (
          <button 
            onClick={clearData}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-red/10 border border-cyber-red/50 text-cyber-red text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-cyber-red/20 transition-all"
          >
            <Trash2 size={14} />
            Reset Data
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="cyber-panel p-20 flex flex-col items-center justify-center text-center border-dashed border-2 border-cyber-border/50 bg-cyber-card/30"
          >
            <div className="w-20 h-20 rounded-full bg-cyber-blue/10 flex items-center justify-center mb-6 group hover:bg-cyber-blue/20 transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload size={40} className="text-cyber-blue group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Upload Excel Dataset</h3>
            <p className="text-cyber-text-muted text-sm max-w-md mb-8">
              Import '.xlsx' or '.xls' files to generate real-time visualizations and deep-dive analytics for your network infrastructure.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="cyber-button-primary disabled:opacity-50"
            >
              {loading ? "INITIALIZING_PARSER..." : "SELECT_DATA_SOURCE"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          >
            {/* Controls Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="cyber-panel p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-cyber-border pb-4">
                  <Filter size={16} className="text-cyber-blue" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Viz Configuration</span>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">X-Axis (Category)</label>
                    <select 
                      value={xAxis}
                      onChange={(e) => setXAxis(e.target.value)}
                      className="cyber-input w-full text-xs"
                    >
                      {data.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Y-Axis (Value)</label>
                    <select 
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="cyber-input w-full text-xs"
                    >
                      {data.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">Chart Topology</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'bar', icon: BarChart3, label: 'Bar' },
                        { id: 'line', icon: LineChartIcon, label: 'Line' },
                        { id: 'area', icon: Activity, label: 'Area' },
                        { id: 'pie', icon: PieChartIcon, label: 'Pie' }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setChartType(type.id as any)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-sm border transition-all text-[10px] font-bold uppercase",
                            chartType === type.id 
                              ? "bg-cyber-blue/20 border-cyber-blue text-cyber-blue" 
                              : "bg-white/5 border-cyber-border text-cyber-text-muted hover:border-cyber-blue/50"
                          )}
                        >
                          <type.icon size={12} />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="cyber-panel p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-cyber-green" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Data Summary</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-cyber-text-muted">Total Rows:</span>
                    <span className="text-white font-mono">{data.rows.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-cyber-text-muted">Total Cols:</span>
                    <span className="text-white font-mono">{data.headers.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Visualizer */}
            <div className="lg:col-span-3 space-y-6">
              <div className="cyber-panel p-8 h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-sm font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                     <Activity size={16} className="text-cyber-blue" />
                     Live Dynamic Projection: {yAxis} by {xAxis}
                   </h4>
                   <div className="flex gap-2">
                      <div className="px-2 py-1 bg-cyber-blue/10 rounded-sm border border-cyber-blue/20 text-[9px] text-cyber-blue font-bold uppercase">
                        Realtime Rendering Active
                      </div>
                   </div>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px' }}
                          itemStyle={{ color: '#38bdf8' }}
                        />
                        <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartType === 'line' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                      </LineChart>
                    ) : chartType === 'area' ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                        <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase' }} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table Glance */}
              <div className="cyber-panel overflow-hidden">
                <div className="cyber-panel-header px-6 py-4">
                  <span>DATA_SET_PREVIEW</span>
                  <span className="text-[10px] text-cyber-text-muted">Showing first 10 entries</span>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-cyber-border">
                          {data.headers.slice(0, 6).map(h => (
                            <th key={h} className="px-6 py-3 text-[10px] font-bold text-cyber-text-muted uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b border-cyber-border/30 hover:bg-white/5 transition-colors">
                            {data.headers.slice(0, 6).map(h => (
                              <td key={h} className="px-6 py-3 text-xs text-white/80 font-mono">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
