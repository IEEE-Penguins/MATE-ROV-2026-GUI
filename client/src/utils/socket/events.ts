import {Socket} from "socket.io-client";

export const initializeEvents = (socket: Socket) => ({
    /**
     * Connects to ROS Bridge at the specified WebSocket URL
     * @param rosBridgeUrl - WebSocket URL (e.g., 'ws://192.168.1.100:9090')
     */
    connectToRosBridge: (rosBridgeUrl: string) => {
        if (!rosBridgeUrl) {
            console.error(
                "connectToRosBridge: No ROS Bridge URL provided",
            );
            return;
        }
        socket.emit("rov:connect", rosBridgeUrl);
    },

    /**
     * Disconnects from ROS Bridge
     */
    disconnectFromRosBridge: () => {
        socket.emit("rov:disconnect");
    },

    /**
     * Checks the current ROS Bridge connection status
     */
    checkRosBridgeStatus: () => {
        socket.emit("rov:connection-status");
    },

    /**
     * Retrieves the current ROV configuration from the server
     */
    getRovConfiguration: () => {
        socket.emit("config:get");
    },

    /**
     * Updates the ROV configuration on the server
     * @param config - Configuration object to update
     */
    updateRovConfiguration: (config: object) => {
        socket.emit("config:update", config);
    },

    /**
     * Tests a specific thruster with a given value
     * @param thrusterIndex - Index of the thruster to test (0-5)
     * @param value - Power value (-100 to 100)
     */
    testThruster: (thrusterIndex: number, value: number) => {
        socket.emit("config:thruster-test", {thrusterIndex, value});
    },

    /**
     * Tests a specific gripper with a given value
     * @param gripperIndex - Index of the gripper to test (1-2)
     * @param value - Servo value (-1 to 1)
     */
    testGripper: (gripperIndex: number, value: number) => {
        socket.emit("config:gripper-test", {gripperIndex, value});
    },

    /**
     * Sends controller input data to the server for ROV control
     * @param controllerData - Controller input data (axes, buttons)
     */
    sendControllerData: (controllerData: object) => {
        socket.emit("controller:data", controllerData);
    },

    /**
     * Clears all persisted float mission packets on server.
     */
    clearFloatMissionPackets: () => {
        socket.emit("float:clear-history");
    },

    /**
     * Calculates iceberg threats against reference platforms
     */
    calculateIcebergThreats: (iceberg: {
        lat: number;
        lon: number;
        heading: number;
        keelDepth: number;
        rawInput?: {
            latitude: {
                degrees: number;
                minutes: number;
                seconds: number;
                direction: "N" | "S";
            };
            longitude: {
                degrees: number;
                minutes: number;
                seconds: number;
                direction: "E" | "W";
            };
            heading: number;
            keelDepth: number;
        };
    }) => {
        socket.emit("iceberg:calculate", iceberg);
    },

    /**
     * Requests the most recently saved iceberg calculation result
     */
    getLastIcebergThreats: () => {
        socket.emit("iceberg:get-last-result");
    },

    // Legacy method names for backward compatibility
    /** @deprecated Use checkRosBridgeStatus instead */
    isRovConnected: () => {
        socket.emit("rov:connection-status");
    },

    /** @deprecated Use connectToRosBridge instead */
    connectToRov: (rosBridgeUrl: string) => {
        if (!rosBridgeUrl) {
            console.error("connectToRov: No ROS Bridge URL provided");
            return;
        }
        socket.emit("rov:connect", rosBridgeUrl);
    },

    /** @deprecated Use disconnectFromRosBridge instead */
    disconnectFromRov: () => {
        socket.emit("rov:disconnect");
    },

    /** @deprecated Use getRovConfiguration instead */
    getRovConfig: () => {
        socket.emit("config:get");
    },

    /** @deprecated Use updateRovConfiguration instead */
    updateRovConfig: (config: object) => {
        socket.emit("config:update", config);
    },

    /** @deprecated Use testThruster instead */
    emitThrusterTest: (thrusterIndex: number, value: number) => {
        socket.emit("config:thruster-test", {thrusterIndex, value});
    },

    /** @deprecated Use testGripper instead */
    emitGripperTest: (gripperIndex: number, value: number) => {
        socket.emit("config:gripper-test", {gripperIndex, value});
    },

    /** @deprecated Use sendControllerData instead */
    emitControllerData: (controllerData: object) => {
        socket.emit("controller:data", controllerData);
    },
});
