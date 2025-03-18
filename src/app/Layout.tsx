import { Outlet } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Modal from "../shared/ui/Modal";
import InstructorSignup from "../pages/login/instructor/InstructorSignup";

const Layout = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isInstructorLogin, setIsInstructorLogin] = useState(false);

  useEffect(() => {
    const checkInstructorLogin = () => {
      const titleElement = document.querySelector('.font-dunggeunmiso-b');
      if (titleElement) {
        const titleText = titleElement.textContent;
        setIsInstructorLogin(titleText?.includes('(강사)') || false);
      }
    };

    checkInstructorLogin();
    // DOM 변경 감지를 위한 MutationObserver 설정
    const observer = new MutationObserver(checkInstructorLogin);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full h-dvh bg-lime-600 flex justify-center items-center">
      <Outlet />
      <div className="absolute bottom-0 left-0 p-4">
        <img 
          className={`w-10 transition-opacity ${isInstructorLogin ? "cursor-pointer hover:opacity-80" : "opacity-50"}`} 
          src="/assets/logo.png" 
          alt="Logo" 
          onClick={() => isInstructorLogin && setIsSignupModalOpen(true)}
        />
      </div>
      <Modal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        width="400px"
      >
        <div className="w-full">
          <h2 className="text-2xl font-bold text-center mb-4">강사 회원가입</h2>
          <InstructorSignup onClose={() => setIsSignupModalOpen(false)} />
        </div>
      </Modal>
    </div>
  );
};

export default Layout;
