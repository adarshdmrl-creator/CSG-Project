import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Monitor, Layers, Bell, FileText, Settings, LogOut, ShieldAlert, Search, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface LayoutProps {
  user: any;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Devices', path: '/devices', icon: Monitor },
    { name: 'Groups', path: '/groups', icon: Layers },
    { name: 'Analytics', path: '/analytics', icon: Activity },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ] as any[];

  return (
    <div className="flex h-screen bg-cyber-bg overflow-hidden relative">
      <div className="scanline"></div>
      
      {/* Sidebar */}
      <aside className="w-[220px] bg-cyber-card border-r border-cyber-border flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-6 h-6 bg-cyber-blue shadow-[0_0_10px_rgba(56,189,248,0.4)]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
          <div>
            <h1 className="font-extrabold text-sm tracking-tighter leading-none text-white">CSG NETWORK</h1>
            <p className="text-[9px] text-cyber-blue font-bold tracking-tight uppercase opacity-80">Central Defense v2.4</p>
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
          <div className="flex gap-8 items-center text-[11px] font-mono">
            <div className="text-cyber-text-muted">SYSTEM_STATUS: <span className="text-cyber-green">ENCRYPTED_UP</span></div>
            <div className="text-cyber-text-muted">UPTIME: <span className="text-white">241:12:08:54</span></div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-device-modal'))}
              className="px-3 py-1.5 bg-cyber-blue text-black text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-cyber-blue/80 transition-all shadow-[0_0_10px_rgba(56,189,248,0.3)]"
            >
              + Add Device
            </button>
            <div className="bg-cyber-bg border border-cyber-border rounded-sm px-3 py-1.5 flex items-center gap-2 group focus-within:border-cyber-blue/40 transition-all">
              <Search size={14} className="text-cyber-text-muted" />
              <input 
                type="text" 
                placeholder="Search Cluster [CMD+K]" 
                className="bg-transparent border-none outline-none text-[12px] text-white w-48"
              />
            </div>
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
