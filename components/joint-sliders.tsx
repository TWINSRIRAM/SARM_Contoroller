"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SetPoseCommand } from "@/types/robot";

interface JointSlidersProps {
  onCommand: (cmd: SetPoseCommand) => void;
  isConnected: boolean;
}

const JOINT_NAMES = ["Base", "Shoulder", "Elbow", "Wrist", "Gripper"];
const JOINT_RANGES = [
  { min: 0, max: 360 },
  { min: -90, max: 90 },
  { min: -90, max: 90 },
  { min: -180, max: 180 },
  { min: 0, max: 180 },
];

export function JointSliders({ onCommand, isConnected }: JointSlidersProps) {
  const [jointAngles, setJointAngles] = useState<number[]>([0, 0, 0, 0, 0]);

  const handleSliderChange = (index: number, value: number) => {
    const newAngles = [...jointAngles];
    newAngles[index] = value;
    setJointAngles(newAngles);

    if (isConnected) {
      onCommand({
        cmd: "set_pose",
        joints: newAngles,
      });
    }
  };

  const handleReset = () => {
    const resetAngles = [0, 0, 0, 0, 0];
    setJointAngles(resetAngles);
    if (isConnected) {
      onCommand({
        cmd: "set_pose",
        joints: resetAngles,
      });
    }
  };

  return (
    <Card className="w-full border-2 glow-cyan">
      <CardHeader>
        <CardTitle className="text-cyan-400">Joint Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jointAngles.map((angle, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-foreground">
                {JOINT_NAMES[i]}
              </label>
              <span className={`text-sm font-bold ${i % 2 === 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                {angle.toFixed(1)}°
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={JOINT_RANGES[i].min}
                max={JOINT_RANGES[i].max}
                value={angle}
                onChange={(e) => handleSliderChange(i, parseFloat(e.target.value))}
                className="w-full h-2 bg-card border border-border rounded cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        ))}

        <div className="pt-2">
          <button
            onClick={handleReset}
            disabled={!isConnected}
            className="w-full py-2 px-3 bg-muted border-2 border-primary text-foreground rounded font-semibold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Position
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
