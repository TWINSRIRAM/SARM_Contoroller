"use client";

import { useState, useRef, useEffect } from "react";

const SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const CMD_UUID = "12345678-1234-5678-1234-56789abcdef1";

export default function BLEJoystick() {
  const [connected, setConnected] = useState(false);
  const [vx, setVx] = useState(0);
  const [vy, setVy] = useState(0);

  const cmdRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const pending = useRef<any>(null);
  const sending = useRef(false);

  async function connectBLE() {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: "SARM_MASTER_BLE" }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      cmdRef.current = await service.getCharacteristic(CMD_UUID);

      setConnected(true);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const t = setInterval(async () => {
      if (!cmdRef.current || !pending.current || sending.current) return;

      try {
        sending.current = true;
        const json = JSON.stringify(pending.current);
        const data = new TextEncoder().encode(json);
        await cmdRef.current.writeValue(data);
        pending.current = null;
      } catch (e) {
        console.warn("Write error", e);
      } finally {
        sending.current = false;
      }
    }, 80);

    return () => clearInterval(t);
  }, []);

  function sendMove(vx: number, vy: number) {
    pending.current = { cmd: "drive_base", vx, vy, omega: 0 };
  }

  function move(e: any) {
    const r = e.target.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;

    const nx = Math.max(-1, Math.min(1, x / 60));
    const ny = Math.max(-1, Math.min(1, -y / 60));

    setVx(nx);
    setVy(ny);

    sendMove(nx, ny);
  }

  function stop() {
    setVx(0);
    setVy(0);
    sendMove(0, 0);
  }

  return (
    <div className="p-4 text-white">
      <button
        onClick={connectBLE}
        className="w-full py-3 bg-blue-600 rounded-xl mb-6"
      >
        {connected ? "Connected" : "Connect Joystick"}
      </button>

      <div className="text-center mb-4">
        <p>vx: {vx.toFixed(2)}</p>
        <p>vy: {vy.toFixed(2)}</p>
      </div>

      <div
        onPointerMove={move}
        onPointerDown={move}
        onPointerUp={stop}
        onPointerLeave={stop}
        className="w-48 h-48 mx-auto bg-gray-900 rounded-full flex items-center justify-center text-gray-300 border border-gray-600 select-none"
      >
        JOYSTICK
      </div>
    </div>
  );
}
