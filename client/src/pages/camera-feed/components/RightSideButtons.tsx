// RightSideButtons.tsx
interface RightSideButtonsProps {
  activePanel: number | null;
  setActivePanel: (panel: number | null) => void;
}

export default function RightSideButtons({ activePanel, setActivePanel }: RightSideButtonsProps) {
  const buttons = [1, 2, 4];

  return (
    <div className="absolute right-6 top-40 z-30 flex flex-col gap-4">
      {buttons.map((num) => (
        <button
          key={num}
          onClick={() => setActivePanel(activePanel === num ? null : num)}
          className={`w-10 h-10 rounded-lg font-bold text-base transition-all duration-200 flex items-center justify-center ${
            activePanel === num
              ? 'bg-[#0B1120] text-white border-4 border-white shadow-lg shadow-white/70'
              : 'bg-[#0B1120] text-cyan-500 hover:bg-cyan-600 hover:text-[#0B1120] shadow-lg'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  );
}