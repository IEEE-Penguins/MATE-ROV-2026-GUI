// RightSideButtons.tsx
interface RightSideButtonsProps {
  activePanel: number | null;
  setActivePanel: (panel: number | null) => void;
}

export default function RightSideButtons({ activePanel, setActivePanel }: RightSideButtonsProps) {
  const buttons: Array<{ id: number; label: string }> = [
    { id: 1, label: "1" },
    { id: 21, label: "2.1" },
    { id: 22, label: "2.2" },
    { id: 4, label: "4" },
  ];

  return (
    <div className="absolute right-6 top-40 z-30 flex flex-col gap-4">
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => setActivePanel(activePanel === button.id ? null : button.id)}
          className={`w-12 h-10 rounded-lg font-bold text-xs transition-all duration-200 flex items-center justify-center ${
            activePanel === button.id
              ? 'bg-[#0B1120] text-white border-4 border-white shadow-lg shadow-white/70'
              : 'bg-[#0B1120] text-cyan-500 hover:bg-cyan-600 hover:text-[#0B1120] shadow-lg'
          }`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}