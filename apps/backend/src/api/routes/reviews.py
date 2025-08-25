from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime

from services import (
    review_service,
    user_service
)

from schemas.review import (
    PropertyReviewsSummary
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


def fix_date_format(date_string: str) -> str:
    """Fix malformed date strings to proper ISO format"""
    if not date_string:
        return datetime.now().isoformat() + "Z"
    try:
        datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return date_string
    except ValueError:
        month_mapping = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
        }
        for month_name, month_num in month_mapping.items():
            if month_name in date_string:
                fixed_date = date_string.replace(f'-{month_name}-', f'-{month_num}-01T')
                if '2024' in fixed_date and fixed_date.count('2024') > 1:
                    parts = fixed_date.split('T')
                    if len(parts) == 2:
                        date_part = parts[0]
                        time_part = parts[1]
                        date_components = date_part.split('-')
                        if len(date_components) >= 3:
                            year = date_components[0]
                            month = month_num
                            day = '01'
                            fixed_date = f"{year}-{month}-{day}T{time_part}"
                return fixed_date
        return datetime.now().isoformat() + "Z"


def clean_review_data(review: Dict[str, Any]) -> Dict[str, Any]:
    """Clean review data to ensure proper format"""
    cleaned_review = review.copy()

    # Fix date fields
    if 'created_at' in cleaned_review:
        cleaned_review['created_at'] = fix_date_format(cleaned_review['created_at'])

    if 'host_response_date' in cleaned_review and cleaned_review['host_response_date']:
        cleaned_review['host_response_date'] = fix_date_format(cleaned_review['host_response_date'])

    return cleaned_review


def calculate_average_ratings(reviews: List[Dict[str, Any]]) -> Dict[str, float]:
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


@router.get("/", response_model=List[Dict[str, Any]])
def get_reviews(
    property_id: Optional[int]=None,
    guest_id: Optional[int]=None,
    page: int=1,
    limit: int=10
):
    """Get all reviews with optional filtering"""
    # Use the service class for all review logic
    return review_service.get_reviews(property_id=property_id, guest_id=guest_id, page=page, limit=limit)


@router.get("/property/{property_id}", response_model=Dict[str, Any])
def get_property_reviews(
    property_id: int,
    page: int=1,
    limit: int=10
):
    """Get reviews for a specific property with summary statistics"""
    return review_service.get_property_reviews_summary(property_id=property_id, page=page, limit=limit)


@router.get("/{review_id}", response_model=Dict[str, Any])
def get_review(review_id: int):
    """Get review by ID"""
    return review_service.get_review_by_id(review_id)


@router.put("/{review_id}", response_model=Dict[str, Any])
async def update_review(
    review_id: int,
    overall_rating: Optional[float]=None,
    cleanliness_rating: Optional[float]=None,
    accuracy_rating: Optional[float]=None,
    communication_rating: Optional[float]=None,
    location_rating: Optional[float]=None,
    check_in_rating: Optional[float]=None,
    value_rating: Optional[float]=None,
    comment: Optional[str]=None,
    private_comment: Optional[str]=None
):
    """Update a review (mock implementation)"""
    reviews = review_service.get_all()
    for review in reviews:
        if review["id"] == review_id:
            updated_review = {**review}
            if overall_rating is not None:
                updated_review["overall_rating"] = overall_rating
            if cleanliness_rating is not None:
                updated_review["cleanliness_rating"] = cleanliness_rating
            if accuracy_rating is not None:
                updated_review["accuracy_rating"] = accuracy_rating
            if communication_rating is not None:
                updated_review["communication_rating"] = communication_rating
            if location_rating is not None:
                updated_review["location_rating"] = location_rating
            if check_in_rating is not None:
                updated_review["check_in_rating"] = check_in_rating
            if value_rating is not None:
                updated_review["value_rating"] = value_rating
            if comment is not None:
                updated_review["comment"] = comment
            if private_comment is not None:
                updated_review["private_comment"] = private_comment
            updated_review["updated_at"] = datetime.now().isoformat()
            updated_review["message"] = "Review updated successfully (mock implementation)"
            return updated_review
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Review not found"
    )
