"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RobotStatus } from "@/types/robot";

interface StatusPanelProps {
  status: RobotStatus | null;
}

export function StatusPanel({ status }: StatusPanelProps) {
  if (!status) {
    return (
      <Card className="w-full border-2 glow-orange">
        <CardHeader>
          <CardTitle className="text-orange-400">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Waiting for connection...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 glow-orange">
      <CardHeader>
        <CardTitle className="text-orange-400">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-border rounded p-2">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`text-sm font-bold ${status.status === "ok" ? "text-green-400" : "text-red-400"}`}>
              {status.status === "ok" ? "✓ OK" : "✗ ERROR"}
            </p>
          </div>
          <div className="bg-card border border-border rounded p-2">
            <p className="text-xs text-muted-foreground">Message</p>
            <p className="text-sm font-bold text-cyan-400">{status.message}</p>
          </div>
        </div>

        {/* Joint Angles Display */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-bold">Joint Angles</p>
          <div className="grid grid-cols-5 gap-1">
            {status.joints.map((angle, i) => (
              <div key={i} className="bg-card border-2 border-cyan-400/50 rounded p-1 text-center hover:border-cyan-400 transition-colors">
                <p className="text-xs text-cyan-400">J{i + 1}</p>
                <p className="text-xs font-bold text-foreground">{angle.toFixed(0)}°</p>
              </div>
            ))}
          </div>
        </div>

        {/* Base Velocities */}
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-card border-2 border-orange-400/50 rounded p-2 text-center hover:border-orange-400 transition-colors">
            <p className="text-xs text-orange-400 font-bold">Vx</p>
            <p className="text-xs font-mono text-foreground">{status.base.vx.toFixed(2)}</p>
          </div>
          <div className="bg-card border-2 border-green-400/50 rounded p-2 text-center hover:border-green-400 transition-colors">
            <p className="text-xs text-green-400 font-bold">Vy</p>
            <p className="text-xs font-mono text-foreground">{status.base.vy.toFixed(2)}</p>
          </div>
          <div className="bg-card border-2 border-purple-400/50 rounded p-2 text-center hover:border-purple-400 transition-colors">
            <p className="text-xs text-purple-400 font-bold">Ω</p>
            <p className="text-xs font-mono text-foreground">{status.base.omega.toFixed(2)}</p>
          </div>
        </div>

        {/* Error Display */}
        {status.errors.length > 0 && (
          <div className="p-2 bg-red-900/40 border-2 border-red-500 rounded">
            <p className="text-xs text-red-400 font-bold mb-1">System Errors:</p>
            {status.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-300 font-mono">
                • {err}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
