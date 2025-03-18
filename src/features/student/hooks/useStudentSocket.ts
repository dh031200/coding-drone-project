import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { useRecoilState } from "recoil";
import { studentSocketState } from "../model/socket";
import { IStudentEmitEvents } from "../../../shared/types/socket";
import { useLecture } from "../../../shared/context/lectureProvider";
import { socketManager } from "../../../shared/libs/socket";

export const useStudentSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { savedLecture } = useLecture();
  const [socketState, setSocketState] = useRecoilState(studentSocketState);
  const lastSubmittedCodeRef = useRef<string>("");
  const latestCodeRef = useRef(socketState.code);

  useEffect(() => {
    if (!savedLecture.code) return;

    const studentId = sessionStorage.getItem("id");
    const name = sessionStorage.getItem("name");

    if (!studentId || !name) return;

    // 소켓 연결 생성
    const socket = socketManager.connect("/student");

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 소켓 연결 성공");
      setSocketState((prev) => ({
        ...prev,
        isConnected: true,
        isCodeEnabled: true,
        isDroneEnabled: true,
      }));

      // 강의실 참여 요청
      socket.emit("joinLecture", { lectureCode: savedLecture.code, studentId, name });

      console.log("📤 강의실 참여 요청 전송:", savedLecture.code);
    });

    socket.on("joinResponse", (data) => {
      console.log("📥 강의실 참여 응답 수신:", data);
      setSocketState((prev) => ({
        ...prev,
        code: data.code ?? prev.code,
        isCodeEnabled: data.codeActive ?? prev.isCodeEnabled,
        isDroneEnabled: data.droneActive ?? prev.isDroneEnabled,
      }));
    });

    // 코드 업데이트 이벤트
    socket.on("code:update", (data) => {
      console.log("📥 코드 업데이트 수신:", data.code);
      if (data.code === latestCodeRef.current) {
        console.log("⚠️ 동일한 코드 업데이트 무시");
        return;
      }
      latestCodeRef.current = data.code;
      setSocketState((prev) => ({ ...prev, code: data.code }));
    });

    // 코드 및 드론 활성화 상태 변경
    socket.on("code:activeChanged", (data) => {
      console.log("🔄 코드 활성화 상태 변경:", data);

      setSocketState((prev) => ({ ...prev, isCodeEnabled: Boolean(data.active) }));
    });

    socket.on("drone:activeChanged", (data) => {
      console.log("🔄 드론 활성화 상태 변경:", data.active);
      setSocketState((prev) => ({ ...prev, isDroneEnabled: Boolean(data.active) }));
    });

    // 강사가 수정한 코드 수신
    socket.on("code:updatedByInstructor", (data) => {
      console.log("👨‍🏫 강사가 코드를 수정했습니다:", data.code.substring(0, 30) + "...");
      setSocketState((prev) => ({
        ...prev,
        code: data.code,
      }));
    });

    socket.on("disconnect", () => {
      console.log("❌ 소켓 연결 끊김");
      setSocketState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on("connect_error", (error) => {
      console.error("🚨 소켓 연결 오류:", error.message);
      setSocketState((prev) => ({ ...prev, isConnected: false }));
    });

    return () => {
      console.log("🔌 소켓 연결 해제");
      socket.disconnect();
    };
  }, [savedLecture.code, setSocketState]);

  // 코드 제출 함수
  const submitCode = useCallback(
    (code: string) => {
      if (!socketRef.current?.connected) {
        console.log("🔴 코드 제출 불가 - 소켓 연결되지 않음");
        return;
      }

      if (!socketState.isCodeEnabled) {
        console.log("⚠️ 코드 제출 불가: 코드 편집 비활성화됨");
        return;
      }

      if (code === lastSubmittedCodeRef.current) {
        console.log("⚠️ 중복 코드 제출 방지");
        return;
      }

      const studentId = sessionStorage.getItem("id");
      const lectureCode = savedLecture.code;
      if (!studentId || !lectureCode) {
        console.log("⚠️ 코드 제출 실패 - 필요한 데이터 없음");
        return;
      }

      latestCodeRef.current = code;
      lastSubmittedCodeRef.current = code;

      console.log("📤 코드 제출:", { lectureCode, studentId, codeLength: code.length });
      socketRef.current.emit("code:submit", { lectureCode, studentId, code });
    },
    [savedLecture.code, socketState.isCodeEnabled]
  );

  // 메시지 전송 함수 (드론 제어 등)
  const sendMessage = useCallback(<T extends keyof IStudentEmitEvents>(event: T, data: IStudentEmitEvents[T]) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    socketState,
    submitCode,
    sendMessage,
  };
};
