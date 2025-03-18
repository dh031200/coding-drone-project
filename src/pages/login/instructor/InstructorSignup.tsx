import Input from "../../../shared/ui/Input.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons/faLock";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import MainButton from "../../../shared/ui/MainButton.tsx";
import { useState } from "react";
import { axiosInstance } from "../../../shared/libs/axios.ts";
import { AxiosError, isAxiosError } from "axios";

interface SignupForm {
  userid: string;
  password: string;
  passwordConfirm: string;
}

const InstructorSignup = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState<SignupForm>({
    userid: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState<string>("");

  const handleOnChangeSignupInfo = (value: string, field: keyof SignupForm) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleSignupOnClick = async () => {
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/auth/signup",
        {
          userid: form.userid,
          password: form.password,
        }
      );

      if (response.status === 201) {
        alert("회원가입이 완료되었습니다.");
        onClose();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError("이미 존재하는 아이디입니다.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <div className="w-full space-y-3 px-8">
      <div className="w-full mt-5 space-y-3">
        <Input
          type="text"
          maxLength={10}
          icon={<FontAwesomeIcon icon={faUser} />}
          placeholder="아이디"
          onChange={(event) => handleOnChangeSignupInfo(event.target.value, "userid")}
          value={form.userid}
          errorMessage={error}
          showErrorMessage={false}
        />
        <Input
          type="password"
          maxLength={10}
          icon={<FontAwesomeIcon icon={faLock} />}
          placeholder="비밀번호"
          onChange={(event) => handleOnChangeSignupInfo(event.target.value, "password")}
          value={form.password}
          errorMessage={error}
          showErrorMessage={false}
        />
        <Input
          type="password"
          maxLength={10}
          icon={<FontAwesomeIcon icon={faLock} />}
          placeholder="비밀번호 확인"
          onChange={(event) => handleOnChangeSignupInfo(event.target.value, "passwordConfirm")}
          value={form.passwordConfirm}
          errorMessage={error}
          showErrorMessage={false}
        />
      </div>

      <MainButton
        title="회원가입"
        onClick={handleSignupOnClick}
        className="!mt-6"
        disabled={
          form.userid.trim().length === 0 ||
          form.password.trim().length === 0 ||
          form.passwordConfirm.trim().length === 0
        }
      />
      {error && <p className="errorText">{error}</p>}
    </div>
  );
};

export default InstructorSignup; 