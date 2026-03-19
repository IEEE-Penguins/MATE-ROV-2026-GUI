import {useEffect, useState} from "react";
import {useAtom} from "jotai";
import {
    icebergInputAtom,
    icebergCalculationAtom,
    icebergLoadingAtom,
    icebergErrorAtom,
} from "../../../../atoms/atoms";
import type {ThreatLevel} from "../../../../atoms/atoms";
import {events} from "../../../utils/socket/socket";
import {RiShipLine} from "react-icons/ri";

const isTransientNumericInput = (value: string) => {
    return value === "" || value === "-" || value === "." || value === "-.";
};

const getBadgeStyles = (level: ThreatLevel) => {
    switch (level) {
        case "RED":
            return "bg-red-500/20 text-red-300 border border-red-500/40";
        case "YELLOW":
            return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40";
        case "GREEN":
        default:
            return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    }
};

export default function IcebergThreatPanel() {
    const [icebergInput, setIcebergInput] = useAtom(icebergInputAtom);
    const [icebergCalculation] = useAtom(icebergCalculationAtom);
    const [loading, setLoading] = useAtom(icebergLoadingAtom);
    const [error, setError] = useAtom(icebergErrorAtom);
    const [draftInput, setDraftInput] = useState({
        lat: String(icebergInput.lat),
        lon: String(icebergInput.lon),
        heading: String(icebergInput.heading),
        keelDepth: String(icebergInput.keelDepth),
    });

    useEffect(() => {
        events.getLastIcebergThreats();
    }, []);

    useEffect(() => {
        setDraftInput({
            lat: String(icebergInput.lat),
            lon: String(icebergInput.lon),
            heading: String(icebergInput.heading),
            keelDepth: String(icebergInput.keelDepth),
        });
    }, [icebergInput]);

    const handleInputChange =
        (field: "lat" | "lon" | "heading" | "keelDepth") =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            setDraftInput((prev) => ({
                ...prev,
                [field]: raw,
            }));

            if (isTransientNumericInput(raw)) return;

            const parsed = Number(raw);
            if (!Number.isFinite(parsed)) return;

            setIcebergInput({
                ...icebergInput,
                [field]: parsed,
            });
        };

    const handleInputBlur =
        (field: "lat" | "lon" | "heading" | "keelDepth") =>
        () => {
            const raw = draftInput[field];
            if (isTransientNumericInput(raw)) {
                setDraftInput((prev) => ({
                    ...prev,
                    [field]: String(icebergInput[field]),
                }));
            }
        };

    const submitCalculation = () => {
        setError(null);
        setLoading(true);
        events.calculateIcebergThreats(icebergInput);
    };

    return (
        <div className="absolute right-20 bottom-20 z-30 bg-black/80 p-4 rounded-xl border border-cyan-500/30 w-170 max-w-[calc(100vw-3rem)]">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-600/60">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 border border-cyan-500 rounded">
                        <RiShipLine className="text-cyan-400 text-lg" />
                    </div>
                    <h2 className="text-base font-bold text-white tracking-wide uppercase">
                        Task 2.2: Iceberg Threat Analysis
                    </h2>
                </div>
                <button
                    onClick={submitCalculation}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-md text-xs font-bold tracking-wider border border-cyan-500/60 text-cyan-200 bg-cyan-900/30 hover:bg-cyan-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Calculating..." : "Calculate"}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Latitude
                    <input
                        type="number"
                        step="0.0001"
                        value={draftInput.lat}
                        onChange={handleInputChange("lat")}
                        onBlur={handleInputBlur("lat")}
                        className="mt-1 w-full bg-[#040c0f] border border-cyan-900/50 px-3 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                </label>
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Longitude
                    <input
                        type="number"
                        step="0.0001"
                        value={draftInput.lon}
                        onChange={handleInputChange("lon")}
                        onBlur={handleInputBlur("lon")}
                        className="mt-1 w-full bg-[#040c0f] border border-cyan-900/50 px-3 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                </label>
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Heading (Display)
                    <input
                        type="number"
                        step="1"
                        value={draftInput.heading}
                        onChange={handleInputChange("heading")}
                        onBlur={handleInputBlur("heading")}
                        className="mt-1 w-full bg-[#040c0f] border border-cyan-900/50 px-3 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                </label>
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Keel Depth (m)
                    <input
                        type="number"
                        step="1"
                        value={draftInput.keelDepth}
                        onChange={handleInputChange("keelDepth")}
                        onBlur={handleInputBlur("keelDepth")}
                        className="mt-1 w-full bg-[#040c0f] border border-cyan-900/50 px-3 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                </label>
            </div>

            {error && (
                <div className="mb-3 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-cyan-900/60">
                <table className="min-w-full text-xs text-left text-gray-200">
                    <thead className="bg-[#061119] text-cyan-300 uppercase tracking-wide">
                        <tr>
                            <th className="px-3 py-2">Platform Name</th>
                            <th className="px-3 py-2">Distance (nm)</th>
                            <th className="px-3 py-2">Surface Threat Level</th>
                            <th className="px-3 py-2">Subsea Asset Threat Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(icebergCalculation?.results || []).map((row) => (
                            <tr
                                key={row.name}
                                className="border-t border-cyan-900/40 bg-black/30"
                            >
                                <td className="px-3 py-2 font-semibold text-white">
                                    {row.name}
                                </td>
                                <td className="px-3 py-2 text-cyan-100">
                                    {row.distance.toFixed(2)}
                                </td>
                                <td className="px-3 py-2">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${getBadgeStyles(
                                            row.surfaceThreatLevel,
                                        )}`}
                                    >
                                        {row.surfaceThreatLevel}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${getBadgeStyles(
                                            row.subseaAssetThreatLevel,
                                        )}`}
                                    >
                                        {row.subseaAssetThreatLevel}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {!icebergCalculation?.results?.length && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-3 py-4 text-center text-gray-400"
                                >
                                    No iceberg calculation yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
