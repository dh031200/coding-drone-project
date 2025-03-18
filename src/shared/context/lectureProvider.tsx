import { createContext, useContext, useEffect, useState } from "react";
import { ILectureParams } from "../types/lecture.ts";

interface ILectureContext {
  savedLecture: ILectureParams;
  resetSavedLecture: () => void;
  setSavedLecture: React.Dispatch<React.SetStateAction<ILectureParams>>;
  hasSavedLecture: boolean;
}

export const LectureContext = createContext<ILectureContext | null>(null);

export const LectureProvider = ({ children }: { children: React.ReactNode }) => {
  const sessionSavedCode = sessionStorage.getItem("code");
  const sessionSavedLectureId = sessionStorage.getItem("lectureId");
  const [savedLecture, setSavedLecture] = useState<ILectureParams>({
    lectureId: sessionSavedLectureId ? Number(sessionSavedLectureId) : -1,
    code: sessionSavedCode || "",
    instructorId: sessionStorage.getItem("instructorId") || "",
  });

  useEffect(() => {
    if (savedLecture.lectureId && savedLecture.lectureId > 0) {
      sessionStorage.setItem("lectureId", String(savedLecture.lectureId));
      sessionStorage.setItem("code", savedLecture.code);
    } else {
      sessionStorage.removeItem("lectureId");
      sessionStorage.removeItem("code");
    }
  }, [savedLecture]);

  const resetSavedLecture = () => {
    setSavedLecture({
      lectureId: -1,
      code: "",
    });
  };

  const hasSavedLecture = savedLecture.lectureId && savedLecture.lectureId > 0 && savedLecture.code !== "";
  return (
    <LectureContext.Provider
      value={{
        savedLecture,
        resetSavedLecture,
        setSavedLecture,
        hasSavedLecture: Boolean(savedLecture.lectureId && savedLecture.lectureId > 0 && savedLecture.code !== ""),
      }}
    >
      {children}
    </LectureContext.Provider>
  );
};

export const useLecture = () => {
  const context = useContext(LectureContext);
  if (!context) {
    throw new Error("useLecture must be used within a LectureProvider");
  }
  return context;
};
