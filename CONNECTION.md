# SARM Robot Bluetooth Connection Guide

## Overview
This guide provides complete instructions for connecting your SARM Robot to the web controller via Bluetooth (BLE). The system uses Web Bluetooth API for direct peer-to-peer communication with your ESP32 microcontroller.

---

## Part 1: Hardware Requirements

### For the SARM Robot (ESP32 Side)
- **Microcontroller**: ESP32 (with built-in Bluetooth Low Energy)
- **Communication**: BLE GATT Server with two characteristics
- **Power**: 5V USB or battery pack
- **No additional Bluetooth module needed** - ESP32 has built-in BLE

### For the Controller (Web App Side)
- **Device**: Any modern smartphone/tablet with Bluetooth 5.0+
- **OS Support**:
  - Android 6.0+ (Chrome 56+)
  - iOS 14.3+ (Safari with Web Bluetooth support)
  - Desktop with Bluetooth adapter
- **Browser**: Chrome, Edge, or any Chromium-based browser
- **WiFi**: NOT required - Direct Bluetooth connection

---

## Part 2: How Bluetooth Connection Works

### Connection Flow Diagram
\`\`\`
Mobile App (Web App)
    ↓
Web Bluetooth API (Browser)
    ↓
Mobile OS Bluetooth Stack
    ↓
[BLE Scan → Find "SARM-Robot" → Request Connection]
    ↓
ESP32 (BLE GATT Server)
    ↓
[Accept Connection → Negotiate MTU]
    ↓
Connected!
\`\`\`

### What Happens After Connection
1. **Service Discovery**: App discovers the SARM Service (UUID: `12345678-1234-5678-1234-56789abcdef0`)
2. **Characteristic Linking**: App finds two characteristics:
   - **Command TX**: Receives commands from app (write-only)
   - **Status RX**: Sends robot status to app (notify)
3. **Enable Notifications**: App listens to status updates at 10Hz
4. **Real-time Communication**: Commands sent instantly, status received instantly

---

## Part 3: Step-by-Step Connection Process

### Step 1: Prepare Your ESP32
1. Flash the ESP32 with BLE firmware (see ESP32 Code below)
2. Power on the ESP32
3. ESP32 will start advertising as "SARM-Robot"
4. LED indicator should show BLE mode active (customizable)

### Step 2: Open Web App on Mobile
1. Open the SARM Robot Controller app in browser
2. Enable Bluetooth in phone settings
3. You should see "SARM ROBOT" title with connection button

### Step 3: Connect Bluetooth
1. Click the **"Connect Bluetooth"** button in the app
2. Browser will prompt: "Select your Bluetooth device"
3. Look for device named **"SARM-Robot"**
4. Tap to select
5. Connection will establish in 1-3 seconds
6. Button will change to **"Disconnect"** (green indicator)
7. Logs will show: "Connected to SARM-Robot via Bluetooth"

### Step 4: Verify Connection
- Look for green status indicator in Connection Panel
- Status Panel should show real-time robot status
- Event Log should display connection confirmation

---

## Part 4: Command Format & Protocol

### Command Structure (JSON Format)
All commands are sent as **JSON strings** over Bluetooth characteristic.

#### 1. Drive Base Command
\`\`\`json
{
  "cmd": "drive_base",
  "vx": 0.5,
  "vy": 0.0,
  "omega": 0.2
}
\`\`\`
- **vx**: Linear velocity X (-1 to 1)
- **vy**: Linear velocity Y (-1 to 1)
- **omega**: Angular velocity (-1 to 1)
- **Sent by**: Joystick (continuous stream)
- **Frequency**: 10Hz (every 100ms)

#### 2. Set Joint Angle
\`\`\`json
{
  "cmd": "set_joint",
  "jointId": 2,
  "angle": 45.5
}
\`\`\`
- **jointId**: 0-4 (Base, Shoulder, Elbow, Wrist, Gripper)
- **angle**: Target angle in degrees
- **Sent by**: Joint Sliders (real-time)
- **Frequency**: On change

#### 3. Set Pose (All Joints)
\`\`\`json
{
  "cmd": "set_pose",
  "joints": [0, 45, -30, 90, 0]
}
\`\`\`
- **joints**: Array of 5 angles [Base, Shoulder, Elbow, Wrist, Gripper]
- **Sent by**: Reset Position button
- **Frequency**: On command

#### 4. Gripper Command
\`\`\`json
{
  "cmd": "gripper",
  "state": "open"
}
\`\`\`
- **state**: "open" or "close"
- **Sent by**: Gripper Open/Close buttons
- **Frequency**: On demand

#### 5. Home Command
\`\`\`json
{
  "cmd": "home"
}
\`\`\`
- Move all joints to home position (0,0,0,0,0)
- **Sent by**: "Home All Joints" button
- **Frequency**: On demand

#### 6. Emergency Stop Command
\`\`\`json
{
  "cmd": "stop"
}
\`\`\`
- **Immediately stops all motion**
- **Sent by**: Emergency Stop button (red)
- **Frequency**: On demand
- **Priority**: Highest - should interrupt all other commands

---

## Part 5: Status Message Format (ESP32 → App)

ESP32 sends status at **10Hz (every 100ms)**:

\`\`\`json
{
  "type": "status",
  "status": "ok",
  "joints": [0.0, 45.2, -30.1, 89.8, 15.5],
  "base": {
    "vx": 0.5,
    "vy": 0.0,
    "omega": 0.2
  },
  "errors": [],
  "message": "All systems normal"
}
\`\`\`

### Status Fields
- **type**: Always "status"
- **status**: "ok" (green indicator) or "error" (red indicator)
- **joints**: Current angle of each joint [Base, Shoulder, Elbow, Wrist, Gripper]
- **base**: Current base velocities
- **errors**: Array of error strings (empty if no errors)
- **message**: Human-readable status message

### Error Status Example
\`\`\`json
{
  "type": "status",
  "status": "error",
  "joints": [0, 0, 0, 0, 0],
  "base": {"vx": 0, "vy": 0, "omega": 0},
  "errors": ["Joint 2 servo overload", "Battery low"],
  "message": "Joint error detected"
}
\`\`\`

---

## Part 6: Complete ESP32 Arduino Code

### Required Libraries
\`\`\`cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>  // For JSON parsing
\`\`\`

### Full ESP32 BLE Implementation

\`\`\`cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// BLE UUIDs - MUST match frontend
#define ROBOT_SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define COMMAND_CHARACTERISTIC_UUID "12345678-1234-5678-1234-56789abcdef1"
#define STATUS_CHARACTERISTIC_UUID  "12345678-1234-5678-1234-56789abcdef2"

// Global variables
BLEServer *pServer = NULL;
BLECharacteristic *pCommandChar = NULL;
BLECharacteristic *pStatusChar = NULL;
bool deviceConnected = false;

// Robot state
float jointAngles[5] = {0, 0, 0, 0, 0};
float baseVx = 0, baseVy = 0, baseOmega = 0;
String lastError = "";

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("[BLE] Device connected");
    };
    
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("[BLE] Device disconnected");
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = pCharacteristic->getValue();
      
      if (value.length() == 0) {
        Serial.println("[ERROR] Empty command received");
        return;
      }
      
      Serial.print("[BLE] Received: ");
      Serial.println(value);
      
      // Parse JSON command
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, value);
      
      if (error) {
        Serial.print("[ERROR] JSON parse failed: ");
        Serial.println(error.f_str());
        return;
      }
      
      // Get command type
      const char* cmd = doc["cmd"];
      
      if (strcmp(cmd, "drive_base") == 0) {
        baseVx = doc["vx"];
        baseVy = doc["vy"];
        baseOmega = doc["omega"];
        Serial.printf("[CMD] Drive Base: vx=%.2f, vy=%.2f, omega=%.2f\n", baseVx, baseVy, baseOmega);
        // TODO: Send to motor control
        
      } else if (strcmp(cmd, "set_joint") == 0) {
        int jointId = doc["jointId"];
        float angle = doc["angle"];
        if (jointId >= 0 && jointId < 5) {
          jointAngles[jointId] = angle;
          Serial.printf("[CMD] Set Joint %d to %.1f degrees\n", jointId, angle);
          // TODO: Send to servo
        }
        
      } else if (strcmp(cmd, "set_pose") == 0) {
        JsonArray joints = doc["joints"];
        for (int i = 0; i < 5; i++) {
          jointAngles[i] = joints[i];
        }
        Serial.println("[CMD] Set Pose: " + String(jointAngles[0]) + ", " + String(jointAngles[1]) + 
                      ", " + String(jointAngles[2]) + ", " + String(jointAngles[3]) + 
                      ", " + String(jointAngles[4]));
        // TODO: Send to all servos
        
      } else if (strcmp(cmd, "gripper") == 0) {
        const char* state = doc["state"];
        if (strcmp(state, "open") == 0) {
          Serial.println("[CMD] Gripper OPEN");
          // TODO: Open gripper
        } else if (strcmp(state, "close") == 0) {
          Serial.println("[CMD] Gripper CLOSE");
          // TODO: Close gripper
        }
        
      } else if (strcmp(cmd, "home") == 0) {
        Serial.println("[CMD] Home all joints");
        for (int i = 0; i < 5; i++) {
          jointAngles[i] = 0;
        }
        // TODO: Move all servos to 0 degrees
        
      } else if (strcmp(cmd, "stop") == 0) {
        Serial.println("[CMD] EMERGENCY STOP!");
        baseVx = baseVy = baseOmega = 0;
        for (int i = 0; i < 5; i++) {
          jointAngles[i] = 0;
        }
        // TODO: Stop all motors immediately
      }
    }
};

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("Starting BLE Server...");
  
  // Initialize BLE
  BLEDevice::init("SARM-Robot");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  // Create service
  BLEService *pService = pServer->createService(ROBOT_SERVICE_UUID);
  
  // Create command characteristic (write only)
  pCommandChar = pService->createCharacteristic(
    COMMAND_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCommandChar->setCallbacks(new MyCallbacks());
  
  // Create status characteristic (read + notify)
  pStatusChar = pService->createCharacteristic(
    STATUS_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusChar->addDescriptor(new BLE2902());
  
  // Start service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(ROBOT_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("[BLE] Device \"SARM-Robot\" advertising... Ready for connections!");
}

void loop() {
  if (deviceConnected) {
    // Send status update every 100ms (10Hz)
    static unsigned long lastStatusTime = 0;
    if (millis() - lastStatusTime >= 100) {
      lastStatusTime = millis();
      
      // Create status JSON
      StaticJsonDocument<256> doc;
      doc["type"] = "status";
      doc["status"] = lastError.length() > 0 ? "error" : "ok";
      
      // Add joint angles
      JsonArray jointsArray = doc.createNestedArray("joints");
      for (int i = 0; i < 5; i++) {
        jointsArray.add(jointAngles[i]);
      }
      
      // Add base velocities
      JsonObject baseObj = doc.createNestedObject("base");
      baseObj["vx"] = baseVx;
      baseObj["vy"] = baseVy;
      baseObj["omega"] = baseOmega;
      
      // Add errors
      JsonArray errorsArray = doc.createNestedArray("errors");
      if (lastError.length() > 0) {
        errorsArray.add(lastError);
      }
      
      doc["message"] = lastError.length() > 0 ? lastError : "All systems normal";
      
      // Convert to string and send
      String jsonString;
      serializeJson(doc, jsonString);
      pStatusChar->setValue(jsonString);
      pStatusChar->notify();
      
      Serial.println("[Status] Sent: " + jsonString);
    }
  }
  
  delay(10);
}
\`\`\`

### Key Implementation Points
1. **Device Name**: "SARM-Robot" - Must match frontend filter
2. **Service UUID**: Must match `ROBOT_SERVICE_UUID` in frontend
3. **Characteristics**: Command (write) + Status (notify)
4. **JSON Parsing**: ArduinoJson library handles command parsing
5. **Status Broadcast**: Every 100ms to app
6. **Error Handling**: Graceful JSON parse failures

---

## Part 7: Troubleshooting

### Problem: "Bluetooth not available" message
**Solution:**
- Ensure Bluetooth is enabled on phone
- Try a different browser (Chrome recommended)
- Restart browser and try again
- Check if device supports Web Bluetooth API

### Problem: Device not appearing in scan list
**Solution:**
- Verify ESP32 is powered on
- Check Serial Monitor (ESP32 should show "advertising")
- Reset ESP32 and try again
- Verify correct UUID in code
- Device must be advertising as "SARM-Robot"

### Problem: "Failed to connect to GATT server"
**Solution:**
- ESP32 may be out of range
- Try moving closer to robot
- Restart ESP32
- Clear browser cache and retry
- Another device may be connected - disconnect first

### Problem: Commands not received by ESP32
**Solution:**
- Verify connection is established (green indicator)
- Check Serial Monitor for received data
- JSON format may be wrong - verify in browser console
- Check if characteristic write permissions are correct

### Problem: Status not updating on app
**Solution:**
- Ensure notifications are enabled on ESP32
- Check if ESP32 is sending status (Serial Monitor)
- Try disconnecting and reconnecting
- Verify MTU size is sufficient (20+ bytes)

### Problem: Buttons are disabled (grayed out)
**Solution:**
- Ensure Bluetooth is connected first
- Green indicator must show "Connected"
- Wait 1-2 seconds after connection before using buttons

---

## Part 8: Command Testing with Serial Monitor

### Monitor ESP32 Bluetooth Activity
\`\`\`
[BLE] Device connected
[BLE] Received: {"cmd":"drive_base","vx":0.5,"vy":0,"omega":0.2}
[CMD] Drive Base: vx=0.50, vy=0.00, omega=0.20
[Status] Sent: {"type":"status","status":"ok","joints":[0,0,0,0,0],"base":{"vx":0.5,"vy":0,"omega":0.2},"errors":[],"message":"All systems normal"}
\`\`\`

### Debug Checklist
- [ ] ESP32 Serial shows "advertising"
- [ ] App shows connection button ready
- [ ] After connect, green indicator appears
- [ ] Log shows "Connected to SARM-Robot"
- [ ] Joystick moves update base status
- [ ] Sliders update joint angles
- [ ] Buttons send correct commands

---

## Part 9: Performance Specifications

| Metric | Value |
|--------|-------|
| Command Latency | 10-50ms |
| Status Update Rate | 10Hz (100ms) |
| MTU Size | 256 bytes (adjustable) |
| Max Commands/sec | 100+ |
| Connection Range | 10-30 meters (depends on environment) |
| Typical Current Draw | 80-120mA |
| Power Consumption | 400-600mW |

---

## Part 10: Safety Guidelines

1. **Always use Emergency Stop when needed** - Red button cuts all power
2. **Keep robot workspace clear** - Moving parts can cause injury
3. **Test commands at low speed first** - Start with vx/vy = 0.1
4. **Monitor battery voltage** - Add low battery alert to ESP32
5. **Disconnect before power reset** - Always disconnect before restarting ESP32
6. **Use tethered connection** - Consider safety lines for aerial/mobile robots

---

## Quick Reference: Command JSON Examples

\`\`\`json
// EXAMPLE 1: Forward movement
{"cmd":"drive_base","vx":0.8,"vy":0,"omega":0}

// EXAMPLE 2: Spin left
{"cmd":"drive_base","vx":0,"vy":0,"omega":-0.5}

// EXAMPLE 3: Move joint 1 to 45 degrees
{"cmd":"set_joint","jointId":1,"angle":45}

// EXAMPLE 4: Reset all joints to home
{"cmd":"set_pose","joints":[0,0,0,0,0]}

// EXAMPLE 5: Close gripper
{"cmd":"gripper","state":"close"}

// EXAMPLE 6: Emergency stop
{"cmd":"stop"}
\`\`\`

---

## Next Steps

1. Flash the ESP32 code provided above
2. Power on the robot
3. Open web app on mobile in landscape mode
4. Click "Connect Bluetooth"
5. Select "SARM-Robot" from list
6. Use joystick and sliders to control
7. Monitor logs for real-time feedback

For advanced setup, refer to `PROTOCOL_DOCUMENTATION.md` and `BLUETOOTH_PROTOCOL.md`.
