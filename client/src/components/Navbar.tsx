import { Link, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { persistedTimeAtom } from "../../atoms/atoms";
import { useEffect, useState, useRef } from "react";

export default function Navbar() {
  const location = useLocation();

  // Time stored in milliseconds
  const [storedTime, setStoredTime] = useAtom(persistedTimeAtom);
  const [running, setRunning] = useState(false);
  const [displayTime, setDisplayTime] = useState(storedTime);
  const startTimestampRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Timer Logic (requestAnimationFrame)
  useEffect(() => {
    if (running) {
      startTimestampRef.current = Date.now() - storedTime;

      const update = () => {
        const now = Date.now();
        const elapsed = now - (startTimestampRef.current || now);
        setDisplayTime(elapsed);
        animationFrameRef.current = requestAnimationFrame(update);
      };

      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setStoredTime(displayTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [running]);

  // Format Time: HH : MM : SS : CS
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    return (
      <div className="flex gap-2 font-mono text-xl md:text-2xl font-bold text-[#38bdf8] drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]">
        <span>{hours.toString().padStart(2, "0")}</span>
        <span className="text-slate-500">:</span>
        <span>{minutes.toString().padStart(2, "0")}</span>
        <span className="text-slate-500">:</span>
        <span>{seconds.toString().padStart(2, "0")}</span>
        <span className="text-slate-500">:</span>
        <span>{centiseconds.toString().padStart(2, "0")}</span>
      </div>
    );
  };

  const handleReset = () => {
    setRunning(false);
    setStoredTime(0);
    setDisplayTime(0);
    localStorage.removeItem("competition-time");
  };

  const isActive = (path: string) =>
    location.pathname.includes(path)
      ? "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/50"
      : "text-slate-400 border-transparent hover:text-white";

  return (
    <nav className="fixed top-0 w-full h-16 z-50 flex items-center justify-between px-6 bg-[#0B1120]/90 backdrop-blur-md border-b border-[#38bdf8]/20 font-sans shadow-lg">
      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-[#38bdf8] flex items-center justify-center bg-[#38bdf8]/10 shadow-[0_0_10px_rgba(56,189,248,0.3)] overflow-hidden p-1">
          <img src="/Penguin.png" alt="Penguin Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-widest text-white">
            PENGUINS <span className="text-[#38bdf8]">TEAM</span>
          </h1>
          <div className="text-[10px] text-slate-400 tracking-[0.2em] -mt-1">MATE ROV 2026</div>
        </div>
      </div>

      {/* CENTER: Competition Timer */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center top-1">
        <div className="bg-black/80 px-6 py-1 rounded-lg border border-[#38bdf8]/30 shadow-[0_0_15px_rgba(56,189,248,0.15)] min-w-[240px] flex justify-center">
          {formatTime(displayTime)}
        </div>

        {/* Timer Controls */}
        <div className="flex gap-2 mt-1 opacity-80 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setRunning(true)}
            className="bg-slate-800 hover:bg-slate-700 text-green-400 w-8 h-5 rounded flex items-center justify-center border border-slate-600 shadow-sm active:scale-95 transition-transform"
            title="Start Timer"
          >
            <i className="fas fa-play text-[10px]"></i>
          </button>
          <button
            onClick={() => setRunning(false)}
            className="bg-slate-800 hover:bg-slate-700 text-yellow-400 w-8 h-5 rounded flex items-center justify-center border border-slate-600 shadow-sm active:scale-95 transition-transform"
            title="Pause Timer"
          >
            <i className="fas fa-pause text-[10px]"></i>
          </button>
          <button
            onClick={handleReset}
            className="bg-slate-800 hover:bg-slate-700 text-red-400 w-8 h-5 rounded flex items-center justify-center border border-slate-600 shadow-sm active:scale-95 transition-transform"
            title="Reset Timer"
          >
            <i className="fas fa-undo text-[10px]"></i>
          </button>
        </div>
      </div>

      {/* RIGHT: Navigation Icons */}
      <div className="flex gap-3">
        <Link
          to="/camera"
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:bg-white/5 ${isActive("camera")}`}
          title="Camera Feed"
        >
          <i className="fas fa-video"></i>
        </Link>
        <Link
          to="/control-panel"
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:bg-white/5 ${isActive("control-panel")}`}
          title="Control Panel"
        >
          <i className="fas fa-gamepad"></i>
        </Link>
        <Link
          to="/configurations"
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:bg-white/5 ${isActive("configurations")}`}
          title="Settings"
        >
          <i className="fas fa-cog"></i>
        </Link>
      </div>
    </nav>
  );
}