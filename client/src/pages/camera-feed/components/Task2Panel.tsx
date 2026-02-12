import { useAtom } from "jotai";
import { task2GreenCrabsAtom, task2KeelDepthAtom, task2ThreatLevelAtom, task2TrackingAtom } from "../../../../atoms/atoms";
import { RiBarChartBoxLine } from "react-icons/ri";

export default function Task2Panel() {
  const [greenCrabs] = useAtom(task2GreenCrabsAtom);
  const [keelDepth, setKeelDepth] = useAtom(task2KeelDepthAtom);
  const [threatLevel, setThreatLevel] = useAtom(task2ThreatLevelAtom);
  const [tracking, setTracking] = useAtom(task2TrackingAtom);

  const handleKeelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const depth = parseFloat(e.target.value) || 0;
  setKeelDepth(depth);

  if (depth >= 12.5) {
    setThreatLevel('RED');
  } else if (depth >= 8) {
    setThreatLevel('YELLOW');
  } else {
    setThreatLevel('GREEN');
  }
};

const getAlertStyles = () => {
  switch (threatLevel) {
    case 'RED':
      return {
        container: "border-red-600/50 bg-red-950/10 shadow-[0_0_15px_rgba(220,38,38,0.4)]",
        title: "text-red-400",
        threatText: "text-red-500",
        message: "text-red-300/80",
      };
    case 'YELLOW':
      return {
        container: "border-yellow-600/50 bg-yellow-950/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
        title: "text-yellow-400",
        threatText: "text-yellow-500",
        message: "text-yellow-300/80",
      };
    case 'GREEN':
    default:
      return {
        container: "border-green-600/40 bg-green-950/5 shadow-[0_0_12px_rgba(34,197,94,0.2)]",
        title: "text-green-400",
        threatText: "text-green-500",
        message: "text-green-300/70",
      };
  }
};

const styles = getAlertStyles();

  return (
    <div className="absolute right-20 top-20 z-30 bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-80">
      
      <div className="flex items-center gap-3 mb-2 pb-4 border-b border-cyan-600/60">
        <div className="p-1.5 border border-cyan-500 rounded">
           <RiBarChartBoxLine className="text-cyan-400 text-lg" />
        </div>
        <h2 className="text-base font-bold text-white tracking-wide uppercase">
          Iceberg: <span className="font-medium">AI Analysis</span>
        </h2>
      </div>

      <div className="mb-6 pb-4 border-b border-cyan-600/60">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-black text-cyan-500 uppercase tracking-[0.15em]">Green Crabs (AI)</span>
          <button 
            onClick={() => setTracking(!tracking)}
            className={`px-4 py-1 rounded-md text-xs font-bold tracking-widest transition-all border ${
              tracking ? 'bg-green-950/40 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'
            }`}
          >
            {tracking ? 'TRACKING' : 'OFF'}
          </button>
        </div>
        
        <div className="bg-[#040c0f] p-6 rounded-xl border border-white/5 relative overflow-hidden">
          <h1 className="text-4xl font-light text-white mb-1">{greenCrabs}</h1>
          <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Specimens Detected</p>
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.15em] mb-1">Threat Calculator</h3>
        
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Keel Depth Input (M)</label>
          <input 
            type="number" 
            step="1"
            value={keelDepth} 
            onChange={handleKeelChange} 
            className="w-full bg-[#040c0f] border border-cyan-900/50 p-4 rounded-xl text-lg text-white focus:border-cyan-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

     
      <div className={`mt-2 p-6 rounded-2xl border-2 transition-all duration-500 ${styles.container}`}>
      <div className="text-center">
        <h3 className={`text-[10px] font-bold tracking-[0.3em] uppercase mb-2 ${styles.title}`}>
          System Alert
        </h3>
        <h1 className={`text-2xl font-black mb-3 tracking-tight ${styles.threatText}`}>
          THREAT: {threatLevel}
        </h1>
        <p className={`text-[11px] leading-relaxed mx-auto max-w-[200px] ${styles.message}`}>
          Keel depth below safety threshold for current bathymetry
        </p>
      </div>
    </div>

    </div>
  );
}