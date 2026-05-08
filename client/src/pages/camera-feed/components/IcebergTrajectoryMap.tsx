import {useMemo} from "react";
import {
    CartesianGrid,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type ThreatLevel = "GREEN" | "YELLOW" | "RED";

interface IcebergPoint {
    lat: number;
    lon: number;
    heading: number;
}

interface PlatformPoint {
    name: string;
    lat: number;
    lon: number;
    surfaceThreatLevel: ThreatLevel;
    subseaAssetThreatLevel: ThreatLevel;
}

interface IcebergTrajectoryMapProps {
    iceberg: IcebergPoint;
    platforms: PlatformPoint[];
}

const PROJECTION_DISTANCE = 2;

const formatMax2 = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
    }).format(value);
};

const getThreatColor = (level: ThreatLevel) => {
    if (level === "RED") return "#ef4444";
    if (level === "YELLOW") return "#eab308";
    return "#22c55e";
};

const getNumericBounds = (values: number[]) => {
    const fallback = {min: -1, max: 1};
    if (!values.length) return fallback;

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return fallback;
    }

    if (min === max) {
        return {min: min - 0.5, max: max + 0.5};
    }

    const span = max - min;
    const pad = Math.max(0.2, span * 0.2);
    return {
        min: min - pad,
        max: max + pad,
    };
};

const decimalToDms = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const absolute = Math.abs(safeValue);
    let degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    let minutes = Math.floor(minutesFloat);
    let seconds = Number(((minutesFloat - minutes) * 60).toFixed(0));

    if (seconds >= 60) {
        seconds = 0;
        minutes += 1;
    }
    if (minutes >= 60) {
        minutes = 0;
        degrees += 1;
    }

    return {degrees, minutes, seconds};
};

const formatDms = (value: number, axis: "lat" | "lon") => {
    const {degrees, minutes, seconds} = decimalToDms(value);
    const direction =
        axis === "lat"
            ? value < 0
                ? "S"
                : "N"
            : value < 0
              ? "W"
              : "E";
    return `${degrees} ${minutes} ${seconds} ${direction}`;
};

const PlatformMarker = ({
    cx,
    cy,
    payload,
}: {
    cx?: number;
    cy?: number;
    payload?: PlatformPoint;
}) => {
    if (cx === undefined || cy === undefined || !payload) return null;

    const color = getThreatColor(payload.surfaceThreatLevel);

    return (
        <g>
            <circle
                cx={cx}
                cy={cy}
                r={6.5}
                fill={color}
                stroke="#001018"
                strokeWidth={2}
            />
            <circle
                cx={cx}
                cy={cy}
                r={10}
                fill="none"
                stroke={color}
                strokeOpacity={0.45}
                strokeWidth={1.4}
            />
            <text
                x={cx + 12}
                y={cy - 10}
                fill="#d1f5ff"
                fontSize={10}
                fontWeight={600}
            >
                {payload.name}
            </text>
        </g>
    );
};

const IcebergMarker = ({cx, cy}: {cx?: number; cy?: number}) => {
    if (cx === undefined || cy === undefined) return null;

    const points = `${cx},${cy - 11} ${cx - 9},${cy + 8} ${cx + 9},${cy + 8}`;

    return (
        <g>
            <polygon
                points={points}
                fill="#67e8f9"
                stroke="#e2faff"
                strokeWidth={1.6}
            />
            <circle
                cx={cx}
                cy={cy}
                r={13}
                fill="none"
                stroke="#22d3ee"
                strokeOpacity={0.4}
                strokeWidth={1.2}
            />
        </g>
    );
};

const MapTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{
        payload?: PlatformPoint | (IcebergPoint & {name: string});
    }>;
}) => {
    if (!active || !payload?.length || !payload[0]?.payload)
        return null;

    const point = payload[0].payload;
    const isIceberg = point.name === "Iceberg";

    return (
        <div className="rounded-lg border border-cyan-500/50 bg-[#02090f]/95 px-3 py-2 text-[11px] shadow-xl">
            <p className="font-semibold text-cyan-200">
                {point.name}
            </p>
            <p className="text-gray-300">
                Lat: {formatDms(point.lat, "lat")}
            </p>
            <p className="text-gray-300">
                Lon: {formatDms(point.lon, "lon")}
            </p>
            {!isIceberg && "surfaceThreatLevel" in point ? (
                <p className="text-gray-300">
                    Surface Threat: {point.surfaceThreatLevel}
                </p>
            ) : null}
        </div>
    );
};

export default function IcebergTrajectoryMap({
    iceberg,
    platforms,
}: IcebergTrajectoryMapProps) {
    const headingRad = (iceberg.heading * Math.PI) / 180;
    const endLat =
        iceberg.lat + PROJECTION_DISTANCE * Math.cos(headingRad);
    const endLon =
        iceberg.lon + PROJECTION_DISTANCE * Math.sin(headingRad);

    const trajectoryPoints = useMemo(
        () => [
            {lat: iceberg.lat, lon: iceberg.lon},
            {lat: endLat, lon: endLon},
        ],
        [iceberg.lat, iceberg.lon, endLat, endLon],
    );

    const icebergPoint = useMemo(
        () => [{...iceberg, name: "Iceberg"}],
        [iceberg],
    );

    const latBounds = useMemo(
        () =>
            getNumericBounds([
                iceberg.lat,
                endLat,
                ...platforms.map((platform) => platform.lat),
            ]),
        [iceberg.lat, endLat, platforms],
    );

    const lonBounds = useMemo(
        () =>
            getNumericBounds([
                iceberg.lon,
                endLon,
                ...platforms.map((platform) => platform.lon),
            ]),
        [iceberg.lon, endLon, platforms],
    );

    return (
        <div className="rounded-xl border border-cyan-900/60 bg-[#02070d]/80 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                    Iceberg Trajectory Map
                </h3>
                <span className="text-[10px] text-gray-400">
                    Heading: {formatMax2(iceberg.heading)}°
                </span>
            </div>

            <div className="h-64 w-full rounded-lg border border-cyan-950/70 bg-[#01060b]/95">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{
                            top: 16,
                            right: 16,
                            left: 4,
                            bottom: 8,
                        }}
                    >
                        <CartesianGrid
                            stroke="#164e63"
                            strokeOpacity={0.15}
                            vertical
                            horizontal
                        />
                        <XAxis
                            type="number"
                            dataKey="lon"
                            domain={[lonBounds.min, lonBounds.max]}
                            tickFormatter={(value) =>
                                formatDms(Number(value), "lon")
                            }
                            tick={{fontSize: 10, fill: "#94a3b8"}}
                            tickLine={false}
                            axisLine={{
                                stroke: "#164e63",
                                strokeOpacity: 0.45,
                            }}
                            orientation="top"
                            label={{
                                value: "Longitude (DMS)",
                                position: "insideTop",
                                offset: 8,
                                fill: "#67e8f9",
                                fontSize: 10,
                            }}
                        />
                        <YAxis
                            type="number"
                            dataKey="lat"
                            domain={[latBounds.min, latBounds.max]}
                            tickFormatter={(value) =>
                                formatDms(Number(value), "lat")
                            }
                            tick={{fontSize: 10, fill: "#94a3b8"}}
                            tickLine={false}
                            axisLine={{
                                stroke: "#164e63",
                                strokeOpacity: 0.45,
                            }}
                            orientation="right"
                            label={{
                                value: "Latitude (DMS)",
                                angle: 90,
                                position: "insideRight",
                                fill: "#67e8f9",
                                fontSize: 10,
                            }}
                        />
                        <Tooltip
                            content={<MapTooltip />}
                            cursor={{
                                stroke: "#0891b2",
                                strokeOpacity: 0.3,
                            }}
                        />

                        <Scatter
                            data={trajectoryPoints}
                            line={{
                                stroke: "#38bdf8",
                                strokeWidth: 2,
                                strokeDasharray: "6 6",
                            }}
                            shape={({cx, cy}) => (
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={0.1}
                                    fill="#38bdf8"
                                    opacity={0.01}
                                />
                            )}
                            isAnimationActive={false}
                        />

                        <Scatter
                            data={platforms}
                            shape={<PlatformMarker />}
                        />

                        <Scatter
                            data={icebergPoint}
                            shape={<IcebergMarker />}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center gap-4 text-[10px] text-gray-300">
                <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />{" "}
                    GREEN
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />{" "}
                    YELLOW
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />{" "}
                    RED
                </span>
            </div>
        </div>
    );
}
