import {useEffect, useState} from "react";
import TasksPanel from "./components/TasksList";
import RightSideButtons from "./components/RightSideButtons";
import Task1Panel from "./components/Task1Panel";
import Task2Panel from "./components/Task2Panel";
import IcebergThreatPanel from "./components/IcebergThreatPanel";
import Task25Panel from "./components/Task25Panel";
import Task4Panel from "./components/Task4Panel";
import LeftSensorsOverlay from "./components/LeftSensorsOverlay";
import {RiEyeLine, RiEyeOffLine} from "react-icons/ri";

type CameraConfig = {
    id: number;
    feedId: string;
    src: string;
    alt: string;
    label: string;
    labelPositionClass: string;
};

const cameras: CameraConfig[] = [
    {
        id: 1,
        feedId: "cam1-feed",
        src: "http://192.168.1.100:8080/stream?topic=/cam_front/image_raw",
        alt: "Camera 1",
        label: "CAM 1",
        labelPositionClass: "top-4 right-4",
    },
    {
        id: 2,
        feedId: "cam2-feed",
        src: "http://192.168.1.100:8080/stream?topic=/cam_rear/image_raw",
        alt: "Camera 2",
        label: "CAM 2",
        labelPositionClass: "top-4 left-4",
    },
    {
        id: 3,
        feedId: "cam3-feed",
        src: "http://192.168.1.100:8080/stream?topic=/cam_left/image_raw",
        alt: "Camera 3",
        label: "CAM 3",
        labelPositionClass: "top-4 right-4",
    },
    {
        id: 4,
        feedId: "cam4-feed",
        src: "http://192.168.1.100:8080/stream?topic=/cam_right/image_raw",
        alt: "Camera 4",
        label: "CAM 4",
        labelPositionClass: "top-4 left-4",
    },
];

export default function CameraFeed() {
    const [activePanel, setActivePanel] = useState<number | null>(
        null,
    );
    const [hudVisible, setHudVisible] = useState(true);
    const [expandedCameraId, setExpandedCameraId] = useState<
        number | null
    >(null);

    useEffect(() => {
        if (expandedCameraId === null) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setExpandedCameraId(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [expandedCameraId]);

    return (
        <div className="relative w-full h-screen bg-black pt-16 flex flex-col overflow-hidden">
            <div className="relative grid grid-cols-2 grid-rows-2 w-full h-full gap-1 bg-black p-1">
                {cameras.map((camera) => {
                    const isExpanded = expandedCameraId === camera.id;
                    const shouldHide =
                        expandedCameraId !== null && !isExpanded;

                    return (
                        <div
                            key={camera.id}
                            className={`${
                                isExpanded
                                    ? "absolute inset-1 z-20"
                                    : "relative"
                            } bg-slate-950 border border-slate-800 overflow-hidden group transition-all duration-300 hover:brightness-110 ${shouldHide ? "hidden" : ""} ${isExpanded ? "border-cyan-500/40" : ""}`}
                        >
                            <img
                                src={camera.src}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35"
                                crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/25 via-transparent to-[#020617]/70" />

                            <div className="relative z-10 w-full h-full flex items-center justify-center p-2 md:p-3">
                                <div
                                    className={`relative w-full h-full rounded-lg border border-cyan-500/20 bg-black/35 shadow-[0_0_30px_rgba(34,211,238,0.08)] ${isExpanded ? "max-w-[min(96vw,calc((100vh-1rem)*4/3))] max-h-[calc(100vh-1rem)]" : ""}`}
                                >
                                    <img
                                        id={camera.feedId}
                                        src={camera.src}
                                        alt={camera.alt}
                                        width={320}
                                        height={240}
                                        className="w-full h-full object-contain aspect-[4/3] rounded-lg"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            </div>

                            <span
                                className={`absolute ${camera.labelPositionClass} bg-black/70 px-3 py-1 rounded text-xs text-[#38bdf8] font-bold z-10 border border-[#38bdf8]/30 backdrop-blur-sm shadow-lg`}
                            >
                                {camera.label}
                            </span>
                            {isExpanded ? (
                                <button
                                    onClick={() =>
                                        setExpandedCameraId(null)
                                    }
                                    className="absolute bottom-2 right-2 z-30 rounded-md border border-cyan-500/60 bg-[#0B1120]/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-cyan-300 hover:bg-black focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                                    title="Collapse"
                                >
                                    Collapse
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        setExpandedCameraId(camera.id)
                                    }
                                    className="absolute bottom-2 right-2 z-20 rounded-md border border-cyan-500/50 bg-[#0B1120]/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-cyan-300 hover:bg-black focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                                    title="Expand"
                                >
                                    Expand
                                </button>
                            )}
                        </div>
                    );
                })}

                <button
                    onClick={() => setHudVisible(!hudVisible)}
                    className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0B1120]/90  border border-white/30 flex items-center justify-center text-white hover:bg-black hover:border-cyan-400 hover:text-cyan-200 transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    title={hudVisible ? "hide" : "visible"}
                >
                    {hudVisible ? (
                        <RiEyeOffLine size={22} />
                    ) : (
                        <RiEyeLine size={22} />
                    )}
                </button>
            </div>

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
                            {activePanel === 21 && <Task2Panel />}
                            {activePanel === 22 && (
                                <IcebergThreatPanel />
                            )}
                            {activePanel === 25 && <Task25Panel />}
                            {activePanel === 4 && <Task4Panel />}
                        </div>
                    </div>

                    <TasksPanel />
                </>
            )}
        </div>
    );
}
