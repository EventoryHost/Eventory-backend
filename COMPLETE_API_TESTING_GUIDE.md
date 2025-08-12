# Complete API Testing Guide - Updated

This comprehensive guide covers all API endpoints in the Eventory platform including the new Events and Invoices management systems.

## Events Management API

### 1. Create Event
```http
POST http://localhost:3000/api/events
Content-Type: application/json

{
  "customer_id": "CUST2025013114301234567",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "event_type": "Wedding",
  "location_type": "outdoor",
  "event_location": "123 Garden Hall, MG Road, Bangalore - 560001",
  "event_start": "2025-03-15T10:00:00.000Z",
  "event_end": "2025-03-15T22:00:00.000Z",
  "final_guest_count": 200,
  "final_amount": 150000,
  "vendor_manager_name": "Rajesh Kumar",
  "customer_name": "Priya Sharma",
  "vendor_manager_contact_number": "9876543210",
  "customer_contact_number": "9876543211",
  "advance_amount_paid": 50000,
  "final_order_items": [
    {
      "name_of_service": "Traditional North Indian Menu",
      "quantity": 200,
      "description": "Full course meal with appetizers, main course, and desserts",
      "price": 600
    },
    {
      "name_of_service": "Live Counter Setup",
      "quantity": 3,
      "description": "Chaat counter, pasta counter, and dessert counter",
      "price": 10000
    }
  ]
}
```

### 2. Get All Events with Filters
```http
GET http://localhost:3000/api/events?customer_id=CUST2025013114301234567&event_status=booked&page=1&limit=10
```

### 3. Get Single Event
```http
GET http://localhost:3000/api/events/EVT2025013114301234567
```

### 4. Update Event
```http
PUT http://localhost:3000/api/events/EVT2025013114301234567
Content-Type: application/json

{
  "final_guest_count": 250,
  "final_amount": 175000,
  "final_order_items": [
    {
      "name_of_service": "Premium Menu",
      "quantity": 250,
      "description": "Enhanced menu with additional items",
      "price": 700
    }
  ]
}
```

### 5. Mark Event as Completed
```http
PATCH http://localhost:3000/api/events/EVT2025013114301234567/complete
```

### 6. Cancel Event
```http
PATCH http://localhost:3000/api/events/EVT2025013114301234567/cancel
Content-Type: application/json

{
  "reason": "Venue unavailable due to maintenance"
}
```

### 7. Get Events by Customer
```http
GET http://localhost:3000/api/events/customer/CUST2025013114301234567
```

### 8. Get Events by Vendor
```http
GET http://localhost:3000/api/events/vendor/VEN2025013114301234567?status=upcoming
```

## Invoices Management API

### 1. Create Registration Invoice
```http
POST http://localhost:3000/api/invoices
Content-Type: application/json

{
  "type": "registration",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "invoice_amount": 5000,
  "tax_amount": 900,
  "notes": "Registration fee for caterer service on Eventory platform"
}
```

### 2. Create Advance Booking Invoice
```http
POST http://localhost:3000/api/invoices
Content-Type: application/json

{
  "type": "advance_booking",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": "CUST2025013114301234567",
  "event_id": "EVT2025013114301234567",
  "invoice_amount": 50000,
  "tax_amount": 9000,
  "notes": "Advance payment for wedding catering service"
}
```

### 3. Create Final Booking Invoice
```http
POST http://localhost:3000/api/invoices
Content-Type: application/json

{
  "type": "booking",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": "CUST2025013114301234567",
  "event_id": "EVT2025013114301234567",
  "invoice_amount": 100000,
  "tax_amount": 18000,
  "notes": "Final payment for wedding catering service"
}
```

### 4. Get All Invoices with Filters
```http
GET http://localhost:3000/api/invoices?vendor_id=VEN2025013114301234567&status=pending&page=1&limit=10
```

### 5. Get Single Invoice
```http
GET http://localhost:3000/api/invoices/INV2025013114301234567
```

### 6. Mark Invoice as Paid
```http
PATCH http://localhost:3000/api/invoices/INV2025013114301234567/pay
Content-Type: application/json

{
  "payment_method": "upi",
  "transaction_id": "TXN1234567890"
}
```

### 7. Cancel Invoice
```http
PATCH http://localhost:3000/api/invoices/INV2025013114301234567/cancel
Content-Type: application/json

{
  "reason": "Event cancelled by customer"
}
```

### 8. Get Overdue Invoices
```http
GET http://localhost:3000/api/invoices/filter/overdue
```

### 9. Get Invoices by Vendor
```http
GET http://localhost:3000/api/invoices/vendor/VEN2025013114301234567?status=pending&page=1&limit=10
```

### 10. Get Invoices by Customer
```http
GET http://localhost:3000/api/invoices/customer/CUST2025013114301234567?status=paid
```

### 11. Get Invoices by Event
```http
GET http://localhost:3000/api/invoices/event/EVT2025013114301234567
```

## Customer Management API

### 1. Create Customer
```http
POST http://localhost:3000/api/customers
Content-Type: application/json

{
  "name": "Priya Sharma",
  "email": "priya.sharma@email.com",
  "phone": "9876543211",
  "whatsapp_number": "9876543211",
  "address": {
    "street": "456 Park Avenue",
    "city": "Bangalore",
    "state": "Karnataka",
    "postal_code": "560001",
    "country": "India"
  },
  "date_of_birth": "1990-05-15",
  "anniversary_date": "2020-12-10",
  "preferences": {
    "cuisine_preferences": ["North Indian", "Chinese"],
    "event_types": ["Wedding", "Anniversary"],
    "budget_range": {
      "min": 50000,
      "max": 200000
    }
  }
}
```

### 2. Get All Customers
```http
GET http://localhost:3000/api/customers?page=1&limit=10
```

### 3. Get Customer by ID
```http
GET http://localhost:3000/api/customers/CUST2025013114301234567
```

### 4. Update Customer
```http
PUT http://localhost:3000/api/customers/CUST2025013114301234567
Content-Type: application/json

{
  "preferences": {
    "cuisine_preferences": ["North Indian", "South Indian", "Chinese"],
    "budget_range": {
      "min": 75000,
      "max": 250000
    }
  }
}
```

### 5. Delete Customer
```http
DELETE http://localhost:3000/api/customers/CUST2025013114301234567
```

## Calendar Management API

### 1. Create Calendar Entry
```http
POST http://localhost:3000/api/calendar
Content-Type: application/json

{
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": "CUST2025013114301234567",
  "event_id": "EVT2025013114301234567",
  "date": "2025-03-15",
  "time_slot": "10:00-22:00",
  "status": "booked",
  "notes": "Wedding catering service - 200 guests"
}
```

### 2. Get Calendar Entries
```http
GET http://localhost:3000/api/calendar?vendor_id=VEN2025013114301234567&date=2025-03-15
```

### 3. Get Vendor Availability
```http
GET http://localhost:3000/api/calendar/vendor/VEN2025013114301234567/availability?start_date=2025-03-01&end_date=2025-03-31
```

### 4. Update Calendar Entry
```http
PUT http://localhost:3000/api/calendar/EXT2025013114301234567
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Confirmed by customer - final guest count 200"
}
```

### 5. Cancel Calendar Entry
```http
PATCH http://localhost:3000/api/calendar/EXT2025013114301234567/cancel
Content-Type: application/json

{
  "reason": "Event postponed by customer"
}
```

## Vendor Management API (Existing)

### 1. Create Vendor
```http
POST http://localhost:3000/api/v2/vendors
Content-Type: application/json

{
  "name": "Rajesh Kumar",
  "wa_mobile": "9876543210",
  "email_address": "rajesh.kumar@example.com",
  "profile_picture": "https://example.com/profile.jpg"
}
```

### 2. Get All Vendors
```http
GET http://localhost:3000/api/v2/vendors?page=1&limit=10
```

### 3. Get Vendor by ID
```http
GET http://localhost:3000/api/v2/vendors/VEN2025013114301234567
```

## Caterer Services API (Existing)

### 1. Create Caterer Service
```http
POST http://localhost:3000/api/v2/services/caterers
Content-Type: application/json

{
  "vendor_id": "VEN2025013114301234567",
  "service_areas": ["Delhi", "Gurgaon", "Noida"],
  "basic_details": {
    "is_completed": true,
    "point_of_contact": "Chef Ramesh Kumar",
    "service_contact_number": "9876543210",
    "min_booking_capacity": 50,
    "max_booking_capacity": 500,
    "description": "Premium catering services for all types of events",
    "cuisine_specialities": ["North Indian", "Chinese", "Continental"],
    "service_location": {
      "lat": "28.6139",
      "lon": "77.2090",
      "service_pincode": 110001,
      "google_map_link": "123 Main Street, New Delhi"
    }
  },
  "menu_details": {
    "is_completed": true,
    "veg_or_nonveg": "BOTH",
    "appetizers": ["Paneer Tikka", "Chicken Wings"],
    "main_course": ["Dal Makhani", "Butter Chicken"],
    "beverages": ["Lassi", "Fresh Juice"]
  },
  "business_details": {
    "business_registration_name": "Kumar Catering Services",
    "gst": "07AABCU9603R1ZX",
    "pan": "AABCU9603R",
    "verification_type": "gst"
  }
}
```

## Decorator Services API (Existing)

### 1. Create Decorator Service
```http
POST http://localhost:3000/api/v2/services/decorators
Content-Type: application/json

{
  "vendor_id": "VEN2025013114301234568",
  "service_areas": ["Mumbai", "Pune", "Nashik"],
  "basic_details": {
    "is_completed": true,
    "point_of_contact": "Sneha Patel",
    "service_contact_number": "9876543212",
    "min_booking_capacity": 30,
    "max_booking_capacity": 1000,
    "description": "Creative decoration services for weddings and events",
    "decoration_types": ["Floral", "Balloon", "Theme Based", "Traditional"],
    "service_location": {
      "lat": "19.0760",
      "lon": "72.8777",
      "service_pincode": 400001,
      "google_map_link": "456 Marine Drive, Mumbai"
    }
  },
  "decoration_speciality_details": {
    "is_completed": true,
    "decoration_specialities": ["Wedding Mandap", "Stage Decoration", "Table Settings"],
    "themes_available": ["Royal", "Vintage", "Modern", "Traditional"],
    "color_schemes": ["Red & Gold", "Pink & White", "Blue & Silver"]
  },
  "business_details": {
    "business_registration_name": "Patel Decorators Pvt Ltd",
    "gst": "27AABCU9603R1ZY",
    "pan": "AABCU9603S",
    "verification_type": "gst"
  }
}
```

## Testing Sequence

### Step 1: Basic Setup
1. Create Vendor
2. Create Customer
3. Create Caterer/Decorator Service

### Step 2: Event Management
1. Create Event
2. Get Event details
3. Update Event if needed
4. Create Calendar entry

### Step 3: Invoice Management
1. Create Registration Invoice
2. Mark as Paid
3. Create Advance Booking Invoice
4. Create Final Booking Invoice

### Step 4: Event Completion
1. Mark Event as Completed
2. Verify all invoices are processed
3. Check Calendar status

### Step 5: Testing Edge Cases
1. Try to create invalid events
2. Test overdue invoice detection
3. Test event cancellation flow
4. Verify constraint validations

## Expected Responses

All successful API calls should return:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* relevant data */ }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

This guide covers the complete API testing workflow for the enhanced Eventory platform with Events and Invoices management.
