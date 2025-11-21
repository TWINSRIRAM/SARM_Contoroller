# SARM Robot Controller - Bluetooth Protocol Documentation

## Overview
Complete guide for implementing Bluetooth communication with the SARM Robot Controller. This document covers the Web Bluetooth API implementation, GATT service configuration, and ESP32 Bluetooth integration.

---

## 1. Bluetooth Architecture Overview

### Connection Flow
\`\`\`
[Mobile Browser] 
    ↓
[Web Bluetooth API]
    ↓
[BLE Central (Phone/Tablet)]
    ↓
[Bluetooth Low Energy]
    ↓
[ESP32 Bluetooth Peripheral]
    ↓
[Robot Motor Control]
\`\`\`

### Key Advantages Over WiFi
- **Lower latency**: Direct BLE connection (~10ms vs ~50ms WiFi)
- **Lower power**: BLE consumes 1/3 power of WiFi
- **Closer range**: Works reliably within 10 meters
- **No WiFi network**: Direct peer-to-peer connection
- **Better for mobile**: Native Bluetooth on phones/tablets

---

## 2. Web Bluetooth API Implementation (Frontend)

### 2.1 Service & Characteristic UUIDs

Configure these UUIDs on both ESP32 and frontend:

\`\`\`typescript
// Service UUID (custom 128-bit UUID for SARM Robot)
const ROBOT_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';

// Characteristic for sending commands (Write from phone to robot)
const COMMAND_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';

// Characteristic for receiving status (Notify from robot to phone)
const STATUS_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef2';
\`\`\`

### 2.2 Device Discovery & Connection

\`\`\`typescript
async function connectRobot() {
  try {
    // Request device with filters
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'SARM-Robot' },      // Exact device name
        { services: [ROBOT_SERVICE_UUID] }  // Service UUID
      ],
      optionalServices: [ROBOT_SERVICE_UUID],
    });

    // Connect to GATT server
    const server = await device.gatt?.connect();
    const service = await server.getPrimaryService(ROBOT_SERVICE_UUID);

    // Get characteristics
    const commandChar = await service.getCharacteristic(COMMAND_CHARACTERISTIC_UUID);
    const statusChar = await service.getCharacteristic(STATUS_CHARACTERISTIC_UUID);

    // Subscribe to status notifications
    await statusChar.startNotifications();
    statusChar.addEventListener('characteristicvaluechanged', handleStatusUpdate);

    console.log('Connected to SARM Robot via Bluetooth');
    return { device, commandChar, statusChar };
  } catch (error) {
    console.error('Bluetooth connection failed:', error);
  }
}
\`\`\`

### 2.3 Sending Commands

\`\`\`typescript
async function sendCommand(characteristic, command) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(command));
    await characteristic.writeValue(data);
    console.log('Command sent:', command);
  } catch (error) {
    console.error('Failed to send command:', error);
  }
}

// Example: Send drive command
const driveCommand = {
  cmd: 'drive_base',
  vx: 0.5,
  vy: 0.0,
  omega: 0.1
};
await sendCommand(commandChar, driveCommand);
\`\`\`

### 2.4 Receiving Status Updates

\`\`\`typescript
function handleStatusUpdate(event) {
  const characteristic = event.target;
  const decoder = new TextDecoder('utf-8');
  const statusString = decoder.decode(characteristic.value);
  
  const status = JSON.parse(statusString);
  console.log('Robot Status:', status);
  
  // Update UI with status data
  updateStatusPanel(status);
  updateJointDisplay(status.joints);
}
\`\`\`

### 2.5 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Desktop & Android |
| Firefox | ✅ Partial | Desktop only, flag required |
| Safari | ✅ Full | iOS 14.3+, macOS 11.3+ |
| Edge | ✅ Full | Desktop & Android |
| Opera | ✅ Full | Desktop & Android |

**Enable in Firefox:**
Navigate to `about:config` and enable `dom.bluetooth.enabled`

---

## 3. ESP32 Bluetooth Configuration

### 3.1 Hardware Requirements
- ESP32 with built-in Bluetooth LE (all modern ESP32 boards)
- External antenna (optional, improves range to 30+ meters)
- 3.3V power supply with stable current (BLE peaks at 80mA)

### 3.2 Arduino Libraries Required

\`\`\`cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
\`\`\`

Install via Arduino IDE: Sketch → Include Library → Manage Libraries
Search for "ESP32 BLE Arduino"

### 3.3 Complete ESP32 Bluetooth Implementation

\`\`\`cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include <Servo.h>

// UUIDs matching frontend
#define ROBOT_SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define COMMAND_CHAR_UUID "12345678-1234-5678-1234-56789abcdef1"
#define STATUS_CHAR_UUID "12345678-1234-5678-1234-56789abcdef2"

// Pin definitions
const int SERVO_PINS[5] = {13, 12, 14, 27, 26};
const int MOTOR_LEFT = 32;
const int MOTOR_RIGHT = 33;

// BLE Pointers
BLEServer *pServer = NULL;
BLECharacteristic *pStatusChar = NULL;
BLECharacteristic *pCommandChar = NULL;
bool deviceConnected = false;

// Servo and status variables
Servo servos[5];
float joint_angles[5] = {0, 45, 90, 0, 0};
float current_vx = 0, current_vy = 0, current_omega = 0;

// Callback for device connection events
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    Serial.println("Client connected");
  };

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    Serial.println("Client disconnected");
    // Restart advertising
    BLEDevice::startAdvertising();
  }
};

// Callback for receiving commands
class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();

    if (value.length() == 0) {
      return;
    }

    // Parse JSON command
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, value);

    if (error) {
      Serial.println("JSON parse error");
      return;
    }

    String cmd = doc["cmd"].as<String>();

    if (cmd == "drive_base") {
      float vx = doc["vx"].as<float>();
      float vy = doc["vy"].as<float>();
      float omega = doc["omega"].as<float>();

      current_vx = vx;
      current_vy = vy;
      current_omega = omega;

      // Apply motor control
      int left_speed = (int)constrain((vx - omega) * 255, -255, 255);
      int right_speed = (int)constrain((vx + omega) * 255, -255, 255);

      setMotorSpeed(MOTOR_LEFT, left_speed);
      setMotorSpeed(MOTOR_RIGHT, right_speed);
      Serial.printf("Drive: vx=%.2f vy=%.2f omega=%.2f\n", vx, vy, omega);
    } 
    else if (cmd == "set_joint") {
      int jointId = doc["jointId"].as<int>();
      float angle = doc["angle"].as<float>();

      if (jointId >= 0 && jointId < 5) {
        joint_angles[jointId] = angle;
        int pulseWidth = map(angle, -180, 180, 500, 2500);
        servos[jointId].writeMicroseconds(pulseWidth);
        Serial.printf("Joint %d set to %.1f degrees\n", jointId, angle);
      }
    } 
    else if (cmd == "stop") {
      setMotorSpeed(MOTOR_LEFT, 0);
      setMotorSpeed(MOTOR_RIGHT, 0);
      current_vx = 0;
      current_vy = 0;
      current_omega = 0;
      Serial.println("STOP command");
    } 
    else if (cmd == "home") {
      homeRobot();
      Serial.println("HOME command");
    }
  }
};

void setup() {
  Serial.begin(115200);
  delay(100);

  // Initialize servos
  for (int i = 0; i < 5; i++) {
    servos[i].attach(SERVO_PINS[i]);
    servos[i].write(90);
  }

  // Initialize motors
  pinMode(MOTOR_LEFT, OUTPUT);
  pinMode(MOTOR_RIGHT, OUTPUT);
  digitalWrite(MOTOR_LEFT, LOW);
  digitalWrite(MOTOR_RIGHT, LOW);

  // Initialize BLE
  BLEDevice::init("SARM-Robot");

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(ROBOT_SERVICE_UUID);

  // Create command characteristic (write)
  pCommandChar = pService->createCharacteristic(
    COMMAND_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCommandChar->setCallbacks(new CommandCallbacks());

  // Create status characteristic (notify)
  pStatusChar = pService->createCharacteristic(
    STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusChar->addDescriptor(new BLE2902());

  // Start service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(ROBOT_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE Advertiser started - device discoverable");
}

void loop() {
  // Send status updates every 100ms
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 100) {
    sendStatus();
    lastStatus = millis();
  }
  delay(10);
}

void sendStatus() {
  if (!deviceConnected) return;

  StaticJsonDocument<256> doc;
  doc["type"] = "status";
  doc["status"] = "ok";

  JsonArray joints = doc.createNestedArray("joints");
  for (int i = 0; i < 5; i++) {
    joints.add(joint_angles[i]);
  }

  JsonObject base = doc.createNestedObject("base");
  base["vx"] = current_vx;
  base["vy"] = current_vy;
  base["omega"] = current_omega;

  JsonArray errors = doc.createNestedArray("errors");
  doc["message"] = "Normal operation";

  String output;
  serializeJson(doc, output);

  pStatusChar->setValue(output.c_str());
  pStatusChar->notify();
}

void setMotorSpeed(int pin, int speed) {
  if (speed > 0) {
    digitalWrite(pin, HIGH);
    analogWrite(pin, speed);
  } else {
    digitalWrite(pin, LOW);
    analogWrite(pin, abs(speed));
  }
}

void homeRobot() {
  int home_angles[5] = {0, 45, 90, 0, 0};
  for (int i = 0; i < 5; i++) {
    servos[i].write(home_angles[i]);
    joint_angles[i] = home_angles[i];
    delay(50);
  }
}
\`\`\`

---

## 4. Command Message Formats (Bluetooth)

All commands use identical JSON format as WiFi/WebSocket:

### Drive Base
\`\`\`json
{
  "cmd": "drive_base",
  "vx": 0.5,
  "vy": 0.0,
  "omega": 0.1
}
\`\`\`

### Set Joint (Real-time, no send button needed)
\`\`\`json
{
  "cmd": "set_joint",
  "jointId": 0,
  "angle": 45.5
}
\`\`\`

### Stop
\`\`\`json
{
  "cmd": "stop"
}
\`\`\`

### Home
\`\`\`json
{
  "cmd": "home"
}
\`\`\`

---

## 5. Status Message Format (Bluetooth Notifications)

ESP32 sends status updates via BLE notifications (enable automatic updates):

\`\`\`json
{
  "type": "status",
  "status": "ok",
  "joints": [0, 45, 90, 30, 180],
  "base": {
    "vx": 0.1,
    "vy": 0.0,
    "omega": 0.05
  },
  "errors": [],
  "message": "Normal operation"
}
\`\`\`

---

## 6. Comparison: WiFi WebSocket vs Bluetooth BLE

| Feature | WiFi WebSocket | Bluetooth BLE |
|---------|---|---|
| Latency | 50-100ms | 10-20ms |
| Power Usage | High | Low |
| Range | 50+ meters | 10-100 meters |
| Bandwidth | Higher | Lower |
| Setup | WiFi network needed | Direct pairing |
| Connection time | 2-3 seconds | <1 second |
| Multiple devices | 4+ clients | 1 primary typically |
| Mobile friendly | Yes | Yes (native) |
| Browser support | All browsers | Modern browsers only |

**Recommendation**: Use Bluetooth for low-latency direct control, WiFi for networked multi-robot scenarios.

---

## 7. Troubleshooting

### Issue: Device not appearing in scan
**Solution:**
- Check ESP32 is powered on
- Verify BLE is enabled in ESP32 code
- Reset ESP32 and restart scan
- Check device name matches filter

### Issue: Connection fails with "GATT error"
**Solution:**
- Ensure UUIDs match between ESP32 and frontend
- Verify characteristics have correct properties (Write, Notify)
- Check BLE2902 descriptor is added to notification characteristic
- Restart both devices

### Issue: Commands received but no response
**Solution:**
- Verify motor/servo pins are correctly configured
- Check JSON format is valid
- Ensure `deviceConnected` flag is true in ESP32
- Monitor Serial output for debug messages

### Issue: Low signal / frequent disconnections
**Solution:**
- Use external BLE antenna
- Reduce obstacles between phone and ESP32
- Move closer to ESP32
- Check for WiFi/2.4GHz interference

---

## 8. Performance Metrics

| Metric | Value |
|--------|-------|
| Notification rate | 10 Hz (100ms) |
| Max command frequency | 30 Hz (33ms) |
| MTU (packet size) | 23-512 bytes |
| Connection latency | <20ms |
| Power consumption (idle) | 1-2 mA |
| Power consumption (active) | 10-80 mA |
| Effective range | 10-30 meters |

---

## 9. Safety Considerations

1. **Connection Loss**: Implement 500ms watchdog - stop motors if no command received
2. **Joint Limits**: Validate angles before servo movement
3. **Motor Limits**: Cap maximum velocity
4. **Battery Monitoring**: Send low battery warnings
5. **Graceful Shutdown**: Stop all actuators on unexpected disconnect

---

## 10. Testing Checklist

- [ ] ESP32 advertises "SARM-Robot" device name
- [ ] Web app scans and finds device
- [ ] Connection established successfully
- [ ] Drive commands move motors
- [ ] Joint commands move servos
- [ ] Status updates received at ~10Hz
- [ ] Stop command halts all movement
- [ ] Home command positions robot correctly
- [ ] Reconnection works after disconnect
- [ ] No crashes on rapid commands

---

## Additional Resources

- [Web Bluetooth API Spec](https://webbluetoothcg.github.io/web-bluetooth/)
- [ESP32 BLE Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/bluetooth/index.html)
- [ArduinoJson Library](https://arduinojson.org/)
