import { motion } from 'framer-motion';
import { Group } from '../types';

interface NetworkTopologyProps {
  groups: Group[];
}

export default function NetworkTopology({ groups }: NetworkTopologyProps) {
  // Use a subset for visual clarity like the reference image
  const visualGroups = groups.slice(0, 12);
  const radius = 180;
  
  return (
    <div className="cyber-panel min-h-[500px] flex flex-col">
      <div className="cyber-panel-header">
        <span>NETWORK_TOPOLOGY_MAP</span>
        <span className="text-cyber-blue font-mono">VISUALIZING {visualGroups.length} OF {groups.length} CLUSTERS</span>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/40">
        {/* Radar Background Effects */}
        <div className="absolute w-[450px] h-[450px] border border-cyber-blue/10 rounded-full" />
        <div className="absolute w-[300px] h-[300px] border border-cyber-blue/5 rounded-full" />
        <div className="absolute w-[150px] h-[150px] border border-cyber-blue/5 rounded-full" />
        
        {/* Core Switch */}
        <div className="relative z-10 w-24 h-24 border-2 border-cyber-blue rounded-sm flex flex-col items-center justify-center bg-cyber-card shadow-[0_0_20px_rgba(56,189,248,0.2)]">
          <div className="text-[10px] font-bold text-cyber-blue uppercase tracking-tighter">CORE</div>
          <div className="text-[10px] font-bold text-cyber-blue uppercase tracking-tighter">SWITCH</div>
        </div>

        {/* Floating Groups */}
        {visualGroups.map((group, i) => {
          const angle = (i / visualGroups.length) * 2 * Math.PI;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const colorClass = (i % 3 === 0 ? "border-cyber-yellow text-cyber-yellow" : "border-cyber-green text-cyber-green");

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px - 32px)`,
                top: `calc(50% + ${y}px - 32px)`,
              }}
              className="flex flex-col items-center"
            >
              {/* Connector Line */}
              <div 
                className="absolute origin-left h-[1px] bg-cyber-border opacity-20"
                style={{
                  width: `${radius}px`,
                  transform: `rotate(${angle * 180 / Math.PI}deg)`,
                  left: `${-x}px`,
                  top: `32px`,
                  zIndex: 0
                }}
              />
              
              <div className={`w-16 h-16 rounded-full border bg-cyber-card flex flex-col items-center justify-center text-center p-1 z-10 transition-all hover:scale-110 cursor-pointer ${colorClass}`}>
                <div className="text-[8px] font-bold uppercase truncate w-full">{group.name.split('-')[1] || group.name}</div>
                <div className="text-[7px] font-mono mt-0.5">{group.deviceCount} nodes</div>
              </div>
            </motion.div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 flex gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-green" />
            <span className="text-cyber-green uppercase">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-yellow" />
            <span className="text-cyber-yellow uppercase">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
