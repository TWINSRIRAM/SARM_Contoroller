"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LogEntry } from "@/types/robot";

interface EventLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function EventLog({ logs, onClear }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "command":
        return "text-cyan-400"; // Gaming colors
      case "status":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-orange-400";
    }
  };

  return (
    <Card className="w-full border-2 glow-orange">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-orange-400">Event Log</CardTitle>
        <Button onClick={onClear} variant="outline" size="sm" className="h-7 text-xs">
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="bg-card border-2 border-border rounded p-2 h-48 overflow-y-auto font-mono text-xs space-y-0.5"
        >
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Awaiting events...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2 hover:bg-muted/50 px-1 py-0.5 rounded">
                <span className="text-muted-foreground flex-shrink-0 w-16 text-xs">[{log.timestamp}]</span>
                <span className={`w-10 flex-shrink-0 font-bold text-xs ${getLogColor(log.type)}`}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-foreground flex-1 text-xs">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
