# Frontend Alignment Prompt: Anonymous Chat Configuration

**Objective:**
Align the frontend implementation with the updated backend logic for Anonymous Chat to prevent bot loops and ensure session continuity.

**Backend Logic Update:**
The backend now prioritizes `chat_id` as the source of truth for identifying the chat session.
- **HTTP**: `POST /api/anon-chats/message` checks `req.body.chat_id`.
- **Socket**: `send_message` event uses `chat_id` to look up the `Chat` document and resolves the `anon_customer_id` from there.

**Requirements for Frontend:**

1.  **Chat ID Persistence (CRITICAL)**:
    - When a chat is initialized (or the first message is sent), the backend returns a `chat_id`.
    - The frontend **MUST** store this `chat_id` (e.g., in `localStorage` or a persistent store).
    - **ALL** subsequent messages (both HTTP and Socket) **MUST** include this `chat_id`.
    - *Verification*: Check that `chat_id` does NOT change between reloads or messages.

2.  **Socket Emission Structure**:
    Ensure the `send_message` event payload includes:
    ```javascript
    {
      chat_id: "CHAT...", // MUST be the persisted ID
      chat_type: "anon_customer-admin",
      sender: "anonymous_customer",
      sender_id: "ANON...", // Should match what was used to init, but backend relies on chat_id now
      message_content: "...",
      message_type: "text" // or "options", etc.
    }
    ```

3.  **HTTP Request Structure**:
    Ensure the `POST` body includes:
    ```javascript
    {
      chat_id: "CHAT...", // MUST be the persisted ID
      anon_customer_id: "ANON...",
      message_content: "...",
      // ... other fields
    }
    ```

4.  **Handling "New" Users**:
    - Only generate a new `anon_customer_id` if one does not exist in storage.
    - Only treat it as a "new chat" if no `chat_id` exists in storage.

**Why this matters:**
If the frontend sends a different `anon_customer_id` (or no `chat_id`) for a subsequent message, the backend might treat it as a new user, fail to find the existing "Processing" enquiry, and restart the "How soon is your event?" bot flow.
