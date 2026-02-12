export default function DepthPanel() {
  return (
    <div className="absolute left-8 top-32">
      <div className="text-gray-400 text-xs tracking-wider mb-2">DEPTH</div>
      <div className="flex items-end gap-1">
        <div className="text-6xl font-light text-cyan-400">4.2</div>
        <div className="text-sm text-gray-400 mb-2">METERS</div>
      </div>

      <div className="w-1 h-64 bg-gray-700 rounded-full mt-6 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-cyan-400 rounded-full"></div>
      </div>
    </div>
  );
}
