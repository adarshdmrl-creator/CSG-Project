import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, User, Terminal } from 'lucide-react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@csg.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      onLogin(user);
      toast.success('Authentication successful. Session initialized.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="scanline"></div>
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 border-t border-l border-cyber-blue"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 border-b border-r border-cyber-blue"></div>
        <div className="grid grid-cols-20 grid-rows-20 w-full h-full opacity-5">
           {Array.from({ length: 400 }).map((_, i) => (
             <div key={i} className="border-[0.5px] border-white/20"></div>
           ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="cyber-panel p-8 backdrop-blur-xl bg-cyber-card/80 border-t-2 border-t-cyber-blue">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-cyber-blue rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(0,209,255,0.4)] mb-4">
              <ShieldAlert size={36} className="text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight glitch-text">CSG DEFENSE LOGIN</h1>
            <p className="text-xs text-cyber-blue font-mono font-bold tracking-widest uppercase mt-2 opacity-70">Unauthorized access prohibited</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Identity Qualifier</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-2.5 text-cyber-blue/50" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cyber-input w-full pl-10"
                  placeholder="admin@csg.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Access Protocol</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-2.5 text-cyber-blue/50" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input w-full pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="cyber-button-primary w-full justify-center py-3 text-sm mt-4 disabled:opacity-50"
            >
              <Terminal size={18} />
              {loading ? 'INITIATING...' : 'ESTABLISH SESSION'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-cyber-border text-center">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">
              BETA V4.1 // DEPLOYMENT: ASIA-SOUTH-1
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-between px-2 text-[10px] font-mono text-cyber-blue opacity-50 uppercase tracking-wider">
          <span>SEC_STAT: ENCRYPTED</span>
          <span>PROTOCOL: HL-7/NET</span>
        </div>
      </motion.div>
    </div>
  );
}
