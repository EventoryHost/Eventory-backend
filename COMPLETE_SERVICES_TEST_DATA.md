# TEST DATA FOR PAV, MAKEUP ARTIST, AND VENUE PROVIDER SERVICES

## 1. PHOTOGRAPHER/VIDEOGRAPHER (PAV) TEST DATA

### Create PAV Service
```json
POST /api/v2/services/photographer-videographer/create
{
  "vendor_id": "VND123456789",
  "service_areas": ["Bangalore", "Mumbai", "Delhi"],
  "basic_details": {
    "point_of_contact": "John Smith",
    "service_contact_number": "+91 9876543210",
    "description": "Professional wedding and event photography with 8+ years experience. Specializing in candid moments and cinematic videography.",
    "min_booking_capacity": 1,
    "max_booking_capacity": 500,
    "event_types_captured": [
      {
        "event_name": "Wedding Photography",
        "event_type": "wedding"
      },
      {
        "event_name": "Corporate Events",
        "event_type": "corporate"
      },
      {
        "event_name": "Birthday Parties",
        "event_type": "common"
      }
    ],
    "service_location_pav": {
      "lat": "28.6139",
      "lon": "77.2090",
      "service_pincode": 110001,
      "google_map_link": "https://maps.google.com/example"
    }
  },
  "service_details": {
    "service_type_details": [
      {
        "type_of_service": "photography",
        "types_of_equipment_available": [
          "DSLR Camera",
          "Mirrorless Camera",
          "Professional Lighting",
          "Tripods",
          "Reflectors"
        ],
        "types_of_styles_offered": [
          "Candid Photography",
          "Portrait Photography",
          "Traditional Photography",
          "Pre-wedding Shoots"
        ],
        "add_ons_upgrade_available": [
          "Drone Photography",
          "Photo Album",
          "Digital Gallery"
        ],
        "final_delivery_methods": [
          "Digital Gallery",
          "USB Drive",
          "Cloud Storage",
          "Physical Album"
        ]
      },
      {
        "type_of_service": "videography",
        "types_of_equipment_available": [
          "4K Video Camera",
          "Gimbal Stabilizer",
          "Wireless Microphones",
          "LED Lights",
          "Slider Rails"
        ],
        "types_of_styles_offered": [
          "Cinematic Wedding Films",
          "Documentary Style",
          "Highlight Reels",
          "Same Day Edit"
        ],
        "add_ons_upgrade_available": [
          "Drone Videography",
          "4K Resolution",
          "Color Grading"
        ],
        "final_delivery_methods": [
          "Digital Download",
          "Blu-ray Disc",
          "USB Drive",
          "Online Streaming"
        ]
      }
    ]
  }
}
```

### Update Service Details (Optional - if you need to modify)
```json
PUT /api/v2/services/photographer-videographer/service-details/PAV123456789
```json
PUT /api/v2/services/photographer-videographer/service-details/PAV123456789
{
  "service_type_details": [
    {
      "type_of_service": "photography",
      "types_of_equipment_available": [
        "DSLR Camera",
        "Mirrorless Camera",
        "Professional Lighting",
        "Tripods",
        "Reflectors"
      ],
      "types_of_styles_offered": [
        "Candid Photography",
        "Portrait Photography",
        "Traditional Photography",
        "Pre-wedding Shoots"
      ],
      "add_ons_upgrade_available": [
        "Drone Photography",
        "Photo Album",
        "Digital Gallery"
      ],
      "final_delivery_methods": [
        "Digital Gallery",
        "USB Drive",
        "Cloud Storage",
        "Physical Album"
      ]
    },
    {
      "type_of_service": "videography",
      "types_of_equipment_available": [
        "4K Video Camera",
        "Gimbal Stabilizer",
        "Wireless Microphones",
        "LED Lights",
        "Slider Rails"
      ],
      "types_of_styles_offered": [
        "Cinematic Wedding Films",
        "Documentary Style",
        "Highlight Reels",
        "Same Day Edit"
      ],
      "add_ons_upgrade_available": [
        "Drone Videography",
        "4K Resolution",
        "Color Grading"
      ],
      "final_delivery_methods": [
        "Digital Download",
        "Blu-ray Disc",
        "USB Drive",
        "Online Streaming"
      ]
    }
  ]
}
```

### Update Portfolio
```json
PUT /api/v2/services/photographer-videographer/portfolio/PAV123456789
{
  "photos": [
    "https://example.com/portfolio/photo1.jpg",
    "https://example.com/portfolio/photo2.jpg",
    "https://example.com/portfolio/photo3.jpg"
  ],
  "videos": [
    "https://example.com/portfolio/video1.mp4",
    "https://example.com/portfolio/video2.mp4"
  ],
  "other_media": [
    "https://example.com/portfolio/album1.pdf"
  ]
}
```

### Update Additional Details
```json
PUT /api/v2/services/photographer-videographer/additional-details/PAV123456789
{
  "min_booking_period": 1,
  "max_booking_period": 30,
  "asset_images": [
    "https://example.com/assets/img1.jpg",
    "https://example.com/assets/img2.jpg"
  ],
  "asset_videos": [
    "https://example.com/assets/demo.mp4"
  ],
  "ig_socials_link": "https://instagram.com/johnsmith_photography",
  "web_social_link": "https://johnsmithphotography.com",
  "prices_starts_from": 25000
}
```

### Update Consultations Details
```json
PUT /api/v2/services/photographer-videographer/consultations-details/PAV123456789
{
  "service_offering_type": "Both",
  "send_proposals_to_clients": true,
  "do_initial_customer_consultation": true,
  "do_destination_events": true,
  "do_advance_setup": true,
  "do_post_production_services": true,
  "payment_method": "Bank Transfer, UPI, Cash",
  "delivery_timeline": "7-14 working days"
}
```

---

## 2. MAKEUP ARTIST TEST DATA

### Create Makeup Artist Service
```json
POST /api/v2/services/makeup-artist/create
{
  "vendor_id": "VND987654321",
  "service_areas": ["Mumbai", "Pune", "Nashik"],
  "basic_details": {
    "point_of_contact": "Priya Sharma",
    "service_contact_number": "+91 9876543211",
    "description": "Professional bridal makeup artist with 6+ years experience. Specializing in HD makeup, airbrush techniques, and traditional Indian bridal looks.",
    "min_booking_capacity": 1,
    "max_booking_capacity": 50,
    "event_types_makeup": [
      {
        "event_name": "Bridal Makeup",
        "event_type": "wedding"
      },
      {
        "event_name": "Party Makeup",
        "event_type": "common"
      },
      {
        "event_name": "Corporate Events",
        "event_type": "corporate"
      }
    ],
    "service_location_makeup": {
      "lat": "19.0760",
      "lon": "72.8777",
      "service_opening_time": "09:00",
      "service_closing_time": "20:00",
      "service_pincode": 400001,
      "google_map_link": "https://maps.google.com/mumbai-studio"
    }
  },
  "service_details": {
    "makeup_styles_offered": [
      "Bridal Makeup",
      "Party Makeup",
      "Engagement Makeup",
      "Reception Makeup",
      "Airbrush Makeup",
      "HD Makeup"
    ],
    "makeup_techniques_expertise": [
      "Contouring",
      "Highlighting",
      "Eye Makeup",
      "Traditional Indian",
      "Western Style",
      "Airbrush Application"
    ],
    "makeup_brands_used": [
      "MAC",
      "Bobbi Brown",
      "Urban Decay",
      "NARS",
      "Charlotte Tilbury",
      "Huda Beauty"
    ],
    "additional_services_offered": [
      "Hair Styling",
      "Draping",
      "Pre-bridal Services",
      "Trial Makeup"
    ]
  }
}
```

### Update Service Details (Optional - if you need to modify)
```json
PUT /api/v2/services/makeup-artist/service-details/MKA123456789
```json
PUT /api/v2/services/makeup-artist/service-details/MKA123456789
{
  "makeup_styles_offered": [
    "Bridal Makeup",
    "Party Makeup",
    "Engagement Makeup",
    "Reception Makeup",
    "Airbrush Makeup",
    "HD Makeup"
  ],
  "makeup_techniques_expertise": [
    "Contouring",
    "Highlighting",
    "Eye Makeup",
    "Traditional Indian",
    "Western Style",
    "Airbrush Application"
  ],
  "makeup_brands_used": [
    "MAC",
    "Bobbi Brown",
    "Urban Decay",
    "NARS",
    "Charlotte Tilbury",
    "Huda Beauty"
  ],
  "additional_services_offered": [
    "Hair Styling",
    "Draping",
    "Pre-bridal Services",
    "Trial Makeup"
  ]
}
```

### Update Additional Details
```json
PUT /api/v2/services/makeup-artist/additional-details/MKA123456789
{
  "asset_images": [
    "https://example.com/makeup/bridal1.jpg",
    "https://example.com/makeup/party1.jpg",
    "https://example.com/makeup/portfolio1.jpg"
  ],
  "asset_videos": [
    "https://example.com/makeup/tutorial.mp4",
    "https://example.com/makeup/transformation.mp4"
  ],
  "min_booking_period": 1,
  "max_booking_period": 7,
  "prices_starts_from": 8000,
  "ig_socials_link": "https://instagram.com/priya_makeup_artist",
  "web_social_link": "https://priyamakeup.com"
}
```

---

## 3. VENUE PROVIDER TEST DATA

### Create Venue Provider Service
```json
POST /api/v2/services/venue-provider/create
{
  "vendor_id": "VND456789123",
  "service_areas": ["Bangalore", "Chennai", "Hyderabad"],
  "basic_details": {
    "point_of_contact": "Rajesh Kumar",
    "service_contact_number": "+91 9876543212",
    "description": "Luxury banquet hall and garden venue perfect for weddings, corporate events, and celebrations. Located in the heart of the city with modern amenities.",
    "min_booking_capacity": 50,
    "max_booking_capacity": 1000,
    "event_types_venue": [
      {
        "event_name": "Wedding Reception",
        "event_type": "wedding"
      },
      {
        "event_name": "Corporate Conference",
        "event_type": "corporate"
      },
      {
        "event_name": "Birthday Party",
        "event_type": "common"
      },
      {
        "event_name": "Festival Celebration",
        "event_type": "seasonal"
      }
    ],
    "service_location_venue": {
      "lat": "12.9716",
      "lon": "77.5946",
      "service_opening_time": "06:00",
      "service_closing_time": "23:00",
      "service_pincode": 560001,
      "google_map_link": "https://maps.google.com/bangalore-venue"
    }
  },
  "feature_details": {
    "in_house_catering": true,
    "in_house_decoration": true,
    "venue_types_available": [
      "Banquet Hall",
      "Garden Venue",
      "Rooftop Terrace",
      "Conference Room",
      "Poolside Area"
    ],
    "av_eqp_available_at_venue": [
      "Projector and Screen",
      "Sound System",
      "Wireless Microphones",
      "LED TV Screens",
      "DJ Console",
      "Stage Lighting"
    ],
    "accessibility_features_of_venue": [
      "Wheelchair Accessible",
      "Elevator Access",
      "Accessible Restrooms",
      "Ramp Access",
      "Reserved Parking"
    ],
    "restriction_policies_on_venue": [
      "No Outside Alcohol",
      "No Smoking Indoors",
      "No Pets Allowed",
      "Music Cutoff at 11 PM"
    ],
    "special_features_in_venue": [
      "Crystal Chandeliers",
      "Marble Flooring",
      "Climate Control",
      "Water Fountain",
      "Bridal Suite",
      "VIP Lounge"
    ],
    "facilities_at_venue": [
      "Ample Parking",
      "Valet Service",
      "Catering Kitchen",
      "Changing Rooms",
      "Security Service",
      "WiFi",
      "Power Backup"
    ]
  }
}
```

### Update Feature Details (Optional - if you need to modify)
```json
PUT /api/v2/services/venue-provider/feature-details/VNP123456789
```json
PUT /api/v2/services/venue-provider/feature-details/VNP123456789
{
  "in_house_catering": true,
  "in_house_decoration": true,
  "venue_types_available": [
    "Banquet Hall",
    "Garden Venue",
    "Rooftop Terrace",
    "Conference Room",
    "Poolside Area"
  ],
  "av_eqp_available_at_venue": [
    "Projector and Screen",
    "Sound System",
    "Wireless Microphones",
    "LED TV Screens",
    "DJ Console",
    "Stage Lighting"
  ],
  "accessibility_features_of_venue": [
    "Wheelchair Accessible",
    "Elevator Access",
    "Accessible Restrooms",
    "Ramp Access",
    "Reserved Parking"
  ],
  "restriction_policies_on_venue": [
    "No Outside Alcohol",
    "No Smoking Indoors",
    "No Pets Allowed",
    "Music Cutoff at 11 PM"
  ],
  "special_features_in_venue": [
    "Crystal Chandeliers",
    "Marble Flooring",
    "Climate Control",
    "Water Fountain",
    "Bridal Suite",
    "VIP Lounge"
  ],
  "facilities_at_venue": [
    "Ample Parking",
    "Valet Service",
    "Catering Kitchen",
    "Changing Rooms",
    "Security Service",
    "WiFi",
    "Power Backup"
  ]
}
```

### Update Additional Details
```json
PUT /api/v2/services/venue-provider/additional-details/VNP123456789
{
  "asset_images": [
    "https://example.com/venue/hall1.jpg",
    "https://example.com/venue/garden1.jpg",
    "https://example.com/venue/setup1.jpg"
  ],
  "asset_videos": [
    "https://example.com/venue/tour.mp4",
    "https://example.com/venue/events.mp4"
  ],
  "min_booking_period": 1,
  "max_booking_period": 3,
  "prices_starts_from": 75000,
  "ig_socials_link": "https://instagram.com/grandpalace_venue",
  "web_social_link": "https://grandpalacevenue.com"
}
```

---

## BUSINESS DETAILS (Common for all services)
```json
PUT /api/v2/services/{service-type}/business-details/{service_id}
{
  "business_name": "Professional Services Pvt Ltd",
  "business_type": "Private Limited",
  "business_registration_number": "U74999KA2020PTC134567",
  "gst_number": "29ABCDE1234F1Z5",
  "business_address": {
    "street": "123 Business Park",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "landmark": "Near Metro Station"
  },
  "business_contact": {
    "primary_contact_number": "+91 9876543210",
    "secondary_contact_number": "+91 9876543211",
    "email": "contact@professionalservices.com",
    "website": "https://professionalservices.com"
  }
}
```

## BANK DETAILS (Common for all services)
```json
PUT /api/v2/services/{service-type}/bank-details/{service_id}
{
  "account_holder_name": "Professional Services Pvt Ltd",
  "account_number": "1234567890123456",
  "bank_name": "HDFC Bank",
  "branch_name": "Koramangala Branch",
  "ifsc_code": "HDFC0001234",
  "account_type": "Current",
  "upi_id": "professionalservices@hdfcbank"
}
```

## POLICIES (Common for all services)
```json
PUT /api/v2/services/{service-type}/policies/{service_id}
{
  "cancellation_policy": "50% refund if cancelled 7 days before event. 25% refund if cancelled 3 days before. No refund for same-day cancellations.",
  "terms_and_conditions": "All bookings require 30% advance payment. Final payment due 1 day before event. Equipment damage charges apply.",
  "agreement_url": "https://example.com/agreements/service-agreement.pdf",
  "agreement_signed_at": "2024-01-15T10:30:00.000Z"
}
```

---

## SERVICE AREAS UPDATE (for all services)
```json
PUT /api/v2/services/{service-type}/service-areas/{service_id}
{
  "service_areas": [
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Chennai",
    "Hyderabad",
    "Pune"
  ]
}
```

## ACTIVATION (for all services)
```json
PATCH /api/v2/services/{service-type}/toggle-status/{service_id}
```

Replace:
- `{service-type}` with: `photographer-videographer`, `makeup-artist`, or `venue-provider`
- `{service_id}` with actual service IDs like: `PAV123456789`, `MKA123456789`, `VNP123456789`
