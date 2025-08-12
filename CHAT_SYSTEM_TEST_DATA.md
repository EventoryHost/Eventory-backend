# Chat System Test Data

## Create Chat
### POST /api/chats
```json
{
  "service_id": "CAT20250802143022",
  "customer_id": "CUST20250802143022",
  "vendor_id": "VEN20250802143022",
  "em_id": "EM20250802143022"
}
```

## Update Chat Status
### PUT /api/chats/{chat_id}
```json
{
  "chat_status": "blocked",
  "em_id": "EM20250802143023"
}
```

## Add Pinned Message
### POST /api/chats/{chat_id}/pin-message
```json
{
  "message_id": "60d5ecb74b24fb001f8b4567"
}
```

## Socket Events Test Data

### Join Chat Event
```javascript
socket.emit('join_chat', {
  chatId: 'CHAT20250802143022',
  userType: 'customer' // or 'vendor', 'em'
});
```

### Send Message Event
```javascript
socket.emit('send_message', {
  chatId: 'CHAT20250802143022',
  senderType: 'cus', // 'cus', 'ven', 'rm'
  content: 'Hello! I would like to book your catering service.',
  contentType: 'text', // 'text', 'image', 'video', 'pdf', 'file', 'approval_request'
  mediaUrl: null,
  parentId: null, // For replies
  parentContent: null,
  parentSenderType: null,
  clientMessageId: 'client_msg_123'
}, (error) => {
  if (error) {
    console.error('Message send failed:', error);
  } else {
    console.log('Message sent successfully');
  }
});
```

### Send Image Message
```javascript
socket.emit('send_message', {
  chatId: 'CHAT20250802143022',
  senderType: 'cus',
  content: 'Here is the venue photo',
  contentType: 'image',
  mediaUrl: 'https://d1u34m45xfa3ar.cloudfront.net/images/venue123.jpg',
  parentId: null,
  parentContent: null,
  parentSenderType: null,
  clientMessageId: 'client_msg_124'
});
```

### Reply to Message
```javascript
socket.emit('send_message', {
  chatId: 'CHAT20250802143022',
  senderType: 'ven',
  content: 'Thank you for your interest! We can definitely help with that.',
  contentType: 'text',
  mediaUrl: null,
  parentId: '60d5ecb74b24fb001f8b4567', // ID of message being replied to
  parentContent: 'Hello! I would like to book your catering service.',
  parentSenderType: 'cus',
  clientMessageId: 'client_msg_125'
});
```

## API Endpoints Test Cases

### Get Messages with Pagination
```bash
GET /api/chats/CHAT20250802143022/messages?cursor=60d5ecb74b24fb001f8b4567
```

### Search Messages
```bash
GET /api/chats/CHAT20250802143022/messages/search?q=booking
```

### Get Message Context
```bash
GET /api/chats/CHAT20250802143022/messages/60d5ecb74b24fb001f8b4567/context
```

### Block Chat
```bash
PATCH /api/chats/CHAT20250802143022/block
```

### Get Blocked Chats
```bash
GET /api/chats/blocked/list
```

### Get Pinned Messages
```bash
GET /api/chats/CHAT20250802143022/pinned-messages
```

## Sample Socket Listeners

### Listen for New Messages
```javascript
socket.on('new_message', (messageData) => {
  console.log('New message received:', messageData);
  // messageData contains:
  // - _id, chatId, senderType, content, contentType
  // - parentId, parentContent, parentSenderType
  // - mediaUrl, timestamp, clientMessageId
});
```

### Listen for Join Confirmation
```javascript
socket.on('joined', (message) => {
  console.log('Successfully joined chat:', message);
});
```

### Listen for Errors
```javascript
socket.on('error', (error) => {
  console.error('Chat error:', error);
});
```

## File Upload Test

### Upload Media for Chat
```bash
POST /api/chats/upload
Content-Type: multipart/form-data

# Form data:
file: [binary file data]
timestamp: 1722607822000
```

Response:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://d1u34m45xfa3ar.cloudfront.net/chat-media/file123.jpg?t=1722607822000",
    "contentType": "image",
    "originalName": "venue-photo.jpg"
  }
}
```

## Customer Notifications Integration

### Create Notification for Chat Message
```json
{
  "customer_id": "CUST20250802143022",
  "chat_id": "CHAT20250802143022",
  "service_id": "CAT20250802143022",
  "message": "You have a new message from your caterer",
  "read": false
}
```

## Error Scenarios

### Blocked Chat Message Attempt
```javascript
// When trying to send message to blocked chat
socket.emit('send_message', { /* message data */ }, (error) => {
  // error will be: "This chat is blocked. You cannot send messages."
});
```

### Profanity/Personal Info Detection
```javascript
// Message with phone number
socket.emit('send_message', {
  chatId: 'CHAT20250802143022',
  senderType: 'cus',
  content: 'Call me at 9876543210',
  contentType: 'text'
}, (error) => {
  // error will be: "Please refrain from sharing personal information!"
});
```

### Invalid Chat ID
```javascript
socket.emit('send_message', {
  chatId: 'INVALID_CHAT_ID',
  senderType: 'cus',
  content: 'Hello',
  contentType: 'text'
}, (error) => {
  // error will be: "Invalid chatId"
});
```
