import {useAtom} from "jotai";
import {
    task2GreenCrabsAtom,
    task2AIDetectionImageAtom,
    task2TrackingAtom,
} from "../../../../atoms/atoms";
import {RiBarChartBoxLine} from "react-icons/ri";

export default function Task2Panel() {
    const [greenCrabs] = useAtom(task2GreenCrabsAtom);
    const [aiDetectionImage] = useAtom(task2AIDetectionImageAtom);
    const [tracking, setTracking] = useAtom(task2TrackingAtom);

    return (
        <div className="absolute right-20 top-20 z-30 bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-80">
            <div className="flex items-center gap-3 mb-2 pb-4 border-b border-cyan-600/60">
                <div className="p-1.5 border border-cyan-500 rounded">
                    <RiBarChartBoxLine className="text-cyan-400 text-lg" />
                </div>
                <h2 className="text-base font-bold text-white tracking-wide uppercase">
                    Task 2.1:{" "}
                    <span className="font-medium">Green Crabs AI Analysis</span>
                </h2>
            </div>

            <div className="mb-6 pb-4 border-b border-cyan-600/60">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-cyan-500 uppercase tracking-[0.15em]">
                        Green Crabs (AI)
                    </span>
                    <button
                        onClick={() => setTracking(!tracking)}
                        className={`px-4 py-1 rounded-md text-xs font-bold tracking-widest transition-all border ${
                            tracking
                                ? "bg-green-950/40 border-green-500 text-green-400"
                                : "bg-gray-800 border-gray-600 text-gray-400"
                        }`}
                    >
                        {tracking ? "TRACKING" : "OFF"}
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
            </div>

        </div>
    );
}
