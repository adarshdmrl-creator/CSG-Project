import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Monitor, Layers, Bell, FileText, Settings, LogOut, ShieldAlert, Search, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// Premium transparent animated vector cyber logo (perfectly fitting AI / Cyber security & computer department aesthetic)
const AnimatedCyberLogo = () => {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center overflow-visible select-none">
      <svg className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Animated Cyber Shield Outer Perimeter */}
        <motion.path
          d="M 50 10 L 85 28 L 85 64 L 50 90 L 15 64 L 15 28 Z"
          stroke="#00f0ff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.1 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            stroke: ["#00f0ff", "#3b82f6", "#10b981", "#00f0ff"],
            opacity: [0.3, 1, 0.8, 0.3]
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Dynamic Glowing Internal Orbit Grid */}
        <motion.circle
          cx="50"
          cy="50"
          r="18"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="6, 12"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
        />

        {/* Outer security perimeter accent */}
        <motion.path
          d="M 50 13 L 81 30 L 81 61 L 50 86 L 19 61 L 19 30 Z"
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="3, 3"
          opacity="0.4"
        />

        {/* Radial AI Laser Core / Processor node */}
        <motion.circle
          cx="50"
          cy="50"
          r="7"
          fill="#00f0ff"
          animate={{
            scale: [0.85, 1.25, 0.85],
            opacity: [0.7, 1, 0.7],
            fill: ["#00f0ff", "#10b981", "#6366f1", "#00f0ff"]
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Expanding threat-defense sonar pulses */}
        <motion.circle
          cx="50"
          cy="50"
          r="26"
          stroke="#00f0ff"
          strokeWidth="1.5"
          initial={{ scale: 0.65, opacity: 0.7 }}
          animate={{
            scale: [0.65, 1.35],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            repeat: Infinity,
          }}
        />

        {/* Computing & Motherboard connection branches */}
        <path
          d="M 50 10 L 50 22 M 85 28 L 73 35 M 85 64 L 73 57 M 50 90 L 50 78 M 15 64 L 27 57 M 15 28 L 27 35"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* Spark defense node firing around circuit paths */}
        <motion.circle
          cx="50"
          cy="10"
          r="2.5"
          fill="#ffffff"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity
          }}
        />
      </svg>
    </div>
  );
};

interface LayoutProps {
  user: any;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Devices', path: '/devices', icon: Monitor },
    { name: 'Groups', path: '/groups', icon: Layers },
    { name: 'Analytics', path: '/analytics', icon: Activity },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ] as any[];

  const isViewer = user?.role === 'viewer';
  const navItems = isViewer
    ? allNavItems.filter(item => item.name === 'Dashboard' || item.name === 'Reports')
    : allNavItems;

  return (
    <div className="flex h-screen bg-cyber-bg overflow-hidden relative">
      <div className="scanline"></div>
      
      {/* Sidebar */}
      <aside className="w-[220px] bg-cyber-card border-r border-cyber-border flex flex-col z-20">
        <div className="p-4 border-b border-cyber-border/30 bg-black/10 flex items-center gap-3 select-none">
          <AnimatedCyberLogo />
          <div>
            <h1 className="font-extrabold text-[13px] tracking-tight leading-none text-white">CSG NETWORK</h1>
            <p className="text-[9px] text-cyber-blue font-bold tracking-tight uppercase mt-1 opacity-80">Central Defense v2.4</p>
            <div className="mt-1.5 flex">
              <span className={cn(
                "text-[8px] font-mono px-1.5 py-0.5 rounded-[2px] font-bold tracking-wider border leading-none uppercase",
                isViewer 
                  ? "text-amber-500 border-amber-500/30 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.1)]" 
                  : "text-cyber-green border-cyber-green/30 bg-cyber-green/10 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
              )}>
                {isViewer ? "Viewer Mode" : "Admin Mode"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-6 py-3 transition-all relative group text-[13px]",
                location.pathname === item.path 
                  ? "bg-cyber-blue/10 text-white border-l-[3px] border-cyber-blue" 
                  : "text-cyber-text-muted hover:text-cyber-blue hover:bg-cyber-blue/5"
              )}
            >
              <item.icon size={16} />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-cyber-red text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase">
                  Alert
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-cyber-border">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full text-cyber-text-muted hover:text-cyber-red transition-all text-[12px] font-medium"
          >
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-[60px] border-b border-cyber-border bg-cyber-card/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div />

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-cyber-border border border-cyber-blue/20 flex items-center justify-center overflow-hidden">
               <User size={16} className="text-cyber-blue" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar border-l border-t border-cyber-border/30 bg-gradient-to-br from-cyber-bg via-cyber-bg to-cyber-card/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
