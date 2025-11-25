"use client";

import { useEffect, useRef, useState } from "react";
import BLEJoystick from "@/components/BLEJoystick";

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CMD_UUID = "12345678-1234-5678-1234-56789abcdef1";
const STATUS_UUID = "12345678-1234-5678-1234-56789abcdef2";
const DEVICE_NAME = "SARM_MASTER_BLE";

const INITIAL_JOINTS = [0, 45, 90, 0];

export default function ArmPage() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [statusText, setStatusText] = useState("Disconnected");
  const [joints, setJoints] = useState<number[]>(INITIAL_JOINTS);
  const [rawStatus, setRawStatus] = useState("");

  const cmdRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const pendingRef = useRef<any | null>(null);
  const busyRef = useRef(false);

  /* -------------------------------------------------------------
     CONNECT TO ESP32 MASTER
  ------------------------------------------------------------- */
  async function connect() {
    if (connecting) return;
    setConnecting(true);

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: DEVICE_NAME }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT failed");

      const service = await server.getPrimaryService(SERVICE_UUID);

      cmdRef.current = await service.getCharacteristic(CMD_UUID);
      const statusChar = await service.getCharacteristic(STATUS_UUID);

      /* Enable notifications */
      await statusChar.startNotifications();

      statusChar.addEventListener("characteristicvaluechanged", (event: any) => {
        const txt = new TextDecoder().decode(event.target.value);
        setRawStatus(txt);

        try {
          const js = JSON.parse(txt);

          if (Array.isArray(js.joints)) {
            setJoints(js.joints.map((n: any) => Number(n)));
          }

          if (js.status) {
            setStatusText(js.status);
          }
        } catch {
          setStatusText(txt);
        }
      });

      device.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        cmdRef.current = null;
        pendingRef.current = null;
        setStatusText("Disconnected");
      });

      setConnected(true);
      setStatusText("Connected!");
    } catch (err) {
      console.error(err);
      setStatusText("Connection failed");
    }

    setConnecting(false);
  }

  /* -------------------------------------------------------------
     BLE COMMAND QUEUE  — runs every 80ms
  ------------------------------------------------------------- */
  useEffect(() => {
    const id = setInterval(async () => {
      if (!connected) return;
      if (!cmdRef.current) return;
      if (!pendingRef.current) return;
      if (busyRef.current) return;

      busyRef.current = true;

      try {
        const json = JSON.stringify(pendingRef.current);
        const data = new TextEncoder().encode(json);
        await cmdRef.current.writeValue(data);
        pendingRef.current = null;
      } catch (err) {
        console.error("BLE write error:", err);
      }

      busyRef.current = false;
    }, 80);

    return () => clearInterval(id);
  }, [connected]);

  function queueCommand(obj: any) {
    if (!connected) return;
    pendingRef.current = obj; // will be sent in writer loop
  }

  /* -------------------------------------------------------------
     ARM CONTROL (SLAVE)
  ------------------------------------------------------------- */
  function updateJoint(index: number, angle: number) {
    const next = [...joints];
    next[index] = angle;
    setJoints(next);

    queueCommand({
      cmd: "set_pose",
      joints: next,
    });
  }

  function goHome() {
    queueCommand({ cmd: "home" });
  }

  /* -------------------------------------------------------------
     UI
  ------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-5">

        <h1 className="text-center text-2xl font-bold tracking-wide">
          SARM 4-DOF ARM + Motor Base Controller
        </h1>

        {/* CONNECT BUTTON */}
        {!connected ? (
          <button
            onClick={connect}
            disabled={connecting}
            className="w-full py-3 bg-blue-600 rounded-xl text-lg font-semibold"
          >
            {connecting ? "Connecting…" : "Connect to SARM_MASTER_BLE"}
          </button>
        ) : (
          <p className="text-center text-green-400">Connected</p>
        )}

        <p className="text-center text-gray-400">{statusText}</p>

        {/* MAIN LAYOUT */}
        {connected && (
          <div className="flex flex-col md:flex-row gap-4">

            {/* JOYSTICK — Controls Motor Base */}
            <div className="w-full md:w-1/2 p-4 bg-white/10 rounded-xl">
              <h2 className="text-emerald-300 text-sm font-semibold mb-2">
                Base Drive (4 Wheels)
              </h2>

              <BLEJoystick
                connected={connected}
                onMoveCommand={(cmd) => queueCommand(cmd)}
              />
            </div>

            {/* ARM CONTROL — 4 DOF JOINTS */}
            <div className="w-full md:w-1/2 p-4 bg-white/10 rounded-xl">
              <h2 className="text-blue-300 text-sm font-semibold mb-2">
                Arm Control (4-DOF)
              </h2>

              {joints.map((ang, id) => (
                <div key={id} className="mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Joint {id}</span>
                    <span>{ang}°</span>
                  </div>

                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={ang}
                    onChange={(e) => updateJoint(id, Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              ))}

              <button
                onClick={goHome}
                className="w-full py-2 bg-green-600 rounded-xl mt-3"
              >
                HOME
              </button>

              <pre className="bg-black/50 text-xs rounded-xl p-2 mt-3 max-h-32 overflow-auto">
                {rawStatus}
              </pre>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
