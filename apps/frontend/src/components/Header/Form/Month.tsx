import React, { useEffect, useState } from 'react';
import Modal from '../../Modals/Modal';
import CheckInOption from './DatesOption';
import CircularSlider from './CircularSlider';
import CalendarModal from './CalendarModal';
import CircularSliderCalendar from './FormFields/CircularSliderCalendar';
import { useDispatch, useSelector } from 'react-redux';
import { format, addMonths } from 'date-fns';
import { setHoverInput, setTextForInputDuration } from '../../../redux/mainFormSlice';

interface DateDisplayProps {
  curInput: string;
  curSelectedInput: boolean;
  formattedStartDate: string;
  formatEndDate: string;
  handleClick: (e: React.MouseEvent) => void;
  displayText?: string; // Optional prop for display text
}

const DateDisplay: React.FC<DateDisplayProps> = ({
  curInput,
  curSelectedInput,
  formattedStartDate,
  formatEndDate,
  handleClick,
  displayText,
}) => {
  const {
    dateFlexibility,
    selectedStartDate,
    selectedEndDate,
    startDateFlexibility,
    endDateFlexibility,
  } = useSelector((store: any) => ({
    ...store.form,
    // Fallback to global flexibility if per-date flexibility doesn't exist yet
    startDateFlexibility: store.form.startDateFlexibility || store.form.dateFlexibility || 'exact',
    endDateFlexibility: store.form.endDateFlexibility || store.form.dateFlexibility || 'exact',
  }));

  // Use selected dates with flexibility if available, otherwise fall back to formatted dates
  const getDisplayText = () => {
    if (selectedStartDate && selectedEndDate) {
      // Both dates selected - show range with per-date flexibility
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const startFlexibilityText =
        startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;
      const endFlexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;
      return `${startDateFormatted}${startFlexibilityText} - ${endDateFormatted}${endFlexibilityText}`;
    } else if (selectedStartDate) {
      // Only start date selected - show single date with flexibility
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const flexibilityText = startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;
      return `${startDateFormatted}${flexibilityText}`;
    } else if (selectedEndDate) {
      // Only end date selected - show single date with flexibility
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const flexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;
      return `${endDateFormatted}${flexibilityText}`;
    } else if (formattedStartDate && formatEndDate) {
      // Fallback to CircularSlider dates (no flexibility applied)
      return `${formattedStartDate} - ${formatEndDate}`;
    } else {
      return 'Any time';
    }
  };

  return (
    <div
      className={`1smd:w-[17.3rem] 1xz:before:left-0 1xz:before:w-full h-[3.85rem] hover:before:content-[''] 1smd:before:w-[17.3rem] before:absolute before:top-0 before:h-[3.85rem] 1smd:before:left-[17.67rem] before:rounded-full ${
        curInput === 'month' ? 'rounded-full bg-white' : 'before:hover:bg-[#c0c0c0]'
      } before:hover:opacity-40 flex items-center justify-center`}
      onClick={handleClick}
    >
      <div className="flex flex-col 1smd:w-[14.8rem] items-start justify-center">
        <p className="text-xs font-medium">When</p>
        {curSelectedInput ? (
          <p className="text-sm font-medium">{displayText || getDisplayText()}</p>
        ) : (
          <span className="text-sm font-thin">Any time</span>
        )}
      </div>
    </div>
  );
};

interface MonthProps {
  modalRef: React.RefObject<HTMLDivElement>;
  handleInputField: (target: EventTarget, type: string) => void;
  onlyOneTime: React.MutableRefObject<boolean> | null;
  monthRef: React.RefObject<HTMLDivElement>;
}

const Month: React.FC<MonthProps> = ({ modalRef, handleInputField, onlyOneTime, monthRef }) => {
  const {
    startDurationDate,
    curSelectInput: curSelectedInput,
    curDot: currentDot,
    selectedStartDate,
    selectedEndDate,
    dateFlexibility, // Global flexibility (for backward compatibility)
    startDateFlexibility, // Start date specific flexibility
    endDateFlexibility, // End date specific flexibility
  } = useSelector((store: any) => ({
    ...store.form,
    // Fallback to global flexibility if per-date flexibility doesn't exist yet
    startDateFlexibility: store.form.startDateFlexibility || store.form.dateFlexibility || 'exact',
    endDateFlexibility: store.form.endDateFlexibility || store.form.dateFlexibility || 'exact',
  }));
  const dispatch = useDispatch();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [editingDateType, setEditingDateType] = useState<'startDate' | 'endDate'>('startDate');
  const [displayText, setDisplayText] = useState<string>('Any time');

  const formattedStartDate = startDurationDate ? format(startDurationDate, 'MMM dd') : '';

  const monthsToAdd = currentDot === 0 ? 12 : currentDot;
  let endDate = startDurationDate ? addMonths(startDurationDate, monthsToAdd) : null;

  // Then format the new date
  const formatEndDate = endDate ? format(endDate, 'MMM dd') : '';

  useEffect(() => {
    let textToDisplay =
      formattedStartDate && formatEndDate ? `${formattedStartDate} - ${formatEndDate}` : 'Any time';

    setDisplayText(textToDisplay);
  }, [formatEndDate, formattedStartDate]);

  // Watch for changes in selected dates from calendar and update Month display
  useEffect(() => {
    console.log('Month: selected dates changed:', {
      selectedStartDate,
      selectedEndDate,
      startDateFlexibility,
      endDateFlexibility,
    });

    if (selectedStartDate && selectedEndDate) {
      // Both dates selected - show range with per-date flexibility
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const startFlexibilityText =
        startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;
      const endFlexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;

      const textToDisplay = `${startDateFormatted}${startFlexibilityText} - ${endDateFormatted}${endFlexibilityText}`;
      console.log('Month: updating display text (range):', textToDisplay);
      setDisplayText(textToDisplay);
    } else if (selectedStartDate) {
      // Only start date selected - show single date
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const flexibilityText = startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;

      const textToDisplay = `${startDateFormatted}${flexibilityText}`;
      console.log('Month: updating display text (start date only):', textToDisplay);
      setDisplayText(textToDisplay);
    } else if (selectedEndDate) {
      // Only end date selected - show single date
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const flexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;

      const textToDisplay = `${endDateFormatted}${flexibilityText}`;
      console.log('Month: updating display text (end date only):', textToDisplay);
      setDisplayText(textToDisplay);
    }
  }, [selectedStartDate, selectedEndDate, startDateFlexibility, endDateFlexibility]);

  // Watch for flexibility changes and update Month display
  useEffect(() => {
    console.log('Month: flexibility changed:', { startDateFlexibility, endDateFlexibility });
    let textToDisplay = '';
    if (selectedStartDate && selectedEndDate) {
      // Both dates selected - update with per-date flexibility
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const startFlexibilityText =
        startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;
      const endFlexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;

      textToDisplay = `${startDateFormatted}${startFlexibilityText} - ${endDateFormatted}${endFlexibilityText}`;
      console.log('Month: updating display text (flexibility change, range):', textToDisplay);
      setDisplayText(textToDisplay);
    } else if (selectedStartDate) {
      // Only start date selected - update with start date flexibility
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const flexibilityText = startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;

      const textToDisplay = `${startDateFormatted}${flexibilityText}`;
      console.log(
        'Month: updating display text (flexibility change, start date only):',
        textToDisplay,
      );
      setDisplayText(textToDisplay); // This triggered search
    } else if (selectedEndDate) {
      // Only end date selected - update with end date flexibility
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const flexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;

      const textToDisplay = `${endDateFormatted}${flexibilityText}`;
      console.log(
        'Month: updating display text (flexibility change, end date only):',
        textToDisplay,
      );
      setDisplayText(textToDisplay);
      dispatch(setTextForInputDuration(textToDisplay)); // This triggered search
    }

    if (textToDisplay) {
      dispatch(setTextForInputDuration(textToDisplay)); // This triggered search
    }
  }, [startDateFlexibility, endDateFlexibility, selectedStartDate, selectedEndDate]);

  const handleClick = (e: React.MouseEvent) => {
    // Only open the modal if it's not already open
    // This prevents the modal from closing when clicking inside it
    if (curInput !== 'month') {
      handleInputField(e.target, 'month');
    }
  };

  const handleOpenCalendar = (dateType: 'startDate' | 'endDate') => {
    console.log('Month: opening calendar for', dateType, 'date');
    setEditingDateType(dateType);
    setIsCalendarModalOpen(true);
  };

  const curInput = useSelector((store: any) => store.form.curSelectInput);

  return (
    <>
      <Modal onlyOneTime={onlyOneTime}>
        <Modal.Open opens="month">
          <div
            onMouseEnter={() => dispatch(setHoverInput('month'))}
            onMouseLeave={() => dispatch(setHoverInput(null))}
            className={`flex 1xz:relative 1smd:static  1smd:justify-center 1xz:justify-start 1xz:w-full  1smd:px-0 1xz:px-6 items-center ${
              curInput === 'month' ? 'shadow-checkInShadow  bg-white rounded-full' : ''
            } `}
            ref={monthRef}
          >
            <DateDisplay
              curInput={curInput}
              curSelectedInput={curSelectedInput}
              formattedStartDate={formattedStartDate}
              formatEndDate={formatEndDate}
              handleClick={handleClick}
              displayText={displayText}
            ></DateDisplay>
          </div>
        </Modal.Open>
        {/* Keep Month modal open even when calendar modal is open */}
        <Modal.Window modalRef={modalRef} name="month">
          <div className="flex flex-col justify-center items-center">
            <CheckInOption></CheckInOption>
            <CircularSlider onOpenCalendar={handleOpenCalendar}></CircularSlider>
          </div>
        </Modal.Window>
      </Modal>

      {/* Calendar Modal - positioned outside Modal structure to float above everything */}
      {isCalendarModalOpen && (
        <CalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => {
            console.log('Month: Save button clicked, closing modal');
            // This is actually the Save button - close the modal
            setIsCalendarModalOpen(false);
          }}
          isMonthMode={true}
        >
          <CircularSliderCalendar
            editMode={editingDateType} // Edit the specific date type
          />
        </CalendarModal>
      )}
    </>
  );
};

export default Month;
