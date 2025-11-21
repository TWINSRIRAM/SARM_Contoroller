"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DriveBaseCommand } from "@/types/robot";

interface BaseJoystickProps {
  onCommand: (cmd: DriveBaseCommand) => void;
  isConnected: boolean;
}

export function BaseJoystick({ onCommand, isConnected }: BaseJoystickProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const sendIntervalRef = useRef<NodeJS.Timeout>();

  const CANVAS_SIZE = 280;
  const JOYSTICK_RADIUS = 45;
  const OUTER_RADIUS = 110;

  const drawJoystick = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with dark background
    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;

    // Outer circle - cyan glow
    ctx.strokeStyle = "rgba(85, 200, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, OUTER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = "rgba(85, 200, 255, 0.2)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, OUTER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Inner guides - orange
    ctx.strokeStyle = "rgba(255, 165, 0, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX - OUTER_RADIUS, centerY);
    ctx.lineTo(centerX + OUTER_RADIUS, centerY);
    ctx.moveTo(centerX, centerY - OUTER_RADIUS);
    ctx.lineTo(centerX, centerY + OUTER_RADIUS);
    ctx.stroke();
    ctx.setLineDash([]);

    // Joystick circle - animated color
    const joystickColor = isPressed ? "rgba(85, 200, 255, 1)" : "rgba(85, 200, 255, 0.7)";
    ctx.fillStyle = joystickColor;
    ctx.beginPath();
    ctx.arc(centerX + x, centerY + y, JOYSTICK_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Joystick glow
    ctx.fillStyle = "rgba(85, 200, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(centerX + x, centerY + y, JOYSTICK_RADIUS + 15, 0, Math.PI * 2);
    ctx.fill();

    // Joystick border
    ctx.strokeStyle = "rgba(255, 165, 0, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX + x, centerY + y, JOYSTICK_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleStart = () => {
    setIsPressed(true);
  };

  const handleEnd = () => {
    setIsPressed(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPressed || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - CANVAS_SIZE / 2;
    const y = e.clientY - rect.top - CANVAS_SIZE / 2;

    const distance = Math.sqrt(x * x + y * y);
    let finalX = x;
    let finalY = y;

    if (distance > OUTER_RADIUS) {
      const ratio = OUTER_RADIUS / distance;
      finalX = x * ratio;
      finalY = y * ratio;
    }

    setJoystickPos({ x: finalX, y: finalY });
  };

  useEffect(() => {
    drawJoystick(joystickPos.x, joystickPos.y);
  }, [joystickPos, isPressed]);

  useEffect(() => {
    if (!isConnected) return;

    if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);

    sendIntervalRef.current = setInterval(() => {
      const vx = (joystickPos.x / OUTER_RADIUS) * 0.5;
      const vy = -(joystickPos.y / OUTER_RADIUS) * 0.5;
      const omega = 0;

      onCommand({
        cmd: "drive_base",
        vx: parseFloat(vx.toFixed(2)),
        vy: parseFloat(vy.toFixed(2)),
        omega,
      });
    }, 50);

    return () => {
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
    };
  }, [joystickPos, onCommand, isConnected]);

  return (
    <Card className="w-full border-2 glow-cyan">
      <CardHeader>
        <CardTitle className="text-cyan-400">Base Joystick</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onPointerDown={handleStart}
          onPointerUp={handleEnd}
          onPointerMove={handleMove}
          onPointerLeave={handleEnd}
          className="border-2 border-cyan-400 rounded cursor-pointer hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
        />
        <div className="mt-4 text-center text-xs space-y-1">
          <p className="text-cyan-400 font-mono font-bold">Vx: {joystickPos.x.toFixed(2)}</p>
          <p className="text-orange-400 font-mono font-bold">Vy: {joystickPos.y.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
