import {useAtom} from "jotai";
import {rovSensorDataAtom} from "../../../../atoms/atoms";
interface SensorItemProps {
    label: string;
    values: number[];
    labels: string[];
}

export default function LeftSensorsOverlay() {
    const [sensorsData] = useAtom(rovSensorDataAtom);

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

                <div className="relative w-4 h-[380px] bg-white/5 rounded-full border border-white/10 overflow-hidden backdrop-blur-sm">
                    <div
                        className="absolute top-0 left-0 w-full bg-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000 ease-in-out rounded-full"
                        style={{height: `${fillPercentage}%`}}
                    />
                </div>

                <div className="flex flex-col justify-center h-[400px] ml-2">
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-5xl font-black text-slate-900 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            {depth.toFixed(1)}
                        </span>
                        <span className="text-xl font-bold text-slate-600 mt-2 tracking-widest uppercase">
                            Meters
                        </span>
                    </div>
                </div>
            </div>

            {/* mpu */}
            <div className="space-y-1.5 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 w-52 shadow-2xl">
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
