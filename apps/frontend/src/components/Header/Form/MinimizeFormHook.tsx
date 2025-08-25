// @ts-nocheck
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setActiveInput,
  setCurrentMonth,
  setHoverInput,
  setOpenName,
} from '../../../redux/mainFormSlice';

export const useMinimizeFormOnOutsideClick = (
  { modalRef, buttonRef, checkInRef, checkOutRef, addGuestRef, monthRef, flexibleRef },
  isCalendarModalOpen,
  selectedStartDate,
  selectedEndDate,
) => {
  const dispatch = useDispatch();

  useEffect(() => {
    function handleClick(e) {
      // Check if calendar modal is open
      if (isCalendarModalOpen) {
        console.log('MinimizeFormHook: Calendar modal is open, not minimizing');
        return;
      }

      // Check if click is inside calendar modal (even if isCalendarModalOpen is false)
      const calendarModal = document.querySelector('[data-modal="true"]');
      if (calendarModal && calendarModal.contains(e.target)) {
        console.log('MinimizeFormHook: Click is inside calendar modal, not minimizing');
        return;
      }

      if (
        !modalRef.current?.contains(e.target) &&
        !buttonRef.current?.contains(e.target) &&
        !checkInRef.current?.contains(e.target) &&
        !checkOutRef.current?.contains(e.target) &&
        !addGuestRef.current?.contains(e.target) &&
        !monthRef.current?.contains(e.target) &&
        !flexibleRef.current?.contains(e.target)
      ) {
        console.log('MinimizeFormHook: Click is outside all form elements, minimizing');
        dispatch(setActiveInput(''));
        dispatch(setOpenName(''));
        dispatch(setHoverInput(null));
      } else {
        console.log('MinimizeFormHook: Click is inside form elements, not minimizing');
      }

      if (selectedStartDate && selectedEndDate) return;

      if (
        checkInRef?.current &&
        !checkInRef.current?.contains(e.target) &&
        checkOutRef?.current &&
        !checkOutRef.current?.contains(e.target) &&
        addGuestRef?.current &&
        modalRef?.current &&
        !modalRef.current?.contains(e.target)
      ) {
        dispatch(setCurrentMonth(new Date()));
      }
    }

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [
    dispatch,
    selectedStartDate,
    selectedEndDate,
    isCalendarModalOpen,
    modalRef,
    buttonRef,
    checkInRef,
    checkOutRef,
    addGuestRef,
    monthRef,
    flexibleRef,
  ]);
};
