import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import Header from '../Header/Header';
import { Booking, fetchUserBookings } from '../../redux/bookingsSlice';
import MobileFooter from '../Footer/MobileFooter';
import LongFooter from '../House-detail/LongFooter';
import monthSvg from '../../asset/Icons_svg/month.svg';
import person from '../../asset/Icons_svg/Person.svg';

const NoTripsBooked: React.FC = () => {
  return (
    <div className="py-10 flex flex-col gap-y-2 justify-center w-full items-start mb-96">
      <h2 className="text-2xl font-normal">No trips Booked ... yet!</h2>
      <p className="font-light">
        Time to dust off your bags and start planning your next adventure.
      </p>
      <Link to="/">
        <button className="px-6 mt-2 py-3 border-black border rounded-lg font-medium">
          Start searching
        </button>
      </Link>
      <div className="w-full mt-10 h-[1px] bg-grey-light-50"></div>
    </div>
  );
};

interface TripCardProps {
  booking: Booking;
}

const TripCard: React.FC<TripCardProps> = ({ booking }) => {
  // If the image is empty, the booking data is bad - we need to create NEW bookings
  if (!booking.roomData.image || booking.roomData.image === '') {
    console.log('❌ OLD BOOKING WITH EMPTY IMAGE - DELETE AND CREATE NEW BOOKING!');
  }

  return (
    <div className="shadow-2xl p-5 rounded-xl">
      <Link to={`/house/${booking.roomId}`}>
        <div className="w-full h-0 pb-[100%] relative rounded-[20px] overflow-hidden">
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src={booking.roomData.image}
            alt={booking.roomData.title}
            onError={(e) => {
              console.log('❌ Image failed to load:', booking.roomData.image);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', booking.roomData.image);
            }}
          />
        </div>
      </Link>
      <TripInfo booking={booking} />
    </div>
  );
};

interface TripInfoProps {
  booking: Booking;
}

const TripInfo: React.FC<TripInfoProps> = ({ booking }) => (
  <div className="w-full h-full p-2 mt-5">
    <div className="flex flex-col 1xxl:flex-row gap-x-2 gap-y-2 justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-medium truncate">{booking.roomData.title}</h2>
        <span className="text-gray-600 block mt-2 font-medium text-sm truncate">
          {booking.roomData.location}
        </span>
      </div>
      <div className="flex-shrink-0">
        <span className="bg-blue-200 text-sm font-medium text-blue-800 rounded-full px-2 py-1 whitespace-nowrap">
          UPCOMING
        </span>
      </div>
    </div>

    <TripDates startDate={booking.startDate} endDate={booking.endDate} />
    <GuestInfo booking={booking} />
    <ItineraryButton reservationCode={booking.id} />
  </div>
);

interface TripDatesProps {
  startDate: string;
  endDate: string;
}

const TripDates: React.FC<TripDatesProps> = ({ startDate, endDate }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex mt-3 items-center gap-x-2 min-w-0">
      <img className="h-4 w-4 opacity-70 flex-shrink-0" src={monthSvg} alt="Month" />
      <span className="text-grey text-[15px] font-medium truncate">
        {formatDate(startDate)} - {formatDate(endDate)}
      </span>
    </div>
  );
};

interface GuestInfoProps {
  booking: Booking;
}

const GuestInfo: React.FC<GuestInfoProps> = ({ booking }) => {
  const getTotalGuests = () => {
    const { adults, children, infants, pets } = booking.guestCount;
    const totalGuests = adults + children;
    const totalPets = pets;

    let guestText = `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`;
    if (infants > 0) {
      guestText += `, ${infants} infant${infants !== 1 ? 's' : ''}`;
    }
    if (totalPets > 0) {
      guestText += `, ${totalPets} pet${totalPets !== 1 ? 's' : ''}`;
    }

    return guestText;
  };

  return (
    <div className="flex items-center gap-x-2 min-w-0 mt-1">
      <img className="h-4 w-4 opacity-70 flex-shrink-0" src={person} alt="Guest" />
      <span className="text-grey text-[15px] font-medium truncate">{getTotalGuests()}</span>
    </div>
  );
};

const ArrowRightSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      role="presentation"
      focusable="false"
      style={{
        display: 'block',
        fill: 'none',
        height: '16px',
        width: '16px',
        stroke: '#ff385c',
        strokeWidth: '3',
        overflow: 'visible',
      }}
    >
      <path fill="none" d="M12 4l11.3 11.3a1 1 0 0 1 0 1.4L12 28" />
    </svg>
  );
};

interface ItineraryButtonProps {
  reservationCode: string;
}

const ItineraryButton: React.FC<ItineraryButtonProps> = ({ reservationCode }) => (
  <div className="flex flex-col gap-x-2 gap-y-2 1xxl:flex-row mt-3 items-start justify-between">
    <div className="flex gap-x-2 items-center min-w-0 flex-1">
      <h4 className="font-medium text-nowrap text-gray-700 text-sm">Reservation code:</h4>
      <span className="text-grey text-[15px] font-medium truncate">
        {String(reservationCode).split('-')[0]}
      </span>
    </div>
    <button className="flex cursor-pointer items-center gap-x-2 flex-shrink-0">
      <span className="text-nowrap text-pink font-medium text-sm">View itinerary</span>
      <ArrowRightSVG />
    </button>
  </div>
);

const Trips: React.FC = () => {
  const bookings = useSelector((state: any) => state.bookings.bookings);
  const userData = useSelector((state: any) => state.app.userData);
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const headerRef = useRef(null);

  // Filter bookings for current user
  const userBookings = (bookings || []).filter(
    (booking: Booking) => booking.userId === (userData?.uid || userData?.id),
  );

  const isTripAvailable = userBookings.length > 0;

  const userDataLoaded = useRef(false);
  useEffect(() => {
    if (userData) {
      userDataLoaded.current = true;
    } else {
      userDataLoaded.current = false;
    }
  }, [userData]);

  useEffect(() => {
    setTimeout(() => {
      if (!userDataLoaded.current) {
        return navigate('/login');
      }
    }, 1000);
  }, [userData, navigate]);

  // Load bookings when component mounts
  useEffect(() => {
    dispatch(fetchUserBookings());
  }, [dispatch]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="relative">
      <div
        id="header"
        className="z-50 bg-white fixed top-0 hidden w-full 1xz:flex items-start justify-center"
      >
        <Header headerRef={headerRef} />
      </div>

      <div className="1smd:w-[calc(100%-10rem)] px-5 1xz:mt-20 pt-9 pb-6 mx-auto">
        <h1 className="text-3xl border-b border-grey-light-50 pb-5 font-medium">Trips</h1>
        {!isTripAvailable ? <NoTripsBooked /> : null}
        {isTripAvailable && (
          <div className="grid 1lg:gap-x-4 mt-5 mb-20 1xs:px-12 1xz:px-0 gap-x-4 gap-y-10 grid-cols-1 1xz:grid-cols-2 1xll:grid-cols-3 justify-center w-full items-start 1lg:gap-y-4 xl:gap-y-8 grid-flow-row">
            {userBookings.map((booking: Booking) => (
              <TripCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
      {userData && <MobileFooter />}
      <LongFooter />
    </div>
  );
};

export default Trips;
