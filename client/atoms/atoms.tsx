import {atom} from "jotai";
import {atomWithStorage} from "jotai/utils";

export const rovConnectionAtom = atomWithStorage<boolean>(
    "rov-connection",
    false,
);
export const controllerConnectionAtom = atomWithStorage<boolean>(
    "controller-connection",
    false,
);

export const controllerDataAtom = atomWithStorage<{
    axes: {
        L: number[];
        R: number[];
    };
    buttons: {
        L1: boolean;
        R1: boolean;
        A: boolean;
        X: boolean;
        B: boolean;
        Y: boolean;
        L2: number;
        R2: number;
        Sh: boolean;
        Op: boolean;
        L3: boolean;
        R3: boolean;
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
    };
}>("controller-data", {
    axes: {L: [0, 0], R: [0, 0]},
    buttons: {
        L1: false,
        R1: false,
        A: false,
        B: false,
        X: false,
        Y: false,
        L2: 0,
        R2: 0,
        Sh: false,
        Op: false,
        L3: false,
        R3: false,
        up: false,
        down: false,
        left: false,
        right: false,
    },
});

const savedTime = localStorage.getItem("competition-time");
const initialTime = savedTime ? JSON.parse(savedTime) : 0;

export const timeAtom = atom(initialTime);

export const persistedTimeAtom = atom(
    (get) => get(timeAtom),
    (get, set, update: number | ((prev: number) => number)) => {
        const newValue =
            typeof update === "function"
                ? update(get(timeAtom))
                : update;
        set(timeAtom, newValue);
        localStorage.setItem(
            "competition-time",
            JSON.stringify(newValue),
        );
    },
);

export const isRovConnectedAtom = atom(false);
export const isControllerConnectedAtom = atom(false);

export interface ROVSensorData {
    depth: number;
    mpu: {
        acc: [number, number, number];
        gyro: [number, number, number];
        angle: [number, number, number];
        temp_in: number;
    };
}

export const rovSensorDataAtom =
    atomWithStorage<ROVSensorData | null>("rov-sensor-data", null);

export type ThreatLevel = "GREEN" | "YELLOW" | "RED";

export interface IcebergInput {
    lat: number;
    lon: number;
    heading: number;
    keelDepth: number;
}

export interface IcebergPlatformResult {
    name: string;
    distance: number;
    surfaceThreatLevel: ThreatLevel;
    subseaAssetThreatLevel: ThreatLevel;
    depth: number;
}

export interface IcebergCalculationResult {
    iceberg: IcebergInput;
    results: IcebergPlatformResult[];
    timestamp: string;
}

export const icebergInputAtom = atomWithStorage<IcebergInput>(
    "iceberg-input",
    {
        lat: 0,
        lon: 0,
        heading: 0,
        keelDepth: 0,
    },
);

export const icebergCalculationAtom =
    atomWithStorage<IcebergCalculationResult | null>(
        "iceberg-calculation",
        null,
    );

export const icebergLoadingAtom = atom(false);
export const icebergErrorAtom = atom<string | null>(null);

// --- Task Specific Atoms ---
// Task 1
export interface Task1MeasurementFrame {
    url: string;
    timestamp: string;
    cam: string;
}

export const task1SnapshotsAtom = atomWithStorage<
    {url: string; timestamp: string; cam: string}[]
>("task1-snapshots", []);

export const task1MeasurementFrameAtom =
    atomWithStorage<Task1MeasurementFrame | null>(
        "task1-measurement-frame",
        null,
    );

// Task 2
export const task2GreenCrabsAtom = atom(0);
export const task2AIDetectionImageAtom = atom<string | null>(null);
export const task2KeelDepthAtom = atom(0);
export const task2ThreatLevelAtom = atom<"GREEN" | "YELLOW" | "RED">(
    "GREEN",
);
export const task2TrackingAtom = atom(false);

// Task 4
export interface FloatMissionPacket {
    companyId: string;
    timestamp: string;
    pressureKpa: number;
    depthMeters: number;
}

export const task4ProfileDataAtom = atom<FloatMissionPacket[]>([]);
export const task4MaxDepthAtom = atom(0);
export const task4AscentRateAtom = atom(0);
export const task4TargetDepthAtom = atom(3.0);
export const task4StabilityAtom = atom(98.2);
