// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import hamburgerIcon from "../../asset/hamburger.svg";
import UserDmodal from "./UserDmodal";

const useModalControl = (buttonRef, isOpen, setIsOpen) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) setIsOpen(false);
    };
    const handleBlur = () => setIsOpen(false);
    const handleScroll = () => setIsOpen(false);
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !(buttonRef.current as any).contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, setIsOpen, buttonRef]);
};

const MenuButton = ({ onClick, isOpen }: { onClick: (e: React.MouseEvent) => void; isOpen?: boolean }) => (
  <button
    onClick={onClick}
    aria-label="User menu"
    aria-haspopup="menu"
    aria-expanded={!!isOpen}
    className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#e6e6e6] cursor-pointer"
  >
    <img 
      src={hamburgerIcon} 
      className="h-[16px] w-[16px]" 
      alt="Menu" 
      aria-hidden 
    />
  </button>
);

const UserDashboard = () => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const userData = useSelector((store: any) => store.app.userData);
  useModalControl(buttonRef, isUserModalOpen, setIsUserModalOpen);
  const toggleModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserModalOpen(!isUserModalOpen);
  };
  return (
    <>
      <div id="user-dashboard" ref={buttonRef} onClick={toggleModal} className="ml-[0.75rem] relative inline-block">
        <MenuButton onClick={toggleModal} isOpen={isUserModalOpen} />
        <UserDmodal isOpen={isUserModalOpen} />
      </div>
    </>
  );
};

export default UserDashboard;


