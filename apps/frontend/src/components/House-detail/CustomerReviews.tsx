import React, { useEffect, useState } from 'react';
import star from '../../asset/Icons_svg/star.svg';
import { dataService } from '../../services/dataService';

interface Review {
  id: number;
  name: string;
  date: string;
  rating: number;
  comment: string;
  avatar: string;
  yearsOnAirbnb?: number;
}

interface ReviewsConfig {
  defaultReviews: Review[];
  fallbackAvatars: string[];
}

interface ReviewCardProps {
  review: Review;
  index: number;
  totalCards: number;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, index, totalCards }) => {
  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <img className="h-auto w-auto" key={i} src={star} alt="star" />
    ));
  };

  return (
    <div
      className={` ${
        index < totalCards - 2 ? 'mb-10' : ''
      } mb-10 overflow-hidden 1smm:w-auto w-[calc(100vw-5rem)]   1xs:w-[calc(100vw-8rem)]   min-h-[6.62rem] 1smm:shadow-none rounded-xl mt-2 shadow-reviewShadow bg-white  p-5 1smm:p-0  h-[90%] `}
    >
      <div className="h-[4.8rem] flex flex-col justify-between mb-1">
        <div className="h-12 gap-2 flex items-center ">
          <img className="h-12 rounded-full object-cover w-12" src={review.avatar} alt="reviewer" />
          <div className="h-10 flex flex-col justify-center box-border">
            <span className="font-medium">{review.name}</span>
            <span className="text-sm font-light">{review.yearsOnAirbnb || 7} years on Airbnb</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex h-[10px] w-12">{renderStars()}</div>
          <span className="mx-2 flex items-center justify-center">
            <span className="w-[2px] h-[2px] bg-current rounded-full"></span>
          </span>
          <span className="text-sm">{review.date}</span>
        </div>
      </div>
      <div className="w-full h-auto overflow-scroll">
        <span className="h-full overflow-hidden">{review.comment}</span>
      </div>
    </div>
  );
};

interface CustomerReviewsProps {
  showReviewSection?: boolean;
  reviews?: Review[];
  roomId?: string;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  showReviewSection,
  reviews: propReviews,
  roomId,
}) => {
  const [reviewsConfig, setReviewsConfig] = useState<ReviewsConfig | null>(null);
  const [displayReviews, setDisplayReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviewsData = async () => {
      try {
        setLoading(true);

        // Load reviews config for fallback data
        const config = await dataService.loadPublicJsonData<ReviewsConfig>(
          '/data/reviews-config.json',
        );
        setReviewsConfig(config);

        // If we have specific reviews passed as props, use them
        if (propReviews && propReviews.length > 0) {
          setDisplayReviews(propReviews.slice(0, 4)); // Show max 4 reviews
        }
        // If we have a roomId, try to get reviews from room data
        else if (roomId) {
          const roomsData = await dataService.getRoomsData();
          const room = roomsData.find((r) => r.id === roomId);
          if (room && room.reviews && room.reviews.length > 0) {
            // Map room reviews to our Review interface - handle both old and new format
            const mappedReviews = room.reviews.slice(0, 4).map((review: any, index: number) => ({
              id: parseInt(review.id) || index + 1,
              name: review.name || review.user_name || 'Guest',
              date: review.date || 'Recent',
              rating: review.rating || 5,
              comment: review.comment || 'Great place!',
              avatar:
                review.avatar ||
                review.user_image ||
                config.fallbackAvatars[index % config.fallbackAvatars.length],
              yearsOnAirbnb: Math.floor(Math.random() * 5) + 2, // Random years between 2-7
            }));
            setDisplayReviews(mappedReviews);
          } else {
            // Use default reviews as fallback
            setDisplayReviews(config.defaultReviews);
          }
        }
        // Use default reviews as final fallback
        else {
          setDisplayReviews(config.defaultReviews);
        }
      } catch (error) {
        console.error('Failed to load reviews data:', error);
        // Minimal fallback data
        setDisplayReviews([
          {
            id: 1,
            name: 'Guest',
            date: 'Recent',
            rating: 5,
            comment: 'Great place to stay!',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            yearsOnAirbnb: 3,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadReviewsData();
  }, [propReviews, roomId]);

  if (loading) {
    return (
      <div className="w-full">
        {!showReviewSection && <h1 className="text-2xl font-medium pl-5 pt-2">Customer reviews</h1>}
        <div className="pt-3 px-5">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const reviewCount = Math.min(displayReviews.length, 4);

  return (
    <div className="w-full">
      {!showReviewSection && <h1 className="text-2xl font-medium pl-5 pt-2">Customer reviews</h1>}
      <div
        style={{
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
        }}
        className={`${
          showReviewSection ? '' : 'pt-3'
        } 1smm:grid flex overflow-x-auto hide-scrollbar overflow-y-hidden  px-5 1smm:px-0 gap-x-5 1smm:w-full   1smm:grid-cols-2 `}
      >
        {Array.from({ length: reviewCount }).map((_, index) => (
          <div
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0,
              scrollSnapStop: 'always',
            }}
            key={displayReviews[index]?.id || index}
            className={`min-h-[10rem] pl-5  1smm:mr-[5.91rem] `}
          >
            <ReviewCard review={displayReviews[index]} index={index} totalCards={reviewCount} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerReviews;
