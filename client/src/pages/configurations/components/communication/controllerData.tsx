import {useEffect, useRef, useState} from "react";
import {
    isControllerConnectedAtom,
    controllerDataAtom,
} from "../../../../../atoms/atoms";
import {useSetAtom} from "jotai";
import {useAtomValue} from "jotai";
import {events} from "../../../../utils/socket/socket";

const threshold = 0.1;
const POLL_INTERVAL_MS = 50;

type ControllerPayload = {
    axes: {
        L: [number, number];
        R: [number, number];
    };
    buttons: {
        A: boolean;
        B: boolean;
        X: boolean;
        Y: boolean;
        L1: boolean;
        R1: boolean;
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
};

const normalizeAxis = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    const rounded = Number(value.toFixed(2));
    return Math.abs(rounded) > threshold ? rounded : 0;
};

const normalizeTrigger = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return Number(value.toFixed(2));
};

const arePayloadsEqual = (
    a: ControllerPayload | null,
    b: ControllerPayload,
) => !!a && JSON.stringify(a) === JSON.stringify(b);

export default function ControllerData() {
    const isConnected = useAtomValue(isControllerConnectedAtom);
    const setControllerData = useSetAtom(controllerDataAtom);
    const [gamepadIndex, setGamepadIndex] = useState<number | null>(
        null,
    );
    const lastPayloadRef = useRef<ControllerPayload | null>(null);

    useEffect(() => {
        const connectHandler = (e: GamepadEvent) => {
            console.log("Gamepad connected:", e.gamepad);
            setGamepadIndex(e.gamepad.index);
        };

        const disconnectHandler = (e: GamepadEvent) => {
            console.log("Gamepad disconnected:", e.gamepad);
            setGamepadIndex(null);
        };

        window.addEventListener("gamepadconnected", connectHandler);
        window.addEventListener(
            "gamepaddisconnected",
            disconnectHandler,
        );

        return () => {
            window.removeEventListener(
                "gamepadconnected",
                connectHandler,
            );
            window.removeEventListener(
                "gamepaddisconnected",
                disconnectHandler,
            );
        };
    }, []);

    useEffect(() => {
        if (
            !isConnected ||
            typeof navigator.getGamepads !== "function"
        ) {
            return;
        }

        const resolveGamepad = () => {
            const gamepads = navigator.getGamepads();

            if (gamepadIndex !== null && gamepads[gamepadIndex]) {
                return gamepads[gamepadIndex];
            }

            for (const gp of gamepads) {
                if (gp) return gp;
            }

            return null;
        };

        const pollGamepad = () => {
            const gp = resolveGamepad();

            if (gp) {
                const newControllerData: ControllerPayload = {
                    axes: {
                        L: [
                            normalizeAxis(gp.axes[0]),
                            normalizeAxis(gp.axes[1]),
                        ],
                        R: [
                            normalizeAxis(gp.axes[2]),
                            normalizeAxis(gp.axes[3]),
                        ],
                    },
                    buttons: {
                        A: Boolean(gp.buttons[0]?.pressed),
                        B: Boolean(gp.buttons[1]?.pressed),
                        X: Boolean(gp.buttons[2]?.pressed),
                        Y: Boolean(gp.buttons[3]?.pressed),
                        L1: Boolean(gp.buttons[4]?.pressed),
                        R1: Boolean(gp.buttons[5]?.pressed),
                        L2: normalizeTrigger(gp.buttons[6]?.value),
                        R2: normalizeTrigger(gp.buttons[7]?.value),
                        Sh: Boolean(gp.buttons[8]?.pressed),
                        Op: Boolean(gp.buttons[9]?.pressed),
                        L3: Boolean(gp.buttons[10]?.pressed),
                        R3: Boolean(gp.buttons[11]?.pressed),
                        up: Boolean(gp.buttons[12]?.pressed),
                        down: Boolean(gp.buttons[13]?.pressed),
                        left: Boolean(gp.buttons[14]?.pressed),
                        right: Boolean(gp.buttons[15]?.pressed),
                    },
                };

                if (
                    !arePayloadsEqual(
                        lastPayloadRef.current,
                        newControllerData,
                    )
                ) {
                    lastPayloadRef.current = newControllerData;
                    setControllerData(newControllerData);
                    events.emitControllerData(newControllerData);
                }
            }
        };

        pollGamepad();
        const intervalId = window.setInterval(
            pollGamepad,
            POLL_INTERVAL_MS,
        );

        return () => {
            clearInterval(intervalId);
        };
    }, [isConnected, gamepadIndex, setControllerData]);

    return null;
}
