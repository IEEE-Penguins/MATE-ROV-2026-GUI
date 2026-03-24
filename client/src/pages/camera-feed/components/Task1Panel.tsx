import {useCallback, useEffect, useRef, useState} from "react";
import {useAtom} from "jotai";
import {
    task1MeasurementFrameAtom,
    task1SnapshotsAtom,
} from "../../../../atoms/atoms";
import {IoScanOutline} from "react-icons/io5";

type CameraOption = {
    id: string;
    label: string;
};

type Point = {
    x: number;
    y: number;
};

type DrawnMeasurement = {
    points: [Point, Point];
    valueCm: number;
};

type PersistedTask1MeasurementState = {
    selectedCameraId: string;
    calibrationPoints: Point[];
    measurementPoints: Point[];
    pixelRatio: number | null;
    referenceLengthInput: string;
    measurements: DrawnMeasurement[];
};

const CAMERA_OPTIONS: CameraOption[] = [
    {id: "#cam1-feed", label: "CAM 1"},
    {id: "#cam2-feed", label: "CAM 2"},
    {id: "#cam3-feed", label: "CAM 3"},
    {id: "#cam4-feed", label: "CAM 4"},
];

const TASK1_MEASUREMENT_STORAGE_KEY = "task1-measurement-state";

export default function Task1Panel() {
    const [snapshots, setSnapshots] = useAtom(task1SnapshotsAtom);
    const [measurementFrame, setMeasurementFrame] = useAtom(
        task1MeasurementFrameAtom,
    );
    const [selectedCameraId, setSelectedCameraId] =
        useState<string>(CAMERA_OPTIONS[0].id);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
    const [measurementPoints, setMeasurementPoints] = useState<Point[]>([]);
    const [pixelRatio, setPixelRatio] = useState<number | null>(null);
    const [referenceLengthInput, setReferenceLengthInput] =
        useState<string>("");
    const [measurements, setMeasurements] = useState<DrawnMeasurement[]>([]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameImageRef = useRef<HTMLImageElement | null>(null);
    const hydratedMeasurementStateRef = useRef(false);
    const frozenFrameUrl = measurementFrame?.url ?? null;
    const frameMeta = measurementFrame
        ? {
            cam: measurementFrame.cam,
            timestamp: measurementFrame.timestamp,
        }
        : null;

    const clearCalibration = () => {
        setCalibrationPoints([]);
        setReferenceLengthInput("");
        setPixelRatio(null);
        setMeasurementPoints([]);
        setMeasurements([]);
    };

    const resetAll = () => {
        setMeasurementFrame(null);
        setStatusMessage(null);
        clearCalibration();
    };

    const clearSnapshots = () => {
        setSnapshots([]);
        setStatusMessage("Snapshots buffer cleared.");
    };

    const drawLineWithLabel = (
        ctx: CanvasRenderingContext2D,
        start: Point,
        end: Point,
        color: string,
        label: string,
        yOffset = -10,
    ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
        ctx.fill();

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        ctx.font = "bold 12px monospace";
        const textWidth = ctx.measureText(label).width;
        const textX = midX - textWidth / 2;
        const textY = midY + yOffset;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(textX - 6, textY - 12, textWidth + 12, 18);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, textX, textY);
    };

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const frameImage = frameImageRef.current;
        if (!canvas || !frameImage) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

        if (calibrationPoints.length === 1) {
            const p = calibrationPoints[0];
            ctx.fillStyle = "#06b6d4";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        if (calibrationPoints.length === 2) {
            const [a, b] = calibrationPoints;
            const pixelDistance = Math.hypot(b.x - a.x, b.y - a.y);
            drawLineWithLabel(
                ctx,
                a,
                b,
                "#06b6d4",
                `Ref: ${pixelDistance.toFixed(1)} px`,
            );
        }

        measurements.forEach((m, index) => {
            drawLineWithLabel(
                ctx,
                m.points[0],
                m.points[1],
                "#22c55e",
                `M${index + 1}: ${m.valueCm.toFixed(2)} cm`,
                16,
            );
        });

        if (measurementPoints.length === 1) {
            const p = measurementPoints[0];
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [calibrationPoints, measurementPoints, measurements]);

    useEffect(() => {
        renderCanvas();
    }, [frozenFrameUrl, renderCanvas]);

    useEffect(() => {
        try {
            const rawState = localStorage.getItem(
                TASK1_MEASUREMENT_STORAGE_KEY,
            );
            if (!rawState) {
                hydratedMeasurementStateRef.current = true;
                return;
            }

            const parsedState = JSON.parse(
                rawState,
            ) as Partial<PersistedTask1MeasurementState>;

            if (
                parsedState.selectedCameraId &&
                CAMERA_OPTIONS.some(
                    (camera) => camera.id === parsedState.selectedCameraId,
                )
            ) {
                setSelectedCameraId(parsedState.selectedCameraId);
            }
            setCalibrationPoints(
                Array.isArray(parsedState.calibrationPoints)
                    ? parsedState.calibrationPoints
                    : [],
            );
            setMeasurementPoints(
                Array.isArray(parsedState.measurementPoints)
                    ? parsedState.measurementPoints
                    : [],
            );
            setPixelRatio(
                typeof parsedState.pixelRatio === "number"
                    ? parsedState.pixelRatio
                    : null,
            );
            setReferenceLengthInput(parsedState.referenceLengthInput ?? "");
            setMeasurements(
                Array.isArray(parsedState.measurements)
                    ? parsedState.measurements
                    : [],
            );
        } catch {
            localStorage.removeItem(TASK1_MEASUREMENT_STORAGE_KEY);
        } finally {
            hydratedMeasurementStateRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (!hydratedMeasurementStateRef.current) return;

        const persistedState: PersistedTask1MeasurementState = {
            selectedCameraId,
            calibrationPoints,
            measurementPoints,
            pixelRatio,
            referenceLengthInput,
            measurements,
        };

        localStorage.setItem(
            TASK1_MEASUREMENT_STORAGE_KEY,
            JSON.stringify(persistedState),
        );
    }, [
        selectedCameraId,
        calibrationPoints,
        measurementPoints,
        pixelRatio,
        referenceLengthInput,
        measurements,
    ]);

    const captureFrame = (selectedCamera: CameraOption) => {
        const videoElement = document.querySelector(
            selectedCamera.id,
        ) as HTMLImageElement | null;

        if (!videoElement) {
            setStatusMessage(`${selectedCamera.label} feed not found.`);
            return;
        }

        if (!videoElement.complete) {
            setStatusMessage(
                `${selectedCamera.label} is still loading. Try again in a second.`,
            );
            return;
        }

        const frameWidth = videoElement.naturalWidth || videoElement.width;
        const frameHeight =
            videoElement.naturalHeight || videoElement.height;

        if (!frameWidth || !frameHeight) {
            setStatusMessage(
                `${selectedCamera.label} has no valid frame dimensions yet.`,
            );
            return;
        }

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = frameWidth;
        tempCanvas.height = frameHeight;

        const ctx = tempCanvas.getContext("2d");
        if (!ctx) {
            setStatusMessage("Could not create a canvas context.");
            return;
        }

        try {
            ctx.drawImage(videoElement, 0, 0, frameWidth, frameHeight);
        } catch {
            setStatusMessage(
                "Snapshot failed while drawing frame. Verify camera stream access.",
            );
            return;
        }

        let imageDataUrl = "";
        try {
            imageDataUrl = tempCanvas.toDataURL("image/png");
        } catch {
            setStatusMessage(
                "Snapshot blocked by browser security. Ensure stream allows CORS.",
            );
            return;
        }

        const newSnapshot = {
            url: imageDataUrl,
            timestamp: new Date().toLocaleTimeString("en-GB", {hour12: false}),
            cam: selectedCamera.label,
        };

        setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 8));
        setMeasurementFrame(newSnapshot);
        clearCalibration();
        setStatusMessage(
            `${selectedCamera.label} captured. Click 2 reference points to calibrate.`,
        );
    };

    const handleCapture = () => {
        setStatusMessage(null);

        const selectedCamera = CAMERA_OPTIONS.find(
            (option) => option.id === selectedCameraId,
        );

        if (!selectedCamera) {
            setStatusMessage("Invalid camera selection.");
            return;
        }

        captureFrame(selectedCamera);
    };

    const handleQuickCapture = (camera: CameraOption) => {
        setSelectedCameraId(camera.id);
        setStatusMessage(null);
        captureFrame(camera);
    };

    useEffect(() => {
        if (!frozenFrameUrl) {
            frameImageRef.current = null;
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            canvas.width = img.width;
            canvas.height = img.height;
            frameImageRef.current = img;
            renderCanvas();
        };

        img.onerror = () => {
            setStatusMessage("Failed to load captured frame into measurement canvas.");
        };

        img.src = frozenFrameUrl;
    }, [frozenFrameUrl, renderCanvas]);

    const getPointFromClick = (
        event: React.MouseEvent<HTMLCanvasElement>,
    ): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        return {
            x: Math.max(0, Math.min(canvas.width, x)),
            y: Math.max(0, Math.min(canvas.height, y)),
        };
    };

    const handleCanvasClick = (
        event: React.MouseEvent<HTMLCanvasElement>,
    ) => {
        if (!frozenFrameUrl) {
            setStatusMessage("Capture a frame before measuring.");
            return;
        }

        const point = getPointFromClick(event);
        if (!point) {
            setStatusMessage("Could not read click coordinates. Try again.");
            return;
        }

        setStatusMessage(null);

        if (!pixelRatio) {
            setCalibrationPoints((prev) => {
                if (prev.length === 0) return [point];
                if (prev.length === 1) return [prev[0], point];
                return [point];
            });
            return;
        }

        if (measurementPoints.length === 0) {
            setMeasurementPoints([point]);
            return;
        }

        if (measurementPoints.length === 1) {
            const start = measurementPoints[0];
            const end = point;
            const pixelDistance = Math.hypot(
                end.x - start.x,
                end.y - start.y,
            );

            if (pixelDistance < 1) {
                setStatusMessage(
                    "Measurement points are too close. Click farther apart.",
                );
                return;
            }

            const measuredCm = pixelDistance * pixelRatio;
            const measuredPoints: [Point, Point] = [start, end];
            setMeasurements((existing) => [
                {
                    points: measuredPoints,
                    valueCm: measuredCm,
                },
                ...existing,
            ].slice(0, 6));

            setMeasurementPoints([]);
            setStatusMessage(`Measured length: ${measuredCm.toFixed(2)} cm`);
            return;
        }

        setMeasurementPoints([point]);
    };

    const applyReferenceLength = () => {
        if (calibrationPoints.length !== 2) {
            setStatusMessage("Select exactly 2 reference points first.");
            return;
        }

        const referenceLengthCm = Number.parseFloat(referenceLengthInput);
        if (!Number.isFinite(referenceLengthCm) || referenceLengthCm <= 0) {
            setStatusMessage("Reference length must be a positive number.");
            return;
        }

        const [a, b] = calibrationPoints;
        const referencePixelLength = Math.hypot(b.x - a.x, b.y - a.y);

        if (referencePixelLength < 1) {
            setStatusMessage(
                "Reference points are too close. Select points farther apart.",
            );
            return;
        }

        const nextPixelRatio = referenceLengthCm / referencePixelLength;
        if (!Number.isFinite(nextPixelRatio) || nextPixelRatio <= 0) {
            setStatusMessage("Failed to calculate pixel ratio.");
            return;
        }

        setPixelRatio(nextPixelRatio);
        setMeasurementPoints([]);
        setStatusMessage(
            `Calibrated: 1 px = ${nextPixelRatio.toFixed(4)} cm. Click 2 target points to measure.`,
        );
    };


    return (
        <div className="absolute right-20 top-20 z-30  bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-[27rem] max-h-[82vh] overflow-y-auto scrollbar-hide">
            <div className="mb-4 pb-4 border-b border-cyan-600/35">
                <h3 className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-2">
                    Task 1 Measurement Widget
                </h3>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <select
                        value={selectedCameraId}
                        onChange={(event) => setSelectedCameraId(event.target.value)}
                        className="bg-[#040c0f] border border-cyan-800/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    >
                        {CAMERA_OPTIONS.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                                {camera.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleCapture}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/60 bg-cyan-900/30 text-cyan-200 hover:bg-cyan-800/40 transition-colors"
                    >
                        <IoScanOutline size={18} strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Snapshot
                        </span>
                    </button>
                </div>
                <p className="text-[10px] text-cyan-600 mt-2 uppercase tracking-wide">
                    Freeze frame, calibrate with known reference, then measure target in cm.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {CAMERA_OPTIONS.map((camera) => (
                    <button
                        key={camera.id}
                        onClick={() => handleQuickCapture(camera)}
                        className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 bg-transparent text-white hover:bg-white/5 transition-colors"
                    >
                        <IoScanOutline size={24} strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/80">
                            Capture {camera.label.replace("CAM ", "")}
                        </span>
                    </button>
                ))}
            </div>

            {statusMessage && (
                <div className="mb-3 rounded-lg border border-cyan-900/40 bg-cyan-950/30 px-3 py-2 text-[11px] text-cyan-200">
                    {statusMessage}
                </div>
            )}

            <div className="mb-4 rounded-lg border border-slate-700/70 bg-[#03090d] p-2">
                {!frozenFrameUrl && (
                    <div className="h-52 flex items-center justify-center text-[10px] text-gray-500 uppercase tracking-wide">
                        No frame captured yet.
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className={`w-full h-auto rounded cursor-crosshair ${
                        frozenFrameUrl ? "block" : "hidden"
                    }`}
                />

                {frameMeta && (
                    <div className="mt-2 flex justify-between text-[10px] text-cyan-500/80 uppercase tracking-wide">
                        <span>{frameMeta.cam}</span>
                        <span>{frameMeta.timestamp}</span>
                    </div>
                )}
            </div>

            <div className="mb-4 rounded-lg border border-cyan-900/30 p-3 bg-black/30">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
                    Calibration
                </p>
                <p className="text-[11px] text-gray-300 mb-2">
                    Click 2 reference points, then enter known length in cm.
                </p>
                <div className="grid grid-cols-[1fr_auto] gap-2 mb-2">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={referenceLengthInput}
                        onChange={(event) => setReferenceLengthInput(event.target.value)}
                        placeholder="Reference length (cm)"
                        className="bg-[#040c0f] border border-cyan-800/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                    <button
                        onClick={applyReferenceLength}
                        className="px-3 py-2 rounded-lg border border-cyan-600/60 bg-cyan-950/50 text-cyan-300 text-[10px] font-bold uppercase tracking-widest"
                    >
                        Calibrate
                    </button>
                </div>
                <p className="text-[10px] text-cyan-500/80 uppercase tracking-wide">
                    {pixelRatio
                        ? `Ratio ready: 1 px = ${pixelRatio.toFixed(4)} cm`
                        : "Ratio not set"}
                </p>
            </div>

            <div className="mb-4 flex gap-2">
                <button
                    onClick={clearCalibration}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/30 text-[10px] text-gray-300 font-bold uppercase tracking-wider"
                >
                    Clear Calibration
                </button>
                <button
                    onClick={resetAll}
                    className="flex-1 px-3 py-2 rounded-lg border border-red-900/60 bg-red-950/30 text-[10px] text-red-300 font-bold uppercase tracking-wider"
                >
                    Reset Frame
                </button>
            </div>

            <div className="space-y-3 max-h-44 overflow-y-auto pr-1 scrollbar-hide mb-4">
                {measurements.length > 0 && measurements.map((m, index) => (
                    <div key={`${m.valueCm}-${index}`} className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2">
                        <p className="text-[10px] text-emerald-300 uppercase tracking-wide">
                            Measurement {measurements.length - index}
                        </p>
                        <p className="text-sm text-white font-semibold">
                            {m.valueCm.toFixed(2)} cm
                        </p>
                    </div>
                ))}

                {measurements.length === 0 && (
                    <div className="h-16 bg-black/40 rounded-lg border border-dashed border-gray-800 flex items-center justify-center">
                        <span className="text-[10px] text-gray-600 uppercase">
                            No target measurements yet
                        </span>
                    </div>
                )}
            </div>

            <div className="pt-3 border-t border-cyan-900/20">
                <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">
                        Snapshots Buffer: {snapshots.length} / 8
                    </p>
                    <button
                        onClick={clearSnapshots}
                        className="px-2 py-1 rounded border border-red-900/60 bg-red-950/30 text-[9px] text-red-300 font-bold uppercase tracking-wider"
                    >
                        Clear Snapshots
                    </button>
                </div>
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1 scrollbar-hide">
                    {snapshots.map((snap, i) => (
                        <div
                            key={`${snap.timestamp}-${i}`}
                            className="relative rounded-lg overflow-hidden border border-cyan-900/30 group"
                        >
                            <img
                                src={snap.url}
                                alt={`Snapshot ${i + 1}`}
                                className="w-full h-24 object-cover brightness-90 group-hover:brightness-100 transition-all"
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
                        <div className="h-16 bg-black/40 rounded-lg border border-dashed border-gray-800 flex items-center justify-center">
                            <span className="text-[10px] text-gray-600 uppercase">
                                Waiting for snapshots...
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-wide">
                    Formula: target cm = target pixels * (reference cm / reference pixels)
                </p>
            </div>
        </div>
    );
}