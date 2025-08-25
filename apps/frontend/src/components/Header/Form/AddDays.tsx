import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setDateFlexibility,
  setStartDateToShow,
  setEndDateToShow,
  setSelectedStartDate,
  setSelectedEndDate,
} from '../../../redux/mainFormSlice';
import { format } from 'date-fns';

// reusable DayButton component
interface DayButtonProps {
  text: string;
  isExactDate?: boolean;
  isActive?: boolean;
  onClick: () => void;
}

const DayButton: React.FC<DayButtonProps> = ({
  text,
  isExactDate = false,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer px-4 text-nowrap flex justify-center items-center text-xs h-8 space-x-1 rounded-full border-[1px] transition-all duration-200 hover:bg-gray-50 ${
        isActive
          ? 'border-black bg-black text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
      }`}
      style={{ userSelect: 'none' }}
      type="button"
    >
      {isExactDate ? (
        // Render "Exact dates" button
        <span>{text}</span>
      ) : (
        // Render days button with +/- indicators
        <>
          <div className="flex flex-col items-center text-xs">
            <p className="h-[6px] flex-center leading-none">+</p>
            <p className="h-[6px] flex-center leading-none">-</p>
          </div>
          <span className="leading-none">{text}</span>
        </>
      )}
    </button>
  );
};

// Define available flexibility options
const FLEXIBILITY_OPTIONS = [
  { value: 'exact', label: 'Exact dates', isExactDate: true },
  { value: '1', label: '1 day', isExactDate: false },
  { value: '2', label: '2 days', isExactDate: false },
  { value: '3', label: ' 3 days', isExactDate: false },
  { value: '7', label: '7 days', isExactDate: false },
  { value: '14', label: '14 days', isExactDate: false },
];

// Main AddDays component
const AddDays: React.FC = () => {
  const dispatch = useDispatch();
  const [activeOption, setActiveOption] = useState<string>('exact');

  const selectedStartDate = useSelector((store: any) => store.form.selectedStartDate);
  const selectedEndDate = useSelector((store: any) => store.form.selectedEndDate);
  const dateFlexibility = useSelector((store: any) => store.form.dateFlexibility);

  // Debug logging - only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('AddDays: Current state:', {
      selectedStartDate,
      selectedEndDate,
      dateFlexibility,
      activeOption,
    });
  }

  // Update display dates when flexibility changes
  const updateDateDisplay = React.useCallback(
    (flexibility: string) => {
      if (selectedStartDate) {
        const startDateFormatted = format(selectedStartDate, 'MMM dd');
        const flexibilityText = flexibility === 'exact' ? '' : ` ±${flexibility}`;
        const finalText = startDateFormatted + flexibilityText;
        dispatch(setStartDateToShow(finalText));
      }

      if (selectedEndDate) {
        const endDateFormatted = format(selectedEndDate, 'MMM dd');
        const flexibilityText = flexibility === 'exact' ? '' : ` ±${flexibility}`;
        const finalText = endDateFormatted + flexibilityText;
        dispatch(setEndDateToShow(finalText));
      }
    },
    [selectedStartDate, selectedEndDate, dispatch],
  );

  // Update local state when Redux state changes
  useEffect(() => {
    setActiveOption(dateFlexibility);
  }, [dateFlexibility]);

  // Initialize display when component mounts
  useEffect(() => {
    // Always set the active option to match Redux state
    setActiveOption(dateFlexibility);

    if (selectedStartDate || selectedEndDate) {
      updateDateDisplay(dateFlexibility);
    }
  }, [dateFlexibility, updateDateDisplay]); // Include dependencies for proper initialization

  // DISABLED: Prevent automatic display updates when dates change
  // This prevents unnecessary Redux state updates that could trigger API calls
  // Display updates should only happen when flexibility is explicitly changed
  /*
  useEffect(() => {
    if (selectedStartDate || selectedEndDate) {
      updateDateDisplay(dateFlexibility);
    }
  }, [selectedStartDate, selectedEndDate, dateFlexibility, updateDateDisplay]);
  */

  const handleOptionClick = (value: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AddDays: Button clicked with value:', value);
    }

    setActiveOption(value);
    dispatch(setDateFlexibility(value));

    if (value === 'exact') {
      // Reset to exact dates
      if (selectedStartDate) {
        dispatch(setStartDateToShow(format(selectedStartDate, 'MMM dd')));
      }
      if (selectedEndDate) {
        dispatch(setEndDateToShow(format(selectedEndDate, 'MMM dd')));
      }
      return;
    }

    const flexibilityDays = parseInt(value);
    const today = new Date();

    if (selectedStartDate) {
      // User has a check-in date
      if (flexibilityDays > 0) {
        // Positive days: auto-fill checkout date with check-in + days
        const checkoutDate = new Date(selectedStartDate);
        checkoutDate.setDate(checkoutDate.getDate() + flexibilityDays);

        dispatch(setSelectedEndDate(checkoutDate));
        dispatch(setEndDateToShow(format(checkoutDate, 'MMM dd')));

        // Update display to show the range
        dispatch(
          setStartDateToShow(`${format(selectedStartDate, 'MMM dd')} +${flexibilityDays} days`),
        );
      } else {
        // Negative days: adjust check-in date to today - days
        const newCheckinDate = new Date(today);
        newCheckinDate.setDate(newCheckinDate.getDate() + flexibilityDays);

        dispatch(setSelectedStartDate(newCheckinDate));
        dispatch(setStartDateToShow(format(newCheckinDate, 'MMM dd')));
      }
    } else {
      // No check-in date selected, use today as base
      if (flexibilityDays > 0) {
        // Positive days: set check-in to today, checkout to today + days
        const checkoutDate = new Date(today);
        checkoutDate.setDate(checkoutDate.getDate() + flexibilityDays);

        dispatch(setSelectedStartDate(today));
        dispatch(setSelectedEndDate(checkoutDate));
        dispatch(setStartDateToShow(format(today, 'MMM dd')));
        dispatch(setEndDateToShow(format(checkoutDate, 'MMM dd')));
      } else {
        // Negative days: set check-in to today + days (past date)
        const checkinDate = new Date(today);
        checkinDate.setDate(checkinDate.getDate() + flexibilityDays);

        dispatch(setSelectedStartDate(checkinDate));
        dispatch(setStartDateToShow(format(checkinDate, 'MMM dd')));
      }
    }
  };

  // DISABLED: This useEffect was overriding the calendar's display format
  // The calendar should control the display format when dates are selected
  // AddDays should only update when flexibility changes, not when dates change
  /*
  useEffect(() => {
    console.log('AddDays: useEffect triggered by flexibility change:', dateFlexibility);

    // Check if this is a calendar update (dates just changed) or a flexibility change
    if (isCalendarUpdate) {
      console.log('AddDays: Calendar just updated dates, skipping display update');
      setIsCalendarUpdate(false);
      return;
    }

    // Only update when the user explicitly changes flexibility
    if (selectedStartDate || selectedEndDate) {
      console.log('AddDays: About to call updateDateDisplay with flexibility:', dateFlexibility);
      updateDateDisplay(dateFlexibility);
    }
  }, [dateFlexibility, selectedStartDate, selectedEndDate, isCalendarUpdate]);
  */

  return (
    <div
      className="w-full flex overflow-auto space-x-3 items-center justify-start px-2 1xz:px-10 1xz:py-6 py-2"
      style={{ position: 'relative', zIndex: 10 }}
    >
      {FLEXIBILITY_OPTIONS.map((option) => (
        <DayButton
          key={option.value}
          text={option.label}
          isExactDate={option.isExactDate}
          isActive={activeOption === option.value}
          onClick={() => handleOptionClick(option.value)}
        />
      ))}
    </div>
  );
};

export default AddDays;
