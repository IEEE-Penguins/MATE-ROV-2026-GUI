import {useEffect, useMemo, useRef, useState} from "react";
import {useAtom} from "jotai";
import {task4ProfileDataAtom} from "../../../../atoms/atoms";
import type {FloatMissionPacket} from "../../../../atoms/atoms";
import {events} from "../../../utils/socket/socket";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function Task4Panel() {
    const [profileData, setProfileData] = useAtom(
        task4ProfileDataAtom,
    );
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationTimerRef = useRef<number | null>(null);

    const hasData = profileData.length > 0;
    const currentDepth = hasData
        ? profileData[profileData.length - 1].depthMeters
        : 0;

    const maxDepth = useMemo(() => {
        if (!hasData) return 0;
        return Math.max(
            ...profileData.map((packet) => packet.depthMeters),
        );
    }, [hasData, profileData]);

    const chartData = profileData.map((packet) => ({
        time: packet.timestamp,
        depth: packet.depthMeters,
    }));

    const depthRangeMax = Math.max(3, Math.ceil(maxDepth + 0.5));

    const getMockMissionPackets = (): FloatMissionPacket[] => {
        const now = new Date();
        const missionDepths = [
            0.0, 0.24, 1.1, 2.45, 2.53, 2.62, 2.55, 2.38, 1.56, 0.48,
            0.42, 0.4, 0.4, 0.36, 0.55, 0.97, 1.47, 1.92, 2.27, 2.55,
            2.63, 2.68, 2.04, 1.32, 0.62, 0.47, 0.39,
        ];

        return missionDepths.map((depthMeters, index) => {
            const packetTime = new Date(
                now.getTime() + index * 5_000,
            );
            return {
                companyId: "PN01",
                timestamp: packetTime.toLocaleTimeString("en-US", {
                    hour12: false,
                }),
                pressureKpa: Number(
                    (Math.max(0, depthMeters) * 9.8).toFixed(2),
                ),
                depthMeters,
            };
        });
    };

    const runSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        const packets = getMockMissionPackets();
        let packetIndex = 0;

        simulationTimerRef.current = window.setInterval(() => {
            setProfileData((prev) => {
                if (packetIndex >= packets.length) return prev;
                return [...prev, packets[packetIndex]];
            });

            packetIndex += 1;
            if (
                packetIndex >= packets.length &&
                simulationTimerRef.current !== null
            ) {
                window.clearInterval(simulationTimerRef.current);
                simulationTimerRef.current = null;
                setIsSimulating(false);
            }
        }, 120);
    };

    const clearAllData = () => {
        if (simulationTimerRef.current !== null) {
            window.clearInterval(simulationTimerRef.current);
            simulationTimerRef.current = null;
        }
        setIsSimulating(false);
        setProfileData([]);
        events.clearFloatMissionPackets();
    };

    useEffect(() => {
        return () => {
            if (simulationTimerRef.current !== null) {
                window.clearInterval(simulationTimerRef.current);
            }
        };
    }, []);

    const getRowClassName = (depthMeters: number) => {
        if (depthMeters < 0.05) return "text-red-400";
        if (depthMeters >= 2.17 && depthMeters <= 2.83)
            return "bg-blue-500/15";
        if (depthMeters >= 0.07 && depthMeters <= 0.73)
            return "bg-emerald-500/15";
        return "";
    };

    return (
        <div className="absolute right-20 top-20 z-30 bg-black/85 p-4 rounded-xl border border-cyan-500/30 w-[34rem] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.15em] my-1">
                        Float Mission Verification
                    </h3>
                    <h1 className="text-3xl font-bold text-white">
                        {currentDepth.toFixed(1)}m
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={runSimulation}
                        disabled={isSimulating}
                        className="px-3 py-1 rounded-md border border-cyan-500/40 bg-cyan-900/30 text-xs font-bold text-cyan-300 uppercase tracking-wider disabled:opacity-50"
                    >
                        {isSimulating
                            ? "Simulating..."
                            : "Simulate Mission"}
                    </button>
                    <button
                        type="button"
                        onClick={clearAllData}
                        disabled={!hasData && !isSimulating}
                        className="px-3 py-1 rounded-md border border-red-500/40 bg-red-900/20 text-xs font-bold text-red-300 uppercase tracking-wider disabled:opacity-50"
                    >
                        Clear Data
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-slate-700/60 overflow-hidden mb-4">
                <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-900/95 z-10">
                            <tr className="text-slate-300 border-b border-slate-700/60">
                                <th className="text-left px-3 py-2">
                                    Time
                                </th>
                                <th className="text-left px-3 py-2">
                                    Company ID
                                </th>
                                <th className="text-right px-3 py-2">
                                    Pressure (kPa)
                                </th>
                                <th className="text-right px-3 py-2">
                                    Depth (m)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {profileData.map((packet, index) => (
                                <tr
                                    key={`${packet.timestamp}-${index}`}
                                    className={`border-b border-slate-800/70 ${getRowClassName(packet.depthMeters)}`}
                                >
                                    <td className="px-3 py-2 text-slate-200">
                                        {packet.timestamp}
                                    </td>
                                    <td className="px-3 py-2 text-slate-200">
                                        {packet.companyId}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-200">
                                        {packet.pressureKpa.toFixed(
                                            2,
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">
                                        {packet.depthMeters.toFixed(
                                            2,
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!hasData && (
                                <tr>
                                    <td
                                        className="px-3 py-3 text-slate-500"
                                        colSpan={4}
                                    >
                                        Waiting for float mission
                                        packets...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-300 font-semibold">
                    Total Packets Received: {profileData.length}
                </span>
                <span
                    className={`font-semibold ${profileData.length >= 20 ? "text-emerald-400" : "text-amber-400"}`}
                >
                    {profileData.length >= 20
                        ? "Graph minimum met"
                        : "Need 20+ for scoring"}
                </span>
            </div>

            <div className="w-full h-52 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    {hasData ? (
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 5,
                                right: 16,
                                bottom: 8,
                                left: 0,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e3a4d"
                                opacity={0.3}
                            />
                            <XAxis
                                dataKey="time"
                                stroke="#64748b"
                                tick={{fontSize: 10}}
                                minTickGap={24}
                            />
                            <YAxis
                                reversed
                                domain={[0, depthRangeMax]}
                                stroke="#64748b"
                                tick={{fontSize: 10}}
                                tickFormatter={(v) => `${v}m`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #334155",
                                }}
                                labelStyle={{color: "#94a3b8"}}
                                itemStyle={{color: "#38bdf8"}}
                                formatter={(value) => [
                                    `${Number(value ?? 0).toFixed(2)} m`,
                                    "Depth",
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="depth"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    fill: "#38bdf8",
                                    stroke: "#0f172a",
                                }}
                            />
                        </LineChart>
                    ) : (
                        <div className="text-gray-500 text-sm">
                            Waiting for depth data...
                        </div>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="font-medium text-gray-400">
                        Target 1 Window
                    </span>
                    <span className="font-black text-blue-300">
                        2.17m to 2.83m
                    </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="font-medium text-gray-400">
                        Target 2 Window
                    </span>
                    <span className="font-black text-emerald-300">
                        0.07m to 0.73m
                    </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="font-medium text-gray-400">
                        Surface Breach Penalty
                    </span>
                    <span className="font-black text-red-400">
                        Depth less than 0.05m
                    </span>
                </div>

                <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-400">
                        Deepest Reading
                    </span>
                    <span className="font-black text-white">
                        {maxDepth.toFixed(2)}m
                    </span>
                </div>
            </div>
        </div>
    );
}
