import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cls } from "../../../shared/utils/cls.ts";
import { AnimatePresence, motion } from "framer-motion";
import DroneInfo from "./DroneInfo";
import { useDroneControl } from "../../../features/student/hooks/useDroneControl";
import { useStudentSocket } from "../../../features/student/hooks/useStudentSocket.ts";
import { useCodeExecution } from "../../../features/student/hooks/useCodeExecution.ts";

interface IDroneControlProps {
  isOn: boolean;
  setIsOn: (value: boolean) => void;
  setBattery: (value: number) => void;
  setAttitude: (value: { roll: number; pitch: number; yaw: number }) => void;
  setAltitude: (value: number) => void;
  setTemperature: (value: number) => void;
  setRangeHeight: (value: number) => void;
  setFlightMode: (value: string) => void;
  setControlMode: (value: string) => void;
  setMovementMode: (value: string) => void;
}

const DroneControl = ({
  isOn,
  setIsOn,
  setBattery,
  setAttitude,
  setAltitude,
  setTemperature,
  setRangeHeight,
  setFlightMode,
  setControlMode,
  setMovementMode,
}: IDroneControlProps) => {
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const { updateDroneConnection } = useDroneControl();
  const { isDroneEnabled } = useCodeExecution();
  // 드론 연결 관리
  const portRef = useRef<SerialPort | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);

  // 드론 제어 명령어를 useMemo로 감싸기
  const droneCommands = useMemo(() => ({
    takeoff: () => new Uint8Array([0x0a, 0x55, 0x11, 0x02, 0x70, 0x10, 0x07, 0x11, 0xf3, 0xd2]),
    land: () => new Uint8Array([0x0a, 0x55, 0x11, 0x02, 0x70, 0x10, 0x07, 0x12, 0xa7, 0x89]),
    emergency: () => new Uint8Array([0x0a, 0x55, 0x11, 0x02, 0x70, 0x10, 0x07, 0x10, 0xb5, 0x34]),
    attitude: (roll: number, pitch: number) => {
      // roll과 pitch 값을 0-255 범위로 변환 (-30~30도를 0~255로 매핑)
      const mappedRoll = Math.floor(((roll + 30) / 60) * 255);
      const mappedPitch = Math.floor(((pitch + 30) / 60) * 255);

      // 명령어 생성 (실제 드론에 맞게 조정 필요)
      return new Uint8Array([
        0x0a,
        0x55,
        0x11,
        0x02,
        0x70,
        0x10,
        0x07,
        0x20,
        mappedRoll & 0xff, // roll 값
        mappedPitch & 0xff, // pitch 값
        0x00,
        0x00, // checksum (실제 구현 필요)
      ]);
    },
  }), []);

  // 드론 연결 처리
  const connectDrone = async () => {
    try {
      if (!navigator.serial) throw new Error("이 브라우저는 Web Serial API를 지원하지 않습니다.");
      if (!window.isSecureContext) throw new Error("Web Serial API는 HTTPS 또는 localhost에서만 동작합니다.");

      const port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x1a86 }] });
      await port.open({ baudRate: 57600 });

      const writer = port.writable?.getWriter();
      portRef.current = port;
      writerRef.current = writer;

      setIsOn(true);
      // 드론 연결 상태 업데이트 및 서버 전송
      updateDroneConnection(true);
      window.dispatchEvent(new CustomEvent("drone-connection", { detail: { connected: true } }));
    } catch (error) {
      console.error("드론 연결 실패:", error);
      alert(error instanceof Error ? error.message : "드론 연결에 실패했습니다.");
      setIsOn(false);
      updateDroneConnection(false);
    }
  };

  // 드론 연결 해제 처리
  const disconnectDrone = async () => {
    try {
      writerRef.current?.close();
      writerRef.current = null;

      portRef.current?.close();
      portRef.current = null;

      setIsOn(false);
      // 드론 연결 해제 상태 업데이트 및 서버 전송
      updateDroneConnection(false);
      window.dispatchEvent(new CustomEvent("drone-connection", { detail: { connected: false } }));
    } catch (error) {
      console.error("드론 연결 해제 실패:", error);
    }
  };

  // 드론 명령 실행
  const sendDroneCommand = useCallback(async (command: Uint8Array) => {
    if (writerRef.current) {
      try {
        await writerRef.current.write(command);
      } catch (error) {
        console.error("명령 전송 실패:", error);
      }
    }
  }, []);

  // 자세 제어 명령 전송을 useCallback으로 감싸기
  const sendAttitudeCommand = useCallback(async () => {
    if (!isOn) return;

    try {
      await sendDroneCommand(droneCommands.attitude(roll, pitch));
      // 상태 업데이트
      setAttitude({ roll, pitch, yaw: 0 });
    } catch (error) {
      console.error("자세 제어 명령 전송 실패:", error);
    }
  }, [isOn, roll, pitch, droneCommands, sendDroneCommand, setAttitude]);

  // roll 또는 pitch 값이 변경될 때 자세 제어 명령 전송
  useEffect(() => {
    if (isOn) {
      const timer = setTimeout(() => {
        sendAttitudeCommand();
      }, 100); // 디바운스 처리

      return () => clearTimeout(timer);
    }
  }, [roll, pitch, isOn, sendAttitudeCommand]);

  // 이벤트 리스너를 통한 드론 명령 처리
  useEffect(() => {
    const handleDroneCommand = async (event: Event) => {
      if (!isOn) {
        console.error("드론이 연결되어 있지 않습니다.");
        return;
      }

      const { command } = (event as CustomEvent<{ command: string }>).detail;
      switch (command) {
        case "takeoff":
          await sendDroneCommand(droneCommands.takeoff());
          console.log("이륙 명령 전송");
          break;
        case "land":
          await sendDroneCommand(droneCommands.land());
          console.log("착륙 명령 전송");
          break;
        case "emergency":
          await sendDroneCommand(droneCommands.emergency());
          console.log("비상정지 명령 전송");
          break;
      }
    };

    window.addEventListener("drone-command", handleDroneCommand);
    return () => {
      window.removeEventListener("drone-command", handleDroneCommand);
    };
  }, [isOn, droneCommands, sendDroneCommand]);

  // 슬라이더 값 변경 처리
  const handleRollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoll(Number(e.target.value));
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPitch(Number(e.target.value));
  };

  // 슬라이더 초기화
  const resetSliders = () => {
    setRoll(0);
    setPitch(0);
    sendAttitudeCommand();
  };

  return (
    <>
      <div className="w-full h-auto flex flex-col relative">
        <div className="flex flex-col relative mt-2">
          {/* <div className="flex relative">
          <div className="w-2/3 flex flex-col">
            <div className="w-8/12 aspect-square p-3 ml-12 relative">
              <img src="/assets/icon/drone.png" alt="drone" className="w-full h-full" />
              <AnimatePresence>
                {!isOn && (
                  <motion.div
                    key={`drone_${isOn}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute top-0 left-0 w-full bg-neutral-500/50 aspect-square z-10 rounded-lg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div> */}

          {/* 자세 제어 슬라이더 */}

          <div className="flex flex-col gap-4 px-2 pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">롤 (좌우 기울기): {roll}°</label>
                <button
                  onClick={resetSliders}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  disabled={!isOn || !isDroneEnabled}
                >
                  초기화
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">좌 -30°</span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={roll}
                  onChange={handleRollChange}
                  disabled={!isOn || !isDroneEnabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs">우 30°</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">피치 (전후 기울기): {pitch}°</label>
              <div className="flex items-center gap-2">
                <span className="text-xs">후 -30°</span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={pitch}
                  onChange={handlePitchChange}
                  disabled={!isOn || !isDroneEnabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs">전 30°</span>
              </div>
            </div>
          </div>

          {/* 드론 제어 버튼 */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              className={cls(
                "font-bold rounded-lg py-[0.5vh] text-lg shadow-lg hover:shadow m-[0.5vh] outline-none disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none",
                isOn
                  ? "bg-neutral-300 text-neutral-500 px-2 hover:bg-neutral-200"
                  : "bg-lime-500 text-white px-3 hover:bg-lime-400"
              )}
              disabled={!isDroneEnabled}
              onClick={() => (isOn ? disconnectDrone() : connectDrone())}
            >
              {isOn ? "연결 해제" : "연결"}
            </button>
            <button
              className="font-bold rounded-lg py-[0.5vh] px-3 text-lg shadow-lg hover:shadow m-[0.5vh] outline-none bg-blue-500 text-white hover:bg-blue-400 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none"
              disabled={!isOn || !isDroneEnabled}
              onClick={() => sendDroneCommand(droneCommands.takeoff())}
            >
              이륙
            </button>
            <button
              className="font-bold rounded-lg py-[0.5vh] px-3 text-lg shadow-lg hover:shadow m-[0.5vh] outline-none bg-orange-500 text-white hover:bg-orange-400 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none"
              disabled={!isOn || !isDroneEnabled}
              onClick={() => sendDroneCommand(droneCommands.land())}
            >
              착륙
            </button>
            <button
              className="font-bold rounded-lg py-[0.5vh] px-3 text-lg shadow-lg hover:shadow m-[0.5vh] outline-none bg-red-500 text-white hover:bg-red-400 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none"
              disabled={!isOn || !isDroneEnabled}
              onClick={() => sendDroneCommand(droneCommands.emergency())}
            >
              비상정지
            </button>
          </div>
        </div>
        {!isDroneEnabled && (
          <div className="absolute bg-zinc-500/70 w-full h-full rounded-b-lg flex justify-center items-center">
            <p className="text-white text-2xl font-bold">드론 조작 비활성화</p>
          </div>
        )}
      </div>
    </>
  );
};

export default DroneControl;
