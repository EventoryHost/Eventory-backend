# Complete Test Data for Caterer and Decorator Creation from Scratch

## Step 1: Create a Vendor First (Required)

### POST `/api/v2/vendors` 
```json
{
  "name": "Rajesh Kumar",
  "wa_mobile": "9876543210",
  "email_address": "rajesh.kumar@example.com",
  "profile_picture": "https://example.com/profile.jpg"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vendor created successfully",
  "data": {
    "vendor_id": "VEN123456", // Note this vendor_id for next steps
    "name": "Rajesh Kumar",
    "wa_mobile": "9876543210",
    "email_address": "rajesh.kumar@example.com",
    "profile_picture": "https://example.com/profile.jpg"
  }
}
```

---

## Step 2: Create Caterer Service

### POST `/api/v2/services/caterers`

**Complete Caterer Data (Structured Format):**
```json
{
  "vendor_id": "VEN123456",
  "service_areas": ["Delhi", "Gurgaon", "Noida", "Faridabad"],
  "basic_details": {
    "is_completed": true,
    "point_of_contact": "Chef Ramesh Kumar",
    "service_contact_number": "9876543210",
    "min_booking_capacity": 50,
    "max_booking_capacity": 500,
    "description": "Premium catering services for all types of events with authentic Indian cuisine and continental dishes",
    "cuisine_specialities": ["North Indian", "South Indian", "Chinese", "Continental", "Punjabi"],
    "regional_specialities": ["Punjabi", "Bengali", "Gujarati", "Rajasthani"],
    "service_style_offered": ["Buffet", "Plated Service", "Live Counters", "Family Style"],
    "service_location": {
      "lat": "28.6139",
      "lon": "77.2090",
      "service_pincode": 110001,
      "google_map_link": "123 Main Street, Connaught Place, New Delhi"
    }
  },
  "menu_details": {
    "is_completed": true,
    "menu_details": ["menu1.jpg", "menu2.jpg", "menu3.jpg"],
    "veg_or_nonveg": "BOTH",
    "appetizers": ["Paneer Tikka", "Chicken Wings", "Spring Rolls", "Aloo Tikki", "Fish Fingers"],
    "main_course": ["Dal Makhani", "Butter Chicken", "Biryani", "Rajma", "Kadai Paneer"],
    "beverages": ["Lassi", "Fresh Juice", "Soft Drinks", "Tea", "Coffee"],
    "special_dietary_options": ["Jain Food", "Vegan Options", "Gluten Free", "Sugar Free"],
    "pre_set_menus": ["Wedding Menu", "Corporate Menu", "Birthday Menu"],
    "menu_customizable": true
  },
  "event_details": {
    "is_completed": true,
    "event_types_catered": ["Mehendi", "Sangam", "Wedding Reception", "Haldi", "Conference", "Annual Party", "Product Launch", "Holi", "Diwali", "Christmas", "New Year", "Birthday", "Anniversary", "Festival Celebrations"],
    "additional_services_for_any_event": ["Live Cooking", "Table Setup", "Waiters", "Decoration"]
  },
  "staff_and_equipment_details": {
    "is_completed": true,
    "staff_provided": ["Head Chef", "Assistant Chef", "Waiters", "Helpers", "Supervisor"],
    "equipment_provided": ["Chafing Dishes", "Tables", "Chairs", "Serving Spoons", "Plates"]
  },
  "additional_details": {
    "is_completed": true,
    "min_booking_period": 7,
    "max_booking_period": 180,
    "asset_images": ["catering1.jpg", "catering2.jpg", "catering3.jpg"],
    "asset_videos": ["catering_video1.mp4", "catering_video2.mp4"],
    "is_tasting_session_provided": true,
    "is_business_license_available": true,
    "food_safety_certificates": ["FSSAI License", "Health Certificate", "Fire Safety"],
    "prices_starts_from": 500
  },
  "business_details": {
    "business_registration_name": "Kumar Catering Services Pvt Ltd",
    "gst": "07AABCU9603R1ZX",
    "pan": "AABCU9603R",
    "verification_type": "gst",
    "team_size": 15,
    "years_of_operation": 8,
    "business_address": "123 Main Street, Connaught Place, New Delhi",
    "landmark": "Near Metro Station",
    "pincode": 110001,
    "operational_cities": ["Delhi", "Gurgaon", "Noida", "Faridabad"],
    "annual_revenue": "50L-1Cr",
    "annual_bookings": 120,
    "category": 3
  },
  "policies": {
    "is_completed": true,
    "cancellation_policy": "50% refund if cancelled 7 days before event, 25% if cancelled 3 days before",
    "terms_and_conditions": "Standard catering terms and conditions apply. Food quality guaranteed.",
    "agreement_url": "https://example.com/caterer-agreement.pdf",
    "agreement_signed_at": "2024-01-15T10:00:00.000Z"
  },
  "bank_details": {
    "bank_name": "HDFC Bank",
    "account_type": "Current",
    "account_number": "12345678901234",
    "ifsc": "HDFC0001234"
  }
}
```

**Minimal Caterer Data (Structured Format - without bank details):**
```json
{
  "vendor_id": "VEN123456",
  "service_areas": ["Delhi"],
  "basic_details": {
    "point_of_contact": "Simple Caterer",
    "service_contact_number": "9876543210",
    "min_booking_capacity": 50,
    "max_booking_capacity": 200,
    "description": "Basic catering services for small events",
    "service_location": {
      "service_pincode": 110001,
      "google_map_link": "Simple Address, Delhi"
    }
  },
  "menu_details": {
    "veg_or_nonveg": "VEG"
  },
  "additional_details": {
    "prices_starts_from": 300
  },
  "business_details": {
    "business_registration_name": "Simple Catering Services",
    "verification_type": "pan",
    "pan": "ABCDE1234F",
    "team_size": 5,
    "years_of_operation": 2,
    "business_address": "Simple Address, Delhi",
    "pincode": 110001,
    "operational_cities": ["Delhi"],
    "annual_bookings": 24,
    "category": 2
  }
}
```

---

## Step 3: Create Decorator Service

### POST `/api/v2/services/decorators`

**Complete Decorator Data (Structured Format):**
```json
{
  "vendor_id": "VEN123456",
  "service_areas": ["Delhi", "Gurgaon", "Faridabad", "Noida"],
  "basic_details": {
    "is_completed": true,
    "point_of_contact": "Priya Sharma",
    "service_contact_number": "9876543210",
    "min_booking_capacity": 20,
    "max_booking_capacity": 1000,
    "description": "Creative and elegant decoration services for weddings, corporate events, and special occasions with modern and traditional themes",
    "decoration_specialities": ["Floral Arrangements", "Theme Decoration", "Balloon Decoration", "Backdrop Design", "Stage Setup"],
    "event_types_specialized": ["Wedding", "Corporate", "Birthday", "Anniversary"],
    "service_style_offered": ["Traditional", "Modern", "Fusion", "Vintage", "Contemporary"],
    "service_location": {
      "lat": "28.6139",
      "lon": "77.2090",
      "service_pincode": 110001,
      "google_map_link": "456 Design Street, Khan Market, New Delhi"
    }
  },
  "event_details": {
    "is_completed": true,
    "event_types_decorated": ["Mehendi", "Sangam", "Wedding", "Reception", "Haldi", "Engagement", "Product Launch", "Conference", "Annual Party", "Seminar", "Workshop", "Christmas", "New Year", "Diwali", "Holi", "Valentine's Day", "Birthday", "Anniversary", "Festival", "Baby Shower", "Retirement Party"],
    "additional_services_for_any_event": ["Photography Backdrop", "Stage Setup", "Lighting", "Sound Setup", "Entrance Decoration"],
    "decoration_themes": ["Traditional", "Modern", "Fusion", "Vintage", "Contemporary", "Floral", "Royal"]
  },
  "equipment_details": {
    "is_completed": true,
    "equipment_provided": ["Fresh Flowers", "Artificial Flowers", "Balloons", "Fabrics", "Props", "Lighting Equipment", "Sound System"],
    "decoration_items": ["Rose Petals", "Marigold", "Orchids", "Drapes", "Candles", "Lanterns"],
    "lighting_equipment": ["LED Lights", "Spotlights", "String Lights", "Disco Lights"],
    "furniture_provided": ["Chairs", "Tables", "Stages", "Podiums"]
  },
  "additional_details": {
    "is_completed": true,
    "min_booking_period": 10,
    "max_booking_period": 90,
    "asset_images": ["decoration1.jpg", "decoration2.jpg", "decoration3.jpg", "decoration4.jpg"],
    "asset_videos": ["decoration_video1.mp4", "decoration_showcase.mp4"],
    "is_site_visit_provided": true,
    "is_business_license_available": true,
    "decoration_certificates": ["Interior Design Certificate", "Event Management Certificate"],
    "prices_starts_from": 15000,
    "setup_time_required": 4
  },
  "business_details": {
    "business_registration_name": "Elegant Decorations Pvt Ltd",
    "gst": "07AABCD1234E1ZX",
    "pan": "AABCD1234E",
    "verification_type": "gst",
    "team_size": 12,
    "years_of_operation": 6,
    "business_address": "456 Design Street, Khan Market, New Delhi",
    "landmark": "Opposite Shopping Mall",
    "pincode": 110001,
    "operational_cities": ["Delhi", "Gurgaon", "Faridabad", "Noida"],
    "annual_revenue": "25L-50L",
    "annual_bookings": 80,
    "category": 4
  },
  "policies": {
    "is_completed": true,
    "cancellation_policy": "30% refund if cancelled 5 days before event, 15% if cancelled 2 days before",
    "terms_and_conditions": "Decoration terms and conditions apply. Setup will be done 2 hours before event.",
    "agreement_url": "https://example.com/decorator-agreement.pdf",
    "agreement_signed_at": "2024-02-20T14:30:00.000Z"
  },
  "bank_details": {
    "bank_name": "SBI Bank",
    "account_type": "Savings",
    "account_number": "98765432109876",
    "ifsc": "SBIN0001234"
  }
}
```

**Minimal Decorator Data (Structured Format - without bank details):**
```json
{
  "vendor_id": "VEN123456",
  "service_areas": ["Delhi"],
  "basic_details": {
    "point_of_contact": "Basic Decorator",
    "service_contact_number": "9876543210",
    "min_booking_capacity": 20,
    "max_booking_capacity": 100,
    "description": "Simple decoration services for small events",
    "service_location": {
      "service_pincode": 110001,
      "google_map_link": "Basic Address, Delhi"
    }
  },
  "additional_details": {
    "prices_starts_from": 5000
  },
  "business_details": {
    "business_registration_name": "Basic Decorations",
    "verification_type": "pan",
    "pan": "FGHIJ5678K",
    "team_size": 3,
    "years_of_operation": 1,
    "business_address": "Basic Address, Delhi",
    "pincode": 110001,
    "operational_cities": ["Delhi"],
    "annual_bookings": 12,
    "category": 1
  }
}
```

---

## Step 4: Verify Creation

### Get Caterer by ID
**GET** `/api/v2/services/caterers/{service_id}`

### Get Decorator by ID  
**GET** `/api/v2/services/decorators/{service_id}`

### Get All Caterers
**GET** `/api/v2/services/caterers`

### Get All Decorators
**GET** `/api/v2/services/decorators`

---

## Expected Responses

### Successful Caterer Creation:
```json
{
  "success": true,
  "message": "Caterer service created successfully",
  "data": {
    "service_id": "CAT123456",
    "vendor_id": "VEN123456",
    "basic_details": {
      "is_completed": true,
      "point_of_contact": "Chef Ramesh Kumar",
      "service_contact_number": "9876543210",
      // ... other fields
    },
    "bank_details": {
      "vendor_id": "VEN123456",
      "service_id": "CAT123456",
      "bank_name": "HDFC Bank", // or null if not provided
      "account_type": "Current", // or null if not provided
      "account_number": "12345678901234", // or null if not provided
      "ifsc": "HDFC0001234" // or null if not provided
    },
    // ... other sections
  }
}
```

### Successful Decorator Creation:
```json
{
  "success": true,
  "message": "Decorator service created successfully",
  "data": {
    "service_id": "DEC123456",
    "vendor_id": "VEN123456",
    "basic_details": {
      "is_completed": true,
      "point_of_contact": "Priya Sharma",
      "service_contact_number": "9876543210",
      // ... other fields
    },
    "bank_details": {
      "vendor_id": "VEN123456",
      "service_id": "DEC123456",
      "bank_name": "SBI Bank", // or null if not provided
      "account_type": "Savings", // or null if not provided
      "account_number": "98765432109876", // or null if not provided
      "ifsc": "SBIN0001234" // or null if not provided
    },
    // ... other sections
  }
}
```

---

## Testing Notes:

1. **Always create vendor first** - vendor_id is required for both caterer and decorator
2. **Use the actual vendor_id** returned from vendor creation
3. **Bank details are optional** - if not provided, only vendor_id and service_id will be populated
4. **Service_id is auto-generated** - starts with "CAT" for caterer and "DEC" for decorator
5. **All array fields can be empty** - they default to empty arrays
6. **Completion status is auto-calculated** - based on filled fields
7. **Test both complete and minimal data** - to verify optional field handling

## Postman Collection Order:
1. Create Vendor
2. Create Caterer (use vendor_id from step 1)
3. Create Decorator (use same vendor_id from step 1)
4. Get created services to verify data
