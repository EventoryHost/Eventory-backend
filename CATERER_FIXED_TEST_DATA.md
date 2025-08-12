# Fixed Caterer Test Data

## Create Caterer - Correct Format
### POST /api/caterers
```json
{
  "vendor_id": "VEN20250802143022",
  "service_areas": ["Mumbai", "Pune", "Nashik"],
  "basic_details": {
    "point_of_contact": "Rajesh Kumar",
    "service_contact_number": "+919876543210",
    "min_booking_capacity": 50,
    "max_booking_capacity": 500,
    "description": "Premium catering services for all occasions with authentic Indian cuisine",
    "cuisine_specialities": ["North Indian", "South Indian", "Chinese", "Continental"],
    "regional_specialities": ["Punjabi", "Gujarati", "Maharashtrian"],
    "service_style_offered": ["Buffet", "Plated Service", "Family Style"],
    "service_location_caterer": {
      "lat": "19.0760",
      "lon": "72.8777",
      "service_pincode": 400001,
      "google_map_link": "https://maps.google.com/?q=19.0760,72.8777"
    },
    "is_completed": false
  },
  "menu_details": {
    "menu_details": [
      "https://s3-bucket.amazonaws.com/menu1.pdf",
      "https://s3-bucket.amazonaws.com/menu2.pdf"
    ],
    "veg_or_nonveg": "BOTH",
    "appetizers": ["Paneer Tikka", "Chicken Wings", "Spring Rolls", "Samosas"],
    "main_course": ["Butter Chicken", "Dal Makhani", "Biryani", "Pasta"],
    "beverages": ["Fresh Juices", "Soft Drinks", "Tea", "Coffee"],
    "special_dietary_options": ["Jain Food", "Vegan Options", "Gluten Free"],
    "pre_set_menus": ["Wedding Package", "Corporate Lunch", "Birthday Party"],
    "menu_customizable": true,
    "is_completed": false
  },
  "event_details": {
    "event_types_catered": ["Wedding", "Corporate Event", "Birthday Party", "Anniversary"],
    "additional_services_for_any_event": ["Table Setup", "Decoration", "Live Counters", "Waiters"],
    "is_completed": false
  },
  "staff_and_equipment_details": {
    "staff_provided": ["Head Chef", "Assistant Chefs", "Waiters", "Cleaners"],
    "equipment_provided": ["Chafing Dishes", "Tables", "Chairs", "Cutlery", "Crockery"],
    "is_completed": false
  },
  "additional_details": {
    "min_booking_period": 7,
    "max_booking_period": 365,
    "asset_images": [
      "https://s3-bucket.amazonaws.com/caterer1.jpg",
      "https://s3-bucket.amazonaws.com/caterer2.jpg"
    ],
    "asset_videos": [
      "https://s3-bucket.amazonaws.com/caterer-video1.mp4"
    ],
    "is_tasting_session_provided": true,
    "is_business_license_available": true,
    "food_safety_certificates": [
      "https://s3-bucket.amazonaws.com/fssai-cert.pdf"
    ],
    "prices_starts_from": 250,
    "is_completed": false
  },
  "business_details": {
    "business_registration_name": "Kumar Catering Services Pvt Ltd",
    "gst": "27ABCDE1234F1Z5",
    "verification_type": "gst",
    "team_size": 25,
    "years_of_operation": 8,
    "business_address": "Shop No 15, Food Plaza, Andheri West, Mumbai",
    "landmark": "Near Metro Station",
    "pincode": 400058,
    "operational_cities": ["Mumbai", "Pune", "Nashik"],
    "annual_revenue": "50-100 Lakhs",
    "annual_bookings": 150,
    "category": 2
  },
  "policies": {
    "cancellation_policy": "48 hours prior notice required for cancellation. 50% refund applicable.",
    "terms_and_conditions": "All bookings subject to advance payment. Menu changes allowed till 24 hours before event.",
    "agreement_url": "https://s3-bucket.amazonaws.com/agreement.pdf",
    "is_completed": false
  },
  "bank_details": {
    "bank_name": "HDFC Bank",
    "account_type": "Current",
    "account_number": "12345678901234",
    "ifsc": "HDFC0001234"
  }
}
```

## Update Basic Details Only
### PUT /api/caterers/{service_id}
```json
{
  "basic_details": {
    "point_of_contact": "Updated Manager Name",
    "service_contact_number": "+919876543211",
    "description": "Updated description with more details",
    "service_location_caterer": {
      "lat": "19.0820",
      "lon": "72.8820",
      "service_pincode": 400002,
      "google_map_link": "https://maps.google.com/?q=19.0820,72.8820"
    }
  }
}
```

## Minimal Create Request
### POST /api/caterers
```json
{
  "vendor_id": "VEN20250802143023",
  "basic_details": {
    "point_of_contact": "Test Manager",
    "service_contact_number": "+919999999999",
    "min_booking_capacity": 25,
    "max_booking_capacity": 200,
    "description": "Test catering service",
    "cuisine_specialities": ["Indian"],
    "regional_specialities": ["North Indian"],
    "service_style_offered": ["Buffet"],
    "service_location_caterer": {
      "lat": "19.0760",
      "lon": "72.8777",
      "service_pincode": 400001,
      "google_map_link": "https://maps.google.com/?q=19.0760,72.8777"
    }
  }
}
```

## Expected Response Format
```json
{
  "success": true,
  "message": "Caterer service created successfully",
  "data": {
    "service_id": "CAT20250802143022",
    "vendor_id": "VEN20250802143022",
    "service_type": "Caterer",
    "is_active": true,
    "profile_completion_score": 12,
    "service_areas": ["Mumbai", "Pune", "Nashik"],
    "basic_details": {
      "is_completed": true,
      "point_of_contact": "Rajesh Kumar",
      "service_contact_number": "+919876543210",
      "min_booking_capacity": 50,
      "max_booking_capacity": 500,
      "description": "Premium catering services...",
      "cuisine_specialities": ["North Indian", "South Indian"],
      "regional_specialities": ["Punjabi", "Gujarati"],
      "service_style_offered": ["Buffet", "Plated Service"],
      "service_location_caterer": {
        "lat": "19.0760",
        "lon": "72.8777",
        "service_pincode": 400001,
        "google_map_link": "https://maps.google.com/?q=19.0760,72.8777"
      }
    },
    "ratings": 1,
    "createdAt": "2025-08-02T14:30:22.000Z",
    "updatedAt": "2025-08-02T14:30:22.000Z"
  }
}
```

## Test Profile Completion
### GET /api/caterers/{service_id}/completion-status
Expected response:
```json
{
  "success": true,
  "message": "Profile completion status retrieved successfully",
  "data": {
    "success": true,
    "completionScore": 87,
    "completedSections": {
      "basicDetails": true,
      "menuDetails": true,
      "eventDetails": true,
      "staffAndEquipment": true,
      "additionalDetails": true,
      "businessDetails": true,
      "bankDetails": true,
      "policies": false
    }
  }
}
```
