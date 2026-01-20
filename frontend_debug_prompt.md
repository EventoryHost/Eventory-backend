# Frontend Debug Prompt for Anonymous Chat Bot Loop

**Context:**
The backend has been updated to be robust against inconsistent `sender_id`s by looking up the `anon_customer_id` directly from the `Chat` model using the `chat_id`. We also added checks to prevent the bot from looping if an enquiry is already in `PROCESSING` state. However, the "How soon is your event?" loop is still persisting.

**Hypothesis:**
The issue might be that the **`chat_id` is changing** or not being persisted correctly on the frontend. If the frontend generates a new `chat_id` for every message (or loses the old one), the backend sees it as a brand new conversation, finds no existing enquiry for that new chat/user context, and restarts the bot flow.

**Request to Frontend Agent:**
Please investigate the `AnonymousChat` component and the socket integration. specifically:

1.  **Log the Socket Payload**: Add logging to the `send_message` emission.
    ```javascript
    console.log("Sending Message Payload:", {
      chat_id, // CRITICAL: Is this staying the same across messages?
      sender_id,
      message_content,
      chat_type
    });
    ```
2.  **Verify Chat ID Persistence**: Ensure that once a `chat_id` is assigned (either generated locally or received from backend), it is **stored** (e.g., in `localStorage` or React state) and **reused** for all subsequent messages.
    - *Check*: Does the `chat_id` change when the page reloads or when the user sends a second message?
3.  **Check for Multiple Chats**: Is it possible the frontend is creating multiple "Active" chats for the same user?
4.  **Incoming Messages**: Verify that the frontend is correctly receiving and rendering the bot's responses (`new_message` event). If the user doesn't see the "I'm working on it" message, they might keep typing, but the backend *should* handle that now (by ignoring free text in PROCESSING state).

**Backend Logic Reference:**
The backend uses `Chat.findOne({ chat_id })` to identify the user. If `chat_id` is stable, the backend *will* find the existing enquiry and stop the loop. If `chat_id` changes, the loop will continue.
