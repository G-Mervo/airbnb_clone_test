import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { Star } from 'lucide-react';
import CustomerReviews from './CustomerReviews';
import ReviewsModal from './ReviewsModal';
import { useReviews } from '../../hooks/useReviews';
import houseIcon from '../../asset/house.svg';
import star from '../../asset/Icons_svg/star.svg';
import spray from '../../asset/Icons_svg/Spray.svg';
import checkMark from '../../asset/Icons_svg/accuracy.svg';
import key from '../../asset/Icons_svg/key.svg';
import msg from '../../asset/Icons_svg/msg.svg';
import location from '../../asset/Icons_svg/location.svg';
import value from '../../asset/Icons_svg/value.svg';

const BottomMainCont: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo[id!]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const {
    isReviewsOpen,
    setIsReviewsOpen,
    propertyReviews,
    overallRating,
    totalReviews,
    ratings,
    ratingDistribution,
    convertedReviewsForDisplay,
  } = useReviews(id, houseInfo);

  useEffect(() => {
    if (!houseInfo || !mapRef.current || mapInstanceRef.current) return;

    const lat = houseInfo.location?.lat || 40.7128;
    const lng = houseInfo.location?.lng || -74.006;

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
      }).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      const customIcon = L.divIcon({
        html: `<div class="property-marker"><div class="marker-radar"></div><div class="marker-container"><img src="${houseIcon}" class="house-icon" alt="Property location" /></div></div>`,
        className: 'custom-property-marker',
        iconSize: [120, 120],
        iconAnchor: [60, 60],
      });
      L.marker([lat, lng], { icon: customIcon }).addTo(map);
      mapInstanceRef.current = map;
      const style = document.createElement('style');
      style.textContent = `
        .custom-property-marker { background: transparent !important; border: none !important; }
        .property-marker { position: relative; display: flex; align-items: center; justify-content: center; width: 120px; height: 120px; }
        .marker-radar { position: absolute; width: 120px; height: 120px; background: rgba(0, 0, 0, 0.15); border-radius: 50%; z-index: 1; }
        .marker-container { position: relative; width: 60px; height: 60px; background: #000000; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.4); z-index: 2; }
        .house-icon { width: 32px; height: 32px; filter: invert(1); }
      `;
      document.head.appendChild(style);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [houseInfo]);

  return (
    <div className="max-w-7xl w-full px-5 1xz:px-10 1lg:px-20">
      <div className="py-8">
        {/* Reviews Section */}
        <div id="reviews" className="mb-12">
          {/* Detailed Rating Section */}
          <div className="mb-8 pb-12 border-b border-gray-200">
            {/* Star Rating Header */}
            <div className="h-8 mb-10 gap-x-2 flex items-center w-full">
              <div className="flex items-center gap-x-2">
                <img className="w-6 h-6" src={star} alt="star" />
                <span className="text-2xl font-medium">{overallRating.toFixed(1)}</span>
              </div>
              <span className="flex items-center justify-center">
                <span className="w-1 h-1 bg-current rounded-full"></span>
              </span>
              <span className="text-2xl font-medium">{totalReviews} reviews</span>
            </div>

            {/* Rating Breakdown Grid */}
            <div className="w-full hidden sm:grid grid-cols-7 h-[6.90rem]">
              {/* Overall Rating Column */}
              <div className="border-r border-gray-300 flex justify-center h-full">
                <div className="w-full mr-8 h-full">
                  <div className="flex flex-col justify-between">
                    <h3 className="md:text-sm text-xs text-nowrap font-medium mb-2">
                      Overall rating
                    </h3>
                    <ol>
                      {[5, 4, 3, 2, 1].map((rating, index) => (
                        <li key={index} className="flex justify-between gap-x-2 items-center">
                          <span className="text-xs">{rating}</span>
                          <div className="w-full h-1 bg-gray-300">
                            <div
                              className="h-full bg-black"
                              style={{ width: `${ratingDistribution[index]}%` }}
                            ></div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Individual Rating Categories */}
              {[
                { title: 'Cleanliness', score: ratings.cleanliness.toFixed(1), icon: spray },
                { title: 'Accuracy', score: ratings.accuracy.toFixed(1), icon: checkMark },
                { title: 'Check-in', score: ratings.checkin.toFixed(1), icon: key },
                { title: 'Communication', score: ratings.communication.toFixed(1), icon: msg },
                { title: 'Location', score: ratings.location.toFixed(1), icon: location },
                { title: 'Value', score: ratings.value.toFixed(1), icon: value },
              ].map((item, index) => (
                <div
                  key={index}
                  className="border-r border-gray-300 flex justify-center h-full last:border-r-0"
                >
                  <div className="h-[6.45rem]">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <h3 className="md:text-sm text-xs font-medium">{item.title}</h3>
                        <span className="md:text-lg text-sm font-medium">{item.score}</span>
                      </div>
                      <img className="md:h-8 md:w-8 h-6 w-6" src={item.icon} alt={item.title} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CustomerReviews reviews={convertedReviewsForDisplay} />

          {/* Show all reviews button */}
          <div className="mt-6">
            <button
              onClick={() => setIsReviewsOpen(true)}
              className="mt-6 px-5 py-2.5 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Show all {totalReviews} reviews
            </button>
          </div>

          {/* Reviews Modal */}
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

        {/* Location Section */}
        <div id="location" className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Where you'll be</h2>
          <div className="relative bg-gray-100 h-80 rounded-xl overflow-hidden mb-4 z-0">
            <div ref={mapRef} className="w-full h-full" />
          </div>
          <div className="text-gray-700">
            <h3 className="font-semibold mb-2">
              {houseInfo?.city}, {houseInfo?.state || houseInfo?.country}
            </h3>
            <p>
              Great location with easy access to local attractions, restaurants, and transportation.
              The area is known for its vibrant culture and beautiful scenery.
            </p>
            {houseInfo?.location?.address && (
              <p className="text-sm text-gray-600 mt-2">{houseInfo.location.address}</p>
            )}
          </div>
        </div>

        {/* Host Information */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex px-0 flex-col lg:flex-row gap-y-10 py-10 gap-x-20 w-full relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-gray-200">
            {/* Host Card Section */}
            <div className="max-w-[24rem] w-full max-h-80 h-full">
              <div className="mb-6">
                <h1 className="text-[25px] font-[460]">Meet your host</h1>
              </div>

              {/* Host Info Card */}
              <div className="py-5 shadow-2xl rounded-3xl grid grid-cols-3">
                {/* Host Image & Name Section */}
                <div className="col-span-2 w-full grid grid-cols-1">
                  <div className="w-full flex justify-center items-end">
                    <div className="w-28 h-28 bg-gray-300 rounded-full flex items-center justify-center">
                      {houseInfo?.host?.image ? (
                        <img
                          className="w-28 h-28 object-cover rounded-full"
                          src={houseInfo.host.image}
                          alt="host-image"
                        />
                      ) : (
                        <span className="text-3xl font-semibold text-gray-600">
                          {houseInfo?.host?.name?.charAt(0) || 'H'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full justify-start pt-2 flex-col items-center">
                    <h1 className="text-[32px] leading-9 tracking-wide font-[600] w-[80%] max-w-full overflow-hidden text-center text-ellipsis whitespace-nowrap">
                      {houseInfo?.host?.name || 'Host Name'}
                    </h1>
                    <span className="leading-4 pb-2 text-sm font-medium">Host</span>
                  </div>
                </div>

                {/* Host Stats Section */}
                <div className="col-start-3 items-center justify-items-end grid grid-cols-1 col-end-4">
                  <div className="w-24 flex flex-col justify-between h-44">
                    {/* Reviews */}
                    <div className="flex items-start justify-start flex-col">
                      <div className="flex gap-x-1">
                        <span className="text-2xl leading-6 font-bold">152</span>
                      </div>
                      <span className="text-[10px] font-medium leading-4 pt-1">Reviews</span>
                    </div>
                    <div className="h-[1px] bg-gray-300"></div>

                    {/* Rating */}
                    <div className="flex items-start justify-start flex-col">
                      <div className="flex gap-x-1">
                        <span className="text-2xl leading-6 font-bold">4.9</span>
                        <div className="flex gap-[2px] items-center">
                          <Star className="w-4 h-4 fill-current text-black" />
                        </div>
                      </div>
                      <span className="text-[10px] font-medium leading-4 pt-1">Rating</span>
                    </div>
                    <div className="h-[1px] bg-gray-300"></div>

                    {/* Years Hosting */}
                    <div className="flex items-start justify-start flex-col">
                      <div className="flex gap-x-1">
                        <span className="text-2xl leading-6 font-bold">4</span>
                      </div>
                      <span className="text-[10px] font-medium leading-4 pt-1">Years hosting</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Host Description Section */}
            <div className="flex flex-col gap-y-5 justify-between max-h-[24rem] h-full">
              {/* Host Description */}
              <div className="w-full flex flex-col justify-between pt-14">
                <span className="block text-lg font-medium">
                  About {houseInfo?.host?.name || 'the Host'}
                </span>
                <span className="font-light leading-5 text-[15px] whitespace-pre-wrap w-full h-full max-h-[6rem] overflow-scroll pt-2">
                  Welcome! I'm passionate about providing great experiences for my guests. I'm
                  always available to help make your stay memorable.
                </span>
              </div>

              {/* Host Details */}
              <div className="w-full pt-5 h-20 flex flex-col justify-between">
                <span className="block text-lg font-medium">Host details</span>
                <div className="w-full h-10 flex flex-col justify-center">
                  <span className="block leading-5 text-[15px] font-light">
                    Response rate: 100%
                  </span>
                  <span className="block leading-5 text-[15px] font-light">
                    Responds within an hour
                  </span>
                </div>
              </div>

              {/* Message Host Button */}
              <div className="w-full pb-2 h-14">
                <div className="w-40 flex items-center justify-center h-full bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                  Message Host
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  );
};

export default BottomMainCont;
