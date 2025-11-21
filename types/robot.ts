// Robot command types
export interface DriveBaseCommand {
  cmd: "drive_base";
  vx: number;
  vy: number;
  omega: number;
}

export interface SetJointCommand {
  cmd: "set_joint";
  jointId: number;
  angle: number;
}

export interface SetPoseCommand {
  cmd: "set_pose";
  joints: number[];
}

export interface GripperCommand {
  cmd: "gripper";
  state: "open" | "close";
}

export interface HomeCommand {
  cmd: "home";
}

export interface StopCommand {
  cmd: "stop";
}

export type RobotCommand =
  | DriveBaseCommand
  | SetJointCommand
  | SetPoseCommand
  | GripperCommand
  | HomeCommand
  | StopCommand;

// Robot status types
export interface RobotStatus {
  type: "status";
  status: "ok" | "error";
  joints: number[];
  base: {
    vx: number;
    vy: number;
    omega: number;
  };
  errors: string[];
  message: string;
}

// Connection state
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

// Event log entry
export interface LogEntry {
  id: string;
  timestamp: string;
  type: "command" | "status" | "error" | "info";
  message: string;
}
