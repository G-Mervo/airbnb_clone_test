import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import star from '../../asset/Icons_svg/star.svg';
import Header from '../Header/Header';
import { setMinimize, setShowLogin } from '../../redux/AppSlice';
import { useLocation, useParams } from 'react-router';
import TopMainCont from './TopMainCont';
import MidMainCont from './MidMainCont';
import BottomMainCont from './BottomMainCont';
import NavBar from './NavBar';
import { useQuery } from '@tanstack/react-query';
import { setHouseInfo, setIsLoading } from '../../redux/HouseDetailSlice';
import LongFooter from './LongFooter';
import { Link } from 'react-router-dom';
import { differenceInDays, format, isSameMonth } from 'date-fns';
import ImagesSkeleton from './ImagesSkeleton';

// Type definitions
interface HouseInfo {
  id: string;
  price: number;
  house_rating: number;
  [key: string]: any;
}

interface PriceDetailsProps {
  dateSelected: boolean;
  allHouseInfo: HouseInfo;
  numOfDays: number;
  tripDurationDate: string | null;
}

interface RatingDisplayProps {
  houseInfo: HouseInfo;
}

interface ActionButtonProps {
  userData: any;
  dateSelected: boolean;
  houseInfo: HouseInfo;
  scrollToSection: (sectionId: string) => void;
  dispatch: any;
}

interface FooterComponentProps {
  dateSelected: boolean;
  allHouseInfo: HouseInfo;
  numOfDays: number;
  tripDurationDate: string | null;
  houseInfo: HouseInfo;
  userData: any;
}

// Custom hook for formatted date range
const useFormattedDateRange = (startDate: Date | null, endDate: Date | null): string | null => {
  const [tripDurationDate, setTripDurationDate] = useState<string | null>(null);

  useEffect(() => {
    const formatDateRange = (start: Date | null, end: Date | null): string | null => {
      if (!start || !end) return null;

      const startD = new Date(start);
      const endD = new Date(end);

      if (isSameMonth(startD, endD)) {
        return `${format(startD, 'dd')} - ${format(endD, 'dd MMM')}`;
      } else {
        return `${format(startD, 'dd MMM')} - ${format(endD, 'dd MMM')}`;
      }
    };

    setTripDurationDate(formatDateRange(startDate, endDate));
  }, [startDate, endDate]);

  return tripDurationDate;
};

const scrollToSection = (sectionId: string): void => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const PriceDetails: React.FC<PriceDetailsProps> = ({
  dateSelected,
  allHouseInfo,
  numOfDays,
  tripDurationDate,
}) => {
  const calculatePrice = (): number | null => {
    if (!dateSelected) return null;
    const basePrice = Math.ceil(allHouseInfo?.price * Math.abs(numOfDays));
    const totalPrice = basePrice + Math.floor(0.1 * basePrice);
    return totalPrice;
  };

  if (!dateSelected) return null;

  return (
    <div className="flex flex-col">
      {dateSelected && (
        <span className="text-normal font-medium">
          ${calculatePrice()} <span className="font-light text-sm">night</span>
        </span>
      )}
      {dateSelected && tripDurationDate && (
        <span className="text-sm font-medium underline">{tripDurationDate}</span>
      )}
    </div>
  );
};

const RatingDisplay: React.FC<RatingDisplayProps> = ({ houseInfo }) => (
  <div className="flex items-center gap-1">
    <img src={star} className="h-3 w-3" alt="star rating" />
    <span className="font-medium text-xs">{houseInfo?.house_rating}</span>
  </div>
);

const ActionButton: React.FC<ActionButtonProps> = ({
  userData,
  dateSelected,
  houseInfo,
  scrollToSection,
  dispatch,
}) => {
  const handleClick = (e: React.MouseEvent): void => {
    if (!dateSelected) {
      scrollToSection('calendar');
    } else {
      if (!userData) {
        dispatch(setShowLogin(true));
      }
    }
  };

  return (
    <Link to={userData && dateSelected ? `/${houseInfo?.id}/book` : '#'} onClick={handleClick}>
      <button
        className={`${
          dateSelected ? 'px-10' : 'px-6'
        } h-12 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-[#EB194B] via-[#E01463] to-[#CF0E7C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]`}
      >
        <span className="text-white text-nowrap">
          {dateSelected ? 'Reserve' : 'Check availability'}
        </span>
      </button>
    </Link>
  );
};

const FooterComponent: React.FC<FooterComponentProps> = ({
  dateSelected,
  allHouseInfo,
  numOfDays,
  tripDurationDate,
  houseInfo,
  userData,
}) => {
  const dispatch = useDispatch();

  return (
    <div className="w-full z-50 border-t border-grey-dim py-4 bg-white fixed bottom-0 justify-between px-5 flex 1xz:hidden">
      <PriceDetails
        dateSelected={dateSelected}
        allHouseInfo={allHouseInfo}
        numOfDays={numOfDays}
        tripDurationDate={tripDurationDate}
      />
      {!dateSelected && <RatingDisplay houseInfo={houseInfo} />}
      <ActionButton
        userData={userData}
        dateSelected={dateSelected}
        houseInfo={houseInfo}
        scrollToSection={scrollToSection}
        dispatch={dispatch}
      />
    </div>
  );
};

// Custom hook for handling scroll behavior
const useScrollBehavior = (dispatch: any): void => {
  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollPosition = window.scrollY;

      if (currentScrollPosition > 18) {
        setTimeout(() => {
          dispatch(setMinimize(false));
        }, 50);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch]);
};

// Custom hook for handling house data with skeleton timing
const useHouseData = (id: string, houseInfo: any) => {
  const dispatch = useDispatch();
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Fetch room data using the proper API endpoint
  const { isLoading, data } = useQuery({
    queryKey: ['roomInfo', id],
    queryFn: async () => {
      // Use direct API call to our backend
      const apiClient = await import('../../api/apiClient');
      const response = await apiClient.default.get(`/api/rooms/${id}`);

      // Transform the response to match frontend expectations
      return {
        ...response,
        price: response.base_price, // Map base_price to price
        house_rating: response.average_rating, // Map average_rating to house_rating
        rating: response.average_rating, // Also keep rating for compatibility
      };
    },
    enabled: !!id && !houseInfo, // Only run if we don't already have the house data
  });

  useEffect(() => {
    if (data && !houseInfo) {
      dispatch(setHouseInfo({ [id]: data }));
      dispatch(setIsLoading(false));

      // Keep skeleton visible for 2-3 seconds even after data loads
      setTimeout(() => {
        setShowSkeleton(false);
      }, 2500); // 2.5 seconds
    }
  }, [data, dispatch, id, houseInfo]);

  // Reset skeleton when ID changes
  useEffect(() => {
    setShowSkeleton(true);
  }, [id]);

  return { isLoading, data, showSkeleton };
};

// Layout component for the main content with conditional skeleton
const MainContent: React.FC<{ minimize: boolean; showSkeleton: boolean }> = ({
  minimize,
  showSkeleton,
}) => (
  <div className={`${minimize ? 'absolute top-20 -z-10' : ''} w-full`}>
    {showSkeleton ? <ImagesSkeleton /> : <TopMainCont />}
    <div className="w-full flex justify-center">
      <MidMainCont />
    </div>
    <div className="w-full flex justify-center">
      <BottomMainCont />
    </div>
    <LongFooter />
  </div>
);

// Header wrapper component
interface HeaderWrapperProps {
  headerRef: React.RefObject<HTMLDivElement>;
  minimize: boolean;
  startScroll: boolean;
  animateHeaderClass1: string;
  animateHeaderClass2: string;
}

const HeaderWrapper: React.FC<HeaderWrapperProps> = ({
  headerRef,
  minimize,
  startScroll,
  animateHeaderClass1,
  animateHeaderClass2,
}) => (
  <div
    ref={headerRef}
    id="header"
    className={`bg-white hidden ${
      minimize ? 'z-50' : 'z-10'
    } transition-all duration-[0.3s] ease-in-out ${
      !startScroll ? animateHeaderClass1 : animateHeaderClass2
    } w-full 1xz:flex items-start justify-center`}
  >
    <Header headerRef={headerRef} />
  </div>
);

// Main HouseDetail component
const HouseDetail: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const headerRef = useRef<HTMLDivElement>(null);

  if (!id) return <div>Property not found</div>;

  const onHouseDetailPage = location.pathname.includes('/house/');
  const sliceName = onHouseDetailPage ? 'houseDetail' : 'app';

  // Redux selectors
  const { minimize, userData } = useSelector((store: any) => store.app);
  const { houseInfo: allHouseInfo } = useSelector((store: any) => store.houseDetail);
  const { selectedStartDate: startDate, selectedEndDate: endDate } = useSelector(
    (store: any) => store.form,
  );
  const startScroll = useSelector((store: any) => store[sliceName]?.startScroll);

  const houseInfo = allHouseInfo[id];
  const tripDurationDate = useFormattedDateRange(startDate, endDate);
  const numOfDays =
    startDate && endDate ? differenceInDays(new Date(endDate), new Date(startDate)) : 0;
  const dateSelected = Boolean(startDate && endDate);

  // Custom hooks
  useScrollBehavior(dispatch);
  const { showSkeleton } = useHouseData(id, houseInfo);

  useEffect(() => {
    if (!startDate || !endDate || !id) return;

    let localData = JSON.parse(localStorage.getItem(id) || '{}');

    const formattedStartDate = format(new Date(startDate), 'eee MMM dd, yyyy');
    const formattedEndDate = format(new Date(endDate), 'eee MMM dd, yyyy');

    let newData = {
      ...localData,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    };

    if (localData || Object.keys(localData).length > 0) {
      localStorage.setItem(id, JSON.stringify(newData));
    }
  }, [id, endDate, startDate]);

  // Animation classes
  const animateHeaderClass1 = minimize ? 'animate-expand' : 'max-h-[5rem] h-full';
  const animateHeaderClass2 = minimize ? 'animate-collapse' : 'max-h-[11rem] h-full';

  // Prevent scroll restoration
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Always render the main layout, but conditionally show skeleton for images/header only
  if (!houseInfo) {
    return <ImagesSkeleton />;
  }

  return (
    <div className="relative pb-20 1xz:pb-0 overflow-x-clip">
      <HeaderWrapper
        headerRef={headerRef}
        minimize={minimize}
        startScroll={startScroll}
        animateHeaderClass1={animateHeaderClass1}
        animateHeaderClass2={animateHeaderClass2}
      />

      <div className="w-full hidden 1xz:block">
        <NavBar />
      </div>

      <MainContent minimize={minimize} showSkeleton={showSkeleton} />

      <FooterComponent
        dateSelected={dateSelected}
        allHouseInfo={houseInfo}
        numOfDays={numOfDays}
        tripDurationDate={tripDurationDate}
        houseInfo={houseInfo}
        userData={userData}
      />
    </div>
  );
};

export default HouseDetail;
