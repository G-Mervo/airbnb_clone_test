#!/usr/bin/env python3
"""
Script to fix invalid datetime formats in property_reviews.json
"""

import json
import re
from pathlib import Path

def fix_datetime_format(date_string):
    """Convert invalid date format to valid ISO format"""
    if not date_string:
        return None

    # Pattern to match dates like "2024-May-2024T10:00:00Z"
    month_names = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    }

    # Fix the format "2024-Month-2024T10:00:00Z" -> "2024-MM-01T10:00:00Z"
    for month_name, month_num in month_names.items():
        if month_name in date_string:
            # Replace the invalid format with proper ISO format
            fixed_date = re.sub(
                rf'2024-{month_name}-2024T(\d{{2}}):(\d{{2}}):(\d{{2}})Z',
                rf'2024-{month_num}-01T\1:\2:\3Z',
                date_string
            )
            return fixed_date

    return date_string

def main():
    # Path to the reviews file
    reviews_file = Path(__file__).parent.parent / "src" / "data" / "reviews" / "property_reviews.json"

    print(f"Fixing datetime formats in: {reviews_file}")

    # Read the reviews data
    with open(reviews_file, 'r', encoding='utf-8') as f:
        reviews = json.load(f)

    # Fix datetime formats in all reviews
    fixed_count = 0
    for review in reviews:
        # Fix created_at
        if 'created_at' in review and review['created_at']:
            original = review['created_at']
            fixed = fix_datetime_format(review['created_at'])
            if fixed != original:
                review['created_at'] = fixed
                fixed_count += 1

        # Fix host_response_date if it exists
        if 'host_response_date' in review and review['host_response_date']:
            original = review['host_response_date']
            fixed = fix_datetime_format(review['host_response_date'])
            if fixed != original:
                review['host_response_date'] = fixed
                fixed_count += 1

    # Save the fixed reviews
    with open(reviews_file, 'w', encoding='utf-8') as f:
        json.dump(reviews, f, indent=2, ensure_ascii=False)

    print(f"Fixed {fixed_count} datetime fields in {len(reviews)} reviews")
    print("Property reviews file updated successfully!")

if __name__ == "__main__":
    main()
