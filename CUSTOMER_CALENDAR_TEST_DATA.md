# Customer and Calendar Test Data

## Customer Schema Test Data

### 1. Complete Customer Creation Data
```json
{
  "customer_name": "Rahul Sharma",
  "contact_number": "9876543210",
  "email_address": "rahul.sharma@gmail.com",
  "customer_address": "123 MG Road, Connaught Place, New Delhi",
  "pincode": 110001,
  "whishlisted_services": ["CAT2025013114301234567", "DEC2025013114301234568"],
  "registration_source": "website"
}
```

### 2. Minimal Customer Creation Data
```json
{
  "customer_name": "Priya Singh",
  "contact_number": "8765432109"
}
```

### 3. Customer with WhatsApp Registration
```json
{
  "customer_name": "Amit Kumar",
  "contact_number": "7654321098",
  "email_address": "amit.kumar@yahoo.com",
  "customer_address": "456 Brigade Road, Bangalore",
  "pincode": 560001,
  "registration_source": "whatsapp"
}
```

### 4. Customer Update Data
```json
{
  "customer_address": "Updated Address, Sector 18, Noida",
  "pincode": 201301,
  "email_address": "updated.email@gmail.com",
  "whishlisted_services": ["CAT2025013114301234567", "DEC2025013114301234568", "VEN2025013114301234569"]
}
```

## Calendar Schema Test Data

### 1. Eventory Wedding Event
```json
{
  "service_id": "CAT2025013114301234567",
  "event_source": "eventory",
  "event_start": "2025-02-15T10:00:00.000Z",
  "event_end": "2025-02-15T18:00:00.000Z",
  "event_description": "Wedding catering service for 200 guests with traditional North Indian cuisine",
  "event_type": "upcoming",
  "event_highlight": "purple",
  "customer_id": "CUST2025013114301234567",
  "vendor_id": "VEN2025013114301234567",
  "event_title": "Sharma-Gupta Wedding Catering",
  "reminder_time": 120,
  "created_by": "customer"
}
```

### 2. External Vendor Event
```json
{
  "service_id": "DEC2025013114301234568",
  "event_source": "external",
  "event_start": "2025-03-10T14:00:00.000Z",
  "event_end": "2025-03-10T22:00:00.000Z",
  "event_description": "Corporate event decoration for annual company party",
  "event_type": "upcoming",
  "event_highlight": "orange",
  "vendor_id": "VEN2025013114301234568",
  "event_title": "TechCorp Annual Party Decoration",
  "reminder_time": 180,
  "created_by": "vendor"
}
```

### 3. Recurring Monthly Event
```json
{
  "service_id": "CAT2025013114301234569",
  "event_source": "eventory",
  "event_start": "2025-02-01T12:00:00.000Z",
  "event_end": "2025-02-01T16:00:00.000Z",
  "event_description": "Monthly corporate lunch catering",
  "event_type": "upcoming",
  "event_highlight": "teal",
  "customer_id": "CUST2025013114301234568",
  "vendor_id": "VEN2025013114301234567",
  "event_title": "Monthly Corporate Lunch",
  "is_recurring": true,
  "recurrence_pattern": "monthly",
  "reminder_time": 60,
  "created_by": "admin"
}
```

### 4. Completed Event
```json
{
  "service_id": "DEC2025013114301234570",
  "event_source": "eventory",
  "event_start": "2024-12-25T16:00:00.000Z",
  "event_end": "2024-12-25T23:00:00.000Z",
  "event_description": "Christmas party decoration with festive theme",
  "event_type": "completed",
  "event_highlight": "indigo",
  "customer_id": "CUST2025013114301234569",
  "vendor_id": "VEN2025013114301234568",
  "event_title": "Christmas Party Decoration",
  "reminder_time": 60,
  "is_reminder_sent": true,
  "created_by": "customer"
}
```

### 5. Cancelled Event
```json
{
  "service_id": "CAT2025013114301234571",
  "event_source": "eventory",
  "event_start": "2025-01-20T18:00:00.000Z",
  "event_end": "2025-01-20T22:00:00.000Z",
  "event_description": "Birthday party catering - cancelled due to venue issues",
  "event_type": "cancelled",
  "event_highlight": "orange",
  "customer_id": "CUST2025013114301234570",
  "vendor_id": "VEN2025013114301234567",
  "event_title": "Birthday Party Catering",
  "reminder_time": 90,
  "created_by": "customer"
}
```

## API Testing Examples

### Customer API Tests

#### Create Customer
```bash
POST /api/customers
Content-Type: application/json

{
  "customer_name": "Test Customer",
  "contact_number": "9876543210",
  "email_address": "test@example.com",
  "customer_address": "Test Address",
  "pincode": 110001,
  "registration_source": "website"
}
```

#### Get All Customers
```bash
GET /api/customers?page=1&limit=10&is_active=true
```

#### Get Customer by ID
```bash
GET /api/customers/CUST2025013114301234567
```

#### Update Customer
```bash
PUT /api/customers/CUST2025013114301234567
Content-Type: application/json

{
  "customer_address": "Updated Address",
  "pincode": 201301
}
```

### Calendar API Tests

#### Create Calendar Event
```bash
POST /api/calendar
Content-Type: application/json

{
  "service_id": "CAT2025013114301234567",
  "event_source": "eventory",
  "event_start": "2025-02-15T10:00:00.000Z",
  "event_end": "2025-02-15T18:00:00.000Z",
  "event_description": "Wedding catering service",
  "event_type": "upcoming",
  "event_title": "Wedding Catering",
  "customer_id": "CUST2025013114301234567"
}
```

#### Get Calendar Events
```bash
GET /api/calendar?service_id=CAT2025013114301234567&event_type=upcoming
```

#### Get Events by Date Range
```bash
GET /api/calendar/range?start_date=2025-02-01&end_date=2025-02-28
```

#### Update Event Status
```bash
PUT /api/calendar/EVT2025013114301234567
Content-Type: application/json

{
  "event_type": "completed"
}
```

## Validation Test Cases

### Customer Validation Tests

#### Invalid Mobile Number
```json
{
  "customer_name": "Test User",
  "contact_number": "1234567890"  // Should fail - doesn't start with 6-9
}
```

#### Invalid Email
```json
{
  "customer_name": "Test User",
  "contact_number": "9876543210",
  "email_address": "invalid-email"  // Should fail - invalid format
}
```

#### Invalid Pincode
```json
{
  "customer_name": "Test User",
  "contact_number": "9876543210",
  "pincode": 12345  // Should fail - not 6 digits
}
```

### Calendar Validation Tests

#### Event End Before Start
```json
{
  "service_id": "CAT2025013114301234567",
  "event_start": "2025-02-15T18:00:00.000Z",
  "event_end": "2025-02-15T10:00:00.000Z"  // Should fail - end before start
}
```

#### Invalid Event Source
```json
{
  "service_id": "CAT2025013114301234567",
  "event_source": "invalid_source"  // Should fail - not in enum
}
```

#### Invalid Event Type
```json
{
  "service_id": "CAT2025013114301234567",
  "event_type": "invalid_type"  // Should fail - not in enum
}
```
