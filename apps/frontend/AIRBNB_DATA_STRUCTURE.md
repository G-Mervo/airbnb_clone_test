# Airbnb Clone Data Structure Reference

## Property Data Structure

### Core Property Fields
```typescript
interface Property {
  id: string;
  title: string;
  description: string;
  images: string[];
  
  // Location
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    neighborhood?: string;
  };
  
  // Pricing
  pricing: {
    basePrice: number; // per night
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    totalBeforeTaxes: number;
    currency: string;
  };
  
  // Property Details
  propertyType: PropertyType;
  roomType: RoomType;
  capacity: {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
  };
  
  // Host Information
  host: {
    id: string;
    name: string;
    avatar: string;
    isSuperhost: boolean;
    joinedDate: string;
    responseRate: number;
    responseTime: string;
    languages: string[];
    verifications: string[];
  };
  
  // Ratings & Reviews
  ratings: {
    overall: number;
    accuracy: number;
    cleanliness: number;
    checkin: number;
    communication: number;
    location: number;
    value: number;
    reviewCount: number;
  };
  
  // Amenities & Features
  amenities: Amenity[];
  standoutFeatures: StandoutFeature[];
  safetyFeatures: string[];
  accessibilityFeatures: AccessibilityFeature[];
  
  // Booking Options
  bookingOptions: {
    instantBook: boolean;
    selfCheckin: boolean;
    allowsPets: boolean;
    smokingAllowed: boolean;
    eventsAllowed: boolean;
  };
  
  // Availability & Booking
  availability: {
    calendar: CalendarDay[];
    minimumStay: number;
    maximumStay: number;
    advanceNotice: number;
    preparationTime: number;
    checkInTime: string;
    checkOutTime: string;
    instantBook: boolean;
  };
  
  // Guest Configuration
  guestCapacity: {
    adults: number; // Ages 13 or above
    children: number; // Ages 2-12 
    infants: number; // Under 2
    pets: number; // Pets allowed (0 = no pets)
    serviceAnimals: boolean; // Service animals always allowed
  };
  
  // Additional Info
  houseRules: string[];
  cancellationPolicy: CancellationPolicy;
  isGuestFavorite: boolean;
  isNew: boolean;
  isRare: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Filter System Enums & Types

### Property Type
```typescript
enum PropertyType {
  HOUSE = "House",
  APARTMENT = "Apartment", 
  GUESTHOUSE = "Guesthouse",
  HOTEL = "Hotel",
  UNIQUE_SPACE = "Unique space",
  BED_AND_BREAKFAST = "Bed and breakfast",
  BOUTIQUE_HOTEL = "Boutique hotel"
}
```

### Room Type
```typescript
enum RoomType {
  ENTIRE_HOME = "Entire home/apt",
  PRIVATE_ROOM = "Private room",
  HOTEL_ROOM = "Hotel room",
  SHARED_ROOM = "Shared room"
}
```

### Amenities (Exact Airbnb Categories)
```typescript
interface Amenity {
  category: AmenityCategory;
  name: string;
  icon: string;
  isPopular?: boolean;
}

enum AmenityCategory {
  ESSENTIALS = "Essentials",
  FEATURES = "Features", 
  LOCATION = "Location",
  SAFETY = "Safety",
  ACCESSIBILITY = "Accessibility"
}

// Popular Amenities (shown first)
const POPULAR_AMENITIES = [
  "Wifi",
  "Kitchen", 
  "Air conditioning",
  "Washer",
  "Free parking",
  "Pool",
  "Gym",
  "Hot tub",
  "Self check-in",
  "Allows pets"
];

// All Amenities by Category (Complete Airbnb List)
const ALL_AMENITIES = {
  popular: [
    "Wifi", "Kitchen", "Air conditioning", "Washer", "Free parking", 
    "Pool", "Hot tub", "Gym", "Self check-in", "Allows pets"
  ],
  essentials: [
    "Wifi", "Kitchen", "Washer", "Dryer", "Air conditioning", "Heating", 
    "Dedicated workspace", "TV", "Hair dryer", "Iron", "Shampoo", 
    "Hot water", "Bed linens", "Extra pillows and blankets", "Hangers",
    "Room-darkening shades", "Cleaning products", "Dishes and silverware",
    "Cooking basics", "Oven", "Stove", "Coffee maker", "Dishwasher", 
    "Freezer", "Microwave", "Refrigerator", "Ethernet connection",
    "Luggage dropoff allowed", "Long term stays allowed"
  ],
  features: [
    "Pool", "Hot tub", "Gym", "BBQ grill", "Fire pit", "Pool table",
    "Indoor fireplace", "Piano", "Exercise equipment", "Lake access",
    "Beach access", "Ski-in/Ski-out", "Outdoor shower", "Hammock",
    "Sun loungers", "Outdoor furniture", "Outdoor dining area",
    "Crib", "King bed", "Smoking allowed", "Breakfast", "EV charger"
  ],
  location: [
    "Free parking on premises", "Free street parking", "Paid parking on premises",
    "Paid parking off premises", "Electric vehicle charger", "Single level home",
    "Private entrance", "Wide hallway clearance", "Wide doorway",
    "Accessible-height bed", "Step-free access", "Wide clearance to bed",
    "Wide clearance to shower and toilet", "Waterfront"
  ],
  safety: [
    "Smoke alarm", "First aid kit", "Fire extinguisher", "Carbon monoxide alarm",
    "Security cameras on property", "Lockbox"
  ]
};
```

### Accessibility Features
```typescript
interface AccessibilityFeature {
  category: AccessibilityCategory;
  feature: string;
}

enum AccessibilityCategory {
  GUEST_ENTRANCE_PARKING = "Guest entrance and parking",
  BEDROOM = "Bedroom", 
  BATHROOM = "Bathroom",
  ADAPTIVE_EQUIPMENT = "Adaptive equipment"
}

const ACCESSIBILITY_FEATURES = {
  guestEntranceParking: [
    "Step-free access",
    "Disabled parking spot", 
    "Guest entrance wider than 32 inches"
  ],
  bedroom: [
    "Step-free bedroom access",
    "Bedroom entrance wider than 32 inches"
  ],
  bathroom: [
    "Step-free bathroom access",
    "Bathroom entrance wider than 32 inches",
    "Toilet grab bar",
    "Shower grab bar", 
    "Step-free shower",
    "Shower or bath chair"
  ],
  adaptiveEquipment: [
    "Ceiling or mobile hoist"
  ]
};
```

### Host Languages
```typescript
const HOST_LANGUAGES = [
  // Popular Languages (shown first)
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Chinese (Simplified)",
  "Japanese", "Korean", "Russian", "Arabic",
  
  // All Other Languages (alphabetical)
  "Afrikaans", "Armenian", "Azerbaijani", "Bengali", "Croatian", "Czech", "Danish", 
  "Dutch", "Estonian", "Filipino", "Finnish", "Galician", "Georgian", "Greek",
  "Gujarati", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Irish",
  "Malay", "Norwegian", "Persian", "Polish", "Punjabi", "Romanian", "Swahili",
  "Swedish", "Tagalog", "Tamil", "Thai", "Turkish", "Ukrainian", "Urdu", 
  "Vietnamese", "Xhosa", "Zulu", "Sign Language"
];
```

### Standout Features
```typescript
enum StandoutFeature {
  GUEST_FAVORITE = "Guest favorite", // Most loved homes on Airbnb
  LUXE = "Luxe", // Luxury homes with elevated design
  PLUS = "Plus", // Verified for quality and design
  SUPERHOST = "Superhost" // Experienced, highly rated hosts
}
```

### Price Range
```typescript
interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// Airbnb's typical price ranges
const PRICE_RANGES = {
  budget: { min: 10, max: 50 },
  moderate: { min: 50, max: 150 },
  expensive: { min: 150, max: 300 },
  luxury: { min: 300, max: 1000 }
};
```

### Booking Options
```typescript
interface BookingOptions {
  instantBook: boolean;
  selfCheckin: boolean;
  allowsPets: boolean;
  freeParking: boolean;
  wifi: boolean;
  kitchen: boolean;
  washer: boolean;
  airConditioning: boolean;
  pool: boolean;
  gym: boolean;
}
```

### Cancellation Policies
```typescript
enum CancellationPolicy {
  FLEXIBLE = "Flexible",
  MODERATE = "Moderate", 
  FIRM = "Firm",
  STRICT = "Strict",
  SUPER_STRICT_30 = "Super strict 30 day",
  SUPER_STRICT_60 = "Super strict 60 day",
  LONG_TERM = "Long term"
}
```

## Filter Categories Structure

### Main Filter Categories (as they appear on Airbnb)
```typescript
interface FilterCategory {
  id: string;
  name: string;
  type: FilterType;
  options?: FilterOption[];
  range?: { min: number; max: number };
}

enum FilterType {
  CHECKBOX = "checkbox",
  RADIO = "radio", 
  RANGE = "range",
  MULTI_SELECT = "multiSelect"
}

const FILTER_CATEGORIES = [
  // Quick filters (top row)
  {
    id: "quick_filters",
    name: "Quick Filters",
    type: FilterType.CHECKBOX,
    options: [
      { value: "washer", label: "Washer" },
      { value: "free_parking", label: "Free parking" },
      { value: "self_checkin", label: "Self check-in" },
      { value: "allows_pets", label: "Allows pets" }
    ]
  },
  {
    id: "type_of_place", 
    name: "Type of place",
    type: FilterType.RADIO,
    options: [
      { value: "any", label: "Any type" },
      { value: "room", label: "Room" }, 
      { value: "entire_home", label: "Entire home" }
    ]
  },
  {
    id: "price_range",
    name: "Price range", 
    subtitle: "Trip price, includes all fees",
    type: FilterType.RANGE,
    range: { min: 10, max: 2000 },
    defaultRange: { min: 80, max: 800 }
  },
  {
    id: "rooms_beds",
    name: "Rooms and beds",
    type: FilterType.MULTI_SELECT,
    sections: [
      {
        name: "Bedrooms",
        options: ["Any", "1", "2", "3", "4", "5", "6", "7", "8+"]
      },
      {
        name: "Beds", 
        options: ["Any", "1", "2", "3", "4", "5", "6", "7", "8+"]
      },
      {
        name: "Bathrooms",
        options: ["Any", "1", "2", "3", "4", "5", "6", "7", "8+"]
      }
    ]
  },
  {
    id: "amenities",
    name: "Amenities",
    type: FilterType.CHECKBOX,
    showMore: true,
    sections: [
      {
        name: "Popular",
        options: [
          { value: "air_conditioning", label: "Air conditioning" },
          { value: "wifi", label: "Wifi" },
          { value: "kitchen", label: "Kitchen" },
          { value: "gym", label: "Gym" },
          { value: "tv", label: "TV" },
          { value: "pool", label: "Pool" }
        ]
      },
      {
        name: "Essentials", 
        options: [
          { value: "dedicated_workspace", label: "Dedicated workspace" },
          { value: "dryer", label: "Dryer" },
          { value: "heating", label: "Heating" },
          { value: "hair_dryer", label: "Hair dryer" },
          { value: "iron", label: "Iron" },
          { value: "free_parking", label: "Free parking" },
          { value: "ev_charger", label: "EV charger" }
        ]
      },
      {
        name: "Features",
        options: [
          { value: "hot_tub", label: "Hot tub" },
          { value: "king_bed", label: "King bed" },
          { value: "crib", label: "Crib" },
          { value: "bbq_grill", label: "BBQ grill" },
          { value: "indoor_fireplace", label: "Indoor fireplace" },
          { value: "smoking_allowed", label: "Smoking allowed" },
          { value: "breakfast", label: "Breakfast" },
          { value: "ski_in_out", label: "Ski-in/ski-out" }
        ]
      },
      {
        name: "Location",
        options: [
          { value: "waterfront", label: "Waterfront" }
        ]
      },
      {
        name: "Safety",
        options: [
          { value: "smoke_alarm", label: "Smoke alarm" },
          { value: "carbon_monoxide_alarm", label: "Carbon monoxide alarm" }
        ]
      }
    ]
  },
  {
    id: "booking_options",
    name: "Booking options", 
    type: FilterType.CHECKBOX,
    options: [
      { value: "instant_book", label: "Instant Book" },
      { value: "self_checkin", label: "Self check-in" },
      { value: "allows_pets", label: "Allows pets" }
    ]
  },
  {
    id: "standout_stays",
    name: "Standout stays",
    type: FilterType.CHECKBOX,
    options: [
      { 
        value: "guest_favorite", 
        label: "Guest favorite", 
        description: "The most loved homes on Airbnb"
      },
      {
        value: "luxe",
        label: "Luxe", 
        description: "Luxury homes with elevated design"
      }
    ]
  },
  {
    id: "property_type",
    name: "Property type",
    type: FilterType.CHECKBOX,
    options: [
      { value: "house", label: "House" },
      { value: "hotel", label: "Hotel" },
      { value: "apartment", label: "Apartment" },
      { value: "guesthouse", label: "Guesthouse" }
    ]
  },
  {
    id: "accessibility",
    name: "Accessibility features",
    type: FilterType.CHECKBOX,
    showMore: true,
    sections: [
      {
        name: "Guest entrance and parking",
        options: [
          { value: "step_free_access", label: "Step-free access" },
          { value: "disabled_parking", label: "Disabled parking spot" },
          { value: "wide_entrance", label: "Guest entrance wider than 32 inches" }
        ]
      },
      {
        name: "Bedroom",
        options: [
          { value: "step_free_bedroom", label: "Step-free bedroom access" },
          { value: "wide_bedroom_entrance", label: "Bedroom entrance wider than 32 inches" }
        ]
      },
      {
        name: "Bathroom", 
        options: [
          { value: "step_free_bathroom", label: "Step-free bathroom access" },
          { value: "wide_bathroom_entrance", label: "Bathroom entrance wider than 32 inches" },
          { value: "toilet_grab_bar", label: "Toilet grab bar" },
          { value: "shower_grab_bar", label: "Shower grab bar" },
          { value: "step_free_shower", label: "Step-free shower" },
          { value: "shower_chair", label: "Shower or bath chair" }
        ]
      },
      {
        name: "Adaptive equipment",
        options: [
          { value: "ceiling_hoist", label: "Ceiling or mobile hoist" }
        ]
      }
    ]
  },
  {
    id: "host_language",
    name: "Host language", 
    type: FilterType.CHECKBOX,
    showMore: true,
    options: [
      // Most common first
      { value: "english", label: "English" },
      { value: "spanish", label: "Spanish" },
      { value: "french", label: "French" },
      { value: "german", label: "German" },
      { value: "portuguese", label: "Portuguese" },
      { value: "chinese", label: "Chinese (Simplified)" },
      { value: "korean", label: "Korean" },
      { value: "russian", label: "Russian" },
      { value: "arabic", label: "Arabic" },
      
      // Alphabetical order
      { value: "afrikaans", label: "Afrikaans" },
      { value: "armenian", label: "Armenian" },
      { value: "azerbaijani", label: "Azerbaijani" },
      { value: "bengali", label: "Bengali" },
      { value: "croatian", label: "Croatian" },
      { value: "czech", label: "Czech" },
      { value: "danish", label: "Danish" },
      { value: "dutch", label: "Dutch" },
      { value: "estonian", label: "Estonian" },
      { value: "filipino", label: "Filipino" },
      { value: "finnish", label: "Finnish" },
      { value: "galician", label: "Galician" },
      { value: "georgian", label: "Georgian" },
      { value: "greek", label: "Greek" },
      { value: "gujarati", label: "Gujarati" },
      { value: "hebrew", label: "Hebrew" },
      { value: "hindi", label: "Hindi" },
      { value: "hungarian", label: "Hungarian" },
      { value: "icelandic", label: "Icelandic" },
      { value: "indonesian", label: "Indonesian" },
      { value: "irish", label: "Irish" },
      { value: "malay", label: "Malay" },
      { value: "norwegian", label: "Norwegian" },
      { value: "persian", label: "Persian" },
      { value: "polish", label: "Polish" },
      { value: "punjabi", label: "Punjabi" },
      { value: "romanian", label: "Romanian" },
      { value: "swahili", label: "Swahili" },
      { value: "swedish", label: "Swedish" },
      { value: "tagalog", label: "Tagalog" },
      { value: "tamil", label: "Tamil" },
      { value: "thai", label: "Thai" },
      { value: "turkish", label: "Turkish" },
      { value: "ukrainian", label: "Ukrainian" },
      { value: "urdu", label: "Urdu" },
      { value: "vietnamese", label: "Vietnamese" },
      { value: "xhosa", label: "Xhosa" },
      { value: "sign_language", label: "Sign Language" }
    ]
  }
];
```

## Sample Property Categories (for mock data generation)

### Popular Airbnb Destinations (US Focus)
```typescript
const POPULAR_US_DESTINATIONS = [
  // Beach Destinations
  { name: "Myrtle Beach", state: "SC", lat: 33.6891, lng: -78.8867, category: "Popular beach destination" },
  { name: "Virginia Beach", state: "VA", lat: 36.8529, lng: -75.9780, category: "Family friendly" },
  { name: "Ocean City", state: "MD", lat: 38.3365, lng: -75.0849, category: "Great for a weekend getaway" },
  { name: "Miami Beach", state: "FL", lat: 25.7907, lng: -80.1300, category: "Popular beach destination" },
  { name: "North Myrtle Beach", state: "SC", lat: 33.8160, lng: -78.6800, category: "Family friendly" },
  { name: "Fort Lauderdale", state: "FL", lat: 26.1224, lng: -80.1373, category: "Family friendly" },

  // Theme Parks & Attractions
  { name: "Orlando", state: "FL", lat: 28.5383, lng: -81.3792, category: "For sights like Walt Disney World Resort" },
  { name: "Kissimmee", state: "FL", lat: 28.2917, lng: -81.4076, category: "Family friendly" },

  // Nature & Mountains
  { name: "Outer Banks", state: "NC", lat: 35.5582, lng: -75.4665, category: "Family friendly" },
  { name: "Shenandoah", state: "VA", lat: 38.7849, lng: -78.1883, category: "For nature-lovers" },
  { name: "Gatlinburg", state: "TN", lat: 35.7143, lng: -83.5102, category: "For nature-lovers" },
  { name: "Massanutten", state: "VA", lat: 38.4101, lng: -78.7203, category: "Great for a weekend getaway" },
  { name: "Luray", state: "VA", lat: 38.6651, lng: -78.4597, category: "Near you" },

  // City Destinations
  { name: "New York", state: "NY", lat: 40.7128, lng: -74.0060, category: "Family friendly" },
  { name: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652, category: "For sights like Reading Terminal Market" },
  { name: "Richmond", state: "VA", lat: 37.5407, lng: -77.4360, category: "Great for a weekend getaway" },
  { name: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, category: "Family friendly" },

  // International US Territory
  { name: "San Juan", state: "PR", lat: 18.4655, lng: -66.1057, category: "For sights like Castillo San Felipe del Morro" }
];

// Search Date Options
const SEARCH_DATE_OPTIONS = [
  "Dates", // Specific date range
  "Months", // Stay for a month  
  "Flexible" // Flexible dates
];

// Guest Types for Search
interface GuestSearchConfig {
  adults: { min: 0, max: 16, description: "Ages 13 or above" };
  children: { min: 0, max: 5, description: "Ages 2 - 12" };
  infants: { min: 0, max: 5, description: "Under 2" };
  pets: { min: 0, max: 5, description: "Bringing a service animal?" };
}
```

### Property Title Templates
```typescript
const PROPERTY_TITLE_TEMPLATES = [
  // Luxury Properties
  "Stunning {propertyType} in {neighborhood}",
  "Luxury {propertyType} with {feature}",
  "Beautiful {propertyType} near {landmark}",
  "Modern {propertyType} in {area}",
  
  // Unique Features
  "{propertyType} with {amenity}",
  "Cozy {propertyType} perfect for {guests}",
  "Spacious {propertyType} in heart of {city}",
  "Charming {propertyType} with {feature}",
  
  // Location-based
  "Downtown {propertyType} with {view}",
  "Waterfront {propertyType} in {area}",
  "{propertyType} steps from {landmark}",
  "Historic {propertyType} in {neighborhood}"
];
```

This structure exactly mimics Airbnb's current filter system and property data model. We can use this as our reference to create realistic mock data that matches the real platform.