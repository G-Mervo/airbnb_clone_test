import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  isWithinInterval,
  isBefore,
} from 'date-fns';
import arrowRight from '../../asset/Icons_svg/arrow-right.svg';
import arrowLeft from '../../asset/Icons_svg/arrow-left.svg';
import {
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDateToShow,
  setEndDateToShow,
} from '../../redux/mainFormSlice';

interface UnifiedCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  activeInput: 'checkIn' | 'checkOut';
  setActiveInput: (input: 'checkIn' | 'checkOut') => void;
}

const UnifiedCalendarModal: React.FC<UnifiedCalendarModalProps> = ({
  isOpen,
  onClose,
  containerRef,
  activeInput,
  setActiveInput,
}) => {
  const dispatch = useDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);

  const { selectedStartDate, selectedEndDate } = useSelector((store: any) => store.form);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, containerRef]);

  if (!isOpen) return null;

  const formatSelectedDate = (date: Date | null) => {
    return date ? format(date, 'M/d/yyyy') : '';
  };

  const handleDateClick = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Don't allow selection of past dates
    if (day < today) return;

    if (activeInput === 'checkIn') {
      dispatch(setSelectedStartDate(day));
      // Auto-switch to checkout after selecting check-in
      setActiveInput('checkOut');
      // Clear checkout if new check-in is after current checkout
      if (selectedEndDate && day >= selectedEndDate) {
        dispatch(setSelectedEndDate(null));
      }
    } else {
      // Only allow checkout date after check-in date
      if (selectedStartDate && day > selectedStartDate) {
        dispatch(setSelectedEndDate(day));
      } else if (!selectedStartDate) {
        // If no check-in selected, set this as check-in and switch mode
        dispatch(setSelectedStartDate(day));
        setActiveInput('checkOut');
      }
    }
  };

  const renderHeader = (currentMonth: Date, showLeftArrow = false, showRightArrow = false) => {
    return (
      <div className="flex pb-4 justify-between items-center w-full">
        <div className="flex items-center w-20 justify-start pt-6 z-0">
          {showLeftArrow ? (
            <button
              disabled={currentIndex === 0}
              className={`p-2 bg-transparent ${
                currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleScroll('left')}
            >
              <img className="h-4 w-4" src={arrowLeft} alt="Previous month" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div className="flex items-center justify-center text-lg font-medium flex-1">
          <span>{format(currentMonth, 'MMMM yyyy')}</span>
        </div>

        <div className="flex items-center w-20 justify-end pt-6 z-0">
          {showRightArrow ? (
            <button
              disabled={currentIndex === 11}
              className={`p-2 bg-transparent ${
                currentIndex === 11 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleScroll('right')}
            >
              <img className="h-4 w-4" src={arrowRight} alt="Next month" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      days.push(
        <div
          className="flex w-12 justify-center text-xs text-center font-medium text-gray-500"
          key={format(day, 'yyyy-MM-dd')}
        >
          {format(day, 'eee')}
        </div>,
      );
    }

    return <div className="flex justify-center items-center mb-4">{days}</div>;
  };

  const renderCells = (currentMonth: Date) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = new Date(day);
        let cellClass = '';

        const isPastDate = isSameMonth(day, monthStart) && day < today;
        const isToday = isSameDay(day, today);
        const isSelectedStart = selectedStartDate && isSameDay(day, selectedStartDate);
        const isSelectedEnd = selectedEndDate && isSameDay(day, selectedEndDate);
        const isInRange =
          selectedStartDate &&
          selectedEndDate &&
          isWithinInterval(day, { start: selectedStartDate, end: selectedEndDate }) &&
          !isSelectedStart &&
          !isSelectedEnd;

        if (!isSameMonth(day, monthStart)) {
          cellClass = 'text-gray-300 cursor-default';
        } else if (isPastDate) {
          cellClass = 'text-gray-300 cursor-default';
        } else if (isSelectedStart) {
          cellClass = 'bg-black text-white rounded-full font-semibold cursor-pointer z-10 relative';
        } else if (isSelectedEnd) {
          cellClass = 'bg-black text-white rounded-full font-semibold cursor-pointer z-10 relative';
        } else if (isInRange) {
          cellClass = 'bg-gray-200 text-black cursor-pointer relative';
        } else if (isToday) {
          cellClass =
            'text-black hover:bg-gray-100 hover:rounded-full cursor-pointer font-semibold border-2 border-black rounded-full';
        } else {
          cellClass = 'text-black hover:bg-gray-100 hover:rounded-full cursor-pointer';
        }

        const onClickHandler =
          isPastDate || !isSameMonth(day, monthStart) ? undefined : () => handleDateClick(cloneDay);

        days.push(
          <div key={day.toString()} className="flex items-center justify-center w-12 h-12">
            <div
              className={`flex items-center justify-center w-12 h-12 text-sm ${cellClass} transition-colors`}
              onClick={onClickHandler}
            >
              <span className="font-medium">{formattedDate}</span>
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }

      rows.push(
        <div className="flex items-center justify-center" key={day.toString()}>
          {days}
        </div>,
      );
      days = [];
    }

    return <div className="flex flex-col">{rows}</div>;
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentMonth(addMonths(currentMonth, -1));
    } else if (direction === 'right' && currentIndex < 11) {
      setCurrentIndex(currentIndex + 1);
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const clearDates = () => {
    dispatch(setSelectedStartDate(null));
    dispatch(setSelectedEndDate(null));
    // Also clear display dates since we disabled automatic updates
    dispatch(setStartDateToShow(''));
    dispatch(setEndDateToShow(''));
    setActiveInput('checkIn');
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-0 bg-white border border-gray-200 rounded-3xl shadow-2xl z-[10001] w-[800px]"
      style={{ marginTop: '-30px', right: '-20px' }}
    >
      {/* Header - now with duration display at left end */}
      <div className="flex justify-start items-start p-6 pb-4">
        {selectedStartDate && selectedEndDate ? (
          <div className="flex items-center">
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-medium text-black">
                  {Math.abs(
                    Math.ceil(
                      (selectedEndDate.getTime() - selectedStartDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  )}{' '}
                  {Math.abs(
                    Math.ceil(
                      (selectedEndDate.getTime() - selectedStartDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  ) === 1
                    ? 'night'
                    : 'nights'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {format(selectedStartDate, 'MMM d')} - {format(selectedEndDate, 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <h2 className="text-xl font-medium text-black">Select dates</h2>
          </div>
        )}
      </div>

      {/* Calendar Container - Two Full Months Side by Side */}
      <div className="px-6 pb-6 pt-8">
        {/* Two Months Display */}
        <div className="flex justify-center space-x-16">
          {/* Current Month */}
          <div className="flex flex-col items-center w-80">
            {renderHeader(currentMonth, true, false)}
            {renderDays()}
            {renderCells(currentMonth)}
          </div>

          {/* Next Month */}
          <div className="flex flex-col items-center w-80">
            {renderHeader(addMonths(currentMonth, 1), false, true)}
            {renderDays()}
            {renderCells(addMonths(currentMonth, 1))}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-6 pb-6">
        <div className="flex justify-end items-center space-x-4">
          <button
            onClick={clearDates}
            className="text-sm font-medium text-gray-600 hover:text-black underline"
          >
            Clear dates
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCalendarModal;
