const fs = require('fs');
const path = require('path');

// Read the current rooms.json
const roomsPath = path.join(__dirname, '../data/mock-v2/rooms.json');
const rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));

// Review templates based on property characteristics
const reviewTemplates = {
  beach: [
    "Perfect beach location! The ocean views were breathtaking and we loved the direct beach access.",
    "Amazing beachfront property! Walking distance to everything and stunning sunrise views from the balcony.",
    "Beautiful beach house! The sound of waves was so relaxing and the location couldn't be better.",
    "Great beach vacation spot! Clean, comfortable, and right on the sand. Would definitely return!",
    "Incredible oceanfront stay! The beach was steps away and the property was spotless. Highly recommend!",
    "Beach paradise! Woke up to the sound of waves every morning. Perfect for our family trip.",
    "Fantastic beachside location! Easy access to water activities and great restaurants nearby.",
    "Outstanding beach property! The views were amazing and the host was very responsive.",
    "Loved our beach getaway! The property was exactly as described and beautifully maintained.",
    "Perfect for a beach vacation! Clean, comfortable, and the ocean access was incredible."
  ],
  pool: [
    "The pool area was fantastic! Kids loved swimming while adults relaxed. Great amenities throughout.",
    "Amazing pool and hot tub! Resort-style living with all the conveniences. Highly recommend!",
    "Pool was the highlight! Clean, well-maintained, and perfect for our family vacation.",
    "Excellent pool facilities! Felt like staying at a luxury resort. Everything was perfect.",
    "Incredible pool area! Spent most of our time by the water. Very well-maintained property.",
    "Resort-quality amenities! The pool and spa were amazing. Great for relaxation.",
    "Beautiful pool complex! Kids had a blast and adults could unwind. Perfect setup.",
    "Outstanding pool facilities! Everything was clean and the area was beautifully designed.",
    "Loved the pool access! Great for morning swims and evening relaxation. Highly recommend!",
    "Perfect pool setup! Felt like we were at a high-end resort. Excellent experience."
  ],
  luxe: [
    "Absolutely luxurious! Every detail was perfect and the amenities exceeded expectations.",
    "High-end finishes throughout! Felt like staying in a 5-star hotel. Exceptional property.",
    "Luxury at its finest! Beautiful decor, premium amenities, and outstanding host service.",
    "Upscale and elegant! Everything was top-notch from the furniture to the kitchen appliances.",
    "Incredible luxury experience! The attention to detail was remarkable. Worth every penny.",
    "Premium accommodations! Beautiful furnishings and top-quality amenities throughout.",
    "Exquisite property! Felt like royalty during our stay. Absolutely stunning interior.",
    "World-class luxury! Every amenity you could want and more. Exceptional hospitality.",
    "Outstanding upscale property! The quality was evident in every detail. Highly recommend!",
    "Magnificent luxury stay! Beautiful design and premium features throughout the property."
  ],
  cabin: [
    "Cozy cabin retreat! Perfect for disconnecting and enjoying nature. Very peaceful setting.",
    "Rustic charm with modern comforts! Great fireplace and beautiful forest views.",
    "Mountain cabin paradise! Clean air, stunning views, and perfect for hiking enthusiasts.",
    "Wonderful cabin experience! Secluded yet comfortable with all necessary amenities.",
    "Perfect wilderness escape! The cabin was charming and the location was incredibly peaceful.",
    "Beautiful rustic getaway! Loved the fireplace and the surrounding nature. So relaxing.",
    "Great mountain retreat! Clean, cozy, and perfect for a digital detox weekend.",
    "Charming cabin in the woods! Exactly what we needed to unwind and reconnect with nature.",
    "Fantastic forest hideaway! The cabin was well-equipped and the views were spectacular.",
    "Ideal nature retreat! Peaceful, comfortable, and beautifully situated in the wilderness."
  ],
  city: [
    "Great urban location! Walking distance to restaurants, attractions, and public transport.",
    "Perfect city getaway! Modern apartment with all amenities in prime downtown location.",
    "Excellent city spot! Close to everything we wanted to see and very convenient.",
    "Urban oasis! Great location for exploring the city with comfortable accommodations.",
    "Fantastic downtown location! Easy access to shopping, dining, and entertainment.",
    "Perfect city base! Clean, modern, and within walking distance of major attractions.",
    "Excellent urban retreat! Great location and easy access to public transportation.",
    "Ideal city stay! The location was perfect for exploring and the property was spotless.",
    "Outstanding downtown property! Close to everything and beautifully maintained.",
    "Perfect metropolitan escape! Great amenities and unbeatable location for city exploring."
  ],
  countryside: [
    "Peaceful countryside retreat! Beautiful landscapes and perfect for a relaxing getaway.",
    "Rural charm at its best! Quiet, scenic, and perfect for those seeking tranquility.",
    "Country living experience! Fresh air, open spaces, and wonderful hospitality.",
    "Idyllic countryside setting! Great for families wanting to escape the city hustle.",
    "Beautiful rural escape! The scenery was breathtaking and the peace was exactly what we needed.",
    "Perfect country getaway! Quiet, charming, and surrounded by beautiful natural landscapes.",
    "Wonderful countryside experience! Clean air, open fields, and a truly relaxing atmosphere.",
    "Charming rural property! The setting was picturesque and the hospitality was excellent.",
    "Ideal country retreat! Peaceful, scenic, and perfect for reconnecting with nature.",
    "Outstanding countryside stay! Beautiful views and a wonderfully quiet environment."
  ]
};

// Sample reviewer names and avatars
const reviewers = [
  { name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face" },
  { name: "Michael Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { name: "Emily Davis", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  { name: "David Rodriguez", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
  { name: "Jessica Miller", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
  { name: "James Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
  { name: "Amanda Garcia", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  { name: "Ryan Thompson", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150" },
  { name: "Lisa Anderson", avatar: "https://images.unsplash.com/photo-1485875437342-9b39470b3d95?w=150" },
  { name: "Kevin Martinez", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" }
];

// Generate review dates (recent months)
const months = ["December 2024", "November 2024", "October 2024", "September 2024", "August 2024", "July 2024", "June 2024", "May 2024", "April 2024", "March 2024", "February 2024", "January 2024"];

// Function to get review template based on property filter
function getReviewTemplate(filter) {
  const filterLower = filter.toLowerCase();
  if (filterLower.includes('beach')) return reviewTemplates.beach;
  if (filterLower.includes('pool')) return reviewTemplates.pool;
  if (filterLower.includes('luxe')) return reviewTemplates.luxe;
  if (filterLower.includes('cabin')) return reviewTemplates.cabin;
  if (filterLower.includes('cities') || filterLower.includes('top cities')) return reviewTemplates.city;
  if (filterLower.includes('countryside')) return reviewTemplates.countryside;
  return reviewTemplates.city; // default
}

// Function to generate reviews for a property
function generateReviewsForProperty(property) {
  const templates = getReviewTemplate(property.filter || 'city');
  
  // Generate 3-6 actual review objects
  const actualReviewCount = Math.floor(Math.random() * 4) + 3; // 3-6 reviews
  const reviews = [];
  
  for (let i = 0; i < actualReviewCount; i++) {
    const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const rating = Math.random() > 0.8 ? 4 : 5; // 80% 5-star, 20% 4-star
    const month = months[Math.floor(Math.random() * months.length)];
    
    reviews.push({
      id: i + 1,
      name: reviewer.name,
      date: month,
      rating: rating,
      comment: template,
      avatar: reviewer.avatar
    });
  }
  
  return {
    rating_count: actualReviewCount, // Match the actual number of reviews
    reviews: reviews
  };
}

// Process all rooms
const updatedRooms = rooms.map(room => {
  // Always regenerate to get more reviews for the modal
  const reviewData = generateReviewsForProperty(room);
  return {
    ...room,
    ...reviewData
  };
});

// Write back to file
fs.writeFileSync(roomsPath, JSON.stringify(updatedRooms, null, 2));
console.log(`Updated ${updatedRooms.length} properties with unique review data!`);