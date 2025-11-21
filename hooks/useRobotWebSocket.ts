"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionState, LogEntry, RobotCommand, RobotStatus } from "@/types/robot";

interface UseRobotWebSocketReturn {
  connect: (url: string) => void;
  disconnect: () => void;
  sendCommand: (cmd: RobotCommand) => void;
  connectionState: ConnectionState;
  lastStatus: RobotStatus | null;
  logs: LogEntry[];
  clearLogs: () => void;
  error: string | null;
}

export function useRobotWebSocket(): UseRobotWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [lastStatus, setLastStatus] = useState<RobotStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    if (typeof window !== "undefined") {
      const storedLogs = localStorage.getItem("robotLogs");
      return storedLogs ? JSON.parse(storedLogs) : [];
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);
  const logIdRef = useRef(0);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const id = `log-${++logIdRef.current}`;
    const timestamp = new Date().toLocaleTimeString();
    const newLog = { id, timestamp, type, message };
    setLogs((prev) => {
      const updated = [...prev, newLog].slice(-100); // Keep last 100 logs
      if (typeof window !== "undefined") {
        localStorage.setItem("robotLogs", JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const connect = useCallback((url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState("connecting");
    setError(null);

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setConnectionState("connected");
        addLog("info", `Connected to ${url}`);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RobotStatus;
          if (data.type === "status") {
            setLastStatus(data);
            addLog("status", `Status: ${data.status} - ${data.message}`);
            if (data.errors.length > 0) {
              addLog("error", `Errors: ${data.errors.join(", ")}`);
            }
          }
        } catch (e) {
          addLog("error", `Failed to parse message: ${event.data}`);
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionState("error");
        const errorMsg = "WebSocket error occurred";
        setError(errorMsg);
        addLog("error", errorMsg);
      };

      wsRef.current.onclose = () => {
        setConnectionState("disconnected");
        addLog("info", "Disconnected from server");
      };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to connect";
      setConnectionState("error");
      setError(errorMsg);
      addLog("error", errorMsg);
    }
  }, [addLog]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState("disconnected");
  }, []);

  const sendCommand = useCallback((cmd: RobotCommand) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
      addLog("command", `Sent: ${cmd.cmd}`);
    } else {
      const errorMsg = "Not connected to WebSocket";
      setError(errorMsg);
      addLog("error", errorMsg);
    }
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("robotLogs");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendCommand,
    connectionState,
    lastStatus,
    logs,
    clearLogs,
    error,
  };
}
