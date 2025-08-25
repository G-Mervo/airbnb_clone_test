import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import {
  setDateFlexibility,
  setStartDateFlexibility,
  setEndDateFlexibility,
  setStartDateToShow,
  setEndDateToShow,
  setTextForInputDuration,
} from '../../../../redux/mainFormSlice';

// Reusable DayButton component
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
  { value: '3', label: '3 days', isExactDate: false },
  { value: '7', label: '7 days', isExactDate: false },
  { value: '14', label: '14 days', isExactDate: false },
];

// Main MonthDateFlexibility component
const MonthDateFlexibility: React.FC<{ editMode?: 'startDate' | 'endDate' }> = ({
  editMode = 'startDate',
}) => {
  const dispatch = useDispatch();
  const [activeOption, setActiveOption] = useState<string>('exact');

  const dateFlexibility = useSelector((store: any) => store.form.dateFlexibility);
  const startDateFlexibility = useSelector((store: any) => store.form.startDateFlexibility);
  const endDateFlexibility = useSelector((store: any) => store.form.endDateFlexibility);
  const selectedStartDate = useSelector((store: any) => store.form.selectedStartDate);
  const selectedEndDate = useSelector((store: any) => store.form.selectedEndDate);

  // Update local state when Redux state changes
  useEffect(() => {
    // Use the appropriate flexibility based on edit mode
    if (editMode === 'startDate') {
      setActiveOption(startDateFlexibility);
    } else if (editMode === 'endDate') {
      setActiveOption(endDateFlexibility);
    }
  }, [startDateFlexibility, endDateFlexibility, editMode]);

  // DISABLED: Prevent automatic display updates when dates change
  // This prevents unnecessary Redux state updates that could trigger API calls
  // Display updates should only happen when search is submitted
  /*
  // Update date displays when dates or flexibility change
  useEffect(() => {
    if (editMode === 'startDate' && selectedStartDate) {
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const flexibilityText = startDateFlexibility === 'exact' ? '' : ` ±${startDateFlexibility}`;
      const startDateText = startDateFormatted + flexibilityText;
      dispatch(setStartDateToShow(startDateText));
    }

    if (editMode === 'endDate' && selectedEndDate) {
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const flexibilityText = endDateFlexibility === 'exact' ? '' : ` ±${endDateFlexibility}`;
      const startDateText = startDateFormatted + flexibilityText;
      dispatch(setEndDateToShow(endDateText));
    }

    // Don't update Month display here - let the parent Month component handle it
    // This prevents conflicts and ensures proper synchronization
  }, [
    selectedStartDate,
    selectedEndDate,
    startDateFlexibility,
    endDateFlexibility,
    dispatch,
    editMode,
  ]);
  */

  const handleOptionClick = (value: string) => {
    setActiveOption(value);

    // Dispatch the appropriate flexibility action based on edit mode
    if (editMode === 'startDate') {
      dispatch(setStartDateFlexibility(value));
    } else if (editMode === 'endDate') {
      dispatch(setEndDateFlexibility(value));
    }

    // DISABLED: Prevent immediate display updates that could trigger API calls
    // Display updates will happen when search is submitted
    /*
    // Immediately update date displays with new flexibility based on edit mode
    if (editMode === 'startDate' && selectedStartDate) {
      const startDateFormatted = format(selectedStartDate, 'MMM dd');
      const flexibilityText = value === 'exact' ? '' : ` ±${value}`;
      const startDateText = startDateFormatted + flexibilityText;
      dispatch(setStartDateToShow(startDateText));
    }

    if (editMode === 'endDate' && selectedEndDate) {
      const endDateFormatted = format(selectedEndDate, 'MMM dd');
      const flexibilityText = value === 'exact' ? '' : ` ±${value}`;
      const endDateText = endDateFormatted + flexibilityText;
      dispatch(setEndDateToShow(endDateText));
    }
    */

    // Don't update Month display here - let the parent Month component handle it
    // This prevents conflicts and ensures proper synchronization
  };

  return (
    <div className="w-full flex overflow-auto space-x-3 items-center justify-start px-2">
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

export default MonthDateFlexibility;
