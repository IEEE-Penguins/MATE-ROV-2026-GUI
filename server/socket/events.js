const rosBridgeConnection = require("../utils/ros/connection");
const fs = require("fs");
const path = require("path");
const platforms = require("../data/iceberg.json");

const EARTH_RADIUS_NM = 3440.065;
const icebergResultPath = path.join(__dirname, "../data/icebergResult.json");

const SENSITIVITY_VALUES = {
  High: 1.0,
  Normal: 0.75,
  Low: 0.5,
};

const YAW_SENSITIVITY_VALUES = {
  High: 1.0,
  Normal: 0.7,
  Low: 0.4,
};

let rovConfiguration = {
  thrusters: [
    { location: "top", enabled: true, reversed: false },
    { location: "frontLeft", enabled: true, reversed: false },
    { location: "backLeft", enabled: true, reversed: false },
    { location: "frontRight", enabled: true, reversed: false },
    { location: "backRight", enabled: true, reversed: false },
  ],
  grippers: [
    { location: "front", enabled: true },
    { location: "back", enabled: true },
  ],
  sensors: [
    { type: "depth", enabled: true },
    { type: "temperature", enabled: true },
    { type: "acceleration", enabled: true },
    { type: "rotation", enabled: true },
  ],
  sensitivity: {
    joystick: "High",
    yaw: "High",
  },
};

/**
 * Gets sensitivity scalar values from configuration
 * @param {object} config - ROV configuration
 * @returns {object} Sensitivity scalars for joystick and yaw
 */
const getSensitivityScalars = (config) => ({
  joystick: SENSITIVITY_VALUES[config.sensitivity.joystick] || SENSITIVITY_VALUES.High,
  yaw: YAW_SENSITIVITY_VALUES[config.sensitivity.yaw] || YAW_SENSITIVITY_VALUES.High,
});

/**
 * Calculates movement intents from controller readings
 * @param {object} controllerReadings - Controller input data
 * @param {object} sensitivity - Sensitivity scalars
 * @returns {object} Movement intents (surge, sway, yaw, heave)
 */
const calculateMovementIntents = (controllerReadings, sensitivity) => ({
  surge: (controllerReadings.axes.L[1] || 0) * sensitivity.joystick,
  sway: 0,
  yaw: (-(controllerReadings.buttons.R2 || 0) + (controllerReadings.buttons.L2 || 0)) * sensitivity.yaw,
  heave: (controllerReadings.axes.R[1] || 0) * -1 * sensitivity.joystick,
});

/**
 * Calculates thruster power based on location and movement intents
 * @param {string} location - Thruster location
 * @param {object} intents - Movement intents
 * @returns {number} Thruster power value
 */
const calculateThrusterPower = (location, intents) => {
  switch (location) {
    case "top":
      return intents.heave;
    case "frontLeft":
      return intents.sway + intents.yaw + intents.surge;
    case "frontRight":
      return -intents.surge + intents.sway - intents.yaw;
    case "backLeft":
      return -intents.surge - intents.sway + intents.yaw;
    case "backRight":
      return intents.surge + intents.sway + intents.yaw;
    default:
      return 0.0;
  }
};

/**
 * Clamps power value between -1.0 and 1.0
 * @param {number} power - Power value
 * @returns {number} Clamped power value
 */
const clampPower = (power) => Math.max(-1.0, Math.min(1.0, power));

/**
 * Applies thruster configuration (enabled/reversed) to power value
 * @param {number} power - Raw power value
 * @param {object} thrusterConfig - Thruster configuration
 * @returns {number} Configured power value
 */
const applyThrusterConfig = (power, thrusterConfig) => {
  if (!thrusterConfig.enabled) return 0.0;
  if (thrusterConfig.reversed) power = -power;
  if (power === -0) power = 0;

  return clampPower(power);
};

/**
 * Maps thruster configuration to power array
 * @param {object} config - ROV configuration
 * @param {object} intents - Movement intents
 * @returns {number[]} Array of thruster power values
 */
const mapThrusters = (config, intents) => {
  return config.thrusters.map((thrusterConfig) => {
    const power = calculateThrusterPower(thrusterConfig.location, intents);
    return applyThrusterConfig(power, thrusterConfig);
  });
};

/**
 * Maps gripper controls from controller readings
 * @param {object} controllerReadings - Controller input data
 * @param {object} config - ROV configuration
 * @returns {number[]} Array of servo values
 */
const mapGrippers = (controllerReadings, config) => {
  const servo = [0, 0, 0, 0];

  if (config.grippers[0].enabled) {
    if (controllerReadings.buttons.Y) servo[0] = 1;
    if (controllerReadings.buttons.A) servo[0] = -1;
    if (controllerReadings.buttons.B) servo[1] = 1;
    if (controllerReadings.buttons.X) servo[1] = -1;
  }

  if (config.grippers[1].enabled) {
    if (controllerReadings.buttons.up) servo[2] = 1;
    if (controllerReadings.buttons.down) servo[2] = -1;
    if (controllerReadings.buttons.left) servo[3] = 1;
    if (controllerReadings.buttons.right) servo[3] = -1;
  }

  return servo;
};

/**
 * Maps light controls from controller readings
 * @param {object} controllerReadings - Controller input data
 * @returns {number[]} Array of light values
 */
const mapLights = (controllerReadings) => {
  if (controllerReadings.buttons.R1) return [1, 1];
  return [0, 0];
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Calculates distance in nautical miles using Haversine formula.
 * Earth radius in NM is 3440.065.
 */
const calculateDistanceNm = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
};

/**
 * Applies the exact surface and subsea threat rules for one platform.
 */
const calculateThreats = (iceberg, platform) => {
  const distance = calculateDistanceNm(iceberg.lat, iceberg.lon, platform.lat, platform.lon);

  const calculateSurfaceThreat = () => {
    const depthRatio = iceberg.keelDepth / platform.depth;
    if (depthRatio >= 1.1) return "GREEN";
    if (distance < 5) return "RED";
    if (distance >= 5 && distance <= 10) return "YELLOW";
    return "GREEN";
  };

  const calculateSubseaThreat = () => {
    if (distance > 25) return "GREEN";
    const depthRatio = iceberg.keelDepth / platform.depth;
    if (depthRatio >= 1.1) return "GREEN";
    if (depthRatio >= 0.9 && depthRatio < 1.1) return "RED";
    if (depthRatio >= 0.7 && depthRatio < 0.9) return "YELLOW";
    return "GREEN";
  };

  return {
    platformName: platform.name,
    distance,
    surfaceThreatLevel: calculateSurfaceThreat(),
    subseaAssetThreatLevel: calculateSubseaThreat(),
  };
};

const persistIcebergResult = (payload) => {
  fs.writeFileSync(icebergResultPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
};

const getPersistedIcebergResult = () => {
  if (!fs.existsSync(icebergResultPath)) return null;
  const raw = fs.readFileSync(icebergResultPath, "utf-8");
  if (!raw.trim()) return null;
  return JSON.parse(raw);
};

const isValidIcebergPayload = (iceberg) => {
  return iceberg
    && Number.isFinite(Number(iceberg.lat))
    && Number.isFinite(Number(iceberg.lon))
    && Number.isFinite(Number(iceberg.heading))
    && Number.isFinite(Number(iceberg.keelDepth));
};

/**
 * Maps controller input to ROV command
 * @param {object} controllerReadings - Controller input data
 * @param {object} config - ROV configuration
 * @returns {object} Command object with esc, servo, and lights
 */
function mapControllerToCommand(controllerReadings, config) {
  const sensitivity = getSensitivityScalars(config);
  const intents = calculateMovementIntents(controllerReadings, sensitivity);

  return {
    esc: mapThrusters(config, intents),
    servo: mapGrippers(controllerReadings, config),
    lights: mapLights(controllerReadings),
  };
}

/**
 * Registers Socket.IO event handlers for ROV communication
 * @param {object} io - Socket.IO server instance
 * @param {object} socket - Socket.IO socket instance
 */
const registerEventHandlers = (io, socket) => {
  const rosApi = () => rosBridgeConnection.api;

  // Check ROS Bridge connection status
  socket.on("rov:connection-status", () => {
    const api = rosApi();
    const isReady = api.isRosReady();
    io.emit("rov:connection-status", {
      status: isReady ? "connected" : "disconnected",
      message: isReady ? "ROS Bridge is connected." : "ROS Bridge is disconnected.",
      url: api.getCurrentUrl(),
    });
  });

  // Connect to ROS Bridge
  socket.on("rov:connect", (rosBridgeUrl) => {
    const api = rosApi();
    if (!api) return socket.emit("rov:error", { message: "ROS Bridge module not ready." });
    if (!rosBridgeUrl) return socket.emit("rov:error", { message: "No ROS Bridge URL was provided." });
    api.connectToRosBridge(rosBridgeUrl);
  });

  // Disconnect from ROS Bridge
  socket.on("rov:disconnect", () => {
    const api = rosApi();
    if (api) api.disconnectFromRosBridge();
  });

  // Handle controller data and publish command to ROS
  socket.on("controller:data", (controllerReadings) => {
    const api = rosApi();
    if (!api || !api.isRosReady()) return;

    const command = mapControllerToCommand(controllerReadings, rovConfiguration);
    api.publishCommand(command);
  });

  // Get current configuration
  socket.on("config:get", () => {
    socket.emit("config:data", rovConfiguration);
  });

  // Update configuration
  socket.on("config:update", (newConfig) => {
    rovConfiguration = { ...rovConfiguration, ...newConfig };
    socket.emit("config:updated", {
      success: true,
      newConfig: rovConfiguration,
    });
  });

  socket.on("iceberg:get-last-result", () => {
    try {
      const savedResult = getPersistedIcebergResult();
      if (savedResult) {
        socket.emit("iceberg:result", savedResult);
      }
    } catch (error) {
      socket.emit("iceberg:error", {
        message: "Failed to load saved iceberg result.",
      });
    }
  });

  socket.on("iceberg:calculate", (icebergInput) => {
    try {
      if (!isValidIcebergPayload(icebergInput)) {
        socket.emit("iceberg:error", {
          message: "Invalid iceberg input. Latitude, longitude, heading, and keel depth must be numeric.",
        });
        return;
      }

      const iceberg = {
        lat: Number(icebergInput.lat),
        lon: Number(icebergInput.lon),
        heading: Number(icebergInput.heading),
        keelDepth: Number(icebergInput.keelDepth),
      };

      const results = platforms.map((platform) => {
        const threat = calculateThreats(iceberg, platform);
        return {
          name: threat.platformName,
          distance: Number(threat.distance.toFixed(2)),
          surfaceThreatLevel: threat.surfaceThreatLevel,
          subseaAssetThreatLevel: threat.subseaAssetThreatLevel,
          depth: platform.depth,
        };
      });

      const payload = {
        iceberg,
        results,
        timestamp: new Date().toISOString(),
      };

      persistIcebergResult(payload);
      io.emit("iceberg:result", payload);
    } catch (error) {
      console.error("Iceberg calculation error:", error);
      socket.emit("iceberg:error", {
        message: "Failed to calculate iceberg threats.",
      });
    }
  });

  // Test individual thruster
  socket.on("config:thruster-test", ({ thrusterIndex, value }) => {
    const api = rosApi();
    if (!api || !api.isRosReady()) return;

    const escCommand = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    if (thrusterIndex >= 0 && thrusterIndex < 6) {
      escCommand[thrusterIndex] = value / 100.0;
    }

    api.publishCommand({
      esc: escCommand,
      servo: [0, 0, 0, 0],
      lights: [0, 0],
    });
  });

  // Test individual gripper
  socket.on("config:gripper-test", ({ gripperIndex, value }) => {
    const api = rosApi();
    if (!api || !api.isRosReady()) return;

    const servoCommand = [0, 0, 0, 0];
    if (gripperIndex === 1) {
      servoCommand[0] = value;
      servoCommand[1] = value;
    } else if (gripperIndex === 2) {
      servoCommand[2] = value;
      servoCommand[3] = value;
    }

    api.publishCommand({
      esc: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      servo: servoCommand,
      lights: [0, 0],
    });
  });
};

module.exports = registerEventHandlers;
