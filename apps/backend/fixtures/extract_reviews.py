#!/usr/bin/env python3
"""
Script to extract reviews from properties.json and create a separate reviews.json file.
This script will also update properties.json to remove the reviews data.
"""

import json
from pathlib import Path
import sys

def main():
    # Get the project root directory
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    data_dir = backend_dir / "src" / "data" / "mock"

    properties_file = data_dir / "properties.json"
    reviews_file = data_dir / "reviews_extracted.json"

    print(f"Reading properties from: {properties_file}")

    # Read the properties data
    with open(properties_file, 'r', encoding='utf-8') as f:
        properties = json.load(f)

    # Extract all reviews from all properties
    all_reviews = []
    review_id_counter = 1

    # Updated properties without reviews
    updated_properties = []

    for property_data in properties:
        property_id = property_data.get("id")
        property_reviews = property_data.get("reviews", [])

        # Extract reviews for this property
        for review in property_reviews:
            extracted_review = {
                "id": review_id_counter,
                "property_id": int(property_id),
                "guest_id": review_id_counter,  # We'll use a simple mapping for now
                "booking_id": review_id_counter,  # Placeholder
                "overall_rating": review.get("rating", 5.0),
                "cleanliness_rating": review.get("rating", 5.0),
                "accuracy_rating": review.get("rating", 5.0),
                "communication_rating": review.get("rating", 5.0),
                "location_rating": review.get("rating", 5.0),
                "check_in_rating": review.get("rating", 5.0),
                "value_rating": review.get("rating", 5.0),
                "comment": review.get("comment", ""),
                "is_public": True,
                "created_at": f"2024-{review.get('date', 'May 2024').replace(' ', '-')}T10:00:00Z",
                "guest_name": review.get("name", "Anonymous"),
                "guest_avatar": review.get("avatar", ""),
                "host_response": None,
                "host_response_date": None
            }

            all_reviews.append(extracted_review)
            review_id_counter += 1

        # Create updated property without reviews
        updated_property = {k: v for k, v in property_data.items() if k != "reviews"}
        updated_properties.append(updated_property)

    # Save the extracted reviews
    print(f"Extracted {len(all_reviews)} reviews from {len(properties)} properties")

    with open(reviews_file, 'w', encoding='utf-8') as f:
        json.dump(all_reviews, f, indent=2, ensure_ascii=False)

    print(f"Reviews saved to: {reviews_file}")

    # Create a backup of the original properties file
    backup_file = data_dir / "properties_with_reviews_backup.json"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(properties, f, indent=2, ensure_ascii=False)

    print(f"Original properties backed up to: {backup_file}")

    # Save the updated properties without reviews
    updated_properties_file = data_dir / "properties_no_reviews.json"
    with open(updated_properties_file, 'w', encoding='utf-8') as f:
        json.dump(updated_properties, f, indent=2, ensure_ascii=False)

    print(f"Updated properties (without reviews) saved to: {updated_properties_file}")

    print("\nExtraction completed successfully!")
    print(f"- Total reviews extracted: {len(all_reviews)}")
    print(f"- Properties updated: {len(updated_properties)}")
    print("\nNext steps:")
    print("1. Review the extracted reviews in reviews_extracted.json")
    print("2. Replace properties.json with properties_no_reviews.json")
    print("3. Update your backend API to use the new reviews endpoint")

if __name__ == "__main__":
    main()
