# Makeup Artist Test Data

## Create Makeup Artist Service

### POST `/api/v2/services/makeup-artist`

```json
{
  "vendor_id": "VEN20250802143022",
  "basic_details": {
    "point_of_contact": "Sarah Johnson",
    "service_contact_number": "+1234567890",
    "min_booking_capacity": 1,
    "max_booking_capacity": 10,
    "description": "Professional makeup artist specializing in bridal and event makeup",
    "event_types_makeup": [
      {
        "event_name": "Wedding",
        "event_type": "wedding"
      },
      {
        "event_name": "Corporate Events",
        "event_type": "corporate"
      }
    ],
    "types_of_makeup_artists_available": [
      "Bridal Makeup Artist",
      "Party Makeup Artist",
      "Editorial Makeup Artist"
    ],
    "service_location_make_up": {
      "lat": "28.6139",
      "lon": "77.2090",
      "service_opening_time": "09:00",
      "service_closing_time": "18:00",
      "service_pincode": 110001,
      "google_map_link": "https://maps.google.com/test"
    }
  },
  "service_details": {
    "is_onsite_makeup_available": true,
    "is_customization_possible": true,
    "service_types": [
      "Bridal Makeup",
      "Party Makeup",
      "Corporate Makeup",
      "Photoshoot Makeup"
    ]
  },
  "additional_details": {
    "asset_images": [
      "https://s3.amazonaws.com/makeup1.jpg",
      "https://s3.amazonaws.com/makeup2.jpg"
    ],
    "asset_videos": [
      "https://s3.amazonaws.com/makeup_demo.mp4"
    ],
    "min_booking_period": 1,
    "max_booking_period": 365,
    "prices_starts_from": 5000,
    "ig_socials_link": "https://instagram.com/sarahmakeup",
    "web_social_link": "https://sarahmakeup.com"
  },
  "business_details": {
    "service_type": "Make-up-artist",
    "category": 4,
    "business_registration_name": "Sarah's Makeup Studio",
    "verification_type": "pan",
    "team_size": 3,
    "years_of_operation": 5,
    "business_address": "123 Beauty Street, Delhi",
    "pincode": 110001,
    "annual_bookings": 150
  },
  "bank_details": {
    "bank_name": "HDFC Bank",
    "branch_name": "Connaught Place",
    "account_number": "1234567890123456",
    "ifsc_code": "HDFC0000123",
    "account_holder_name": "Sarah Johnson",
    "account_type": "Savings"
  },
  "policies": {
    "cancellation_policy": "24 hours advance notice required for cancellation",
    "additional_policies": "No refund for same-day cancellations"
  },
  "service_areas": ["Delhi", "Gurgaon", "Noida"]
}
```

## Expected Response Structure

```json
{
  "success": true,
  "message": "Makeup artist service created successfully",
  "data": {
    "service_id": "MKA20250806XXXXXX",
    "vendor_id": "VEN20250802143022",
    "service_type": "Make-up-artist",
    "is_active": false,
    "profile_completion_percentage": 100,
    "service_areas": ["Delhi", "Gurgaon", "Noida"],
    "ratings": 1,
    "basic_details": {
      "is_completed": true,
      // ... other fields
    },
    "service_details": {
      "is_completed": true,
      // ... other fields
    },
    // ... other sections
  }
}
```

## Update Makeup Artist

### PUT `/api/v2/services/makeup-artist/:service_id`

```json
{
  "basic_details": {
    "description": "Updated description for professional makeup services"
  }
}
```

## Get All Makeup Artists

### GET `/api/v2/services/makeup-artist`

Query parameters:
- `page=1`
- `limit=10`
- `is_active=true`
- `vendor_id=VEN20250802143022`
- `service_areas=Delhi,Mumbai`
- `min_rating=3`

## Toggle Status

### PATCH `/api/v2/services/makeup-artist/:service_id/toggle-status`

## Delete Makeup Artist

### DELETE `/api/v2/services/makeup-artist/:service_id`
