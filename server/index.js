const express = require("express");
const http = require("http");
const cors = require("cors");
const initializeSocket = require("./socket/socket");
const socketEvents = require("./socket/events");
const rosBridgeConnection = require("./utils/ros/connection");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO
const io = initializeSocket(server);

// Initialize ROS Bridge connection module
rosBridgeConnection.api.initialize(io);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Ingest one float mission packet from microcontroller (Wi-Fi HTTP)
app.post("/api/float/packet", (req, res) => {
  const result = socketEvents.ingestFloatPacket(io, req.body, "http");
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
    });
  }

  return res.status(201).json({
    success: true,
    packet: result.packet,
  });
});

// Ingest multiple packets in one request
app.post("/api/float/packets", (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be an array of packets.",
    });
  }

  const results = req.body.map((packet) => socketEvents.ingestFloatPacket(io, packet, "http"));
  const accepted = results.filter((result) => result.success).map((result) => result.packet);
  const rejected = results.filter((result) => !result.success).map((result) => result.message);

  return res.status(rejected.length ? 207 : 201).json({
    success: rejected.length === 0,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    accepted,
    rejected,
  });
});

// Get persisted packet history for verification/replay
app.get("/api/float/packets", (req, res) => {
  const limit = Number(req.query.limit);
  const packets = socketEvents.getFloatPacketHistory(limit);
  return res.json({
    total: socketEvents.getFloatPacketHistory().length,
    count: packets.length,
    packets,
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`ROV Control Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready for connections`);
});