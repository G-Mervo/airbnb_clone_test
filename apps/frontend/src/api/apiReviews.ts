/**
 * API service for reviews-related operations
 */
import { api } from "./apiClient";

// Types
export interface ReviewData {
	id?: number;
	property_id: number;
	user_id?: number;
	rating: number;
	comment: string;
	created_at?: string;
	updated_at?: string;
	user?: {
		id: number;
		first_name: string;
		last_name: string;
		profile_picture?: string;
	};
}

/**
 * Reviews API service
 */
const reviewService = {
	/**
	 * Get all reviews
	 */
	getAllReviews: async () => {
		try {
			return await api.get("/reviews");
		} catch (error) {
			console.error("Error fetching reviews:", error);
			throw error;
		}
	},

	/**
	 * Get reviews for a specific property
	 */
	getPropertyReviews: async (propertyId: number) => {
		try {
			return await api.get(`/reviews/property/${propertyId}`);
		} catch (error) {
			console.error(
				`Error fetching reviews for property ${propertyId}:`,
				error
			);
			throw error;
		}
	},

	/**
	 * Get reviews by a specific user
	 */
	getUserReviews: async (userId: number) => {
		try {
			return await api.get(`/reviews/user/${userId}`);
		} catch (error) {
			console.error(`Error fetching reviews by user ${userId}:`, error);
			throw error;
		}
	},

	/**
	 * Create a new review
	 */
	createReview: async (reviewData: ReviewData) => {
		try {
			return await api.post("/reviews/create", reviewData);
		} catch (error) {
			console.error("Error creating review:", error);
			throw error;
		}
	},

	/**
	 * Update an existing review
	 */
	updateReview: async (reviewId: number, reviewData: Partial<ReviewData>) => {
		try {
			return await api.put(`/reviews/${reviewId}`, reviewData);
		} catch (error) {
			console.error(`Error updating review ${reviewId}:`, error);
			throw error;
		}
	},

	/**
	 * Delete a review
	 */
	deleteReview: async (reviewId: number) => {
		try {
			return await api.delete(`/reviews/${reviewId}`);
		} catch (error) {
			console.error(`Error deleting review ${reviewId}:`, error);
			throw error;
		}
	},
};

export default reviewService;
