import { api } from '../api/apiClient';

export interface Review {
  id: number;
  property_id: number;
  guest_id: number;
  booking_id: number;
  overall_rating: number;
  cleanliness_rating?: number;
  accuracy_rating?: number;
  communication_rating?: number;
  location_rating?: number;
  check_in_rating?: number;
  value_rating?: number;
  comment: string;
  is_public: boolean;
  created_at: string;
  guest_name?: string;
  guest_avatar?: string;
  host_response?: string;
  host_response_date?: string;
  guest?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture: string;
  };
}

export interface PropertyReviewsSummary {
  property_id: number;
  total_reviews: number;
  average_ratings: {
    overall_rating: number;
    cleanliness_rating: number;
    accuracy_rating: number;
    communication_rating: number;
    location_rating: number;
    check_in_rating: number;
    value_rating: number;
  };
  reviews: Review[];
}

export interface ReviewStats {
  total_reviews: number;
  average_overall_rating: number;
  average_cleanliness_rating: number;
  average_accuracy_rating: number;
  average_communication_rating: number;
  average_location_rating: number;
  average_check_in_rating: number;
  average_value_rating: number;
  rating_distribution: Record<string, number>;
}

class ReviewsService {
  /**
   * Get reviews for a specific property
   */
  async getPropertyReviews(
    propertyId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PropertyReviewsSummary> {
    try {
      return await api.get(`/api/reviews/property/${propertyId}`, { page, limit });
    } catch (error) {
      console.error('Error fetching property reviews:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a property
   */
  async getPropertyReviewStats(propertyId: number): Promise<ReviewStats> {
    try {
      return await api.get(`/api/reviews/property/${propertyId}/stats`);
    } catch (error) {
      console.error('Error fetching property review stats:', error);
      throw error;
    }
  }

  /**
   * Get a single review by ID
   */
  async getReview(reviewId: number): Promise<Review> {
    try {
      return await api.get(`/api/reviews/${reviewId}`);
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  }

  /**
   * Get all reviews with optional filtering
   */
  async getReviews(
    propertyId?: number,
    guestId?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Review[]> {
    try {
      const params: any = { page, limit };

      if (propertyId) {
        params.property_id = propertyId;
      }

      if (guestId) {
        params.guest_id = guestId;
      }

      return await api.get('/reviews', params);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  /**
   * Convert legacy review format to new format for backward compatibility
   */
  convertLegacyReview(legacyReview: any): Review {
    return {
      id: legacyReview.id || Math.random(),
      property_id: legacyReview.property_id || 0,
      guest_id: legacyReview.guest_id || 0,
      booking_id: legacyReview.booking_id || 0,
      overall_rating: legacyReview.rating || legacyReview.overall_rating || 5,
      cleanliness_rating: legacyReview.cleanliness_rating || legacyReview.rating || 5,
      accuracy_rating: legacyReview.accuracy_rating || legacyReview.rating || 5,
      communication_rating: legacyReview.communication_rating || legacyReview.rating || 5,
      location_rating: legacyReview.location_rating || legacyReview.rating || 5,
      check_in_rating: legacyReview.check_in_rating || legacyReview.rating || 5,
      value_rating: legacyReview.value_rating || legacyReview.rating || 5,
      comment: legacyReview.comment || '',
      is_public: legacyReview.is_public !== false,
      created_at: legacyReview.created_at || legacyReview.date || new Date().toISOString(),
      guest_name: legacyReview.guest_name || legacyReview.name,
      guest_avatar: legacyReview.guest_avatar || legacyReview.avatar,
      host_response: legacyReview.host_response,
      host_response_date: legacyReview.host_response_date,
    };
  }
}

export const reviewsService = new ReviewsService();
export default reviewsService;
