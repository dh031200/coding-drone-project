export interface IStudentSocketEvents {
  "code:update": { code: string };
  "control:update": { type: "code" | "drone"; value: boolean };
}

export interface IStudentEmitEvents {
  joinLecture: { lectureCode: string };
  "code:update": { code: string };
  "drone:status": { status: string };
  "drone:update": { status: string; lectureCode: string; studentId: string };
}

export interface IStudentSocketState {
  isConnected: boolean;
  isCodeEnabled: boolean;
  isDroneEnabled: boolean;
  code?: string;
  droneStatus?: string;
}

export interface ISocketEvents {
  studentJoined: {
    studentId: string;
    name: string;
  };
  studentLeft: {
    studentId: string;
  };
  "code:updated": {
    studentId: string;
    code: string;
  };
  "drone:updated": {
    studentId: string;
    status: string;
  };
}

interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}
