import {useState} from "react";
import TasksPanel from "./components/TasksList";
import RightSideButtons from "./components/RightSideButtons";
import Task1Panel from "./components/Task1Panel";
import Task2Panel from "./components/Task2Panel";
import Task4Panel from "./components/Task4Panel";
import LeftSensorsOverlay from "./components/LeftSensorsOverlay";
import {RiEyeLine, RiEyeOffLine} from "react-icons/ri";

export default function CameraFeed() {
    const [activePanel, setActivePanel] = useState<number | null>(
        null,
    );
    const [hudVisible, setHudVisible] = useState(true);

    return (
        <div className="relative w-full h-screen bg-black pt-16 flex flex-col overflow-hidden">
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-1 bg-black p-1">
                {/* CAM 1 */}
                <div className="relative bg-slate-900 border border-slate-800 overflow-hidden group transition-all hover:brightness-110">
                    <img
                        id="cam1-feed"
                        src="http://localhost:8080/stream?topic=/cam_front/image_raw"
                        alt="Camera 1"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                    <span className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded text-xs text-[#38bdf8] font-bold z-10 border border-[#38bdf8]/30 backdrop-blur-sm shadow-lg">
                        CAM 1
                    </span>
                </div>

                {/* CAM 2 */}
                <div
                    className="relative bg-slate-900 border border-slate-800 overflow-hidden group transition-all hover:brightness-110"
                    style={{
                        backgroundImage:
                            "url('http://localhost:8080/stream?topic=/cam_front/image_raw')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <span className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-xs text-[#38bdf8] font-bold z-10 border border-[#38bdf8]/30 backdrop-blur-sm shadow-lg">
                        CAM 2
                    </span>
                </div>

                {/* CAM 3 */}
                <div
                    className="relative bg-slate-900 border border-slate-800 overflow-hidden group transition-all hover:brightness-110"
                    style={{
                        backgroundImage: "url('/underwater3.webp')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <span className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded text-xs text-[#38bdf8] font-bold z-10 border border-[#38bdf8]/30 backdrop-blur-sm shadow-lg">
                        CAM 3
                    </span>
                </div>

                {/* CAM 4 */}
                <div
                    className="relative bg-slate-900 border border-slate-800 overflow-hidden group transition-all hover:brightness-110"
                    style={{
                        backgroundImage: "url('/underwater4.webp')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <span className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-xs text-[#38bdf8] font-bold z-10 border border-[#38bdf8]/30 backdrop-blur-sm shadow-lg">
                        CAM 4
                    </span>
                </div>
            </div>

            {/* clean view */}
            <button
                onClick={() => setHudVisible(!hudVisible)}
                className="absolute left-1/2 top-96 z-50 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0B1120]/90  border border-white/30 flex items-center justify-center text-white hover:bg-black hover:border-cyan-400 hover:text-cyan-200 transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                title={hudVisible ? "hide" : "visible"}
            >
                {hudVisible ? (
                    <RiEyeOffLine size={22} />
                ) : (
                    <RiEyeLine size={22} />
                )}
            </button>

            {hudVisible && (
                <>
                    <LeftSensorsOverlay />

                    <RightSideButtons
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                    />

                    <div className="pointer-events-none absolute inset-0">
                        <div className="pointer-events-auto">
                            {activePanel === 1 && <Task1Panel />}
                            {activePanel === 2 && <Task2Panel />}
                            {activePanel === 4 && <Task4Panel />}
                        </div>
                    </div>

                    <TasksPanel />
                </>
            )}
        </div>
    );
}
