import { useContext } from "react";
import { LectureContext } from "../context/lectureProvider";

export const useLecture = () => {
  const context = useContext(LectureContext);
  if (!context) {
    throw new Error("useLecture must be used within a LectureProvider");
  }
  return context;
}; 