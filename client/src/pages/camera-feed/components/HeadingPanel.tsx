export default function HeadingPanel() {
  return (
    <div className="absolute left-8 bottom-32">
      <div className="text-gray-400 text-xs tracking-wider mb-4">HEADING</div>
      <div className="text-cyan-400 text-2xl font-light mb-6">NW 315°</div>

      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
        <div className="absolute inset-2 border border-gray-700 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-cyan-400 origin-bottom -translate-x-1/2 -rotate-45"></div>
      </div>

      <div className="flex gap-8">
        <div>
          <div className="text-gray-400 text-xs tracking-wider mb-1">WATER</div>
          <div className="text-cyan-400 text-xl">2°C</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs tracking-wider mb-1">INTERNAL</div>
          <div className="text-orange-400 text-xl">45°C</div>
        </div>
      </div>
    </div>
  );
}
