"""
Review service for handling review-related operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from .base_service import BaseService, ValidationError, NotFoundError
from utils.data_manager import reviews_manager, users_manager, properties_manager, bookings_manager
from schemas.review import PropertyReviewsSummary


class ReviewService(BaseService):

    def get_reviews(self, property_id: int=None, guest_id: int=None, page: int=1, limit: int=10) -> list:
        """
        Get all reviews with optional filtering by property_id or guest_id, paginated.
        """
        reviews = self.get_all()
        if property_id is not None:
            reviews = [r for r in reviews if r.get("property_id") == property_id]
        if guest_id is not None:
            reviews = [r for r in reviews if r.get("guest_id") == guest_id]
        # Sort by created_at descending
        reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)
        start = (page - 1) * limit
        end = start + limit
        return reviews[start:end]

    """Service for review operations including creation, moderation, and analytics"""

    def __init__(self):
        super().__init__(reviews_manager, "review")
        self.users_manager = users_manager
        self.properties_manager = properties_manager
        self.bookings_manager = bookings_manager

    def get_primary_file(self) -> str:
        return "property_reviews.json"

    def validate_data(self, data: Dict[str, Any], operation: str="create") -> Dict[str, Any]:
        """
        Validate review data

        Args:
            data: Review data to validate
            operation: Operation type ('create' or 'update')

        Returns:
            Validated data
        """
        validated_data = super().validate_data(data, operation)

        if operation == "create":
            # Required fields
            required_fields = ["property_id", "guest_id", "booking_id", "overall_rating", "comment"]
            for field in required_fields:
                if field not in validated_data:
                    raise ValidationError(f"Field '{field}' is required")

            # Validate property exists
            property_id = validated_data["property_id"]
            if not self.properties_manager.find_by_id("rooms.json", property_id):
                raise ValidationError(f"Property with ID {property_id} not found")

            # Validate user exists
            guest_id = validated_data["guest_id"]
            if not self.users_manager.find_by_id("users.json", guest_id):
                raise ValidationError(f"User with ID {guest_id} not found")

            # Validate booking exists and belongs to user
            booking_id = validated_data["booking_id"]
            booking = self.bookings_manager.find_by_id("bookings.json", booking_id)
            if not booking:
                raise ValidationError(f"Booking with ID {booking_id} not found")

            if booking["guest_id"] != guest_id:
                raise ValidationError("You can only review your own bookings")

            if booking["property_id"] != property_id:
                raise ValidationError("Booking does not match the property")

            if booking.get("status") != "completed":
                raise ValidationError("You can only review completed bookings")

            # Check if review already exists for this booking
            existing_reviews = self.find_by_field("booking_id", booking_id)
            if existing_reviews:
                raise ValidationError("Review already exists for this booking")

            # Validate ratings
            rating_fields = ["overall_rating", "cleanliness_rating", "accuracy_rating",
                           "communication_rating", "location_rating", "check_in_rating", "value_rating"]

            for field in rating_fields:
                if field in validated_data:
                    rating = validated_data[field]
                    if not isinstance(rating, int) or rating < 1 or rating > 5:
                        raise ValidationError(f"{field} must be an integer between 1 and 5")

            # Validate comment length
            comment = validated_data.get("comment", "")
            if len(comment) < 10:
                raise ValidationError("Comment must be at least 10 characters long")
            if len(comment) > 1000:
                raise ValidationError("Comment cannot exceed 1000 characters")

            # Set default values
            validated_data["is_public"] = validated_data.get("is_public", True)

        return validated_data

    def create_review(self, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new review

        Args:
            review_data: Review data

        Returns:
            Created review with guest information
        """
        created_review = self.create(review_data)
        # Enrich with guest information
        enriched_review = self.enrich_review_with_guest(created_review)
        return enriched_review

    def get_property_reviews(self, property_id: int, page: int=0, limit: int=10,
                           public_only: bool=True) -> List[Dict[str, Any]]:
        """
        Get reviews for a specific property

        Args:
            property_id: Property ID
            page: Pagination page
            limit: Pagination limit
            public_only: Whether to include only public reviews

        Returns:
            List of reviews with guest information
        """
        try:
            reviews = self.find_by_field("property_id", property_id)

            if public_only:
                reviews = [r for r in reviews if r.get("is_public", True)]

            # Sort by created_at descending
            sorted_reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)
            skip = (page - 1) * limit
            # Apply pagination
            end_idx = min(skip + limit, len(sorted_reviews))
            paginated_reviews = sorted_reviews[skip:end_idx]

            # Enrich with guest information
            enriched_reviews = []
            for review in paginated_reviews:
                enriched_review = self.enrich_review_with_guest(review)
                enriched_reviews.append(enriched_review)

            return enriched_reviews

        except Exception as e:
            self.logger.error(f"Error getting property reviews: {e}")
            return []

    def get_user_reviews(self, user_id: int, skip: int=0, limit: int=10) -> List[Dict[str, Any]]:
        """
        Get reviews written by a specific user

        Args:
            user_id: User ID
            skip: Pagination skip
            limit: Pagination limit

        Returns:
            List of user's reviews with property information
        """
        try:
            reviews = self.find_by_field("guest_id", user_id)

            # Sort by created_at descending
            sorted_reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)

            # Apply pagination
            end_idx = min(skip + limit, len(sorted_reviews))
            paginated_reviews = sorted_reviews[skip:end_idx]

            # Enrich with property information
            enriched_reviews = []
            for review in paginated_reviews:
                enriched_review = self._enrich_review_with_property(review)
                enriched_reviews.append(enriched_review)

            return enriched_reviews

        except Exception as e:
            self.logger.error(f"Error getting user reviews: {e}")
            return []

    def get_review_statistics(self, property_id: int) -> Dict[str, Any]:
        """
        Get comprehensive review statistics for a property

        Args:
            property_id: Property ID

        Returns:
            Review statistics
        """
        try:
            reviews = self.find_by_field("property_id", property_id)
            public_reviews = [r for r in reviews if r.get("is_public", True)]

            if not public_reviews:
                return {
                    "total_reviews": 0,
                    "average_rating": 0,
                    "rating_distribution": {},
                    "category_averages": {},
                    "recent_trend": "stable"
                }

            # Calculate averages
            total_reviews = len(public_reviews)
            overall_ratings = [r.get("overall_rating", 0) for r in public_reviews]
            average_rating = sum(overall_ratings) / total_reviews

            # Rating distribution
            rating_distribution = {}
            for rating in range(1, 6):
                count = len([r for r in overall_ratings if r == rating])
                rating_distribution[str(rating)] = count

            # Category averages
            categories = ["cleanliness_rating", "accuracy_rating", "communication_rating",
                         "location_rating", "check_in_rating", "value_rating"]

            category_averages = {}
            for category in categories:
                ratings = [r.get(category, 0) for r in public_reviews if r.get(category)]
                if ratings:
                    category_averages[category] = round(sum(ratings) / len(ratings), 2)

            # Recent trend (last 10 reviews vs previous 10)
            recent_trend = self._calculate_rating_trend(public_reviews)

            return {
                "total_reviews": total_reviews,
                "average_rating": round(average_rating, 2),
                "rating_distribution": rating_distribution,
                "category_averages": category_averages,
                "recent_trend": recent_trend
            }

        except Exception as e:
            self.logger.error(f"Error getting review statistics: {e}")
            return {}

    def _calculate_average_ratings(self, reviews: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate average ratings from a list of reviews"""
        if not reviews:
            return {
                "overall_rating": 0,
                "cleanliness_rating": 0,
                "accuracy_rating": 0,
                "communication_rating": 0,
                "location_rating": 0,
                "check_in_rating": 0,
                "value_rating": 0
            }

        rating_fields = [
            "overall_rating", "cleanliness_rating", "accuracy_rating",
            "communication_rating", "location_rating", "check_in_rating", "value_rating"
        ]

        averages = {}
        for field in rating_fields:
            total = sum(r.get(field, 0) for r in reviews)
            averages[field] = round(total / len(reviews), 2)

        return averages

    def add_host_response(self, review_id: int, response: str, host_id: int) -> Dict[str, Any]:
        """
        Add host response to a review

        Args:
            review_id: Review ID
            response: Host response text
            host_id: Host user ID

        Returns:
            Updated review
        """
        review = self.get_by_id(review_id)

        # Validate host can respond (would check property ownership in real app)
        if review.get("host_response"):
            raise ValidationError("Host response already exists")

        if len(response.strip()) < 10:
            raise ValidationError("Host response must be at least 10 characters")

        update_data = {
            "host_response": response.strip(),
            "host_response_date": datetime.now().isoformat()
        }

        return self.update(review_id, update_data)

    def flag_review(self, review_id: int, reason: str, reporter_id: int) -> bool:
        """
        Flag a review for moderation

        Args:
            review_id: Review ID
            reason: Reason for flagging
            reporter_id: ID of user reporting

        Returns:
            True if flagged successfully
        """
        review = self.get_by_id(review_id)

        flag_data = {
            "flagged": True,
            "flag_reason": reason,
            "flagged_by": reporter_id,
            "flagged_at": datetime.now().isoformat()
        }

        self.update(review_id, flag_data)
        self.logger.info(f"Review {review_id} flagged by user {reporter_id}: {reason}")
        return True

    def enrich_review_with_guest(self, review: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich review with guest information"""
        enriched_review = review.copy()
        try:
            guest_id = review.get("guest_id")
            if guest_id:
                guest = self.users_manager.find_by_id("users.json", guest_id)
                if guest:
                    enriched_review["guest"] = {
                        "id": guest["id"],
                        "first_name": guest["first_name"],
                        "last_name": guest["last_name"],
                        "avatar": guest.get("avatar")
                    }
        except Exception as e:
            self.logger.error(f"Error enriching review with guest: {e}")
        return enriched_review

    def _enrich_review_with_property(self, review: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich review with property information"""
        enriched_review = review.copy()

        try:
            property_id = review.get("property_id")
            if property_id:
                property_data = self.properties_manager.find_by_id("rooms.json", property_id)
                if property_data:
                    enriched_review["property"] = {
                        "id": property_data["id"],
                        "title": property_data["title"],
                        "city": property_data["city"],
                        "image_url": property_data.get("image_url")
                    }
        except Exception as e:
            self.logger.error(f"Error enriching review with property: {e}")

        return enriched_review

    def _calculate_rating_trend(self, reviews: List[Dict[str, Any]]) -> str:
        """Calculate rating trend based on recent reviews"""
        if len(reviews) < 10:
            return "insufficient_data"

        # Sort by date
        sorted_reviews = sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)

        recent_10 = sorted_reviews[:10]
        previous_10 = sorted_reviews[10:20] if len(sorted_reviews) >= 20 else sorted_reviews[10:]

        if not previous_10:
            return "stable"

        recent_avg = sum(r.get("overall_rating", 0) for r in recent_10) / len(recent_10)
        previous_avg = sum(r.get("overall_rating", 0) for r in previous_10) / len(previous_10)

        diff = recent_avg - previous_avg

        if diff > 0.3:
            return "improving"
        elif diff < -0.3:
            return "declining"
        else:
            return "stable"

    def get_property_reviews_summary(self, property_id: int, page: int=1, limit: int=10) -> Dict[str, Any]:
        """Get a summary of reviews for a specific property"""
        reviews = self.get_property_reviews(property_id=property_id, page=page, limit=limit)
        stats = self.get_review_statistics(property_id)

        return {
            "property_id": property_id,
            "average_rating": stats.get("average_rating", 0),
            "total_reviews": stats.get("total_reviews", 0),
            "reviews": reviews,
            "rating_distribution": stats.get("rating_distribution", {}),
            "category_averages": stats.get("category_averages", {}),
            "recent_trend": stats.get("recent_trend", "stable"),
        }
