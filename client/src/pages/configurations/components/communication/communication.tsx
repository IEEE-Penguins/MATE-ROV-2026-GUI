import {useEffect, useState} from "react";
import {socket, events} from "../../../../utils/socket/socket";
import Card from "../../../../components/card";
import Connection from "../../../../components/connection/connection";
import ActionButton from "./ActionButton";
import Logs from "./Logs";
import {useAtom} from "jotai";
import {
    isRovConnectedAtom,
    isControllerConnectedAtom,
} from "../../../../../atoms/atoms";

const DEFAULT_ROS_BRIDGE_URLS = [
    "ws://localhost:9090",
    "ws://192.168.1.100:9090",
    "ws://10.0.0.1:9090",
];

export default function Communication() {
    // --- Local State Management ---
    const [logs, setLogs] = useState<string[]>([]);
    const [rosBridgeUrl, setRosBridgeUrl] = useState(
        "ws://192.168.1.100:9090",
    );
    const [customUrl, setCustomUrl] = useState("");
    const [isRovConnected, setIsRovConnected] = useAtom(
        isRovConnectedAtom,
    );
    const [isControllerConnected] = useAtom(
        isControllerConnectedAtom,
    );

    /**
     * Adds a log message to the logs array
     * @param message - The message to log
     */
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const formattedLog = `[${timestamp}] ${message}`;
        setLogs((prev) => [...prev.slice(-20), formattedLog]);
    };

    /**
     * Main effect hook for managing socket event listeners
     */
    useEffect(() => {
        // --- Socket Event Handlers ---
        const handleLogMessage = (log: {message: string}) => {
            addLog(log.message);
        };

        const handleRosBridgeConnectionStatus = (status: {
            status: "connected" | "disconnected" | "error";
            message: string;
            url?: string;
        }) => {
            setIsRovConnected(status.status === "connected");
            addLog(status.message);
            if (status.url) {
                setRosBridgeUrl(status.url);
            }
        };

        const handleError = (error: {
            message: string;
            error?: string;
        }) => {
            const errorMsg = error.error
                ? `${error.message}: ${error.error}`
                : error.message;
            addLog(`ERROR: ${errorMsg}`);
        };

        // --- Register Socket Listeners ---
        socket.on("rov:log", handleLogMessage);
        socket.on("rov:error", handleError);
        socket.on(
            "rov:connection-status",
            handleRosBridgeConnectionStatus,
        );

        // Check initial connection status
        events.checkRosBridgeStatus();
        addLog("Communication module initialized");

        // --- Cleanup Function ---
        return () => {
            socket.off("rov:log", handleLogMessage);
            socket.off("rov:error", handleError);
            socket.off(
                "rov:connection-status",
                handleRosBridgeConnectionStatus,
            );
        };
    }, [setIsRovConnected]);

    // --- Action Handlers ---
    const handleRosBridgeConnect = () => {
        const urlToConnect = customUrl.trim() || rosBridgeUrl;

        if (!urlToConnect) {
            addLog("Please enter a ROS Bridge URL");
            return;
        }

        // Validate URL format
        if (
            !urlToConnect.startsWith("ws://") &&
            !urlToConnect.startsWith("wss://")
        ) {
            addLog(
                "Invalid URL format. Must start with ws:// or wss://",
            );
            return;
        }

        addLog(`Connecting to ROS Bridge at ${urlToConnect}...`);
        events.connectToRosBridge(urlToConnect);
    };

    const handleRosBridgeDisconnect = () => {
        addLog("Disconnecting from ROS Bridge...");
        events.disconnectFromRosBridge();
    };

    const handleCheckStatus = () => {
        addLog("Checking ROS Bridge connection status...");
        events.checkRosBridgeStatus();
    };

    return (
        <Card title="Communication Configuration">
            <Connection
                rovConnected={isRovConnected}
                controllerConnected={isControllerConnected}
                onRovConnect={handleRosBridgeConnect}
                onRovDisconnect={handleRosBridgeDisconnect}
            />
            <div className="h-4" />

            <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between w-full">
                    <span className="text-white text-m font-bold">
                        ROS Bridge URL
                    </span>
                </div>

                {/* Quick Select URLs */}
                <div className="flex flex-col gap-2">
                    {DEFAULT_ROS_BRIDGE_URLS.map((url) => (
                        <button
                            key={url}
                            onClick={() => {
                                setRosBridgeUrl(url);
                                setCustomUrl("");
                            }}
                            className={`px-3 py-2 rounded text-sm transition-colors ${
                                rosBridgeUrl === url && !customUrl
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                            }`}
                        >
                            {url}
                        </button>
                    ))}
                </div>

                {/* Custom URL Input */}
                <div className="flex flex-col gap-2">
                    <span className="text-gray-300 text-sm">
                        Custom URL:
                    </span>
                    <input
                        type="text"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="ws://your-ip:9090"
                        className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <div className="h-4" />

            <ActionButton
                label="Check Connection Status"
                onClick={handleCheckStatus}
            />

            <div className="h-4" />

            <Logs logMessages={logs} />
        </Card>
    );
}
