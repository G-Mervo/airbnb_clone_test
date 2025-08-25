import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import cross from '../../../asset/Icons_svg/cross.svg';
import { useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDateToShow,
  setEndDateToShow,
} from '../../../redux/mainFormSlice';

// Custom hook for modal visibility logic
const useModalVisibility = (isOpen: boolean, transitionDuration: number) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), transitionDuration);
    }
  }, [isOpen, transitionDuration]);

  return { isVisible, shouldRender };
};

// Custom hook for body scroll lock
const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};

// Custom hook for click outside handling
const useClickOutside = (ref: any, handler: () => void) => {
  useEffect(() => {
    const handleClick = (e: any) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handler();
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [handler, ref]);
};

// Header Component
const ModalHeader = ({ onClose, onCheckOutPage, isMonthMode }: any) => (
  <div className="w-full px-6 items-center justify-center border-b border-grey-dim 1xz:border-0 flex pb-5">
    <button
      onClick={onClose}
      className="w-6 h-6 flex items-center justify-center cursor-pointer hover:rounded-full hover:bg-grey-dim"
    >
      <img className="h-4 w-4" src={cross} alt="" />
    </button>
    <p className="w-[100%] text-xl font-medium justify-center flex items-center">
      {onCheckOutPage ? '' : isMonthMode ? 'Choose a date' : ' Choose a start date'}
    </p>
  </div>
);

// Footer Component
const ModalFooter = ({ onClose, clearDates, dateNotSelect, onCheckOutPage, isMonthMode }: any) => (
  <div className="flex w-full items-center px-6 border-t border-grey-dim py-3 space-x-3 justify-end">
    <button onClick={clearDates} className="text-sm underline font-medium">
      Clear dates
    </button>
    <button
      onClick={onClose}
      disabled={dateNotSelect}
      className={`${dateNotSelect ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'} ${
        !onCheckOutPage ? 'w-28 h-12' : 'w-16 h-9 text-sm'
      } flex items-center justify-center rounded-lg bg-black text-white`}
    >
      {onCheckOutPage || isMonthMode ? 'Save' : 'Apply'}
    </button>
  </div>
);

const TRANSITION_DURATION = 200;
const CalendarModal = ({ isOpen, onClose, children, isMonthMode = false }: any) => {
  const modalRef = useRef(null);
  const dispatch = useDispatch();
  const location = useLocation();

  // We don't need these for EnhancedCalendar since it handles date selection internally
  // const { selectedStartDate: startDate, selectedEndDate: endDate } = useSelector(
  //   (store: any) => store.form,
  // );

  const onCheckOutPage = location.pathname?.includes('/book');
  // For EnhancedCalendar, we don't need to disable the Apply button based on date selection
  // since users can select dates directly in the calendar
  const dateNotSelect = false;

  // Use custom hooks
  const { isVisible, shouldRender } = useModalVisibility(isOpen, TRANSITION_DURATION);
  useScrollLock(isOpen);
  // Removed useClickOutside to prevent conflicts with parent Modal component
  // useClickOutside(modalRef, onClose);

  // Force modal to be above everything
  useEffect(() => {
    if (isOpen) {
      // Ensure body doesn't have overflow hidden from other sources
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';

      // Force modal to be above everything
      const modalElement = document.getElementById('calendar');
      if (modalElement) {
        modalElement.style.zIndex = '10000';
        modalElement.style.position = 'relative';
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
    };
  }, [isOpen]);

  const clearDates = () => {
    // Clear both core dates and display dates
    dispatch(setSelectedStartDate(null));
    dispatch(setSelectedEndDate(null));
    dispatch(setStartDateToShow(''));
    dispatch(setEndDateToShow(''));
  };

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div
      data-modal="true"
      className="modal-overlay calendar-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        pointerEvents: 'auto',
      }}
    >
      <div
        id="calendar"
        ref={modalRef}
        className={`modal-content calendar-modal-content bg-white overflow-x-hidden ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } transition-all pt-6 ${
          onCheckOutPage ? 'rounded-xl' : 'rounded-t-3xl 1xz:rounded-3xl'
        } duration-[0.3s] w-full 1xz:w-auto 1md:w-auto flex flex-col ease-in-out items-center justify-center shadow-lg`}
        style={{
          position: 'relative',
          maxHeight: '90vh',
          maxWidth: '90vw',
          zIndex: 1000000,
          backgroundColor: 'white',
          minHeight: '600px',
          minWidth: '800px',
        }}
      >
        <ModalHeader onClose={onClose} onCheckOutPage={onCheckOutPage} isMonthMode={isMonthMode} />

        <div className="w-full px-6 1md:px-4 overflow-x-hidden relative z-[10000] bg-white">
          {children}
        </div>

        <ModalFooter
          onClose={onClose}
          clearDates={clearDates}
          dateNotSelect={dateNotSelect}
          onCheckOutPage={onCheckOutPage}
          isMonthMode={isMonthMode}
        />
      </div>
    </div>,
    document.body,
  );
};

export default CalendarModal;
