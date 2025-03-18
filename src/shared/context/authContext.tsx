import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  role: "instructor" | "student" | null;
  setRole: (role: "instructor" | "student" | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  role: null,
  setRole: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<"instructor" | "student" | null>(() => {
    const instructorId = sessionStorage.getItem("instructorId");
    const studentId = sessionStorage.getItem("id");
    const name = sessionStorage.getItem("name");

    if (instructorId) {
      return "instructor";
    } else if (studentId) {
      return "student";
    }
    return null;
  });

  useEffect(() => {
    const instructorId = sessionStorage.getItem("instructorId");
    const studentId = sessionStorage.getItem("id");

    if (instructorId && role !== "instructor") {
      setRole("instructor");
    } else if (studentId && role !== "student") {
      setRole("student");
    } else if (!instructorId && !studentId && role !== null) {
      setRole(null);
    }
  }, [role]);

  return <AuthContext.Provider value={{ role, setRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
