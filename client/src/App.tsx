import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import {useEffect} from "react";
import {useSetAtom} from "jotai";
import Layout from "./components/layout";
import ControlPanel from "./pages/control-panel/page";
import Configurations from "./pages/configurations/page";
import ControllerData from "./pages/configurations/components/communication/controllerData";
import CameraFeed from "./pages/camera-feed/page";
import {isControllerConnectedAtom} from "../atoms/atoms";

export default function App() {
    const setIsControllerConnected = useSetAtom(
        isControllerConnectedAtom,
    );

    useEffect(() => {
        const checkGamepad = () => {
            if (typeof navigator.getGamepads !== "function") {
                setIsControllerConnected(false);
                return;
            }
            const gamepads = navigator.getGamepads();
            const isConnected = Array.from(gamepads).some(
                (gp) => gp !== null,
            );
            setIsControllerConnected((prev) =>
                prev === isConnected ? prev : isConnected,
            );
        };

        const handleGamepadConnected = () => checkGamepad();
        const handleGamepadDisconnected = () => checkGamepad();

        checkGamepad();
        const gamepadInterval = window.setInterval(checkGamepad, 500);
        window.addEventListener(
            "gamepadconnected",
            handleGamepadConnected,
        );
        window.addEventListener(
            "gamepaddisconnected",
            handleGamepadDisconnected,
        );

        return () => {
            clearInterval(gamepadInterval);
            window.removeEventListener(
                "gamepadconnected",
                handleGamepadConnected,
            );
            window.removeEventListener(
                "gamepaddisconnected",
                handleGamepadDisconnected,
            );
        };
    }, [setIsControllerConnected]);

    return (
        <Router>
            <ControllerData />
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route
                        index
                        element={
                            <Navigate to="/control-panel" replace />
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <Navigate to="/control-panel" replace />
                        }
                    />
                    <Route path="camera" element={<CameraFeed />} />
                    <Route
                        path="control-panel"
                        element={<ControlPanel />}
                    />
                    <Route
                        path="configurations"
                        element={<Configurations />}
                    />
                </Route>
            </Routes>
        </Router>
    );
}
