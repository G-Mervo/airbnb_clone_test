// @ts-nocheck
import React, { useEffect } from 'react';
import CheckInOption from './DatesOption';
import cross from '../../../asset/Icons_svg/cross.svg';
import EnhancedCalendar from './FormFields/EnhancedCalendar';
import AddDays from './AddDays';
import Modal from '../../Modals/Modal';
import { useDispatch } from 'react-redux';
import { setHoverInput, setCalendarModalOpen } from '../../../redux/mainFormSlice';
import { useHandleCrossClick } from '../../../hooks/MainFormContent';

const useHoverState = () => {
  const dispatch = useDispatch();

  const handleMouseEnter = () => dispatch(setHoverInput('checkOut'));
  const handleMouseLeave = () => dispatch(setHoverInput(null));

  return { handleMouseEnter, handleMouseLeave };
};

const DateDisplay = ({ endDateToShow, curSelectInput, checkOutResetRef, handleCrossClick }) => (
  <div className="flex justify-between items-center w-full">
    <div
      className={`flex flex-col justify-center items-start ${
        endDateToShow && curSelectInput === 'checkOut' ? 'ml-[-0.5rem]' : ''
      }`}
    >
      <p className="text-xs font-medium">Check out</p>
      <p
        className={`${
          endDateToShow === '' || !curSelectInput
            ? 'font-extralight text-[0.9rem] text-gray-500'
            : 'text-sm font-semibold'
        }`}
      >
        {endDateToShow && curSelectInput ? endDateToShow : 'Add dates'}
      </p>
    </div>
    {endDateToShow !== '' && curSelectInput === 'checkOut' && (
      <CrossButton checkOutResetRef={checkOutResetRef} handleCrossClick={handleCrossClick} />
    )}
  </div>
);

const CrossButton = ({ checkOutResetRef, handleCrossClick }) => (
  <div
    ref={checkOutResetRef}
    onClick={(e) => handleCrossClick(e, 'checkOut')}
    className="w-[1.5rem] flex justify-center items-center z-50 hover:rounded-full h-[1.5rem] hover:bg-grey-dim"
  >
    <img className="h-4 w-4" src={cross} alt="" />
  </div>
);

const InputWrapper = ({ curSelectInput, children, onClick }) => (
  <div
    onClick={onClick}
    className={`1smd:w-[8.67rem] hover:before:content-[''] 1smd:before:w-[8.67rem] 1xz:before:w-full before:absolute before:top-0 before:h-[3.85rem] 1smd:before:left-[26.34rem] before:rounded-full
      ${curSelectInput === 'checkOut' ? '' : 'before:hover:bg-grey-light-50'}
      before:hover:opacity-40
      ${curSelectInput === 'checkOut' ? 'rounded-full w-full bg-white' : ''}
      h-[3.85rem] flex-col flex justify-center items-center cursor-pointer`}
  >
    {children}
  </div>
);

const CheckOutDateForm = ({
  onlyOneTime,
  checkOutResetRef,
  checkOutRef,
  modalRef,
  curSelectInput,
  endDateToShow,
  handleInputField,
}) => {
  const { handleMouseEnter, handleMouseLeave } = useHoverState();
  const handleCrossClick = useHandleCrossClick();
  const dispatch = useDispatch();

  // Ensure the full-screen calendar modal is closed when using the Modal system
  useEffect(() => {
    if (curSelectInput === 'checkOut') {
      dispatch(setCalendarModalOpen(false));
    }
  }, [curSelectInput, dispatch]);

  const containerClassName = `flex 1xz:w-full 1xz:relative 1smd:static ${
    curSelectInput === 'checkOut' ? 'shadow-checkOutShadow rounded-full' : ''
  } justify-center items-center`;

  const inputClassName = `1smd:w-[5.62rem] items-center 1smd:pl-0 1smd:pr-0 1xz:pl-6 1xz:pr-3 1xz:w-full flex justify-between outline-none focus:outline-none h[2rem] placeholder:text-sm ${
    curSelectInput && curSelectInput !== 'checkOut' ? 'bg-shadow-gray' : ''
  } placeholder:font-extralight placeholder:text-black`;

  return (
    <Modal onlyOneTime={onlyOneTime}>
      <Modal.Open opens="checkOut">
        <div
          ref={checkOutRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={containerClassName}
        >
          <InputWrapper
            curSelectInput={curSelectInput}
            onClick={(e) => handleInputField(e.target, 'checkOut')}
          >
            <div className={inputClassName}>
              <DateDisplay
                endDateToShow={endDateToShow}
                curSelectInput={curSelectInput}
                checkOutResetRef={checkOutResetRef}
                handleCrossClick={handleCrossClick}
              />
            </div>
          </InputWrapper>
        </div>
      </Modal.Open>
      <Modal.Window resetRef={checkOutResetRef} modalRef={modalRef} name="checkOut">
        <div className="bg-white rounded-[2rem] w-full">
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100">
              <CheckInOption />
            </div>
            <div className="w-full">
              <EnhancedCalendar />
            </div>
            {/* AddDays section for date flexibility */}
            <div className="w-full border-t border-gray-200 bg-white mt-auto">
              <AddDays />
            </div>
          </div>
        </div>
      </Modal.Window>
    </Modal>
  );
};

export default CheckOutDateForm;
