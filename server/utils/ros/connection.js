const ROSLIB = require("roslib");

const DEFAULT_ROS_BRIDGE_URL = "ws://localhost:9090";
const COMMAND_TOPIC_NAME = "/rov/command";
const SENSORS_TOPIC_NAME = "/rov/sensors";
const AI_TOPIC_NAME = "/crab_count";
const AI_DETECTION_TOPIC_NAME = "/AI_Detection";


const COMMAND_MESSAGE_TYPE = "std_msgs/String";
const SENSORS_MESSAGE_TYPE = "std_msgs/String";
const AI_MESSAGE_TYPE = "std_msgs/Int32";
const AI_DETECTION_MESSAGE_TYPE = "sensor_msgs/CompressedImage";

let ros = null;
let commandPublisher = null;
let sensorsSubscriber = null;
let aiSubscriber = null;
let aiDetectionSubscriber = null;
let isRosBridgeReady = false;
let currentRosBridgeUrl = null;
let io = null;

/**
 * Logs a message and emits it to connected clients via Socket.IO
 * @param {string} message - The message to log
 */
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[ROS Bridge] ${message}`);
    if (io) {
        io.emit("rov:log", { timestamp, message });
    }
};

/**
 * Emits connection status to all connected clients
 * @param {string} status - Connection status ('connected', 'disconnected', 'error')
 * @param {string} message - Status message
 * @param {string|null} url - ROS Bridge URL
 */
const emitConnectionStatus = (status, message, url = null) => {
    const payload = { status, message };
    if (url) payload.url = url;
    if (io) {
        io.emit("rov:connection-status", payload);
    }
};

/**
 * Handles sensor data received from ROS
 * @param {object} message - The sensor data message from ROS
 */
const handleSensorData = (message) => {
    try {
        const sensorData = JSON.parse(message.data);
        if (io) {
            io.emit("rov:sensor-data", sensorData);
        }
    } catch (error) {
        log(`Error parsing sensor data: ${error.message}`);
    }
};



/**
 * Handles AI detection image received from ROS
 * Converts sensor_msgs/Image to a base64 data URL and emits it
 * @param {object} message - The image message from ROS (sensor_msgs/Image)
 */
const handleAIDetectionImage = (message) => {
    try {
        const { data, format } = message;

        if (!data) {
            log("Received empty AI detection image data.");
            return;
        }

        let imageBuffer;

        if (typeof data === "string") {
            imageBuffer = Buffer.from(data, "base64");
        } else if (Array.isArray(data)) {
            imageBuffer = Buffer.from(data);
        } else {
            console.log("Unsupported AI detection image data format");
        }

        const normalizedFormat =
            typeof format === "string" ? format.toLowerCase() : "";

        const mimeType = normalizedFormat.includes("png")
            ? "image/png"
            : "image/jpeg";

        const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

        if (io) {
            io.emit("ai:detection-image", {
                image: dataUrl,
            });
        }
    } catch (error) {
        log(`Error processing AI detection image: ${error.message}`);
    }
};

/**
 * Handles AI data received from ROS
 * @param {object} message - The AI data message from ROS
 */
const handleAIData = (message) => {
    try {
        const numberOfGreenCrabs = JSON.parse(message.data);
        if (io) {
            io.emit("ai:green-crab-detected", numberOfGreenCrabs);
        }
    } catch (error) {
        log(`Error parsing AI data: ${error.message}`);
    }
};

/**
 * Publishes command data to the ROS rov/command topic
 * @param {object} commandData - Command data containing esc, servo, lights
 */
const publishCommand = (commandData) => {
    if (!isRosBridgeReady || !commandPublisher) {
        return;
    }

    try {
        const message = new ROSLIB.Message({
            data: JSON.stringify(commandData),
        });
        commandPublisher.publish(message);
    } catch (error) {
        log(`Error publishing command: ${error.message}`);
    }
};

/**
 * Resets the connection state
 */
const resetConnectionState = () => {
    isRosBridgeReady = false;
    ros = null;
    commandPublisher = null;
    sensorsSubscriber = null;
    aiSubscriber = null;
    aiDetectionSubscriber = null;
    currentRosBridgeUrl = null;
};

/**
 * Disconnects from ROS Bridge
 */
const disconnectFromRosBridge = () => {
    if (!ros) {
        log("Already disconnected from ROS Bridge.");
        return;
    }

    try {
        if (sensorsSubscriber) {
            sensorsSubscriber.unsubscribe();
        }
        if (aiSubscriber) {
            aiSubscriber.unsubscribe();
        }
        if (aiDetectionSubscriber) {
            aiDetectionSubscriber.unsubscribe();
        }
        if (ros) {
            ros.close();
        }
        resetConnectionState();
        log("Disconnected from ROS Bridge.");
        emitConnectionStatus("disconnected", "ROS Bridge has been disconnected.");
    } catch (error) {
        log(`Error disconnecting from ROS Bridge: ${error.message}`);
        resetConnectionState();
    }
};

/**
 * Sets up ROS Bridge connection event handlers
 * @param {string} url - ROS Bridge WebSocket URL
 */
const setupRosEventHandlers = (url) => {
    ros.on("connection", () => {
        isRosBridgeReady = true;
        log(`Successfully connected to ROS Bridge at ${url}`);
        emitConnectionStatus("connected", `ROS Bridge connected at ${url}`, url);

        // Setup command publisher
        commandPublisher = new ROSLIB.Topic({
            ros: ros,
            name: COMMAND_TOPIC_NAME,
            messageType: COMMAND_MESSAGE_TYPE,
        });

        // Setup sensor data subscriber
        sensorsSubscriber = new ROSLIB.Topic({
            ros: ros,
            name: SENSORS_TOPIC_NAME,
            messageType: SENSORS_MESSAGE_TYPE,
        });

        // Setup AI data subscriber
        aiSubscriber = new ROSLIB.Topic({
            ros: ros,
            name: AI_TOPIC_NAME,
            messageType: AI_MESSAGE_TYPE,
        });

        // Setup AI detection image subscriber
        aiDetectionSubscriber = new ROSLIB.Topic({
            ros: ros,
            name: AI_DETECTION_TOPIC_NAME,
            messageType: AI_DETECTION_MESSAGE_TYPE,
        });

        sensorsSubscriber.subscribe(handleSensorData);
        aiSubscriber.subscribe(handleAIData);
        aiDetectionSubscriber.subscribe(handleAIDetectionImage);
        log(`Subscribed to ${SENSORS_TOPIC_NAME} topic`);
        log(`Subscribed to ${AI_TOPIC_NAME} topic`);
        log(`Subscribed to ${AI_DETECTION_TOPIC_NAME} topic`);
        log(`Publishing to ${COMMAND_TOPIC_NAME} topic`);
    });

    ros.on("error", (error) => {
        log(`ROS Bridge Error: ${error}`);
        isRosBridgeReady = false;
        emitConnectionStatus("error", `Error with ROS Bridge: ${error}`);
    });

    ros.on("close", () => {
        isRosBridgeReady = false;
        if (currentRosBridgeUrl) {
            log(`Connection to ${currentRosBridgeUrl} closed.`);
            emitConnectionStatus("disconnected", "ROS Bridge connection closed.");
        }
        resetConnectionState();
    });
};

/**
 * Connects to ROS Bridge at the specified URL
 * @param {string} url - ROS Bridge WebSocket URL (e.g., 'ws://localhost:9090')
 */
const connectToRosBridge = (url) => {
    if (isRosBridgeReady) {
        log("Already connected to ROS Bridge. Disconnect first.");
        return;
    }

    const rosBridgeUrl = url || DEFAULT_ROS_BRIDGE_URL;
    currentRosBridgeUrl = rosBridgeUrl;

    try {
        log(`Attempting to connect to ROS Bridge at ${rosBridgeUrl}...`);
        ros = new ROSLIB.Ros({
            url: rosBridgeUrl,
        });

        setupRosEventHandlers(rosBridgeUrl);
    } catch (error) {
        log(`Error connecting to ROS Bridge: ${error.message}`);
        emitConnectionStatus("error", `Failed to connect: ${error.message}`);
        resetConnectionState();
    }
};

/**
 * Checks if ROS Bridge is connected and ready
 * @returns {boolean} Connection status
 */
const isRosReady = () => isRosBridgeReady;

/**
 * Gets the current ROS Bridge URL
 * @returns {string|null} Current ROS Bridge URL or null if not connected
 */
const getCurrentUrl = () => currentRosBridgeUrl;

/**
 * Initializes the ROS Bridge connection module with Socket.IO instance
 * @param {object} socketIo - Socket.IO server instance
 */
const initialize = (socketIo) => {
    io = socketIo;
    log("ROS Bridge connection module initialized.");
};

module.exports = {
    api: {
        initialize,
        connectToRosBridge,
        disconnectFromRosBridge,
        publishCommand,
        isRosReady,
        getCurrentUrl,
    },
};
