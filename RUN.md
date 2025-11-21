# SARM Robot Controller - VS Code Setup & Execution Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [VS Code Installation & Setup](#vs-code-installation--setup)
3. [Project Setup](#project-setup)
4. [Running the Application](#running-the-application)
5. [Bluetooth Connection Testing](#bluetooth-connection-testing)
6. [Debugging with VS Code](#debugging-with-vs-code)
7. [ESP32 Serial Monitoring](#esp32-serial-monitoring)
8. [Testing Commands](#testing-commands)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware
- Computer with Windows/Mac/Linux
- USB cable for ESP32 (optional, for serial monitoring)
- Mobile phone with Bluetooth 4.0+ (for testing)

### Software
- **Node.js**: v16 or higher
  - Download from: https://nodejs.org/
  - Verify installation: `node --version` and `npm --version`
- **VS Code**: Latest version
  - Download from: https://code.visualstudio.com/
- **Git**: (Optional, but recommended)
  - Download from: https://git-scm.com/

### Browser Support
- Chrome 56+ (best Bluetooth support)
- Edge 79+
- Opera 43+
- Android Chrome (for mobile testing)

---

## VS Code Installation & Setup

### Step 1: Install VS Code
1. Download VS Code from https://code.visualstudio.com/
2. Run the installer and follow the setup wizard
3. Launch VS Code after installation

### Step 2: Install Recommended Extensions
Open VS Code and install these extensions:

1. **ES7+ React/Redux/React-Native snippets**
   - Search for: `dsznajder.es7-react-js-snippets`
   - Click Install

2. **Prettier - Code formatter**
   - Search for: `esbenp.prettier-vscode`
   - Click Install

3. **ESLint**
   - Search for: `dbaeumer.vscode-eslint`
   - Click Install

4. **Thunder Client** (for API testing)
   - Search for: `rangav.vscode-thunder-client`
   - Click Install

5. **REST Client** (alternative API testing)
   - Search for: `humao.rest-client`
   - Click Install

### Step 3: Configure VS Code Settings
1. Open Settings: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Settings" and open "Preferences: Open Settings (JSON)"
3. Add these settings:

\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.wordWrap": "on",
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true
  }
}
\`\`\`

---

## Project Setup

### Option 1: Clone from GitHub (Recommended)
\`\`\`bash
git clone <your-repo-url>
cd sarm-robot-controller
npm install
\`\`\`

### Option 2: Manual Setup from Scratch
\`\`\`bash
# Create a new Next.js project
npx create-next-app@latest sarm-robot-controller --typescript --tailwind --no-eslint

cd sarm-robot-controller

# Install additional dependencies
npm install
\`\`\`

### Option 3: Download ZIP and Setup
1. Download the project ZIP file
2. Extract it to your desired location
3. Open the folder in VS Code: `File > Open Folder`
4. Open terminal in VS Code: `Ctrl+~` (backtick)
5. Run: `npm install`

### Step 1: Open Project in VS Code
\`\`\`bash
# Open VS Code in the project folder
code sarm-robot-controller

# Or navigate to the folder and open VS Code
cd sarm-robot-controller
code .
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install
\`\`\`

**Expected Output:**
\`\`\`
added 200+ packages in 45s
\`\`\`

### Step 3: Verify Installation
\`\`\`bash
npm list next react react-dom
\`\`\`

**Expected Output:**
\`\`\`
sarm-robot-controller@0.1.0
├── next@16.0.0
├── react@19.0.0
└── react-dom@19.0.0
\`\`\`

---

## Running the Application

### Step 1: Start Development Server
\`\`\`bash
npm run dev
\`\`\`

**Expected Output:**
\`\`\`
> next dev

  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.4s
\`\`\`

### Step 2: Access in Browser
1. Open browser (Chrome recommended)
2. Navigate to: `http://localhost:3000`
3. You should see the SARM Robot Controller interface

### Step 3: Verify UI is Loaded
- Confirm you see the cyberpunk-themed dark interface
- Left side shows the joystick control area
- Right side shows joint sliders and buttons
- Status panel visible on the right

### Troubleshooting Dev Server
If port 3000 is in use, use a different port:
\`\`\`bash
npm run dev -- -p 3001
\`\`\`

---

## Bluetooth Connection Testing

### Step 1: Enable Bluetooth on Your Device
1. Ensure your ESP32 is powered and running the Bluetooth firmware
2. On your computer/mobile, enable Bluetooth
3. Make sure the ESP32 is in Bluetooth advertising mode (look for LED indicator)

### Step 2: Connect from the Web App
1. Open http://localhost:3000 in Chrome
2. Click the **"Scan Devices"** button (top-left connection panel)
3. Wait for 3-5 seconds while scanning
4. Look for your ESP32 device (usually named: `SARM-Robot`, `ESP32-SARM`, etc.)
5. Click on the device to connect

### Step 3: Verify Connection Status
- Connection indicator should turn **GREEN**
- Status shows: "Connected to: [Device Name]"
- Log shows: "Connected to Bluetooth device"
- All control buttons become **ENABLED** (clickable)

### Step 4: Test Connection Stability
1. Watch the status updates flowing in the log
2. Movement values should update every 100ms
3. No "Connection Lost" messages should appear

---

## Debugging with VS Code

### Enable Debug Logs
Add this to your components temporarily for debugging:

\`\`\`typescript
console.log("[v0] Bluetooth connected:", device.name);
console.log("[v0] Command sent:", command);
console.log("[v0] Status received:", statusMessage);
\`\`\`

### Using Chrome DevTools
1. Open VS Code integrated terminal: `Ctrl+~`
2. Look at the console output from `npm run dev`
3. Open browser DevTools: `F12` or `Ctrl+Shift+I`
4. Go to **Console** tab to see all logs
5. Go to **Network** tab to see WebSocket/Bluetooth activity

### Viewing Network Activity
1. DevTools → **Network** tab
2. Filter by **WS** (WebSocket) or look for Bluetooth events
3. Click on messages to see JSON payload
4. Verify command format matches protocol spec

### Debugging Bluetooth Messages
In browser DevTools Console, paste:
\`\`\`javascript
// Monitor all Bluetooth events
window.addEventListener('message', (event) => {
  console.log("[v0] Bluetooth Message:", event.data);
});
\`\`\`

---

## ESP32 Serial Monitoring

### Setup Serial Monitor in VS Code

#### Option 1: Using PlatformIO Extension
1. Install PlatformIO extension in VS Code
2. Connect ESP32 via USB
3. Click PlatformIO: Serial Port Monitor (bottom blue bar)
4. Select COM port (COM3-COM6 typically)
5. Baud rate: 115200
6. Watch real-time ESP32 output

#### Option 2: Using Arduino IDE
1. Download Arduino IDE from https://www.arduino.cc/en/software
2. Connect ESP32 via USB
3. Open Tools → Serial Monitor
4. Set baud rate to 115200
5. Watch logs as you control robot

#### Option 3: Using Terminal (Windows)
\`\`\`bash
# List available COM ports
Get-SerialPortNames  # PowerShell

# Or use this batch command
mode COM3 baud=115200
# Then read from COM3
\`\`\`

#### Option 3: Using Terminal (Mac/Linux)
\`\`\`bash
# Find ESP32 port
ls /dev/tty.usb* 
# or
ls /dev/ttyUSB*

# Monitor serial output
screen /dev/ttyUSB0 115200
# To exit: Ctrl+A then Ctrl+D

# Or use picocom
picocom /dev/ttyUSB0 -b 115200
# To exit: Ctrl+A Ctrl+X
\`\`\`

### Expected Serial Output When Connected
\`\`\`
[Bluetooth] Device connected: SARM-Controller
[Command] Received: {"type":"drive_base","vx":0.5,"vy":0.3,"wz":0.1}
[Status] Sending: {"joints":[0,45.2,90.1,0,-30.5,0],"error":null}
[Status] Sending: {"joints":[0,45.3,90.2,0,-30.4,0],"error":null}
\`\`\`

---

## Testing Commands

### Test 1: Verify Web App Loads
\`\`\`bash
# Terminal shows:
npm run dev

# Browser shows:
✓ SARM Robot Controller loads with cyberpunk theme
✓ Connection panel visible
✓ Joystick and sliders visible
\`\`\`

### Test 2: Test Bluetooth Connection
1. Click "Scan Devices"
2. Select ESP32 from list
3. Verify green connection indicator
4. Check logs: "Connected to: [Device Name]"

### Test 3: Test Drive Base (Joystick)
1. Connection must be GREEN
2. Touch/click the joystick area on the LEFT
3. Drag to different positions
4. Watch logs for continuous commands:
   \`\`\`json
   {"type":"drive_base","vx":0.5,"vy":0.3,"wz":0.1}
   \`\`\`
5. ESP32 should move wheels accordingly

### Test 4: Test Joint Controls (Sliders)
1. Connection must be GREEN
2. Drag any slider on the RIGHT side
3. Watch logs for commands:
   \`\`\`json
   {"type":"set_joint","joint":0,"angle":45}
   \`\`\`
4. ESP32 should move specific joint

### Test 5: Test Action Buttons
1. Connection must be GREEN
2. Click "Home" button → logs show: `{"type":"home"}`
3. Click "Gripper Open" → logs show: `{"type":"gripper","open":true}`
4. Click "Gripper Close" → logs show: `{"type":"gripper","open":false}`
5. Click "Stop" → logs show: `{"type":"stop"}`
6. Watch ESP32 execute each action

### Test 6: Test Event Logs
1. Perform some commands (joystick, sliders, buttons)
2. Logs should accumulate in the status panel
3. Click "View Logs" button to see full event history
4. Filter by type: Command, Status, Error, Info
5. Export logs as CSV

---

## Troubleshooting

### Issue 1: "Port 3000 is already in use"
**Solution:**
\`\`\`bash
# Use a different port
npm run dev -- -p 3001

# Or kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
\`\`\`

### Issue 2: "Cannot find module" Error
**Solution:**
\`\`\`bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
\`\`\`

### Issue 3: Bluetooth "No Devices Found"
**Checklist:**
- ✓ ESP32 is powered on
- ✓ ESP32 is running the Bluetooth firmware
- ✓ Phone/Computer has Bluetooth enabled
- ✓ Browser has Bluetooth permission (Chrome will ask)
- ✓ No other device is connected to ESP32
- ✓ Try refreshing the page: `F5`

**Solution:**
\`\`\`bash
# Check browser console for errors
F12 → Console tab → Look for Bluetooth errors

# Grant permissions
1. Click permission prompt
2. Allow Bluetooth access
3. Try scanning again
\`\`\`

### Issue 4: Connected but "No Data Received"
**Check ESP32 is sending data:**
1. Open Serial Monitor (see section above)
2. Verify ESP32 shows connection message
3. Check ESP32 code is sending status updates
4. Verify baud rate is 115200

**Solution:**
\`\`\`typescript
// Add debug logs in useRobotBluetooth.ts
console.log("[v0] Characteristic notification received:", event.target.value);
\`\`\`

### Issue 5: Commands Sent but Robot Doesn't Move
**Check command format:**
1. Open DevTools Console: `F12`
2. Look for command JSON:
   \`\`\`json
   {"type":"drive_base","vx":0.5,"vy":0.3,"wz":0.1}
   \`\`\`
3. Verify JSON format is valid
4. Check ESP32 code is parsing JSON correctly
5. Verify motor pins are correct

**Solution:**
- Check ESP32 serial output for command reception
- Verify motor drivers are powered
- Test motors directly with code

### Issue 6: Connection Drops Frequently
**Check signal strength:**
1. Move device closer to ESP32
2. Remove obstacles between them
3. Check for interference (WiFi, microwaves)

**Solution:**
\`\`\`typescript
// Add reconnection logic - already in useRobotBluetooth.ts
// Auto-reconnects after 3 seconds
\`\`\`

### Issue 7: VS Code Terminal Not Working
**Solution:**
\`\`\`bash
# Use external terminal instead
# Windows: Open Command Prompt in project folder
# Mac/Linux: Open Terminal in project folder

# Type:
npm run dev
\`\`\`

### Issue 8: Permission Denied on Mac/Linux
**Solution:**
\`\`\`bash
# Give execution permission
chmod +x node_modules/.bin/next

# Then try again
npm run dev
\`\`\`

---

## Commands Reference

### NPM Commands
\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Install specific package
npm install package-name

# Update all packages
npm update
\`\`\`

### VS Code Keyboard Shortcuts
\`\`\`
Ctrl+Shift+P          Open Command Palette
Ctrl+`                Open Terminal
Ctrl+/                Toggle Comment
Ctrl+S                Save File
Ctrl+Z                Undo
Ctrl+Y                Redo
Ctrl+F                Find
Ctrl+H                Replace
F12                   Open DevTools
Alt+Shift+F           Format Document
\`\`\`

### Debugging Commands
\`\`\`javascript
// Check connection status
console.log(window.robotDevice);

// Monitor logs
window.eventLogs

// Test command sending
window.sendCommand({type: "home"})
\`\`\`

---

## Performance Tips

### Optimize Development Speed
1. Use Chrome for faster DevTools
2. Close unnecessary extensions
3. Keep console closed when not debugging
4. Use filtered logging to reduce noise

### Monitor Performance
1. DevTools → Performance tab
2. Record while moving joystick
3. Look for dropped frames (should be 60fps)
4. Check Bluetooth message frequency (should be 10Hz)

---

## Next Steps

1. ✓ Setup complete - move to [CONNECTION.md](CONNECTION.md) for hardware connection
2. Implement ESP32 code from [BLUETOOTH_PROTOCOL.md](BLUETOOTH_PROTOCOL.md)
3. Test each command following the Testing Commands section above
4. Monitor logs and debug any issues
5. Deploy to Vercel (optional) for remote access

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Bluetooth API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **ESP32 Documentation**: https://docs.espressif.com/projects/esp-idf/
- **VS Code Docs**: https://code.visualstudio.com/docs

---

**Last Updated**: November 2025
**Version**: 1.0
