# Float Mission Wireless Communication Guide

## Purpose

This document defines the production communication contract between the microcontroller and the GUI server for Task 4 (Float Profiling).

It covers:

- The exact data packet format
- Wireless transport methods (HTTP and Socket.IO)
- Server persistence behavior
- Microcontroller-side reliability and local saving strategy
- End-to-end examples for implementation and testing

## System Overview

The microcontroller sends float packets to the server over Wi-Fi.

- Ingestion endpoint (recommended): `POST /api/float/packet`
- Batch endpoint: `POST /api/float/packets`
- Realtime distribution: server emits `float:data-packet` to connected GUI clients
- Persistent storage: each packet is appended immediately to `server/data/floatMissionPackets.jsonl`

The GUI requests history (`float:get-history`) on connect, so mission data remains visible after page refreshes or reconnects.

## Canonical Packet Structure

Each packet must contain:

| Field | Type | Required | Description |
|---|---|---|---|
| `companyId` | string | yes | Team company code, for example `PN01` |
| `timestamp` | string | yes | Device time or UTC string, for example `1:51:42` or `2026-03-19T22:00:00Z` |
| `pressureKpa` | number | recommended | Pressure in kilopascals |
| `depthMeters` | number | yes | Depth in meters |

Example packet:

```json
{
  "companyId": "PN01",
  "timestamp": "1:51:42",
  "pressureKpa": 9.8,
  "depthMeters": 2.55
}
```

### Validation rules on server

- `depthMeters` must be numeric
- If `pressureKpa` is missing or invalid, server auto-computes it from depth: `depthMeters * 9.8`
- If `companyId` is missing, server defaults to `PN01`
- If `timestamp` is missing, server generates local server time

The server also adds:

- `receivedAt`: server receive time in ISO-8601
- `source`: ingestion source (`http` or `socket`)

## Wireless Transport Option A (Recommended): HTTP

### 1) Send one packet

- Method: `POST`
- URL: `http://<SERVER_IP>:4000/api/float/packet`
- Header: `Content-Type: application/json`
- Body: one packet object

Success response:

```json
{
  "success": true,
  "packet": {
    "companyId": "PN01",
    "timestamp": "1:51:42",
    "pressureKpa": 9.8,
    "depthMeters": 2.55,
    "receivedAt": "2026-03-19T22:13:10.443Z",
    "source": "http"
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Invalid packet: depthMeters must be numeric."
}
```

### 2) Send batch packets

- Method: `POST`
- URL: `http://<SERVER_IP>:4000/api/float/packets`
- Body: array of packet objects

Useful when reconnecting after temporary Wi-Fi loss.

### 3) Retrieve stored mission history

- Method: `GET`
- URL: `http://<SERVER_IP>:4000/api/float/packets`
- Optional query: `?limit=100`

## Wireless Transport Option B: Socket.IO

If your firmware stack supports Socket.IO protocol:

- Emit event: `float:data-packet:ingest`
- Payload: same packet schema

Server response:

- Success ack event: `float:ingest:ack`
- Error event: `float:error`

Note: plain raw WebSocket is not Socket.IO. Use this option only with a true Socket.IO client implementation.

## Server Persistence Model

### Where data is stored

- File: `server/data/floatMissionPackets.jsonl`
- Format: JSON Lines (one JSON object per line)

Example file contents:

```json
{"companyId":"PN01","timestamp":"1:51:42","pressureKpa":9.8,"depthMeters":2.55,"receivedAt":"2026-03-19T22:13:10.443Z","source":"http"}
{"companyId":"PN01","timestamp":"1:51:47","pressureKpa":10.1,"depthMeters":2.61,"receivedAt":"2026-03-19T22:13:15.220Z","source":"http"}
```

### Durability behavior

- Every accepted packet is appended to disk synchronously
- Data survives process restarts and machine reboots
- On server startup, file content is loaded into memory for fast history responses

## Microcontroller Reliability Requirements

To avoid mission data loss, firmware should implement:

1. Local queue of unsent packets (ring buffer in RAM)
2. Retry with backoff for failed HTTP requests
3. Optional flash backup of unsent queue when network is unavailable
4. Batch resend on reconnect
5. At least one packet every 5 seconds

## Firmware Sending Flow (Recommended)

1. Collect sensor readings
2. Build packet object
3. Attempt `POST /api/float/packet`
4. If HTTP code is not 2xx:
   - Push packet to local retry queue
5. Periodically attempt to flush retry queue
6. Optionally persist retry queue to flash every N packets or every M seconds

## ESP32 (Arduino) Reference Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASS";
const char* SERVER_URL = "http://192.168.1.50:4000/api/float/packet";

void sendFloatPacket(float pressureKpa, float depthMeters, const char* ts) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, queue packet locally");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["companyId"] = "PN01";
  doc["timestamp"] = ts;           // Example: "1:51:42"
  doc["pressureKpa"] = pressureKpa;
  doc["depthMeters"] = depthMeters;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code >= 200 && code < 300) {
    Serial.printf("Packet accepted. HTTP %d\n", code);
  } else {
    Serial.printf("Packet failed. HTTP %d (queue for retry)\n", code);
  }

  http.end();
}
```

## Saving Data on the Microcontroller

Server persistence is mandatory and already implemented, but firmware-side saving is still recommended for resilience.

Suggested approach:

- Keep a RAM queue of failed packets
- Mirror queue to flash (LittleFS or Preferences) every few seconds
- On boot, reload unsent packets from flash
- Flush them before sending new live packets
- Remove packet from queue only after successful 2xx response

Pseudo-flow:

```text
on_new_sample -> try_send
if send_fail -> queue_in_ram -> persist_queue_to_flash
on_reconnect -> load_queue_from_flash -> resend_in_order -> clear_sent
```

## Timing and Mission Compliance

For MATE mission scoring:

- Send at least one packet every 5 seconds
- Include valid company id and timestamp
- Ensure depth packets capture all hold windows
- Do not pause transmission during profile transitions

## Operational Checklist

Before pool run:

1. Server reachable from microcontroller (`/health` returns OK)
2. First packet visible in GUI table
3. Packet rate near 5-second cadence
4. Packet file is being appended in `server/data/floatMissionPackets.jsonl`
5. GUI reconnect test shows history replay correctly

## Troubleshooting

### HTTP 400 from server

Cause: invalid packet shape, usually missing or non-numeric `depthMeters`.

Fix: validate firmware payload before send.

### Data visible live but missing after restart

Cause: process had no write permission in `server/data`.

Fix: grant write permissions to server process and verify disk is writable.

### Duplicate points in GUI

Cause: firmware retries sent duplicate packets without unique sequence.

Fix: add optional packet id on firmware side and deduplicate in firmware retry queue.
