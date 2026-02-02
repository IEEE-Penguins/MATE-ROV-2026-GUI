import { useAtom } from "jotai";
import {
  task4ProfileDataAtom,
  task4MaxDepthAtom,
  task4AscentRateAtom,
  task4TargetDepthAtom,
  task4StabilityAtom,
} from "../../../../atoms/atoms";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Task4Panel() {
  const [profileData] = useAtom(task4ProfileDataAtom);       
  const [maxDepth] = useAtom(task4MaxDepthAtom);
  const [ascentRate] = useAtom(task4AscentRateAtom);
  const [targetDepth] = useAtom(task4TargetDepthAtom);
  const [stability] = useAtom(task4StabilityAtom);

  const chartData = profileData.map((point, index) => ({
    time: index * 5,          
    depth: point.depth,
  }));

  const hasData = chartData.length > 0;

  const currentDepth = hasData ? chartData[chartData.length - 1].depth : 0;

  return (
    <div className="absolute right-20 top-20 z-30 bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-80">
      
      <div className="flex justify-between items-start mb-1">
        <div>
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.15em] my-1">
            Depth vs Time (M)
          </h3>
          <h1 className="text-3xl font-bold text-white">
            {currentDepth.toFixed(1)}m
          </h1>
        </div>
        <div className="bg-[#1a3a44]/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            Real-Time
          </span>
        </div>
      </div>

      <div className="w-full h-40 my-6">
        <ResponsiveContainer width="100%" height="100%">
          {hasData ? (
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4d" opacity={0.3} />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => `-${60 - t}s`}   
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                ticks={[0, 30, 60]}                    
              />
              <YAxis
                reversed                     
                domain={[0, 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Line
                type="monotone"
                dataKey="depth"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a' }}
              />
            </LineChart>
          ) : (
            <div className=" text-gray-500 text-sm">
              Waiting for depth data...
            </div>
          )}
        </ResponsiveContainer>

        <div className="flex justify-between text-xs text-gray-600 font-bold uppercase px-1 mt-1">
          <span>-60s</span>
          <span>-30s</span>
          <span>Now</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center py-4 border-b border-gray-800/50">
          <span className="text-sm font-medium text-gray-400">Max Depth</span>
          <span className="text-sm font-black text-white">{maxDepth.toFixed(1)}m</span>
        </div>

        <div className="flex justify-between items-center py-4 border-b border-gray-800/50">
          <span className="text-sm font-medium text-gray-400">Ascent Rate</span>
          <span className="text-sm font-black text-green-500">{ascentRate.toFixed(1)}m/s</span>
        </div>

        <div className="flex justify-between items-center py-4 border-b border-gray-800/50">
          <span className="text-sm font-medium text-gray-400">Target Depth</span>
          <span className="text-sm font-black text-cyan-500">{targetDepth.toFixed(1)}m</span>
        </div>

        <div className="flex justify-between items-center py-4">
          <span className="text-sm font-medium text-gray-400">Stability</span>
          <span className="text-sm font-black text-white">{stability.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}