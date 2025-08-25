import { useState, useEffect, useMemo } from 'react';
import reviewsService, { PropertyReviewsSummary, Review } from '@/services/reviewsService';

export interface ConvertedReview {
  id: number;
  name: string;
  date: string;
  rating: number;
  comment: string;
  avatar: string;
}

const mockReviews: ConvertedReview[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    date: 'March 2024',
    rating: 5,
    comment:
      'Amazing place! Clean, comfortable, and perfectly located. The host was very responsive and helpful.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b87c?w=150',
  },
  {
    id: 2,
    name: 'Michael Chen',
    date: 'February 2024',
    rating: 5,
    comment: 'Great stay! Everything was as described. Would definitely book again.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
];

export const useReviews = (propertyId: string | undefined, houseInfo: any) => {
  const [reviewsData, setReviewsData] = useState<PropertyReviewsSummary | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  useEffect(() => {
    if (!propertyId) return;

    const loadReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const reviews = await reviewsService.getPropertyReviews(parseInt(propertyId), 1, 6);
        setReviewsData(reviews);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviewsData(null);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadReviews();
  }, [propertyId]);

  const propertyReviews = useMemo<Review[]>(
    () => reviewsData?.reviews || houseInfo?.reviews || [],
    [reviewsData, houseInfo],
  );

  const totalReviews = useMemo<number>(
    () =>
      reviewsData?.total_reviews ||
      houseInfo?.rating_count ||
      propertyReviews.length ||
      mockReviews.length,
    [reviewsData, houseInfo, propertyReviews],
  );

  const overallRating = useMemo<number>(
    () =>
      reviewsData?.average_ratings?.overall_rating ||
      houseInfo?.house_rating ||
      houseInfo?.rating ||
      4.8,
    [reviewsData, houseInfo],
  );

  const ratings = useMemo(() => {
    if (reviewsData?.average_ratings) {
      return {
        cleanliness: reviewsData.average_ratings.cleanliness_rating,
        accuracy: reviewsData.average_ratings.accuracy_rating,
        checkin: reviewsData.average_ratings.check_in_rating,
        communication: reviewsData.average_ratings.communication_rating,
        location: reviewsData.average_ratings.location_rating,
        value: reviewsData.average_ratings.value_rating,
      };
    }

    const variation = 0.1;
    return {
      cleanliness: Math.min(5.0, overallRating + Math.random() * variation),
      accuracy: Math.min(5.0, overallRating + Math.random() * variation),
      checkin: Math.min(5.0, overallRating + Math.random() * variation),
      communication: Math.min(5.0, overallRating + Math.random() * variation),
      location: Math.max(4.0, overallRating - Math.random() * variation),
      value: Math.max(4.0, overallRating - Math.random() * variation),
    };
  }, [reviewsData, overallRating]);

  const ratingDistribution = useMemo<number[]>(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      if (overallRating >= 4.5) {
        return star === 5 ? 80 : star === 4 ? 15 : star === 3 ? 3 : star === 2 ? 1 : 1;
      } else if (overallRating >= 4.0) {
        return star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2;
      } else {
        return star === 5 ? 40 : star === 4 ? 30 : star === 3 ? 20 : star === 2 ? 7 : 3;
      }
    });
  }, [overallRating]);

  const convertedReviewsForDisplay = useMemo<ConvertedReview[]>(() => {
    if (reviewsData && reviewsData.reviews.length > 0) {
      return reviewsData.reviews.map((review) => ({
        id: review.id,
        name:
          review.guest_name ||
          `${review.guest?.first_name || ''} ${review.guest?.last_name || ''}`.trim() ||
          'Anonymous',
        date: new Date(review.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        rating: Math.round(review.overall_rating),
        comment: review.comment,
        avatar:
          review.guest_avatar ||
          review.guest?.profile_picture ||
          `https://i.pravatar.cc/150?u=${review.id}`, // Fallback avatar
      }));
    }
    return (houseInfo?.reviews as ConvertedReview[]) || mockReviews;
  }, [reviewsData, houseInfo]);

  return {
    isLoadingReviews,
    isReviewsOpen,
    setIsReviewsOpen,
    propertyReviews: propertyReviews.length > 0 ? propertyReviews : mockReviews,
    overallRating,
    totalReviews,
    ratings,
    ratingDistribution,
    convertedReviewsForDisplay,
  };
};
