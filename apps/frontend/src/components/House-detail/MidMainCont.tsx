import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import BookingForm from './BookingForm';

// Import required icons
import sharedSpace from '../../asset/Icons_svg/commonSpace.svg';
import bathroom from '../../asset/Icons_svg/bathroom.svg';
import furryFriend from '../../asset/Icons_svg/furryFriends.svg';
import room from '../../asset/Icons_svg/roomIcon.svg';
import star from '../../asset/Icons_svg/star.svg';
import person from '../../asset/person.svg';
import bed from '../../asset/Icons_svg/bed.svg';

// Calendar imports
import Calendar from '../Header/Form/FormFields/Calendar';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  setSelectedEndDate,
  setSelectedStartDate,
  setStartDateToShow,
  setEndDateToShow,
} from '../../redux/mainFormSlice';
import { useDispatch } from 'react-redux';
import AmenitiesModal from './AmenitiesModal';
import ReviewsModal from './ReviewsModal';
import { useReviews } from '@/hooks/useReviews';
import GuestFavoriteBadge from './GuestFavoriteBadge';
import DescriptionModal from './DescriptionModal';

const MidMainCont: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo[id!]);
  const isLoading = useSelector((store: any) => store.houseDetail.isLoading);

  return (
    <div className="max-w-7xl w-full px-2 1xsss:px-5 1xz:px-10 1lg:px-20 mx-auto relative">
      <div className="flex w-full 1xz:border-b 1xz:border-grey-dim justify-between">
        <HouseInfo houseInfo={houseInfo} isLoading={isLoading} />
        <BookingForm />
      </div>
    </div>
  );
};

/* Reusable Divider Component */
const Divider: React.FC = () => <div className="h-[1px] bg-grey-dim"></div>;

/* Reusable Loading Skeleton Component */
interface LoadingSkeletonProps {
  width: string;
  height: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ width, height }) => (
  <div className={`max-w-[${width}] w-full h-${height} bg-gray-200 animate-pulse`}></div>
);

/* House Details Component */
const HouseDetails: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const { id } = useParams<{ id: string }>();
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo[id!]);

  const [houseInfoDetails, setHouseInfoDetails] = useState<string[]>([]);

  useEffect(() => {
    if (!houseInfo) {
      setHouseInfoDetails([]);
      return;
    }

    const details: string[] = [];

    if (houseInfo.max_guests > 0) {
      const label = houseInfo.max_guests === 1 ? 'guest' : 'guests';
      details.push(`${houseInfo.max_guests} ${label}`);
    }

    if (houseInfo.bedrooms > 0) {
      const label = houseInfo.bedrooms === 1 ? 'bedroom' : 'bedrooms';
      details.push(`${houseInfo.bedrooms} ${label}`);
    }

    if (houseInfo.beds > 0) {
      const label = houseInfo.beds === 1 ? 'bed' : 'beds';
      details.push(`${houseInfo.beds} ${label}`);
    }

    if (houseInfo.bathrooms > 0) {
      const label = houseInfo.bathrooms === 1 ? 'bath' : 'baths';
      details.push(`${houseInfo.bathrooms} ${label}`);
    }

    setHouseInfoDetails(details);
  }, [houseInfo]);

  return (
    <div className="flex items-center">
      {isLoading ? (
        <LoadingSkeleton width="80" height="5" />
      ) : (
        <div className="flex w-full items-center">
          {houseInfoDetails.map((item, i) => (
            <div className="flex items-center" key={i}>
              <span className="font-light">{item}</span>
              {i < houseInfoDetails.length - 1 && <DotSeparator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Dot Separator Component */
const DotSeparator: React.FC = () => (
  <span className="flex h-full mx-1 items-center justify-center">
    <span className="w-[3px] h-[3px] bg-current rounded-full"></span>
  </span>
);

/* Rating Section Component */
interface RatingSectionProps {
  isLoading: boolean;
  houseInfo: any;
}

const RatingSection: React.FC<RatingSectionProps> = ({ isLoading, houseInfo }) => {
  const { id } = useParams<{ id: string }>();
  const {
    isReviewsOpen,
    setIsReviewsOpen,
    propertyReviews,
    overallRating,
    totalReviews,
    ratings,
    ratingDistribution,
  } = useReviews(id, houseInfo);

  const isGuestFavorite = overallRating >= 4 && totalReviews >= 5;

  return (
    <div className="flex w-full items-center">
      {isLoading ? (
        <LoadingSkeleton width="80" height="5" />
      ) : isGuestFavorite ? (
        <GuestFavoriteBadge
          rating={overallRating}
          reviewsCount={totalReviews}
          onClick={() => setIsReviewsOpen(true)}
        />
      ) : (
        <div className="flex gap-1 items-center leading-8">
          <img className="w-4 h-4" src={star} alt="star" />
          <span className="font-medium">{overallRating.toFixed(2)}</span>
          <DotSeparator />
          <span
            onClick={() => setIsReviewsOpen(true)}
            className="underline font-medium cursor-pointer"
          >
            {totalReviews} reviews
          </span>
        </div>
      )}

      <ReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        overallRating={overallRating}
        totalReviews={totalReviews}
        ratingDistribution={ratingDistribution}
        ratings={ratings}
        reviews={propertyReviews}
        houseInfo={houseInfo}
      />
    </div>
  );
};

// Removed cleanString function as it's no longer needed

/* Host Section Component */
interface HostSectionProps {
  houseInfo: any;
}

const HostSection: React.FC<HostSectionProps> = ({ houseInfo }) => {
  const host = houseInfo?.host;

  // Calculate years of hosting
  const getHostingYears = (joinedDate: string) => {
    if (!joinedDate) return 'New host';
    const joined = new Date(joinedDate);
    const now = new Date();
    const years = now.getFullYear() - joined.getFullYear();
    if (years === 0) return 'New host';
    if (years === 1) return '1 year hosting';
    return `${years} years hosting`;
  };

  // Format response rate
  const formatResponseRate = (rate: number) => {
    if (!rate) return '';
    return `${rate}% response rate`;
  };

  // Format response time
  const formatResponseTime = (time: string) => {
    if (!time) return '';
    return `Responds ${time}`;
  };

  // Format languages
  const formatLanguages = (languages: string[]) => {
    if (!languages || languages.length === 0) return '';
    if (languages.length === 1) return `Speaks ${languages[0]}`;
    return `Speaks ${languages.slice(0, -1).join(', ')} and ${languages[languages.length - 1]}`;
  };

  return (
    <div className="py-6 border-b border-grey-dim">
      <div className="flex gap-4 items-start">
        {/* Host Avatar */}
        <img
          className="h-16 w-16 object-cover rounded-full"
          src={host?.image || person}
          alt={`${host?.name || 'Host'}`}
        />

        {/* Host Information */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">Hosted by {host?.name || 'Unknown Host'}</h3>
            {host?.isSuperhost && (
              <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-full">
                Superhost
              </span>
            )}
          </div>

          {/* Hosting Duration */}
          <p className="text-sm text-grey mb-2">{getHostingYears(host?.joinedDate)}</p>
        </div>
      </div>
    </div>
  );
};

/* Room Details Section */
const RoomDetails: React.FC = () => (
  <div className="py-8 flex border-b border-grey-dim flex-col gap-y-5">
    <RoomDetailItem
      icon={room}
      title="Room in a villa"
      description="Your own room in a home, plus access to shared spaces."
    />
    <RoomDetailItem
      icon={sharedSpace}
      title="Shared common spaces"
      description="You'll share parts of the home."
    />
    <RoomDetailItem
      icon={bathroom}
      title="Shared bathroom"
      description="You'll share the bathroom with others."
    />
    <RoomDetailItem
      icon={furryFriend}
      title="Furry friends welcome"
      description="Bring your pets along for the stay."
    />
  </div>
);

/* Reusable Room Detail Item Component */
interface RoomDetailItemProps {
  icon: string;
  title: string;
  description: string;
}

const RoomDetailItem: React.FC<RoomDetailItemProps> = ({ icon, title, description }) => (
  <div className="flex items-start gap-8">
    <img className="w-6 h-6" src={icon} alt={title} />
    <div className="flex flex-col">
      <span className="leading-4">{title}</span>
      <span className="leading-8 text-sm text-grey">{description}</span>
    </div>
  </div>
);

// Bedroom Card Component
interface BedroomCardProps {
  imageUrl: string;
  bedType: string;
  bedroomName: string;
}

const BedroomCard: React.FC<BedroomCardProps> = ({ imageUrl, bedType, bedroomName }) => (
  <div className="w-80 shrink-0 flex justify-center flex-col">
    <div className="h-52 flex items-center justify-center w-full">
      <img
        className="rounded-xl object-cover w-full h-full"
        src={imageUrl}
        alt={bedroomName}
        style={{
          scrollSnapAlign: 'start',
          flexShrink: 0,
          scrollSnapStop: 'always',
        }}
      />
    </div>
    <div className="flex flex-col">
      <span className="mt-4 font-medium">{bedroomName}</span>
      <span className="text-sm font-light">{bedType}</span>
    </div>
  </div>
);

// Empty Bedroom Placeholder
interface EmptyBedroomPlaceholderProps {
  bedType: string;
}

const EmptyBedroomPlaceholder: React.FC<EmptyBedroomPlaceholderProps> = ({ bedType }) => (
  <div className="border-[1px] max-w-56 w-full flex-center rounded-xl h-36">
    <div className="w-44 flex justify-between flex-col h-24">
      <img src={bed} className="w-7 h-7" alt="bed icon" />
      <div className="flex flex-col">
        <span className="text-lg font-medium">Bedroom 1</span>
        <span className="text-sm font-light">{bedType}</span>
      </div>
    </div>
  </div>
);

// Main Bedroom Section Component
interface BedroomSectionProps {
  houseInfo: any;
}

const BedroomSection: React.FC<BedroomSectionProps> = ({ houseInfo }) => {
  const { sleep_bed_1_link, sleep_bed_2_link, host } = houseInfo || {};
  const sleepBedLink = sleep_bed_1_link || host?.image || '';
  return (
    <div className="py-12 w-full flex justify-between flex-col">
      <h3 className="text-2xl leading-6 font-medium pb-6">Where you'll sleep</h3>

      {!sleepBedLink ? (
        <EmptyBedroomPlaceholder bedType="1 double bed" />
      ) : (
        <div
          className="flex gap-4 w-full overflow-x-auto min-w-5rem"
          style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
        >
          <BedroomCard imageUrl={sleepBedLink} bedroomName="Bedroom 1" bedType="1 double bed" />

          {sleep_bed_2_link && (
            <BedroomCard
              imageUrl={sleep_bed_2_link}
              bedroomName="Bedroom 2"
              bedType="1 queen bed"
            />
          )}
        </div>
      )}
    </div>
  );
};

// Amenity Item Component
interface AmenityItemProps {
  iconSrc: string;
  label: string;
  isAvailable?: boolean;
}

const AmenityItem: React.FC<AmenityItemProps> = ({ iconSrc, label, isAvailable = true }) => (
  <div className="w-1/2 pb-4 gap-4 flex">
    <div className="relative h-6 w-6">
      <img
        className={`h-6 w-6 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
        src={iconSrc}
        alt={`${label} icon`}
      />
      {!isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-0.5 bg-red-500 rotate-45 transform origin-center"></div>
        </div>
      )}
    </div>
    <span className={`font-light ${!isAvailable ? 'line-through text-gray-400' : ''}`}>
      {isAvailable ? label : `Not available: ${label}`}
    </span>
  </div>
);

// Helper function to map amenity names to proper public/images icons
const mapMainAmenityToIcon = (amenityName: string): { iconSrc: string; isAvailable: boolean } => {
  const amenityMap: Record<string, { iconSrc: string; isAvailable: boolean }> = {
    // Basic amenities (using custom icons in public/images)
    wifi: { iconSrc: '/images/wifi-icon.svg', isAvailable: true },
    kitchen: { iconSrc: '/images/kitchen-icon-custom.svg', isAvailable: true },
    Kitchen: { iconSrc: '/images/kitchen-icon-custom.svg', isAvailable: true },
    'air conditioning': { iconSrc: '/images/air-conditioning-icon.svg', isAvailable: true },
    tv: { iconSrc: '/images/tv-icon-custom.svg', isAvailable: true },
    TV: { iconSrc: '/images/tv-icon-custom.svg', isAvailable: true },

    // Parking
    'free parking': { iconSrc: '/images/features-free-parking-icon.svg', isAvailable: true },
    parking: { iconSrc: '/images/features-free-parking-icon.svg', isAvailable: true },

    // Water/pool amenities
    pool: { iconSrc: '/images/pool-icon.svg', isAvailable: true },
    'hot tub': { iconSrc: '/images/hot-tub-icon.svg', isAvailable: true },
    'private hot tub': { iconSrc: '/images/hot-tub-icon.svg', isAvailable: true },

    // Self check-in & pets
    'self check-in': { iconSrc: '/images/location-self-checkin-icon.svg', isAvailable: true },
    'self-check-in': { iconSrc: '/images/location-self-checkin-icon.svg', isAvailable: true },
    'allows pets': { iconSrc: '/images/location-allows-pets-icon.svg', isAvailable: true },
    'pets allowed': { iconSrc: '/images/location-allows-pets-icon.svg', isAvailable: true },

    // Laundry
    washer: { iconSrc: '/images/washer-icon-custom.svg', isAvailable: true },
    Washer: { iconSrc: '/images/washer-icon-custom.svg', isAvailable: true },
    dryer: { iconSrc: '/images/dryer-icon-custom.svg', isAvailable: true },
    Dryer: { iconSrc: '/images/dryer-icon-custom.svg', isAvailable: true },

    // Features
    'bbq grill': { iconSrc: '/images/bbq-grill-icon.svg', isAvailable: true },
    'indoor fireplace': { iconSrc: '/images/indoor-fireplace-icon.svg', isAvailable: true },
    fireplace: { iconSrc: '/images/indoor-fireplace-icon.svg', isAvailable: true },
    breakfast: { iconSrc: '/images/breakfast-icon.svg', isAvailable: true },
    gym: { iconSrc: '/images/gym-icon.svg', isAvailable: true },
    'ev charger': { iconSrc: '/images/ev-charger-icon.svg', isAvailable: true },
    crib: { iconSrc: '/images/crib-icon.svg', isAvailable: true },
    'king bed': { iconSrc: '/images/king-bed-icon.svg', isAvailable: true },

    // Essentials
    heating: { iconSrc: '/images/heating-icon.svg', isAvailable: true },
    'hair dryer': { iconSrc: '/images/hair-dryer-icon.svg', isAvailable: true },
    iron: { iconSrc: '/images/iron-icon.svg', isAvailable: true },
    'dedicated workspace': { iconSrc: '/images/dedicated-workspace-icon.svg', isAvailable: true },

    // Location features
    waterfront: { iconSrc: '/images/waterfront-icon.svg', isAvailable: true },
    'beach access': { iconSrc: '/images/waterfront-icon.svg', isAvailable: true },
    'ski-in/ski-out': { iconSrc: '/images/ski-in-out-icon.svg', isAvailable: true },

    // Safety (mark as unavailable in "Not included" section)
    'smoke alarm': { iconSrc: '/images/smoke-alarm-icon.svg', isAvailable: false },
    'carbon monoxide alarm': { iconSrc: '/images/carbon-monoxide-icon.svg', isAvailable: false },
    'smoking allowed': { iconSrc: '/images/smoking-allowed-icon.svg', isAvailable: false },

    // Booking features
    'instant book': { iconSrc: '/images/instant-book-icon.svg', isAvailable: true },
  };

  const amenityKey = amenityName.toLowerCase().trim();
  return amenityMap[amenityKey] || { iconSrc: '/images/kitchen-icon.svg', isAvailable: true };
};

const AmenitiesSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo[id!]);

  // Get amenities from property data and map them to display format
  const propertyAmenities = houseInfo?.house_amenities || [];
  const displayAmenities = propertyAmenities.map((amenity: string) => {
    const { iconSrc, isAvailable } = mapMainAmenityToIcon(amenity);
    return {
      iconSrc,
      label: amenity,
      isAvailable,
    };
  });

  // Count total amenities from property data
  const totalAmenities = propertyAmenities.length;

  return (
    <div
      id="Amenities"
      className="py-12 scroll-mt-20 border-t border-grey-dim relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-grey-dim"
    >
      <div className="h-full">
        <h3 className="text-2xl leading-6 font-medium pb-6">What this place offers</h3>
        <div className="flex flex-col 1smm:flex-row 1xz:flex-wrap">
          {displayAmenities.map(({ iconSrc, label, isAvailable }) => (
            <AmenityItem key={label} iconSrc={iconSrc} label={label} isAvailable={isAvailable} />
          ))}
        </div>

        {/* Show amenities button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-6 px-5 py-2.5 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Show all {totalAmenities} amenities
        </button>

        {/* Amenities Modal */}
        <AmenitiesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          amenities={displayAmenities || []}
        />
      </div>
    </div>
  );
};

// House Description Component
const HouseDescription: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo[id!]);

  const fullDescription = houseInfo?.description || '';
  const getTruncatedText = (text: string, limit: number = 250): string => {
    if (text.length <= limit) {
      return text;
    }
    const sub = text.substring(0, limit);
    return sub.substring(0, sub.lastIndexOf(' ')) + '...';
  };

  const previewText = getTruncatedText(fullDescription);

  return (
    <div className="py-8 border-b border-grey-dim">
      <h3 className="text-2xl leading-6 font-medium pb-6">About this place</h3>
      <div className="text-grey space-y-4">
        <p className="whitespace-pre-line">{previewText}</p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-6 px-5 py-2.5 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        Show more
      </button>

      <DescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="About this space"
        fullDescription={fullDescription}
      />
    </div>
  );
};

/* Main House Info Component */
interface HouseInfoProps {
  houseInfo: any;
  isLoading: boolean;
}

const HouseInfo: React.FC<HouseInfoProps> = ({ houseInfo, isLoading }) => {
  return (
    <div className="max-w-[40.83rem] min-w-[100%] 1xz:min-w-[60%] mb-16 flex flex-col">
      {/* Title Section */}
      <div className="1xz:py-8 py-4">
        {/* Property Type */}
        {isLoading ? (
          <LoadingSkeleton width="20rem" height="5" />
        ) : (
          <h1 className="text-xl font-semibold pb-2">
            Entire rental unit in {houseInfo?.city || 'Unknown'}, {houseInfo?.country || 'Unknown'}
          </h1>
        )}

        {/* Details Section */}
        <HouseDetails isLoading={isLoading} />

        {/* Rating Section */}
        <RatingSection isLoading={isLoading} houseInfo={houseInfo} />
      </div>

      {/* Host Section */}
      {isLoading ? (
        <div className="h-20"></div>
      ) : (
        <>
          <Divider />
          <HostSection houseInfo={houseInfo} />
          <Divider />
        </>
      )}

      {/* Room Details Section */}
      <RoomDetails />

      {/* Additional Components */}
      <HouseDescription />
      <BedroomSection houseInfo={houseInfo} />
      <AmenitiesSection />
      <CalendarSection houseInfo={houseInfo} />
    </div>
  );
};

// Component for clearing the date selection
const ClearDatesButton: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div onClick={onClear} className="w-full cursor-pointer flex items-center justify-end pr-4">
    <span className="underline text-sm font-medium">Clear dates</span>
  </div>
);

// Function to format the date range or show default text
const DateRangeDisplay: React.FC<{
  startDate: any;
  endDate: any;
  formattedStartDate: string | null;
  formattedEndDate: string | null;
}> = ({ startDate, endDate, formattedStartDate, formattedEndDate }) => {
  return startDate && endDate ? (
    <DateRange startDate={formattedStartDate} endDate={formattedEndDate} />
  ) : (
    <span className="text-sm font-light text-grey">Add your travel dates for exact pricing</span>
  );
};

const DateRange: React.FC<{ startDate: string | null; endDate: string | null }> = ({
  startDate,
  endDate,
}) => {
  return (
    <>
      <span className="text-sm text-gray-500 font-light">{startDate}</span>
      <span className="flex-center">-</span>
      <span className="text-sm text-gray-500 font-light">{endDate}</span>
    </>
  );
};

const CalendarSection: React.FC<{ houseInfo: any }> = ({ houseInfo }) => {
  const dispatch = useDispatch();

  const startDate = useSelector((store: any) => store.form.selectedStartDate);
  const endDate = useSelector((store: any) => store.form.selectedEndDate);

  // Custom handler for clearing the dates, using Redux dispatch
  const clearSelectedDates = () => {
    dispatch(setSelectedStartDate(null));
    dispatch(setSelectedEndDate(null));
    // Also clear display dates since we disabled automatic updates
    dispatch(setStartDateToShow(''));
    dispatch(setEndDateToShow(''));
  };

  let formatStartDate = startDate && format(new Date(startDate), 'dd MMM yyyy');
  let formatEndDate = endDate && format(new Date(endDate), 'dd MMM yyyy');

  let numOfNights = Math.abs(differenceInCalendarDays(startDate, endDate));

  function calendarTitle() {
    if (!startDate && !endDate) {
      return 'Select check-In date';
    } else if (startDate && !endDate) {
      return 'Select checkout date';
    } else {
      return `${numOfNights} nights in ${houseInfo?.house?.title}`;
    }
  }

  return (
    <div className="1xz:py-12 pt-12">
      <div className="flex flex-col">
        <h3 id="calendar" className="text-2xl leading-6 font-medium">
          {calendarTitle()}
        </h3>

        {/* Date range or prompt to add dates */}
        <div className="h-9 flex pt-2 items-start">
          <div className="flex-center gap-1">
            <DateRangeDisplay
              startDate={startDate}
              endDate={endDate}
              formattedStartDate={formatStartDate}
              formattedEndDate={formatEndDate}
            />
          </div>
        </div>

        {/* Calendar display */}
        <div className="w-full flex pt-4 justify-center items-center">
          <Calendar />
        </div>

        {/* Clear dates button */}
        <ClearDatesButton onClear={clearSelectedDates} />
      </div>
    </div>
  );
};

export default MidMainCont;
