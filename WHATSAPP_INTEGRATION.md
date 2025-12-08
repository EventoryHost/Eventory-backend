# WhatsApp Cloud API Integration

## 1. Environment Variables
Add the following variables to your `.env` file:

```env
WA_ACCESS_TOKEN=your_system_user_access_token
WA_PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_verify_token (default: EVENTORY1234)
```

## 2. API Routes

### Webhook
- **GET** `/api/webhook/whatsapp` - Used by Meta for verification.
- **POST** `/api/webhook/whatsapp` - Receives incoming messages.

### Messages
- **GET** `/api/whatsapp/messages` - Fetch all stored messages (sorted by newest first).
- **POST** `/api/whatsapp/send` - Send a message.
  - Body: `{ "to": "1234567890", "text": "Hello" }`

## 3. Deployment Steps

1.  **Pull the latest code** to your EC2 instance.
    ```bash
    git pull origin main
    ```

2.  **Install dependencies** (if any new ones were added, though we only used `axios` which was likely already there, but good practice).
    ```bash
    npm install
    ```

3.  **Update `.env` file** with the new variables.

4.  **Restart the server**.
    If you are using `pm2`:
    ```bash
    pm2 restart all
    ```
    Or if you have a specific process name:
    ```bash
    pm2 restart backend
    ```

## 4. Verification
- Configure the Webhook URL in your Meta App Dashboard to: `https://your-domain.com/api/webhook/whatsapp`
- Set the Verify Token to match `VERIFY_TOKEN` in your `.env`.
- Subscribe to `messages` field.

## 5. Moving to Production

The code is designed to work across environments (Dev/Staging/Prod) without modification. The behavior is controlled entirely by environment variables.

**Steps to go Live:**
1.  **Deploy Code**: Push this code to your production server.
2.  **Update Production `.env`**:
    - Set `WA_ACCESS_TOKEN` to your **Live** WhatsApp Business Token.
    - Set `WA_PHONE_NUMBER_ID` to your **Live** Phone Number ID.
    - Set `VERIFY_TOKEN` to a secure random string (do not use the default).
3.  **Update Meta Dashboard**:
    - Change the Webhook URL to your production domain (e.g., `https://api.eventory.in/api/webhook/whatsapp`).
    - Update the Verify Token to match your new production `VERIFY_TOKEN`.
