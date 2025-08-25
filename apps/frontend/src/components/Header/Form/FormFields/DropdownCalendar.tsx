import React, { useEffect, useRef, useState } from 'react';
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
import arrowRight from '../../../../asset/Icons_svg/arrow-right.svg';
import arrowLeft from '../../../../asset/Icons_svg/arrow-left.svg';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActiveInput,
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDurationDate,
} from '../../../../redux/mainFormSlice';

const DropdownCalendar: React.FC = () => {
  const selectedInput = useSelector((store: any) => store.form.curSelectInput);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentMonth = useSelector((store: any) => store.form.currentMonth);
  const selectedStartDate = useSelector((store: any) => store.form.selectedStartDate);
  const selectedEndDate = useSelector((store: any) => store.form.selectedEndDate);
  const startDurationDate = useSelector((store: any) => store.form.startDurationDate);
  const isModalOpen = useSelector((store: any) => store.form.isCalendarModalOpen);

  const dispatch = useDispatch();

  const renderHeader = (currentMonth: Date) => {
    const dateFormat = 'MMMM yyyy';
    return (
      <div className="flex pb-4 justify-center items-center py-2">
        <div className="flex items-center justify-center flex-grow text-base font-medium">
          <span>{format(currentMonth, dateFormat)}</span>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = 'eee';
    const days = [];
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      days.push(
        <div
          className="flex w-[3rem] justify-center text-xs text-center"
          key={format(day, 'yyyy-MM-dd')}
        >
          {format(day, dateFormat)}
        </div>,
      );
    }

    return <div className="flex justify-center items-center mb-2">{days}</div>;
  };

  const renderCells = (currentMonth: Date) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = new Date();

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat);
        const cloneDay = day;
        let cellClass = '';

        // Determine if the day is in the past and within the current month
        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isPastDate = isSameMonth(day, monthStart) && day < todayAtMidnight;

        let onClickHandler: (() => void) | null = () => {
          if (isModalOpen) {
            onCalendarModalDateClick(cloneDay);
          } else {
            if (!isPastDate) onDateClick(cloneDay);
          }
        };

        if (isModalOpen) {
          if (isSameDay(day, startDurationDate) && isSameMonth(day, monthStart)) {
            cellClass = 'bg-black text-white rounded-full';
          } else if (!isSameMonth(day, monthStart)) {
            cellClass = 'bg-white cursor-pointer text-white';
            onClickHandler = null;
          } else {
            cellClass =
              'bg-white text-black hover:rounded-full hover:border-[1.5px] hover:border-black';
          }
        } else {
          if (
            selectedStartDate &&
            selectedEndDate &&
            isWithinInterval(day, {
              start: selectedStartDate,
              end: selectedEndDate,
            })
          ) {
            if (isSameDay(day, selectedStartDate) && isSameMonth(day, monthStart)) {
              cellClass =
                "halfRightColor text-white before:bg-black before:content-[''] before:w-full before:h-full before:rounded-full before:border-[1.5px] before:border-black before:absolute top-0 before:left-0 hover:before:right-0 hover:before:bottom-0";
            } else if (isSameDay(day, selectedEndDate) && isSameMonth(day, monthStart)) {
              cellClass =
                "halfLeftColor text-white before:bg-black before:content-[''] before:w-full before:h-full before:rounded-full before:border-[1.5px] before:border-black before:absolute top-0 before:left-0 hover:before:right-0 hover:before:bottom-0";
            } else if (!isSameMonth(day, monthStart)) {
              cellClass = 'bg-white text-white hidden cursor-default';
              onClickHandler = null;
            } else {
              cellClass =
                "bg-shadow-gray-light text-black hover:before:content-[''] hover:before:w-full hover:before:h-full hover:before:rounded-full hover:before:border-[1.5px] hover:before:border-black hover:before:absolute hover:top-0 hover:before:left-0";
            }
          } else if (selectedStartDate && !selectedEndDate && isBefore(day, selectedStartDate)) {
            cellClass = 'bg-white text-gray-400 line-through !cursor-default';
            onClickHandler = null;
          } else if (isSameDay(day, selectedStartDate) && isSameMonth(day, monthStart)) {
            cellClass = 'bg-black text-white rounded-full';
          } else if (isSameDay(day, selectedEndDate) && isSameMonth(day, monthStart)) {
            cellClass = 'bg-black text-white rounded-full';
          } else if (!isSameMonth(day, monthStart)) {
            cellClass = 'bg-white text-white hidden cursor-default';
            onClickHandler = null;
          } else if (isPastDate) {
            cellClass = 'bg-white text-gray-300 cursor-default';
            onClickHandler = null;
          } else {
            cellClass =
              'bg-white text-black hover:rounded-full hover:border-[1.5px] hover:border-black';
          }
        }

        days.push(
          <div
            key={day.toString()}
            className="relative w-[3rem] h-[3rem] flex items-center justify-center"
          >
            <div
              className={`w-full h-full flex items-center justify-center ${
                isPastDate ? '' : 'cursor-pointer'
              } ${cellClass}`}
              key={day.toString()}
              onClick={onClickHandler || undefined}
            >
              <span className="text-sm text-center z-20 font-medium">{formattedDate}</span>
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div
          className="flex items-center justify-center w-full mb-[2px] place-items-stretch"
          key={day.toString()}
        >
          {days}
        </div>,
      );

      days = [];
    }
    return <div className="flex flex-col w-full justify-between items-stretch">{rows}</div>;
  };

  const onCalendarModalDateClick = (day: Date) => {
    dispatch(setStartDurationDate(day));
  };

  const onDateClick = (day: Date) => {
    if (selectedInput === 'checkOut' && !selectedEndDate && !selectedStartDate) {
      dispatch(setSelectedEndDate(day));
      dispatch(setActiveInput('checkIn'));
    } else if (
      selectedEndDate &&
      selectedInput === 'checkIn' &&
      !selectedStartDate &&
      day < selectedEndDate
    ) {
      dispatch(setSelectedStartDate(day));
      dispatch(setActiveInput('checkOut'));
    } else if (!selectedStartDate) {
      dispatch(setSelectedStartDate(day));
      dispatch(setSelectedEndDate(null));
      dispatch(setActiveInput('checkOut'));
    } else if (day < selectedStartDate) {
      dispatch(setSelectedStartDate(day));
      dispatch(setSelectedEndDate(null));
      dispatch(setActiveInput('checkIn'));
    } else if (!selectedEndDate) {
      dispatch(setSelectedEndDate(day));
      dispatch(setActiveInput('checkOut'));
    } else if (selectedInput === 'checkIn') {
      dispatch(setSelectedStartDate(day));
      dispatch(setSelectedEndDate(null));
      dispatch(setActiveInput('checkOut'));
    } else if (day > selectedEndDate) {
      dispatch(setSelectedEndDate(day));
      dispatch(setActiveInput('checkOut'));
    } else if (isWithinInterval(day, { start: selectedStartDate, end: selectedEndDate })) {
      dispatch(setSelectedEndDate(day));
      dispatch(setActiveInput('checkOut'));
    } else if (isSameDay(day, selectedStartDate)) {
      dispatch(setSelectedEndDate(selectedStartDate));
      dispatch(setActiveInput('checkOut'));
    }
  };

  const handleScroll = (direction: string) => {
    const maxIndex = 2;
    if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    } else if (direction === 'right' && currentIndex < maxIndex) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center relative">
      {/* Navigation buttons */}
      <button
        disabled={currentIndex === 0}
        className={`absolute left-4 ${
          currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
        } top-[3rem] transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md`}
        onClick={() => handleScroll('left')}
      >
        <img className="h-4 w-4" src={arrowLeft} alt="" />
      </button>
      <button
        disabled={currentIndex === 2}
        className={`absolute right-4 ${
          currentIndex === 2 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'
        } top-[3rem] transform -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md`}
        onClick={() => handleScroll('right')}
      >
        <img className="h-4 w-4" src={arrowRight} alt="" />
      </button>

      {/* Calendar container */}
      <div className="overflow-hidden">
        <div
          style={{
            transition: 'transform 300ms ease-out',
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
          className="flex w-[300%]"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`${index}-current`} className="w-1/3 flex-shrink-0 px-6 py-4">
              <div className="flex w-full justify-center">
                {renderHeader(addMonths(currentMonth, index))}
              </div>
              {renderDays()}
              <div className="w-full">{renderCells(addMonths(currentMonth, index))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DropdownCalendar;
