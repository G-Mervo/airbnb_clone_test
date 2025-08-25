#!/usr/bin/env python3
"""
Fixtures Generator Script
Generate property_reviews.json from existing properties.json data
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add the src directory to the path so we can import our utils
sys.path.append(str(Path(__file__).parent.parent / "src"))

from utils.data_manager import DataManager


def generate_realistic_review_dates():
    """Generate realistic review dates over the past 2 years"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)  # 2 years ago
    
    # Generate random date between start and end
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    random_date = start_date + timedelta(days=random_days)
    
    return random_date.strftime("%B %Y")


def enhance_review_content(base_comment, property_type, location):
    """Enhance review content with property-specific details"""
    
    enhancements = {
        "apartment": [
            "The apartment was spotless and perfectly located.",
            "Great city apartment with excellent amenities.",
            "Perfect urban retreat with easy access to everything.",
        ],
        "house": [
            "The house felt like a home away from home.",
            "Spacious house with everything we needed.",
            "Beautiful house in a quiet neighborhood.",
        ],
        "villa": [
            "Luxurious villa with stunning architecture.",
            "The villa exceeded all our expectations.",
            "Private villa with incredible attention to detail.",
        ]
    }
    
    location_mentions = [
        f"Great location in {location}.",
        f"Perfect spot to explore {location}.",
        f"Loved the {location} neighborhood.",
        f"{location} is amazing and this place is right in the heart of it.",
    ]
    
    # Combine base comment with enhancements
    enhanced = base_comment
    if property_type.lower() in enhancements:
        enhanced += " " + random.choice(enhancements[property_type.lower()])
    
    enhanced += " " + random.choice(location_mentions)
    
    return enhanced


def extract_reviews_from_properties():
    """Extract and enhance reviews from properties.json"""
    
    # Initialize data manager
    data_manager = DataManager()
    
    # Load properties data
    properties = data_manager.load("properties.json")
    
    if not properties:
        print("❌ No properties found in properties.json")
        return
    
    print(f"📂 Found {len(properties)} properties to process...")
    
    # Extract all reviews with enhanced content
    all_reviews = []
    review_id_counter = 1
    
    for prop in properties:
        property_id = prop.get('id')
        property_type = prop.get('property_type', 'apartment')
        location = f"{prop.get('city', '')}, {prop.get('state', '')}"
        reviews = prop.get('reviews', [])
        
        print(f"  Processing property {property_id}: {len(reviews)} reviews")
        
        for review in reviews:
            enhanced_review = {
                "id": review_id_counter,
                "property_id": property_id,
                "user_id": random.randint(100, 999),  # Generate random user ID
                "user_name": review.get('name', 'Anonymous Guest'),
                "user_avatar": review.get('avatar', ''),
                "rating": review.get('rating', 5),
                "title": f"Great stay at this {property_type}",
                "comment": enhance_review_content(
                    review.get('comment', 'Had a wonderful stay!'),
                    property_type,
                    location
                ),
                "date": generate_realistic_review_dates(),
                "helpful_count": random.randint(0, 15),
                "verified_stay": True,
                "stay_type": random.choice(["business", "leisure", "family"]),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            all_reviews.append(enhanced_review)
            review_id_counter += 1
    
    # Save to property_reviews.json
    if data_manager.save("property_reviews.json", all_reviews):
        print(f"✅ Successfully created property_reviews.json with {len(all_reviews)} reviews")
        
        # Generate some stats
        stats = {
            "total_reviews": len(all_reviews),
            "properties_with_reviews": len(set(r['property_id'] for r in all_reviews)),
            "average_rating": sum(r['rating'] for r in all_reviews) / len(all_reviews),
            "generated_at": datetime.now().isoformat()
        }
        
        print("\n📊 Review Statistics:")
        print(f"  Total Reviews: {stats['total_reviews']}")
        print(f"  Properties with Reviews: {stats['properties_with_reviews']}")
        print(f"  Average Rating: {stats['average_rating']:.2f}")
        
        # Save stats file
        data_manager.save("property_reviews_stats.json", [stats])
        
    else:
        print("❌ Failed to save property_reviews.json")


def create_clean_properties():
    """Create a clean properties.json without embedded reviews"""
    
    data_manager = DataManager()
    properties = data_manager.load("properties.json")
    
    if not properties:
        print("❌ No properties found")
        return
    
    # Remove embedded reviews, keep only summary data
    clean_properties = []
    
    for prop in properties:
        # Calculate review summary
        reviews = prop.get('reviews', [])
        review_count = len(reviews)
        avg_rating = sum(r.get('rating', 0) for r in reviews) / review_count if review_count > 0 else 0
        
        # Create clean property without embedded reviews
        clean_prop = {k: v for k, v in prop.items() if k != 'reviews'}
        
        # Add summary data
        clean_prop.update({
            'rating': round(avg_rating, 2),
            'rating_count': review_count,
            'updated_at': datetime.now().isoformat()
        })
        
        clean_properties.append(clean_prop)
    
    # Save clean properties
    if data_manager.save("properties_clean.json", clean_properties):
        print(f"✅ Created properties_clean.json with {len(clean_properties)} properties (no embedded reviews)")
    else:
        print("❌ Failed to save properties_clean.json")


def main():
    """Main function to run the fixtures generation"""
    
    print("🔧 Property Reviews Fixtures Generator")
    print("=" * 50)
    
    try:
        # Extract and enhance reviews
        extract_reviews_from_properties()
        
        # Create clean properties
        create_clean_properties()
        
        print("\n🎉 Fixtures generation completed successfully!")
        print("\nGenerated files:")
        print("  📄 property_reviews.json - Separate reviews with enhanced content")
        print("  📄 property_reviews_stats.json - Review statistics")
        print("  📄 properties_clean.json - Properties without embedded reviews")
        
    except Exception as e:
        print(f"❌ Error during generation: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
