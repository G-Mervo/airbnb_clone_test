// @ts-nocheck
import icon from '../../asset/airbnb.svg';
import globe from '../../asset/globe.svg';
import MainForm from './Form/MainForm';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import MobileForm from './Form/MobileForm';
import UserDashboard from './UserDashboard';
import AuthenticationModal from './AuthenticationModal';
import MinimizedSearchForm from './MinimizedSearchForm';
import DynamicFilterModal from '../Main/FilterModal';
import SearchPageHeaderSkeleton from './SearchPageHeaderSkeleton';

function Header({ headerRef, showSkeleton = false }) {
  const location = useLocation();

  // Determine if the user is on specific pages based on the URL path
  const isHouseDetailPage = location.pathname.includes('/house/');
  const isWishListPage = location.pathname.includes('/wishlist');
  const isTripsPage = location.pathname.includes('trips');
  const isSignInPage = location.pathname.includes('/login');
  const isProfilePage = location.pathname.includes('/account-settings');
  const isSearchPage = location.pathname.includes('/search');

  // Select which slice of the Redux store to use
  const currentSlice = isHouseDetailPage ? 'houseSlice' : 'app';
  const startScroll = useSelector((store: any) => store[currentSlice]?.startScroll);
  const minimizeHeader = useSelector((store: any) => store.app.minimize);
  const userData = useSelector((store: any) => store.app.userData);

  // Generate class names for the "after" element depending on page state and scroll position
  const afterClass = generateAfterClass({
    startScroll,
    minimizeHeader,
    isWishListPage,
    isTripsPage,
    isSignInPage,
    isProfilePage,
    isSearchPage,
  });

  return (
    <div
      id="header"
      className={`w-full py-2 1xz:py-0 relative z-[999999] flex flex-col 1smd:items-center items-start justify-center transition-all duration-300 ease-in-out ${afterClass} ${
        startScroll || minimizeHeader ? 'backdrop-blur-md bg-white/95' : 'bg-white border-b'
      }`}
    >
      <div
        className={`${
          isHouseDetailPage || isSearchPage
            ? 'bg-white'
            : 'bg-gradient-to-b from-[#fcfcfc] to-[#f9f9f9]'
        } grid grid-cols-${
          isWishListPage || isTripsPage || isSignInPage || isProfilePage
            ? '2'
            : isSearchPage
            ? '3'
            : '3'
        } ${
          isHouseDetailPage ? 'max-w-7xl w-full px-10 1lg:px-20' : 'w-full 1xl:px-16 px-8'
        } transition-all duration-300 ease-in-out h-24 items-center ${
          startScroll || minimizeHeader ? 'border-b border-gray-50' : ''
        }`}
      >
        <LogoSection />

        {!isTripsPage && !isSignInPage && !isWishListPage && !isProfilePage && !isSearchPage && (
          <CenterButtons startScroll={startScroll} minimizeHeader={minimizeHeader} />
        )}

        {/* Show minimized search form in center column on search page */}
        {isSearchPage &&
          (showSkeleton ? (
            <SearchPageHeaderSkeleton />
          ) : (
            <div className="flex items-center justify-center h-20 space-x-4">
              <MinimizedSearchForm />
              <DynamicFilterModal />
            </div>
          ))}

        <div className="h-20 1xz:flex hidden items-center justify-end gap-2">
          <button className="text-[14px] h-[2.5rem] cursor-pointer hidden 1smm:flex items-center justify-center rounded-full hover:bg-[#e6e6e6] text-nowrap px-4 font-semibold transition-all duration-200 ease-out hover:shadow-sm">
            Become a host
          </button>
          {!userData && (
            <button className="min-h-11 min-w-11 cursor-pointer 1smm:flex items-center justify-center rounded-full bg-[#e6e6e6] hover:bg-gray-100 transition-all duration-200 ease-out hover:shadow-sm">
              <img className="h-[16px] w-[16px]" src={globe} alt="Language" />
            </button>
          )}
          {userData && (
            <img
              className="h-10 w-10 rounded-full cursor-pointer hover:opacity-90 transition-all duration-200 ease-out"
              src={userData.user_metadata.avatarUrl || globe}
              alt="Avatar"
            />
          )}
          <UserDashboard />
        </div>

        <AuthenticationModal />
      </div>

      <MobileFormSection />

      {(!isWishListPage && !isSignInPage && !isTripsPage && !isProfilePage && !isSearchPage) ||
      isHouseDetailPage ||
      (isSearchPage && minimizeHeader) ? (
        <div
          className={`w-full ${isHouseDetailPage || isSearchPage ? 'bg-white' : 'bg-[#f9f9f9]'}`}
        >
          <MainFormSection headerRef={headerRef} showSkeleton={showSkeleton && isHouseDetailPage} />
        </div>
      ) : null}
    </div>
  );
}

// Helper Components

// Renders the Airbnb logo
function LogoSection() {
  return (
    <div className="min-w-[102px]">
      <a href="/" className="block transition-all duration-200 ease-out hover:scale-105">
        <div className="1xz:flex hidden h-20 items-center">
          <img className="w-[102px] h-[80px]" src={icon} alt="Airbnb Logo" />
        </div>
      </a>
    </div>
  );
}

// Renders the center buttons (Stays and Experiences)
function CenterButtons({ startScroll, minimizeHeader }) {
  const translateClasses = startScroll
    ? '1sm:translate-y-12 1md:translate-y-0 opacity-100'
    : minimizeHeader
    ? 'translate-y-0 opacity-100'
    : '-translate-y-20 1md:translate-x-0 1sm:-translate-x-56 opacity-90';

  const items = [
    {
      label: 'Homes',
      img: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240',
      active: true,
    },
    {
      label: 'Experiences',
      img: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/e47ab655-027b-4679-b2e6-df1c99a5c33d.png?im_w=240',
      active: false,
    },
    {
      label: 'Services',
      img: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/3d67e9a9-520a-49ee-b439-7b3a75ea814d.png?im_w=240',
      active: false,
    },
  ];

  return (
    <div
      className={`flex h-20 transition-all duration-500 ease-in-out ${translateClasses} justify-center items-end`}
    >
      <nav className="hidden 1smd:flex items-center">
        <div className="flex items-center gap-2 px-4 py-2" role="tablist">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="tab"
              aria-selected={it.active ? 'true' : 'false'}
              className={`flex items-center gap-0 px-3 py-2 transition-all duration-200 ease-out relative group rounded-full ${
                it.active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div
                className={`relative flex items-center justify-center transition-all duration-200 ease-out ${
                  !it.active ? 'hover:scale-110 active:scale-95' : ''
                }`}
                style={{
                  width: '64px',
                  height: '64px',
                  marginRight: '-2px',
                  filter: it.active ? 'none' : 'grayscale(20%)',
                  transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                <img
                  src={it.img}
                  alt={it.label}
                  className="object-contain"
                  style={{ width: '64px', height: '64px' }}
                />
              </div>
              <div className="relative inline-block">
                <span
                  className="leading-none text-[14px]"
                  style={{
                    fontFamily:
                      '"Airbnb Cereal VF", Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif',
                    fontWeight: it.active ? 600 : 400,
                    lineHeight: '18px',
                    color: it.active ? '#222222' : '#6A6A6A',
                  }}
                >
                  {it.label}
                </span>
                {it.active && (
                  <div
                    className="absolute h-[3px] bg-gray-900 rounded-full"
                    style={{
                      left: '-62px', // Account for icon width (64px) minus margin (-2px)
                      right: '0',
                      bottom: '-16px', // Position slightly below the text baseline
                    }}
                  ></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// Renders the mobile form if the screen size is small
function MobileFormSection() {
  return (
    <div className="1xz:hidden w-full absolute top-0 flex">
      <MobileForm />
    </div>
  );
}

// Renders the main form component if it's not on specific pages
function MainFormSection({ headerRef, showSkeleton = false }) {
  return (
    <div className="w-full 1smd:w-auto hidden 1xz:flex 1smd:block items-center justify-start 1smd:pl-0 pl-[16rem]">
      <MainForm headerRef={headerRef} showSkeleton={showSkeleton} />
    </div>
  );
}

// Helper Functions

/**
 * Generates the class for the after element based on scroll position and page state
 */
function generateAfterClass({
  startScroll,
  minimizeHeader,
  isWishListPage,
  isTripsPage,
  isSignInPage,
  isProfilePage,
  isSearchPage,
}) {
  // We no longer use the ::after pseudo-element for the divider.
  // The divider is now a real border on the inner grid container so it
  // always aligns with the header bar and never bleeds below it.
  return 'after:hidden';
}

export default Header;
