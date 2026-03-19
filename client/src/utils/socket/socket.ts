import {io, Socket} from "socket.io-client";
import {initializeEvents} from "./events";
import {getDefaultStore} from "jotai";
import {
    rovSensorDataAtom,
    task2GreenCrabsAtom,
    task2AIDetectionImageAtom,
    task4ProfileDataAtom,
    icebergCalculationAtom,
    icebergErrorAtom,
    icebergLoadingAtom,
} from "../../../atoms/atoms";
import type {FloatMissionPacket} from "../../../atoms/atoms";

const ServerURL = "http://localhost:4000";

export const socket: Socket = io(ServerURL, {
    autoConnect: true,
    transports: ["websocket"],
});

export const events = initializeEvents(socket);

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("float:get-history");
});

socket.on("disconnect", () => {
    console.log("Socket disconnected");
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
});

const store = getDefaultStore();
socket.on("rov:sensor-data", (data) => {
    store.set(rovSensorDataAtom, data);
});

const appendTask4Packet = (packet: FloatMissionPacket) => {
    const currentProfile = store.get(task4ProfileDataAtom);
    store.set(task4ProfileDataAtom, [...currentProfile, packet]);
};

const formatLocalTimestamp = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
        hour12: false,
    });
};

socket.on("float:history", (payload: {packets?: Partial<FloatMissionPacket>[]}) => {
    const packets = Array.isArray(payload?.packets) ? payload.packets : [];
    const normalizedPackets = packets
        .map((packet) => {
            const normalizedDepth = Number(packet.depthMeters);
            if (!Number.isFinite(normalizedDepth)) return null;

            const normalizedPressure = Number(packet.pressureKpa);
            return {
                companyId: packet.companyId?.trim() || "PN01",
                timestamp: packet.timestamp?.trim() || formatLocalTimestamp(new Date()),
                pressureKpa: Number.isFinite(normalizedPressure)
                    ? normalizedPressure
                    : Number((Math.max(0, normalizedDepth) * 9.8).toFixed(2)),
                depthMeters: normalizedDepth,
            };
        })
        .filter((packet): packet is FloatMissionPacket => packet !== null);

    store.set(task4ProfileDataAtom, normalizedPackets);
});
//..............................................................

// Task 2: AI Detection
socket.on("ai:green-crab-detected", (count: number) => {
    store.set(task2GreenCrabsAtom, count);
});

// Task 2: AI Detection Image
socket.on(
    "ai:detection-image",
    (data: {
        image: string;
        width: number;
        height: number;
        encoding: string;
    }) => {
        const dataUrl = `data:image/jpeg;base64,${data.image}`;
        store.set(task2AIDetectionImageAtom, dataUrl);
        console.log("Anything");
    },
);

// Task 4: Depth Tracking
socket.on("float:depth-update", (depth: number) => {
    appendTask4Packet({
        companyId: "PN01",
        timestamp: formatLocalTimestamp(new Date()),
        pressureKpa: Number((Math.max(0, depth) * 9.8).toFixed(2)),
        depthMeters: Number(depth.toFixed(3)),
    });
});

socket.on("float:data-packet", (packet: Partial<FloatMissionPacket>) => {
    const normalizedDepth = Number(packet.depthMeters);
    if (!Number.isFinite(normalizedDepth)) return;

    const normalizedPressure = Number(packet.pressureKpa);
    appendTask4Packet({
        companyId: packet.companyId?.trim() || "PN01",
        timestamp: packet.timestamp?.trim() || formatLocalTimestamp(new Date()),
        pressureKpa: Number.isFinite(normalizedPressure)
            ? normalizedPressure
            : Number((Math.max(0, normalizedDepth) * 9.8).toFixed(2)),
        depthMeters: normalizedDepth,
    });
});

socket.on("iceberg:result", (payload) => {
    store.set(icebergCalculationAtom, payload);
    store.set(icebergErrorAtom, null);
    store.set(icebergLoadingAtom, false);
});

socket.on("iceberg:error", (error: {message?: string}) => {
    store.set(
        icebergErrorAtom,
        error?.message || "Failed to calculate iceberg threats.",
    );
    store.set(icebergLoadingAtom, false);
});
