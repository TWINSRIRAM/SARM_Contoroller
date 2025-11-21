"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GripperCommand, HomeCommand, StopCommand } from "@/types/robot";

interface ActionButtonsProps {
  onCommand: (cmd: GripperCommand | HomeCommand | StopCommand) => void;
  isConnected: boolean;
}

export function ActionButtons({ onCommand, isConnected }: ActionButtonsProps) {
  return (
    <Card className="w-full border-2 glow-orange">
      <CardHeader>
        <CardTitle className="text-orange-400">Action Commands</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => onCommand({ cmd: "gripper", state: "open" })}
          disabled={!isConnected}
          className="bg-green-600 hover:bg-green-500 text-white border-2 border-green-400 font-semibold"
        >
          Gripper Open
        </Button>
        <Button
          onClick={() => onCommand({ cmd: "gripper", state: "close" })}
          disabled={!isConnected}
          className="bg-orange-600 hover:bg-orange-500 text-white border-2 border-orange-400 font-semibold"
        >
          Gripper Close
        </Button>
        <Button
          onClick={() => onCommand({ cmd: "home" })}
          disabled={!isConnected}
          className="col-span-2 bg-cyan-600 hover:bg-cyan-500 text-white border-2 border-cyan-400 font-semibold"
        >
          Home All Joints
        </Button>
        <Button
          onClick={() => onCommand({ cmd: "stop" })}
          disabled={!isConnected}
          className="col-span-2 bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 font-semibold glow-red"
        >
          ⚠ Emergency Stop
        </Button>
      </CardContent>
    </Card>
  );
}
