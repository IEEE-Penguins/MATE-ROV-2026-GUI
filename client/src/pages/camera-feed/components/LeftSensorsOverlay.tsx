import {useEffect} from "react";
import {useAtom, useAtomValue} from "jotai";
import {
    isControllerConnectedAtom,
    isRovConnectedAtom,
    rovSensorDataAtom,
} from "../../../../atoms/atoms";
import ConnectionButton from "../../../components/connection/connection-button";
import {events, socket} from "../../../utils/socket/socket";

interface SensorItemProps {
    label: string;
    values: number[];
    labels: string[];
}

const ROS_BRIDGE_URL = "ws://192.168.1.100:9090";

export default function LeftSensorsOverlay() {
    const sensorsData = useAtomValue(rovSensorDataAtom);
    const [isRovConnected, setIsRovConnected] = useAtom(
        isRovConnectedAtom,
    );
    const isControllerConnected = useAtomValue(
        isControllerConnectedAtom,
    );

    const depth = sensorsData?.depth ?? 0.0;
    const acc = Array.isArray(sensorsData?.mpu?.acc)
        ? sensorsData.mpu.acc
        : [0, 0, 0];
    const gyro = Array.isArray(sensorsData?.mpu?.gyro)
        ? sensorsData.mpu.gyro
        : [0, 0, 0];
    const angle = Array.isArray(sensorsData?.mpu?.angle)
        ? sensorsData.mpu.angle
        : [0, 0, 0];
    const tempIn = sensorsData?.mpu?.temp_in ?? 0;

    const maxDepth = 5;
    const fillPercentage = (depth / maxDepth) * 100;

    useEffect(() => {
        const handleRosBridgeConnectionStatus = (status: {
            status: "connected" | "disconnected" | "error";
        }) => {
            setIsRovConnected(status.status === "connected");
        };

        socket.on("rov:connection-status", handleRosBridgeConnectionStatus);
        events.checkRosBridgeStatus();

        return () => {
            socket.off(
                "rov:connection-status",
                handleRosBridgeConnectionStatus,
            );
        };
    }, [setIsRovConnected]);

    const handleRosButtonClick = () => {
        if (isRovConnected) {
            events.disconnectFromRosBridge();
            return;
        }

        events.connectToRosBridge(ROS_BRIDGE_URL);
    };

    return (
        <div className="absolute left-4 top-20 z-40 flex flex-col gap-0.5 select-none">
            <span className="text-white font-black text-sm tracking-widest mb-0.5 uppercase">
                Depth
            </span>

            <div className="relative flex items-start gap-2">
                <div className="flex flex-col h-[380px]">
                    <div className="flex-1 flex flex-col justify-between text-sm font-bold text-gray-300 pb-1">
                        <span>0m</span>
                        <span>1m</span>
                        <span>2m</span>
                        <span>3m</span>
                        <span>4m</span>
                        <span>5m</span>
                    </div>
                </div>

                <div className="relative w-4 h-[380px] bg-white/5 rounded-full border border-white/60 overflow-hidden backdrop-blur-sm">
                    <div
                        className="absolute top-0 left-0 w-full bg-[#00013F] shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000 ease-in-out rounded-full"
                        style={{height: `${fillPercentage}%`}}
                    />
                </div>

                <div className="flex flex-col justify-center h-[400px] ml-2">
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-5xl font-black text-[#00013F] drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            {depth.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-white mt-2 tracking-widest uppercase">
                            Meters
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/5 w-72 shadow-2xl">
                <SensorItem
                    label="MPU (Acceleration)"
                    values={acc}
                    labels={["X", "Y", "Z"]}
                />
                <SensorItem
                    label="MPU (Rotation)"
                    values={gyro}
                    labels={["X", "Y", "Z"]}
                />
                <SensorItem
                    label="MPU (Angle)"
                    values={angle}
                    labels={["X", "Y", "Z"]}
                />
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter">
                        Temperature
                    </span>
                    <span className="text-cyan-400 font-black">
                        {tempIn.toFixed(2)} °C
                    </span>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                ROS 192.168.1.100
                            </p>
                            <p
                                className={`text-xs font-semibold ${
                                    isRovConnected
                                        ? "text-cyan-300"
                                        : "text-gray-400"
                                }`}
                            >
                                {isRovConnected
                                    ? "Connected"
                                    : "Disconnected"}
                            </p>
                        </div>
                        <ConnectionButton
                            label={isRovConnected
                                ? "Disconnect"
                                : "Connect"}
                            connected={isRovConnected}
                            onClick={handleRosButtonClick}
                            className="w-28 py-2 text-xs"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Controller
                            </p>
                            <p
                                className={`text-xs font-semibold ${
                                    isControllerConnected
                                        ? "text-cyan-300"
                                        : "text-gray-400"
                                }`}
                            >
                                {isControllerConnected
                                    ? "Connected"
                                    : "Disconnected"}
                            </p>
                        </div>
                        <ConnectionButton
                            label={
                                isControllerConnected
                                    ? "Connected"
                                    : "Disconnected"
                            }
                            connected={isControllerConnected}
                            onClick={() => {}}
                            disabled
                            className="w-28 py-2 text-xs"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SensorItem({label, values, labels}: SensorItemProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {label}
            </span>
            <div className="flex gap-4 text-xs font-mono text-white/80">
                {values.map((v: number, i: number) => (
                    <span key={i}>
                        <span className="text-cyan-600 font-bold">
                            {labels[i]}:
                        </span>{" "}
                        {v.toFixed(2)}
                    </span>
                ))}
            </div>
        </div>
    );
}
