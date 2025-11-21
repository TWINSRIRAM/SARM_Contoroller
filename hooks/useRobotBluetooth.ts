'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionState, LogEntry, RobotCommand, RobotStatus } from '@/types/robot';

// Bluetooth UUIDs for SARM Robot
const ROBOT_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const COMMAND_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';
const STATUS_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef2';

interface UseRobotBluetoothReturn {
  connect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: RobotCommand) => void;
  connectionState: ConnectionState;
  lastStatus: RobotStatus | null;
  logs: LogEntry[];
  clearLogs: () => void;
  error: string | null;
  deviceName: string | null;
}

export function useRobotBluetooth(): UseRobotBluetoothReturn {
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastStatus, setLastStatus] = useState<RobotStatus | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const storedLogs = localStorage.getItem('robotLogs');
      return storedLogs ? JSON.parse(storedLogs) : [];
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);
  const logIdRef = useRef(0);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const id = `log-${++logIdRef.current}`;
    const timestamp = new Date().toLocaleTimeString();
    const newLog = { id, timestamp, type, message };
    setLogs((prev) => {
      const updated = [...prev, newLog].slice(-100);
      if (typeof window !== 'undefined') {
        localStorage.setItem('robotLogs', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const connect = useCallback(async () => {
    if (connectionState === 'connected' || connectionState === 'connecting') return;

    setConnectionState('connecting');
    setError(null);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: 'SARM-Robot' },
          { services: [ROBOT_SERVICE_UUID] },
        ],
        optionalServices: [ROBOT_SERVICE_UUID],
      });

      if (!device) {
        throw new Error('No device selected');
      }

      deviceRef.current = device;
      setDeviceName(device.name || 'Unknown Device');

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      const service = await server.getPrimaryService(ROBOT_SERVICE_UUID);

      const commandChar = await service.getCharacteristic(COMMAND_CHARACTERISTIC_UUID);
      const statusChar = await service.getCharacteristic(STATUS_CHARACTERISTIC_UUID);

      characteristicRef.current = commandChar;

      await statusChar.startNotifications();
      statusChar.addEventListener('characteristicvaluechanged', (event) => {
        try {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const data = JSON.parse(decoder.decode(value.value)) as RobotStatus;

          if (data.type === 'status') {
            setLastStatus(data);
            addLog('status', `Status: ${data.status} - ${data.message}`);
            if (data.errors.length > 0) {
              addLog('error', `Errors: ${data.errors.join(', ')}`);
            }
          }
        } catch (e) {
          addLog('error', `Failed to parse Bluetooth message: ${e}`);
        }
      });

      setConnectionState('connected');
      addLog('info', `Connected to ${device.name || 'SARM Robot'} via Bluetooth`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Bluetooth connection failed';
      setConnectionState('error');
      setError(errorMsg);
      addLog('error', errorMsg);
    }
  }, [connectionState, addLog]);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    characteristicRef.current = null;
    setConnectionState('disconnected');
    setDeviceName(null);
    addLog('info', 'Disconnected from Bluetooth device');
  }, [addLog]);

  const sendCommand = useCallback((cmd: RobotCommand) => {
    if (connectionState !== 'connected' || !characteristicRef.current) {
      const errorMsg = 'Not connected to Bluetooth device';
      setError(errorMsg);
      addLog('error', errorMsg);
      console.log("[v0] Not connected, cannot send command:", cmd);
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(cmd));

      characteristicRef.current.writeValue(data);
      console.log("[v0] Command sent successfully:", cmd);
      addLog('command', `Sent: ${cmd.cmd} - ${JSON.stringify(cmd)}`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to send command';
      setError(errorMsg);
      addLog('error', errorMsg);
      console.log("[v0] Error sending command:", errorMsg);
    }
  }, [connectionState, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('robotLogs');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
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
    deviceName,
  };
}
