# Events and Invoices Test Data

## Events Schema Test Data

### 1. Complete Wedding Event Booking
```json
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
  "event_status": "booked",
  "vendor_manager_name": "Rajesh Kumar",
  "customer_name": "Priya Sharma",
  "vendor_manager_contact_number": "9876543210",
  "customer_contact_number": "9876543211",
  "already_paid_amount": 50000,
  "advance_amount_paid": 50000,
  "payment_status": "advance_paid",
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
    },
    {
      "name_of_service": "Service Staff",
      "quantity": 15,
      "description": "Waiters and kitchen staff for the event",
      "price": 2000
    }
  ]
}
```

### 2. Corporate Event
```json
{
  "customer_id": "CUST2025013114301234568",
  "vendor_id": "VEN2025013114301234568",
  "service_id": "DEC2025013114301234568",
  "event_type": "Corporate Annual Party",
  "location_type": "indoor",
  "event_location": "TechCorp Office, Sector 125, Noida - 201303",
  "event_start": "2025-02-20T18:00:00.000Z",
  "event_end": "2025-02-20T23:00:00.000Z",
  "final_guest_count": 150,
  "final_amount": 80000,
  "event_status": "upcoming",
  "vendor_manager_name": "Sneha Patel",
  "customer_name": "Amit Singh",
  "vendor_manager_contact_number": "9876543212",
  "customer_contact_number": "9876543213",
  "already_paid_amount": 40000,
  "advance_amount_paid": 40000,
  "payment_status": "advance_paid",
  "final_order_items": [
    {
      "name_of_service": "Corporate Theme Decoration",
      "quantity": 1,
      "description": "Full hall decoration with corporate branding",
      "price": 60000
    },
    {
      "name_of_service": "Audio Visual Setup",
      "quantity": 1,
      "description": "Sound system and lighting for presentations",
      "price": 20000
    }
  ]
}
```

### 3. Birthday Party (Completed)
```json
{
  "customer_id": "CUST2025013114301234569",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234569",
  "event_type": "Birthday Party",
  "location_type": "outdoor",
  "event_location": "Lotus Gardens, Whitefield, Bangalore - 560066",
  "event_start": "2024-12-25T16:00:00.000Z",
  "event_end": "2024-12-25T21:00:00.000Z",
  "final_guest_count": 50,
  "final_amount": 35000,
  "event_status": "completed",
  "vendor_manager_name": "Vikram Reddy",
  "customer_name": "Rahul Gupta",
  "vendor_manager_contact_number": "9876543214",
  "customer_contact_number": "9876543215",
  "already_paid_amount": 35000,
  "advance_amount_paid": 15000,
  "payment_status": "fully_paid",
  "final_order_items": [
    {
      "name_of_service": "Kids Birthday Menu",
      "quantity": 50,
      "description": "Special birthday menu with cake and snacks",
      "price": 500
    },
    {
      "name_of_service": "Birthday Decoration",
      "quantity": 1,
      "description": "Balloon decoration and birthday setup",
      "price": 10000
    }
  ]
}
```

### 4. Cancelled Event
```json
{
  "customer_id": "CUST2025013114301234570",
  "vendor_id": "VEN2025013114301234568",
  "service_id": "DEC2025013114301234570",
  "event_type": "Housewarming",
  "location_type": "indoor",
  "event_location": "1204 Skyline Apartments, Gurgaon - 122001",
  "event_start": "2025-01-20T18:00:00.000Z",
  "event_end": "2025-01-20T22:00:00.000Z",
  "final_guest_count": 80,
  "final_amount": 45000,
  "event_status": "cancelled",
  "vendor_manager_name": "Pooja Agarwal",
  "customer_name": "Suresh Mehta",
  "vendor_manager_contact_number": "9876543216",
  "customer_contact_number": "9876543217",
  "already_paid_amount": 0,
  "advance_amount_paid": 15000,
  "payment_status": "refunded",
  "final_order_items": [
    {
      "name_of_service": "Housewarming Decoration",
      "quantity": 1,
      "description": "Traditional housewarming decoration",
      "price": 45000
    }
  ]
}
```

## Invoices Schema Test Data

### 1. Registration Invoice
```json
{
  "type": "registration",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": null,
  "event_id": null,
  "invoice_amount": 5000,
  "tax_amount": 900,
  "total_amount": 5900,
  "invoice_status": "paid",
  "payment_method": "upi",
  "transaction_id": "TXN1234567890",
  "payment_date": "2025-01-15T10:30:00.000Z",
  "due_date": "2025-02-14T23:59:59.000Z",
  "notes": "Registration fee for caterer service on Eventory platform"
}
```

### 2. Advance Booking Invoice
```json
{
  "type": "advance_booking",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": "CUST2025013114301234567",
  "event_id": "EVT2025013114301234567",
  "invoice_amount": 50000,
  "tax_amount": 9000,
  "total_amount": 59000,
  "invoice_status": "paid",
  "payment_method": "card",
  "transaction_id": "TXN1234567891",
  "payment_date": "2025-01-20T14:45:00.000Z",
  "due_date": "2025-02-19T23:59:59.000Z",
  "notes": "Advance payment for wedding catering service"
}
```

### 3. Final Booking Invoice
```json
{
  "type": "booking",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": "CUST2025013114301234567",
  "event_id": "EVT2025013114301234567",
  "invoice_amount": 100000,
  "tax_amount": 18000,
  "total_amount": 118000,
  "invoice_status": "pending",
  "payment_method": null,
  "transaction_id": null,
  "payment_date": null,
  "due_date": "2025-03-14T23:59:59.000Z",
  "notes": "Final payment for wedding catering service - due before event date"
}
```

### 4. Cancelled Invoice
```json
{
  "type": "advance_booking",
  "vendor_id": "VEN2025013114301234568",
  "service_id": "DEC2025013114301234570",
  "customer_id": "CUST2025013114301234570",
  "event_id": "EVT2025013114301234570",
  "invoice_amount": 15000,
  "tax_amount": 2700,
  "total_amount": 17700,
  "invoice_status": "cancelled",
  "payment_method": null,
  "transaction_id": null,
  "payment_date": null,
  "due_date": "2025-01-19T23:59:59.000Z",
  "notes": "Cancelled due to event cancellation - refund processed"
}
```

### 5. Overdue Invoice
```json
{
  "type": "booking",
  "vendor_id": "VEN2025013114301234568",
  "service_id": "DEC2025013114301234568",
  "customer_id": "CUST2025013114301234568",
  "event_id": "EVT2025013114301234568",
  "invoice_amount": 40000,
  "tax_amount": 7200,
  "total_amount": 47200,
  "invoice_status": "pending",
  "payment_method": null,
  "transaction_id": null,
  "payment_date": null,
  "due_date": "2025-01-25T23:59:59.000Z",
  "notes": "Final payment for corporate event decoration - OVERDUE"
}
```

## API Testing Examples

### Events API Tests

#### Create Event
```bash
POST /api/events
Content-Type: application/json

{
  "customer_id": "CUST2025013114301234567",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "event_type": "Wedding",
  "location_type": "outdoor",
  "event_location": "Garden Hall, Bangalore",
  "event_start": "2025-03-15T10:00:00.000Z",
  "event_end": "2025-03-15T22:00:00.000Z",
  "final_guest_count": 200,
  "final_amount": 150000,
  "customer_name": "Priya Sharma",
  "final_order_items": [
    {
      "name_of_service": "Traditional Menu",
      "quantity": 200,
      "description": "Full course meal",
      "price": 600
    }
  ]
}
```

#### Get Events with Filters
```bash
GET /api/events?customer_id=CUST2025013114301234567&event_status=booked&page=1&limit=10
```

#### Mark Event as Completed
```bash
PATCH /api/events/EVT2025013114301234567/complete
```

#### Cancel Event
```bash
PATCH /api/events/EVT2025013114301234567/cancel
Content-Type: application/json

{
  "reason": "Venue unavailable due to maintenance"
}
```

### Invoices API Tests

#### Create Invoice
```bash
POST /api/invoices
Content-Type: application/json

{
  "type": "advance_booking",
  "vendor_id": "VEN2025013114301234567",
  "service_id": "CAT2025013114301234567",
  "customer_id": "CUST2025013114301234567",
  "event_id": "EVT2025013114301234567",
  "invoice_amount": 50000,
  "tax_amount": 9000,
  "notes": "Advance payment for wedding catering"
}
```

#### Mark Invoice as Paid
```bash
PATCH /api/invoices/INV2025013114301234567/pay
Content-Type: application/json

{
  "payment_method": "upi",
  "transaction_id": "TXN1234567890"
}
```

#### Get Overdue Invoices
```bash
GET /api/invoices/filter/overdue
```

#### Get Invoices by Vendor
```bash
GET /api/invoices/vendor/VEN2025013114301234567?status=pending
```

## Validation Test Cases

### Events Validation

#### Invalid Date Range
```json
{
  "event_start": "2025-03-15T22:00:00.000Z",
  "event_end": "2025-03-15T10:00:00.000Z"
}
// Should fail - end date before start date
```

#### Invalid Location Type
```json
{
  "location_type": "outdoor_indoor"
}
// Should fail - must be 'indoor' or 'outdoor'
```

#### Invalid Payment Amount
```json
{
  "final_amount": 50000,
  "already_paid_amount": 60000
}
// Should fail - paid amount exceeds final amount
```

### Invoices Validation

#### Registration with Customer ID
```json
{
  "type": "registration",
  "customer_id": "CUST2025013114301234567"
}
// Should fail - registration invoices should not have customer_id
```

#### Non-registration without Customer ID
```json
{
  "type": "booking",
  "customer_id": null
}
// Should fail - booking invoices require customer_id
```
