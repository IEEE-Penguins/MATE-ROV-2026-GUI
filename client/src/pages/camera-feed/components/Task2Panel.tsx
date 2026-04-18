import {useEffect, useMemo, useState} from "react";
import {useAtom} from "jotai";
import {
    task2GreenCrabsAtom,
    task2AIDetectionImageAtom,
    isRovConnectedAtom,
} from "../../../../atoms/atoms";
import {RiBarChartBoxLine} from "react-icons/ri";

type Task2Capture = {
    id: string;
    image: string;
    crabCount: number;
    createdAt: string;
};

const TASK2_CAPTURES_KEY = "task2-green-crabs-captures";
const MAX_CAPTURES = 10;

export default function Task2Panel() {
    const [greenCrabs] = useAtom(task2GreenCrabsAtom);
    const [aiDetectionImage] = useAtom(task2AIDetectionImageAtom);
    const [isRovConnected] = useAtom(isRovConnectedAtom);
    const [captures, setCaptures] = useState<Task2Capture[]>([]);
    const [captureError, setCaptureError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        try {
            const saved = localStorage.getItem(TASK2_CAPTURES_KEY);
            if (!saved) return;

            const parsed = JSON.parse(saved) as Task2Capture[];
            if (Array.isArray(parsed)) {
                setCaptures(parsed.slice(0, MAX_CAPTURES));
            }
        } catch {
            // Ignore malformed browser storage data.
        }
    }, []);

    const canCapture = useMemo(
        () => isRovConnected,
        [isRovConnected],
    );

    const persistCaptures = (nextCaptures: Task2Capture[]) => {
        setCaptures(nextCaptures);
        localStorage.setItem(
            TASK2_CAPTURES_KEY,
            JSON.stringify(nextCaptures),
        );
    };

    const handleCapture = async () => {
        if (!isRovConnected) {
            return;
        }

        if (!aiDetectionImage) {
            setCaptureError(
                "No detection image available yet. Please wait for the AI feed.",
            );
            return;
        }

        setCaptureError(null);

        try {
            const image = new Image();
            image.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () =>
                    reject(
                        new Error("Failed to load detection image."),
                    );
                image.src = aiDetectionImage;
            });

            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth || 1280;
            canvas.height = image.naturalHeight || 720;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Capture context is not available.");
            }

            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            const overlayPadding = Math.max(
                12,
                Math.floor(canvas.width * 0.015),
            );
            const overlayHeight = Math.max(
                52,
                Math.floor(canvas.height * 0.1),
            );
            const titleSize = Math.max(
                18,
                Math.floor(canvas.width * 0.028),
            );
            const subtitleSize = Math.max(
                12,
                Math.floor(canvas.width * 0.014),
            );

            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(
                overlayPadding,
                overlayPadding,
                Math.min(canvas.width - overlayPadding * 2, 460),
                overlayHeight,
            );

            ctx.strokeStyle = "rgba(34,211,238,0.85)";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                overlayPadding,
                overlayPadding,
                Math.min(canvas.width - overlayPadding * 2, 460),
                overlayHeight,
            );

            ctx.fillStyle = "#22d3ee";
            ctx.font = `700 ${titleSize}px Inter, Arial, sans-serif`;
            ctx.fillText(
                `Green Crabs: ${greenCrabs}`,
                overlayPadding + 12,
                overlayPadding + titleSize + 4,
            );

            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.font = `500 ${subtitleSize}px Inter, Arial, sans-serif`;
            ctx.fillText(
                `Captured ${new Date().toLocaleString()}`,
                overlayPadding + 12,
                overlayPadding + titleSize + subtitleSize + 12,
            );

            const finalImage = canvas.toDataURL("image/jpeg", 0.92);

            const newCapture: Task2Capture = {
                id: `${Date.now()}`,
                image: finalImage,
                crabCount: greenCrabs,
                createdAt: new Date().toISOString(),
            };

            const nextCaptures = [newCapture, ...captures].slice(
                0,
                MAX_CAPTURES,
            );
            persistCaptures(nextCaptures);
        } catch {
            setCaptureError(
                "Could not capture this frame. Please try again.",
            );
        }
    };

    const clearCaptures = () => {
        persistCaptures([]);
    };

    return (
        <div className="absolute right-20 top-20 z-30  bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-80">
            <div className="flex items-center gap-3 mb-2 pb-4 border-b border-cyan-600/60">
                <div className="p-1.5 border border-cyan-500 rounded">
                    <RiBarChartBoxLine className="text-cyan-400 text-lg" />
                </div>
                <h2 className="text-base font-bold text-white tracking-wide uppercase">
                    Task 2.1:{" "}
                    <span className="font-medium">
                        Green Crabs Detection
                    </span>
                </h2>
            </div>

            <div className="mb-6 pb-4 border-b border-cyan-600/60">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-cyan-500 uppercase tracking-[0.15em]">
                        Green Crabs (AI)
                    </span>
                    <button
                        onClick={handleCapture}
                        disabled={!canCapture}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-widest transition-all border ${
                            canCapture
                                ? "bg-cyan-950/40 border-cyan-500 text-cyan-300 hover:bg-cyan-900/40"
                                : "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        CAPTURE
                    </button>
                </div>

                <div className="bg-[#040c0f] p-6 rounded-xl border border-white/5 relative overflow-hidden">
                    <h1 className="text-4xl font-light text-white mb-1">
                        {greenCrabs}
                    </h1>
                    <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">
                        Specimens Detected
                    </p>
                    <div className="absolute inset-0 bg-linear-to-t from-cyan-500/5 to-transparent pointer-events-none" />
                </div>

                {/* AI Detection Image */}
                <div className="mt-3">
                    <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.15em]">
                        Detection Feed
                    </span>
                    <div className="mt-1 bg-[#040c0f] rounded-xl border border-white/5 overflow-hidden relative">
                        {aiDetectionImage ? (
                            <img
                                src={aiDetectionImage}
                                alt="AI Detection"
                                className="w-full h-auto rounded-xl"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-36 text-gray-600 text-xs tracking-wider uppercase">
                                No detection image
                            </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-cyan-500/5 to-transparent pointer-events-none" />
                    </div>
                </div>

                {captureError ? (
                    <p className="mt-2 text-[10px] text-red-400 tracking-wide uppercase">
                        {captureError}
                    </p>
                ) : null}

                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.15em]">
                            Saved Captures ({captures.length})
                        </span>
                        {captures.length > 0 ? (
                            <button
                                onClick={clearCaptures}
                                className="text-[10px] font-bold text-red-300 hover:text-red-200 uppercase tracking-[0.15em]"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                        {captures.length === 0 ? (
                            <div className="text-[10px] text-gray-500 uppercase tracking-[0.15em]">
                                No captures yet
                            </div>
                        ) : (
                            captures.map((capture) => (
                                <div
                                    key={capture.id}
                                    className="flex items-center gap-2 bg-[#040c0f] border border-white/5 rounded-lg p-2"
                                >
                                    <img
                                        src={capture.image}
                                        alt="Green crab detection capture"
                                        className="w-16 h-10 rounded object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-white/90 font-semibold uppercase tracking-[0.12em] truncate">
                                            {capture.crabCount} crabs
                                        </p>
                                        <p className="text-[9px] text-gray-500 truncate">
                                            {new Date(
                                                capture.createdAt,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <a
                                        href={capture.image}
                                        download={`task2-green-crabs-${capture.id}.jpg`}
                                        className="text-[9px] px-2 py-1 border border-cyan-700/70 text-cyan-300 rounded hover:bg-cyan-900/20 uppercase tracking-[0.12em]"
                                    >
                                        Save
                                    </a>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
