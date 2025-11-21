# SARM Robot Controller

A modern, mobile-first Next.js web application for controlling a SARM robot via WebSocket. The app communicates with an ESP32-based robot controller using a standardized JSON protocol.

## Features

- **Mobile-First Design**: Optimized for control from mobile devices
- **Real-time WebSocket Communication**: Low-latency command sending and status updates
- **Virtual Joystick**: Touch-friendly base control with continuous velocity updates
- **Joint Controls**: 5-joint slider interface with pose commands
- **Action Buttons**: Gripper control, homing, and emergency stop
- **Status Monitoring**: Live joint angles, base velocities, and error tracking
- **Event Logging**: Complete history of commands sent and status received
- **Mock Backend**: Test without hardware using Postman or similar tools

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4 (mobile-first)
- **Language**: TypeScript
- **Protocol**: WebSocket with JSON command/status format

## Installation

### 1. Clone or Download

Clone this repository or download the code files.

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`

## Configuration

### WebSocket URL

The default WebSocket URL is `ws://192.168.4.1:81`. You can change this:

1. Open the app in your browser
2. In the "Connection" panel, modify the WebSocket URL
3. Click "Connect"

For development testing, you can use `ws://localhost:8080` if running a local WebSocket server.

## JSON Protocol Reference

### Commands Sent to Robot

#### 1. Drive Base (4 Omni Wheels)
Sent continuously while joystick is active (every 50ms):

\`\`\`json
{
  "cmd": "drive_base",
  "vx": 0.20,
  "vy": -0.10,
  "omega": 0.05
}
\`\`\`

**Parameters:**
- `vx`: Forward/backward velocity (float, -1.0 to 1.0)
- `vy`: Left/right velocity (float, -1.0 to 1.0)
- `omega`: Rotation velocity (float, -1.0 to 1.0)

#### 2. Move Single Joint

\`\`\`json
{
  "cmd": "set_joint",
  "jointId": 1,
  "angle": 45
}
\`\`\`

#### 3. Move All Joints (Full Pose)

\`\`\`json
{
  "cmd": "set_pose",
  "joints": [10, 30, 45, 20, 80]
}
\`\`\`

**Parameters:**
- `joints`: Array of 5 angles in degrees

#### 4. Gripper Control

\`\`\`json
{
  "cmd": "gripper",
  "state": "open"
}
\`\`\`

or

\`\`\`json
{
  "cmd": "gripper",
  "state": "close"
}
\`\`\`

#### 5. Home All Joints

\`\`\`json
{
  "cmd": "home"
}
\`\`\`

#### 6. Emergency Stop

\`\`\`json
{
  "cmd": "stop"
}
\`\`\`

### Status Received from Robot

#### Success Response

\`\`\`json
{
  "type": "status",
  "status": "ok",
  "joints": [10, 32, 45, 20, 80],
  "base": {
    "vx": 0.1,
    "vy": 0.0,
    "omega": 0.0
  },
  "errors": [],
  "message": "Idle"
}
\`\`\`

#### Error Response

\`\`\`json
{
  "type": "status",
  "status": "error",
  "message": "Joint limit exceeded",
  "errors": ["joint_2_limit"]
}
\`\`\`

## Testing with Mock Backend

### Using Postman

1. **POST Request** to `http://localhost:3000/api/mock-sarm`
2. **Headers**: `Content-Type: application/json`
3. **Body** (raw JSON):

\`\`\`json
{
  "cmd": "drive_base",
  "vx": 0.2,
  "vy": 0,
  "omega": 0.1
}
\`\`\`

4. **Response**: You'll receive a mock status response

### Example Requests

**Drive Base:**
\`\`\`bash
curl -X POST http://localhost:3000/api/mock-sarm \
  -H "Content-Type: application/json" \
  -d '{"cmd":"drive_base","vx":0.2,"vy":0,"omega":0}'
\`\`\`

**Set Pose:**
\`\`\`bash
curl -X POST http://localhost:3000/api/mock-sarm \
  -H "Content-Type: application/json" \
  -d '{"cmd":"set_pose","joints":[45,30,60,20,90]}'
\`\`\`

**Gripper:**
\`\`\`bash
curl -X POST http://localhost:3000/api/mock-sarm \
  -H "Content-Type: application/json" \
  -d '{"cmd":"gripper","state":"open"}'
\`\`\`

## Component Overview

### `ConnectionPanel`
- WebSocket URL input
- Connect/Disconnect buttons
- Connection status indicator
- Error display

### `StatusPanel`
- Current joint angles
- Base velocities (Vx, Vy, Omega)
- System status (OK/Error)
- Error list if any

### `BaseJoystick`
- Touch-friendly 2D joystick
- Real-time velocity visualization
- Auto-sends drive_base commands every 50ms
- Resets to zero on release

### `JointSliders`
- 5 independent joint sliders
- Min/max angle constraints per joint
- Real-time angle display
- Send Pose button
- Reset button

### `ActionButtons`
- Gripper Open/Close
- Home All Joints
- Emergency Stop (prominent red button)

### `EventLog`
- Chronological event display
- Color-coded by type (Command, Status, Error, Info)
- Timestamps for each event
- Auto-scroll to latest
- Clear button

## Project Structure

\`\`\`
app/
  api/
    mock-sarm/
      route.ts          # Mock backend for testing
  layout.tsx            # Root layout with fonts
  page.tsx              # Main control panel
  globals.css           # Tailwind styling
components/
  connection-panel.tsx  # Connection management
  status-panel.tsx      # Status display
  base-joystick.tsx     # Virtual joystick
  joint-sliders.tsx     # Joint angle controls
  action-buttons.tsx    # Gripper, Home, Stop
  event-log.tsx         # Command/status log
  ui/                   # shadcn components
hooks/
  useRobotWebSocket.ts  # WebSocket management hook
types/
  robot.ts              # TypeScript interfaces
\`\`\`

## Hook: useRobotWebSocket

The `useRobotWebSocket` hook handles all WebSocket communication:

\`\`\`typescript
const {
  connect,        // (url: string) => void
  disconnect,     // () => void
  sendCommand,    // (cmd: RobotCommand) => void
  connectionState,// "disconnected" | "connecting" | "connected" | "error"
  lastStatus,     // RobotStatus | null
  logs,           // LogEntry[]
  clearLogs,      // () => void
  error,          // string | null
} = useRobotWebSocket();
\`\`\`

## Safety Notes

- **The ESP32 handles all safety logic**: Limits, speed constraints, and motion interpolation
- **The app only sends JSON commands**: No client-side limit checking
- **Emergency Stop button**: Always available, sends immediate stop command
- **Connection loss**: Automatically detected; commands are not sent when disconnected

## ESP32 Integration Notes

### WebSocket Server Setup

The ESP32 must run a WebSocket server on the specified URL. Basic setup:

\`\`\`cpp
// Use Arduino library: WebSocketsServer by Links2004
#include <WebSocketsServer.h>

WebSocketsServer webSocket = WebSocketsServer(81);

void setup() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    // Parse JSON and execute command
    // Send status JSON back
  }
}
\`\`\`

### JSON Parsing in ESP32

Use `ArduinoJson` library for robust JSON handling:

\`\`\`cpp
#include <ArduinoJson.h>

StaticJsonDocument<256> doc;
deserializeJson(doc, payload);
const char* cmd = doc["cmd"];
float vx = doc["vx"]; // for drive_base
\`\`\`

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy (no environment variables needed for WebSocket)
4. Update WebSocket URL to your ESP32 IP/hostname

### Local Network

For local robot control on the same network:
- Use the robot's IP address: `ws://[ROBOT_IP]:81`
- Ensure firewall allows WebSocket port (81)

## Development

### Run in Dev Mode
\`\`\`bash
npm run dev
\`\`\`

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

### Lint Code
\`\`\`bash
npm run lint
\`\`\`

## Troubleshooting

### Connection Issues
- Verify ESP32 IP address and port
- Check network connectivity
- Look at browser console for WebSocket errors

### Commands Not Sending
- Check "Connected" status in the Connection panel
- View Event Log for error messages
- Verify JSON format in mock backend test

### Slider/Joystick Not Responsive
- Try refreshing the page
- Clear browser cache
- Check browser console for JavaScript errors

## Future Enhancements

- Robot position visualization (forward kinematics)
- Saved poses/macros
- Mobile app (React Native)
- Voice control
- Gesture recognition for joystick
- Multi-robot support
- Recording and playback
- Advanced diagnostics dashboard

## License

MIT

## Support

For issues or questions, please check the TypeScript types in `types/robot.ts` and the WebSocket hook implementation in `hooks/useRobotWebSocket.ts`.

---

**Happy controlling! 🤖**
