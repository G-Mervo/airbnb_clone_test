from pydantic import BaseModel, RootModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class ReviewBase(BaseModel):
    """Base schema for reviews"""
    property_id: int
    guest_id: int
    booking_id: int
    overall_rating: float
    cleanliness_rating: Optional[float] = None
    accuracy_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    location_rating: Optional[float] = None
    check_in_rating: Optional[float] = None
    value_rating: Optional[float] = None
    comment: str
    is_public: bool = True
    host_response: Optional[str] = None
    host_response_date: Optional[datetime] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    overall_rating: Optional[float] = None
    cleanliness_rating: Optional[float] = None
    accuracy_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    location_rating: Optional[float] = None
    check_in_rating: Optional[float] = None
    value_rating: Optional[float] = None
    comment: Optional[str] = None
    is_public: Optional[bool] = None
    host_response: Optional[str] = None


class ReviewResponse(ReviewBase):
    id: int
    created_at: datetime
    guest_name: Optional[str] = None
    guest_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewWithGuest(ReviewResponse):
    """Review response with guest information"""
    guest: Optional[Dict[str, Any]] = None



# RootModel for a list of reviews (for endpoints returning List[ReviewResponse])
class ReviewListResponse(RootModel[List[ReviewResponse]]):
    pass

# RootModel for a dict of average ratings (for endpoints returning Dict[str, float])
class AverageRatingsResponse(RootModel[Dict[str, float]]):
    pass

# RootModel for a dict of rating distribution (for endpoints returning Dict[str, int])
class RatingDistributionResponse(RootModel[Dict[str, int]]):
    pass

class PropertyReviewsSummary(BaseModel):
    """Summary of reviews for a property"""
    property_id: int
    total_reviews: int
    average_ratings: Dict[str, float]
    reviews: List[ReviewResponse]


class ReviewStats(BaseModel):
    """Review statistics"""
    total_reviews: int
    average_overall_rating: float
    average_cleanliness_rating: float
    average_accuracy_rating: float
    average_communication_rating: float
    average_location_rating: float
    average_check_in_rating: float
    average_value_rating: float
    rating_distribution: Dict[str, int]  # "5": 10, "4": 5, etc.
