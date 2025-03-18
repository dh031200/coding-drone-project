import React, { useCallback } from "react";
import WorkspaceContent from "./workspaceContent.tsx";
import { useStudentSocket } from "../../features/student/hooks/useStudentSocket";
import { useNavigate } from "react-router-dom";

const Workspace = () => {
  const { socketState, sendMessage, socket } = useStudentSocket();
  const navigate = useNavigate();

  const handleCodeChange = useCallback(
    (code: string) => {
      if (socketState.isCodeEnabled) {
        sendMessage("code:update", { code });
      }
    },
    [socketState.isCodeEnabled, sendMessage]
  );

  const handleDroneStatusChange = useCallback(
    (status: string) => {
      if (socketState.isDroneEnabled) {
        sendMessage("drone:status", { status });
      }
    },
    [socketState.isDroneEnabled, sendMessage]
  );

  const handleLogout = () => {
    if (socket?.connected) {
      socket.disconnect();
    }
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="w-full h-full bg-amber-50 rounded-lg shadow flex flex-col pt-3 pb-8 px-8 mx-36"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      <div className="flex justify-between items-center mb-4">
        {/* <p className="text-4xl font-dunggeunmiso-b text-lime-600">코딩 드론 플랫폼</p> */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketState.isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">
              {socketState.isConnected ? `${sessionStorage.getItem("name")} 님 연결됨` : "연결 안됨"}
            </span>
          </div>
          <div>
            <button 
              className="bg-zinc-200 text-zinc-700 rounded font-semibold py-1 px-2 hover:bg-zinc-300 transition-colors"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
      <WorkspaceContent
        onCodeChange={handleCodeChange}
        onDroneStatusChange={handleDroneStatusChange}
        sendMessage={sendMessage}
      />
    </div>
  );
};

export default Workspace;
