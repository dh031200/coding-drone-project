import { useLectureConnectMutation } from "./api/useLectureConnectMutation.ts";
import { useLecture } from "../../../shared/context/lectureProvider.tsx";
import { useEffect, useMemo, useState } from "react";

import { UseGetLectureByCode } from "../../lecture/hooks/api/useGetLectureByCode.ts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/authContext.tsx";
import { debounce } from "../../../shared/utils/debounce.ts";
import { AxiosError } from "axios";

export const useStudentLogin = () => {
  const navigate = useNavigate();
  const { mutate: lectureConnectMutate } = useLectureConnectMutation();
  const { setSavedLecture } = useLecture();
  const [form, setForm] = useState({
    code: "",
    name: "",
  });
  const [errors, setErrors] = useState({
    code: "",
    name: "",
  });
  const [codeCheck, setCodeCheck] = useState(false);
  const { setRole } = useAuth();
  const handleOnChangeCode = (value: string) => {
    setCodeCheck(false);
    setErrors((prev) => ({ ...prev, code: "" }));
    debounceInput("code", value.trim());
  };

  const handleOnChangeName = (value: string) => {
    setErrors((prev) => ({ ...prev, name: "" }));
    debounceInput("name", value.trim());
  };

  const debounceInput = useMemo(() => {
    return debounce((field: "code" | "name", value: string) => {
      setForm((prev) => ({ ...prev, [field]: value.trim() }));
    }, 500);
  }, []);

  const { data: lectureData, error: getLectureError } = UseGetLectureByCode(form.code);
  useEffect(() => {
    if (!lectureData) return;
    if (lectureData) {
      setSavedLecture({ lectureId: lectureData.id, code: lectureData.code });
    }
    setCodeCheck(true);
    setErrors((prev) => ({ ...prev, code: "" }));
  }, [lectureData, setSavedLecture]);

  useEffect(() => {
    if (!getLectureError) return;
    setErrors((prev) => ({
      ...prev,
      code: "접속 코드를 확인해주세요",
    }));
    setCodeCheck(false);
  }, [getLectureError]);

  const handleLoginOnClick = () => {
    if (form.name.trim().length === 0) {
      setErrors((prev) => ({ ...prev, name: "이름을 입력해주세요!" }));
      return;
    }

    // 세션 스토리지에서 이전 로그인 정보 확인
    const previousId = sessionStorage.getItem("id");
    const previousName = sessionStorage.getItem("name");
    const previousCode = sessionStorage.getItem("code");

    // 동일한 이름과 코드로 재로그인하는 경우
    if (previousName === form.name && previousCode === form.code) {
      sessionStorage.setItem("id", previousId || "");
      sessionStorage.setItem("name", form.name);
      setRole("student");
      navigate("/workspace");
      return;
    }

    lectureConnectMutate(form, {
      onSuccess: (data) => {
        sessionStorage.setItem("id", data.id);
        sessionStorage.setItem("name", data.name);
        setRole("student");
        navigate("/workspace");
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status === 400) {
          setErrors((prev) => ({ ...prev, name: "이미 사용중인 이름입니다." }));
        }
      },
    });
  };
  return {
    form,
    errors,
    codeCheck,
    handleOnChangeCode,
    handleOnChangeName,
    handleLoginOnClick,
  };
};
