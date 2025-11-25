"use client";

import { useState, useRef } from "react";

interface Props {
  connected: boolean;
  onMoveCommand: (cmd: { cmd: string; action: string; speed: number }) => void;
}

export default function BLEJoystick({ connected, onMoveCommand }: Props) {
  const stickRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });

  const radius = 60; // movement radius

  function send(action: string, speed: number) {
    if (!connected) return;

    onMoveCommand({
      cmd: "motor",
      action,
      speed,
    });
  }

  function handleMove(e: any) {
    if (!stickRef.current || !connected) return;

    const r = stickRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = radius;

    const nx = Math.max(-1, Math.min(1, dx / max));
    const ny = Math.max(-1, Math.min(1, dy / max));

    // visual stick movement
    const limitedDist = Math.min(dist, max);
    const angle = Math.atan2(dy, dx);

    setPos({
      x: limitedDist * Math.cos(angle),
      y: limitedDist * Math.sin(angle),
    });

    // Determine direction
    const dead = 0.2;
    let action = "stop";

    if (Math.abs(nx) < dead && Math.abs(ny) < dead) action = "stop";
    else if (Math.abs(ny) >= Math.abs(nx)) action = ny < 0 ? "forward" : "backward";
    else action = nx > 0 ? "right" : "left";

    const mag = Math.min(1, limitedDist / max);
    const speed = Math.round(mag * 255);

    send(action, speed);
  }

  function reset() {
    setPos({ x: 0, y: 0 });
    send("stop", 0);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={stickRef}
        onPointerDown={handleMove}
        onPointerMove={(e) => e.buttons === 1 && handleMove(e)}
        onPointerUp={reset}
        onPointerLeave={reset}
        className="relative w-40 h-40 bg-black/50 border border-white/10 rounded-full touch-none"
      >
        {/* Moving Stick */}
        <div
          className="absolute w-14 h-14 bg-gray-200 rounded-full shadow-xl"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
            top: "50%",
            left: "50%",
            transition: pos.x === 0 && pos.y === 0 ? "0.15s ease-out" : "none",
          }}
        />
      </div>

      {!connected && (
        <p className="text-xs text-red-400">Connect Bluetooth to enable joystick</p>
      )}
    </div>
  );
}
