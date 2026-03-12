import {io, Socket} from "socket.io-client";
import {initializeEvents} from "./events";
import {getDefaultStore} from "jotai";
import {
    rovSensorDataAtom,
    task2GreenCrabsAtom,
    task2AIDetectionImageAtom,
    task4ProfileDataAtom,
} from "../../../atoms/atoms";

const ServerURL = "http://localhost:4000";

export const socket: Socket = io(ServerURL, {
    autoConnect: true,
    transports: ["websocket"],
});

export const events = initializeEvents(socket);

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
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
socket.on("rov:depth-update", (depth: number) => {
    const currentProfile = store.get(task4ProfileDataAtom);
    const newProfile = [
        ...currentProfile,
        {time: Date.now(), depth},
    ].slice(-20);
    store.set(task4ProfileDataAtom, newProfile);
});
