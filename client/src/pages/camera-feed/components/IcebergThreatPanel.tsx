import {useEffect, useState} from "react";
import {useAtom} from "jotai";
import {
    icebergInputAtom,
    icebergCalculationAtom,
    icebergLoadingAtom,
    icebergErrorAtom,
} from "../../../../atoms/atoms";
import type {
    ThreatLevel,
    IcebergPlatformResult,
} from "../../../../atoms/atoms";
import {events} from "../../../utils/socket/socket";
import {RiShipLine} from "react-icons/ri";
import IcebergTrajectoryMap from "./IcebergTrajectoryMap";

type CoordinateField = "lat" | "lon";
type LatitudeDirection = "N" | "S";
type LongitudeDirection = "E" | "W";

const isTransientNumericInput = (value: string) => {
    return (
        value === "" ||
        value === "-" ||
        value === "." ||
        value === "-."
    );
};

const decimalToDms = (value: number, field: CoordinateField) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const absolute = Math.abs(safeValue);

    let degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    let minutes = Math.floor(minutesFloat);
    let seconds = Number(((minutesFloat - minutes) * 60).toFixed(2));

    // Normalize carry caused by rounding (e.g., 59.999 -> 60.00 sec).
    if (seconds >= 60) {
        seconds = 0;
        minutes += 1;
    }
    if (minutes >= 60) {
        minutes = 0;
        degrees += 1;
    }

    if (field === "lat") {
        const direction: LatitudeDirection =
            safeValue < 0 ? "S" : "N";
        return {degrees, minutes, seconds, direction};
    }

    const direction: LongitudeDirection = safeValue < 0 ? "W" : "E";
    return {degrees, minutes, seconds, direction};
};

const dmsToDecimal = (
    degrees: number,
    minutes: number,
    seconds: number,
    direction: LatitudeDirection | LongitudeDirection,
    field: CoordinateField,
) => {
    if (
        !Number.isFinite(degrees) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds) ||
        degrees < 0 ||
        minutes < 0 ||
        seconds < 0
    ) {
        return null;
    }

    if (field === "lat") {
        if (!["N", "S"].includes(direction)) return null;
    }

    if (field === "lon") {
        if (!["E", "W"].includes(direction)) return null;
    }

    // Allow rollover input such as 47° 52' 60" by converting total arc-seconds.
    const absoluteDecimal =
        (degrees * 3600 + minutes * 60 + seconds) / 3600;

    if (field === "lat" && absoluteDecimal > 90) return null;
    if (field === "lon" && absoluteDecimal > 180) return null;

    const sign = direction === "S" || direction === "W" ? -1 : 1;
    return sign * absoluteDecimal;
};

const parseLooseNumber = (value: string) => {
    const normalized = value.replace(/,/g, ".").trim();
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLatitudeDirection = (
    value: string,
): LatitudeDirection | null => {
    const normalized = value.trim().toUpperCase();
    if (normalized === "N" || normalized === "NORTH") return "N";
    if (normalized === "S" || normalized === "SOUTH") return "S";
    return null;
};

const normalizeLongitudeDirection = (
    value: string,
): LongitudeDirection | null => {
    const normalized = value.trim().toUpperCase();
    if (normalized === "E" || normalized === "EAST") return "E";
    if (normalized === "W" || normalized === "WEST") return "W";
    return null;
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

const DEFAULT_PLATFORM_COORDS = [
    {name: "Hibernia", lat: 46.7504, lon: -48.7819},
    {name: "Sea Rose", lat: 46.7895, lon: -48.146},
    {name: "Terra Nova", lat: 46.4, lon: -48.4},
    {name: "Hebron", lat: 46.544, lon: -48.518},
];

export default function IcebergThreatPanel() {
    const [icebergInput, setIcebergInput] = useAtom(icebergInputAtom);
    const [icebergCalculation, setIcebergCalculation] = useAtom(
        icebergCalculationAtom,
    );
    const [loading, setLoading] = useAtom(icebergLoadingAtom);
    const [error, setError] = useAtom(icebergErrorAtom);

    const initialLat = decimalToDms(icebergInput.lat, "lat");
    const initialLon = decimalToDms(icebergInput.lon, "lon");

    const [draftInput, setDraftInput] = useState({
        latDeg: String(initialLat.degrees),
        latMin: String(initialLat.minutes),
        latSec: String(initialLat.seconds),
        latDir: initialLat.direction,
        lonDeg: String(initialLon.degrees),
        lonMin: String(initialLon.minutes),
        lonSec: String(initialLon.seconds),
        lonDir: initialLon.direction,
        heading: String(icebergInput.heading),
        keelDepth: String(icebergInput.keelDepth),
    });

    const mapPlatforms = DEFAULT_PLATFORM_COORDS.map((platform) => {
        const fromResult = (icebergCalculation?.results || []).find(
            (row) => row.name === platform.name,
        );

        const surfaceThreatLevel =
            fromResult?.surfaceThreatLevel ?? "GREEN";
        const subseaAssetThreatLevel =
            fromResult?.subseaAssetThreatLevel ?? "GREEN";

        return {
            name: platform.name,
            lat:
                Number.isFinite(fromResult?.lat) &&
                Number.isFinite(fromResult?.lon)
                    ? (
                          fromResult as IcebergPlatformResult & {
                              lat: number;
                              lon: number;
                          }
                      ).lat
                    : platform.lat,
            lon:
                Number.isFinite(fromResult?.lat) &&
                Number.isFinite(fromResult?.lon)
                    ? (
                          fromResult as IcebergPlatformResult & {
                              lat: number;
                              lon: number;
                          }
                      ).lon
                    : platform.lon,
            surfaceThreatLevel,
            subseaAssetThreatLevel,
        };
    });

    const mapIceberg = {
        lat: icebergCalculation?.iceberg?.lat ?? icebergInput.lat,
        lon: icebergCalculation?.iceberg?.lon ?? icebergInput.lon,
        heading:
            icebergCalculation?.iceberg?.heading ??
            icebergInput.heading,
    };

    useEffect(() => {
        events.getLastIcebergThreats();
    }, []);

    useEffect(() => {
        const latDms = decimalToDms(icebergInput.lat, "lat");
        const lonDms = decimalToDms(icebergInput.lon, "lon");

        setDraftInput({
            latDeg: String(latDms.degrees),
            latMin: String(latDms.minutes),
            latSec: String(latDms.seconds),
            latDir: latDms.direction,
            lonDeg: String(lonDms.degrees),
            lonMin: String(lonDms.minutes),
            lonSec: String(lonDms.seconds),
            lonDir: lonDms.direction,
            heading: String(icebergInput.heading),
            keelDepth: String(icebergInput.keelDepth),
        });
    }, [icebergInput]);

    const handleInputChange =
        (field: "heading" | "keelDepth") =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;

            setDraftInput((prev) => ({
                ...prev,
                [field]: raw,
            }));
        };

    const handleDmsNumericChange =
        (
            field:
                | "latDeg"
                | "latMin"
                | "latSec"
                | "lonDeg"
                | "lonMin"
                | "lonSec",
        ) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setDraftInput((prev) => ({
                ...prev,
                [field]: raw,
            }));
        };

    const handleDirectionChange =
        (field: "latDir" | "lonDir") =>
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            setDraftInput((prev) => ({
                ...prev,
                [field]: e.target.value,
            }));
        };

    const handleInputBlur =
        (field: "heading" | "keelDepth") => () => {
            const raw = draftInput[field];
            if (isTransientNumericInput(raw)) {
                setDraftInput((prev) => ({
                    ...prev,
                    [field]: "0",
                }));
            }
        };

    const handleDmsInputBlur =
        (
            field:
                | "latDeg"
                | "latMin"
                | "latSec"
                | "lonDeg"
                | "lonMin"
                | "lonSec",
        ) =>
        () => {
            const raw = draftInput[field];
            if (isTransientNumericInput(raw)) {
                setDraftInput((prev) => ({
                    ...prev,
                    [field]: "0",
                }));
            }
        };

    const submitCalculation = () => {
        const latDeg = parseLooseNumber(draftInput.latDeg);
        const latMin = parseLooseNumber(draftInput.latMin);
        const latSec = parseLooseNumber(draftInput.latSec);
        const lonDeg = parseLooseNumber(draftInput.lonDeg);
        const lonMin = parseLooseNumber(draftInput.lonMin);
        const lonSec = parseLooseNumber(draftInput.lonSec);

        const latDirection = normalizeLatitudeDirection(
            draftInput.latDir,
        );
        const lonDirection = normalizeLongitudeDirection(
            draftInput.lonDir,
        );

        const heading = parseLooseNumber(draftInput.heading);
        const keelDepth = parseLooseNumber(draftInput.keelDepth);

        if (
            latDeg === null ||
            latMin === null ||
            latSec === null ||
            lonDeg === null ||
            lonMin === null ||
            lonSec === null ||
            latDirection === null ||
            lonDirection === null ||
            heading === null ||
            keelDepth === null
        ) {
            setIcebergCalculation(null);
            setError(
                "Invalid input format. Example: 47o58’00” North, 48o50’00” West, heading 180o, keel depth 78 meters.",
            );
            return;
        }

        const parsedLat = dmsToDecimal(
            latDeg,
            latMin,
            latSec,
            latDirection,
            "lat",
        );
        const parsedLon = dmsToDecimal(
            lonDeg,
            lonMin,
            lonSec,
            lonDirection,
            "lon",
        );

        if (parsedLat === null || parsedLon === null) {
            setIcebergCalculation(null);
            setError(
                "Invalid coordinates. Example: 47o58’00” North and 48o50’00” West.",
            );
            return;
        }

        const payload = {
            ...icebergInput,
            lat: parsedLat,
            lon: parsedLon,
            heading,
            keelDepth,
            rawInput: {
                latitude: {
                    degrees: latDeg,
                    minutes: latMin,
                    seconds: latSec,
                    direction: latDirection,
                },
                longitude: {
                    degrees: lonDeg,
                    minutes: lonMin,
                    seconds: lonSec,
                    direction: lonDirection,
                },
                heading,
                keelDepth,
            },
        };

        setIcebergInput(payload);
        setError(null);
        setLoading(true);
        events.calculateIcebergThreats(payload);
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
                    <div className="mt-1 grid grid-cols-4 gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={draftInput.latDeg}
                            onChange={handleDmsNumericChange(
                                "latDeg",
                            )}
                            onBlur={handleDmsInputBlur("latDeg")}
                            placeholder="0"
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={draftInput.latMin}
                            onChange={handleDmsNumericChange(
                                "latMin",
                            )}
                            onBlur={handleDmsInputBlur("latMin")}
                            placeholder="0"
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <input
                            type="text"
                            inputMode="decimal"
                            value={draftInput.latSec}
                            onChange={handleDmsNumericChange(
                                "latSec",
                            )}
                            onBlur={handleDmsInputBlur("latSec")}
                            placeholder="0"
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <select
                            value={draftInput.latDir}
                            onChange={handleDirectionChange("latDir")}
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="N">N</option>
                            <option value="S">S</option>
                        </select>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500 normal-case tracking-normal">
                        Deg / Min / Sec / Dir
                    </div>
                </label>
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Longitude
                    <div className="mt-1 grid grid-cols-4 gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={draftInput.lonDeg}
                            onChange={handleDmsNumericChange(
                                "lonDeg",
                            )}
                            onBlur={handleDmsInputBlur("lonDeg")}
                            placeholder="0"
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={draftInput.lonMin}
                            onChange={handleDmsNumericChange(
                                "lonMin",
                            )}
                            onBlur={handleDmsInputBlur("lonMin")}
                            placeholder="0"
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <input
                            type="text"
                            inputMode="decimal"
                            value={draftInput.lonSec}
                            onChange={handleDmsNumericChange(
                                "lonSec",
                            )}
                            onBlur={handleDmsInputBlur("lonSec")}
                            placeholder="0"
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <select
                            value={draftInput.lonDir}
                            onChange={handleDirectionChange("lonDir")}
                            className="w-full bg-[#040c0f] border border-cyan-900/50 px-2 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                        >
                            <option value="E">E</option>
                            <option value="W">W</option>
                        </select>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500 normal-case tracking-normal">
                        Deg / Min / Sec / Dir
                    </div>
                </label>
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Heading (°)
                    <input
                        type="text"
                        inputMode="numeric"
                        value={draftInput.heading}
                        onChange={handleInputChange("heading")}
                        onBlur={handleInputBlur("heading")}
                        placeholder="180o"
                        className="mt-1 w-full bg-[#040c0f] border border-cyan-900/50 px-3 py-2 rounded-lg text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                </label>
                <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wide">
                    Iceberg Keel Depth (meters)
                    <input
                        type="text"
                        inputMode="numeric"
                        value={draftInput.keelDepth}
                        onChange={handleInputChange("keelDepth")}
                        onBlur={handleInputBlur("keelDepth")}
                        placeholder="78 meters"
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
                            <th className="px-3 py-2">
                                Platform Name
                            </th>
                            <th className="px-3 py-2">
                                Distance (nm)
                            </th>
                            <th className="px-3 py-2">
                                Surface Threat Level
                            </th>
                            <th className="px-3 py-2">
                                Subsea Asset Threat Level
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(icebergCalculation?.results || []).map(
                            (row) => (
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
                                            {
                                                row.subseaAssetThreatLevel
                                            }
                                        </span>
                                    </td>
                                </tr>
                            ),
                        )}
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

            <div className="mt-3">
                <IcebergTrajectoryMap
                    iceberg={mapIceberg}
                    platforms={mapPlatforms}
                />
            </div>
        </div>
    );
}
