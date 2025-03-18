import { useState } from "react";
import { useLecture } from "../../../shared/context/lectureProvider.tsx";
import { useDeactivateLecture } from "./api/useDeactivateLecture.ts";
import { socketManager } from "../../../shared/libs/socket";

export const UseCloseLecture = () => {
  const [isCloseLectureModalOpen, setIsCloseLectureModalOpen] = useState(false);
  const { resetSavedLecture, hasSavedLecture, savedLecture } = useLecture();
  const { mutate } = useDeactivateLecture();

  const handleClickCloseButton = () => {
    setIsCloseLectureModalOpen(false);
    mutate({ lectureId: savedLecture.lectureId, active: false });
    resetSavedLecture();

    // 강사 소켓을 통해 학생들에게 강의 종료 알림
    const instructorSocket = socketManager.getSocket("/instructor");
    if (instructorSocket?.connected) {
      instructorSocket.emit("lectureEnd", { lectureCode: savedLecture.code });
    }
  };

  return {
    isCloseLectureModalOpen,
    setIsCloseLectureModalOpen,
    handleClickCloseButton,
    hasSavedLecture,
  };
};

export default UseCloseLecture;
