// @ts-nocheck
import React, { useRef } from 'react';
import AddGuestForm from './AddGuestForm';
import { useSelector } from 'react-redux';
import Flexible from './Flexible';
import Month from './Month';
import CheckInDateForm from './CheckInDateForm';
import CheckOutDateForm from './CheckOutDateForm';
import DestinationForm from './DestinationForm';

const useDividerVisibility = (curSelectInput, hoverInput) => {
  const getDividerColor = (activeInputs, hoverInputs) => {
    if (curSelectInput) {
      return activeInputs.includes(hoverInput) ? 'bg-shadow-gray' : 'bg-gray-300';
    }
    return activeInputs.includes(hoverInput) ? 'bg-white' : 'bg-gray-300';
  };

  const isDividerHidden = (activeInputs) => {
    return activeInputs.includes(curSelectInput) ? 'hidden' : '';
  };

  return { getDividerColor, isDividerHidden };
};

const FormDivider = ({ curSelectInput, hoverInput, activeInputs }) => {
  const { getDividerColor, isDividerHidden } = useDividerVisibility(curSelectInput, hoverInput);

  return (
    <div
      className={`min-w-[0.05rem] ${getDividerColor(activeInputs)} h-[2rem] ${isDividerHidden(
        activeInputs,
      )}`}
    />
  );
};

const SearchForm = ({
  handleInputField,
  buttonRef,
  inputRef,
  modalRef,
  checkInRef,
  checkOutRef,
  monthRef,
  flexibleRef,
  addGuestRef,
}) => {
  const { minimize, startScroll } = useSelector((store: any) => store.app);
  const containerClasses = `1smd:flex w-full 1xz:grid 1xz:grid-cols-3 z-50 justify-center ${
    !minimize && !startScroll ? 'scale-[0.6] opacity-50' : 'scale-100 opacity-1'
  } items-center transition-all duration-[0.4s]`;
  let onlyOneTime = useRef(true);
  const checkInResetRef = useRef();
  const checkOutResetRef = useRef();
  const addGuestResetRef = useRef();
  const { curSelectInput, startDateToShow, hoverInput, endDateToShow, dateOption } = useSelector(
    (store: any) => store.form,
  );

  return (
    <div className={`${containerClasses} search-form-container`}>
      <DestinationForm
        onlyOneTime={onlyOneTime}
        buttonRef={buttonRef}
        inputRef={inputRef}
        modalRef={modalRef}
      />

      <div className="flex 1smd:justify-center 1xz:justify-between items-center">
        <FormDivider
          curSelectInput={curSelectInput}
          hoverInput={hoverInput}
          activeInputs={['destination', 'checkIn', 'month', 'flexible']}
        />

        {(dateOption === 'dates' || dateOption === '') && (
          <>
            <CheckInDateForm
              onlyOneTime={onlyOneTime}
              checkInRef={checkInRef}
              checkInResetRef={checkInResetRef}
              modalRef={modalRef}
              curSelectInput={curSelectInput}
              startDateToShow={startDateToShow}
              handleInputField={handleInputField}
            />

            <FormDivider
              curSelectInput={curSelectInput}
              hoverInput={hoverInput}
              activeInputs={['checkOut', 'checkIn']}
            />

            <CheckOutDateForm
              onlyOneTime={onlyOneTime}
              checkOutResetRef={checkOutResetRef}
              checkOutRef={checkOutRef}
              modalRef={modalRef}
              curSelectInput={curSelectInput}
              endDateToShow={endDateToShow}
              handleInputField={handleInputField}
            />
          </>
        )}

        {dateOption === 'month' && (
          <Month
            onlyOneTime={onlyOneTime}
            monthRef={monthRef}
            modalRef={modalRef}
            handleInputField={handleInputField}
          />
        )}

        {dateOption === 'flexible' && (
          <Flexible
            onlyOneTime={onlyOneTime}
            flexibleRef={flexibleRef}
            handleInputField={handleInputField}
            modalRef={modalRef}
          />
        )}

        <FormDivider
          curSelectInput={curSelectInput}
          hoverInput={hoverInput}
          activeInputs={['checkOut', 'addGuest', 'month', 'flexible']}
        />
      </div>

      <AddGuestForm
        onlyOneTime={onlyOneTime}
        handleInputField={handleInputField}
        addGuestRef={addGuestRef}
        addGuestResetRef={addGuestResetRef}
        modalRef={modalRef}
      />
    </div>
  );
};

export default SearchForm;
