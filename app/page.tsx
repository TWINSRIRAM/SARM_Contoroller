"use client";

import { useState, useRef } from "react";

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CMD_UUID = "12345678-1234-5678-1234-56789abcdef1";
const STATUS_UUID = "12345678-1234-5678-1234-56789abcdef2";

export default function ArmPage() {
  const [connected, setConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Disconnected");
  const [joints, setJoints] = useState([0, 45, 90, 0]);

  const cmdRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const busyRef = useRef(false);

  async function connect() {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: "SARM_MASTER_BLE" }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      cmdRef.current = await service.getCharacteristic(CMD_UUID);
      const stat = await service.getCharacteristic(STATUS_UUID);

      await stat.startNotifications();
      stat.addEventListener("characteristicvaluechanged", (event: any) => {
        const raw = new TextDecoder().decode(event.target.value);

        try {
          const js = JSON.parse(raw);
          if (Array.isArray(js.joints)) setJoints(js.joints);
          if (js.message) setStatusMsg(js.message);
        } catch {
          setStatusMsg(raw);
        }
      });

      device.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        setStatusMsg("Disconnected");
      });

      setConnected(true);
      setStatusMsg("Connected to SARM_MASTER_BLE");
    } catch (e) {
      console.error(e);
      setStatusMsg("Connection Failed");
    }
  }

  async function send(json: any) {
    if (!cmdRef.current || busyRef.current) return;
    busyRef.current = true;

    try {
      const enc = new TextEncoder().encode(JSON.stringify(json));
      await cmdRef.current.writeValue(enc);
    } catch (e) {
      console.error("Write failed:", e);
    }

    busyRef.current = false;
  }

  function setJoint(i: number, angle: number) {
    const newPose = [...joints];
    newPose[i] = angle;
    setJoints(newPose);

    send({ cmd: "set_pose", joints: newPose });
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        SARM 4-DOF ARM CONTROL
      </h1>

      {!connected && (
        <button
          onClick={connect}
          className="w-full py-3 bg-blue-600 rounded-xl text-lg"
        >
          Connect to SARM_MASTER_BLE
        </button>
      )}

      <p className="mt-4 text-center text-gray-300">{statusMsg}</p>

      {connected && (
        <div className="mt-8 space-y-8">
          {[0, 1, 2, 3].map((id) => (
            <div key={id}>
              <div className="flex justify-between text-sm mb-1">
                <span>Joint {id}</span>
                <span>{joints[id]}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={joints[id]}
                onChange={(e) => setJoint(id, parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          ))}

          <button
            onClick={() => send({ cmd: "home" })}
            className="w-full py-3 bg-green-600 rounded-xl text-lg"
          >
            HOME
          </button>
        </div>
      )}
    </div>
  );
}
