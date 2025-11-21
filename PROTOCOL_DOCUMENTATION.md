# SARM Robot Controller - Complete Protocol Documentation

## Overview
This document provides complete technical details for integrating the SARM Robot Controller web application with ESP32 microcontroller firmware. It includes WebSocket protocol specifications, JSON message formats, environment variables, and complete implementation examples.

---

## 1. Environment Variables & Setup

### Frontend Environment Variables
Create a `.env.local` file in the project root:

\`\`\`env
# WebSocket Connection
NEXT_PUBLIC_ROBOT_WS_URL=ws://192.168.4.1:81

# Alternative for local testing with mock backend
NEXT_PUBLIC_ROBOT_WS_URL_DEV=ws://localhost:3001
\`\`\`

### Backend Environment Variables (if using Express backend)
\`\`\`env
PORT=3001
WS_PORT=81
ESP32_IP=192.168.4.1
ESP32_PORT=81
ROBOT_ID=SARM_V1
LOG_LEVEL=debug
\`\`\`

---

## 2. WebSocket Protocol Specification

### Connection Details
- **Protocol**: WebSocket (RFC 6455)
- **Port**: 81 (default on ESP32)
- **URL Format**: `ws://[ESP32_IP]:81`
- **Data Format**: JSON UTF-8
- **Encoding**: UTF-8
- **Max Message Size**: 1024 bytes

### Connection Handshake
1. Client initiates WebSocket connection to ESP32
2. ESP32 accepts connection and sends hello message
3. Client can immediately start sending commands
4. Status updates streamed continuously from ESP32

---

## 3. Command Message Formats

All commands are sent as JSON objects. The controller sends commands based on user input.

### 3.1 Drive Base Command
Control the mobile base movement (wheels/motors).

**JSON Format:**
\`\`\`json
{
  "cmd": "drive_base",
  "vx": 0.5,
  "vy": 0.0,
  "omega": 0.1
}
\`\`\`

**Parameters:**
- `cmd` (string, required): "drive_base"
- `vx` (float, range: -1.0 to 1.0): Forward/backward velocity (m/s normalized)
  - Positive: Forward
  - Negative: Backward
  - 0: Stop
- `vy` (float, range: -1.0 to 1.0): Left/right strafe velocity (m/s normalized)
  - Positive: Move right
  - Negative: Move left
  - 0: No lateral movement
- `omega` (float, range: -1.0 to 1.0): Angular velocity (rad/s normalized)
  - Positive: Rotate clockwise
  - Negative: Rotate counter-clockwise
  - 0: No rotation

**Frequency**: Sent continuously at ~10Hz while joystick is active

**ESP32 Implementation Example:**
\`\`\`cpp
if (doc["cmd"] == "drive_base") {
  float vx = doc["vx"].as<float>();
  float vy = doc["vy"].as<float>();
  float omega = doc["omega"].as<float>();
  
  // Scale to actual motor speeds (adjust multipliers for your robot)
  int motor_left = constrain((vx - omega) * 255, -255, 255);
  int motor_right = constrain((vx + omega) * 255, -255, 255);
  
  setMotorSpeed(MOTOR_LEFT, motor_left);
  setMotorSpeed(MOTOR_RIGHT, motor_right);
}
\`\`\`

---

### 3.2 Set Joint Command
Control individual joint angles (real-time, instant reaction).

**JSON Format:**
\`\`\`json
{
  "cmd": "set_joint",
  "jointId": 0,
  "angle": 45.5
}
\`\`\`

**Parameters:**
- `cmd` (string, required): "set_joint"
- `jointId` (integer, range: 0-4): Joint identifier
  - 0: Shoulder (base rotation)
  - 1: Shoulder (lift)
  - 2: Elbow
  - 3: Wrist pitch
  - 4: Wrist roll
- `angle` (float, range: -180 to 180): Target angle in degrees
  - Positive: Clockwise (from robot perspective)
  - Negative: Counter-clockwise

**Frequency**: Sent immediately when slider changes (~30Hz during active adjustment)

**ESP32 Implementation Example:**
\`\`\`cpp
if (doc["cmd"] == "set_joint") {
  int jointId = doc["jointId"].as<int>();
  float angle = doc["angle"].as<float>();
  
  // Servo PWM values (adjust pulse ranges for your servos)
  // Typical servo: 500-2500 microseconds for -90 to +90 degrees
  int pulseWidth = map(angle, -180, 180, 500, 2500);
  
  servo[jointId].writeMicroseconds(pulseWidth);
  joint_angles[jointId] = angle;
}
\`\`\`

---

### 3.3 Set Pose Command
Set multiple joints simultaneously to a predefined pose.

**JSON Format:**
\`\`\`json
{
  "cmd": "set_pose",
  "joints": [0, 45, 90, 30, 180]
}
\`\`\`

**Parameters:**
- `cmd` (string, required): "set_pose"
- `joints` (array of floats, length: 5): Angles for all joints [j0, j1, j2, j3, j4]
  - Each element range: -180 to 180 degrees

**Common Poses Example:**
\`\`\`json
{
  "home_pose": [0, 45, 90, 0, 0],
  "rest_pose": [0, 90, 0, 0, 0],
  "grab_pose": [45, 60, 120, -45, 0]
}
\`\`\`

**ESP32 Implementation Example:**
\`\`\`cpp
if (doc["cmd"] == "set_pose") {
  JsonArray joints = doc["joints"].as<JsonArray>();
  
  for (int i = 0; i < 5; i++) {
    float angle = joints[i].as<float>();
    int pulseWidth = map(angle, -180, 180, 500, 2500);
    servo[i].writeMicroseconds(pulseWidth);
    joint_angles[i] = angle;
  }
  
  status_message = "Pose set successfully";
}
\`\`\`

---

### 3.4 Gripper Command
Control the end-effector gripper.

**JSON Format:**
\`\`\`json
{
  "cmd": "gripper",
  "state": "close"
}
\`\`\`

**Parameters:**
- `cmd` (string, required): "gripper"
- `state` (string, enum): "open" or "close"

**ESP32 Implementation Example:**
\`\`\`cpp
if (doc["cmd"] == "gripper") {
  String state = doc["state"].as<String>();
  
  if (state == "open") {
    digitalWrite(GRIPPER_PIN, HIGH);
    delay(500); // Servo travel time
    digitalWrite(GRIPPER_PIN, LOW);
    gripper_state = "open";
  } else if (state == "close") {
    digitalWrite(GRIPPER_PIN, HIGH);
    delay(800); // Longer for closing
    digitalWrite(GRIPPER_PIN, LOW);
    gripper_state = "close";
  }
}
\`\`\`

---

### 3.5 Home Command
Move all joints to home position.

**JSON Format:**
\`\`\`json
{
  "cmd": "home"
}
\`\`\`

**Parameters:**
- `cmd` (string, required): "home"

**ESP32 Implementation Example:**
\`\`\`cpp
if (doc["cmd"] == "home") {
  // Move to safe home position
  int home_angles[5] = {0, 45, 90, 0, 0};
  
  for (int i = 0; i < 5; i++) {
    int pulseWidth = map(home_angles[i], -180, 180, 500, 2500);
    servo[i].writeMicroseconds(pulseWidth);
    joint_angles[i] = home_angles[i];
    delay(50); // Stagger movements
  }
  
  status_message = "Robot homed";
}
\`\`\`

---

### 3.6 Stop Command
Emergency stop - halt all movement.

**JSON Format:**
\`\`\`json
{
  "cmd": "stop"
}
\`\`\`

**Parameters:**
- `cmd` (string, required): "stop"

**ESP32 Implementation Example:**
\`\`\`cpp
if (doc["cmd"] == "stop") {
  // Stop all motors immediately
  setMotorSpeed(MOTOR_LEFT, 0);
  setMotorSpeed(MOTOR_RIGHT, 0);
  
  // Relax servos or hold current position
  for (int i = 0; i < 5; i++) {
    servo[i].detach(); // Release servo
    // Or keep servo attached to hold position
  }
  
  status_message = "STOP command received";
  robot_state = "stopped";
}
\`\`\`

---

## 4. Status Message Format

ESP32 continuously sends status updates to the controller (recommended every 100ms).

**JSON Format:**
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
  "message": "Robot operating normally"
}
\`\`\`

**Parameters:**
- `type` (string, required): Always "status"
- `status` (string, enum): 
  - "ok": Normal operation
  - "error": Error state
  - "warning": Non-critical issue
- `joints` (array of floats): Current angle of all 5 joints (degrees)
- `base` (object): Current base velocities
  - `vx` (float): Current forward velocity (m/s)
  - `vy` (float): Current lateral velocity (m/s)
  - `omega` (float): Current angular velocity (rad/s)
- `errors` (array of strings): Error codes (empty if no errors)
  - Examples: "motor_overheat", "servo_disconnected", "power_low"
- `message` (string): Human-readable status message

**Frontend Status Updates:**
The React component updates real-time with this data:
- Joint angles displayed in live status panel
- Base velocities shown as feedback
- Errors trigger alerts and log entries
- Message field shown in status display

**ESP32 Status Transmission Example:**
\`\`\`cpp
void sendStatus() {
  StaticJsonDocument<512> doc;
  
  doc["type"] = "status";
  doc["status"] = error_flag ? "error" : "ok";
  
  JsonArray joints = doc.createNestedArray("joints");
  for (int i = 0; i < 5; i++) {
    joints.add(joint_angles[i]);
  }
  
  JsonObject base = doc.createNestedObject("base");
  base["vx"] = current_vx;
  base["vy"] = current_vy;
  base["omega"] = current_omega;
  
  JsonArray errors = doc.createNestedArray("errors");
  if (motor_temperature > 80) errors.add("motor_overheat");
  if (battery_voltage < 10.5) errors.add("power_low");
  
  doc["message"] = error_flag ? "Error detected" : "Normal operation";
  
  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT(output);
}
\`\`\`

---

## 5. Error Handling

### Error Codes
\`\`\`json
{
  "type": "status",
  "status": "error",
  "errors": [
    "invalid_command",
    "joint_limit_exceeded",
    "motor_overheat",
    "servo_disconnected",
    "power_low",
    "communication_timeout"
  ],
  "message": "Multiple errors detected"
}
\`\`\`

### Frontend Error Handling
\`\`\`typescript
if (lastStatus?.errors && lastStatus.errors.length > 0) {
  // Log each error
  lastStatus.errors.forEach(error => {
    addLog("error", `Error: ${error}`);
  });
  
  // Trigger visual alert (flashing red, sound, etc.)
}
\`\`\`

---

## 6. WebSocket Event Flow

### Connection Lifecycle
\`\`\`
[Client] --> WebSocket handshake --> [ESP32]
[Client] <-- Accept connection <-- [ESP32]
[Client] --> Command (drive_base) --> [ESP32]
[ESP32] processes motor command
[Client] <-- Status update <-- [ESP32]
[Client] --> Command (set_joint) --> [ESP32]
[ESP32] processes servo command
[Client] <-- Status update <-- [ESP32]
... continuous loop ...
[Client] --> Stop command --> [ESP32]
[Client] <-- Final status <-- [ESP32]
[Client] <-- Close connection <-- [ESP32]
\`\`\`

---

## 7. Complete ESP32 WebSocket Server Implementation

### Arduino/ESP32 Code Template

\`\`\`cpp
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Servo.h>

// WiFi credentials
const char* ssid = "SARM_Robot";
const char* password = "sarm123456";

// Pin definitions
const int SERVO_PINS[5] = {13, 12, 14, 27, 26};
const int MOTOR_LEFT = 32;
const int MOTOR_RIGHT = 33;

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(81);

// Servo objects
Servo servos[5];
float joint_angles[5] = {0, 45, 90, 0, 0};

// Status variables
float current_vx = 0, current_vy = 0, current_omega = 0;
bool error_flag = false;
String error_message = "";

void setup() {
  Serial.begin(115200);
  
  // Initialize servos
  for (int i = 0; i < 5; i++) {
    servos[i].attach(SERVO_PINS[i]);
    servos[i].write(90); // Center position
  }
  
  // Initialize motors
  pinMode(MOTOR_LEFT, OUTPUT);
  pinMode(MOTOR_RIGHT, OUTPUT);
  digitalWrite(MOTOR_LEFT, LOW);
  digitalWrite(MOTOR_RIGHT, LOW);
  
  // Connect to WiFi
  WiFi.softAP(ssid, password);
  Serial.println("WiFi AP started");
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("WebSocket server started on port 81");
}

void loop() {
  webSocket.loop();
  
  // Send status updates every 100ms
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 100) {
    sendStatus();
    lastStatus = millis();
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  StaticJsonDocument<512> doc;
  
  switch(type) {
    case WStype_CONNECTED:
      Serial.printf("Client %u connected\n", num);
      break;
      
    case WStype_TEXT:
      // Parse incoming JSON
      DeserializationError error = deserializeJson(doc, payload);
      
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
      }
      else if (cmd == "set_joint") {
        int jointId = doc["jointId"].as<int>();
        float angle = doc["angle"].as<float>();
        
        if (jointId >= 0 && jointId < 5) {
          joint_angles[jointId] = angle;
          int pulseWidth = map(angle, -180, 180, 500, 2500);
          servos[jointId].writeMicroseconds(pulseWidth);
        }
      }
      else if (cmd == "stop") {
        setMotorSpeed(MOTOR_LEFT, 0);
        setMotorSpeed(MOTOR_RIGHT, 0);
        current_vx = 0;
        current_vy = 0;
        current_omega = 0;
      }
      
      break;
      
    case WStype_DISCONNECTED:
      Serial.printf("Client %u disconnected\n", num);
      break;
  }
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

void sendStatus() {
  StaticJsonDocument<512> doc;
  
  doc["type"] = "status";
  doc["status"] = error_flag ? "error" : "ok";
  
  JsonArray joints = doc.createNestedArray("joints");
  for (int i = 0; i < 5; i++) {
    joints.add(joint_angles[i]);
  }
  
  JsonObject base = doc.createNestedObject("base");
  base["vx"] = current_vx;
  base["vy"] = current_vy;
  base["omega"] = current_omega;
  
  JsonArray errors = doc.createNestedArray("errors");
  // Add error checking logic here
  
  doc["message"] = error_flag ? error_message : "Normal operation";
  
  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT((uint8_t *)output.c_str(), output.length());
}
\`\`\`

---

## 8. Testing & Debugging

### Using Postman
1. WebSocket Echo Client (available in Postman)
2. Connect to: `ws://[ESP32_IP]:81`
3. Send test command:
\`\`\`json
{
  "cmd": "drive_base",
  "vx": 0.5,
  "vy": 0.0,
  "omega": 0.0
}
\`\`\`

### Browser DevTools
\`\`\`javascript
// In browser console
const ws = new WebSocket('ws://192.168.4.1:81');
ws.onmessage = (e) => console.log('Status:', JSON.parse(e.data));
ws.send(JSON.stringify({cmd: "drive_base", vx: 0.5, vy: 0, omega: 0}));
\`\`\`

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | ESP32 not accessible | Check IP address, WiFi connection |
| JSON parse error | Malformed command | Validate JSON format, check encoding |
| Motors not moving | PWM pins incorrect | Verify MOTOR_LEFT/RIGHT pin definitions |
| Servos jittering | PWM frequency conflict | Adjust servo update rate |
| Disconnections | WiFi signal weak | Move closer to ESP32 or improve antenna |

---

## 9. Performance Specifications

| Metric | Value | Notes |
|--------|-------|-------|
| Command latency | < 50ms | From UI to motor response |
| Status update rate | 10 Hz | 100ms interval |
| Max commands/sec | 30 | Joint slider updates |
| WebSocket buffer | 1024 bytes | Per message limit |
| WiFi range | 30 meters | In open space |
| Concurrent clients | 4+ | Depends on ESP32 RAM |

---

## 10. Safety Guidelines for ESP32 Implementation

1. **Joint Limits**: Always validate angle ranges before sending to servos
2. **Motor Safety**: Implement maximum speed limits
3. **Error Recovery**: Auto-stop if no command received for 500ms
4. **Temperature Monitoring**: Check servo/motor temperature regularly
5. **Power Management**: Monitor battery voltage and alert if too low
6. **Graceful Shutdown**: Stop all motors before WiFi disconnection

---

## Contact & Support

For issues or questions:
- Check PROTOCOL_DOCUMENTATION.md
- Review ESP32 example code
- Test with Postman before integrating with robot firmware
