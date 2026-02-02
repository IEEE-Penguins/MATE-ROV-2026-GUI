import {useAtom} from "jotai";
import {task1SnapshotsAtom} from "../../../../atoms/atoms";
import {TbGrid4X4} from "react-icons/tb";
import {IoScanOutline} from "react-icons/io5";

export default function Task1Panel() {
    const [snapshots, setSnapshots] = useAtom(task1SnapshotsAtom);

    const handleCapture = (camId: string, camLabel: string) => {
        const videoElement = document.querySelector(camId) as HTMLImageElement;

        if (!videoElement) {
            console.error(`Video element ${camId} not found`);
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = videoElement.naturalWidth || videoElement.width || 640;
        canvas.height = videoElement.naturalHeight || videoElement.height || 480;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Could not get canvas context");
            return;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/png");

        const newSnapshot = {
            url: imageDataUrl,
            timestamp: new Date().toLocaleTimeString("en-GB", {hour12: false}),
            cam: camLabel,
        };

        setSnapshots([newSnapshot, ...snapshots]);
    };

    return (
        <div className="absolute right-20 top-20 z-30 bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-80">
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                    onClick={() => handleCapture("#cam1-feed", "CAM 1")}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-gray-700 bg-transparent text-white hover:bg-white/5 transition-colors"
                >
                    <IoScanOutline size={32} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">
                        Capture 1
                    </span>
                </button>

                <button
                    onClick={() => handleCapture("#cam2-feed", "CAM 2")}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-gray-700 bg-transparent text-white hover:bg-white/5 transition-colors"
                >
                    <IoScanOutline size={32} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">
                        Capture 2
                    </span>
                </button>

                <button
                    onClick={() => handleCapture("#cam3-feed", "CAM 3")}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-gray-700 bg-transparent text-white hover:bg-white/5 transition-colors"
                >
                    <IoScanOutline size={32} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">
                        Capture 3
                    </span>
                </button>

                <button
                    onClick={() => handleCapture("#cam4-feed", "CAM 4")}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-gray-700 bg-transparent text-white hover:bg-white/5 transition-colors"
                >
                    <IoScanOutline size={32} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">
                        Capture 4
                    </span>
                </button>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">
                    Snapshots
                </h3>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
                {snapshots.map((snap, i) => (
                    <div
                        key={i}
                        className="relative rounded-lg overflow-hidden border border-cyan-900/30 group"
                    >
                        <img
                            src={snap.url}
                            alt={`Snapshot ${i}`}
                            className="w-full h-28 object-cover brightness-90 group-hover:brightness-100 transition-all"
                            onError={(e) => {
                                e.currentTarget.src =
                                    "https://via.placeholder.com/300x200?text=Error+Loading";
                            }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-[9px] text-white font-mono border border-white/10">
                            {snap.cam} - {snap.timestamp}
                        </div>
                    </div>
                ))}

                {snapshots.length === 0 && (
                    <div className="space-y-3">
                        {[1, 2].map((n) => (
                            <div
                                key={n}
                                className="h-28 bg-black/40 rounded-lg border border-dashed border-gray-800 flex items-center justify-center"
                            >
                                <span className="text-[9px] text-gray-700 uppercase">
                                    Waiting for feed...
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-900/20">
                <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
                    Targets Captured: {snapshots.length} / 8
                </p>
            </div>
        </div>
    );
}