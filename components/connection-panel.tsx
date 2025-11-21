"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConnectionState } from "@/types/robot";
import { Bluetooth } from 'lucide-react';

interface ConnectionPanelProps {
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  error: string | null;
  deviceName: string | null;
}

export function ConnectionPanel({
  connectionState,
  onConnect,
  onDisconnect,
  error,
  deviceName,
}: ConnectionPanelProps) {
  const [wsUrl, setWsUrl] = useState("ws://192.168.4.1:81");

  const getStatusColor = (state: ConnectionState) => {
    switch (state) {
      case "connected":
        return "bg-green-500 shadow-lg shadow-green-500/50";
      case "connecting":
        return "bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse";
      case "error":
        return "bg-red-500 shadow-lg shadow-red-500/50";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusText = (state: ConnectionState) => {
    switch (state) {
      case "connected":
        return "✓ Connected";
      case "connecting":
        return "◉ Scanning...";
      case "error":
        return "✗ Error";
      default:
        return "◯ Disconnected";
    }
  };

  return (
    <Card className="w-full border-2 glow-cyan">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Bluetooth size={20} />
          Bluetooth Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={onConnect}
            disabled={connectionState === 'connected' || connectionState === 'connecting'}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-cyan-400"
          >
            {connectionState === 'connecting' ? 'Searching...' : 'Scan & Connect'}
          </Button>
          <Button
            onClick={onDisconnect}
            disabled={connectionState === 'disconnected'}
            className="flex-1 border-2 border-orange-400 bg-muted hover:bg-muted/80 text-foreground"
          >
            Disconnect
          </Button>
        </div>

        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded border border-border">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(connectionState)}`} />
          <div className="flex-1">
            <span className="text-sm font-mono font-bold text-foreground">{getStatusText(connectionState)}</span>
            {deviceName && <span className="text-xs text-cyan-400 ml-2">Device: {deviceName}</span>}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border-2 border-red-500 rounded text-sm text-red-300 font-mono">
            <span className="text-red-400">ERROR:</span> {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
